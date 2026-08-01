import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APIProvider, Map, useMap, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Building2,
  Briefcase,
  MapPin,
  Users,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Building,
  Calendar,
  Lock,
  Mail,
  Loader2,
  Share2,
  Send,
  MessageCircle,
  User,
  Eye,
  EyeOff,
  X,
  TrendingUp,
  ThermometerSnowflake,
  Wrench,
  Trees,
  Zap,
  Sparkles,
  ShieldAlert,
  Sun,
  Home,
  CheckCircle2,
  Hammer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SEO from "@/components/SEO";

// Local storage key for pre-auth sandbox setup
const SANDBOX_STORAGE_KEY = "ocrem_sandbox_onboarding";

// Standard Map styling constants
const CLEAN_MAP_ID = "f3ab175d00da0a6b6e36641d";

// Modern list of world currencies with symbol, name, and country flag
const currenciesList = [
  { code: "USD", name: "United States Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CN¥", flag: "🇨🇳" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪", flag: "🇮🇱" },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP$", flag: "🇨🇱" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$", flag: "🇨🇴" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", flag: "🇸🇦" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦" },
];

const getCurrencySymbol = (code: string) => {
  const matched = currenciesList.find(c => c.code === code);
  return matched ? matched.symbol : "$";
};

// Global country calling dial codes list
const countriesList = [
  { code: "US", name: "United States", dial_code: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial_code: "+1", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", dial_code: "+44", flag: "🇬🇧" },
  { code: "AU", name: "Australia", dial_code: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", dial_code: "+64", flag: "🇳🇿" },
  { code: "NG", name: "Nigeria", dial_code: "+234", flag: "🇳🇬" },
  { code: "IN", name: "India", dial_code: "+91", flag: "🇮🇳" },
  { code: "ZA", name: "South Africa", dial_code: "+27", flag: "🇿🇦" },
  { code: "DE", name: "Germany", dial_code: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial_code: "+33", flag: "🇫🇷" },
  { code: "ES", name: "Spain", dial_code: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italy", dial_code: "+39", flag: "🇮🇹" },
  { code: "BR", name: "Brazil", dial_code: "+55", flag: "🇧🇷" },
  { code: "JP", name: "Japan", dial_code: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China", dial_code: "+86", flag: "🇨🇳" },
  { code: "AE", name: "United Arab Emirates", dial_code: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial_code: "+966", flag: "🇸🇦" },
  { code: "MX", name: "Mexico", dial_code: "+52", flag: "🇲🇽" },
  { code: "SG", name: "Singapore", dial_code: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial_code: "+60", flag: "🇲🇾" },
  { code: "PH", name: "Philippines", dial_code: "+63", flag: "🇵🇭" },
  { code: "IE", name: "Ireland", dial_code: "+353", flag: "🇮🇪" },
  { code: "NL", name: "Netherlands", dial_code: "+31", flag: "🇳🇱" },
  { code: "CH", name: "Switzerland", dial_code: "+41", flag: "🇨🇭" },
  { code: "SE", name: "Sweden", dial_code: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dial_code: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dial_code: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dial_code: "+358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", dial_code: "+48", flag: "🇵🇱" },
  { code: "TR", name: "Turkey", dial_code: "+90", flag: "🇹🇷" },
];

const getFlagFromDialCode = (code: string) => {
  const normalized = code.replace(/[^0-9]/g, "");
  if (!normalized) return "🌐";
  const match = countriesList.find(c => c.dial_code.replace(/[^0-9]/g, "") === normalized);
  return match ? match.flag : "🌐";
};

// Custom Google Maps circular geofence component
interface MapCircleProps {
  center: google.maps.LatLngLiteral;
  radius: number;
}

function MapCircle({ center, radius }: MapCircleProps) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove old circle if exists
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Create the circle boundary overlay
    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      strokeColor: "#60a5fa",
      strokeOpacity: 0.7,
      strokeWeight: 2,
    });

    circleRef.current = circle;

    return () => {
      circle.setMap(null);
    };
  }, [map, center, radius]);

  return null;
}

interface MapHandlerProps {
  center: google.maps.LatLngLiteral;
}

function MapHandler({ center }: MapHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
  }, [map, center]);

  return null;
}

function ProjectSetupWizardContent({ apiKey }: { apiKey: string }) {
  const { user, company, loading, createCompany, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch signup_mode platform setting
  const { data: signupMode = "lite" } = useQuery({
    queryKey: ["platform_signup_mode_wizard"],
    queryFn: async () => {
      const { data: settingData, error: settingError } = await (supabase as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "signup_mode")
        .maybeSingle();
      if (settingError) throw settingError;
      return settingData?.value || "lite";
    }
  });

  // Fetch if user is a platform superadmin
  const { data: isSuperadmin = false, isLoading: loadingAdmin } = useQuery({
    queryKey: ["is_superadmin_wizard", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("platform_admins")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id
  });

  const [submittingApp, setSubmittingApp] = useState(false);
  const [appNotes, setAppNotes] = useState("");

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    setSubmittingApp(true);
    try {
      const generatedPrefix = computePrefix(companyName);
      const { error } = await (supabase as any)
        .from("companies")
        .insert({
          name: companyName.trim(),
          prefix: generatedPrefix,
          auth_user_id: user?.id,
          currency: "USD",
          industry: companyVertical,
          country: companyCountry,
          address: companyAddress.trim() || null,
          website: companyWebsite.trim() || null,
          staff_count: companyStaffCount.trim() || null,
          annual_revenue: companyAnnualRevenue.trim() || null,
          subscription_status: 'pending_approval',
          referred_by: localStorage.getItem("filedcrews_affiliate_code") || null
        });
      
      if (error) throw error;
      toast.success("Application submitted successfully!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
  };

  const computePrefix = (name: string) => {
    const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
    return clean.slice(0, 3).padEnd(3, "X");
  };

  const applyVerticalPresets = (val: string) => {
    setCompanyVertical(val);
    saveSandboxProgress({ companyVertical: val });

    if (val === "HVAC") {
      setProjectName("Furnace Installation & Smart Setup");
      setJobTitle("Heating System Testing & Air Sweep");
      setJobDescription("- Mount the furnace unit safely\n- Install smart Wi-Fi thermostat\n- Test duct pressure and record levels\n- Upload before/after photos of connections");
      saveSandboxProgress({
        projectName: "Furnace Installation & Smart Setup",
        jobTitle: "Heating System Testing & Air Sweep",
        jobDescription: "- Mount the furnace unit safely\n- Install smart Wi-Fi thermostat\n- Test duct pressure and record levels\n- Upload before/after photos of connections"
      });
    } else if (val === "Landscaping") {
      setProjectName("Irrigation & Turf Sod Installation");
      setJobTitle("Sprinkler Alignment & Turf Rolling");
      setJobDescription("- Map out sprinkler valve coordinates\n- Prep ground soil and roll grass turf\n- Verify flow pressure at main line valve\n- Upload photos of finished green lanes");
      saveSandboxProgress({
        projectName: "Irrigation & Turf Sod Installation",
        jobTitle: "Sprinkler Alignment & Turf Rolling",
        jobDescription: "- Map out sprinkler valve coordinates\n- Prep ground soil and roll grass turf\n- Verify flow pressure at main line valve\n- Upload photos of finished green lanes"
      });
    } else if (val === "Electrical") {
      setProjectName("EV Charging Station & Panel Upgrade");
      setJobTitle("Charger Panel Wiring & Load Balance");
      setJobDescription("- Install Level-2 EV charging station\n- Replace main breaker panels to 200A\n- Verify grounding resistance and label panels\n- Upload safety sign-off photo");
      saveSandboxProgress({
        projectName: "EV Charging Station & Panel Upgrade",
        jobTitle: "Charger Panel Wiring & Load Balance",
        jobDescription: "- Install Level-2 EV charging station\n- Replace main breaker panels to 200A\n- Verify grounding resistance and label panels\n- Upload safety sign-off photo"
      });
    } else if (val === "Plumbing") {
      setProjectName("Tankless Water Heater Installation");
      setJobTitle("Gas Line Extension & Heater Flush");
      setJobDescription("- Mount tankless heater to exterior wall\n- Connect gas lines and test for leaks\n- Install expansion valves and flush water lines\n- Upload before/after plumbing photos");
      saveSandboxProgress({
        projectName: "Tankless Water Heater Installation",
        jobTitle: "Gas Line Extension & Heater Flush",
        jobDescription: "- Mount tankless heater to exterior wall\n- Connect gas lines and test for leaks\n- Install expansion valves and flush water lines\n- Upload before/after plumbing photos"
      });
    } else if (val === "Cleaning") {
      setProjectName("Commercial Cleaning & Disinfection");
      setJobTitle("Deep Office Sanitation Sweep");
      setJobDescription("- Spray high-touch areas with medical sanitizer\n- HEPA vacuum carpets and mop tile rows\n- Clean ventilation covers and window seals\n- Upload post-cleaning photos for reports");
      saveSandboxProgress({
        projectName: "Commercial Cleaning & Disinfection",
        jobTitle: "Deep Office Sanitation Sweep",
        jobDescription: "- Spray high-touch areas with medical sanitizer\n- HEPA vacuum carpets and mop tile rows\n- Clean ventilation covers and window seals\n- Upload post-cleaning photos for reports"
      });
    } else if (val === "Security" || val === "Pest Control") {
      setProjectName("General Inspection & Service Setup");
      setJobTitle("Initial Site Sweep & Assessment");
      setJobDescription("- Perform walkaround check\n- Log safety markers\n- Upload check-off photo");
      saveSandboxProgress({
        projectName: "General Inspection & Service Setup",
        jobTitle: "Initial Site Sweep & Assessment",
        jobDescription: "- Perform walkaround check\n- Log safety markers\n- Upload check-off photo"
      });
    } else {
      setProjectName("");
      setJobTitle("");
      setJobDescription("");
      saveSandboxProgress({
        projectName: "",
        jobTitle: "",
        jobDescription: ""
      });
    }
  };

  // Wizard mode determination
  // Mode 1: "public-sandbox" (unauthenticated)
  // Mode 2: "onboarding-auth" (logged in, but no company created yet)
  // Mode 3: "new-project" (logged in admin creating a new project flow)
  const [wizardMode, setWizardMode] = useState<"public-sandbox" | "onboarding-auth" | "new-project">("public-sandbox");

  // Step state (1 to 7)
  // Step 1: Company Profile (Skipped in Mode 3)
  // Step 2: Customer & Project Details
  // Step 3: Worksite Geofencing Coordinates
  // Step 4: Crew Provisioning
  // Step 5: Work Order Scheduling
  // Step 6: Deploy Setup (Signup Form in Mode 1, Confirm action in Mode 2 & 3)
  // Step 7: Handover Details & QR Code
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Planned costs during project creation flow
  const [wizardPlannedCosts, setWizardPlannedCosts] = useState<{ category: string; title: string; budget_amount: number }[]>([]);
  const [newWizardCostCategory, setNewWizardCostCategory] = useState("");
  const [newWizardCostTitle, setNewWizardCostTitle] = useState("");
  const [newWizardCostBudget, setNewWizardCostBudget] = useState("");

  // Buffer state definitions
  const [companyName, setCompanyName] = useState("");
  const [companyPrefix, setCompanyPrefix] = useState("");
  const [companyVertical, setCompanyVertical] = useState<string>("General");
  const [companyCountry, setCompanyCountry] = useState<string>("US");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBillingAddress, setCustomerBillingAddress] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [contractValue, setContractValue] = useState("0");
  const [budgetLabourCost, setBudgetLabourCost] = useState("0");
  const [projectStatus, setProjectStatus] = useState("Planning");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");

  const [geofenceName, setGeofenceName] = useState("");
  const [geofenceAddress, setGeofenceAddress] = useState("");
  const [coords, setCoords] = useState<google.maps.LatLngLiteral>({ lat: 6.5244, lng: 3.3792 });
  const [radius, setRadius] = useState(200);

  const [staffName, setStaffName] = useState("");
  const [staffUsernameSuffix, setStaffUsernameSuffix] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  // Step 4 crew selection expansion
  const [crewMode, setCrewMode] = useState<"create" | "select">("create");
  const [existingStaff, setExistingStaff] = useState<{ id: string; username: string; full_name: string }[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobStart, setJobStart] = useState("");
  const [jobEnd, setJobEnd] = useState("");

  // New onboarding metadata fields
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyStaffCount, setCompanyStaffCount] = useState("");
  const [companyAnnualRevenue, setCompanyAnnualRevenue] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPhoneDialCode, setAdminPhoneDialCode] = useState("+1");
  const [adminPassword, setAdminPassword] = useState("");
  const [crewEmail, setCrewEmail] = useState("");
  const [crewPhone, setCrewPhone] = useState("");
  const [crewPhoneDialCode, setCrewPhoneDialCode] = useState("+1");
  const [introStep, setIntroStep] = useState(1); // 1 to 6 for clay-style card introduction
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCrewPassword, setShowCrewPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free_trial' | 'growth' | 'enterprise'>('free_trial');
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(true);

  // Signup fields (for Mode 1 Step 6)
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Currency and phone dial prefix states
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [phoneDialCode, setPhoneDialCode] = useState("+1");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [crewPhoneOpen, setCrewPhoneOpen] = useState(false);
  const [adminPhoneOpen, setAdminPhoneOpen] = useState(false);

  // Address Autocomplete references and instances
  const placesLibrary = useMapsLibrary("places");
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressAutocomplete, setAddressAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const companyAddressInputRef = useRef<HTMLInputElement>(null);
  const [companyAddressAutocomplete, setCompanyAddressAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const mapSearchInputRef = useRef<HTMLInputElement>(null);
  const [mapSearchAutocomplete, setMapSearchAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);



  // Synchronize state with DOM input values for Google Autocomplete compatibility
  useEffect(() => {
    if (companyAddressInputRef.current && companyAddressInputRef.current.value !== companyAddress) {
      companyAddressInputRef.current.value = companyAddress;
    }
  }, [companyAddress]);

  useEffect(() => {
    if (addressInputRef.current && addressInputRef.current.value !== customerBillingAddress) {
      addressInputRef.current.value = customerBillingAddress;
    }
  }, [customerBillingAddress]);

  // Address autocomplete for Company Headquarters Address (Intro Card Step 2)
  useEffect(() => {
    if (!placesLibrary || !companyAddressInputRef.current) return;

    const ac = new placesLibrary.Autocomplete(companyAddressInputRef.current, {
      fields: ["address_components", "formatted_address", "name"],
    });
    setCompanyAddressAutocomplete(ac);
  }, [placesLibrary, introStep]);

  useEffect(() => {
    if (!companyAddressAutocomplete) return;

    const listener = companyAddressAutocomplete.addListener("place_changed", () => {
      const place = companyAddressAutocomplete.getPlace();
      if (place.formatted_address) {
        setCompanyAddress(place.formatted_address);
        saveSandboxProgress({ companyAddress: place.formatted_address });
      }
    });

    return () => {
      listener.remove();
    };
  }, [companyAddressAutocomplete]);

  // Address autocomplete for Billing Address (Step 2)
  useEffect(() => {
    if (!placesLibrary || !addressInputRef.current) return;

    const ac = new placesLibrary.Autocomplete(addressInputRef.current, {
      fields: ["address_components", "formatted_address", "name"],
    });
    setAddressAutocomplete(ac);
  }, [placesLibrary, step]);

  useEffect(() => {
    if (!addressAutocomplete) return;

    const listener = addressAutocomplete.addListener("place_changed", () => {
      const place = addressAutocomplete.getPlace();
      if (place.formatted_address) {
        setCustomerBillingAddress(place.formatted_address);
        saveSandboxProgress({ customerBillingAddress: place.formatted_address });
      }
    });

    return () => {
      listener.remove();
    };
  }, [addressAutocomplete]);

  // Address autocomplete for Worksite Coordinates Map Search (Step 3)
  useEffect(() => {
    if (!placesLibrary || !mapSearchInputRef.current) return;

    const ac = new placesLibrary.Autocomplete(mapSearchInputRef.current, {
      fields: ["geometry", "formatted_address"],
    });
    setMapSearchAutocomplete(ac);
  }, [placesLibrary, step]);

  useEffect(() => {
    if (!mapSearchAutocomplete) return;

    const listener = mapSearchAutocomplete.addListener("place_changed", () => {
      const place = mapSearchAutocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCoords = { lat, lng };
        setCoords(newCoords);
        saveSandboxProgress({ coords: newCoords });
        if (place.formatted_address) {
          setGeofenceAddress(place.formatted_address);
          saveSandboxProgress({ geofenceAddress: place.formatted_address });
        }
      }
    });

    return () => {
      listener.remove();
    };
  }, [mapSearchAutocomplete]);

  // Sync state with local storage in sandbox mode
  useEffect(() => {
    if (loading) return;

    // Detect wizard mode
    if (!user) {
      setWizardMode("public-sandbox");
      // Load sandbox buffer
      try {
        const stored = localStorage.getItem(SANDBOX_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
           setCompanyName(parsed.companyName || "");
          setCompanyPrefix(parsed.companyPrefix || "");
          setCompanyAddress(parsed.companyAddress || "");
          setCompanyWebsite(parsed.companyWebsite || "");
          setCompanyStaffCount(parsed.companyStaffCount || "");
          setCompanyAnnualRevenue(parsed.companyAnnualRevenue || "");
          setAdminFirstName(parsed.adminFirstName || "");
          setAdminLastName(parsed.adminLastName || "");
          setAdminEmail(parsed.adminEmail || "");
          setAdminPhone(parsed.adminPhone || "");
          setAdminPhoneDialCode(parsed.adminPhoneDialCode || "+1");
          setAdminPassword(parsed.adminPassword || "");
          setCrewEmail(parsed.crewEmail || "");
          setCrewPhone(parsed.crewPhone || "");
          setCrewPhoneDialCode(parsed.crewPhoneDialCode || "+1");
          setIntroStep(parsed.introStep || 1);
          setCustomerName(parsed.customerName || "");
          setCustomerEmail(parsed.customerEmail || "");
          setCustomerPhone(parsed.customerPhone || "");
          setCustomerBillingAddress(parsed.customerBillingAddress || "");
          setProjectName(parsed.projectName || "");
          setProjectDescription(parsed.projectDescription || "");
          setContractValue(parsed.contractValue || "0");
          setBudgetLabourCost(parsed.budgetLabourCost || "0");
          setProjectStatus(parsed.projectStatus || "Planning");
          setProjectStartDate(parsed.projectStartDate || "");
          setProjectEndDate(parsed.projectEndDate || "");
          setGeofenceName(parsed.geofenceName || "");
          setGeofenceAddress(parsed.geofenceAddress || "");
          if (parsed.coords) setCoords(parsed.coords);
          setRadius(parsed.radius || 200);
          setStaffName(parsed.staffName || "");
          setStaffUsernameSuffix(parsed.staffUsernameSuffix || "");
          setStaffPassword(parsed.staffPassword || "");
          setJobTitle(parsed.jobTitle || "");
          setJobDescription(parsed.jobDescription || "");
          setJobStart(parsed.jobStart || "");
          setJobEnd(parsed.jobEnd || "");
          setCurrencyCode(parsed.currencyCode || "USD");
          setPhoneDialCode(parsed.phoneDialCode || "+1");
          setCompanyVertical(parsed.companyVertical || "General");
          setCompanyCountry(parsed.companyCountry || "US");
        }
      } catch (e) {
        console.error("Error parsing sandbox state", e);
      }
    } else if (!company) {
      setWizardMode("onboarding-auth");
      // Skip straight to step 1
      setStep(1);
    } else {
      setWizardMode("new-project");
      setCompanyPrefix(company.prefix);
      // Skip step 1 (Company profile already exists)
      setStep(2);
    }
  }, [user, company, loading]);

  // Persist changes to local storage in sandbox mode
  const saveSandboxProgress = (updatedFields: any) => {
    if (wizardMode !== "public-sandbox") return;
    try {
      const stored = localStorage.getItem(SANDBOX_STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const next = { ...current, ...updatedFields };
      localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Error writing sandbox state", e);
    }
  };

  // Load existing crew list in Step 4 if logged in
  useEffect(() => {
    if (user && company?.id && step === 4) {
      (async () => {
        const { data } = await supabase
          .from("staff_profiles")
          .select("id, username, full_name")
          .eq("company_id", company.id)
          .eq("is_active", true)
          .order("full_name", { ascending: true });
        if (data && data.length > 0) {
          setExistingStaff(data);
          setSelectedStaffId(data[0].id);
          setStaffName(data[0].full_name);
          const rawUser = data[0].username;
          const prefixVal = company.prefix.toUpperCase();
          if (rawUser.startsWith(prefixVal)) {
            setStaffUsernameSuffix(rawUser.substring(prefixVal.length).toLowerCase());
          } else {
            setStaffUsernameSuffix(rawUser.toLowerCase());
          }
        }
      })();
    }
  }, [user, company?.id, step]);

  // Attempt to geolocate the user's browser location on step 3 only if using default initial coordinates
  useEffect(() => {
    if (step === 3 && navigator.geolocation) {
      const isDefaultCoords = Math.abs(coords.lat - 6.5244) < 0.0001 && Math.abs(coords.lng - 3.3792) < 0.0001;
      if (isDefaultCoords) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(userCoords);
            saveSandboxProgress({ coords: userCoords });
          },
          () => {}
        );
      }
    }
  }, [step, coords.lat, coords.lng]);

  // Step field validations
  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!companyName.trim()) {
          toast.error("Company Name is required");
          return false;
        }
        if (companyPrefix.length !== 3 || !/^[A-Z]{3}$/.test(companyPrefix)) {
          toast.error("Prefix must be exactly 3 letters (A-Z)");
          return false;
        }
        return true;
      case 2:
        if (subStep === 1) {
          // Sub-step 1: Client Information only
          if (!customerName.trim()) {
            toast.error("Client Name is required");
            return false;
          }
          return true;
        }
        if (subStep === 2) {
          // Sub-step 2: Project Specifications
          if (!projectName.trim()) {
            toast.error("Project Title is required");
            return false;
          }
          return true;
        }
        // Sub-step 3: Planned Budgets & Cost Categories (Optional)
        return true;
      case 3:
        if (!geofenceName.trim()) {
          toast.error("Worksite Zone Name is required");
          return false;
        }
        return true;
      case 4:
        if (crewMode === "create") {
          if (!staffName.trim()) {
            toast.error("Crew Member Full Name is required");
            return false;
          }
          if (!staffUsernameSuffix.trim()) {
            toast.error("Crew Member Username is required");
            return false;
          }
          if (staffPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return false;
          }
        } else {
          if (!selectedStaffId) {
            toast.error("Please select an existing crew member");
            return false;
          }
        }
        return true;
      case 5:
        if (!jobTitle.trim()) {
          toast.error("Job Scope Title is required");
          return false;
        }
        if (!jobStart || !jobEnd) {
          toast.error("Scheduled Start and End times are required");
          return false;
        }
        if (new Date(jobStart) >= new Date(jobEnd)) {
          toast.error("Start time must be before end time");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 2) {
        if (subStep === 1) {
          setSubStep(2);
        } else if (subStep === 2) {
          setSubStep(3);
        } else {
          setSubStep(1);
          setStep(3);
        }
      } else {
        setStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      if (subStep === 3) {
        setSubStep(2);
      } else if (subStep === 2) {
        setSubStep(1);
      } else {
        setStep(1);
      }
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // Perform bulk inserts into Supabase
  const executeBulkInsert = async (userId: string, targetCompanyId?: string) => {
    let activeCompanyId = targetCompanyId;

    // 1. Create Company (if not exists)
    if (!activeCompanyId) {
      // Check if user already has a company created to prevent duplicate company creation
      const { data: existingComp } = await supabase
        .from("companies")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (existingComp) {
        activeCompanyId = existingComp.id;
      } else {
        const prefixToUse = companyPrefix.toUpperCase();
        const { data: existingPrefixComp } = await supabase
          .from("companies")
          .select("id")
          .eq("prefix", prefixToUse)
          .maybeSingle();

        if (existingPrefixComp) {
          throw new Error(`The prefix "${prefixToUse}" is already in use by another company. Please change your company prefix.`);
        }

        const { data: comp, error: compErr } = await (supabase as any)
          .from("companies")
          .insert({
            name: companyName.trim(),
            prefix: prefixToUse,
            auth_user_id: userId,
            currency: currencyCode,
            industry: companyVertical,
            country: companyCountry,
            address: companyAddress.trim() || null,
            website: companyWebsite.trim() || null,
            staff_count: companyStaffCount.trim() || null,
            annual_revenue: companyAnnualRevenue.trim() || null,
          })
          .select()
          .single();
        if (compErr) throw new Error(`Failed to create company profile: ${compErr.message}`);
        activeCompanyId = comp.id;
      }
    }

    // 2. Create or Reuse Customer
    let custId = null;
    const { data: existingCust } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", activeCompanyId)
      .eq("name", customerName.trim())
      .maybeSingle();

    if (existingCust) {
      custId = existingCust.id;
    } else {
      const { data: cust, error: custErr } = await supabase
        .from("customers")
        .insert({
          name: customerName.trim(),
          email: customerEmail.trim() || null,
          phone: customerPhone.trim() ? `${phoneDialCode} ${customerPhone.trim()}` : null,
          billing_address: customerBillingAddress.trim() || null,
          company_id: activeCompanyId,
        })
        .select()
        .single();
      if (custErr) throw new Error(`Failed to create customer: ${custErr.message}`);
      custId = cust.id;
    }

    // 3. Create or Reuse Project
    let projId = null;
    const { data: existingProj } = await supabase
      .from("projects")
      .select("id")
      .eq("company_id", activeCompanyId)
      .eq("name", projectName.trim())
      .maybeSingle();

    if (existingProj) {
      projId = existingProj.id;
    } else {
      const ref_number = `PRJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { data: proj, error: projErr } = await supabase
        .from("projects")
        .insert({
          name: projectName.trim(),
          ref_number,
          description: projectDescription.trim() || null,
          customer_id: custId,
          company_id: activeCompanyId,
          status: projectStatus,
          address: geofenceAddress.trim() || geofenceName.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          geofence_radius: radius,
          contract_value: parseFloat(contractValue) || 0,
          budget_labour_cost: parseFloat(budgetLabourCost) || 0,
          start_date: projectStartDate || null,
          end_date: projectEndDate || null,
        })
        .select()
        .single();
      if (projErr) throw new Error(`Failed to create project: ${projErr.message}`);
      projId = proj.id;

      // Insert custom project costs configured in step 2
      if (wizardPlannedCosts.length > 0) {
        const costsToInsert = wizardPlannedCosts.map(c => ({
          project_id: proj.id,
          company_id: activeCompanyId,
          category: c.category || "Other",
          title: c.title || "Custom Cost Line",
          budget_amount: Number(c.budget_amount) || 0.0,
          actual_amount: 0.0,
        }));
        const { error: costsErr } = await supabase
          .from("project_costs")
          .insert(costsToInsert);
        if (costsErr) throw new Error(`Failed to create project costs: ${costsErr.message}`);
      }
    }

    // 4. Create or Reuse Geofence
    let gfId = null;
    const { data: existingGf } = await supabase
      .from("geofences")
      .select("id")
      .eq("company_id", activeCompanyId)
      .eq("name", geofenceName.trim() || `${projectName.trim()} Zone`)
      .maybeSingle();

    if (existingGf) {
      gfId = existingGf.id;
    } else {
      const { data: gf, error: gfErr } = await supabase
        .from("geofences")
        .insert({
          name: geofenceName.trim() || `${projectName.trim()} Zone`,
          latitude: coords.lat,
          longitude: coords.lng,
          radius_meters: radius,
          company_id: activeCompanyId,
          is_active: true,
        })
        .select()
        .single();
      if (gfErr) throw new Error(`Failed to map geofence coordinates: ${gfErr.message}`);
      gfId = gf.id;
    }

    // 5. Provision Crew Profile or Use Selected
    let staffProfileId = null;
    if (crewMode === "create") {
      const fullUsername = (companyPrefix + staffUsernameSuffix).toUpperCase();

      // Check for duplicate username first to prevent duplicate errors on retry
      const { data: existingStaff } = await supabase
        .from("staff_profiles")
        .select("id, full_name")
        .eq("username", fullUsername)
        .maybeSingle();

      if (existingStaff) {
        // If the name matches, seamlessly reuse it. If not, it belongs to someone else.
        if (existingStaff.full_name.toLowerCase() === staffName.trim().toLowerCase()) {
          staffProfileId = existingStaff.id;
        } else {
          throw new Error(`Field crew username "${formattedStaffUsername}" is already taken by "${existingStaff.full_name}". Please go back to Step 4 and choose a different username suffix.`);
        }
      } else {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("admin_create_staff", {
          body: {
            username: fullUsername,
            full_name: staffName.trim(),
            password: staffPassword,
            company_id: activeCompanyId,
            isActive: true,
            global_role: "Field Crew",
            email: crewEmail.trim() || null,
            phone: crewPhone.trim() ? (crewPhoneDialCode + " " + crewPhone.trim()) : null,
          },
        });

        if (edgeErr || edgeData?.error) {
          let details = edgeData?.error;
          if (edgeErr) {
            details = edgeErr.message;
            const context = (edgeErr as any).context || (edgeErr as any).response;
            if (context && typeof context.json === 'function') {
              try {
                const body = await context.json();
                if (body?.error) details = body.error;
              } catch (e) {
                // ignore
              }
            }
          }
          let userFriendlyMessage = `Failed to register staff account: ${details}`;
          if (details && details.includes('violates check constraint "valid_global_role"')) {
            userFriendlyMessage = "Database Schema Mismatch: The role 'Field Crew' is rejected by your database. This happens because your remote Supabase database check constraint hasn't been updated. Please run the SQL migrations (specifically 20260712000002_rename_technician_to_field_crew.sql) in your Supabase dashboard SQL editor to update the role names.";
          }
          throw new Error(userFriendlyMessage);
        }
        staffProfileId = edgeData?.staff_id;
      }
    } else {
      staffProfileId = selectedStaffId;
    }

    // 6. Create or Reuse Job (parent Work Order)
    let jobId = null;
    const { data: existingJob } = await supabase
      .from("jobs")
      .select("id")
      .eq("project_id", projId)
      .eq("title", jobTitle.trim())
      .maybeSingle();

    if (existingJob) {
      jobId = existingJob.id;
    } else {
      const { data: jobData, error: jobErr } = await supabase
        .from("jobs")
        .insert({
          title: jobTitle.trim(),
          description: jobDescription.trim() || null,
          scheduled_start: jobStart,
          scheduled_end: jobEnd,
          project_id: projId,
          customer_id: custId,
          status: "Scheduled",
        })
        .select()
        .single();

      if (jobErr) throw new Error(`Failed to schedule work order: ${jobErr.message}`);
      jobId = jobData.id;
    }

    // 7. Create Task assigned to the field crew member
    if (staffProfileId && jobId) {
      const { data: existingTask } = await supabase
        .from("tasks")
        .select("id")
        .eq("job_id", jobId)
        .eq("name", jobTitle.trim())
        .maybeSingle();

      if (!existingTask) {
        const { error: taskErr } = await supabase
          .from("tasks")
          .insert({
            job_id: jobId,
            name: jobTitle.trim(),
            description: jobDescription.trim() || "Initial checklist task",
            assignee_id: staffProfileId,
            status: "Pending",
            priority: "Medium",
          });
        if (taskErr) throw new Error(`Failed to assign checklist task: ${taskErr.message}`);
      }
    }

    return { activeCompanyId };
  };

  // Sign up visitor and build their system
  const handleDeployPublic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim()) {
      toast.error("Email and Password are required");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      // Step 0: Check prefix uniqueness before creating auth user
      const prefixToUse = companyPrefix.toUpperCase();
      if (prefixToUse) {
        const { data: existingPrefixComp } = await supabase
          .from("companies")
          .select("id")
          .eq("prefix", prefixToUse)
          .maybeSingle();

        if (existingPrefixComp) {
          throw new Error(`The company prefix "${prefixToUse}" is already in use. Please change your company name slightly.`);
        }
      }

      // Step A: SignUp user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (authErr) {
        if (authErr.message?.includes("already registered")) {
          throw new Error("This email is already registered. Please log in.");
        }
        throw authErr;
      }

      const createdUser = authData?.user;
      if (!createdUser) {
        throw new Error("Failed to register account credentials.");
      }

      // Step B: Bulk insert all setup data
      await executeBulkInsert(createdUser.id);

      // Clean local storage cache
      localStorage.removeItem(SANDBOX_STORAGE_KEY);
      toast.success("Account created and configurations deployed successfully!");
      setStep(7);
    } catch (err: any) {
      toast.error(err.message || "Onboarding failed. Please review details and try again.");
    } finally {
      setSaving(false);
    }
  };

  // Deploy for logged-in user (Onboarding-Auth or New-Project)
  const handleDeployAuth = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const targetCompId = wizardMode === "new-project" && company ? company.id : undefined;
      await executeBulkInsert(user.id, targetCompId);

      toast.success(
        wizardMode === "new-project"
          ? "New project set up and published!"
          : "Guided onboarding setup completed!"
      );
      setStep(7);
    } catch (err: any) {
      toast.error(err.message || "Deployment failed. Please check inputs and retry.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyApkLink = () => {
    const apkUrl = `${window.location.origin}/downloads/Ocrem.apk`;
    navigator.clipboard.writeText(apkUrl);
    setCopiedLink(true);
    toast.success("App download link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCredentials = () => {
    const formattedUsername = `@${(companyPrefix + staffUsernameSuffix).toUpperCase()}`;
    const text = `App Login Credentials:\nUsername: ${formattedUsername}\nPassword: ${staffPassword}\n\nDownload Link: ${window.location.origin}/downloads/Ocrem.apk`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    toast.success("Credentials copied!");
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const handleFinish = () => {
    // If they signed up, we can refresh the window or navigate to home page dashboard
    navigate("/");
    window.location.reload();
  };

  // Helper values
  const formattedStaffUsername = `@${((companyPrefix || "PREFIX") + (staffUsernameSuffix || "USERNAME")).toUpperCase()}`;

  // Step definitions list for the sidebar index indicator
  const stepsList = [
    { num: 2, label: "First Client & Project", desc: "Who and what are we setting up today?" },
    { num: 3, label: "Worksite Boundary", desc: "Draw your first circular geofence zone" },
    { num: 4, label: "Crew Member Account", desc: "Create mobile credentials for your crew" },
    { num: 5, label: "First Job Dispatch", desc: "Create a checklist tasks list for them" },
    { num: 6, label: "Deploy Everything!", desc: "Review and publish your custom workspace" },
  ];

  // Adjust steps listing for all modes
  const activeStepsList = stepsList;

  if (loading || (user && loadingAdmin)) {
    return <div className="min-h-screen bg-[#0a0f1d]" />;
  }

  if (company?.subscription_status === 'pending_approval' && !isSuperadmin) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl z-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-amber-500 animate-pulse border border-amber-500/20">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Application Under Review</h2>
            <p className="text-amber-500 text-xs font-semibold tracking-wider uppercase">Founders Partner Charter Program</p>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you for applying to the Founders Partner Charter! Our product team is currently verifying your business profile (<span className="text-slate-900 font-semibold">{company.name}</span>) to configure your dedicated dashboard and SMS routing channels.
          </p>
          <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1 text-left">
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Submitted Profile Details</p>
            <div className="text-xs text-slate-700 space-y-2 mt-2">
              <p><strong className="text-slate-500">Industry:</strong> {company.industry}</p>
              <p><strong className="text-slate-500">Business Address:</strong> {company.address || "—"}</p>
              <p><strong className="text-slate-500">Estimated Crew Size:</strong> {company.staff_count || "—"}</p>
              <p><strong className="text-slate-500">Annual Revenue Scope:</strong> {company.annual_revenue || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            We review and approve profiles within 2 hours. A confirmation email will be sent once your workspace is live.
          </p>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-800/50 w-full">
            Log Out or Switch Account
          </Button>
        </div>
      </div>
    );
  }

  if (user && !company && signupMode === "founders_partner" && !isSuperadmin) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl z-10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Founders Partner Application</h2>
            <p className="text-slate-500 text-sm">
              Apply to join our exclusive Charter Program. Please provide your business profile details below to initiate manual vetting.
            </p>
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-700 text-xs font-semibold">Business Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Plumbing Services"
                required
                className="bg-slate-950/80 border-slate-800 text-slate-900 placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-semibold">Industry Vertical</Label>
                <Select value={companyVertical} onValueChange={setCompanyVertical}>
                  <SelectTrigger className="bg-slate-950/80 border-slate-800 text-slate-900">
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-900">
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Pest Control">Pest Control</SelectItem>
                    <SelectItem value="General Construction">General Construction</SelectItem>
                    <SelectItem value="General">General Trade / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-semibold">Country</Label>
                <Select value={companyCountry} onValueChange={(val) => { setCompanyCountry(val); saveSandboxProgress({ companyCountry: val }); }}>
                  <SelectTrigger className="bg-slate-950/80 border-slate-800 text-slate-900">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-900">
                    {countriesList.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-semibold">Estimated Crew Size</Label>
                <Select value={companyStaffCount} onValueChange={setCompanyStaffCount}>
                  <SelectTrigger className="bg-slate-950/80 border-slate-800 text-slate-900">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-900">
                    <SelectItem value="1-5">1 to 5 technicians</SelectItem>
                    <SelectItem value="6-20">6 to 20 technicians</SelectItem>
                    <SelectItem value="21-50">21 to 50 technicians</SelectItem>
                    <SelectItem value="50+">More than 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 text-xs font-semibold">Business Address</Label>
              <Input
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="e.g. 100 Main St, Suite A, Austin, TX"
                className="bg-slate-950/80 border-slate-800 text-slate-900 placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-semibold">Company Website</Label>
                <Input
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="e.g. www.acme.com"
                  className="bg-slate-950/80 border-slate-800 text-slate-900 placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 text-xs font-semibold">Annual Revenue Scope</Label>
                <Select value={companyAnnualRevenue} onValueChange={setCompanyAnnualRevenue}>
                  <SelectTrigger className="bg-slate-950/80 border-slate-800 text-slate-900">
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-900">
                    <SelectItem value="Under $250k">Under $250k</SelectItem>
                    <SelectItem value="$250k-$1M">$250k to $1M</SelectItem>
                    <SelectItem value="$1M-$5M">$1M to $5M</SelectItem>
                    <SelectItem value="Above $5M">Above $5M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submittingApp}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 mt-4 rounded-xl shadow-lg gap-2"
            >
              {submittingApp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Charter Application
            </Button>
          </form>

          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-800/50 w-full mt-2">
            Log Out or Switch Account
          </Button>
        </div>
      </div>
    );
  }

  if (wizardMode === "public-sandbox" && introStep === 6) {
    return (
      <>
        <SEO
          title="Select Your Plan — FiledCrew"
          description="Choose a subscription plan to activate your FiledCrew workspace."
          path="/wizard"
          noIndex
        />
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none relative overflow-x-hidden">
          {/* Full Width Top Header Bar */}
          <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="FiledCrew Logo" className="h-8 w-8 rounded-lg shadow-sm" />
              <span className="text-xl font-black text-slate-900 tracking-tight">FiledCrew</span>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setIntroStep(5);
                saveSandboxProgress({ introStep: 5 });
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Account Details
            </Button>
          </header>

          {/* Main Full-Width Content Container */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 flex flex-col items-center justify-center">
            {/* Header Hero Section */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Workspace Registration Complete
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Select Your Subscription Plan
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Your company profile <span className="font-bold text-slate-800">{companyName || "Organization"}</span> and administrator account are registered. Choose a plan to activate your workspace.
              </p>
            </div>

            {/* 3 Neutral Equal Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
              
              {/* Plan 1: 14-Day Free Trial */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-primary/60 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Self-Serve Trial
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-3">14-Day Free Trial</h2>
                    <div className="text-3xl font-black text-slate-900 mt-2">
                      $0 <span className="text-xs font-normal text-slate-500">/ 14 days</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Start exploring immediately with 5 field crew seats & full platform access. No credit card required.
                    </p>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-2.5 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span><strong>5 Field Crew Seats</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Live GPS Map & Worksite Geofences</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Digital Timesheets & Job Checklists</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Guided Initial Setup Wizard</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={async () => {
                    const activeUserRes = await supabase.auth.getUser();
                    const activeUserId = activeUserRes.data.user?.id || user?.id;
                    if (activeUserId) {
                      const { data: comp } = await supabase.from("companies").select("id").eq("auth_user_id", activeUserId).maybeSingle();
                      if (comp) {
                        await (supabase as any).from("companies").update({
                          subscription_tier: "free_trial",
                          subscription_status: "trialing"
                        }).eq("id", comp.id);
                      }
                    }
                    // Launch 2nd flow of onboarding (Add Client, Project, Geofence, Crew, Job)
                    setStep(2);
                    setIntroStep(7);
                    saveSandboxProgress({ step: 2, introStep: 7, selectedPlan: "free_trial" });
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-11 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Start Free Trial (5 Seats) <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Plan 2: Growth Plan (Per Seat) */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-500/60 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Scalable Per-Seat
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-3">Growth Plan</h2>
                    <div className="text-3xl font-black text-slate-900 mt-2">
                      $29 <span className="text-xs font-normal text-slate-500">/ seat / mo</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Pay as your crew expands. Direct WhatsApp activation with your dedicated admin support.
                    </p>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-2.5 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span><strong>Unlimited Crew Seats</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Dispatch Cost & Quote Engine</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Client Portal Access & Instant Payments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Priority Admin Account Activation</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={async () => {
                    const activeUserRes = await supabase.auth.getUser();
                    const activeUserId = activeUserRes.data.user?.id || user?.id;
                    if (activeUserId) {
                      const { data: comp } = await supabase.from("companies").select("id").eq("auth_user_id", activeUserId).maybeSingle();
                      if (comp) {
                        await (supabase as any).from("companies").update({
                          subscription_tier: "growth",
                          subscription_status: "pending_activation"
                        }).eq("id", comp.id);
                      }
                    }
                    const text = encodeURIComponent(`Hi there! I just registered ${companyName || 'our company'} on FiledCrew and would like to activate our Growth Plan ($29/seat/mo). Please assist with account activation.`);
                    window.open(`https://wa.me/14094229714?text=${text}`, "_blank");
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs h-11 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Activate via WhatsApp ➔
                </Button>
              </div>

              {/* Plan 3: Founding Partner Program */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-500/60 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Yearly Charter Access
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-3">Founding Partner</h2>
                    <div className="text-3xl font-black text-slate-900 mt-2">
                      Yearly Charter <span className="text-xs font-normal text-slate-500">/ annual</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Exclusive annual charter for field operators. Includes white-glove migration & direct co-design access.
                    </p>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-2.5 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span><strong>Yearly VIP Charter License</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>White-Glove Database & Crew Migration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Direct Product Co-Design Access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Dedicated Engineering WhatsApp Hotline</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={async () => {
                    const activeUserRes = await supabase.auth.getUser();
                    const activeUserId = activeUserRes.data.user?.id || user?.id;
                    if (activeUserId) {
                      const { data: comp } = await supabase.from("companies").select("id").eq("auth_user_id", activeUserId).maybeSingle();
                      if (comp) {
                        await (supabase as any).from("companies").update({
                          subscription_tier: "founding_partner",
                          subscription_status: "pending_charter"
                        }).eq("id", comp.id);
                      }
                    }
                    const text = encodeURIComponent(`Hi there! We are interested in enrolling ${companyName || 'our company'} in the Yearly Founding Partner Charter for FiledCrew. Please send us details on how we can get started.`);
                    window.open(`https://wa.me/14094229714?text=${text}`, "_blank");
                  }}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-11 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Join Yearly Charter ➔
                </Button>
              </div>

            </div>
          </main>
        </div>
      </>
    );
  }

  if (wizardMode === "public-sandbox" && introStep <= 5) {
    return (
      <>
        <SEO
          title="Onboarding — FiledCrews"
          description="Clay-style enterprise onboarding wizard."
          path="/wizard"
          noIndex
        />
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans select-none relative overflow-hidden">
          {/* Left Pane (Desktop only - Remote 3 Replica) */}
          <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-col justify-between p-10 bg-sidebar text-sidebar-foreground border-r border-sidebar-border relative overflow-hidden shrink-0 select-none">
            
            <div className="relative z-10 w-full mx-auto flex flex-col h-full justify-between">
              {/* Header Section */}
              <div>
                {/* Top Logo */}
              <div className="flex items-center gap-3 mb-8">
                <img src="/favicon.png" alt="FiledCrew Logo" className="h-8 w-8 rounded-lg shadow-sm" />
                <span className="text-xl font-black text-white tracking-tight">FiledCrew</span>
              </div>

              {/* Hero Copy */}
              <div className="space-y-2 mb-10">
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Setup your workspace.
                </h1>
                <p className="text-xs text-sidebar-foreground/75 font-medium leading-relaxed max-w-[300px]">
                  Configure your company details, location, and team structure for field dispatch.
                </p>
              </div>
            </div>

            {/* Overlapping Floating UI Cards & Feature Callouts matching Remote 3 (Dynamic Per Step) */}
            <div className="relative w-full h-[400px] pointer-events-none my-auto">
              
              {/* STEP 1: COMPANY PROFILE */}
              {introStep <= 1 && (
                <>
                  <div className="absolute right-0 top-0 text-left z-0 translate-x-1 -translate-y-6">
                    <p className="font-bold text-[11px] text-white">Manage field crews</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Technicians to contractors</p>
                  </div>

                  <div className="absolute right-0 top-6 w-[250px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-20 border border-slate-100">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[8px] font-extrabold text-slate-400 border-b border-slate-100 pb-2 uppercase tracking-wider mb-2.5">
                      <span>NAME</span>
                      <span>ROLE</span>
                      <span>REGION</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { name: "Jacob", role: "HVAC Lead", region: "US", avatar: "bg-blue-50 text-blue-700" },
                        { name: "Olivia", role: "Electrician", region: "CA", avatar: "bg-amber-50 text-amber-700" },
                        { name: "Patrícia", role: "Plumber", region: "MX", avatar: "bg-emerald-50 text-emerald-700" },
                        { name: "Martha", role: "Inspector", region: "UK", avatar: "bg-purple-50 text-purple-700" }
                      ].map((p, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-[10px]">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full ${p.avatar} flex items-center justify-center text-[10px] font-black border border-slate-200/60`}>
                              {p.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800">{p.name}</span>
                          </div>
                          <span className="text-slate-500 font-medium text-[9px]">{p.role}</span>
                          <span className="text-[9px] font-bold text-slate-400">{p.region}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-12 w-[230px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-30 -translate-x-3 border border-slate-100">
                    <div className="inline-block border border-slate-200 text-[8px] font-bold text-slate-400 px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
                      PER DISPATCH
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Tech labor rate</span>
                        <span className="font-bold text-slate-900">$1,250.00</span>
                      </div>
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Parts & materials</span>
                        <span className="font-bold text-slate-900">$850.00</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 text-xs">
                        <span className="font-black text-slate-900">Total Estimate</span>
                        <span className="font-black text-slate-900">$2,100.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-0 text-left z-10 translate-y-2">
                    <p className="font-bold text-[11px] text-white">Calculate dispatch cost</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Total cost of job & materials</p>
                  </div>
                </>
              )}

              {/* STEP 2: LOCATION & GEOFENCING */}
              {introStep === 2 && (
                <>
                  <div className="absolute right-0 top-0 text-left z-0 translate-x-1 -translate-y-6">
                    <p className="font-bold text-[11px] text-white">Smart Geofence Auto-Clock</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Automatic shift tracking on site arrival</p>
                  </div>

                  <div className="absolute right-0 top-6 w-[250px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-20 border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10px] font-extrabold text-slate-900">Active Geofences</span>
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                    </div>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-800">Austin Tech Hub</p>
                          <p className="text-[8px] text-slate-500">150m Radius • 4 Techs</p>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-600">Auto Verified</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-800">Dallas Field Station</p>
                          <p className="text-[8px] text-slate-500">200m Radius • 2 Techs</p>
                        </div>
                        <span className="text-[8px] font-bold text-blue-600">En Route</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-12 w-[230px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-30 -translate-x-3 border border-slate-100">
                    <p className="text-xs font-black text-slate-900">GPS Fleet Telemetry</p>
                    <p className="text-[8px] text-slate-500 font-semibold mb-2">14 Active Vehicles</p>
                    <div className="space-y-1 text-[10px] border-t border-slate-100 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Response Time</span>
                        <span className="font-bold text-slate-900">14 mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Signal Accuracy</span>
                        <span className="font-bold text-emerald-600">99.8%</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-0 text-left z-10 translate-y-2">
                    <p className="font-bold text-[11px] text-white">Live fleet tracking</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Real-time GPS coordinates & status</p>
                  </div>
                </>
              )}

              {/* STEP 3: BRANDING & INVOICING */}
              {introStep === 3 && (
                <>
                  <div className="absolute right-0 top-0 text-left z-0 translate-x-1 -translate-y-6">
                    <p className="font-bold text-[11px] text-white">Branded Client Invoices</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Custom logo, colors & terms</p>
                  </div>

                  <div className="absolute right-0 top-6 w-[250px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-20 border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 bg-indigo-600 rounded" />
                        <span className="text-[10px] font-black text-slate-900">INV #9402</span>
                      </div>
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">PAID</span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <p className="text-slate-500 text-[8px]">Client: <span className="font-bold text-slate-800">Apex Realty Corp</span></p>
                      <div className="flex justify-between border-t border-slate-100 pt-1 mt-1">
                        <span className="text-slate-500">Commercial HVAC</span>
                        <span className="font-black text-slate-900">$3,450.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-12 w-[230px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-30 -translate-x-3 border border-slate-100">
                    <p className="text-xs font-black text-slate-900">Stripe Direct Payouts</p>
                    <p className="text-[8px] text-slate-500 font-semibold mb-2">Next-Day Bank Transfer</p>
                    <p className="text-lg font-black text-slate-900 mb-1">$14,850.00</p>
                    <p className="text-[8px] text-emerald-600 font-bold">100% Auto-Synced Invoices</p>
                  </div>

                  <div className="absolute left-0 bottom-0 text-left z-10 translate-y-2">
                    <p className="font-bold text-[11px] text-white">Instant payment payouts</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Accept credit cards & bank transfers</p>
                  </div>
                </>
              )}

              {/* STEP 4: TEAM SIZE & DISPATCH */}
              {introStep === 4 && (
                <>
                  <div className="absolute right-0 top-0 text-left z-0 translate-x-1 -translate-y-6">
                    <p className="font-bold text-[11px] text-white">AI Route Optimization</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Save up to 30% fuel on dispatch</p>
                  </div>

                  <div className="absolute right-0 top-6 w-[250px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-20 border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10px] font-extrabold text-slate-900">Dispatch Efficiency</span>
                      <span className="text-[8px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">OPTIMIZED</span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fuel Saved Today</span>
                        <span className="font-black text-emerald-600">38 Gallons</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Travel Time Reduced</span>
                        <span className="font-black text-blue-600">42 mins / tech</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-12 w-[230px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-30 -translate-x-3 border border-slate-100">
                    <p className="text-xs font-black text-slate-900 mb-1">Technician Capacity</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-indigo-600 w-[88%]" />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>14 / 16 Shifts Filled</span>
                      <span className="text-indigo-600">88% Load</span>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-0 text-left z-10 translate-y-2">
                    <p className="font-bold text-[11px] text-white">Capacity management</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Prevent crew burnout & double-booking</p>
                  </div>
                </>
              )}

              {/* STEP 5: FINAL SIGN UP / COMPLETE */}
              {introStep >= 5 && (
                <>
                  <div className="absolute right-0 top-0 text-left z-0 translate-x-1 -translate-y-6">
                    <p className="font-bold text-[11px] text-white">Command Center Ready</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Everything provisioned for dispatch</p>
                  </div>

                  <div className="absolute right-0 top-6 w-[250px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-20 border border-slate-100">
                    <div className="mb-2 pb-2 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-900">Workspace Provisioned</p>
                      <p className="text-[8px] text-slate-500 font-semibold">Ready for immediate crew onboarding</p>
                    </div>
                    <div className="space-y-1 text-[9px] text-slate-600 font-medium">
                      <p className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> CRM & Job Dispatch Active</p>
                      <p className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Invoicing & Payments Live</p>
                      <p className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> GPS Geofences Configured</p>
                    </div>
                  </div>

                  <div className="absolute left-0 bottom-12 w-[230px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-30 -translate-x-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900">Enterprise SLA</span>
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">99.9%</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight">SOC2 Compliant • Encrypted Backups • 24/7 Priority Support</p>
                  </div>

                  <div className="absolute left-0 bottom-0 text-left z-10 translate-y-2">
                    <p className="font-bold text-[11px] text-white">Enterprise security</p>
                    <p className="text-[9.5px] text-slate-400 font-medium">Bank-grade encryption & compliance</p>
                  </div>
                </>
              )}
            </div>

            {/* Subtle background ambient gradient glow */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
          </div>
        </div>

          {/* Right Pane (Forms) */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-16 relative">
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Mobile Nav */}
            <div className="w-full max-w-xl flex items-center justify-between mb-8 lg:hidden z-10">
              <div className="flex items-center gap-3">
                <img src="/favicon.png" alt="FiledCrew Logo" className="h-7 w-7 rounded-lg" />
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">FiledCrew</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 bg-white rounded-full border border-slate-300/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${(introStep / 6) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">{introStep}/6</span>
              </div>
            </div>

            {/* Main Card Container */}
            <div className={cn(
              "w-full bg-transparent lg:bg-white shadow-xl lg:border lg:border-slate-200 lg:shadow-2xl relative overflow-hidden backdrop-blur-md text-slate-900 z-10 lg:p-8 rounded-2xl transition-all duration-300",
              introStep === 4 || introStep === 6 ? "max-w-[680px]" : "max-w-[480px]"
            )}>
            <div className="space-y-6">
              
              {/* Card 1: Company Name */}
              {introStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">What is your company's name?</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      We'll set up your personalized enterprise workspace under this name.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="intro-company-name" className="text-xs font-semibold text-slate-700 uppercase">Company Name</Label>
                    <Input
                      id="intro-company-name"
                      placeholder="e.g. Paramount Constructors"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        saveSandboxProgress({ companyName: e.target.value });
                        // Auto-generate prefix
                        const prefix = computePrefix(e.target.value);
                        setCompanyPrefix(prefix);
                        saveSandboxProgress({ companyPrefix: prefix });
                      }}
                      className="bg-slate-50 border-slate-300 text-slate-900 text-base h-12 focus:ring-sidebar focus:border-sidebar px-4 rounded-lg"
                    />
                  </div>
                  {companyName && (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Generated crew prefix code:</span>
                      <span className="font-mono text-white font-bold bg-sidebar px-2 py-0.5 rounded border border-sidebar-border">@{companyPrefix}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Card 2: Company Address */}
              {introStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Where is your company located?</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      This establishes your region for local mapping and geofence tracking.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="intro-company-address" className="text-xs font-semibold text-slate-700 uppercase">Headquarters Address</Label>
                    <Input
                      id="intro-company-address"
                      ref={companyAddressInputRef}
                      placeholder="Search or enter address"
                      value={companyAddress}
                      onChange={(e) => {
                        setCompanyAddress(e.target.value);
                        saveSandboxProgress({ companyAddress: e.target.value });
                      }}
                      className="bg-slate-50 border-slate-300 text-slate-900 text-base h-12 focus:ring-emerald-600 focus:border-emerald-600 px-4 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Card 3: Website, Staff Size, and Revenue */}
              {introStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Tell us about your operations</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      We'll configure your dashboard parameters based on your team structure.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="intro-company-website" className="text-xs font-semibold text-slate-700 uppercase">Company Website</Label>
                      <Input
                        id="intro-company-website"
                        placeholder="www.company.com"
                        value={companyWebsite}
                        onChange={(e) => {
                          setCompanyWebsite(e.target.value);
                          saveSandboxProgress({ companyWebsite: e.target.value });
                        }}
                        className="bg-slate-50 border-slate-300 text-slate-900 h-11 px-3 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="intro-staff-count" className="text-xs font-semibold text-slate-700 uppercase">Team Size</Label>
                        <select
                          id="intro-staff-count"
                          value={companyStaffCount}
                          onChange={(e) => {
                            setCompanyStaffCount(e.target.value);
                            saveSandboxProgress({ companyStaffCount: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 h-11 rounded-lg px-2 text-xs focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select size</option>
                          <option value="1-5">1-5 members</option>
                          <option value="6-15">6-15 members</option>
                          <option value="16-50">16-50 members</option>
                          <option value="51+">51+ members</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="intro-annual-revenue" className="text-xs font-semibold text-slate-700 uppercase font-mono">Annual Revenue</Label>
                        <select
                          id="intro-annual-revenue"
                          value={companyAnnualRevenue}
                          onChange={(e) => {
                            setCompanyAnnualRevenue(e.target.value);
                            saveSandboxProgress({ companyAnnualRevenue: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 h-11 rounded-lg px-2 text-xs focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select range</option>
                          <option value="Under $100K">Under $100K</option>
                          <option value="$100K - $500K">$100K - $500K</option>
                          <option value="$500K - $2M">$500K - $2M</option>
                          <option value="$2M+">$2M+</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2 relative">
                      <Label className="text-xs font-semibold text-slate-700 uppercase">Default Currency</Label>
                      <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={currencyOpen}
                            className="w-full justify-between bg-slate-50 border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-slate-900 h-11 px-3 py-2 text-xs rounded-lg"
                          >
                            {currencyCode ? (
                              <span className="flex items-center gap-2">
                                <span>{currenciesList.find(c => c.code === currencyCode)?.flag || "🌐"}</span>
                                <span className="font-mono font-semibold">{currencyCode}</span>
                                <span className="text-slate-500">({getCurrencySymbol(currencyCode)})</span>
                                <span className="text-slate-500 text-xs truncate max-w-[200px] hidden sm:inline">
                                  - {currenciesList.find(c => c.code === currencyCode)?.name}
                                </span>
                              </span>
                            ) : (
                              "Select currency..."
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-300 text-slate-900">
                          <Command className="bg-transparent text-slate-900">
                            <CommandInput placeholder="Search currency..." className="border-0 focus:ring-0 text-slate-900 bg-slate-50" />
                            <CommandEmpty className="py-2 text-center text-xs text-slate-500">No currency found.</CommandEmpty>
                            <CommandGroup>
                              <CommandList className="max-h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {currenciesList.map((c) => (
                                  <CommandItem
                                    key={c.code}
                                    value={c.code + " " + c.name}
                                    onSelect={() => {
                                      setCurrencyCode(c.code);
                                      setCurrencyOpen(false);
                                      saveSandboxProgress({ currencyCode: c.code });
                                    }}
                                    className="hover:bg-[#1f355c] cursor-pointer py-2 px-3 text-xs flex justify-between items-center"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span>{c.flag}</span>
                                      <span className="font-mono font-bold">{c.code}</span>
                                      <span className="text-slate-500">({c.symbol})</span>
                                      <span className="text-slate-500 font-sans truncate max-w-[150px]">- {c.name}</span>
                                    </span>
                                    {currencyCode === c.code && (
                                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Niche Industry Vertical & Country */}
              {introStep === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Select your industry vertical</h2>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Clay-Style Presets</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      We'll tailor your dispatch workflows, cost models, and crew tags to your exact trade.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Country Selector */}
                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <Label className="text-slate-700 text-xs font-bold shrink-0">Operating Country:</Label>
                      <Select value={companyCountry} onValueChange={(val) => { setCompanyCountry(val); saveSandboxProgress({ companyCountry: val }); }}>
                        <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-8 text-xs font-semibold focus:ring-primary flex-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          {countriesList.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-xs">
                              {c.flag} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clay-Style Vertical Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                      {[
                        { val: "HVAC", label: "HVAC & Climate", desc: "Heating, AC, dispatch & equipment tracking", icon: ThermometerSnowflake, iconBg: "bg-blue-500/10 text-blue-600" },
                        { val: "Plumbing", label: "Plumbing & Piping", desc: "Drains, leaks, emergency callouts & piping", icon: Wrench, iconBg: "bg-cyan-500/10 text-cyan-600" },
                        { val: "Landscaping", label: "Landscaping & Grounds", desc: "Groundskeeping, lawn care & seasonal jobs", icon: Trees, iconBg: "bg-emerald-500/10 text-emerald-600" },
                        { val: "Electrical", label: "Electrical Systems", desc: "Wiring, panel upgrades & high-voltage jobs", icon: Zap, iconBg: "bg-amber-500/10 text-amber-600" },
                        { val: "Cleaning", label: "Commercial Cleaning", desc: "Sanitation, janitorial & facility contracts", icon: Sparkles, iconBg: "bg-indigo-500/10 text-indigo-600" },
                        { val: "General Construction", label: "General Contractor", desc: "Remodeling, job sites & sub-contractors", icon: Hammer, iconBg: "bg-orange-500/10 text-orange-600" },
                        { val: "Pest Control", label: "Pest Management", desc: "Extermination routes & periodic spray schedules", icon: ShieldAlert, iconBg: "bg-rose-500/10 text-rose-600" },
                        { val: "Solar & Renewables", label: "Solar & Renewables", desc: "PV installs, battery storage & grid maintenance", icon: Sun, iconBg: "bg-yellow-500/10 text-yellow-600" },
                        { val: "Roofing & Siding", label: "Roofing & Exterior", desc: "Roof repair, siding & storm restoration", icon: Home, iconBg: "bg-purple-500/10 text-purple-600" },
                      ].map((v) => {
                        const IconComponent = v.icon;
                        const isSelected = companyVertical === v.val;
                        return (
                          <button
                            key={v.val}
                            type="button"
                            onClick={() => {
                              applyVerticalPresets(v.val);
                            }}
                            className={cn(
                              "p-3.5 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between group cursor-pointer",
                              isSelected
                                ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md scale-[1.01]"
                                : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs hover:shadow-sm"
                            )}
                          >
                            <div className="flex items-start justify-between w-full mb-2">
                              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", v.iconBg)}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-slate-300 group-hover:border-slate-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors">{v.label}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{v.desc}</p>
                            </div>
                          </button>
                        );
                      })}

                      {/* Custom / Other Trade Card */}
                      <button
                        type="button"
                        onClick={() => {
                          applyVerticalPresets("Other");
                        }}
                        className={cn(
                          "p-3.5 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between group cursor-pointer sm:col-span-2",
                          companyVertical !== "HVAC" &&
                            companyVertical !== "Plumbing" &&
                            companyVertical !== "Landscaping" &&
                            companyVertical !== "Electrical" &&
                            companyVertical !== "Cleaning" &&
                            companyVertical !== "General Construction" &&
                            companyVertical !== "Pest Control" &&
                            companyVertical !== "Solar & Renewables" &&
                            companyVertical !== "Roofing & Siding"
                            ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                            : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">Other Custom Trade</h4>
                              <p className="text-[11px] text-slate-500">Appliance repair, pool maintenance, elevators, or specialized service</p>
                            </div>
                          </div>
                          {companyVertical !== "HVAC" &&
                            companyVertical !== "Plumbing" &&
                            companyVertical !== "Landscaping" &&
                            companyVertical !== "Electrical" &&
                            companyVertical !== "Cleaning" &&
                            companyVertical !== "General Construction" &&
                            companyVertical !== "Pest Control" &&
                            companyVertical !== "Solar & Renewables" &&
                            companyVertical !== "Roofing & Siding" ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-slate-300 group-hover:border-slate-400 shrink-0" />
                            )}
                        </div>
                      </button>
                    </div>

                    {/* Custom Trade Input (if Other selected) */}
                    {companyVertical !== "HVAC" &&
                      companyVertical !== "Plumbing" &&
                      companyVertical !== "Landscaping" &&
                      companyVertical !== "Electrical" &&
                      companyVertical !== "Cleaning" &&
                      companyVertical !== "General Construction" &&
                      companyVertical !== "Pest Control" &&
                      companyVertical !== "Solar & Renewables" &&
                      companyVertical !== "Roofing & Siding" && (
                        <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
                          <Label htmlFor="custom-vertical-name" className="text-xs font-bold text-slate-700">Specify Custom Industry</Label>
                          <Input
                            id="custom-vertical-name"
                            placeholder="e.g. Pool & Spa Care, Elevator Service, Security Systems"
                            value={companyVertical === "Other" ? "" : companyVertical}
                            onChange={(e) => {
                              setCompanyVertical(e.target.value || "Other");
                              saveSandboxProgress({ companyVertical: e.target.value || "Other" });
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900 h-9 px-3 text-xs rounded-lg focus:ring-primary"
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* Card 5: Admin Credentials Signup */}
              {introStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Create your administrator account</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      You will use these credentials to log in to your desktop control board.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-first-name" className="text-[10px] font-semibold text-slate-500 uppercase">First Name</Label>
                        <Input
                          id="admin-first-name"
                          placeholder="John"
                          value={adminFirstName}
                          onChange={(e) => {
                            setAdminFirstName(e.target.value);
                            saveSandboxProgress({ adminFirstName: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900 h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-last-name" className="text-[10px] font-semibold text-slate-500 uppercase">Last Name</Label>
                        <Input
                          id="admin-last-name"
                          placeholder="Doe"
                          value={adminLastName}
                          onChange={(e) => {
                            setAdminLastName(e.target.value);
                            saveSandboxProgress({ adminLastName: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900 h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-email" className="text-[10px] font-semibold text-slate-500 uppercase">Email Address</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@company.com"
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          saveSandboxProgress({ adminEmail: e.target.value });
                          setSignupEmail(e.target.value);
                        }}
                        className="bg-slate-50 border-slate-300 text-slate-900 h-10"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-phone" className="text-[10px] font-semibold text-slate-500 uppercase">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-md pl-1.5 pr-0.5 w-[82px] shrink-0 focus-within:ring-2 focus-within:ring-blue-500 h-10">
                            <span className="mr-0.5 select-none text-base">{getFlagFromDialCode(adminPhoneDialCode)}</span>
                            <Input
                              type="text"
                              placeholder="+1"
                              value={adminPhoneDialCode}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val.length > 0 && !val.startsWith("+")) {
                                  val = "+" + val.replace(/[^0-9]/g, "");
                                } else {
                                  val = "+" + val.slice(1).replace(/[^0-9]/g, "");
                                }
                                setAdminPhoneDialCode(val);
                                saveSandboxProgress({ adminPhoneDialCode: val });
                              }}
                              className="border-0 bg-transparent p-0 text-slate-900 placeholder-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 w-[30px] text-xs h-7"
                            />
                            <Popover open={adminPhoneOpen} onOpenChange={setAdminPhoneOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-500 hover:text-slate-900 p-0 shrink-0">
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0 bg-white border-slate-300 text-slate-900">
                                <Command className="bg-transparent text-slate-900">
                                  <CommandInput placeholder="Search country or code..." className="border-0 focus:ring-0 text-slate-900 bg-slate-50" />
                                  <CommandEmpty className="py-2 text-center text-xs text-slate-500">No country found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandList className="max-h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                      {countriesList.map((c) => (
                                        <CommandItem
                                          key={c.code}
                                          value={c.name + " " + c.dial_code}
                                          onSelect={() => {
                                            setAdminPhoneDialCode(c.dial_code);
                                            setAdminPhoneOpen(false);
                                            saveSandboxProgress({ adminPhoneDialCode: c.dial_code });
                                          }}
                                          className="hover:bg-[#1f355c] cursor-pointer py-2 px-3 text-xs flex justify-between items-center"
                                        >
                                          <span className="flex items-center gap-2">
                                            <span>{c.flag}</span>
                                            <span className="text-slate-700 font-sans truncate max-w-[120px]">{c.name}</span>
                                          </span>
                                          <span className="font-mono text-slate-500 font-semibold">{c.dial_code}</span>
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Input
                            id="admin-phone"
                            placeholder="(555) 000-0000"
                            value={adminPhone}
                            onChange={(e) => {
                              setAdminPhone(e.target.value);
                              saveSandboxProgress({ adminPhone: e.target.value });
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900 h-10 flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-pass" className="text-[10px] font-semibold text-slate-500 uppercase font-mono">Password</Label>
                        <div className="relative">
                          <Input
                            id="admin-pass"
                            type={showAdminPassword ? "text" : "password"}
                            placeholder="At least 6 characters"
                            value={adminPassword}
                            onChange={(e) => {
                              setAdminPassword(e.target.value);
                              saveSandboxProgress({ adminPassword: e.target.value });
                              setSignupPassword(e.target.value);
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900 h-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                            tabIndex={-1}
                          >
                            {showAdminPassword ? (
                              <EyeOff className="h-4 w-4 shrink-0" />
                            ) : (
                              <Eye className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Card Footer Controls */}
              <div className="border-t border-slate-300/40 pt-4 mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (introStep > 1) {
                      const nextStep = introStep - 1;
                      setIntroStep(nextStep);
                      saveSandboxProgress({ introStep: nextStep });
                    }
                  }}
                  disabled={introStep === 1 || saving}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
                </Button>

                {introStep < 5 ? (
                  <Button
                    onClick={() => {
                      if (introStep === 1 && !companyName.trim()) {
                        toast.error("Company Name is required");
                        return;
                      }
                      if (introStep === 2 && !companyAddress.trim()) {
                        toast.error("HQ Address is required");
                        return;
                      }
                      if (introStep === 3) {
                        if (!companyWebsite.trim()) {
                          toast.error("Company Website is required");
                          return;
                        }
                        if (!companyStaffCount) {
                          toast.error("Team Size is required");
                          return;
                        }
                        if (!companyAnnualRevenue) {
                          toast.error("Annual Revenue range is required");
                          return;
                        }
                      }
                      if (introStep === 4 && !companyVertical.trim()) {
                        toast.error("Industry Vertical is required");
                        return;
                      }

                      const nextStep = introStep + 1;
                      setIntroStep(nextStep);
                      saveSandboxProgress({ introStep: nextStep });
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-6 h-10 rounded-lg shadow-md flex items-center gap-1 transition-all"
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : introStep === 5 ? (
                  <Button
                    onClick={async (e) => {
                      if (!adminFirstName.trim() || !adminLastName.trim()) {
                        toast.error("Admin name fields are required");
                        return;
                      }
                      if (!adminEmail.trim()) {
                        toast.error("Admin Email is required");
                        return;
                      }
                      if (adminPassword.length < 6) {
                        toast.error("Password must be at least 6 characters");
                        return;
                      }

                      setSaving(true);
                      try {
                        // 0. Verify the prefix is unique before creating the account!
                        const prefixToUse = companyPrefix.toUpperCase();
                        const { data: existingPrefixComp } = await supabase
                          .from("companies")
                          .select("id")
                          .eq("prefix", prefixToUse)
                          .maybeSingle();

                        if (existingPrefixComp) {
                          toast.error(`The prefix "${prefixToUse}" is already in use by another company. Please go back and change your company name slightly.`);
                          setSaving(false);
                          return;
                        }

                        // 1. Sign up the user account
                        const { data: authData, error: authErr } = await supabase.auth.signUp({
                          email: adminEmail.trim(),
                          password: adminPassword,
                          options: {
                            data: {
                              first_name: adminFirstName.trim(),
                              last_name: adminLastName.trim(),
                            }
                          }
                        });

                        if (authErr) {
                          if (authErr.message?.includes("already registered")) {
                            throw new Error("This email is already registered. Please log in.");
                          }
                          throw authErr;
                        }

                        const createdUser = authData?.user;
                        if (!createdUser) {
                          throw new Error("Failed to register account credentials.");
                        }

                        // 2. Create the company entry in the DB immediately!
                        const { data: comp, error: compErr } = await supabase
                          .from("companies")
                          .insert({
                            name: companyName.trim(),
                            prefix: companyPrefix.toUpperCase(),
                            auth_user_id: createdUser.id,
                            currency: currencyCode,
                            industry: companyVertical,
                            address: companyAddress.trim() || null,
                            website: companyWebsite.trim() || null,
                            staff_count: companyStaffCount.trim() || null,
                            annual_revenue: companyAnnualRevenue.trim() || null,
                          })
                          .select()
                          .single();

                        if (compErr) throw compErr;

                        // 3. Create staff profile for the admin automatically
                        const { error: staffErr } = await supabase
                          .from("staff_profiles")
                          .insert({
                            company_id: comp.id,
                            auth_user_id: createdUser.id,
                            full_name: `${adminFirstName.trim()} ${adminLastName.trim()}`,
                            first_name: adminFirstName.trim(),
                            last_name: adminLastName.trim(),
                            email: adminEmail.trim(),
                            phone: adminPhone.trim() ? adminPhoneDialCode + adminPhone.trim() : null,
                            username: adminEmail.trim(),
                            global_role: "Admin"
                          });

                        if (staffErr) throw staffErr;

                        toast.success("Account created! Select your plan to complete setup.");
                        
                        // Move to Card 6: Subscription Plan Selection & Free Trial
                        const nextStep = 6;
                        setIntroStep(nextStep);
                        saveSandboxProgress({ introStep: nextStep });
                      } catch (err: any) {
                        toast.error(err.message || "Sign up failed. Please check inputs and retry.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold px-6 h-10 rounded-lg shadow-md transition-all"
                  >
                    {saving ? "Registering..." : "Create Account & Choose Plan"}
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const activeUserRes = await supabase.auth.getUser();
                        const activeUserId = activeUserRes.data.user?.id || user?.id;
                        if (!activeUserId) throw new Error("Session lost. Please log in.");

                        const { data: comp } = await supabase
                          .from("companies")
                          .select("id")
                          .eq("auth_user_id", activeUserId)
                          .maybeSingle();

                        if (comp) {
                          await (supabase as any)
                            .from("companies")
                            .update({
                              subscription_tier: selectedPlan,
                              subscription_status: selectedPlan === 'free_trial' ? 'trialing' : 'active'
                            })
                            .eq("id", comp.id);

                          if (includeSampleData) {
                            if (!customerName) setCustomerName("Apex Commercial Assets");
                            if (!projectName) setProjectName("HQ HVAC & Maintenance Upgrade");
                            if (!staffFirstName) setStaffFirstName("Alex");
                            if (!staffLastName) setStaffLastName("Miller");
                            if (!staffRole) setStaffRole("Lead Field Technician");
                            await executeBulkInsert(activeUserId, comp.id);
                          }
                        }

                        localStorage.removeItem(SANDBOX_STORAGE_KEY);
                        toast.success("Workspace activated! Welcome to FiledCrew.");
                        navigate("/");
                        window.location.reload();
                      } catch (err: any) {
                        toast.error(err.message || "Failed to activate workspace.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 h-10 rounded-lg shadow-md transition-all flex items-center gap-1.5"
                  >
                    {saving ? "Launching Workspace..." : "Confirm Plan & Enter Dashboard ➔"}
                  </Button>
                )}
              </div>
              
              {introStep === 6 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      saveSandboxProgress({ step: 2 });
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-primary transition-colors"
                  >
                    Or click here if you'd like to manually setup your first client & project step-by-step ➔
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={wizardMode === "new-project" ? "Guided Project Setup" : "Setup Wizard Onboarding"}
        description="Frictionless guided setup flow to provision clients, geofences, crew credentials, and work orders."
        path="/wizard"
        noIndex
      />

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        {/* Sticky Logo Bar — always visible, never scrolls */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 px-4 sm:px-6 py-3.5">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img src="/favicon.png" alt="FiledCrews Logo" className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="text-xl font-black tracking-tight text-slate-900">FiledCrews</span>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col items-center pt-6 md:pt-10 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            {step <= 6 && (
              <Card className="border border-slate-200/80 shadow-xl bg-white text-slate-900 rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 pt-8 px-6 sm:px-8 border-b border-slate-100">
                  <div className="space-y-2.5 mb-2">
                    <div className="flex justify-end items-center text-xs font-black font-mono text-amber-500 tracking-wider">
                      <span>
                        {Math.min(100, Math.round((((step + (step === 2 ? (subStep === 2 ? 0.33 : subStep === 3 ? 0.67 : 0) : 0)) - (wizardMode === "new-project" ? 1 : 0)) / (wizardMode === "new-project" ? 5 : 6)) * 100))}% COMPLETE
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full border border-amber-500/20 p-0.5 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(249,115,22,0.85)]"
                        style={{
                          width: `${Math.min(100, Math.round((((step + (step === 2 ? (subStep === 2 ? 0.33 : subStep === 3 ? 0.67 : 0) : 0)) - (wizardMode === "new-project" ? 1 : 0)) / (wizardMode === "new-project" ? 5 : 6)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {step === 1 && (
                    <div className="space-y-3 pt-2">
                      <CardTitle className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Welcome to FiledCrews!
                      </CardTitle>
                      <CardDescription className="text-slate-600 text-base leading-relaxed font-normal pt-1">
                        Let's get your business up and running in just a few steps. We'll help you add your first customer, create your first project and worksite, and invite your first crew member so you can start managing jobs right away.
                      </CardDescription>
                    </div>
                  )}

                  {step === 2 && subStep === 1 && (
                    <div className="space-y-2 pt-2">
                      <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Who is your first client?</CardTitle>
                      <CardDescription className="text-slate-600 text-sm leading-relaxed">
                        Enter the details of the customer or project you are managing. You'll be able to attach multiple projects, invoices, and geofences to this client later.
                      </CardDescription>
                    </div>
                  )}

                  {step === 2 && subStep === 2 && (
                    <div className="space-y-2 pt-2">
                      <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Project Specifications</CardTitle>
                      <CardDescription className="text-slate-600 text-sm leading-relaxed">
                        Enter your project site title, contract value, dates, and work scope details.
                      </CardDescription>
                    </div>
                  )}

                  {step === 2 && subStep === 3 && (
                    <div className="space-y-2 pt-2">
                      <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Planned Budgets & Cost Categories</CardTitle>
                      <CardDescription className="text-slate-600 text-sm leading-relaxed">
                        Configure planned budgets for specific cost categories (e.g. Marketing, Foundation, Materials, Transportation) during this project setup.
                      </CardDescription>
                    </div>
                  )}

                  {step === 3 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-slate-900">Where is the worksite located?</CardTitle>
                      <CardDescription className="text-slate-500 mt-1 text-sm leading-relaxed">
                        Let's mark the physical location on the map. Find your worksite, drop a pin, and adjust the radius. When your crew arrives or leaves, they can check in, and we'll automatically notify you.
                      </CardDescription>
                    </>
                  )}
                  {step === 4 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-slate-900">Add your first crew member!</CardTitle>
                      <CardDescription className="text-slate-500 mt-1 text-sm leading-relaxed">
                        Let's create the username and passcode for your first crew member so they can access the mobile app. They'll use this account to check in, update job details, and upload site photos.
                      </CardDescription>
                    </>
                  )}
                  {step === 5 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-slate-900">Let's dispatch their first job checklist</CardTitle>
                      <CardDescription className="text-slate-500 mt-1 text-sm leading-relaxed">
                        What tasks need to be completed at this worksite? Let's write down a checklist and schedule a date. Your assigned crew member will see it on their mobile app immediately, ready to update in real time.
                      </CardDescription>
                    </>
                  )}
                  {step === 6 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-slate-900">Everything looks great! Let's deploy your setup</CardTitle>
                      <CardDescription className="text-slate-500 mt-1 text-sm leading-relaxed">
                        {wizardMode === "public-sandbox"
                          ? "Let's review everything you've configured. Fill in your administrator details below, and we'll compile your company profile, project, geofence, and crew credentials instantly so you can launch your dashboard!"
                          : "Take a quick moment to verify your setup details below. Once you click 'Publish', we'll write this new project, geofence, and crew member to your active workspace database immediately!"}
                      </CardDescription>
                    </>
                  )}
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* STEP 2 - SUBSTEP 1: Client Information */}
                  {step === 2 && subStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer-name" className="text-sm font-semibold text-slate-700">Client / Customer Name</Label>
                        <Input
                          id="customer-name"
                          placeholder="e.g. Chevron Nigeria Limited"
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            saveSandboxProgress({ customerName: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer-email" className="text-sm font-semibold text-slate-700">Client Email (Optional)</Label>
                          <Input
                            id="customer-email"
                            type="email"
                            placeholder="e.g. contact@client.com"
                            value={customerEmail}
                            onChange={(e) => {
                              setCustomerEmail(e.target.value);
                              saveSandboxProgress({ customerEmail: e.target.value });
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer-phone" className="text-sm font-semibold text-slate-700">Client Phone (Optional)</Label>
                          <div className="flex gap-2">
                            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-md pl-1.5 pr-0.5 w-[82px] shrink-0 focus-within:ring-2 focus-within:ring-blue-500">
                              <span className="mr-0.5 select-none text-base">{getFlagFromDialCode(phoneDialCode)}</span>
                              <Input
                                type="text"
                                placeholder="+1"
                                value={phoneDialCode}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (val.length > 0 && !val.startsWith("+")) {
                                    val = "+" + val.replace(/[^0-9]/g, "");
                                  } else {
                                    val = "+" + val.slice(1).replace(/[^0-9]/g, "");
                                  }
                                  setPhoneDialCode(val);
                                  saveSandboxProgress({ phoneDialCode: val });
                                }}
                                className="bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 font-mono text-xs w-full"
                              />
                              <Popover open={phoneOpen} onOpenChange={setPhoneOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-500 hover:text-slate-900 p-0 shrink-0">
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0 bg-white border-slate-300 text-slate-900">
                                  <Command className="bg-transparent text-slate-900">
                                    <CommandInput placeholder="Search country or code..." className="border-0 focus:ring-0 text-slate-900 bg-slate-50" />
                                    <CommandEmpty className="py-2 text-center text-xs text-slate-500">No country found.</CommandEmpty>
                                    <CommandGroup>
                                      <CommandList className="max-h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {countriesList.map((c) => (
                                          <CommandItem
                                            key={c.code}
                                            value={c.name + " " + c.dial_code}
                                            onSelect={() => {
                                              setPhoneDialCode(c.dial_code);
                                              setPhoneOpen(false);
                                              saveSandboxProgress({ phoneDialCode: c.dial_code });
                                            }}
                                            className="hover:bg-[#1f355c] cursor-pointer py-2 px-3 text-xs flex justify-between items-center"
                                          >
                                            <span className="flex items-center gap-2">
                                              <span>{c.flag}</span>
                                              <span className="text-slate-700 font-sans truncate max-w-[120px]">{c.name}</span>
                                            </span>
                                            <span className="font-mono text-slate-500 font-semibold">{c.dial_code}</span>
                                          </CommandItem>
                                        ))}
                                      </CommandList>
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <Input
                              id="customer-phone"
                              type="tel"
                              placeholder="e.g. 803 123 4567"
                              value={customerPhone}
                              onChange={(e) => {
                                setCustomerPhone(e.target.value);
                                saveSandboxProgress({ customerPhone: e.target.value });
                              }}
                              className="bg-slate-50 border-slate-300 text-slate-900 flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-address" className="text-sm font-semibold text-slate-700">Billing Address (Optional)</Label>
                        <Input
                          id="customer-address"
                          ref={addressInputRef}
                          placeholder="e.g. 123 Corporate Way, Lagos"
                          value={customerBillingAddress}
                          onChange={(e) => {
                            setCustomerBillingAddress(e.target.value);
                            saveSandboxProgress({ customerBillingAddress: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2 - SUBSTEP 2: Project Specifications */}
                  {step === 2 && subStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <Label htmlFor="project-name" className="text-sm font-semibold text-slate-700">Project / Site Name</Label>
                          <Input
                            id="project-name"
                            placeholder="e.g. Escravos Refinery Expansion"
                            value={projectName}
                            onChange={(e) => {
                              setProjectName(e.target.value);
                              saveSandboxProgress({ projectName: e.target.value });
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-status" className="text-sm font-semibold text-slate-700">Project Status</Label>
                          <Select
                            value={projectStatus}
                            onValueChange={(val) => {
                              setProjectStatus(val);
                              saveSandboxProgress({ projectStatus: val });
                            }}
                          >
                            <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-900">
                              <SelectValue placeholder="Planning" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-50 border-slate-300 text-slate-900">
                              <SelectItem value="Planning" className="focus:bg-white focus:text-slate-900">Planning</SelectItem>
                              <SelectItem value="Active" className="focus:bg-white focus:text-slate-900">Active</SelectItem>
                              <SelectItem value="Completed" className="focus:bg-white focus:text-slate-900">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contract-value" className="text-sm font-semibold text-slate-700">Contract Value ({getCurrencySymbol(currencyCode)})</Label>
                          <Input
                            id="contract-value"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={contractValue}
                            onChange={(e) => {
                              setContractValue(e.target.value);
                              saveSandboxProgress({ contractValue: e.target.value });
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="labour-budget" className="text-sm font-semibold text-slate-700">Labor Budget Cost ({getCurrencySymbol(currencyCode)})</Label>
                          <Input
                            id="labour-budget"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={budgetLabourCost}
                            onChange={(e) => {
                              setBudgetLabourCost(e.target.value);
                              saveSandboxProgress({ budgetLabourCost: e.target.value });
                            }}
                            className="bg-slate-50 border-slate-300 text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="project-start-date" className="text-sm font-semibold text-slate-700">Project Start Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                            <Input
                              id="project-start-date"
                              type="date"
                              value={projectStartDate}
                              onClick={(e) => {
                                try {
                                  e.currentTarget.showPicker();
                                } catch (err) {
                                  console.warn("showPicker is not supported", err);
                                }
                              }}
                              onChange={(e) => {
                                setProjectStartDate(e.target.value);
                                saveSandboxProgress({ projectStartDate: e.target.value });
                              }}
                              className="bg-slate-50 border-slate-300 text-slate-900 pl-10 cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-end-date" className="text-sm font-semibold text-slate-700">Project End Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                            <Input
                              id="project-end-date"
                              type="date"
                              value={projectEndDate}
                              onClick={(e) => {
                                try {
                                  e.currentTarget.showPicker();
                                } catch (err) {
                                  console.warn("showPicker is not supported", err);
                                }
                              }}
                              onChange={(e) => {
                                setProjectEndDate(e.target.value);
                                saveSandboxProgress({ projectEndDate: e.target.value });
                              }}
                              className="bg-slate-50 border-slate-300 text-slate-900 pl-10 cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project-desc" className="text-sm font-semibold text-slate-700">Project Description (Optional)</Label>
                        <Textarea
                          id="project-desc"
                          placeholder="Provide details about the work scope, safety compliance notes, etc."
                          value={projectDescription}
                          onChange={(e) => {
                            setProjectDescription(e.target.value);
                            saveSandboxProgress({ projectDescription: e.target.value });
                          }}
                          rows={2}
                          className="bg-slate-50 border-slate-300 text-slate-900 focus:ring-indigo-600 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2 - SUBSTEP 3: Planned Budgets & Cost Categories */}
                  {step === 2 && subStep === 3 && (
                    <div className="space-y-4">
                      {wizardPlannedCosts.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {wizardPlannedCosts.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-100 border border-slate-200">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-slate-800 text-white border-none text-[9px] font-mono uppercase">
                                  {item.category}
                                </Badge>
                                <span className="font-semibold text-slate-800">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-700">
                                  ${item.budget_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-100 shrink-0"
                                  onClick={() => {
                                    setWizardPlannedCosts(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Add Form Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Category (e.g. Marketing)"
                          value={newWizardCostCategory}
                          onChange={(e) => setNewWizardCostCategory(e.target.value)}
                          className="h-9 text-xs bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-blue-500"
                        />
                        <Input
                          placeholder="Description (e.g. Ad Campaign)"
                          value={newWizardCostTitle}
                          onChange={(e) => setNewWizardCostTitle(e.target.value)}
                          className="h-9 text-xs bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Budget ($)"
                            value={newWizardCostBudget}
                            onChange={(e) => setNewWizardCostBudget(e.target.value)}
                            className="h-9 text-xs bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-blue-500 flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (!newWizardCostCategory.trim() || !newWizardCostTitle.trim()) {
                                toast.error("Category and description are required.");
                                return;
                              }
                              setWizardPlannedCosts(prev => [
                                ...prev,
                                {
                                  category: newWizardCostCategory.trim(),
                                  title: newWizardCostTitle.trim(),
                                  budget_amount: Number(newWizardCostBudget) || 0.0,
                                }
                              ]);
                              setNewWizardCostCategory("");
                              setNewWizardCostTitle("");
                              setNewWizardCostBudget("");
                            }}
                            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 shrink-0 rounded-md"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Worksite Coordinates Form */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="geofence-name" className="text-sm font-semibold text-slate-700">Worksite Zone Name</Label>
                        <Input
                          id="geofence-name"
                          placeholder="e.g. Main Site Gate A, HQ Building, North Warehouse"
                          value={geofenceName}
                          onChange={(e) => {
                            setGeofenceName(e.target.value);
                            saveSandboxProgress({ geofenceName: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900"
                        />
                        <p className="text-xs text-slate-500">A descriptive label for this worksite zone.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="geofence-address" className="text-sm font-semibold text-slate-700">Worksite Physical Address</Label>
                        <Input
                          id="geofence-address"
                          ref={mapSearchInputRef}
                          placeholder="Type address to search and pin on map..."
                          value={geofenceAddress}
                          onChange={(e) => {
                            setGeofenceAddress(e.target.value);
                            saveSandboxProgress({ geofenceAddress: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900"
                        />
                        <p className="text-xs text-slate-500">Search for the physical address — selecting it pins the location on the map below.</p>
                      </div>

                      {/* Circular Radius Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <Label className="text-slate-700">Tracking Geofence Radius</Label>
                          <span className="font-mono text-blue-400 font-bold">{radius} meters</span>
                        </div>
                        <Slider
                          min={100}
                          max={500}
                          step={25}
                          value={[radius]}
                          onValueChange={([val]) => {
                            setRadius(val);
                            saveSandboxProgress({ radius: val });
                          }}
                          className="py-2"
                        />
                      </div>

                      {/* Google Map Selector Container */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Coordinates Map (Click Map to Select Worksite Center)</Label>
                        <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-950 relative">
                          <Map
                            defaultCenter={coords}
                            defaultZoom={14}
                            gestureHandling="greedy"
                            mapId={CLEAN_MAP_ID}
                            onClick={(e) => {
                              if (e.detail?.latLng) {
                                const newC = e.detail.latLng;
                                setCoords(newC);
                                saveSandboxProgress({ coords: newC });
                              }
                            }}
                            disableDefaultUI={false}
                          >
                            <AdvancedMarker position={coords} />
                            <MapCircle center={coords} radius={radius} />
                            <MapHandler center={coords} />
                          </Map>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-500" /> Currently Selected: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Crew Provisioning Form */}
                  {step === 4 && (
                    <div className="space-y-4">
                      {wizardMode !== "public-sandbox" && existingStaff.length > 0 && (
                        <div className="flex border border-slate-300 rounded-lg overflow-hidden p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setCrewMode("create")}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              crewMode === "create"
                                ? "bg-blue-600 text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Create New Crew Member
                          </button>
                          <button
                            type="button"
                            onClick={() => setCrewMode("select")}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              crewMode === "select"
                                ? "bg-blue-600 text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Select Existing Crew Member
                          </button>
                        </div>
                      )}

                      {crewMode === "create" ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="staff-name" className="text-sm font-semibold text-slate-700">Crew Member Full Name</Label>
                            <Input
                              id="staff-name"
                              placeholder="e.g. John Doe"
                              value={staffName}
                              onChange={(e) => {
                                setStaffName(e.target.value);
                                saveSandboxProgress({ staffName: e.target.value });
                              }}
                              className="bg-slate-50 border-slate-300 text-slate-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="staff-username" className="text-sm font-semibold text-slate-700">Username Suffix</Label>
                            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                              <span className="bg-slate-900 border-r border-slate-300 text-blue-400 font-mono text-sm px-3 py-2 select-none">
                                @{(companyPrefix || "PREFIX").toLowerCase()}_
                              </span>
                              <Input
                                id="staff-username"
                                placeholder="johndoe"
                                value={staffUsernameSuffix}
                                onChange={(e) => {
                                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                                  setStaffUsernameSuffix(val);
                                  saveSandboxProgress({ staffUsernameSuffix: val });
                                }}
                                className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 flex-1"
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              Field crew member will log in with username: <span className="font-mono text-slate-900 font-medium">{formattedStaffUsername}</span>
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="crew-email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                              <Input
                                id="crew-email"
                                type="email"
                                placeholder="crew@company.com"
                                value={crewEmail}
                                onChange={(e) => {
                                  setCrewEmail(e.target.value);
                                  saveSandboxProgress({ crewEmail: e.target.value });
                                }}
                                className="bg-slate-50 border-slate-300 text-slate-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="crew-phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                              <div className="flex gap-2">
                                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-md pl-1.5 pr-0.5 w-[82px] shrink-0 focus-within:ring-2 focus-within:ring-blue-500">
                                  <span className="mr-0.5 select-none text-base">{getFlagFromDialCode(crewPhoneDialCode)}</span>
                                  <Input
                                    type="text"
                                    placeholder="+1"
                                    value={crewPhoneDialCode}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      if (val.length > 0 && !val.startsWith("+")) {
                                        val = "+" + val.replace(/[^0-9]/g, "");
                                      } else {
                                        val = "+" + val.slice(1).replace(/[^0-9]/g, "");
                                      }
                                      setCrewPhoneDialCode(val);
                                      saveSandboxProgress({ crewPhoneDialCode: val });
                                    }}
                                    className="border-0 bg-transparent p-0 text-slate-900 placeholder-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 w-[30px] text-xs h-8"
                                  />
                                  <Popover open={crewPhoneOpen} onOpenChange={setCrewPhoneOpen}>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-500 hover:text-slate-900 p-0 shrink-0">
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0 bg-white border-slate-300 text-slate-900">
                                      <Command className="bg-transparent text-slate-900">
                                        <CommandInput placeholder="Search country or code..." className="border-0 focus:ring-0 text-slate-900 bg-slate-50" />
                                        <CommandEmpty className="py-2 text-center text-xs text-slate-500">No country found.</CommandEmpty>
                                        <CommandGroup>
                                          <CommandList className="max-h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {countriesList.map((c) => (
                                              <CommandItem
                                                key={c.code}
                                                value={c.name + " " + c.dial_code}
                                                onSelect={() => {
                                                  setCrewPhoneDialCode(c.dial_code);
                                                  setCrewPhoneOpen(false);
                                                  saveSandboxProgress({ crewPhoneDialCode: c.dial_code });
                                                }}
                                                className="hover:bg-[#1f355c] cursor-pointer py-2 px-3 text-xs flex justify-between items-center"
                                              >
                                                <span className="flex items-center gap-2">
                                                  <span>{c.flag}</span>
                                                  <span className="text-slate-700 font-sans truncate max-w-[120px]">{c.name}</span>
                                                </span>
                                                <span className="font-mono text-slate-500 font-semibold">{c.dial_code}</span>
                                              </CommandItem>
                                            ))}
                                          </CommandList>
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <Input
                                  id="crew-phone"
                                  placeholder="(555) 000-0000"
                                  value={crewPhone}
                                  onChange={(e) => {
                                    setCrewPhone(e.target.value);
                                    saveSandboxProgress({ crewPhone: e.target.value });
                                  }}
                                  className="bg-slate-50 border-slate-300 text-slate-900 flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="staff-pass" className="text-sm font-semibold text-slate-700">Password</Label>
                            <div className="relative">
                              <Input
                                id="staff-pass"
                                type={showCrewPassword ? "text" : "password"}
                                placeholder="At least 6 characters"
                                value={staffPassword}
                                onChange={(e) => {
                                  setStaffPassword(e.target.value);
                                  saveSandboxProgress({ staffPassword: e.target.value });
                                }}
                                className="bg-slate-50 border-slate-300 text-slate-900 font-mono pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCrewPassword(!showCrewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                                tabIndex={-1}
                              >
                                {showCrewPassword ? (
                                  <EyeOff className="h-4 w-4 shrink-0" />
                                ) : (
                                  <Eye className="h-4 w-4 shrink-0" />
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="select-existing-staff" className="text-sm font-semibold text-slate-700">Select Existing Crew Member</Label>
                          <Select
                            value={selectedStaffId}
                            onValueChange={(val) => {
                              setSelectedStaffId(val);
                              const matched = existingStaff.find(s => s.id === val);
                              if (matched) {
                                setStaffName(matched.full_name);
                                const rawUser = matched.username;
                                const prefixVal = companyPrefix.toUpperCase();
                                if (rawUser.startsWith(prefixVal)) {
                                  setStaffUsernameSuffix(rawUser.substring(prefixVal.length).toLowerCase());
                                } else {
                                  setStaffUsernameSuffix(rawUser.toLowerCase());
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-900">
                              <SelectValue placeholder="Choose a crew member" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-50 border-slate-300 text-slate-900">
                              {existingStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="focus:bg-white focus:text-slate-900">
                                  {s.full_name} ({s.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            The scheduled tasks and work orders will be assigned to this existing crew profile.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 5: Work Order Form */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="job-title" className="text-sm font-semibold text-slate-700">Job Scope Title</Label>
                        <Input
                          id="job-title"
                          placeholder="e.g. Electrical Installation & Verification"
                          value={jobTitle}
                          onChange={(e) => {
                            setJobTitle(e.target.value);
                            saveSandboxProgress({ jobTitle: e.target.value });
                          }}
                          className="bg-slate-50 border-slate-300 text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job-start" className="text-sm font-semibold text-slate-700">Scheduled Start</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                            <Input
                              id="job-start"
                              type="datetime-local"
                              value={jobStart}
                              onClick={(e) => {
                                try {
                                  e.currentTarget.showPicker();
                                } catch (err) {
                                  console.warn("showPicker is not supported in this browser", err);
                                }
                              }}
                              onChange={(e) => {
                                setJobStart(e.target.value);
                                saveSandboxProgress({ jobStart: e.target.value });
                              }}
                              className="bg-slate-50 border-slate-300 text-slate-900 pl-10 text-xs sm:text-sm cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="job-end" className="text-sm font-semibold text-slate-700">Scheduled End</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                            <Input
                              id="job-end"
                              type="datetime-local"
                              value={jobEnd}
                              onClick={(e) => {
                                try {
                                  e.currentTarget.showPicker();
                                } catch (err) {
                                  console.warn("showPicker is not supported in this browser", err);
                                }
                              }}
                              onChange={(e) => {
                                setJobEnd(e.target.value);
                                saveSandboxProgress({ jobEnd: e.target.value });
                              }}
                              className="bg-slate-50 border-slate-300 text-slate-900 pl-10 text-xs sm:text-sm cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job-desc" className="text-sm font-semibold text-slate-700">Task Checklist / Work Scope Description (Optional)</Label>
                        <Textarea
                          id="job-desc"
                          placeholder="Add details, materials checklist, safety codes, or client-specific orders."
                          value={jobDescription}
                          onChange={(e) => {
                            setJobDescription(e.target.value);
                            saveSandboxProgress({ jobDescription: e.target.value });
                          }}
                          rows={3}
                          className="bg-slate-50 border-slate-300 text-slate-900 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Deploy / Review Setup Form */}
                  {step === 6 && (
                    <div className="space-y-6">
                      {/* Interactive preview panel summarizing data in standard card */}
                      <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 sm:p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Configuration Preview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {wizardMode !== "new-project" && (
                            <div>
                              <span className="text-slate-500 block font-medium">Company Profile</span>
                              <span className="text-slate-800 font-semibold">{companyName} (Prefix: {companyPrefix}, Currency: {currencyCode})</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500 block font-medium">Project Scope</span>
                            <span className="text-slate-800 font-semibold">{projectName} for {customerName} ({getCurrencySymbol(currencyCode)}{parseFloat(contractValue).toLocaleString("en-US", { minimumFractionDigits: 2 })})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium">Geofence Coordinate Zone</span>
                            <span className="text-slate-800 font-semibold">{geofenceName}{geofenceAddress ? ` — ${geofenceAddress}` : ''} ({radius}m radius)</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium">Provisioned Crew Member</span>
                            <span className="text-slate-800 font-semibold">{staffName} ({formattedStaffUsername})</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-500 block font-medium">Scheduled Work Order</span>
                            <span className="text-slate-800 font-semibold">{jobTitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Display registration form in Sandbox mode */}
                      {wizardMode === "public-sandbox" ? (
                        <form onSubmit={handleDeployPublic} className="space-y-4 pt-2">
                          <div className="text-sm font-semibold text-blue-400 flex items-center gap-1.5 border-b border-slate-300/40 pb-2 mb-3">
                            <Lock className="h-4 w-4" /> Create Administrator Account
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-700">Admin Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="you@company.com"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                className="bg-slate-50 border-slate-300 text-slate-900 pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-pass" className="text-sm font-semibold text-slate-700">Dashboard Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                              <Input
                                id="signup-pass"
                                type="password"
                                placeholder="•••••••• (Min 6 characters)"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                className="bg-slate-50 border-slate-300 text-slate-900 pl-10 font-mono"
                                required
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 text-base shadow-md transition-all"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deploying Configuration...
                              </>
                            ) : (
                              <>
                                Create Account & Save Setup <ArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        </form>
                      ) : (
                        <div className="pt-4">
                          <Button
                            onClick={handleDeployAuth}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 text-base shadow-md transition-all"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deploying Configuration...
                              </>
                            ) : (
                              <>
                                Save & Publish Project <ArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Back and Next navigation links */}
                {step <= 5 && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/80 flex justify-between items-center gap-4 rounded-b-2xl">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={step === 1}
                      className="gap-1.5 text-slate-500 hover:text-slate-900 font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {step === 6 && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/80 flex justify-start items-center rounded-b-2xl">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="gap-1.5 text-slate-500 hover:text-slate-900 font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* STEP 7: Crew Handover & QR Success View */}
            {step === 7 && (
              <Card className="bg-white/60 border-slate-300/80 shadow-2xl relative overflow-hidden backdrop-blur-sm text-slate-900 text-center py-6">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 mb-2">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">You are all set! Your setup has been deployed</CardTitle>
                  <CardDescription className="text-slate-500 text-sm leading-relaxed">
                    Fantastic job! We have created your company, client, geofence, crew profile, and job. Now, simply share these mobile login credentials with your crew member so they can download the app and connect their device.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 space-y-6">
                  {/* Share credential card details */}
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-sm font-bold text-slate-800">Field Crew Login Details</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCredentials}
                        className="h-8 text-xs text-blue-400 hover:text-slate-900 hover:bg-slate-800"
                      >
                        {copiedCreds ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" /> Copy Details
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex justify-between items-center h-8">
                        <span className="text-slate-500 text-xs">Crew Member Name:</span>
                        <span className="text-slate-900 font-semibold">{staffName}</span>
                      </div>
                      <div className="flex justify-between items-center h-8">
                        <span className="text-slate-500 text-xs">Login Username:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-400 font-bold">{formattedStaffUsername}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(formattedStaffUsername);
                              toast.success("Username copied!");
                            }}
                            className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Copy Username"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center h-8">
                        <span className="text-slate-500 text-xs">Login Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 font-bold">{staffPassword}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(staffPassword);
                              toast.success("Password copied!");
                            }}
                            className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Copy Password"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modern social sharing toolbar */}
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 text-left space-y-3">
                    <span className="text-sm font-bold text-slate-800 block border-b border-slate-200 pb-2">
                      Quick Share with Crew Member
                    </span>
                    <p className="text-xs text-slate-500">
                      Instantly share the setup credentials and download link through standard communication channels:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Hi ${staffName}, here are your login credentials for FiledCrews:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}\n\nDownload Link: ${window.location.origin}/downloads/Ocrem.apk`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                      </a>

                      {/* Telegram */}
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + "/downloads/Ocrem.apk")}&text=${encodeURIComponent(
                          `Hi ${staffName}, here are your credentials for FiledCrews:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-sky-400 border-sky-500/20 hover:bg-sky-500/10 hover:text-sky-300"
                        >
                          <Send className="h-4 w-4" />
                          Telegram
                        </Button>
                      </a>

                      {/* Email */}
                      <a
                        href={`mailto:?subject=${encodeURIComponent(
                          "FiledCrews Login Credentials"
                        )}&body=${encodeURIComponent(
                          `Hi ${staffName},\n\nHere are your login credentials for the FiledCrews app:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}\n\nDownload and install the app package here: ${window.location.origin}/downloads/Ocrem.apk\n\nBest regards,\nYour Operations Manager`
                        )}`}
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                      </a>

                      {/* Native Share / Clipboard backup */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const text = `Hi ${staffName}, here are your login credentials for FiledCrews:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}\n\nDownload Link: ${window.location.origin}/downloads/Ocrem.apk`;
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: "Crew App Credentials",
                                text: text,
                              });
                            } catch (err) {
                              console.warn("Share cancelled", err);
                            }
                          } else {
                            navigator.clipboard.writeText(text);
                            toast.success("Credentials copied for manual sharing!");
                          }
                        }}
                        className="w-full gap-1.5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        <Share2 className="h-4 w-4" />
                        Share Sheet
                      </Button>
                    </div>
                  </div>

                  {/* Share QR download apk */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center border border-slate-300 rounded-xl p-5 bg-slate-50">
                    <div className="text-left space-y-2">
                      <h4 className="text-sm font-bold text-slate-800">Download Mobile APK</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Field crew members must install the Android APK package directly to start location and face tracking.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyApkLink}
                        className="gap-1.5 mt-2 h-9 text-xs border-slate-300 text-blue-400 hover:text-slate-900"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy APK Link
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg w-fit mx-auto">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(window.location.origin + "/downloads/Ocrem.apk")}`}
                        alt="Download APK QR Code"
                        className="h-[130px] w-[130px]"
                      />
                      <span className="text-[10px] text-slate-900 font-bold font-mono mt-1">SCAN TO DOWNLOAD</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleFinish}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 font-bold h-11 text-base shadow-lg"
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProjectSetupWizard() {
  const [apiKey, setApiKey] = useState<string>("AIzaSyC9uIJFFtEeqXJDCQdz-m346o3B7X7cZNw");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-maps-key");
        if (data?.key) {
          setApiKey(data.key);
        }
      } catch (e) {
        console.warn("Could not retrieve dynamic maps key. Falling back to default.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <ProjectSetupWizardContent apiKey={apiKey} />
    </APIProvider>
  );
}
