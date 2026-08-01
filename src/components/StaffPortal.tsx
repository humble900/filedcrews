import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueOfflineAction, flushOfflineQueue, getPendingOfflineActions } from "@/lib/offlineQueue";
import { usePermissions } from "@/hooks/usePermissions";
import { useTerminology } from "@/hooks/useTerminology";
import { useReputationEngine } from "@/hooks/useReputationEngine";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  MapPin,
  Download,
  LogOut,
  Smartphone,
  Check,
  ClipboardList,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Settings,
  Calendar,
  X,
  Camera,
  User,
  Building2,
  ChevronDown,
  WifiOff,
  Briefcase,
  Package,
  Bold,
  Italic,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import TaskPhotoUpload from "./TaskPhotoUpload";
import TaskMultiplePhotoUpload from "./TaskMultiplePhotoUpload";
import DocumentScanner from "./DocumentScanner";
import InteractiveSpreadsheet from "./InteractiveSpreadsheet";
import { AICopilotButton } from "./AICopilotButton";
import { EquipmentScanner } from "./EquipmentScanner";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface StaffProfile {
  id: string;
  username: string;
  full_name: string;
  company_id: string;
  is_active: boolean;
  photo_url?: string | null;
  bank_name?: string | null;
  routing_number?: string | null;
  account_number?: string | null;
  hourly_rate?: number | null;
  global_role?: string | null;
}

interface Company {
  id: string;
  name: string;
  prefix: string;
  currency?: string | null;
}

interface StaffPortalProps {
  staffProfile: StaffProfile;
  company: Company | null;
  onSignOut: () => void;
}

type MobileTab = "tasks" | "docs" | "shifts" | "settings";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StaffPortal({ staffProfile, company, onSignOut }: StaffPortalProps) {
  const { isTrialExpired } = useAuth();
  const queryClient = useQueryClient();
  const apkDownloadUrl = "/downloads/Ocrem.apk";
  const { processJobCompletion } = useReputationEngine(staffProfile.company_id);

  const [activeTab, setActiveTab] = useState<MobileTab>("tasks");
  const [docSubTab, setDocSubTab] = useState<"files" | "reports">("files");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Task detail sheet state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [isJobContextExpanded, setIsJobContextExpanded] = useState(false);

  // PIN Lock state
  const [isPinLocked, setIsPinLocked] = useState(() => {
    return !!localStorage.getItem("onsite_pin_hash");
  });
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [tempPin, setTempPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isAppLocked, setIsAppLocked] = useState(() => {
    return !!localStorage.getItem("onsite_pin_hash");
  });

  // Incident/Field report state
  const [showIncidentReport, setShowIncidentReport] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentType, setIncidentType] = useState("Daily Progress Report");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("medium");
  const [incidentProject, setIncidentProject] = useState("");
  const [incidentAttachments, setIncidentAttachments] = useState<string[]>([]);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [isUploadingIncidentAttachment, setIsUploadingIncidentAttachment] = useState(false);

  // Decline task/shift state
  const [declineTarget, setDeclineTarget] = useState<{ type: "task" | "shift"; id: string; name: string } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);

  // Settings: password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings: payment details
  const [bankName, setBankName] = useState(staffProfile.bank_name || "");
  const [routingNumber, setRoutingNumber] = useState(staffProfile.routing_number || "");
  const [accountNumber, setAccountNumber] = useState(staffProfile.account_number || "");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Settings: avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Offline states
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<{ taskId: string; payload: any; taskTitle: string }[]>(() => {
    try {
      const saved = localStorage.getItem("onsite_offline_queue");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync offline queue to localStorage
  // ── Data Queries ──────────────────────────────────────────────────

  // Fetch active form templates
  const { data: formTemplates = [] } = useQuery({
    queryKey: ["active_form_templates", staffProfile.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("company_id", staffProfile.company_id);
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        schema: Array.isArray(t.schema) ? t.schema : []
      }));
    }
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["staff_tasks", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          job:jobs(
            id,
            title,
            description,
            project_id,
            project:projects(id, name, address, latitude, longitude),
            job_equipment(
              id,
              notes,
              asset:assets(id, name, serial_number, make, model, equipment_type)
            )
          )
        `)
        .eq("assignee_id", staffProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["staff_assignments", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_assignments")
        .select(`id, project_id, project:projects(id, name, ref_number)`)
        .eq("staff_id", staffProfile.id);
      if (error) throw error;
      const list = data || [];
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].project_id);
      }
      return list;
    },
  });

  const { data: latestCheckIn } = useQuery({
    queryKey: ["staff_latest_checkin", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofence_events")
        .select(`id, event_type, created_at, geofence:geofences(name)`)
        .eq("staff_id", staffProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ["staff_project_docs", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("project_documents")
        .select(`*, uploader:staff_profiles(full_name)`)
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  // Fetch field crew's shifts
  const { data: myShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["staff_shifts", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select(`
          *,
          geofence:geofences(id, name, latitude, longitude, radius_meters),
          job:jobs(
            id,
            title,
            project:projects(id, name, address)
          )
        `)
        .eq("staff_id", staffProfile.id)
        .gte("shift_date", new Date().toISOString().split("T")[0])
        .order("shift_date", { ascending: true })
        .limit(14);
      if (error) return [];
      return data || [];
    },
  });

  const todayShift = myShifts.find((shift: any) => {
    const shiftDate = new Date((shift.shift_date || "") + "T00:00:00");
    return new Date().toDateString() === shiftDate.toDateString();
  });

  // Fetch timesheet entries for payroll calculations
  const { data: timesheets = [], isLoading: timesheetsLoading } = useQuery({
    queryKey: ["staff_timesheets", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheet_entries")
        .select("*")
        .eq("staff_id", staffProfile.id)
        .order("start_time", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  // Fetch payment details on demand (only when on settings tab)
  const { data: paymentDetails } = useQuery({
    queryKey: ["staff_payment_details", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("bank_name, routing_number, account_number")
        .eq("id", staffProfile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "settings",
  });

  useEffect(() => {
    if (paymentDetails) {
      setBankName(paymentDetails.bank_name || "");
      setRoutingNumber(paymentDetails.routing_number || "");
      setAccountNumber(paymentDetails.account_number || "");
    }
  }, [paymentDetails]);

  // Fetch incident/field reports submitted by the crew member
  const { data: incidentReports = [], isLoading: incidentsLoading, refetch: refetchIncidents } = useQuery({
    queryKey: ["staff_incident_reports", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_reports")
        .select("*, project:projects(id, name, ref_number)")
        .eq("reporter_id", staffProfile.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });
  useEffect(() => {
    try {
      localStorage.setItem("onsite_offline_queue", JSON.stringify(offlineQueue));
    } catch (e) {
      console.warn("Failed to save offline queue to localStorage:", e);
    }
  }, [offlineQueue]);

  // Network connection listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      toast.success("Connection restored! Syncing offline updates.");
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
      toast.info("Connection lost. Working in offline mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOfflineMode(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Trigger sync automatically when online
  useEffect(() => {
    if (!isOfflineMode && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOfflineMode]);

  // Face verification modal states
  const [activeFaceVerification, setActiveFaceVerification] = useState<{
    eventId: string;
    geofenceName: string;
  } | null>(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerifyPhoto, setFaceVerifyPhoto] = useState<string | null>(null);
  const [faceVerifyResult, setFaceVerifyResult] = useState<{
    match: boolean;
    confidence?: string;
    error?: string;
  } | null>(null);

  // Close task sheet on back button
  useEffect(() => {
    const handleBack = (e: PopStateEvent) => {
      if (selectedTask) {
        e.preventDefault();
        setSelectedTask(null);
      }
    };
    if (selectedTask) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handleBack);
    }
    return () => window.removeEventListener("popstate", handleBack);
  }, [selectedTask]);


  const updateLocationClientSide = async (latitude: number, longitude: number, accuracy: number | null) => {
    try {
      // 1. Upsert latest location to staff_locations
      const { error: locError } = await supabase
        .from("staff_locations")
        .upsert({
          staff_id: staffProfile.id,
          latitude,
          longitude,
          accuracy: accuracy || null,
          updated_at: new Date().toISOString(),
        });
      if (locError) throw locError;

      // 2. Insert into location history
      const { error: histError } = await supabase
        .from("staff_location_history")
        .insert({
          staff_id: staffProfile.id,
          latitude,
          longitude,
          accuracy: accuracy || null,
        });
      if (histError) throw histError;

      // 3. Geofence detection (same logic as edge function)
      const { data: geofences } = await supabase
        .from("geofences")
        .select("id, name, latitude, longitude, radius_meters, ask_for_face_id")
        .eq("company_id", staffProfile.company_id)
        .eq("is_active", true);

      if (geofences && geofences.length > 0) {
        for (const gf of geofences) {
          const dist = haversineMeters(latitude, longitude, gf.latitude, gf.longitude);
          const isInside = dist <= (gf.radius_meters || 100);

          // Get last event for this staff+geofence
          const { data: lastEvent } = await supabase
            .from("geofence_events")
            .select("event_type, created_at")
            .eq("geofence_id", gf.id)
            .eq("staff_id", staffProfile.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let eventType: string | null = null;

          if (!lastEvent) {
            // First signal for this staff+geofence
            eventType = isInside ? "logged_in_inside" : "logged_in_outside";
          } else {
            const lastIsInside = ["inside", "entered", "logged_in", "logged_in_inside"].includes(lastEvent.event_type);
            const lastTime = new Date(lastEvent.created_at);
            const nowDate = new Date();
            
            // Check if last event was on a different day
            const isDifferentDay = lastTime.toDateString() !== nowDate.toDateString();

            if (isDifferentDay) {
              eventType = isInside ? "logged_in_inside" : "logged_in_outside";
            } else if (isInside && !lastIsInside) {
              eventType = "entered";
            } else if (!isInside && lastIsInside) {
              eventType = "exited";
            }
          }

          if (eventType) {
            const isEntryEvent = eventType === "entered" || eventType === "logged_in_inside";
            const shouldRequestFace = isEntryEvent && gf.ask_for_face_id === true;

            const { data: insertedEvent } = await supabase
              .from("geofence_events")
              .insert({
                geofence_id: gf.id,
                staff_id: staffProfile.id,
                event_type: eventType,
                face_check_status: shouldRequestFace ? "requested" : "not_requested",
              })
              .select("id")
              .single();

            if (shouldRequestFace && insertedEvent) {
              setActiveFaceVerification({
                eventId: insertedEvent.id,
                geofenceName: gf.name || "Gated Zone",
              });
              setFaceVerifyPhoto(null);
              setFaceVerifyResult(null);
            }
          }
        }
      }

      // Invalidate relevant react-query cache keys
      queryClient.invalidateQueries({ queryKey: ["staff_latest_checkin", staffProfile.id] });
      queryClient.invalidateQueries({ queryKey: ["staff_profiles", staffProfile.company_id] });
    } catch (err) {
      console.warn("Failed to update location client-side:", err);
    }
  };

  // Automatic Real-time Geolocation tracking (client-side update fallback)
  useEffect(() => {
    if (isOfflineMode || !staffProfile?.id) return;

    let activeWatchId: number | null = null;

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      await updateLocationClientSide(latitude, longitude, accuracy);
    };

    const handleLocationError = async (err: any) => {
      console.warn("Initial portal location update failed (browser blocked GPS):", err.message);
      toast.error("Location access is required for check-in and geofencing. Please enable GPS.");
    };

    if (navigator.geolocation) {
      // First update immediately
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleLocationError,
        { enableHighAccuracy: true }
      );

      // Periodically update location whenever it changes
      activeWatchId = navigator.geolocation.watchPosition(
        updateLocation,
        (err) => console.warn("Watch position update failed:", err.message),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      handleLocationError(new Error("Geolocation not supported"));
    }

    return () => {
      if (activeWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(activeWatchId);
      }
    };
  }, [isOfflineMode, staffProfile?.id, tasks, todayShift]);

  // Listen for native online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      // We don't call syncOfflineQueue directly here because we need the latest state,
      // but the toggleOfflineMode or useEffect on offlineQueue can handle it.
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
      toast.warning("You are offline. Changes will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync IndexedDB offline queue when network is restored
  useEffect(() => {
    const handleOnline = async () => {
      setIsOfflineMode(false);
      const { successCount } = await flushOfflineQueue();
      if (successCount > 0) {
        toast.success(`Network restored! Auto-synced ${successCount} offline updates.`);
        queryClient.invalidateQueries({ queryKey: ["staff_tasks"] });
      }
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
      toast.warning("Network connection lost. Operating in offline mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  const handleUpdateTask = async (taskId: string, payload: any, taskTitle: string) => {
    if (isOfflineMode) {
      await enqueueOfflineAction("UPDATE_TASK_STATUS", { taskId, status: payload.status });
      toast.warning(`Saved offline: queued update for "${taskTitle}" in local IndexedDB.`);
    } else {
      updateTaskMutation.mutate({ taskId, payload });
    }
  };



  const timesheetSummary = useMemo(() => {
    let totalMinutes = 0;
    let approvedMinutes = 0;
    let pendingMinutes = 0;
    let rejectedMinutes = 0;

    timesheets.forEach((entry: any) => {
      const dur = Number(entry.duration_minutes || 0);
      totalMinutes += dur;
      if (entry.approval_status === "approved") {
        approvedMinutes += dur;
      } else if (entry.approval_status === "pending") {
        pendingMinutes += dur;
      } else if (entry.approval_status === "rejected") {
        rejectedMinutes += dur;
      }
    });

    const totalHours = totalMinutes / 60;
    const approvedHours = approvedMinutes / 60;
    const pendingHours = pendingMinutes / 60;
    const rejectedHours = rejectedMinutes / 60;
    const rate = Number(staffProfile.hourly_rate || 0);
    const earnings = approvedHours * rate;

    return {
      totalHours: totalHours.toFixed(1),
      approvedHours: approvedHours.toFixed(1),
      pendingHours: pendingHours.toFixed(1),
      rejectedHours: rejectedHours.toFixed(1),
      hourlyRate: rate.toFixed(2),
      earnings: earnings.toFixed(2),
      raw: {
        totalHours,
        approvedHours,
        pendingHours,
        rejectedHours
      }
    };
  }, [timesheets, staffProfile.hourly_rate]);

  // ── Mutations ──────────────────────────────────────────────────

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: any }) => {
      const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
      if (error) throw error;

      // Check if task is being completed and save checklist responses
      if (payload.status === "Completed") {
        for (const tpl of formTemplates) {
          const responseData = formResponses[tpl.id] || {};
          // Only insert if there's actual data filled out
          if (Object.keys(responseData).length > 0) {
            const { error: respErr } = await supabase.from("form_responses").insert({
              template_id: tpl.id,
              job_id: selectedTask?.job_id || selectedTask?.id,
              submitted_by: staffProfile.id,
              data: responseData
            });
            if (respErr) {
              console.error("Error saving form response:", respErr);
            }
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff_tasks", staffProfile.id] });
      toast.success("Task updated");
      // Reset form responses
      setFormResponses({});

      if (variables.payload.status === "Completed") {
        // Trigger Reputation Engine
        processJobCompletion(
          selectedTask?.job_id || selectedTask?.id,
          selectedTask?.customer_id || "fallback-customer",
          variables.payload.staff_notes || ""
        );
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to update task"),
  });

  const handleSaveSpreadsheet = async (csvContent: string) => {
    if (!selectedDoc) return;
    try {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const bucketName = "task-attachments";
      const urlParts = selectedDoc.file_url.split(`/public/${bucketName}/`);
      if (urlParts.length < 2) throw new Error("Invalid file URL pattern");
      const filePath = urlParts[1].split("?")[0];
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, { upsert: true, contentType: "text/csv" });
      if (error) throw error;
      toast.success("Spreadsheet saved successfully");
      refetchDocs();
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update spreadsheet");
    }
  };

  const handleFaceVerifySubmit = async () => {
    if (!activeFaceVerification || !faceVerifyPhoto) return;
    setIsVerifyingFace(true);
    setFaceVerifyResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("staff_submit_face_for_event", {
        body: {
          geofenceEventId: activeFaceVerification.eventId,
          comparisonPhoto: faceVerifyPhoto,
        },
      });

      if (error) throw error;

      if (data?.ok) {
        const isMatch = data.status === "verified";
        setFaceVerifyResult({
          match: isMatch,
          confidence: data.confidence,
        });

        if (isMatch) {
          toast.success("Face identity verified successfully!");
          setTimeout(() => {
            setActiveFaceVerification(null);
            setFaceVerifyPhoto(null);
            setFaceVerifyResult(null);
          }, 2000);
        } else {
          toast.error("Face mismatch. Verification rejected.");
        }
      }
    } catch (err: any) {
      console.error("Face verification error:", err);
      setFaceVerifyResult({
        match: false,
        error: err.message || "Failed to analyze photo.",
      });
      toast.error(err.message || "Verification API error.");
    } finally {
      setIsVerifyingFace(false);
    }
  };

  const openTaskDetails = (task: any) => {
    setSelectedTask(task);
    setTaskNotes(task.staff_notes || "");
    setBeforePhoto(task.before_photo_url || null);
    setAfterPhoto(task.after_photo_url || null);
    setBeforePhotos(task.before_photo_urls || []);
    setAfterPhotos(task.after_photo_urls || []);
  };

  // ── PIN Lock Handlers ──
  const hashPin = (pin: string) => btoa(pin + "_onsite_salt");

  const handlePinKeyPress = (digit: string) => {
    if (digit === "clear") {
      setPinInput("");
      setPinError("");
      return;
    }
    if (digit === "delete") {
      setPinInput(prev => prev.slice(0, -1));
      return;
    }
    const next = pinInput + digit;
    if (next.length > 4) return;
    setPinInput(next);

    if (next.length === 4) {
      if (showPinSetup) {
        if (pinStep === "enter") {
          setTempPin(next);
          setPinStep("confirm");
          setPinInput("");
        } else {
          if (next === tempPin) {
            localStorage.setItem("onsite_pin_hash", hashPin(next));
            setIsPinLocked(true);
            setShowPinSetup(false);
            setPinInput("");
            setPinStep("enter");
            setTempPin("");
            toast.success("4-digit PIN set successfully!");
          } else {
            setPinError("PINs don't match. Try again.");
            setPinStep("enter");
            setPinInput("");
            setTempPin("");
          }
        }
      } else if (isAppLocked) {
        const stored = localStorage.getItem("onsite_pin_hash");
        if (stored && hashPin(next) === stored) {
          setIsAppLocked(false);
          setPinInput("");
        } else {
          setPinError("Incorrect PIN");
          setPinInput("");
        }
      }
    }
  };

  const removePinLock = () => {
    localStorage.removeItem("onsite_pin_hash");
    setIsPinLocked(false);
    setIsAppLocked(false);
    toast.success("PIN lock removed");
  };

  // ── Incident/Field Report Handlers ──
  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById("incident-description-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = "";
    if (tag === "bold") {
      replacement = `**${selected || "bold text"}**`;
    } else if (tag === "italic") {
      replacement = `*${selected || "italic text"}*`;
    } else if (tag === "bullet") {
      replacement = `\n- ${selected || "list item"}`;
    } else if (tag === "warning") {
      replacement = `\n> [!IMPORTANT]\n> ${selected || "important warning text"}\n`;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setIncidentDescription(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleSubmitIncident = async () => {
    if (!incidentTitle.trim() || !incidentDescription.trim() || !incidentProject) {
      toast.error("Please fill in all required fields and select a project.");
      return;
    }
    setIsSubmittingIncident(true);
    try {
      const { error } = await supabase.from("incident_reports").insert({
        project_id: incidentProject,
        reporter_id: staffProfile.id,
        type: incidentType,
        description: `[${incidentTitle.trim()}] ${incidentDescription.trim()}`,
        severity: incidentSeverity,
        status: "Open",
        attachment_urls: incidentAttachments,
      });
      if (error) throw error;
      toast.success("Field report submitted successfully!");
      setShowIncidentReport(false);
      setIncidentTitle("");
      setIncidentDescription("");
      setIncidentType("Daily Progress Report");
      setIncidentSeverity("medium");
      setIncidentProject("");
      setIncidentAttachments([]);
      refetchIncidents();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  // ── Decline Task/Shift Handler ──
  const handleDecline = async () => {
    if (!declineTarget || !declineReason.trim()) return;
    setIsDeclining(true);
    try {
      if (declineTarget.type === "shift") {
        const { error } = await supabase
          .from("staff_shifts")
          .update({ status: "Declined", decline_reason: declineReason.trim() })
          .eq("id", declineTarget.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["staff_shifts", staffProfile.id] });
      } else {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "Declined", staff_notes: `DECLINED: ${declineReason.trim()}` })
          .eq("id", declineTarget.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["staff_tasks", staffProfile.id] });
      }
      toast.success(`${declineTarget.type === "shift" ? "Shift" : "Task"} declined.`);
      setDeclineTarget(null);
      setDeclineReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline");
    } finally {
      setIsDeclining(false);
    }
  };

  // ── Password Change Handler ──
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Payment Details Handler ──
  const handleSavePaymentDetails = async () => {
    setIsSavingPayment(true);
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({
          bank_name: bankName.trim() || null,
          routing_number: routingNumber.trim() || null,
          account_number: accountNumber.trim() || null,
        })
        .eq("id", staffProfile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["staff_payment_details", staffProfile.id] });
      toast.success("Payment details saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save payment details");
    } finally {
      setIsSavingPayment(false);
    }
  };

  // ── Avatar Upload Handler ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const filePath = `avatars/${staffProfile.id}_${Date.now()}.webp`;
      const { error: uploadErr } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      const { error: updateErr } = await supabase
        .from("staff_profiles")
        .update({ photo_url: urlData.publicUrl })
        .eq("id", staffProfile.id);
      if (updateErr) throw updateErr;

      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // ── Helpers ──────────────────────────────────────────────────

  const isChecklistCompleted = () => {
    for (const tpl of formTemplates) {
      if (tpl.is_required) {
        const responseData = formResponses[tpl.id] || {};
        for (const field of tpl.schema) {
          const val = responseData[field.label];
          if (field.type === "checkbox" && !val) {
            return false;
          }
          if (field.type !== "checkbox" && (val === undefined || val === null || String(val).trim() === "")) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const activeTasks = tasks.filter((t) => t.status === "In Progress");
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  const isOnSite =
    latestCheckIn &&
    (latestCheckIn.event_type.includes("inside") || latestCheckIn.event_type === "entered");



  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "High": return "border-l-priority-high";
      case "Medium": return "border-l-priority-medium";
      default: return "border-l-priority-low";
    }
  };

  const getStatusBadge = (status: string, approval: string) => {
    if (status === "Completed") {
      if (approval === "Approved")
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">Approved</Badge>;
      if (approval === "Rejected")
        return <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[10px] font-bold">Rework</Badge>;
      return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px] font-bold">Under Review</Badge>;
    }
    if (status === "In Progress")
      return <Badge className="bg-indigo-500/15 text-indigo-600 border-indigo-500/30 text-[10px] font-bold">Active</Badge>;
    return <Badge className="bg-muted text-muted-foreground text-[10px] font-bold">Assigned</Badge>;
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
            <AlertTriangle className="h-8 w-8 text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-black text-foreground">Trial Period Expired</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your company's trial period for <strong>OnSite Crew Manager</strong> has ended. Please contact your company administrator to upgrade the account and resume access.
            </p>
          </div>
          <Button onClick={onSignOut} variant="outline" className="w-full max-w-[200px] border-border/60 hover:bg-muted font-bold text-xs gap-1.5 h-9">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      )}

      {!isTrialExpired && !staffProfile?.photo_url && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
            <Camera className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-black text-foreground">Profile Photo Required</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To activate your crew account and view assigned tasks, you must upload a profile photo. This photo will be visible to dispatchers on the live map and in the crew directory.
            </p>
          </div>
          <div className="w-full max-w-[280px] flex flex-col items-center gap-3">
            <input
              type="file"
              accept="image/*"
              capture="user"
              id="onboarding-avatar-input"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingAvatar(true);
                try {
                  const filePath = `avatars/${staffProfile.id}_${Date.now()}.webp`;
                  const { error: uploadErr } = await supabase.storage
                    .from("task-attachments")
                    .upload(filePath, file, { upsert: true, contentType: file.type });
                  if (uploadErr) throw uploadErr;

                  const { data: urlData } = supabase.storage
                    .from("task-attachments")
                    .getPublicUrl(filePath);

                  const { error: updateErr } = await supabase
                    .from("staff_profiles")
                    .update({ photo_url: urlData.publicUrl })
                    .eq("id", staffProfile.id);
                  if (updateErr) throw updateErr;

                  toast.success("Profile photo uploaded! Account activated.");
                  window.location.reload();
                } catch (err: any) {
                  toast.error(err.message || "Failed to upload photo");
                } finally {
                  setIsUploadingAvatar(false);
                }
              }}
              disabled={isUploadingAvatar}
            />
            <Button
              onClick={() => document.getElementById("onboarding-avatar-input")?.click()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                  Uploading Photo...
                </>
              ) : (
                <>
                  <Camera className="h-4.5 w-4.5 mr-2" />
                  Take Selfie Image
                </>
              )}
            </Button>
            <Button onClick={onSignOut} variant="ghost" className="w-full text-destructive hover:bg-destructive/5 font-bold h-9">
              <LogOut className="h-4 w-4 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>
      )}
      {/* ═══ STICKY GLASS HEADER ═══ */}
      <header className="glass-header sticky top-0 z-40 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar circle */}
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{staffProfile.full_name}</p>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Building2 className="h-2.5 w-2.5" />
                {company?.name || "Portal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isOfflineMode ? "destructive" : "outline"}
              className="h-7 text-[10px] font-bold gap-1 px-2 border-dashed pointer-events-none"
              size="sm"
            >
              {isOfflineMode ? <WifiOff className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {isOfflineMode ? "Offline" : "Online"}
            </Button>
            <img src="/favicon.png" alt="Ocrem" className="h-7 w-7 rounded-lg opacity-70" />
          </div>
        </div>

        {offlineQueue.length > 0 && (
          <div className="mx-4 mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-[10px] text-amber-500">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {offlineQueue.length} updates queued offline.
            </span>
            <Button
              size="xs"
              onClick={syncOfflineQueue}
              className="h-6 text-[9px] bg-amber-600 hover:bg-amber-700 text-white font-bold animate-pulse"
              disabled={isOfflineMode}
            >
              Sync Now
            </Button>
          </div>
        )}

        {/* Live Status Pill & Dev Simulator */}
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              isOnSite
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border/50"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isOnSite ? "bg-emerald-500 animate-pulse-dot" : "bg-muted-foreground/40"
              }`}
            />
            {isOnSite ? (
              <>On Site · {latestCheckIn?.geofence?.name || "Active Zone"}</>
            ) : latestCheckIn ? (
              <>Off Site · {latestCheckIn?.geofence?.name || "Last Zone"}</>
            ) : (
              <>No active shift tracked</>
            )}
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={async () => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    try {
                      await updateLocationClientSide(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
                      toast.success("Location updated successfully!");
                    } catch (e: any) {
                      toast.error(e.message || "Failed to sync check-in");
                    }
                  },
                  (err) => {
                    toast.error("Location access is required. Please enable GPS.");
                  },
                  { enableHighAccuracy: true }
                );
              } else {
                toast.error("Geolocation is not supported by your device");
              }
            }}
            className="h-7 text-[10px] gap-1 px-2 border-dashed bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold shadow-sm"
          >
            <MapPin className="h-3 w-3" /> Refresh Location
          </Button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT (scrollable, with bottom padding for nav) ═══ */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* ─── TASKS TAB ─── */}
        {activeTab === "tasks" && (
          <div className="px-4 py-4 space-y-5 animate-fade-in">
            {/* Today's Schedule Card */}
            {todayShift && (
              <div className="p-4 rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-card border-indigo-500/20 card-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                    <span className="font-bold text-xs text-indigo-500 uppercase tracking-wider">Today's Schedule</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isOnSite
                      ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                      : "bg-amber-500/15 text-amber-600 border border-amber-500/20"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isOnSite ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                    {isOnSite ? "On Site" : "Away"}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">
                    {todayShift.job?.title || "Shift Duties"} · {todayShift.geofence?.name || "Gated Site"}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {todayShift.check_in_time?.slice(0, 5)} – {todayShift.check_out_time?.slice(0, 5)}
                    </span>
                  </div>
                  {todayShift.job?.project?.address && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      {todayShift.job.project.address}
                    </p>
                  )}
                </div>
                {todayShift.job?.project?.address && (
                  <Button
                    size="sm"
                    className="w-full h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(todayShift.job.project.address)}`, "_blank");
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5" /> Navigate to Worksite
                  </Button>
                )}
              </div>
            )}

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Active", value: activeTasks.length, color: "text-indigo-600 bg-indigo-500/10" },
                { label: "Assigned", value: pendingTasks.length, color: "text-amber-600 bg-amber-500/10" },
                { label: "Done", value: completedTasks.length, color: "text-emerald-600 bg-emerald-500/10" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-base">No tasks assigned</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Your manager hasn't assigned any tasks yet. Check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Tasks */}
                {activeTasks.length > 0 && (
                  <TaskSection title="Active Now" count={activeTasks.length} tasks={activeTasks} />
                )}
                {pendingTasks.length > 0 && (
                  <TaskSection title="Assigned to Me" count={pendingTasks.length} tasks={pendingTasks} />
                )}
                {completedTasks.length > 0 && (
                  <TaskSection title="Completed" count={completedTasks.length} tasks={completedTasks} dimmed />
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── DOCUMENTS TAB ─── */}
        {activeTab === "docs" && (
          <div className="px-4 py-4 space-y-4 animate-fade-in">
            {/* Segmented Sub-tabs */}
            <div className="flex bg-muted p-1 rounded-xl">
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  docSubTab === "files" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setDocSubTab("files")}
              >
                Files Checklist
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  docSubTab === "reports" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setDocSubTab("reports")}
              >
                Field Reports
              </button>
            </div>

            {docSubTab === "files" ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Documents & Assets</h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1.5"
                      onClick={() => {
                        if (!selectedProjectId) {
                          toast.error("Select a project first");
                          return;
                        }
                        setScannerOpen(true);
                      }}
                      disabled={!selectedProjectId}
                    >
                      <Plus className="h-3.5 w-3.5" /> Scan Doc
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <EquipmentScanner onScanComplete={(data) => {
                    toast.success(`Scanned: ${data.make} ${data.model} - Asset saved.`);
                  }} />
                </div>

                {assignments.length > 0 ? (
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="w-full h-11 text-sm font-semibold">
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments.map((a: any) => (
                        <SelectItem key={a.project_id} value={a.project_id}>
                          {a.project?.name || "Project"} ({a.project?.ref_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 font-semibold text-center">
                    No active project assignments.
                  </div>
                )}

                {selectedProjectId && (
                  <>
                    {docsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-center space-y-2">
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-muted-foreground">No documents yet</p>
                        <p className="text-xs text-muted-foreground">Use "Scan" to add files.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-xl border bg-card card-elevated"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {doc.file_url.includes(".csv") ? (
                                <FileSpreadsheet className="h-8 w-8 text-emerald-600 shrink-0" />
                              ) : (
                                <FileText className="h-8 w-8 text-primary shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{doc.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {doc.uploader?.full_name || "Manager"} · {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {doc.file_url.includes(".csv") ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs font-bold"
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setSheetOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              ) : (
                                <a href={doc.file_url} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                                    View <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Field Reports</h2>
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      setShowIncidentReport(true);
                      setIncidentTitle("");
                      setIncidentDescription("");
                      setIncidentType("Daily Progress Report");
                      setIncidentSeverity("medium");
                      setIncidentProject("");
                      setIncidentAttachments([]);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> File Report
                  </Button>
                </div>

                {incidentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                  </div>
                ) : incidentReports.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center space-y-2">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-muted-foreground">No reports filed yet</p>
                    <p className="text-xs text-muted-foreground">Submit safety logs or progress reports here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidentReports.map((rep: any) => (
                      <div key={rep.id} className="p-4 rounded-xl border bg-card card-elevated space-y-3 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-sm text-foreground leading-tight">{rep.title}</h3>
                            <p className="text-[10px] text-muted-foreground">
                              {rep.type} · {new Date(rep.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className={`text-[9px] font-bold px-2 py-0.5 ${
                              rep.severity === "high" || rep.severity === "critical"
                                ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                : rep.severity === "medium"
                                  ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            }`}>
                              {rep.severity}
                            </Badge>
                            <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[9px] font-bold px-2 py-0.5">
                              {rep.status}
                            </Badge>
                          </div>
                        </div>

                        {rep.project && (
                          <p className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {rep.project.name} ({rep.project.ref_number})
                          </p>
                        )}

                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
                          {rep.description}
                        </p>

                        {rep.attachment_urls && rep.attachment_urls.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-border/40">
                            <p className="text-[9px] font-bold uppercase text-muted-foreground">Attachments</p>
                            <div className="grid grid-cols-3 gap-2">
                              {rep.attachment_urls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative aspect-[4/3] rounded-lg border overflow-hidden bg-muted flex items-center justify-center group"
                                >
                                  <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── SHIFTS TAB ─── */}
        {activeTab === "shifts" && (
          <div className="px-4 py-4 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold">My Shifts</h2>

            {/* Worked Hours & Earnings Payroll Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border bg-card card-elevated flex flex-col justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gross Earnings</span>
                <div>
                  <p className="text-xl font-black text-emerald-500 mt-2">
                    {company?.currency || "$"}{timesheetSummary.earnings}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                    Based on {timesheetSummary.approvedHours} approved hrs
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Approved", value: `${timesheetSummary.approvedHours}h`, color: "text-emerald-500 bg-emerald-500/10" },
                  { label: "Pending", value: `${timesheetSummary.pendingHours}h`, color: "text-amber-500 bg-amber-500/10" },
                  { label: "Total Hours", value: `${timesheetSummary.totalHours}h`, color: "text-slate-300 bg-slate-500/10" },
                  { label: "Rate", value: `${company?.currency || "$"}${timesheetSummary.hourlyRate}/h`, color: "text-indigo-500 bg-indigo-500/10" },
                ].map((stat) => (
                  <div key={stat.label} className={`p-2 rounded-xl text-center flex flex-col justify-center ${stat.color}`}>
                    <p className="text-xs font-black">{stat.value}</p>
                    <p className="text-[9px] font-semibold text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharts Donut Allocation Chart */}
            {timesheets.length > 0 && (
              <div className="p-4 rounded-2xl border bg-card card-elevated space-y-3">
                {(() => {
                  const donutData = [
                    { name: "Approved", value: timesheetSummary.raw.approvedHours, color: "#10b981" },
                    { name: "Pending", value: timesheetSummary.raw.pendingHours, color: "#f59e0b" },
                    { name: "Rejected", value: timesheetSummary.raw.rejectedHours, color: "#f43f5e" },
                  ].filter(d => d.value > 0);

                  if (donutData.length === 0) {
                    return (
                      <p className="text-[10px] text-center text-muted-foreground py-2 font-medium">
                        No logged timesheet hours to display chart.
                      </p>
                    );
                  }

                  return (
                    <div className="flex items-center justify-between">
                      <div className="w-[100px] h-[100px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={42}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {donutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5 pl-6">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Timesheet Allocation</p>
                        {donutData.map((d) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                              <span className="font-semibold text-slate-300">{d.name}</span>
                            </div>
                            <span className="font-mono text-muted-foreground font-semibold">{d.value.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {shiftsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : myShifts.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-base">No upcoming shifts</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Your manager hasn't scheduled shifts for you yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myShifts.map((shift: any) => {
                  const shiftDate = new Date((shift.shift_date || "") + "T00:00:00");
                  const isToday = new Date().toDateString() === shiftDate.toDateString();
                  return (
                    <div
                      key={shift.id}
                      className={`p-4 rounded-xl border card-elevated ${
                        shift.status === "Declined" ? "opacity-50 bg-muted/30" : isToday ? "bg-primary/5 border-primary/20" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">
                              {isToday ? "Today" : format(shiftDate, "EEE, MMM d")}
                            </p>
                            {isToday && (
                              <Badge className="bg-primary/15 text-primary text-[10px] font-bold">Today</Badge>
                            )}
                            {shift.status === "Declined" && (
                              <Badge className="bg-rose-500/15 text-rose-600 text-[10px] font-bold">Declined</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(shift.check_in_time || "").slice(0, 5)} – {(shift.check_out_time || "").slice(0, 5)}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 justify-end">
                            <MapPin className="h-3 w-3" />
                            {shift.geofence?.name || "Unassigned"}
                          </p>
                          {shift.job?.project?.address && (
                            <button
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shift.job.project.address)}`, "_blank")}
                            >
                              Directions ↗
                            </button>
                          )}
                        </div>
                      </div>
                      {shift.status !== "Declined" && (
                        <button
                          className="mt-2 text-[10px] font-bold text-rose-500/70 hover:text-rose-500 transition-colors"
                          onClick={() => setDeclineTarget({
                            type: "shift",
                            id: shift.id,
                            name: `${isToday ? "Today" : format(shiftDate, "EEE, MMM d")} shift at ${shift.geofence?.name || "site"}`,
                          })}
                        >
                          Decline this shift
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeTab === "settings" && (
          <div className="px-4 py-4 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold">Settings</h2>

            {/* Profile Card with Avatar Upload */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
                    {staffProfile.photo_url ? (
                      <img src={staffProfile.photo_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <p className="font-bold text-sm">{staffProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">@{staffProfile.username}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Company</span>
                  <span className="font-bold">{company?.name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className={`font-bold ${staffProfile.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {staffProfile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <p className="font-bold text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" />
                Change Password
              </p>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 text-sm"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 text-sm"
                />
                <Button
                  className="w-full h-10 font-bold text-xs"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </div>
            </div>

            {/* Direct Deposit / Payment Details */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <p className="font-bold text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Direct Deposit Details
              </p>
              <p className="text-[10px] text-muted-foreground">Your bank details are shared securely with your employer for payroll processing.</p>
              <div className="space-y-2">
                <Input
                  placeholder="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-10 text-sm"
                />
                <Input
                  placeholder="Routing Number"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  className="h-10 text-sm"
                />
                <Input
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="h-10 text-sm"
                />
                <Button
                  className="w-full h-10 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSavePaymentDetails}
                  disabled={isSavingPayment}
                >
                  {isSavingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Payment Details
                </Button>
              </div>
            </div>

            {/* 4-Digit PIN Lock Toggle */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-500" />
                  App Lock PIN
                </p>
                {isPinLocked ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">Active</Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground text-[10px] font-bold">Disabled</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Secure your portal with a 4-digit PIN code that locks the app when you open it.
              </p>
              {isPinLocked ? (
                <Button variant="outline" className="w-full h-10 text-xs font-bold text-destructive" onClick={removePinLock}>
                  Remove PIN Lock
                </Button>
              ) : (
                <Button
                  className="w-full h-10 text-xs font-bold"
                  onClick={() => {
                    setShowPinSetup(true);
                    setPinInput("");
                    setPinStep("enter");
                    setTempPin("");
                    setPinError("");
                  }}
                >
                  Set Up PIN
                </Button>
              )}
            </div>

            {/* File Incident Report */}
            <Button
              variant="outline"
              className="w-full h-11 font-bold gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/5"
              onClick={() => setShowIncidentReport(true)}
            >
              <AlertTriangle className="h-4 w-4" />
              File Incident / Safety Report
            </Button>

            {/* PWA App Installation Guide */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="font-bold text-sm">Add App to Home Screen</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This app runs directly in your browser. Install it on your home screen for full-screen access and off-line support:
              </p>
              <div className="space-y-3 pt-1 border-t border-border/50">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">For Android (Chrome)</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tap the Chrome menu button (⋮) and select <strong className="text-slate-200">"Install app"</strong> or <strong className="text-slate-200">"Add to Home screen"</strong>.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">For iPhone (Safari)</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tap the Share button (box with up arrow) and select <strong className="text-slate-200">"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <Button
              variant="outline"
              className="w-full h-11 font-bold text-destructive border-destructive/20 hover:bg-destructive/5 gap-2"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </main>

      {/* ═══ TASK DETAIL SHEET (full-screen slide-up) ═══ */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
          {/* Sheet Header */}
          <div className="glass-header sticky top-0 z-10 safe-top">
            <div className="mobile-sheet-handle" />
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="space-y-0.5 min-w-0 flex-1 mr-3">
                <h3 className="font-bold text-base truncate">{selectedTask.name}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {selectedTask.job?.title || "General"} · {selectedTask.job?.project?.name || ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(selectedTask.status, selectedTask.approval_status)}
                <button
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                  onClick={() => setSelectedTask(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sheet Body */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4 space-y-5">
            {/* Rework Banner */}
            {selectedTask.status === "Completed" && selectedTask.approval_status === "Rejected" && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-rose-700">Rework Requested</p>
                  <p className="text-xs text-rose-600/90 mt-0.5">
                    "{selectedTask.manager_feedback || "Please review and resubmit."}"
                  </p>
                </div>
              </div>
            )}

            {/* Task Details */}
            {selectedTask.description && (
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Instructions
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{selectedTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Priority</p>
                <p className="font-bold text-sm mt-0.5">{selectedTask.priority}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Est. Hours</p>
                <p className="font-bold text-sm mt-0.5">{selectedTask.est_hours || "—"} hrs</p>
              </div>
            </div>

            {/* Collapsible Job Context & Equipment */}
            {(selectedTask.job?.description || (selectedTask.job?.job_equipment && selectedTask.job.job_equipment.length > 0)) && (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setIsJobContextExpanded(!isJobContextExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Context & Equipment</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isJobContextExpanded ? "rotate-180" : ""}`} />
                </button>
                {isJobContextExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border/40">
                    {selectedTask.job?.description && (
                      <div className="pt-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Job Description</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{selectedTask.job.description}</p>
                      </div>
                    )}
                    {selectedTask.job?.project?.address && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Worksite Address</p>
                        <button
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTask.job.project.address)}`, "_blank")}
                        >
                          <MapPin className="h-3 w-3" />
                          {selectedTask.job.project.address}
                        </button>
                      </div>
                    )}
                    {selectedTask.job?.job_equipment && selectedTask.job.job_equipment.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Assigned Equipment</p>
                        <div className="space-y-2">
                          {selectedTask.job.job_equipment.map((eq: any) => (
                            <div key={eq.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                              <Package className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{eq.asset?.name || "Unknown Asset"}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {[eq.asset?.make, eq.asset?.model].filter(Boolean).join(" · ") || "No specs"}
                                  {eq.asset?.serial_number && ` · S/N: ${eq.asset.serial_number}`}
                                </p>
                                {eq.notes && <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{eq.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Area */}
            {selectedTask.status === "Pending" ? (
              <div className="space-y-2">
                <Button
                  className="w-full font-bold h-12 text-base"
                  onClick={() =>
                    handleUpdateTask(selectedTask.id, { status: "In Progress" }, selectedTask.title)
                  }
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Start Task"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-bold h-10 text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/5"
                  onClick={() => setDeclineTarget({ type: "task", id: selectedTask.id, name: selectedTask.name })}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" /> Decline Task
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Verification Photos
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Before * (Up to 6)</label>
                    <TaskMultiplePhotoUpload
                      taskId={selectedTask.id}
                      type="before"
                      currentUrls={beforePhotos}
                      onPhotosUpdated={(urls) => {
                        setBeforePhotos(urls);
                        handleUpdateTask(
                          selectedTask.id,
                          {
                            before_photo_urls: urls,
                            before_photo_url: urls[0] || null
                          },
                          selectedTask.title
                        );
                      }}
                      disabled={selectedTask.status === "Completed" && selectedTask.approval_status === "Approved"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">After * (Up to 6)</label>
                    <TaskMultiplePhotoUpload
                      taskId={selectedTask.id}
                      type="after"
                      currentUrls={afterPhotos}
                      onPhotosUpdated={(urls) => {
                        setAfterPhotos(urls);
                        handleUpdateTask(
                          selectedTask.id,
                          {
                            after_photo_urls: urls,
                            after_photo_url: urls[0] || null
                          },
                          selectedTask.title
                        );
                      }}
                      disabled={selectedTask.status === "Completed" && selectedTask.approval_status === "Approved"}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes *</label>
                  <Textarea
                    placeholder="Report outcomes, tools used, or issues..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="min-h-[80px]"
                    disabled={selectedTask.status === "Completed" && selectedTask.approval_status === "Approved"}
                  />
                </div>

                {/* Checklist Section */}
                {formTemplates.length > 0 && (
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Required Compliance Checklists
                    </p>
                    {formTemplates.map((tpl) => (
                      <div key={tpl.id} className="p-3 border rounded-xl bg-muted/20 space-y-3">
                        <div className="font-bold text-xs text-foreground flex items-center justify-between">
                          <span>{tpl.name}</span>
                          {tpl.is_required && (
                            <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[8px] py-0 px-1 font-extrabold uppercase">Required</Badge>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
                        )}
                        <div className="space-y-2 pt-1">
                          {tpl.schema.map((field: any) => {
                            const responseData = formResponses[tpl.id] || {};
                            const value = responseData[field.label] ?? "";
                            return (
                              <div key={field.label} className="space-y-1">
                                {field.type === "checkbox" ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`${tpl.id}-${field.label}`}
                                      checked={!!value}
                                      onChange={(e) => {
                                        const updatedData = { ...responseData, [field.label]: e.target.checked };
                                        setFormResponses({ ...formResponses, [tpl.id]: updatedData });
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-primary"
                                    />
                                    <label htmlFor={`${tpl.id}-${field.label}`} className="text-xs text-slate-700 font-medium">
                                      {field.label}
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <label className="text-[10px] font-semibold text-muted-foreground block">{field.label}</label>
                                    <Input
                                      type={field.type === "number" ? "number" : "text"}
                                      placeholder={field.type === "number" ? "Enter numeric value" : "Enter answer"}
                                      value={value}
                                      onChange={(e) => {
                                        const val = field.type === "number" ? Number(e.target.value) : e.target.value;
                                        const updatedData = { ...responseData, [field.label]: val };
                                        setFormResponses({ ...formResponses, [tpl.id]: updatedData });
                                      }}
                                      className="text-xs h-9 bg-card text-foreground"
                                    />
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Submit Button */}
          {selectedTask.status !== "Pending" &&
            !(selectedTask.status === "Completed" && selectedTask.approval_status === "Approved") && (
              <div className="sticky bottom-0 p-4 glass-header safe-bottom border-t">
                <Button
                  className="w-full font-bold h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  disabled={
                    updateTaskMutation.isPending || 
                    (beforePhotos.length === 0 && !beforePhoto) || 
                    (afterPhotos.length === 0 && !afterPhoto) || 
                    !taskNotes.trim() || 
                    !isChecklistCompleted()
                  }
                  onClick={() =>
                    handleUpdateTask(selectedTask.id, {
                      status: "Completed",
                      approval_status: "Pending",
                      staff_notes: taskNotes.trim(),
                      completed_at: new Date().toISOString(),
                    }, selectedTask.title)
                  }
                >
                  {updateTaskMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            )}
        </div>
      )}

      {/* ═══ SPREADSHEET DIALOG ═══ */}
      {sheetOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-bold text-sm truncate">{selectedDoc.name}</h3>
            <button
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
              onClick={() => setSheetOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto scrollbar-hidden p-4">
            <InteractiveSpreadsheet
              fileUrl={`${selectedDoc.file_url}?v=${Date.now()}`}
              onSave={handleSaveSpreadsheet}
            />
          </div>
        </div>
      )}

      {/* ═══ DOCUMENT SCANNER ═══ */}
      <DocumentScanner
        projectId={selectedProjectId}
        onUploadSuccess={refetchDocs}
        open={scannerOpen}
        onOpenChange={setScannerOpen}
      />

      {/* ═══ BIOMETRIC FACE GATE DIALOG ═══ */}
      <Dialog open={!!activeFaceVerification} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden bg-background border-border" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-lg font-black text-foreground flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 text-indigo-500 animate-pulse" />
              Biometric Identity Check
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-center">
              Before checking in at <strong className="text-slate-200">{activeFaceVerification?.geofenceName}</strong>, please verify your identity by capturing a selfie.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {faceVerifyPhoto ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/80 aspect-[4/3] w-full max-w-[280px] bg-muted shadow-inner">
                <img src={faceVerifyPhoto} alt="Selfie preview" className="w-full h-full object-cover" />
                {!isVerifyingFace && !faceVerifyResult?.match && (
                  <button
                    onClick={() => setFaceVerifyPhoto(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  id="selfie-file-input"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setFaceVerifyPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <Button
                  onClick={() => document.getElementById("selfie-file-input")?.click()}
                  className="h-28 w-full max-w-[280px] border-2 border-dashed flex flex-col gap-2 rounded-2xl bg-muted/30 border-muted-foreground/30 hover:border-indigo-500/50 hover:bg-indigo-500/5 items-center justify-center"
                  variant="outline"
                >
                  <Camera className="h-8 w-8 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-300">Take Selfie Image</span>
                </Button>
              </div>
            )}

            {/* Results feedback */}
            {faceVerifyResult && (
              <div className={`p-3 rounded-xl border w-full max-w-[280px] text-center ${
                faceVerifyResult.match
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-600"
              }`}>
                <p className="text-xs font-black">
                  {faceVerifyResult.match ? "Verification Passed" : "Verification Failed"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {faceVerifyResult.match
                    ? `Match confidence: ${faceVerifyResult.confidence || "high"}`
                    : faceVerifyResult.error || "The selfie does not match the reference photo."}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center w-full pb-2">
            {faceVerifyPhoto && !faceVerifyResult?.match && (
              <Button
                onClick={handleFaceVerifySubmit}
                disabled={isVerifyingFace}
                className="w-full max-w-[280px] h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isVerifyingFace ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                    Analyzing Face...
                  </>
                ) : (
                  "Verify Identity"
                )}
              </Button>
            )}
            {faceVerifyResult && !faceVerifyResult.match && (
              <Button
                onClick={() => {
                  setFaceVerifyPhoto(null);
                  setFaceVerifyResult(null);
                }}
                className="w-full max-w-[280px]"
                variant="outline"
              >
                Try Again
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ APP PIN LOCK OVERLAY ═══ */}
      {isAppLocked && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">
            <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Settings className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="font-black text-lg">Enter PIN</h2>
              <p className="text-xs text-muted-foreground">Enter your 4-digit code to unlock</p>
            </div>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-4 w-4 rounded-full border-2 transition-all ${pinInput.length > i ? "bg-indigo-500 border-indigo-500 scale-110" : "border-muted-foreground/40"}`} />
              ))}
            </div>
            {pinError && <p className="text-xs text-rose-500 font-bold">{pinError}</p>}
            <div className="grid grid-cols-3 gap-3 w-full">
              {["1","2","3","4","5","6","7","8","9","clear","0","delete"].map((key) => (
                <button
                  key={key}
                  className={`h-14 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                    key === "clear" || key === "delete"
                      ? "bg-muted/50 text-muted-foreground text-xs"
                      : "bg-card border border-border hover:bg-muted/60 text-foreground"
                  }`}
                  onClick={() => handlePinKeyPress(key)}
                >
                  {key === "delete" ? "⌫" : key === "clear" ? "Clear" : key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PIN SETUP DIALOG ═══ */}
      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {pinStep === "enter" ? "Create 4-Digit PIN" : "Confirm Your PIN"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              {pinStep === "enter" ? "Choose a 4-digit security code" : "Re-enter the same PIN to confirm"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-4 w-4 rounded-full border-2 transition-all ${pinInput.length > i ? "bg-indigo-500 border-indigo-500 scale-110" : "border-muted-foreground/40"}`} />
              ))}
            </div>
            {pinError && <p className="text-xs text-rose-500 font-bold">{pinError}</p>}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[220px]">
              {["1","2","3","4","5","6","7","8","9","clear","0","delete"].map((key) => (
                <button
                  key={key}
                  className={`h-12 rounded-xl font-bold text-base transition-all active:scale-95 ${
                    key === "clear" || key === "delete"
                      ? "bg-muted/50 text-muted-foreground text-[10px]"
                      : "bg-card border border-border hover:bg-muted/60 text-foreground"
                  }`}
                  onClick={() => handlePinKeyPress(key)}
                >
                  {key === "delete" ? "⌫" : key === "clear" ? "Clear" : key}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ INCIDENT REPORT DIALOG ═══ */}
      <Dialog open={showIncidentReport} onOpenChange={setShowIncidentReport}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              File Field / Incident Report
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submit progress updates, safety logs, near misses, or tool damage reports directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Project Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Project *</label>
              {assignments.length > 0 ? (
                <Select value={incidentProject} onValueChange={setIncidentProject}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select project..." /></SelectTrigger>
                  <SelectContent>
                    {assignments.map((a: any) => (
                      <SelectItem key={a.project_id} value={a.project_id}>
                        {a.project?.name || "Project"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-rose-500 font-medium">You need an assigned project to file reports.</p>
              )}
            </div>

            {/* Report Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Report Type</label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily Progress Report">Daily Progress Report</SelectItem>
                  <SelectItem value="Safety Incident / Injury">Safety Incident / Injury</SelectItem>
                  <SelectItem value="Equipment Damage">Equipment Damage / Issue</SelectItem>
                  <SelectItem value="Near Miss Log">Near Miss Log</SelectItem>
                  <SelectItem value="Client Request / Change">Client Request / Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Report Title *</label>
              <Input
                placeholder="e.g. Completed foundation pour B"
                value={incidentTitle}
                onChange={(e) => setIncidentTitle(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Severity */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Severity Level</label>
              <Select value={incidentSeverity} onValueChange={setIncidentSeverity}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Standard Report)</SelectItem>
                  <SelectItem value="medium">Medium (Requires Review)</SelectItem>
                  <SelectItem value="high">High (Action Required)</SelectItem>
                  <SelectItem value="critical">Critical (Immediate Stop)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description Editor Toolbar & Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Description *</label>
                {/* Basic Customization Toolbar */}
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md border">
                  <button
                    type="button"
                    title="Bold"
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => insertFormatting("bold")}
                  >
                    <Bold className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Italic"
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => insertFormatting("italic")}
                  >
                    <Italic className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Bullet List"
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => insertFormatting("bullet")}
                  >
                    <List className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Alert Callout"
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => insertFormatting("warning")}
                  >
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  </button>
                </div>
              </div>
              <Textarea
                id="incident-description-textarea"
                placeholder="Write your details here... Use toolbar to add styling blocks."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="min-h-[120px] text-sm font-sans"
              />
            </div>

            {/* Snap & Upload Attachments */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Snap / Upload Files (Up to 3)</label>
              
              {/* Preview thumbnails */}
              {incidentAttachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {incidentAttachments.map((url, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden border aspect-[4/3] bg-muted">
                      <img src={url} alt="Incident preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setIncidentAttachments(prev => prev.filter((_, idx) => idx !== index))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload trigger button */}
              {incidentAttachments.length < 3 && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="incident-file-input"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingIncidentAttachment(true);
                      try {
                        const filePath = `incidents/${staffProfile.id}_${Date.now()}.webp`;
                        const { error: uploadErr } = await supabase.storage
                          .from("task-attachments")
                          .upload(filePath, file, { upsert: true, contentType: file.type });
                        if (uploadErr) throw uploadErr;

                        const { data: urlData } = supabase.storage
                          .from("task-attachments")
                          .getPublicUrl(filePath);

                        setIncidentAttachments(prev => [...prev, urlData.publicUrl]);
                        toast.success("Attachment file added.");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to upload file");
                      } finally {
                        setIsUploadingIncidentAttachment(false);
                      }
                    }}
                    disabled={isUploadingIncidentAttachment}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed h-10 text-xs font-semibold gap-1.5 flex items-center justify-center"
                    onClick={() => document.getElementById("incident-file-input")?.click()}
                    disabled={isUploadingIncidentAttachment}
                  >
                    {isUploadingIncidentAttachment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 text-indigo-500" />
                        Snap Photo / Choose File
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Button
              className="w-full h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
              onClick={handleSubmitIncident}
              disabled={isSubmittingIncident || isUploadingIncidentAttachment || !incidentTitle.trim() || !incidentDescription.trim() || !incidentProject}
            >
              {isSubmittingIncident ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Field Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DECLINE TASK / SHIFT DIALOG ═══ */}
      <Dialog open={!!declineTarget} onOpenChange={() => { setDeclineTarget(null); setDeclineReason(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2">
              <X className="h-5 w-5" />
              Decline {declineTarget?.type === "shift" ? "Shift" : "Task"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Declining <strong>{declineTarget?.name}</strong>. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Sick leave, scheduling conflict, equipment unavailable..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <Button
              className="w-full h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDecline}
              disabled={isDeclining || !declineReason.trim()}
            >
              {isDeclining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Decline
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ AI COPILOT ═══ */}
      {activeTab === "tasks" && (
        <div className="fixed bottom-24 right-4 z-40">
          <AICopilotButton 
            jobId={todayShift?.job?.id || ""} 
            onCopilotComplete={(data) => {

            }} 
          />
        </div>
      )}

      {/* ═══ BOTTOM NAVIGATION BAR ═══ */}
      {!selectedTask && !sheetOpen && (
        <nav className="bottom-nav glass-header border-t border-border/30">
          <div className="grid grid-cols-4 max-w-md mx-auto">
            {([
              { id: "tasks" as MobileTab, icon: ClipboardList, label: "Tasks", badge: activeTasks.length },
              { id: "docs" as MobileTab, icon: FileText, label: "Docs" },
              { id: "shifts" as MobileTab, icon: Calendar, label: "Shifts" },
              { id: "settings" as MobileTab, icon: Settings, label: "Settings" },
            ]).map((tab) => (
              <button
                key={tab.id}
                className={`bottom-nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="relative">
                  <tab.icon className="h-5 w-5" />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center px-0.5">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );

  // ── Task Section Component ──────────────────────────────────

  function TaskSection({
    title,
    count,
    tasks,
    dimmed,
  }: {
    title: string;
    count: number;
    tasks: any[];
    dimmed?: boolean;
  }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {title} ({count})
          </h3>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border bg-card card-elevated cursor-pointer active:scale-[0.98] transition-transform ${
                getPriorityBorder(task.priority)
              } ${dimmed ? "opacity-60" : ""}`}
              onClick={() => openTaskDetails(task)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-sm truncate ${dimmed ? "line-through text-muted-foreground" : ""}`}>
                      {task.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {task.job?.title || "General"} {task.job?.project?.name ? `· ${task.job.project.name}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(task.status, task.approval_status)}
                    {task.est_hours && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> ~{task.est_hours}h
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

