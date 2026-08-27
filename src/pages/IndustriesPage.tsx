import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Thermometer,
  Droplets,
  Zap,
  Leaf,
  Sparkles,
  Bug,
  Hammer,
  ShieldCheck,
  Building2,
  Home,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Clock,
  DollarSign,
  FileCheck2,
  MapPin,
  Smartphone,
  ShieldAlert,
  CalendarCheck,
  TrendingUp,
  Receipt,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

interface IndustryTrade {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: any;
  accent: string;
  bannerBg: string;
  stats: { label: string; value: string }[];
  fieldWorkflows: string[];
  solvedProblems: { pain: string; solution: string }[];
}

const trades: IndustryTrade[] = [
  {
    id: "hvac",
    name: "HVAC & Mechanical",
    tagline: "Preventative Maintenance & Rapid Weather-Spike Dispatch",
    description: "Handle emergency summer cooling spikes and winter heating breakdowns with intelligent technician routing, EPA refrigerant logging, and recurring membership service contracts.",
    icon: Thermometer,
    accent: "text-amber-600 bg-amber-50 border-amber-200",
    bannerBg: "from-amber-950 via-slate-900 to-slate-950",
    stats: [
      { label: "Dispatch Response", value: "<12 min" },
      { label: "Contract Renewal", value: "94%" },
      { label: "Avg Ticket Growth", value: "+38%" }
    ],
    fieldWorkflows: [
      "Seasonal HVAC membership auto-renewals & monthly ACH billing",
      "Compressor & condenser equipment QR code lifecycle tracking",
      "EPA Section 608 compliant refrigerant recovery logs",
      "Good / Better / Best system replacement estimate options"
    ],
    solvedProblems: [
      { pain: "Losing recurring service agreement revenue", solution: "Automated monthly card charging & spring/fall tune-up scheduling." },
      { pain: "Technicians guessing past unit repair history", solution: "Instant equipment QR scan pulls every past filter, motor, and capacitor repair." }
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing & Drain Services",
    tagline: "Emergency Diagnostics & On-Site Digital Invoicing",
    description: "Arm your plumbers with camera inspection photo attachments, itemized flat-rate pricebooks, and instant mobile card checkout before leaving the driveway.",
    icon: Droplets,
    accent: "text-cyan-600 bg-cyan-50 border-cyan-200",
    bannerBg: "from-cyan-950 via-slate-900 to-slate-950",
    stats: [
      { label: "Invoice Collection", value: "Same-Day" },
      { label: "Truck Restock Accuracy", value: "99.2%" },
      { label: "Callback Reduction", value: "45%" }
    ],
    fieldWorkflows: [
      "Emergency leak dispatch with live technician ETA SMS",
      "Flat-rate pricing book for fixtures, repipes, and water heaters",
      "Before & after photo documentation on work orders",
      "Stripe contactless Tap to Pay & Apple Pay on mobile"
    ],
    solvedProblems: [
      { pain: "Unpaid invoices sitting 30+ days after repair", solution: "Instant mobile payment collection with automatic receipt texting." },
      { pain: "Disputes over pre-existing water damage", solution: "Mandatory photo check-in timestamps before opening drywall or slabs." }
    ]
  },
  {
    id: "electrical",
    name: "Electrical & High Voltage",
    tagline: "Code Compliance, LOTO Safety & Multi-Stage Billing",
    description: "Manage residential panel upgrades and multi-phase commercial electrical jobs with OSHA safety checklists, permit tracking, and change-order customer sign-offs.",
    icon: Zap,
    accent: "text-blue-600 bg-blue-50 border-blue-200",
    bannerBg: "from-blue-950 via-slate-900 to-slate-950",
    stats: [
      { label: "Safety Compliance", value: "100%" },
      { label: "Change Order Approvals", value: "10 min" },
      { label: "Profit Margin Clarity", value: "Real-Time" }
    ],
    fieldWorkflows: [
      "Lockout / Tagout (LOTO) and job site safety sign-offs",
      "Digital customer signature on unexpected wire run change orders",
      "Detailed category cost tracking (Labor, Materials, Subcontractors)",
      "Two-way QuickBooks Online & Xero invoice sync"
    ],
    solvedProblems: [
      { pain: "Unbilled scope creep on complex rewires", solution: "One-tap digital change orders required before energized work begins." },
      { pain: "Failed city inspections due to missing documentation", solution: "Structured panel schedule and permit photo logs attached to each job." }
    ]
  },
  {
    id: "landscaping",
    name: "Landscaping & Lawn Care",
    tagline: "Route Density Optimization & Recurring Property Care",
    description: "Maximize route density for mowing, fertilization, hardscaping, and seasonal cleanups. Geofence tracking logs exact on-property crew hours automatically.",
    icon: Leaf,
    accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    bannerBg: "from-emerald-950 via-slate-900 to-slate-950",
    stats: [
      { label: "Route Fuel Savings", value: "28%" },
      { label: "Daily Property Volume", value: "+30%" },
      { label: "Billing Automation", value: "100%" }
    ],
    fieldWorkflows: [
      "Intelligent visual route ordering for minimal windshield time",
      "Automated perimeter geofence clock-in when mower reaches property",
      "Material consumption tracking for mulch, sod, and fertilizer",
      "Monthly batch invoicing for recurring commercial accounts"
    ],
    solvedProblems: [
      { pain: "Crews spending 40% of their workday driving", solution: "Optimized route clustering grouping adjacent neighborhood properties." },
      { pain: "Clients claiming crews skipped their property", solution: "GPS geofence entry and exit audit timestamps prove exact crew presence." }
    ]
  },
  {
    id: "cleaning",
    name: "Commercial & Turnover Cleaning",
    tagline: "Room-by-Room Inspection QA & Shift Proof",
    description: "Coordinate residential maid teams and commercial janitorial staff with mandatory room checklists, supervisor photo verification, and biometric face check-ins.",
    icon: Sparkles,
    accent: "text-purple-600 bg-purple-50 border-purple-200",
    bannerBg: "from-purple-950 via-slate-900 to-slate-950",
    stats: [
      { label: "QA Pass Rate", value: "98.5%" },
      { label: "Time Theft", value: "0.0%" },
      { label: "Supervisor Review Time", value: "-75%" }
    ],
    fieldWorkflows: [
      "Room-by-room digital checklist with mandatory photo proof",
      "Biometric selfie face verification prevents buddy punching",
      "Secure keybox code access revealed only upon geofence arrival",
      "Automated client satisfaction review requests after completion"
    ],
    solvedProblems: [
      { pain: "Cleaners clocking in before arriving at facility", solution: "Face check-in locked until physical entry into facility geofence." },
      { pain: "Missed checklist items leading to client complaints", solution: "Turnover jobs cannot close until all room checklist photos pass QA." }
    ]
  },
  {
    id: "pest",
    name: "Pest & Termite Control",
    tagline: "EPA Chemical Logs & Recurring Bait Station Inspections",
    description: "Ensure regulatory compliance for chemical applications, target pest histories, and recurring quarterly barrier treatments across residential and commercial accounts.",
    icon: Bug,
    accent: "text-rose-600 bg-rose-50 border-rose-200",
    bannerBg: "from-rose-950 via-slate-900 to-slate-950",
    stats: [
      { label: "Audit Readiness", value: "100%" },
      { label: "Customer Retention", value: "92%" },
      { label: "Chemical Waste", value: "-22%" }
    ],
    fieldWorkflows: [
      "EPA chemical dosage, EPA reg number, and wind condition records",
      "Bait station barcode scanning with activity level logging",
      "Automated 30/60/90 day recurring service notifications",
      "Homeowner chemical safety advisories sent via automated SMS"
    ],
    solvedProblems: [
      { pain: "Fines from missing chemical state compliance logs", solution: "Standardized chemical dropdowns require dosage entry before job close." },
      { pain: "Lost revenue on overdue quarterly treatments", solution: "Automated booking links SMS'd to homeowners when treatments are due." }
    ]
  },
  {
    id: "general-contracting",
    name: "General Contracting & Trades",
    tagline: "Milestone Billing, Subcontractor Costs & Field Logs",
    description: "Manage multi-week remodeling, roofing, security, and restoration projects with milestone draw schedules, subcontractor cost codes, and real-time job profitability.",
    icon: Hammer,
    accent: "text-stone-700 bg-stone-100 border-stone-300",
    bannerBg: "from-stone-950 via-slate-900 to-slate-950",
    stats: [
      { label: "Budget Overrun Warning", value: "Real-Time" },
      { label: "Progress Billing", value: "Instant" },
      { label: "Daily Field Logs", value: "100%" }
    ],
    fieldWorkflows: [
      "Milestone progress draws tied to digital homeowner sign-offs",
      "Daily site logs with weather, subcontractor headcounts, and delays",
      "Subcontractor cost categories with budget vs actual margin charts",
      "Client approval portal for architectural finish selections"
    ],
    solvedProblems: [
      { pain: "Finding out a project lost money after completion", solution: "Real-time budget tracking alerts you the instant labor or materials exceed target margin." },
      { pain: "Disputes over delays caused by other trades", solution: "Timestamped daily site logs document external trade delays and weather halts." }
    ]
  }
];

export default function IndustriesPage() {
  return (
    <>
      <SEO
        title="Field Service Industries & Trades | FiledCrews"
        description="Explore how FiledCrews powers HVAC, plumbing, electrical, landscaping, cleaning, pest control, and general contracting field operations with customized trade workflows."
        path="/industries"
      />
      <Helmet>
        <link rel="canonical" href="https://filedcrews.com/industries" />
      </Helmet>

      <div className="min-h-screen bg-white text-slate-900">
        
        {/* ──── TOP NAVBAR ──── */}
        <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
            <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="FiledCrews Homepage">
              <img src="/favicon.png" alt="FiledCrews" className="h-8 w-8 rounded-lg" width="32" height="32" />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                FiledCrews<span className="text-teal-600">.</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
              <Link to="/features" className="hover:text-slate-900 transition-colors">Features</Link>
              <Link to="/industries" className="text-teal-600 font-semibold transition-colors">Industries</Link>
              <Link to="/#compare" className="hover:text-slate-900 transition-colors">Compare</Link>
              <Link to="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">Log in</Button>
              </Link>
              <Link to="/wizard">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ──── HERO SECTION ──── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-50/50 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-stone-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Engineered specifically for your{" "}
                <span className="text-teal-600">trade workflows.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
                Generic field apps treat every business like a standard calendar invite. FiledCrews provides deep, trade-specific logic for HVAC, plumbing, electrical, landscaping, cleaning, pest control, and contracting.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/wizard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-bold bg-slate-950 hover:bg-slate-800 text-white shadow-xl shadow-slate-950/15 rounded-xl">
                    Select Your Trade & Start Free <ArrowRight className="ml-2 h-4 w-4 text-teal-400" />
                  </Button>
                </Link>
                <a href="#trades" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base font-semibold border-stone-300 text-slate-700 hover:bg-stone-50 rounded-xl">
                    Explore All 7 Trade Stacks
                  </Button>
                </a>
              </div>
            </div>

            {/* Quick Trade Selector Grid */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-6xl mx-auto">
              {trades.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white border border-stone-200 hover:border-teal-500 hover:shadow-md transition-all text-center group"
                >
                  <div className="h-9 w-9 rounded-lg bg-stone-50 group-hover:bg-teal-50 flex items-center justify-center text-slate-700 group-hover:text-teal-600 transition-colors">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 mt-2 group-hover:text-teal-700 transition-colors">
                    {t.name.split(' ')[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ──── DETAILED TRADE MODULES ──── */}
        <section id="trades" className="py-16 md:py-24 space-y-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-28">
            {trades.map((trade, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = trade.icon;
              return (
                <div
                  key={trade.id}
                  id={trade.id}
                  className="scroll-mt-24 rounded-3xl border border-stone-200/90 bg-stone-50/40 p-6 sm:p-8 lg:p-12 shadow-sm"
                >
                  <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    
                    {/* Left: Trade Header & Workflows */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-md">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {trade.name}
                          </h2>
                          <p className="text-sm font-semibold text-teal-700">
                            {trade.tagline}
                          </p>
                        </div>
                      </div>

                      <p className="text-base text-slate-600 leading-relaxed font-normal">
                        {trade.description}
                      </p>

                      {/* Performance Metric Bar */}
                      <div className="grid grid-cols-3 gap-3 py-2">
                        {trade.stats.map((st, i) => (
                          <div key={i} className="rounded-xl bg-white border border-stone-200/80 p-3.5 text-center shadow-xs">
                            <div className="text-lg sm:text-xl font-extrabold text-slate-900">{st.value}</div>
                            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{st.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Built-in Trade Workflows */}
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Built-in Trade Workflows
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {trade.fieldWorkflows.map((wf, wfi) => (
                            <div key={wfi} className="flex items-start gap-2.5 rounded-lg bg-white border border-stone-200/70 p-3 text-xs font-semibold text-slate-800">
                              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                              <span>{wf}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link to="/wizard">
                          <Button className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm">
                            Setup {trade.name} Account &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right: Solved Field Problems */}
                    <div className="lg:col-span-5 space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Operational Challenges Solved
                      </h3>
                      <div className="space-y-3">
                        {trade.solvedProblems.map((sp, spi) => (
                          <div key={spi} className="rounded-2xl bg-white border border-stone-200/90 p-5 space-y-2.5 shadow-xs">
                            <div className="flex items-start gap-2 text-xs font-bold text-rose-700">
                              <span className="uppercase text-[10px] font-black tracking-wider bg-rose-50 text-rose-600 px-2 py-0.5 rounded">Before</span>
                              <span>{sp.pain}</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs font-semibold text-teal-800 pt-1 border-t border-stone-100">
                              <span className="uppercase text-[10px] font-black tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded">FiledCrews</span>
                              <span>{sp.solution}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Trade Quick Stat Box */}
                      <div className="rounded-2xl bg-slate-950 text-white p-5 space-y-2 border border-slate-800">
                        <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                          <TrendingUp className="h-4 w-4" />
                          <span>Immediate ROI Impact</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Field crews running on FiledCrews save an average of 4.2 administrative hours per technician weekly while eliminating 100% of missed billing.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ──── GLOBAL COMPARISON / TRADE MATRIX ──── */}
        <section className="py-16 md:py-24 bg-stone-50 border-t border-b border-stone-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How FiledCrews Compares for Contractors
              </h2>
              <p className="text-base text-slate-600">
                Stop paying per-technician penalties for software that forces your trade into generic templates.
              </p>
            </div>

            <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-900 text-white text-xs sm:text-sm font-bold py-4 px-6">
                <div>Capability</div>
                <div className="text-teal-400">FiledCrews FSM</div>
                <div className="text-slate-400">Legacy Trade Software</div>
              </div>
              <div className="divide-y divide-stone-100 text-xs sm:text-sm font-medium text-slate-700">
                {[
                  { feat: "Core Platform Pricing", fc: "100% Free Core Plan", leg: "$150 - $450 / month" },
                  { feat: "Per-Technician Seat Fees", fc: "$0 / No user penalization", leg: "$49 - $129 per tech" },
                  { feat: "Automated GPS Geofencing", fc: "Included (50m - 500m)", leg: "Expensive Add-on / None" },
                  { feat: "Biometric Face Check-in", fc: "Built-in Anti-Fraud", leg: "Not available" },
                  { feat: "Trade Inventory & POs", fc: "Integrated Van Tracking", leg: "Separate ERP required" },
                  { feat: "AI Voice Phone Receptionist", fc: "24/7 Autonomous Lead Capture", leg: "Third-party call center ($$)" },
                  { feat: "Offline-First Mobile Architecture", fc: "Full Offline PWA + APK", leg: "Requires constant 5G connection" },
                  { feat: "Two-Way Accounting Sync", fc: "QuickBooks & Xero Included", leg: "$50/mo integration fee" },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-3 py-3.5 px-6 items-center hover:bg-stone-50/70 transition-colors">
                    <div className="font-semibold text-slate-900">{row.feat}</div>
                    <div className="text-teal-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>{row.fc}</span>
                    </div>
                    <div className="text-slate-500">{row.leg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ──── CALL TO ACTION ──── */}
        <section className="py-20 md:py-28 bg-slate-950 text-white relative overflow-hidden text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Ready to modernize your field operations?
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Select your trade, invite your technicians, and start scheduling and invoicing in under 3 minutes.
            </p>
            <div className="pt-4">
              <Link to="/wizard">
                <Button size="lg" className="px-9 py-6 text-base font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow-xl shadow-teal-600/20">
                  Launch Your Trade Workspace Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ──── FOOTER ──── */}
        <footer className="border-t border-stone-200 bg-white py-12 text-slate-500 text-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="FiledCrews" className="h-6 w-6 rounded" />
              <span className="font-bold text-slate-900 text-sm">FiledCrews FSM</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-slate-600">
              <Link to="/features" className="hover:text-slate-900 transition-colors">Features</Link>
              <Link to="/industries" className="hover:text-slate-900 transition-colors font-semibold text-teal-600">Industries</Link>
              <Link to="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} FiledCrews Inc. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
