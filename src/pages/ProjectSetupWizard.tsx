import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, company, loading, createCompany } = useAuth();
  const navigate = useNavigate();

  const computePrefix = (name: string) => {
    const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
    return clean.slice(0, 5) || "ONST";
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
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Buffer state definitions
  const [companyName, setCompanyName] = useState("");
  const [companyPrefix, setCompanyPrefix] = useState("");
  const [companyVertical, setCompanyVertical] = useState<string>("General");

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
  const [introStep, setIntroStep] = useState(1); // 1 to 5 for clay-style card introduction
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCrewPassword, setShowCrewPassword] = useState(false);

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
          () => console.log("Geolocation permission denied. Using default coords.")
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
        if (companyPrefix.length !== 5 || !/^[A-Z]{5}$/.test(companyPrefix)) {
          toast.error("Prefix must be exactly 5 letters (A-Z)");
          return false;
        }
        return true;
      case 2:
        if (!customerName.trim()) {
          toast.error("Client Name is required");
          return false;
        }
        if (!projectName.trim()) {
          toast.error("Project Title is required");
          return false;
        }
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
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
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
        const { data: comp, error: compErr } = await supabase
          .from("companies")
          .insert({
            name: companyName.trim(),
            prefix: companyPrefix.toUpperCase(),
            auth_user_id: userId,
            currency: currencyCode,
            industry: companyVertical,
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

  if (loading || !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c121f]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (wizardMode === "public-sandbox" && introStep <= 5 && !user) {
    return (
      <>
        <SEO
          title="Onboarding — OnSite Crew Manager"
          description="Clay-style enterprise onboarding wizard."
          path="/wizard"
          noIndex
        />
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden font-sans select-none">
          {/* Subtle decorative glow blur spheres */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Clean minimal top logo/nav */}
          <div className="w-full max-w-xl flex items-center justify-between mb-8 z-10">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="Ocrem Logo" className="h-8 w-8 rounded-lg" />
              <span className="text-base font-extrabold text-white tracking-tight">OnSite Crew Manager</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-[#14223c] rounded-full border border-[#233558]/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                  style={{ width: `${(introStep / 5) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{introStep} of 5</span>
            </div>
          </div>

          {/* Main Card Container */}
          <Card className="w-full max-w-xl bg-[#14223c]/40 border-[#233558]/60 shadow-2xl relative overflow-hidden backdrop-blur-md text-slate-100 z-10 p-6 md:p-8 rounded-2xl">
            <div className="space-y-6">
              
              {/* Card 1: Company Name */}
              {introStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Get Started</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">What is your company's name?</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      We'll set up your personalized enterprise workspace under this name.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="intro-company-name" className="text-xs font-semibold text-slate-300 uppercase">Company Name</Label>
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
                      className="bg-[#0c121f] border-[#233558] text-slate-100 text-base h-12 focus:ring-blue-500 focus:border-blue-500 px-4 rounded-lg"
                    />
                  </div>
                  {companyName && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-400">Generated crew prefix code:</span>
                      <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">@{companyPrefix}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Card 2: Company Address */}
              {introStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">HQ Location</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Where is your company located?</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      This establishes your region for local mapping and geofence tracking.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="intro-company-address" className="text-xs font-semibold text-slate-300 uppercase">Headquarters Address</Label>
                    <Input
                      id="intro-company-address"
                      ref={companyAddressInputRef}
                      placeholder="Search or enter address"
                      value={companyAddress}
                      onChange={(e) => {
                        setCompanyAddress(e.target.value);
                        saveSandboxProgress({ companyAddress: e.target.value });
                      }}
                      className="bg-[#0c121f] border-[#233558] text-slate-100 text-base h-12 focus:ring-blue-500 focus:border-blue-500 px-4 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Card 3: Website, Staff Size, and Revenue */}
              {introStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Metadata</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Tell us about your operations</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      We'll configure your dashboard parameters based on your team structure.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="intro-company-website" className="text-xs font-semibold text-slate-300 uppercase">Company Website</Label>
                      <Input
                        id="intro-company-website"
                        placeholder="www.company.com"
                        value={companyWebsite}
                        onChange={(e) => {
                          setCompanyWebsite(e.target.value);
                          saveSandboxProgress({ companyWebsite: e.target.value });
                        }}
                        className="bg-[#0c121f] border-[#233558] text-slate-100 h-11 px-3 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="intro-staff-count" className="text-xs font-semibold text-slate-300 uppercase">Team Size</Label>
                        <select
                          id="intro-staff-count"
                          value={companyStaffCount}
                          onChange={(e) => {
                            setCompanyStaffCount(e.target.value);
                            saveSandboxProgress({ companyStaffCount: e.target.value });
                          }}
                          className="w-full bg-[#0c121f] border border-[#233558] text-slate-100 h-11 rounded-lg px-2 text-xs focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select size</option>
                          <option value="1-5">1-5 members</option>
                          <option value="6-15">6-15 members</option>
                          <option value="16-50">16-50 members</option>
                          <option value="51+">51+ members</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="intro-annual-revenue" className="text-xs font-semibold text-slate-300 uppercase font-mono">Annual Revenue</Label>
                        <select
                          id="intro-annual-revenue"
                          value={companyAnnualRevenue}
                          onChange={(e) => {
                            setCompanyAnnualRevenue(e.target.value);
                            saveSandboxProgress({ companyAnnualRevenue: e.target.value });
                          }}
                          className="w-full bg-[#0c121f] border border-[#233558] text-slate-100 h-11 rounded-lg px-2 text-xs focus:ring-blue-500 outline-none"
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
                      <Label className="text-xs font-semibold text-slate-300 uppercase">Default Currency</Label>
                      <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={currencyOpen}
                            className="w-full justify-between bg-[#0c121f] border-[#233558] text-slate-100 hover:bg-slate-900 hover:text-white h-11 px-3 py-2 text-xs rounded-lg"
                          >
                            {currencyCode ? (
                              <span className="flex items-center gap-2">
                                <span>{currenciesList.find(c => c.code === currencyCode)?.flag || "🌐"}</span>
                                <span className="font-mono font-semibold">{currencyCode}</span>
                                <span className="text-slate-400">({getCurrencySymbol(currencyCode)})</span>
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
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#14223c] border-[#233558] text-slate-100">
                          <Command className="bg-transparent text-slate-100">
                            <CommandInput placeholder="Search currency..." className="border-0 focus:ring-0 text-slate-100 bg-[#0c121f]" />
                            <CommandEmpty className="py-2 text-center text-xs text-slate-400">No currency found.</CommandEmpty>
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
                                      <span className="text-slate-400">({c.symbol})</span>
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

              {/* Card 4: Niche Industry Vertical */}
              {introStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Industry Vertical</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Select your operational niche</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      We calibrate vertical presets and workflows matching your business field.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { val: "HVAC", label: "HVAC Services" },
                      { val: "Plumbing", label: "Plumbing & Piping" },
                      { val: "Landscaping", label: "Landscaping & Lawn" },
                      { val: "Electrical", label: "Electrical Systems" },
                      { val: "Cleaning", label: "Commercial Cleaning" },
                      { val: "General Construction", label: "General Contractor" },
                      { val: "Pest Control", label: "Pest Extermination" },
                    ].map((v) => {
                      const isSelected = companyVertical === v.val;
                      return (
                        <button
                          key={v.val}
                          type="button"
                          onClick={() => {
                            applyVerticalPresets(v.val);
                          }}
                          className={cn(
                            "p-3 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between",
                            isSelected
                              ? "bg-blue-600/10 border-blue-500 text-white shadow-md shadow-blue-500/15"
                              : "bg-[#0c121f] border-[#233558]/60 text-slate-300 hover:border-slate-500"
                          )}
                        >
                          <span>{v.label}</span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-blue-400" />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        applyVerticalPresets("Other");
                      }}
                      className={cn(
                        "p-3 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between col-span-2",
                        companyVertical !== "HVAC" &&
                          companyVertical !== "Plumbing" &&
                          companyVertical !== "Landscaping" &&
                          companyVertical !== "Electrical" &&
                          companyVertical !== "Cleaning" &&
                          companyVertical !== "General Construction" &&
                          companyVertical !== "Pest Control"
                          ? "bg-blue-600/10 border-blue-500 text-white shadow-md shadow-blue-500/15"
                          : "bg-[#0c121f] border-[#233558]/60 text-slate-300 hover:border-slate-500"
                      )}
                    >
                      <span>Custom / Other Vertical</span>
                      {companyVertical !== "HVAC" &&
                        companyVertical !== "Plumbing" &&
                        companyVertical !== "Landscaping" &&
                        companyVertical !== "Electrical" &&
                        companyVertical !== "Cleaning" &&
                        companyVertical !== "General Construction" &&
                        companyVertical !== "Pest Control" && (
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                        )}
                    </button>
                  </div>
                  {companyVertical !== "HVAC" &&
                    companyVertical !== "Plumbing" &&
                    companyVertical !== "Landscaping" &&
                    companyVertical !== "Electrical" &&
                    companyVertical !== "Cleaning" &&
                    companyVertical !== "General Construction" &&
                    companyVertical !== "Pest Control" && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-vertical-name" className="text-xs font-semibold text-slate-300 uppercase">Specify Industry</Label>
                        <Input
                          id="custom-vertical-name"
                          placeholder="e.g. Roof Repair, Solar Install"
                          value={companyVertical === "Other" ? "" : companyVertical}
                          onChange={(e) => {
                            setCompanyVertical(e.target.value || "Other");
                            saveSandboxProgress({ companyVertical: e.target.value || "Other" });
                          }}
                          className="bg-[#0c121f] border-[#233558] text-slate-100 h-10 px-3 rounded-lg"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Card 5: Admin Credentials Signup */}
              {introStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Final Step</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Create your administrator account</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      You will use these credentials to log in to your desktop control board.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-first-name" className="text-[10px] font-semibold text-slate-400 uppercase">First Name</Label>
                        <Input
                          id="admin-first-name"
                          placeholder="John"
                          value={adminFirstName}
                          onChange={(e) => {
                            setAdminFirstName(e.target.value);
                            saveSandboxProgress({ adminFirstName: e.target.value });
                          }}
                          className="bg-[#0c121f] border-[#233558] text-slate-100 h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-last-name" className="text-[10px] font-semibold text-slate-400 uppercase">Last Name</Label>
                        <Input
                          id="admin-last-name"
                          placeholder="Doe"
                          value={adminLastName}
                          onChange={(e) => {
                            setAdminLastName(e.target.value);
                            saveSandboxProgress({ adminLastName: e.target.value });
                          }}
                          className="bg-[#0c121f] border-[#233558] text-slate-100 h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-email" className="text-[10px] font-semibold text-slate-400 uppercase">Email Address</Label>
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
                        className="bg-[#0c121f] border-[#233558] text-slate-100 h-10"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-phone" className="text-[10px] font-semibold text-slate-400 uppercase">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center bg-[#0c121f] border border-[#233558] rounded-md pl-1.5 pr-0.5 w-[82px] shrink-0 focus-within:ring-2 focus-within:ring-blue-500 h-10">
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
                              className="border-0 bg-transparent p-0 text-slate-100 placeholder-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 w-[30px] text-xs h-7"
                            />
                            <Popover open={adminPhoneOpen} onOpenChange={setAdminPhoneOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-white p-0 shrink-0">
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0 bg-[#14223c] border-[#233558] text-slate-100">
                                <Command className="bg-transparent text-slate-100">
                                  <CommandInput placeholder="Search country or code..." className="border-0 focus:ring-0 text-slate-100 bg-[#0c121f]" />
                                  <CommandEmpty className="py-2 text-center text-xs text-slate-400">No country found.</CommandEmpty>
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
                                            <span className="text-slate-300 font-sans truncate max-w-[120px]">{c.name}</span>
                                          </span>
                                          <span className="font-mono text-slate-400 font-semibold">{c.dial_code}</span>
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
                            className="bg-[#0c121f] border-[#233558] text-slate-100 h-10 flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-pass" className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Password</Label>
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
                            className="bg-[#0c121f] border-[#233558] text-slate-100 h-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
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
              <div className="border-t border-[#233558]/40 pt-5 mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (introStep > 1) {
                      const nextStep = introStep - 1;
                      setIntroStep(nextStep);
                      saveSandboxProgress({ introStep: nextStep });
                    }
                  }}
                  disabled={introStep === 1}
                  className="text-xs font-bold text-slate-400 hover:text-white"
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-5 h-10 rounded-lg shadow-lg flex items-center gap-1"
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
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

                        toast.success("Account created and company profile registered!");
                        
                        // Transition to the second wizard: Customer & Project (Step 2)
                        setStep(2);
                        const nextStep = 6;
                        setIntroStep(nextStep);
                        saveSandboxProgress({ introStep: nextStep, step: 2 });
                      } catch (err: any) {
                        toast.error(err.message || "Sign up failed. Please check inputs and retry.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold px-6 h-10 rounded-lg shadow-lg"
                  >
                    {saving ? "Registering..." : "Create Account & Start Setup"}
                  </Button>
                )}
              </div>

            </div>
          </Card>
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

      <div className="min-h-screen flex flex-col md:flex-row bg-[#0c121f] text-slate-100 font-sans antialiased">
        {/* Left Side: Progress tracker (Blue Background) */}
        <div className="hidden md:flex md:w-96 bg-[#14274e] border-r border-[#233558] p-8 flex-col justify-between shrink-0 sticky top-0 h-screen">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <img src="/favicon.png" alt="Ocrem Logo" className="h-9 w-9 rounded-lg" />
              <span className="text-xl font-bold tracking-tight text-white">OnSite Crew Manager</span>
            </div>

            <div className="space-y-1 mb-8">
              <h2 className="text-lg font-bold text-white">
                {wizardMode === "new-project" ? "Project Builder" : "Guided Setup Wizard"}
              </h2>
              <p className="text-xs text-slate-300">
                {wizardMode === "new-project"
                  ? "Launch a complete project stack in one unified sequence."
                  : "Experience the platform's core tracking capabilities first."}
              </p>
            </div>

            {/* Stepper Index Indicators */}
            {step <= 6 && (
              <div className="space-y-6 relative">
                {/* Vertical timeline connector */}
                <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-white/10 hidden md:block" />

                {activeStepsList.map((s, index) => {
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;

                  return (
                    <div key={s.num} className="flex gap-4 items-start relative z-10">
                      <div
                        className={`h-9 w-9 rounded-lg border flex items-center justify-center text-xs font-bold font-mono transition-all shrink-0 ${
                          isActive
                            ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-105"
                            : isCompleted
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                            : "bg-[#14223c]/40 border-[#233558]/80 text-slate-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : `0${index + 1}`}
                      </div>
                      <div className="hidden md:block">
                        <p className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : "text-slate-300"}`}>
                          {s.label}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden md:block text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} OnSite Crew Manager &middot; Enterprise Field Operations
          </div>
        </div>

        {/* Right Side: Step Card Forms */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-y-auto">
          <div className="w-full max-w-2xl">
            {step <= 6 && (
              <Card className="bg-[#14223c]/60 border-[#233558]/80 shadow-2xl relative overflow-hidden backdrop-blur-sm text-slate-100">
                <CardHeader className="border-b border-[#233558]/40 pb-5">
                  <div className="space-y-2">
                    <div className="flex justify-end items-center text-xs font-bold font-mono text-blue-400">
                      <span>
                        {Math.round(((step - (wizardMode === "new-project" ? 1 : 0)) / (wizardMode === "new-project" ? 5 : 6)) * 100)}% COMPLETE
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950/60 rounded-full border border-[#233558]/30">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.85)]"
                        style={{
                          width: `${Math.round(((step - (wizardMode === "new-project" ? 1 : 0)) / (wizardMode === "new-project" ? 5 : 6)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  {step === 1 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-white">Let's set up your company profile!</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 text-sm leading-relaxed">
                        Welcome to OnSite Crew Manager! Let's start by naming your company and choosing a short 5-letter prefix. This prefix helps your crew members log in easily from the mobile app (for example: @YOURCOMPANY_JOHN).
                      </CardDescription>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-white">Let's add your very first client!</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 text-sm leading-relaxed">
                        Every great project starts with a client. Tell us who you're doing work for, and name the specific project. This organizes your workspace, geofence logs, and timesheet reports perfectly from day one.
                      </CardDescription>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-white">Where is the worksite located?</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 text-sm leading-relaxed">
                        Let's mark the physical location on the map. Find your worksite, drop a pin, and adjust the radius. When your crew arrives or leaves, they can check in, and we'll automatically notify you.
                      </CardDescription>
                    </>
                  )}
                  {step === 4 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-white">Add your first crew member!</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 text-sm leading-relaxed">
                        Let's create the username and passcode for your first crew member so they can access the mobile app. They'll use this account to check in, update job details, and upload site photos.
                      </CardDescription>
                    </>
                  )}
                  {step === 5 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-white">Let's dispatch their first job checklist</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 text-sm leading-relaxed">
                        What tasks need to be completed at this worksite? Let's write down a checklist and schedule a date. Your assigned crew member will see it on their mobile app immediately, ready to update in real time.
                      </CardDescription>
                    </>
                  )}
                  {step === 6 && (
                    <>
                      <CardTitle className="text-2xl font-bold mt-2 text-white">Everything looks great! Let's deploy your setup</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 text-sm leading-relaxed">
                        {wizardMode === "public-sandbox"
                          ? "Let's review everything you've configured. Fill in your administrator details below, and we'll compile your company profile, project, geofence, and crew credentials instantly so you can launch your dashboard!"
                          : "Take a quick moment to verify your setup details below. Once you click 'Publish', we'll write this new project, geofence, and crew member to your active workspace database immediately!"}
                      </CardDescription>
                    </>
                  )}
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* STEP 2: Customer & Project Form */}
                  {step === 2 && (
                    <div className="space-y-6">
                      {/* Section A: Customer Details */}
                      <div className="space-y-4 border-b border-[#233558]/40 pb-4">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Client Information</h4>
                        <div className="space-y-2">
                          <Label htmlFor="customer-name" className="text-sm font-semibold text-slate-300">Client / Customer Name</Label>
                          <Input
                            id="customer-name"
                            placeholder="e.g. Chevron Nigeria Limited"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              saveSandboxProgress({ customerName: e.target.value });
                            }}
                            className="bg-[#0c121f] border-[#233558] text-slate-100"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customer-email" className="text-sm font-semibold text-slate-300">Client Email (Optional)</Label>
                            <Input
                              id="customer-email"
                              type="email"
                              placeholder="e.g. contact@client.com"
                              value={customerEmail}
                              onChange={(e) => {
                                setCustomerEmail(e.target.value);
                                saveSandboxProgress({ customerEmail: e.target.value });
                              }}
                              className="bg-[#0c121f] border-[#233558] text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-phone" className="text-sm font-semibold text-slate-300">Client Phone (Optional)</Label>
                            <div className="flex gap-2">
                              <div className="flex items-center bg-[#0c121f] border border-[#233558] rounded-md pl-1.5 pr-0.5 w-[82px] shrink-0 focus-within:ring-2 focus-within:ring-blue-500">
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
                                  className="bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-100 font-mono text-xs w-full"
                                />
                                <Popover open={phoneOpen} onOpenChange={setPhoneOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-white p-0 shrink-0">
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[280px] p-0 bg-[#14223c] border-[#233558] text-slate-100">
                                    <Command className="bg-transparent text-slate-100">
                                      <CommandInput placeholder="Search country or code..." className="border-0 focus:ring-0 text-slate-100 bg-[#0c121f]" />
                                      <CommandEmpty className="py-2 text-center text-xs text-slate-400">No country found.</CommandEmpty>
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
                                                <span className="text-slate-300 font-sans truncate max-w-[120px]">{c.name}</span>
                                              </span>
                                              <span className="font-mono text-slate-400 font-semibold">{c.dial_code}</span>
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
                                className="bg-[#0c121f] border-[#233558] text-slate-100 flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer-address" className="text-sm font-semibold text-slate-300">Billing Address (Optional)</Label>
                          <Input
                            id="customer-address"
                            ref={addressInputRef}
                            placeholder="e.g. 123 Corporate Way, Lagos"
                            value={customerBillingAddress}
                            onChange={(e) => {
                              setCustomerBillingAddress(e.target.value);
                              saveSandboxProgress({ customerBillingAddress: e.target.value });
                            }}
                            className="bg-[#0c121f] border-[#233558] text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Section B: Project Specifications */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Project Specifications</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="project-name" className="text-sm font-semibold text-slate-300">Project / Site Name</Label>
                            <Input
                              id="project-name"
                              placeholder="e.g. Escravos Refinery Expansion"
                              value={projectName}
                              onChange={(e) => {
                                setProjectName(e.target.value);
                                saveSandboxProgress({ projectName: e.target.value });
                              }}
                              className="bg-[#0c121f] border-[#233558] text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="project-status" className="text-sm font-semibold text-slate-300">Project Status</Label>
                            <Select
                              value={projectStatus}
                              onValueChange={(val) => {
                                setProjectStatus(val);
                                saveSandboxProgress({ projectStatus: val });
                              }}
                            >
                              <SelectTrigger className="bg-[#0c121f] border-[#233558] text-slate-100">
                                <SelectValue placeholder="Planning" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0c121f] border-[#233558] text-slate-100">
                                <SelectItem value="Planning" className="focus:bg-[#14223c] focus:text-white">Planning</SelectItem>
                                <SelectItem value="Active" className="focus:bg-[#14223c] focus:text-white">Active</SelectItem>
                                <SelectItem value="Completed" className="focus:bg-[#14223c] focus:text-white">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contract-value" className="text-sm font-semibold text-slate-300">Contract Value ({getCurrencySymbol(currencyCode)})</Label>
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
                              className="bg-[#0c121f] border-[#233558] text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="labour-budget" className="text-sm font-semibold text-slate-300">Labor Budget Cost ({getCurrencySymbol(currencyCode)})</Label>
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
                              className="bg-[#0c121f] border-[#233558] text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="project-start-date" className="text-sm font-semibold text-slate-300">Project Start Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
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
                                className="bg-[#0c121f] border-[#233558] text-slate-100 pl-10 cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="project-end-date" className="text-sm font-semibold text-slate-300">Project End Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
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
                                className="bg-[#0c121f] border-[#233558] text-slate-100 pl-10 cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="project-desc" className="text-sm font-semibold text-slate-300">Project Description (Optional)</Label>
                          <Textarea
                            id="project-desc"
                            placeholder="Provide details about the work scope, safety compliance notes, etc."
                            value={projectDescription}
                            onChange={(e) => {
                              setProjectDescription(e.target.value);
                              saveSandboxProgress({ projectDescription: e.target.value });
                            }}
                            rows={2}
                            className="bg-[#0c121f] border-[#233558] text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Worksite Coordinates Form */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="geofence-name" className="text-sm font-semibold text-slate-300">Worksite Zone Name</Label>
                        <Input
                          id="geofence-name"
                          placeholder="e.g. Main Site Gate A, HQ Building, North Warehouse"
                          value={geofenceName}
                          onChange={(e) => {
                            setGeofenceName(e.target.value);
                            saveSandboxProgress({ geofenceName: e.target.value });
                          }}
                          className="bg-[#0c121f] border-[#233558] text-slate-100"
                        />
                        <p className="text-xs text-slate-500">A descriptive label for this worksite zone.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="geofence-address" className="text-sm font-semibold text-slate-300">Worksite Physical Address</Label>
                        <Input
                          id="geofence-address"
                          ref={mapSearchInputRef}
                          placeholder="Type address to search and pin on map..."
                          value={geofenceAddress}
                          onChange={(e) => {
                            setGeofenceAddress(e.target.value);
                            saveSandboxProgress({ geofenceAddress: e.target.value });
                          }}
                          className="bg-[#0c121f] border-[#233558] text-slate-100"
                        />
                        <p className="text-xs text-slate-500">Search for the physical address — selecting it pins the location on the map below.</p>
                      </div>

                      {/* Circular Radius Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <Label className="text-slate-300">Tracking Geofence Radius</Label>
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
                        <Label className="text-sm font-semibold text-slate-300">Coordinates Map (Click Map to Select Worksite Center)</Label>
                        <div className="h-64 w-full rounded-xl overflow-hidden border border-[#233558] bg-slate-950 relative">
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
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-500" /> Currently Selected: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Crew Provisioning Form */}
                  {step === 4 && (
                    <div className="space-y-4">
                      {wizardMode !== "public-sandbox" && existingStaff.length > 0 && (
                        <div className="flex border border-[#233558] rounded-lg overflow-hidden p-0.5 bg-[#0c121f]">
                          <button
                            type="button"
                            onClick={() => setCrewMode("create")}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              crewMode === "create"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Create New Crew Member
                          </button>
                          <button
                            type="button"
                            onClick={() => setCrewMode("select")}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              crewMode === "select"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Select Existing Crew Member
                          </button>
                        </div>
                      )}

                      {crewMode === "create" ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="staff-name" className="text-sm font-semibold text-slate-300">Crew Member Full Name</Label>
                            <Input
                              id="staff-name"
                              placeholder="e.g. John Doe"
                              value={staffName}
                              onChange={(e) => {
                                setStaffName(e.target.value);
                                saveSandboxProgress({ staffName: e.target.value });
                              }}
                              className="bg-[#0c121f] border-[#233558] text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="staff-username" className="text-sm font-semibold text-slate-300">Username Suffix</Label>
                            <div className="flex items-center bg-[#0c121f] border border-[#233558] rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                              <span className="bg-slate-900 border-r border-[#233558] text-blue-400 font-mono text-sm px-3 py-2 select-none">
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
                                className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-100 flex-1"
                              />
                            </div>
                            <p className="text-xs text-slate-400">
                              Field crew member will log in with username: <span className="font-mono text-white font-medium">{formattedStaffUsername}</span>
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="crew-email" className="text-sm font-semibold text-slate-300">Email Address</Label>
                              <Input
                                id="crew-email"
                                type="email"
                                placeholder="crew@company.com"
                                value={crewEmail}
                                onChange={(e) => {
                                  setCrewEmail(e.target.value);
                                  saveSandboxProgress({ crewEmail: e.target.value });
                                }}
                                className="bg-[#0c121f] border-[#233558] text-slate-100"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="crew-phone" className="text-sm font-semibold text-slate-300">Phone Number</Label>
                              <div className="flex gap-2">
                                <div className="flex items-center bg-[#0c121f] border border-[#233558] rounded-md pl-1.5 pr-0.5 w-[82px] shrink-0 focus-within:ring-2 focus-within:ring-blue-500">
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
                                    className="border-0 bg-transparent p-0 text-slate-100 placeholder-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 w-[30px] text-xs h-8"
                                  />
                                  <Popover open={crewPhoneOpen} onOpenChange={setCrewPhoneOpen}>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-white p-0 shrink-0">
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0 bg-[#14223c] border-[#233558] text-slate-100">
                                      <Command className="bg-transparent text-slate-100">
                                        <CommandInput placeholder="Search country or code..." className="border-0 focus:ring-0 text-slate-100 bg-[#0c121f]" />
                                        <CommandEmpty className="py-2 text-center text-xs text-slate-400">No country found.</CommandEmpty>
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
                                                  <span className="text-slate-300 font-sans truncate max-w-[120px]">{c.name}</span>
                                                </span>
                                                <span className="font-mono text-slate-400 font-semibold">{c.dial_code}</span>
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
                                  className="bg-[#0c121f] border-[#233558] text-slate-100 flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="staff-pass" className="text-sm font-semibold text-slate-300">Password</Label>
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
                                className="bg-[#0c121f] border-[#233558] text-slate-100 font-mono pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCrewPassword(!showCrewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
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
                          <Label htmlFor="select-existing-staff" className="text-sm font-semibold text-slate-300">Select Existing Crew Member</Label>
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
                            <SelectTrigger className="bg-[#0c121f] border-[#233558] text-slate-100">
                              <SelectValue placeholder="Choose a crew member" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0c121f] border-[#233558] text-slate-100">
                              {existingStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="focus:bg-[#14223c] focus:text-white">
                                  {s.full_name} ({s.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-400">
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
                        <Label htmlFor="job-title" className="text-sm font-semibold text-slate-300">Job Scope Title</Label>
                        <Input
                          id="job-title"
                          placeholder="e.g. Electrical Installation & Verification"
                          value={jobTitle}
                          onChange={(e) => {
                            setJobTitle(e.target.value);
                            saveSandboxProgress({ jobTitle: e.target.value });
                          }}
                          className="bg-[#0c121f] border-[#233558] text-slate-100"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job-start" className="text-sm font-semibold text-slate-300">Scheduled Start</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
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
                              className="bg-[#0c121f] border-[#233558] text-slate-100 pl-10 text-xs sm:text-sm cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="job-end" className="text-sm font-semibold text-slate-300">Scheduled End</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
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
                              className="bg-[#0c121f] border-[#233558] text-slate-100 pl-10 text-xs sm:text-sm cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job-desc" className="text-sm font-semibold text-slate-300">Task Checklist / Work Scope Description (Optional)</Label>
                        <Textarea
                          id="job-desc"
                          placeholder="Add details, materials checklist, safety codes, or client-specific orders."
                          value={jobDescription}
                          onChange={(e) => {
                            setJobDescription(e.target.value);
                            saveSandboxProgress({ jobDescription: e.target.value });
                          }}
                          rows={3}
                          className="bg-[#0c121f] border-[#233558] text-slate-100 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Deploy / Review Setup Form */}
                  {step === 6 && (
                    <div className="space-y-6">
                      {/* Interactive preview panel summarizing data in standard card */}
                      <div className="bg-[#0c121f] border border-[#233558] rounded-xl p-4 sm:p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-200 border-b border-[#233558]/60 pb-2">Configuration Preview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {wizardMode !== "new-project" && (
                            <div>
                              <span className="text-slate-400 block font-medium">Company Profile</span>
                              <span className="text-slate-200 font-semibold">{companyName} (Prefix: {companyPrefix}, Currency: {currencyCode})</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400 block font-medium">Project Scope</span>
                            <span className="text-slate-200 font-semibold">{projectName} for {customerName} ({getCurrencySymbol(currencyCode)}{parseFloat(contractValue).toLocaleString("en-US", { minimumFractionDigits: 2 })})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Geofence Coordinate Zone</span>
                            <span className="text-slate-200 font-semibold">{geofenceName}{geofenceAddress ? ` — ${geofenceAddress}` : ''} ({radius}m radius)</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Provisioned Crew Member</span>
                            <span className="text-slate-200 font-semibold">{staffName} ({formattedStaffUsername})</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block font-medium">Scheduled Work Order</span>
                            <span className="text-slate-200 font-semibold">{jobTitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Display registration form in Sandbox mode */}
                      {wizardMode === "public-sandbox" ? (
                        <form onSubmit={handleDeployPublic} className="space-y-4 pt-2">
                          <div className="text-sm font-semibold text-blue-400 flex items-center gap-1.5 border-b border-[#233558]/40 pb-2 mb-3">
                            <Lock className="h-4 w-4" /> Create Administrator Account
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-300">Admin Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="you@company.com"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                className="bg-[#0c121f] border-[#233558] text-slate-100 pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-pass" className="text-sm font-semibold text-slate-300">Dashboard Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input
                                id="signup-pass"
                                type="password"
                                placeholder="•••••••• (Min 6 characters)"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                className="bg-[#0c121f] border-[#233558] text-slate-100 pl-10 font-mono"
                                required
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 text-base shadow-lg shadow-blue-600/20"
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
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 text-base shadow-lg"
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
                  <div className="border-t border-[#233558]/40 p-4 sm:p-6 bg-slate-900/20 flex justify-between items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={step === 2}
                      className="gap-1.5 text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 sm:px-6 shadow-md"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {step === 6 && (
                  <div className="border-t border-[#233558]/40 p-4 bg-slate-900/20 flex justify-start items-center">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="gap-1.5 text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* STEP 7: Crew Handover & QR Success View */}
            {step === 7 && (
              <Card className="bg-[#14223c]/60 border-[#233558]/80 shadow-2xl relative overflow-hidden backdrop-blur-sm text-slate-100 text-center py-6">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 mb-2">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">You are all set! Your setup has been deployed</CardTitle>
                  <CardDescription className="text-slate-400 text-sm leading-relaxed">
                    Fantastic job! We have created your company, client, geofence, crew profile, and job. Now, simply share these mobile login credentials with your crew member so they can download the app and connect their device.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 space-y-6">
                  {/* Share credential card details */}
                  <div className="bg-[#0c121f] border border-[#233558] rounded-xl p-5 text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-[#233558]/60 pb-2">
                      <span className="text-sm font-bold text-slate-200">Field Crew Login Details</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCredentials}
                        className="h-8 text-xs text-blue-400 hover:text-white hover:bg-slate-800"
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
                        <span className="text-slate-400 text-xs">Crew Member Name:</span>
                        <span className="text-white font-semibold">{staffName}</span>
                      </div>
                      <div className="flex justify-between items-center h-8">
                        <span className="text-slate-400 text-xs">Login Username:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-400 font-bold">{formattedStaffUsername}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(formattedStaffUsername);
                              toast.success("Username copied!");
                            }}
                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Copy Username"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center h-8">
                        <span className="text-slate-400 text-xs">Login Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{staffPassword}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(staffPassword);
                              toast.success("Password copied!");
                            }}
                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Copy Password"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modern social sharing toolbar */}
                  <div className="bg-[#0c121f] border border-[#233558] rounded-xl p-5 text-left space-y-3">
                    <span className="text-sm font-bold text-slate-200 block border-b border-[#233558]/60 pb-2">
                      Quick Share with Crew Member
                    </span>
                    <p className="text-xs text-slate-400">
                      Instantly share the setup credentials and download link through standard communication channels:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Hi ${staffName}, here are your login credentials for OnSite Crew Manager:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}\n\nDownload Link: ${window.location.origin}/downloads/Ocrem.apk`
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
                          `Hi ${staffName}, here are your credentials for OnSite Crew Manager:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}`
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
                          "OnSite Crew Manager Login Credentials"
                        )}&body=${encodeURIComponent(
                          `Hi ${staffName},\n\nHere are your login credentials for the OnSite Crew Manager app:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}\n\nDownload and install the app package here: ${window.location.origin}/downloads/Ocrem.apk\n\nBest regards,\nYour Operations Manager`
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
                          const text = `Hi ${staffName}, here are your login credentials for OnSite Crew Manager:\n\nUsername: ${formattedStaffUsername}\nPassword: ${staffPassword}\n\nDownload Link: ${window.location.origin}/downloads/Ocrem.apk`;
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center border border-[#233558] rounded-xl p-5 bg-[#0c121f]">
                    <div className="text-left space-y-2">
                      <h4 className="text-sm font-bold text-slate-200">Download Mobile APK</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Field crew members must install the Android APK package directly to start location and face tracking.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyApkLink}
                        className="gap-1.5 mt-2 h-9 text-xs border-[#233558] text-blue-400 hover:text-white"
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
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 text-base shadow-lg"
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
      <div className="min-h-screen flex items-center justify-center bg-[#0c121f]">
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
