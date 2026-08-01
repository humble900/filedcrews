import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Send,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  ExternalLink,
  ChevronLeft,
  Image as ImageIcon,
  Check,
  Info,
  Heart,
  FileCheck,
  ChevronDown,
  MoreVertical,
  Wrench,
  Sparkle,
  ShieldAlert,
  PenTool,
} from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import SignatureCanvas from "react-signature-canvas";

// ─── Types ──────────────────────────────────────────────────────────
interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface PricebookItem {
  id: string;
  item_name: string;
  unit_cost: number;
  kind: string;
  description: string | null;
  category: string | null;
  cost: number;
}

interface Estimate {
  id: string;
  company_id: string;
  customer_id: string;
  job_id: string | null;
  title: string;
  status: string;
  total_amount: number;
  valid_until: string | null;
  notes: string | null;
  approval_token: string;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  signature_url: string | null;
  customer?: Customer;
  introduction: string | null;
  introduction_image_url: string | null;
  discount_amount: number;
  tax_percent: number;
  disclaimer: string | null;
  client_message: string | null;
  planned_costs?: any;
}

interface EstimateItem {
  id?: string;
  pricebook_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  is_optional: boolean;
  selected_by_client: boolean;
  image_url: string | null;
}

interface EstimateOption {
  id?: string;
  name: string;
  is_recommended: boolean;
  items: EstimateItem[];
}

// Preset visual images
const HERO_IMAGE_PRESETS = [
  {
    name: "Furnace Compressor Unit",
    url: "/presets/heating_cover.jpg",
    desc: "HVAC heating systems cover"
  },
  {
    name: "AC Condenser Outdoor Unit",
    url: "/presets/cooling_cover.jpg",
    desc: "HVAC cooling & AC unit cover"
  },
  {
    name: "Hybrid Heat Pump",
    url: "/presets/cooling_cover.jpg",
    desc: "Energy-efficient hybrid system cover"
  },
  {
    name: "Suburban Green Yard",
    url: "/presets/landscaping_cover.jpg",
    desc: "Lawn and landscaping services cover"
  },
  {
    name: "High Power EV Station",
    url: "/presets/heating_cover.jpg",
    desc: "Electrical installations and charging cover"
  },
  {
    name: "Tankless Energy Heater",
    url: "/presets/cooling_cover.jpg",
    desc: "Plumbing and gas installations cover"
  },
  {
    name: "Corporate Office Care",
    url: "/presets/landscaping_cover.jpg",
    desc: "Deep sanitation and cleaning cover"
  },
  {
    name: "Asphalt Roof Shingles",
    url: "/presets/heating_cover.jpg",
    desc: "Roofing repair & exterior cover"
  },
  {
    name: "Smart Security Door Lock",
    url: "/presets/cooling_cover.jpg",
    desc: "Smart home automation & security cover"
  }
];

const ITEM_THUMBNAIL_PRESETS = [
  { name: "Heavy Equipment Unit", url: "/presets/equipment_thumbnail.jpg" },
  { name: "Control Dial Gauge", url: "/presets/tool_thumbnail.jpg" },
  { name: "Support Service Agreement", url: "/presets/warranty_thumbnail.jpg" },
  { name: "AC Condenser Fan", url: "/presets/equipment_thumbnail.jpg" },
  { name: "Roofing Materials", url: "/presets/tool_thumbnail.jpg" },
  { name: "Automation Lock", url: "/presets/warranty_thumbnail.jpg" }
];

// Seed templates in 9 key service niches
const SERVICE_TEMPLATES = [
  {
    name: "Furnace Installation & Setup (HVAC)",
    title: "HVAC Furnace Installation",
    introduction: "Choosing the right HVAC system shouldn't be confusing. Our Comfort System Guide helps you understand your options and feel confident knowing your installation is done safely, efficiently, and backed by ongoing support.",
    introduction_image_url: HERO_IMAGE_PRESETS[0].url,
    client_message: "All work is performed by certified HVAC technicians and includes system testing, calibration, and warranty registration.",
    disclaimer: "This quote is valid for the next 30 days, after which values may be subject to change.",
    options: [
      {
        name: "Standard Comfort System",
        is_recommended: true,
        items: [
          {
            name: "Mt. Cool 45,000 BTU Furnace",
            description: "45,000 BTU 95% AFUE Upflow/Horizontal Multi-Speed Low NOx Gas Furnace with 17.5 in. Cabinet. Includes removal of old furnace, installation of new unit, and performance checks.",
            quantity: 1,
            unit_price: 1032.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "One Year Service Contract",
            description: "Includes four seasonal filter exchanges, priority service scheduling, and discounted rates for repairs.",
            quantity: 1,
            unit_price: 375.00,
            is_optional: true,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[2].url,
            pricebook_id: null
          },
          {
            name: "Smart Thermostat Upgrade",
            description: "Upgrade to a Wi-Fi enabled smart thermostat (e.g. Ecobee or Nest) for optimized scheduling, remote control, and potential energy savings.",
            quantity: 1,
            unit_price: 250.00,
            is_optional: true,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "AC Installation & Cooling System (HVAC)",
    title: "HVAC AC System Installation",
    introduction: "Stay cool and comfortable all summer long. Our professional AC installation matches a high-efficiency outdoor condenser with matched indoor coils for premium energy savings.",
    introduction_image_url: HERO_IMAGE_PRESETS[1].url,
    client_message: "Includes condenser pad, refrigerant line set flush, electrical whip connection, and refrigerant charge calibration.",
    disclaimer: "Electrical service panel must support 240V double-pole breaker connection.",
    options: [
      {
        name: "Premium AC Cooling Package",
        is_recommended: true,
        items: [
          {
            name: "CoolTemp 16-SEER Condenser",
            description: "Premium high-efficiency outdoor air conditioner condenser unit with quiet-fan blade tech.",
            quantity: 1,
            unit_price: 2400.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[3].url,
            pricebook_id: null
          },
          {
            name: "Matched Evaporator Coil Upgrade",
            description: "Matched indoor cased cooling coil configured for optimal humidity extraction and airflow efficiency.",
            quantity: 1,
            unit_price: 850.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "Line Set Cover Slim Duct Upgrade",
            description: "Decorative PVC exterior protective line set covers to prevent UV wear and damage.",
            quantity: 1,
            unit_price: 180.00,
            is_optional: true,
            selected_by_client: false,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "Heat Pump & Hybrid Climate System (HVAC)",
    title: "Hybrid Heat Pump Upgrade",
    introduction: "Transition your home to eco-friendly, high-efficiency hybrid comfort. Heat pumps heat and cool with up to 300% energy efficiency, dramatically reducing fuel consumption.",
    introduction_image_url: HERO_IMAGE_PRESETS[2].url,
    client_message: "Qualifies for federal and local clean energy tax credits and utility rebates.",
    disclaimer: "Requires structural concrete base. Line set run limited to 50 linear feet.",
    options: [
      {
        name: "Hybrid Heat Pump System",
        is_recommended: true,
        items: [
          {
            name: "Inverter-Driven Heat Pump Unit",
            description: "Variable-speed cold climate heat pump designed for ultra-quiet performance down to -5°F.",
            quantity: 1,
            unit_price: 3800.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[3].url,
            pricebook_id: null
          },
          {
            name: "Variable Air Handler & Aux Heat Strips",
            description: "Matched indoor air handler unit with secondary heating back-up coil.",
            quantity: 1,
            unit_price: 1200.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "10-Year Extended Warranty Package",
            description: "Worry-free replacement guarantee on compressor parts, labor, and annual tune-ups.",
            quantity: 1,
            unit_price: 600.00,
            is_optional: true,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[2].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "Irrigation & Lawn Sod Setup (Landscaping)",
    title: "Lawn Sod & Irrigation Installation",
    introduction: "Prepare your home for visual exterior excellence. Our sod installation provides an instant, healthy lawn, and our automated sprinkler system secures growth with minimal maintenance.",
    introduction_image_url: HERO_IMAGE_PRESETS[3].url,
    client_message: "Includes site grading, soil preparation, weed removal, sod installation, and sprinkler layout.",
    disclaimer: "Pricing assumes standard soil conditions and clear access to water valves.",
    options: [
      {
        name: "Premium Turf Sod Package",
        is_recommended: true,
        items: [
          {
            name: "Kentucky Bluegrass Sod Rolls (500 sq ft)",
            description: "Premium weed-free sod rolls delivered, graded, and rolled for instant root grip.",
            quantity: 1,
            unit_price: 850.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "Smart Sprinkler Control Station",
            description: "Automated 6-zone weather-sensing sprinkler timer for optimal watering cycles.",
            quantity: 1,
            unit_price: 320.00,
            is_optional: true,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "EV Charger & Panel Upgrade (Electrical)",
    title: "Level 2 EV Charger & Panel Swap",
    introduction: "Secure your home power grid for high-speed vehicle charging. This package delivers a professional charger installation alongside an electrical panel swap for ultimate safety.",
    introduction_image_url: HERO_IMAGE_PRESETS[4].url,
    client_message: "All wiring and breakers conform to standard local electrical codes.",
    disclaimer: "Permit fees are not included and will be billed separately at cost.",
    options: [
      {
        name: "EV Charging Infrastructure",
        is_recommended: true,
        items: [
          {
            name: "240V Level 2 EV Charger Installation",
            description: "Professional wall mount installation of customer-supplied EV charger, including 50A breaker and run up to 30 feet.",
            quantity: 1,
            unit_price: 650.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "200-Amp Panel Upgrade Upgrade",
            description: "Swap old electrical breaker panel for a modern 200-amp panel to ensure code compliance.",
            quantity: 1,
            unit_price: 1800.00,
            is_optional: true,
            selected_by_client: false,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "Tankless Water Heater Setup (Plumbing)",
    title: "Tankless Water Heater Installation",
    introduction: "Never run out of hot water again. Our high-efficiency tankless water heater saves space, reduces monthly energy bills, and delivers continuous hot water on demand.",
    introduction_image_url: HERO_IMAGE_PRESETS[5].url,
    client_message: "Includes disposal of old water tank, gas hookup, ventilation piping, and thermal expansion checks.",
    disclaimer: "Requires standard ventilation clearance. Gas line upgrades if required will be quoted on-site.",
    options: [
      {
        name: "Endless Hot Water Setup",
        is_recommended: true,
        items: [
          {
            name: "199,000 BTU Tankless Water Heater Unit",
            description: "High-efficiency condensing tankless gas water heater with built-in recirculation pump.",
            quantity: 1,
            unit_price: 2400.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "Water Softener Connection System",
            description: "Point-of-entry salt-free water conditioner system to prevent mineral scale build-up inside plumbing.",
            quantity: 1,
            unit_price: 950.00,
            is_optional: true,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "Deep Sanitation Package (Cleaning)",
    title: "Corporate deep cleaning proposal",
    introduction: "Provide a clean and sanitized workspace for your staff and clients. Our high-grade sanitation package covers all heavy contact points, surfaces, and common areas.",
    introduction_image_url: HERO_IMAGE_PRESETS[6].url,
    client_message: "Includes EPA-approved disinfectants, micro-fiber sanitization sweeps, and air purification spray.",
    disclaimer: "Sanitation is scheduled after standard operating hours unless otherwise agreed.",
    options: [
      {
        name: "Standard Facility Care",
        is_recommended: true,
        items: [
          {
            name: "Full Deep Sanitization Clean",
            description: "Complete cleaning and disinfection of office surfaces, bathrooms, kitchens, and tech keyboards.",
            quantity: 1,
            unit_price: 450.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "Air Duct Sanitation Spray Add-on",
            description: "HEPA air sweep and sanitizing spray treatment inside active ventilation intake grills.",
            quantity: 1,
            unit_price: 150.00,
            is_optional: true,
            selected_by_client: false,
            image_url: ITEM_THUMBNAIL_PRESETS[2].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "Gutter & Roof Leak Repair (Roofing)",
    title: "Exterior Roof & Gutter Repairs",
    introduction: "Secure your home exterior from water infiltration. We inspect and reinforce your roofing shingles and install premium aluminum gutters for optimal drainage.",
    introduction_image_url: HERO_IMAGE_PRESETS[7].url,
    client_message: "All repair materials match existing roof profile aesthetics.",
    disclaimer: "Quotes assume standard wooden fascia boards. Structural repairs to rotted frames will be billed additionally.",
    options: [
      {
        name: "Exterior Repair Package",
        is_recommended: true,
        items: [
          {
            name: "Seamless Aluminum Gutters (150 linear ft)",
            description: "Seamless 5-inch gutters custom-extruded on-site. Includes standard downspouts and straps.",
            quantity: 1,
            unit_price: 950.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[4].url,
            pricebook_id: null
          },
          {
            name: "Roof Ridge Cap & Shingle Patching",
            description: "Seal active minor leaks, replace missing shingles, and reinforce ridge vents.",
            quantity: 1,
            unit_price: 450.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "Leaf-Guard Filtration Screens",
            description: "Aluminum mesh micro-filtration gutter guard covers to prevent leaf build-ups.",
            quantity: 1,
            unit_price: 350.00,
            is_optional: true,
            selected_by_client: false,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  },
  {
    name: "Smart Home Security Lock & Camera (Automation)",
    title: "Smart Home Security Setup",
    introduction: "Elevate your property security and control from anywhere. This automated smart-home lock and security camera system delivers active notifications straight to your mobile phone.",
    introduction_image_url: HERO_IMAGE_PRESETS[8].url,
    client_message: "All automation units connect to your home Wi-Fi network.",
    disclaimer: "Requires active home broadband network. Mobile application access setup is included.",
    options: [
      {
        name: "Security & Lock Automation",
        is_recommended: true,
        items: [
          {
            name: "Smart Touchscreen Keypad Lock",
            description: "Keyless Wi-Fi enabled deadbolt lock with customizable user pin access codes.",
            quantity: 1,
            unit_price: 220.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[5].url,
            pricebook_id: null
          },
          {
            name: "1080p Outdoor Security Cameras (2 Units)",
            description: "Weatherproof high-definition outdoor security cameras with active night-vision capture.",
            quantity: 1,
            unit_price: 380.00,
            is_optional: false,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[0].url,
            pricebook_id: null
          },
          {
            name: "Premium Cloud Backup Subscription (1 Year)",
            description: "Secure remote video storage with active vehicle/pet AI notifications.",
            quantity: 1,
            unit_price: 120.00,
            is_optional: true,
            selected_by_client: true,
            image_url: ITEM_THUMBNAIL_PRESETS[1].url,
            pricebook_id: null
          }
        ]
      }
    ]
  }
];

// ─── Status Colors ──────────────────────────────────────────────────

// ─── Status Colors ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  Draft:     { bg: "bg-slate-500/10",  text: "text-slate-600",  border: "border-slate-200",  icon: Edit2 },
  Sent:      { bg: "bg-blue-500/10",   text: "text-blue-600",   border: "border-blue-200",   icon: Send },
  Viewed:    { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-200", icon: Eye },
  Approved:  { bg: "bg-emerald-500/10",text: "text-emerald-600",border: "border-emerald-200",icon: CheckCircle2 },
  Declined:  { bg: "bg-red-500/10",    text: "text-red-600",    border: "border-red-200",    icon: XCircle },
  Expired:   { bg: "bg-amber-500/10",  text: "text-amber-600",  border: "border-amber-200",  icon: Clock },
  Converted: { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-200", icon: ArrowRight },
};

// ─── Component ──────────────────────────────────────────────────────
export default function EstimatesPage() {
  const { company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<Estimate | null>(null);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);

  // Template initial state
  const [templateSelectOpen, setTemplateSelectOpen] = useState(false);

  // Discard changes guard
  const [discardGuardOpen, setDiscardGuardOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Proposal Builder State
  const [wTitle, setWTitle] = useState("");
  const [wCustomerId, setWCustomerId] = useState("");
  const [wNotes, setWNotes] = useState("");
  const [wValidDays, setWValidDays] = useState("30");
  const [wIntroduction, setWIntroduction] = useState("");
  const [wIntroductionImageUrl, setWIntroductionImageUrl] = useState(HERO_IMAGE_PRESETS[0].url);
  const [wDiscountAmount, setWDiscountAmount] = useState(0);
  const [wTaxPercent, setWTaxPercent] = useState(0);
  const [wDisclaimer, setWDisclaimer] = useState("This proposal is valid for 30 days. Any alterations may alter the final quote price.");
  const [wClientMessage, setWClientMessage] = useState("");

  // Planned costs during estimation
  const [wPlannedCosts, setWPlannedCosts] = useState<{ category: string; title: string; budget_amount: number }[]>([]);
  const [newPlanCategory, setNewPlanCategory] = useState("");
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanBudget, setNewPlanBudget] = useState("");
  const [wOptions, setWOptions] = useState<EstimateOption[]>([
    { name: "Standard Package", is_recommended: true, items: [] },
  ]);

  // Form errors tracking
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Preview Mode inside Proposal Builder
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewActiveOptionIndex, setPreviewActiveOptionIndex] = useState(0);
  const [previewOptionStates, setPreviewOptionStates] = useState<Record<string, boolean>>({}); // tracking option checks for client side demo
  const [previewSigner, setPreviewSigner] = useState("");
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  // Active Option Tab in Builder Form
  const [activeBuilderOptionIndex, setActiveBuilderOptionIndex] = useState(0);

  // Viewed Estimate Detail Page State
  const [selectedEstimateForView, setSelectedEstimateForView] = useState<Estimate | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Jobber layout switches
  const [showIntroSection, setShowIntroSection] = useState(true);
  const [showAttachmentsSection, setShowAttachmentsSection] = useState(false);
  const [showImagesSection, setShowImagesSection] = useState(false);
  const [showClientMessageSection, setShowClientMessageSection] = useState(false);
  const [showDisclaimerSection, setShowDisclaimerSection] = useState(true);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showTaxInput, setShowTaxInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ─── Queries ────────────────────────────────────────────────────
  const { data: customers = [] } = useQuery({
    queryKey: ["customers", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("company_id", company.id)
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!company?.id,
  });

  const { data: pricebook = [] } = useQuery({
    queryKey: ["pricebook", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("pricebook")
        .select("*")
        .eq("company_id", company.id)
        .order("item_name");
      if (error) throw error;
      return data as PricebookItem[];
    },
    enabled: !!company?.id,
  });

  const { data: estimates = [], isLoading: estimatesLoading } = useQuery({
    queryKey: ["estimates", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("estimates")
        .select(`
          *,
          customer:customers(id, name, email, phone, billing_address)
        `)
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        customer: e.customer ? {
          id: e.customer.id,
          name: e.customer.name,
          email: e.customer.email,
          phone: e.customer.phone,
          billing_address: e.customer.billing_address,
        } : undefined,
      })) as Estimate[];
    },
    enabled: !!company?.id,
  });

  // Query to fetch options and items for the estimate being edited
  const { data: editingOptionsData } = useQuery({
    queryKey: ["estimate_options_and_items", editingEstimate?.id],
    queryFn: async () => {
      if (!editingEstimate?.id) return null;
      const { data: options, error: optErr } = await supabase
        .from("estimate_options")
        .select("*")
        .eq("estimate_id", editingEstimate.id)
        .order("sort_order");
      if (optErr) throw optErr;

      const optionIds = options.map(o => o.id);
      if (optionIds.length === 0) return [];
      const { data: items, error: itemsErr } = await supabase
        .from("estimate_items")
        .select("*")
        .in("option_id", optionIds);
      if (itemsErr) throw itemsErr;

      return options.map(opt => ({
        id: opt.id,
        name: opt.name,
        is_recommended: opt.is_recommended,
        items: items.filter(item => item.option_id === opt.id)
      }));
    },
    enabled: !!editingEstimate?.id,
  });

  // Query to fetch options and items for the estimate being viewed
  const { data: viewOptionsData } = useQuery({
    queryKey: ["estimate_options_and_items", selectedEstimateForView?.id],
    queryFn: async () => {
      if (!selectedEstimateForView?.id) return null;
      const { data: options, error: optErr } = await supabase
        .from("estimate_options")
        .select("*")
        .eq("estimate_id", selectedEstimateForView.id)
        .order("sort_order");
      if (optErr) throw optErr;

      const optionIds = options.map(o => o.id);
      if (optionIds.length === 0) return [];
      const { data: items, error: itemsErr } = await supabase
        .from("estimate_items")
        .select("*")
        .in("option_id", optionIds);
      if (itemsErr) throw itemsErr;

      return options.map(opt => ({
        id: opt.id,
        name: opt.name,
        is_recommended: opt.is_recommended,
        items: items.filter(item => item.option_id === opt.id)
      }));
    },
    enabled: !!selectedEstimateForView?.id,
  });

  // Populate options when editing data is fetched
  useEffect(() => {
    if (editingOptionsData && editingEstimate) {
      setWOptions(editingOptionsData.map(opt => ({
        id: opt.id,
        name: opt.name,
        is_recommended: opt.is_recommended,
        items: opt.items.map(item => ({
          id: item.id,
          pricebook_id: item.pricebook_id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit_price: Number(item.unit_price || 0),
          is_optional: item.is_optional,
          selected_by_client: item.selected_by_client,
          image_url: item.image_url || "",
        }))
      })));
    }
  }, [editingOptionsData, editingEstimate]);

  // ─── Computed KPIs ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = estimates.length;
    const sent = estimates.filter(e => e.status === "Sent" || e.status === "Viewed").length;
    const approved = estimates.filter(e => e.status === "Approved" || e.status === "Converted").length;
    const totalValue = estimates.reduce((s, e) => s + Number(e.total_amount || 0), 0);
    const approvedValue = estimates
      .filter(e => e.status === "Approved" || e.status === "Converted")
      .reduce((s, e) => s + Number(e.total_amount || 0), 0);
    const conversionRate = sent + approved > 0 ? Math.round((approved / (sent + approved)) * 100) : 0;
    return { total, sent, approved, totalValue, approvedValue, conversionRate };
  }, [estimates]);

  // ─── Mutations ──────────────────────────────────────────────────
  const saveEstimateMutation = useMutation({
    mutationFn: async (customStatus?: string) => {
      if (!company?.id) throw new Error("No company linked");
      if (!wCustomerId) throw new Error("Select a customer");
      if (!wTitle.trim()) throw new Error("Title is required");

      // Validate all line items have names
      let hasEmptyNames = false;
      const errorsMap: Record<string, string> = {};
      wOptions.forEach((opt, optIdx) => {
        opt.items.forEach((item, itemIdx) => {
          if (!item.name.trim()) {
            hasEmptyNames = true;
            errorsMap[`item-${optIdx}-${itemIdx}`] = "Line item name is required";
          }
        });
      });
      if (hasEmptyNames) {
        setFormErrors(errorsMap);
        throw new Error("Missing required line item names");
      }

      // Calculate total from recommended option
      const recommendedOption = wOptions.find(o => o.is_recommended) || wOptions[0];
      const subtotal = recommendedOption
        ? recommendedOption.items.reduce((s, i) => s + (i.unit_price * i.quantity), 0)
        : 0;
      const totalAmount = (subtotal - wDiscountAmount) * (1 + wTaxPercent / 100);

      let estimateId = editingEstimate?.id;
      const finalStatus = customStatus || (editingEstimate ? editingEstimate.status : "Draft");

      if (editingEstimate) {
        // 1. Update existing estimate
        const { error: estError } = await supabase
          .from("estimates")
          .update({
            customer_id: wCustomerId,
            title: wTitle.trim(),
            notes: wNotes || null,
            total_amount: totalAmount,
            valid_until: addDays(new Date(), parseInt(wValidDays) || 30).toISOString(),
            introduction: wIntroduction || null,
            introduction_image_url: wIntroductionImageUrl || null,
            discount_amount: wDiscountAmount,
            tax_percent: wTaxPercent,
            disclaimer: wDisclaimer || null,
            client_message: wClientMessage || null,
            status: finalStatus,
            planned_costs: wPlannedCosts,
          })
          .eq("id", editingEstimate.id);
        if (estError) throw estError;

        // 2. Cascade delete all old options
        const { error: delError } = await supabase
          .from("estimate_options")
          .delete()
          .eq("estimate_id", editingEstimate.id);
        if (delError) throw delError;
      } else {
        // 1. Create new estimate
        const { data: estimate, error: estError } = await supabase
          .from("estimates")
          .insert({
            company_id: company.id,
            customer_id: wCustomerId,
            title: wTitle.trim(),
            notes: wNotes || null,
            total_amount: totalAmount,
            valid_until: addDays(new Date(), parseInt(wValidDays) || 30).toISOString(),
            status: finalStatus,
            introduction: wIntroduction || null,
            introduction_image_url: wIntroductionImageUrl || null,
            discount_amount: wDiscountAmount,
            tax_percent: wTaxPercent,
            disclaimer: wDisclaimer || null,
            client_message: wClientMessage || null,
            planned_costs: wPlannedCosts,
          })
          .select()
          .single();
        if (estError) throw estError;
        estimateId = estimate.id;
      }

      // 2. Create Options & Items
      for (let i = 0; i < wOptions.length; i++) {
        const opt = wOptions[i];
        if (opt.items.length === 0) continue;

        const optSubtotal = opt.items.reduce((s, item) => s + (item.unit_price * item.quantity), 0);
        const optTotal = (optSubtotal - wDiscountAmount) * (1 + wTaxPercent / 100);

        const { data: optionData, error: optError } = await supabase
          .from("estimate_options")
          .insert({
            estimate_id: estimateId,
            name: opt.name,
            sort_order: i,
            total: optTotal,
            is_recommended: opt.is_recommended,
          })
          .select()
          .single();
        if (optError) throw optError;

        const itemsPayload = opt.items.map(item => ({
          option_id: optionData.id,
          pricebook_id: item.pricebook_id || null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          is_optional: item.is_optional || false,
          selected_by_client: item.selected_by_client !== false,
          image_url: item.image_url || null,
        }));

        if (itemsPayload.length > 0) {
          const { error: itemsError } = await supabase.from("estimate_items").insert(itemsPayload);
          if (itemsError) throw itemsError;
        }
      }

      // Convert instantly if option is selected
      if (customStatus === "Converted") {
        const { data: finalEst } = await supabase.from("estimates").select("*").eq("id", estimateId).single();
        if (finalEst) {
          await convertToJobMutation.mutateAsync(finalEst as Estimate);
        }
      }

      return estimateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      toast({ title: editingEstimate ? "Proposal updated" : "Proposal created", description: `"${wTitle}" has been saved.` });
      closeWizard();
    },
    onError: (err: any) => {
      toast({ title: "Error saving proposal", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("estimates").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      toast({ title: "Status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error updating", description: err.message, variant: "destructive" });
    },
  });

  const convertToJobMutation = useMutation({
    mutationFn: async (estimate: Estimate) => {
      // 1. Create a Project for the estimate
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          company_id: company?.id!,
          customer_id: estimate.customer_id,
          name: estimate.title || `Project for Estimate #${estimate.id.slice(0, 6).toUpperCase()}`,
          ref_number: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
          contract_value: Number(estimate.total_amount) || 0.0,
          budget_labour_cost: 0.0,
          status: "Planning",
        })
        .select()
        .single();
      if (projectError) throw projectError;

      // 2. Transition planned_costs from estimate into project_costs table
      const rawCosts = Array.isArray(estimate.planned_costs) ? estimate.planned_costs : [];
      if (rawCosts.length > 0) {
        const costsToInsert = rawCosts.map((c: any) => ({
          project_id: project.id,
          company_id: company?.id!,
          category: c.category || "Other",
          title: c.title || "Custom Cost Line",
          budget_amount: Number(c.budget_amount) || 0.0,
          actual_amount: 0.0,
        }));
        const { error: costsError } = await supabase
          .from("project_costs")
          .insert(costsToInsert);
        if (costsError) throw costsError;
      }

      // 3. Create a job linked to the estimate customer and the newly created project
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          company_id: company?.id,
          customer_id: estimate.customer_id,
          project_id: project.id,
          title: `Job: ${estimate.title}`,
          status: "Scheduled",
          scheduled_start: new Date().toISOString(),
          description: estimate.notes || "Generated from approved estimate proposal.",
        })
        .select()
        .single();
      if (jobError) throw jobError;

      // 4. Mark estimate as Converted
      const { error: estError } = await supabase
        .from("estimates")
        .update({ status: "Converted", job_id: job.id })
        .eq("id", estimate.id);
      if (estError) throw estError;

      return job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      toast({
        title: "Proposal Converted to Job!",
        description: `Successfully booked as job "${job.title}".`
      });
    },
    onError: (err: any) => {
      toast({ title: "Error converting estimate", description: err.message, variant: "destructive" });
    }
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      toast({ title: "Estimate deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("estimates").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      setSelectedIds([]);
      toast({ title: "Selected estimates deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting estimates", description: err.message, variant: "destructive" });
    },
  });

  const bulkShare = (ids: string[]) => {
    const selectedEstimates = estimates.filter(e => ids.includes(e.id));
    const links = selectedEstimates.map(est => {
      const origin = window.location.origin;
      return `${est.title}: ${origin}/approve/${est.approval_token}`;
    }).join("\n");

    navigator.clipboard.writeText(links);
    toast({
      title: "Links Copied!",
      description: `Copied ${selectedEstimates.length} quote approval links to clipboard.`,
    });
  };

  // Notes helpers
  interface NoteItem {
    author: string;
    created_at: string;
    text: string;
  }

  const parseNotes = (notesStr: string | null): NoteItem[] => {
    if (!notesStr) return [];
    try {
      const parsed = JSON.parse(notesStr);
      if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("length")) {
        return parsed as NoteItem[];
      }
    } catch (e) {
      // fallback
    }
    return [{
      author: "Admin",
      created_at: new Date().toISOString(),
      text: notesStr || ""
    }];
  };

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const estimate = estimates.find(e => e.id === id);
      if (!estimate) return;
      const currentNotes = parseNotes(estimate.notes);
      const newNotes = [
        ...currentNotes,
        {
          author: "Jobber",
          created_at: new Date().toISOString(),
          text: text.trim()
        }
      ];
      const { error } = await supabase
        .from("estimates")
        .update({ notes: JSON.stringify(newNotes) })
        .eq("id", id);
      if (error) throw error;
      return newNotes;
    },
    onSuccess: (newNotes, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      if (selectedEstimateForView && selectedEstimateForView.id === variables.id) {
        setSelectedEstimateForView({
          ...selectedEstimateForView,
          notes: JSON.stringify(newNotes)
        });
      }
      setNewNoteText("");
      setShowAddNote(false);
      toast({ title: "Note added" });
    },
    onError: (err: any) => {
      toast({ title: "Error adding note", description: err.message, variant: "destructive" });
    }
  });

  const updateEstimateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("estimates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estimates", company?.id] });
      if (selectedEstimateForView && selectedEstimateForView.id === variables.id) {
        setSelectedEstimateForView({
          ...selectedEstimateForView,
          status
        });
      }
      toast({ title: `Status updated to ${status}` });
    },
    onError: (err: any) => {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  });

  const cloneEstimate = (est: Estimate) => {
    setEditingEstimate(null);
    setWTitle(est.title + " (Copy)");
    setWCustomerId(est.customer_id);
    setWNotes(est.notes || "");
    setWIntroduction(est.introduction || "");
    setWIntroductionImageUrl(est.introduction_image_url || HERO_IMAGE_PRESETS[0].url);
    setWDiscountAmount(est.discount_amount || 0);
    setWTaxPercent(est.tax_percent || 0);
    setWDisclaimer(est.disclaimer || "");
    setWClientMessage(est.client_message || "");
    setShowIntroSection(!!est.introduction || !!est.introduction_image_url);
    setShowAttachmentsSection(false);
    setShowImagesSection(false);
    setShowClientMessageSection(!!est.client_message);
    setShowDisclaimerSection(!!est.disclaimer);
    setIsDirty(true);
    
    if (viewOptionsData) {
      setWOptions(viewOptionsData.map(opt => ({
        name: opt.name,
        is_recommended: opt.is_recommended,
        items: opt.items.map(item => ({
          pricebook_id: item.pricebook_id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit_price: Number(item.unit_price || 0),
          is_optional: item.is_optional,
          selected_by_client: item.selected_by_client,
          image_url: item.image_url || "",
        }))
      })));
    }
    
    setWizardOpen(true);
  };

  // ─── Wizard/Editor Helpers ──────────────────────────────────────
  const openNewEstimateBuilder = () => {
    // Open template selection popup first!
    setTemplateSelectOpen(true);
  };

  const startWithBlankQuote = () => {
    setTemplateSelectOpen(false);
    setWTitle("");
    setWCustomerId("");
    setWNotes("");
    setWValidDays("30");
    setWIntroduction("Thank you for your business. Please review our proposed services and packages below.");
    setWIntroductionImageUrl(HERO_IMAGE_PRESETS[0].url);
    setWDiscountAmount(0);
    setWTaxPercent(0);
    setWDisclaimer("This quote is valid for the next 30 days, after which values may be subject to change.");
    setWClientMessage("Authorized technicians will perform all system installations, checks, and calibrations.");
    setWOptions([
      { name: "Standard Package", is_recommended: true, items: [] },
    ]);
    setEditingEstimate(null);
    setWizardOpen(true);
    setIsPreviewMode(false);
    setIsDirty(false);
    setFormErrors({});
  };

  const startWithTemplate = (tmplIndex: number) => {
    const tmpl = SERVICE_TEMPLATES[tmplIndex];
    setTemplateSelectOpen(false);
    setWTitle(tmpl.title);
    setWCustomerId("");
    setWNotes("");
    setWValidDays("30");
    setWIntroduction(tmpl.introduction);
    setWIntroductionImageUrl(tmpl.introduction_image_url);
    setWDiscountAmount(0);
    setWTaxPercent(0);
    setWDisclaimer(tmpl.disclaimer);
    setWClientMessage(tmpl.client_message);
    setWOptions(tmpl.options.map(opt => ({
      name: opt.name,
      is_recommended: opt.is_recommended,
      items: opt.items.map(item => ({
        pricebook_id: item.pricebook_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        is_optional: item.is_optional,
        selected_by_client: item.selected_by_client,
        image_url: item.image_url,
      }))
    })));
    setEditingEstimate(null);
    setWizardOpen(true);
    setIsPreviewMode(false);
    setIsDirty(true); // Marked as modified due to template pre-fill
    setFormErrors({});
  };

  const startEditing = (est: Estimate) => {
    setEditingEstimate(est);
    setWTitle(est.title);
    setWCustomerId(est.customer_id);
    setWNotes(est.notes || "");
    setWValidDays(est.valid_until ? String(differenceInDays(new Date(est.valid_until), new Date()) || 30) : "30");
    setWIntroduction(est.introduction || "");
    setWIntroductionImageUrl(est.introduction_image_url || HERO_IMAGE_PRESETS[0].url);
    setWDiscountAmount(Number(est.discount_amount || 0));
    setWTaxPercent(Number(est.tax_percent || 0));
    setWDisclaimer(est.disclaimer || "");
    setWClientMessage(est.client_message || "");
    const rawCosts = Array.isArray(est.planned_costs) ? est.planned_costs : [];
    setWPlannedCosts(rawCosts.map((c: any) => ({
      category: c.category || "",
      title: c.title || "",
      budget_amount: Number(c.budget_amount || 0),
    })));
    setWizardOpen(true);
    setIsPreviewMode(false);
    setIsDirty(false); // Clean initially on load
    setFormErrors({});
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setEditingEstimate(null);
    setIsPreviewMode(false);
    setIsDirty(false);
    setDiscardGuardOpen(false);
    setFormErrors({});
    setWPlannedCosts([]);
    setNewPlanCategory("");
    setNewPlanTitle("");
    setNewPlanBudget("");
  };

  const handleCancelOrBackClick = () => {
    if (isDirty) {
      setDiscardGuardOpen(true);
    } else {
      closeWizard();
    }
  };

  const addOptionTier = () => {
    setWOptions(prev => [...prev, { name: `Tier ${prev.length + 1}`, is_recommended: false, items: [] }]);
    setIsDirty(true);
  };

  const removeOptionTier = (index: number) => {
    if (wOptions.length <= 1) return;
    setWOptions(prev => prev.filter((_, i) => i !== index));
    setActiveBuilderOptionIndex(0);
    setIsDirty(true);
  };

  const addItemToOption = (optIndex: number, pbItemId: string) => {
    const pbItem = pricebook.find(p => p.id === pbItemId);
    if (!pbItem) return;
    setWOptions(prev => prev.map((opt, i) =>
      i === optIndex
        ? {
            ...opt,
            items: [
              ...opt.items,
              {
                pricebook_id: pbItem.id,
                name: pbItem.item_name,
                description: pbItem.description || "",
                quantity: 1,
                unit_price: pbItem.unit_cost,
                is_optional: false,
                selected_by_client: true,
                image_url: null,
              },
            ],
          }
        : opt
    ));
    setIsDirty(true);
  };

  const addCustomItemToOption = (optIndex: number) => {
    setWOptions(prev => prev.map((opt, i) =>
      i === optIndex
        ? {
            ...opt,
            items: [
              ...opt.items,
              {
                pricebook_id: null,
                name: "",
                description: "",
                quantity: 1,
                unit_price: 0,
                is_optional: false,
                selected_by_client: true,
                image_url: null,
              },
            ],
          }
        : opt
    ));
    setIsDirty(true);
  };

  const removeItemFromOption = (optIndex: number, itemIndex: number) => {
    setWOptions(prev => prev.map((opt, i) =>
      i === optIndex
        ? { ...opt, items: opt.items.filter((_, j) => j !== itemIndex) }
        : opt
    ));
    setIsDirty(true);
  };

  const updateItemInOption = (optIndex: number, itemIndex: number, field: string, value: any) => {
    setWOptions(prev => prev.map((opt, i) =>
      i === optIndex
        ? {
            ...opt,
            items: opt.items.map((item, j) =>
              j === itemIndex ? { ...item, [field]: value } : item
            ),
          }
        : opt
    ));
    setIsDirty(true);

    // Clear validation error when typing
    if (field === "name" && value.trim()) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[`item-${optIndex}-${itemIndex}`];
        return next;
      });
    }
  };

  const toggleRecommended = (optIndex: number) => {
    setWOptions(prev => prev.map((opt, i) => ({
      ...opt,
      is_recommended: i === optIndex,
    })));
    setIsDirty(true);
  };

  const getOptionSubtotal = (opt: EstimateOption) => {
    return opt.items
      .filter(item => !item.is_optional || (isPreviewMode ? previewOptionStates[item.name] !== false : item.selected_by_client !== false))
      .reduce((s, i) => s + (i.unit_price * i.quantity), 0);
  };

  const getOptionCalculations = (opt: EstimateOption) => {
    const subtotal = getOptionSubtotal(opt);
    const discount = wDiscountAmount;
    const tax = (subtotal - discount) * (wTaxPercent / 100);
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };

  const getStatusBadge = (status: string) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.Draft;
    const Icon = style.icon;
    return (
      <Badge className={`${style.bg} ${style.text} ${style.border} gap-1 font-semibold`}>
        <Icon className="h-3 w-3" /> {status}
      </Badge>
    );
  };

  // ─── Filtered Estimates ─────────────────────────────────────────
  const filteredEstimates = useMemo(() => {
    return estimates.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        (e.customer?.name || "").toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [estimates, searchQuery, statusFilter]);

  // ─── Copy approval link ────────────────────────────────────────
  const copyApprovalLink = (estimate: Estimate) => {
    const link = `${window.location.origin}/approve/${estimate.approval_token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied", description: "Customer approval link copied to clipboard." });
  };

  // Pre-fill item thumbnail or hero covers
  const selectHeroPreset = (url: string) => {
    setWIntroductionImageUrl(url);
    setIsDirty(true);
  };

  const handleFileUpload = async (file: File, type: "cover" | "item", itemIdx?: number, optIdx?: number) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const filePath = `estimates/${type}s/${company?.id || "default"}/${timestamp}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      if (type === "cover") {
        setWIntroductionImageUrl(publicUrl);
        setIsDirty(true);
      } else if (type === "item" && typeof itemIdx === "number" && typeof optIdx === "number") {
        updateItemInOption(optIdx, itemIdx, "image_url", publicUrl);
      }
      toast({ title: "Upload successful", description: "Image was successfully uploaded and linked." });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || estimatesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── RENDER PROPOSAL BUILDER (Full Page View) ───────────────────
  const renderProposalBuilder = () => {
    const activeOption = wOptions[activeBuilderOptionIndex] || wOptions[0];
    const previewOption = wOptions[previewActiveOptionIndex] || wOptions[0];
    const activeCalcs = activeOption ? getOptionCalculations(activeOption) : { subtotal: 0, discount: 0, tax: 0, total: 0 };
    const previewCalcs = previewOption ? getOptionCalculations(previewOption) : { subtotal: 0, discount: 0, tax: 0, total: 0 };
    const activeCustomer = customers.find(c => c.id === wCustomerId);

    return (
      <div className="flex flex-col min-h-screen bg-[#f4f3f0]">
        {/* Editor Top Bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleCancelOrBackClick}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-extrabold text-slate-800 text-base leading-tight">
                {editingEstimate ? "Edit Estimate Proposal" : "Build Estimate Proposal"}
              </h2>
              <p className="text-[11px] text-muted-foreground">Draft professional package proposals with upgrades</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isPreviewMode ? "default" : "outline"}
              onClick={() => {
                if (!wCustomerId) {
                  toast({ title: "Missing customer", description: "Please select a customer before previewing", variant: "destructive" });
                  return;
                }
                setIsPreviewMode(!isPreviewMode);
              }}
              className="gap-2 font-bold text-xs"
            >
              <Eye className="h-4 w-4" />
              {isPreviewMode ? "Edit Proposal" : "Preview Proposal"}
            </Button>

          </div>
        </div>

        {/* Builder Workspace Grid */}
        <div className="flex-1 p-4 w-full mx-auto max-w-[960px] bg-[#f4f3f0]">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
            
            {isPreviewMode ? (
              /* ==================== CLIENT PREVIEW MODULE ==================== */
              <div className="space-y-6">
                {/* Hero Header Banner */}
                {wIntroductionImageUrl && (
                  <div className="h-48 sm:h-64 w-full relative overflow-hidden rounded-xl border">
                    <img src={wIntroductionImageUrl} alt="Proposal Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 text-white">
                      <h1 className="text-xl sm:text-2xl font-black">{wTitle || "Service Proposal Quote"}</h1>
                      <p className="text-xs text-white/80 mt-1 font-medium font-sans">Prepared by {company?.name}</p>
                    </div>
                  </div>
                )}

                {/* Company and Client info */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <img src="/favicon.png" alt="Logo" className="h-6 w-6 rounded-lg" />
                      <span className="font-extrabold text-primary text-base">{company?.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Proposal reference: #{editingEstimate ? editingEstimate.id.substring(0,8).toUpperCase() : "PROPOSAL-DRAFT"}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Client Recipient</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{activeCustomer?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeCustomer?.email}</p>
                    {activeCustomer?.phone && <p className="text-xs text-muted-foreground font-mono">{activeCustomer?.phone}</p>}
                  </div>
                </div>

                {/* Greeting introduction statement */}
                {wIntroduction && (
                  <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-600 leading-relaxed italic whitespace-pre-line">
                    "{wIntroduction}"
                  </div>
                )}

                {/* Option packages selector */}
                {wOptions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Select Quote Tier Package</h3>
                      <span className="text-[10px] bg-amber-50/10 text-amber-600 font-bold px-2 py-0.5 rounded-full border border-amber-200">Interactive Preview</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wOptions.map((opt, i) => {
                        const calcs = getOptionCalculations(opt);
                        return (
                          <Card
                            key={i}
                            className={`cursor-pointer transition-all border-2 relative overflow-hidden ${
                              previewActiveOptionIndex === i
                                ? "border-primary shadow bg-white ring-2 ring-primary/5"
                                : "border-border/60 hover:border-border bg-white"
                            }`}
                            onClick={() => setPreviewActiveOptionIndex(i)}
                          >
                            {opt.is_recommended && (
                              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                            )}
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm text-slate-800">{opt.name}</h4>
                                {opt.is_recommended && (
                                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[8px] py-0 px-1.5 font-bold">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xl font-black font-mono text-primary">
                                ${calcs.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{opt.items.length} scope items included</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Package Scope itemized view */}
                {previewOption && (
                  <Card className="border-border/60 overflow-hidden">
                    <div className="bg-slate-50/50 p-4 border-b border-border/30">
                      <h4 className="font-bold text-xs text-slate-700">Scope detail — {previewOption.name}</h4>
                    </div>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Line item</TableHead>
                            <TableHead className="w-[100px] text-center text-xs">Qty</TableHead>
                            <TableHead className="w-[120px] text-right text-xs">Rate</TableHead>
                            <TableHead className="w-[120px] text-right text-xs">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewOption.items.map((item, idx) => {
                            const isChecked = previewOptionStates[item.name] !== false;
                            const showItem = !item.is_optional || isChecked;
                            return (
                              <TableRow
                                key={idx}
                                className={`hover:bg-slate-50/20 transition-colors ${!showItem ? "opacity-35 line-through bg-slate-50/5" : ""}`}
                              >
                                <TableCell>
                                  <div className="flex items-start gap-3">
                                    {item.image_url && (
                                      <img src={item.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-slate-800">{item.name || "Custom Line Item"}</span>
                                        {item.is_optional && (
                                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary bg-primary/5 uppercase font-bold shrink-0">
                                            Optional Add-on
                                          </Badge>
                                        )}
                                      </div>
                                      {item.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{item.description}</p>}
                                      {item.is_optional && (
                                        <div className="pt-1.5 flex items-center gap-1.5">
                                          <input
                                            type="checkbox"
                                            id={`chk-prev-${idx}`}
                                            checked={isChecked}
                                            onChange={(e) => {
                                              setPreviewOptionStates(prev => ({
                                                ...prev,
                                                [item.name]: e.target.checked
                                              }));
                                            }}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                          />
                                          <label htmlFor={`chk-prev-${idx}`} className="text-[10px] text-primary font-bold cursor-pointer hover:underline">
                                            {isChecked ? "Selected (Deselect)" : "Select upgrade (Add to quote)"}
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-mono text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-right font-mono text-xs">${item.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right font-mono text-xs font-semibold text-slate-800">${(item.unit_price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>

                      {/* Calculated pricing summary */}
                      <div className="p-4 border-t bg-slate-50/50 flex flex-col items-end space-y-1.5 text-xs">
                        <div className="flex justify-between w-64">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-mono font-semibold">${previewCalcs.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </div>
                        {wDiscountAmount > 0 && (
                          <div className="flex justify-between w-64 text-rose-600">
                            <span>Discount (Fixed):</span>
                            <span className="font-mono font-semibold">-${wDiscountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {wTaxPercent > 0 && (
                          <div className="flex justify-between w-64 text-muted-foreground">
                            <span>Tax ({wTaxPercent}%):</span>
                            <span className="font-mono font-semibold">${previewCalcs.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between w-64 border-t pt-2 text-sm font-black text-slate-800">
                          <span>Proposal Total:</span>
                          <span className="font-mono text-primary">${previewCalcs.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Portal disclaimer Terms */}
                {wDisclaimer && (
                  <div className="space-y-1.5 border-t pt-4">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Contract terms & disclaimers</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{wDisclaimer}</p>
                  </div>
                )}

                {/* Client Sign-off Panel */}
                <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-sm space-y-4 mt-8">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                      <PenTool className="h-4 w-4 text-primary" /> Sign & Accept Quote Proposal
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Recipient Name</label>
                      <Input
                        placeholder="Type customer name to verify"
                        value={previewSigner}
                        onChange={(e) => setPreviewSigner(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Client Signature</label>
                      <div className="border border-dashed border-slate-300 bg-slate-50 rounded-xl overflow-hidden touch-none h-32 relative group">
                        <SignatureCanvas
                          ref={sigCanvasRef}
                          penColor="black"
                          canvasProps={{ className: 'w-full h-full' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { sigCanvasRef.current?.clear(); setPreviewSigner(""); }} className="text-muted-foreground text-xs">
                      Reset Signature details
                    </Button>
                    <Button
                      disabled={!previewSigner.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      onClick={() => {
                        if (sigCanvasRef.current?.isEmpty()) {
                          toast({ title: "Signature Required", description: "Please draw your signature to accept.", variant: "destructive" });
                          return;
                        }
                        const signatureDataUrl = sigCanvasRef.current?.toDataURL();
                        toast({ title: "Proposal Approved", description: "Successfully signed and accepted the proposal package." });
                      }}
                    >
                      Accept Proposal Quote
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* ==================== BUILDER EDITOR FORM MODULE ==================== */
              <div className="space-y-5">
                
                {/* Header - Jobber style */}
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="h-7 w-7 bg-emerald-700 rounded-lg flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h1 className="text-base font-extrabold text-slate-800">{editingEstimate ? "Edit Quote" : "New Quote"}</h1>
                </div>

                {/* General Info Fields - matching Jobber layout */}
                <div className="space-y-3">
                  <Input
                    value={wTitle}
                    onChange={(e) => { setWTitle(e.target.value); setIsDirty(true); }}
                    placeholder="Title"
                    className="text-sm text-slate-800 border-slate-200 rounded-lg h-10 focus-visible:ring-1 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 transition-colors"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select value={wCustomerId} onValueChange={(val) => { setWCustomerId(val); setIsDirty(true); }}>
                      <SelectTrigger className="border-slate-200 rounded-lg h-10">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground font-medium">Quote #</label>
                        <Input value={editingEstimate ? "#" + editingEstimate.id.substring(0,6).toUpperCase() : String(estimates.length + 1)} className="border-slate-200 bg-slate-50 rounded-lg h-10" disabled />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground font-medium">Customize</label>
                        <Button variant="outline" className="w-full h-10 text-xs font-semibold border-slate-200 rounded-lg text-slate-700">Add Field</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section toggle row - Jobber style */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600 font-semibold flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add section</span>
                  <Button
                    variant={showIntroSection ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowIntroSection(!showIntroSection)}
                    className={`rounded-full h-7 px-3.5 font-semibold text-[12px] ${showIntroSection ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                  >
                    Introduction
                  </Button>
                </div>

                {/* Introduction Section card */}
                {showIntroSection && (
                  <Card className="border-slate-200/80 shadow-none bg-white p-4 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Introduction Cover</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => setShowIntroSection(false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Proposal Cover Image</label>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mt-1">
                          {wIntroductionImageUrl && (
                            <img src={wIntroductionImageUrl} alt="Cover Preview" className="h-16 w-28 object-cover rounded-xl border border-slate-200" />
                          )}
                          <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98]">
                                <Plus className="h-3.5 w-3.5 text-slate-500" />
                                {uploading ? "Uploading..." : "Upload Cover Photo"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, "cover");
                                }}
                              />
                            </label>
                            <Button variant="outline" onClick={() => selectHeroPreset(HERO_IMAGE_PRESETS[0].url)} size="sm" className="text-xs font-bold rounded-xl border-slate-200 text-slate-600">
                              Reset Default
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Select Hero Preset cover photo</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {HERO_IMAGE_PRESETS.map((preset, i) => (
                            <div
                              key={i}
                              className={`cursor-pointer border rounded-xl overflow-hidden relative transition-all ${
                                wIntroductionImageUrl === preset.url ? "ring-2 ring-primary border-primary shadow-sm" : "hover:border-slate-400"
                              }`}
                              onClick={() => selectHeroPreset(preset.url)}
                            >
                              <img src={preset.url} alt="" className="h-10 w-full object-cover" />
                              <div className="p-1 text-[8px] font-bold text-center truncate bg-white/95">
                                {preset.name.split(" ")[0]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-700">Introduction Message</label>
                        <p className="text-[9px] text-muted-foreground -mt-0.5">This greeting appears at the top of the proposal your client receives</p>
                        <Textarea
                          rows={3}
                          placeholder="e.g. Thank you for choosing us. Here is a breakdown of the services we recommend..."
                          value={wIntroduction}
                          onChange={(e) => { setWIntroduction(e.target.value); setIsDirty(true); }}
                          className="text-xs border-slate-200/60 rounded-xl shadow-sm focus-visible:ring-slate-300 focus-visible:border-slate-300 transition-all leading-relaxed"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Product / Service Section card - Jobber style */}
                <Card className="border-slate-200 shadow-none bg-white p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 italic">Product / Service</h3>
                    <Button onClick={addOptionTier} size="sm" variant="ghost" className="gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8">
                      <Plus className="h-3.5 w-3.5" /> Add Package
                    </Button>
                  </div>

                  <Tabs
                    value={String(activeBuilderOptionIndex)}
                    onValueChange={(val) => setActiveBuilderOptionIndex(Number(val))}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <TabsList className="bg-transparent h-auto p-0 flex gap-1">
                        {wOptions.map((opt, i) => (
                          <TabsTrigger
                            key={i}
                            value={String(i)}
                            className="text-xs py-1 px-3 rounded-lg border border-transparent data-[state=active]:bg-slate-100 data-[state=active]:border-slate-200 font-semibold"
                          >
                            {opt.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {wOptions.map((opt, optIdx) => (
                      <TabsContent key={optIdx} value={String(optIdx)} className="space-y-4 pt-4 focus-visible:outline-none">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex flex-wrap gap-4 items-center flex-1">
                            <div className="space-y-1.5 w-full sm:max-w-xs">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Package Name</label>
                              <Input
                                value={opt.name}
                                onChange={(e) => {
                                  setWOptions(prev => prev.map((o, idx) => idx === optIdx ? { ...o, name: e.target.value } : o));
                                  setIsDirty(true);
                                }}
                                className="h-9 text-xs font-bold border-slate-200 rounded-xl shadow-sm focus-visible:ring-slate-300 transition-all"
                                placeholder="e.g. Standard Package, Premium Package..."
                              />
                            </div>
                            <div className="pt-4 flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`chk-rec-${optIdx}`}
                                checked={opt.is_recommended}
                                onChange={() => toggleRecommended(optIdx)}
                                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer border-slate-300"
                              />
                              <label htmlFor={`chk-rec-${optIdx}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                Recommended Package Option
                              </label>
                            </div>
                          </div>
                          {wOptions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionTier(optIdx)}
                              className="text-rose-600 hover:bg-rose-50 font-semibold text-xs h-8"
                            >
                              <Trash2 className="h-4 w-4 mr-1 shrink-0" /> Delete Package
                            </Button>
                          )}
                        </div>

                        {/* Pricebook Quick-Add (hidden, accessible via search) */}
                        <div className="pt-1">
                          <Select onValueChange={(val) => addItemToOption(optIdx, val)}>
                            <SelectTrigger className="w-full text-xs h-9 bg-white border-slate-200 rounded-lg">
                              <SelectValue placeholder="🔍 Quick add from pricebook..." />
                            </SelectTrigger>
                            <SelectContent>
                              {pricebook.map(pb => (
                                <SelectItem key={pb.id} value={pb.id}>
                                  {pb.item_name} — ${pb.unit_cost.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Line Items - Jobber connected-row style */}
                        {opt.items.length === 0 ? (
                          <div className="text-center py-8 text-xs text-muted-foreground">
                            No line items added. Click "Add Line Item" below to begin.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {opt.items.map((item, itemIdx) => {
                              const validationError = formErrors[`item-${optIdx}-${itemIdx}`];
                              return (
                                <div
                                  key={itemIdx}
                                  className={`border rounded-lg bg-white space-y-0 relative group transition-all overflow-hidden ${
                                    validationError ? "border-rose-400" : "border-slate-200"
                                  }`}
                                >
                                  {/* Delete item 3-dot menu */}
                                  <div className="absolute top-2 right-2 z-10">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-slate-100">
                                          <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent align="end" className="w-32 p-1">
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-xs text-rose-600 hover:bg-rose-50 h-8"
                                          onClick={() => removeItemFromOption(optIdx, itemIdx)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 mr-2 shrink-0" />
                                          Delete
                                        </Button>
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  {/* Connected row: Name | Quantity | Unit Price | Total - Jobber style */}
                                  <div className="grid grid-cols-12 divide-x divide-slate-200">
                                    <div className="col-span-5 p-2.5">
                                      <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Name</label>
                                      <input
                                        value={item.name}
                                        onChange={(e) => updateItemInOption(optIdx, itemIdx, "name", e.target.value)}
                                        className={`w-full text-sm font-medium text-slate-800 bg-transparent outline-none placeholder:text-slate-300 ${
                                          validationError ? "text-rose-600" : ""
                                        }`}
                                        placeholder="Name"
                                      />
                                      {validationError && (
                                        <p className="text-[10px] text-rose-500 mt-0.5">{validationError}</p>
                                      )}
                                    </div>
                                    <div className="col-span-2 p-2.5">
                                      <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Quantity</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItemInOption(optIdx, itemIdx, "quantity", parseInt(e.target.value) || 0)}
                                        className="w-full text-sm font-medium text-slate-800 bg-transparent outline-none font-mono"
                                      />
                                    </div>
                                    <div className="col-span-3 p-2.5">
                                      <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Unit price</label>
                                      <div className="flex items-center gap-0.5">
                                        <span className="text-sm text-slate-400">₦</span>
                                        <input
                                          type="number"
                                          value={item.unit_price}
                                          onChange={(e) => updateItemInOption(optIdx, itemIdx, "unit_price", parseFloat(e.target.value) || 0)}
                                          className="w-full text-sm font-medium text-slate-800 bg-transparent outline-none font-mono"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-span-2 p-2.5 bg-slate-50/50">
                                      <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Total</label>
                                      <span className="text-sm font-bold text-slate-700 font-mono">₦{(item.unit_price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>

                                  {/* Description row with image upload icon - Jobber style */}
                                  <div className="border-t border-slate-200 relative">
                                    <textarea
                                      rows={3}
                                      value={item.description || ""}
                                      onChange={(e) => updateItemInOption(optIdx, itemIdx, "description", e.target.value)}
                                      className="w-full text-xs text-slate-600 p-3 pr-14 outline-none resize-y bg-transparent placeholder:text-slate-300 leading-relaxed"
                                      placeholder="Description"
                                    />
                                    {/* Image icon at bottom-right of description - Jobber style */}
                                    <div className="absolute bottom-2.5 right-2.5">
                                      {item.image_url ? (
                                        <div className="relative h-8 w-8 rounded overflow-hidden border border-slate-200 cursor-pointer group/img">
                                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                          <button
                                            onClick={() => updateItemInOption(optIdx, itemIdx, "image_url", null)}
                                            className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="cursor-pointer h-8 w-8 border border-slate-200 hover:border-slate-300 rounded bg-white hover:bg-slate-50 transition-colors flex items-center justify-center">
                                          <ImageIcon className="h-4 w-4 text-slate-400" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploading}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleFileUpload(file, "item", itemIdx, optIdx);
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>

                                  {/* Mark as optional */}
                                  <div className="border-t border-slate-200 px-3 py-2 flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`chk-opt-${optIdx}-${itemIdx}`}
                                      checked={item.is_optional}
                                      onChange={(e) => updateItemInOption(optIdx, itemIdx, "is_optional", e.target.checked)}
                                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor={`chk-opt-${optIdx}-${itemIdx}`} className="text-xs text-slate-600 cursor-pointer select-none">
                                      Mark as optional
                                    </label>
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Add item buttons - Jobber style */}
                  <div className="flex items-center gap-2 pt-3">
                    <Button onClick={() => addCustomItemToOption(activeBuilderOptionIndex)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-8 rounded-full px-4">
                      Add Line Item
                    </Button>
                    <Button onClick={() => addCustomItemToOption(activeBuilderOptionIndex)} variant="outline" className="text-xs font-semibold h-8 text-slate-700 border-slate-300 rounded-full px-4">
                      Add Text
                    </Button>
                  </div>
                </Card>

                {/* Totals - Jobber style with Client view + Change on left */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2 text-xs text-slate-500 pt-2">
                    <Eye className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Client view <span className="text-emerald-700 font-semibold hover:underline cursor-pointer ml-1">Change</span></span>
                  </div>

                  <div className="flex flex-col items-end space-y-2 text-[13px] text-slate-600">
                    <div className="flex justify-between w-full max-w-[280px]">
                      <span>Subtotal</span>
                      <span className="font-mono font-semibold">₦{activeCalcs.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="flex justify-between w-full max-w-[280px] items-center">
                      <span>Discount</span>
                      {showDiscountInput ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₦</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={wDiscountAmount || ""}
                            onChange={(e) => setWDiscountAmount(parseFloat(e.target.value) || 0)}
                            className="h-7 w-20 text-right font-mono text-xs border-slate-200 rounded-lg"
                          />
                        </div>
                      ) : (
                        <button onClick={() => setShowDiscountInput(true)} className="text-emerald-700 font-semibold hover:underline text-xs">
                          Add Discount
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between w-full max-w-[280px] items-center">
                      <span>Tax</span>
                      {showTaxInput ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="0"
                            value={wTaxPercent || ""}
                            onChange={(e) => setWTaxPercent(parseFloat(e.target.value) || 0)}
                            className="h-7 w-16 text-right font-mono text-xs border-slate-200 rounded-lg"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      ) : (
                        <button onClick={() => setShowTaxInput(true)} className="text-emerald-700 font-semibold hover:underline text-xs">
                          Add Tax
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between w-full max-w-[280px] border-t border-slate-200 pt-2 text-sm font-bold text-slate-800">
                      <span>Total</span>
                      <span className="font-mono">₦{activeCalcs.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>

                    <button className="text-emerald-700 font-semibold hover:underline text-xs">
                      Add Deposit or Payment Schedule
                    </button>
                  </div>
                </div>

                {/* Section toggle row 2 - Jobber style */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-600 font-semibold flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add section</span>
                  {[{show: showAttachmentsSection, set: setShowAttachmentsSection, label: 'Attachments'}, {show: showImagesSection, set: setShowImagesSection, label: 'Images'}, {show: showClientMessageSection, set: setShowClientMessageSection, label: 'Client Message'}].map(s => (
                    <Button
                      key={s.label}
                      variant={s.show ? "default" : "outline"}
                      size="sm"
                      onClick={() => s.set(!s.show)}
                      className={`rounded-full h-7 px-3.5 font-semibold text-[12px] ${s.show ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>

                {/* Optional Attachments Card */}
                {showAttachmentsSection && (
                  <Card className="border-slate-200 shadow-none bg-white p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 italic">Attachments</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => setShowAttachmentsSection(false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <label className="cursor-pointer block">
                      <div className="border border-dashed border-slate-300 p-6 rounded-lg text-center hover:border-slate-400 transition-colors">
                        <p className="text-xs text-muted-foreground">Drag & drop documents here, or click to browse</p>
                      </div>
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" />
                    </label>
                  </Card>
                )}

                {/* Optional Images Card */}
                {showImagesSection && (
                  <Card className="border-slate-200 shadow-none bg-white p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 italic">Images</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => setShowImagesSection(false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <label className="cursor-pointer block">
                      <div className="border border-dashed border-slate-300 p-6 rounded-lg text-center hover:border-slate-400 transition-colors">
                        <p className="text-xs text-muted-foreground">Drag & drop photos here, or click to browse</p>
                      </div>
                      <input type="file" accept="image/*" multiple className="hidden" />
                    </label>
                  </Card>
                )}

                {/* Optional Client Message */}
                {showClientMessageSection && (
                  <Card className="border-slate-200 shadow-none bg-white p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 italic">Client Message</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => setShowClientMessageSection(false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Write a message to include with the quote email..."
                      value={wClientMessage}
                      onChange={(e) => { setWClientMessage(e.target.value); setIsDirty(true); }}
                      className="text-xs border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 transition-colors leading-relaxed"
                    />
                  </Card>
                )}

                {/* Contract / Disclaimer - Jobber style */}
                {showDisclaimerSection && (
                  <Card className="border-slate-200 shadow-none bg-white p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 italic">Contract / Disclaimer</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => setShowDisclaimerSection(false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground font-medium block mb-1">Description</label>
                      <Textarea
                        rows={4}
                        placeholder="This quote is valid for the next 30 days, after which values may be subject to change."
                        value={wDisclaimer}
                        onChange={(e) => { setWDisclaimer(e.target.value); setIsDirty(true); }}
                        className="text-xs border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 transition-colors leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="chk-future" className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 cursor-pointer focus:ring-emerald-500" />
                      <label htmlFor="chk-future" className="text-xs text-slate-600 cursor-pointer select-none">
                        Apply to all future quotes
                      </label>
                    </div>
                  </Card>
                )}

                {/* Custom Budgets & Cost Categories - planned costs */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-600" /> Planned Project Budgets & Costs
                  </h3>
                  <Card className="border-slate-200 shadow-none bg-white p-5 space-y-4">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Plan internal cost categories (e.g. Marketing, Foundation, Sub-contractor, Transportation) for this proposal. These will automatically provision in the project workspace once approved.
                    </p>

                    {wPlannedCosts.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        {wPlannedCosts.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-800 text-slate-200 text-[9px] font-mono uppercase">
                                {item.category}
                              </Badge>
                              <span className="font-semibold text-slate-700">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-600">
                                ${Number(item.budget_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-rose-500 hover:bg-rose-50"
                                onClick={() => {
                                  setWPlannedCosts(prev => prev.filter((_, i) => i !== idx));
                                  setIsDirty(true);
                                }}
                              >
                                <X className="h-3.5 w-3.5 text-rose-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Inline Adding Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <Input
                        placeholder="Category (e.g. Marketing)"
                        value={newPlanCategory}
                        onChange={(e) => setNewPlanCategory(e.target.value)}
                        className="h-9 text-xs border-slate-200"
                      />
                      <Input
                        placeholder="Description (e.g. Ad Spend)"
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                        className="h-9 text-xs border-slate-200"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Budget ($)"
                          value={newPlanBudget}
                          onChange={(e) => setNewPlanBudget(e.target.value)}
                          className="h-9 text-xs border-slate-200 flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (!newPlanCategory.trim() || !newPlanTitle.trim()) {
                              toast({ title: "Validation error", description: "Category and description are required.", variant: "destructive" });
                              return;
                            }
                            setWPlannedCosts(prev => [
                              ...prev,
                              {
                                category: newPlanCategory.trim(),
                                title: newPlanTitle.trim(),
                                budget_amount: Number(newPlanBudget) || 0.0,
                              }
                            ]);
                            setNewPlanCategory("");
                            setNewPlanTitle("");
                            setNewPlanBudget("");
                            setIsDirty(true);
                          }}
                          className="h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Notes - Jobber style fieldset box */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Notes</h3>
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col items-center justify-center text-center py-3 space-y-2">
                      <FileText className="h-6 w-6 text-slate-300" />
                      <p className="text-xs text-muted-foreground">Leave an internal note for yourself or a team member</p>
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Type your internal note here..."
                      value={wNotes}
                      onChange={(e) => { setWNotes(e.target.value); setIsDirty(true); }}
                      className="text-xs border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 transition-colors w-full leading-relaxed"
                    />
                  </div>
                </div>

                {/* Bottom Cancel & Save - Jobber style */}
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
                  <Button variant="ghost" onClick={handleCancelOrBackClick} className="text-xs font-semibold text-slate-600 h-9 px-4">
                    Cancel
                  </Button>
                  
                  <div className="flex items-center">
                    <Button
                      onClick={() => saveEstimateMutation.mutate()}
                      disabled={saveEstimateMutation.isPending}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-r-none h-9 px-5"
                    >
                      {saveEstimateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Quote
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white p-0 px-2 rounded-l-none border-l border-emerald-600 h-9">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => saveEstimateMutation.mutate("Sent")} className="text-xs font-semibold gap-2 py-2">
                          <Send className="h-4 w-4 text-blue-500" />
                          Save & Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => saveEstimateMutation.mutate("Converted")} className="text-xs font-semibold gap-2 py-2">
                          <ArrowRight className="h-4 w-4 text-violet-600" />
                          Convert to Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => saveEstimateMutation.mutate("Sent")} className="text-xs font-semibold gap-2 py-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Mark Awaiting Response
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const pageContent = (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50/30">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quotes</h1>
          <div className="flex items-center gap-2">
            <Button onClick={openNewEstimateBuilder} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs h-9">
              <Plus className="h-4 w-4" /> New Quote
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-xs gap-1 h-9 border-slate-200 text-slate-600 font-semibold">
                  <span>••• More Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={openNewEstimateBuilder} className="text-xs py-2 font-medium">
                  Create Quote Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()} className="text-xs py-2 font-medium">
                  Print Quotes Log
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Jobber-Style Overview Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 overflow-x-auto pb-2 scrollbar-none">
          
          {/* Card 1: Overview */}
          <Card className="border-slate-200/80 shadow-sm bg-white min-w-[180px]">
            <CardHeader className="p-3 pb-1 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span>Draft</span>
                </div>
                <span className="font-mono font-bold">{estimates.filter(e => e.status === "Draft").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 shrink-0" />
                  <span>Awaiting response</span>
                </div>
                <span className="font-mono font-bold">{estimates.filter(e => e.status === "Sent" || e.status === "Viewed").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                  <span>Changes requested</span>
                </div>
                <span className="font-mono font-bold">{estimates.filter(e => e.status === "Declined").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Approved</span>
                </div>
                <span className="font-mono font-bold">{estimates.filter(e => e.status === "Approved").length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Conversion Rate */}
          <Card className="border-slate-200/80 shadow-sm bg-white min-w-[180px]">
            <CardHeader className="p-3 pb-1 border-b bg-slate-50/50 flex flex-row justify-between items-center space-y-0">
              <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Conversion rate</CardTitle>
              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{kpis.conversionRate}%</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  ↑ 100%
                </span>
                <span className="text-[10px] text-muted-foreground">Past 30 days</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Sent */}
          <Card className="border-slate-200/80 shadow-sm bg-white min-w-[180px]">
            <CardHeader className="p-3 pb-1 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sent</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <p className="text-2xl font-black text-slate-800 tracking-tight">
                {estimates.filter(e => e.status === "Sent" || e.status === "Viewed").length}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  ↑ 100%
                </span>
                <span className="text-[10px] text-muted-foreground font-mono font-bold">
                  ${estimates.filter(e => e.status === "Sent" || e.status === "Viewed")
                    .reduce((s, e) => s + Number(e.total_amount || 0), 0)
                    .toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Converted */}
          <Card className="border-slate-200/80 shadow-sm bg-white min-w-[180px]">
            <CardHeader className="p-3 pb-1 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Converted</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <p className="text-2xl font-black text-slate-800 tracking-tight">
                {estimates.filter(e => e.status === "Converted").length}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  ↑ 100%
                </span>
                <span className="text-[10px] text-muted-foreground font-mono font-bold">
                  ${estimates.filter(e => e.status === "Converted")
                    .reduce((s, e) => s + Number(e.total_amount || 0), 0)
                    .toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Promo Card */}
          <Card className="border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-primary/5 min-w-[200px]">
            <CardHeader className="p-3 pb-1 border-b">
              <CardTitle className="text-[10px] uppercase font-bold text-primary tracking-wider">Payments Booster</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1 text-[11px] leading-normal text-slate-600">
              <p className="font-semibold text-slate-800">How can I get paid faster?</p>
              <p className="text-muted-foreground text-[10px]">Collect instant card payments in the field or set automatic schedules.</p>
              <Button variant="link" size="xs" className="p-0 text-[10px] text-primary font-bold h-auto mt-1 flex items-center gap-1">
                Enable payments setup <ExternalLink className="h-2.5 w-2.5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3 py-1 rounded-full border border-emerald-200 shadow-sm transition-all duration-300">
                <span className="font-bold">{selectedIds.length} selected</span>
                <div className="h-3.5 w-px bg-emerald-200" />
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 gap-1.5 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-100/50 px-2.5 rounded-full"
                  onClick={() => {
                    if (confirm(`Delete ${selectedIds.length} selected estimates?`)) {
                      bulkDeleteMutation.mutate(selectedIds);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 px-2.5 rounded-full"
                  onClick={() => bulkShare(selectedIds)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Links
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 text-slate-500 hover:text-slate-600 px-2 rounded-full font-medium"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <>
                {/* Status Quick Selection Dropdown badge */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-auto h-8 text-xs font-semibold border-slate-200 bg-white rounded-full px-3 py-0">
                    <span>Status | <span className="text-primary font-bold capitalize">{statusFilter}</span></span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Viewed">Viewed</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Quick Selection Dropdown badge */}
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-slate-200 bg-white rounded-full px-3 py-0 flex items-center gap-1 text-slate-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Date | <span className="text-slate-800 font-bold">All Time</span></span>
                </Button>
              </>
            )}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-white rounded-lg border-slate-200 focus-visible:ring-slate-300"
            />
          </div>
        </div>

        {/* Quotes list catalog Table */}
        <Card className="border-slate-200/80 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {filteredEstimates.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border mx-auto">
                  <Sparkle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No proposals match filters</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Modify search query or click "New Quote" to create service proposals.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-300 text-primary cursor-pointer"
                        checked={filteredEstimates.length > 0 && selectedIds.length === filteredEstimates.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredEstimates.map(est => est.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Client</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Quote number</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Property</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Created</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Total</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right w-[140px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstimates.map((est) => {
                    const daysLeft = est.valid_until ? differenceInDays(new Date(est.valid_until), new Date()) : null;
                    return (
                      <TableRow 
                        key={est.id} 
                        className="hover:bg-slate-50/40 transition-colors bg-white cursor-pointer"
                        onClick={() => setSelectedEstimateForView(est)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary cursor-pointer"
                            checked={selectedIds.includes(est.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, est.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== est.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-800">{est.customer?.name}</div>
                          <div className="text-[10px] text-muted-foreground">{est.customer?.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-700">
                            #{estimates.length - estimates.findIndex(e => e.id === est.id)}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{est.title}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {est.customer?.billing_address || "No Property Listed"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-medium">
                          {format(new Date(est.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{getStatusBadge(est.status)}</TableCell>
                        <TableCell className="text-right text-xs font-mono font-black text-slate-800">
                          ₦{est.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                              onClick={(e) => { e.stopPropagation(); startEditing(est); }}
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEstimateForView(est);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                              onClick={(e) => { e.stopPropagation(); copyApprovalLink(est); }}
                              title="Copy approval link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete estimate "${est.title}"?`)) {
                                  deleteEstimateMutation.mutate(est.id);
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── STANDARD PREVIEW DIALOG ─────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Estimate Proposal Preview
            </DialogTitle>
          </DialogHeader>
          {previewEstimate && (
            <div className="border rounded-xl p-6 bg-background space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-primary">{company?.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Ref: {company?.prefix}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold uppercase text-muted-foreground">ESTIMATE</h2>
                  <p className="text-xs font-mono font-bold mt-1">#{previewEstimate.id.substring(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Date: {format(new Date(previewEstimate.created_at), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {/* Cover Banner */}
              {previewEstimate.introduction_image_url && (
                <img src={previewEstimate.introduction_image_url} alt="" className="h-36 w-full object-cover rounded-xl border" />
              )}

              <div className="grid grid-cols-2 gap-6 text-sm border-t pt-4">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">Prepared For:</div>
                  <div className="font-bold text-foreground mt-1">{previewEstimate.customer?.name}</div>
                  {previewEstimate.customer?.email && (
                    <div className="text-xs text-muted-foreground">{previewEstimate.customer.email}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">Estimate Title:</div>
                  <div className="font-bold text-foreground mt-1">{previewEstimate.title}</div>
                  {previewEstimate.valid_until && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Valid Until: {format(new Date(previewEstimate.valid_until), "MMM dd, yyyy")}
                    </div>
                  )}
                </div>
              </div>

              {previewEstimate.introduction && (
                <div className="text-xs text-muted-foreground border-t pt-4 bg-slate-50 p-3 rounded-lg leading-relaxed italic">
                  "{previewEstimate.introduction}"
                </div>
              )}

              {previewEstimate.client_message && (
                <div className="text-xs text-slate-700 border-t pt-4">
                  <span className="font-bold text-slate-800">Proposal message:</span> {previewEstimate.client_message}
                </div>
              )}

              {previewEstimate.disclaimer && (
                <div className="text-[10px] text-muted-foreground border-t pt-4 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block mb-1">Terms & Conditions:</span>
                  {previewEstimate.disclaimer}
                </div>
              )}

              <div className="border-t pt-4 flex flex-col items-end space-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl">
                <div className="flex justify-between w-64 border-t pt-2 text-sm font-black text-slate-800">
                  <span>Grand Total:</span>
                  <span className="font-mono text-primary">
                    ${previewEstimate.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={() => window.print()} className="gap-1.5">
              Print / PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── NEW ESTIMATE TEMPLATE SELECTION POPUP ───────────────────── */}
      <Dialog open={templateSelectOpen} onOpenChange={setTemplateSelectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              New Estimate Proposal
            </DialogTitle>
            <DialogDescription>
              Select a service proposal template from key niches, or start with a blank quote sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[350px] overflow-y-auto pr-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Use Template</p>
            {SERVICE_TEMPLATES.map((tmpl, idx) => (
              <div
                key={idx}
                onClick={() => startWithTemplate(idx)}
                className="flex items-start justify-between border rounded-xl p-3 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="space-y-0.5 max-w-[80%]">
                  <h4 className="font-bold text-xs text-slate-800">{tmpl.name}</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal truncate">{tmpl.introduction}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center py-2 text-[10px] uppercase font-bold text-muted-foreground">
            <span>or</span>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="ghost" onClick={() => setTemplateSelectOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={startWithBlankQuote} className="font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground">
              Create New Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DISCARD UNSAVED CHANGES GUARD MODAL ─────────────────────── */}
      <Dialog open={discardGuardOpen} onOpenChange={setDiscardGuardOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Discard unsaved changes
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground leading-relaxed">
            You have unsaved changes. Cancelling will discard them.
          </div>
          <DialogFooter className="pt-4 border-t gap-2 flex justify-end">
            <Button variant="outline" onClick={() => setDiscardGuardOpen(false)} className="text-xs font-bold">
              Continue Editing
            </Button>
            <Button onClick={closeWizard} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs">
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  const renderEstimateDetail = (est: Estimate) => {
    const parsedNotes = parseNotes(est.notes);
    const activeOption = viewOptionsData?.[0]; // Default to the first option/tier
    const calcs = activeOption 
      ? getOptionCalculations({
          name: activeOption.name,
          is_recommended: activeOption.is_recommended,
          items: activeOption.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit_price: Number(i.unit_price || 0),
            is_optional: i.is_optional,
            selected_by_client: i.selected_by_client,
            image_url: i.image_url || "",
          }))
        })
      : { subtotal: est.total_amount, discount: est.discount_amount, tax: est.tax_percent, total: est.total_amount };

    const customer = customers.find(c => c.id === est.customer_id) || est.customer;

    return (
      <div className="flex flex-col min-h-screen bg-[#f4f3f0] p-4">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedEstimateForView(null)} className="h-8 w-8 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                STATUS_STYLES[est.status]?.bg || "bg-slate-100"
              } ${STATUS_STYLES[est.status]?.text || "text-slate-600"} ${
                STATUS_STYLES[est.status]?.border || "border-slate-200"
              }`}>
                {est.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-slate-200 bg-white text-slate-700">
                  <MoreVertical className="h-3.5 w-3.5 mr-1" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => startEditing(est)} className="text-xs font-semibold gap-2 py-2">
                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  Edit Quote
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm(`Delete quote "${est.title}"?`)) {
                      deleteEstimateMutation.mutate(est.id);
                      setSelectedEstimateForView(null);
                    }
                  }} 
                  className="text-xs font-semibold text-rose-600 gap-2 py-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Quote
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updateEstimateStatusMutation.mutate({ id: est.id, status: "Sent" })} className="text-xs font-semibold py-2">
                  Mark as Sent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateEstimateStatusMutation.mutate({ id: est.id, status: "Approved" })} className="text-xs font-semibold py-2">
                  Mark as Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateEstimateStatusMutation.mutate({ id: est.id, status: "Declined" })} className="text-xs font-semibold py-2">
                  Mark as Declined
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateEstimateStatusMutation.mutate({ id: est.id, status: "Converted" })} className="text-xs font-semibold py-2">
                  Mark as Converted
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => cloneEstimate(est)} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-8 px-4">
              Create Similar Quote
            </Button>
          </div>
        </div>

        {/* Title Banner with Edit icon */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">{est.title}</h1>
          <button onClick={() => startEditing(est)} className="text-slate-400 hover:text-emerald-700 transition-colors p-1" title="Edit Title">
            <Edit2 className="h-4 w-4" />
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-2">
          {/* Left Column (Main content) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Metadata Section: Client details card + Quote table details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client card details */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 cursor-pointer hover:underline">
                    {customer?.name || "No client selected"}
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1 leading-relaxed">
                  <p className="font-semibold text-slate-700">Property Address</p>
                  <p>{customer?.billing_address || "No address listed"}</p>
                  {customer?.phone && (
                    <a href={`tel:${customer.phone}`} className="text-emerald-700 hover:underline font-semibold block mt-1">
                      {customer.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Quote details Grid */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <table className="w-full text-xs text-slate-600 border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-medium text-slate-500">Quote #</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-700">
                        #{estimates.length - estimates.findIndex(e => e.id === est.id)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-medium text-slate-500">Created</td>
                      <td className="py-1.5 text-right font-semibold text-slate-700">
                        {format(new Date(est.created_at), "MMM dd, yyyy")}
                      </td>
                    </tr>
                    {est.status === "Converted" && (
                      <tr className="border-b border-slate-100">
                        <td className="py-1.5 font-medium text-slate-500">Converted</td>
                        <td className="py-1.5 text-right font-semibold text-slate-700">
                          {format(new Date(est.updated_at), "MMM dd, yyyy")}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-medium text-slate-500">Lead for</td>
                      <td className="py-1.5 text-right font-semibold text-emerald-700 hover:underline cursor-pointer">
                        {est.job_id ? `Job #${est.job_id.substring(0, 4).toUpperCase()}` : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium text-slate-500">From Request</td>
                      <td className="py-1.5 text-right font-semibold text-emerald-700 hover:underline cursor-pointer">
                        {format(new Date(est.created_at), "MMM dd, yyyy")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Intro cover section if exists */}
            {(est.introduction || est.introduction_image_url) && (
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                {est.introduction_image_url && (
                  <img src={est.introduction_image_url} alt="" className="w-full h-44 object-cover" />
                )}
                {est.introduction && (
                  <p className="p-4 text-xs text-slate-600 leading-relaxed italic border-t border-slate-100 bg-slate-50/50">
                    "{est.introduction}"
                  </p>
                )}
              </div>
            )}

            {/* Product / Service Section card */}
            <Card className="border-slate-200 shadow-none bg-white p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 italic">Product / Service</h3>
                <button onClick={() => startEditing(est)} className="text-slate-400 hover:text-emerald-700 transition-colors p-1" title="Edit Line Items">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {/* Items List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left font-semibold text-slate-500">
                      <th className="pb-2 w-[60%]">Line item</th>
                      <th className="pb-2 text-center w-[10%]">Quantity</th>
                      <th className="pb-2 text-right w-[15%]">Unit Price</th>
                      <th className="pb-2 text-right w-[15%]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOption?.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40">
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="h-8 w-8 object-cover rounded border border-slate-200 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{item.name}</div>
                              {item.description && (
                                <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-line leading-relaxed">
                                  {item.description}
                                </div>
                              )}
                              {item.is_optional && (
                                <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 font-semibold px-1 rounded">
                                  Optional client add-on
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center font-mono text-slate-700 font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-700 font-medium">
                          ₦{Number(item.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-800">
                          ₦{(Number(item.unit_price || 0) * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {(!activeOption || activeOption.items.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground italic">
                          No items added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals calculations breakdown */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <div className="w-full max-w-[280px] space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">₦{calcs.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {calcs.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount</span>
                      <span className="font-mono">-₦{calcs.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {calcs.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({est.tax_percent}%)</span>
                      <span className="font-mono">₦{((calcs.subtotal - calcs.discount) * (est.tax_percent / 100)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-800">
                    <span>Total</span>
                    <span className="font-mono">₦{calcs.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contract / Disclaimer Section card */}
            {est.disclaimer && (
              <Card className="border-slate-200 shadow-none bg-white p-5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 italic">Contract / Disclaimer</h3>
                  <button onClick={() => startEditing(est)} className="text-slate-400 hover:text-emerald-700 transition-colors p-1" title="Edit Disclaimer">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {est.disclaimer}
                </p>
              </Card>
            )}

            {/* Client Message Section card */}
            {est.client_message && (
              <Card className="border-slate-200 shadow-none bg-white p-5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 italic">Client Message</h3>
                  <button onClick={() => startEditing(est)} className="text-slate-400 hover:text-emerald-700 transition-colors p-1" title="Edit Client Message">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                  {est.client_message}
                </p>
              </Card>
            )}
          </div>

          {/* Right Column (Sidebar for Notes) */}
          <div className="space-y-6">
            <div className="border border-slate-200 bg-white rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Notes</h3>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-6 w-6 text-slate-500 border-slate-200 hover:bg-slate-50 rounded"
                  onClick={() => setShowAddNote(!showAddNote)}
                  title="Add Note"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Add Note inline field */}
              {showAddNote && (
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <Textarea
                    rows={3}
                    placeholder="Type your internal note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="text-xs border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-emerald-600 focus-visible:border-emerald-600"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 font-medium" onClick={() => { setShowAddNote(false); setNewNoteText(""); }}>
                      Cancel
                    </Button>
                    <Button 
                      disabled={!newNoteText.trim() || addNoteMutation.isPending} 
                      onClick={() => addNoteMutation.mutate({ id: est.id, text: newNoteText })}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-7 px-3 rounded"
                    >
                      {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {parsedNotes.map((note, idx) => (
                  <div key={idx} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                          {note.author.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 leading-none">{note.author}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {format(new Date(note.created_at), "MMM dd, yyyy, HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-8">
                      {note.text}
                    </p>
                    <div className="pl-8 pt-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                        Linked note
                      </span>
                    </div>
                  </div>
                ))}
                {parsedNotes.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    No internal notes left for this quote.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SEO
        title="Estimates & Proposals"
        description="Create Good/Better/Best proposals, send approval links, and convert estimates to jobs."
        path="/estimates"
        noIndex
      />
      <DashboardLayout
        activeTab="estimates"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        {wizardOpen 
          ? renderProposalBuilder() 
          : selectedEstimateForView 
            ? renderEstimateDetail(selectedEstimateForView) 
            : pageContent}
      </DashboardLayout>
    </>
  );
}
