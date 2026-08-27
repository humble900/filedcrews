import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Map,
  Target,
  ScanFace,
  QrCode,
  Package,
  RefreshCw,
  Calendar,
  Bot,
  Star,
  FileText,
  DollarSign,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Smartphone,
  Layers,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

interface FeatureCard {
  icon: typeof Map;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  points: string[];
}

const tier1Features: FeatureCard[] = [
  {
    icon: Map,
    title: "Live GPS Map Dispatching",
    badge: "Real-Time Tracking",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Track your entire fleet and field workforce in real time on an interactive live map with vehicle speed, traffic overlays, and nearest-technician dispatch.",
    points: [
      "Live vehicle location and route playback",
      "Instant nearest-tech routing to emergency calls",
      "Street, satellite, and live traffic overlays",
    ],
  },
  {
    icon: Target,
    title: "Geofence Automated Timecards",
    badge: "Zero Timesheet Fraud",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Draw 50m–500m virtual boundaries around job sites. Automatically log arrival and departure timestamps with GPS audit verification.",
    points: [
      "Automated hands-free clock-in and clock-out",
      "Complete elimination of timesheet rounding & padding",
      "Instant dispatcher alert on site perimeter departure",
    ],
  },
  {
    icon: ScanFace,
    title: "Biometric Face ID Verification",
    badge: "Anti-Buddy Punching",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    description: "Ensure the right technician is on the right job site. Quick selfie check-in uses AI facial recognition matched against the technician's encrypted profile.",
    points: [
      "Instant sub-second facial recognition verification",
      "GPS geotagged & timestamped selfie audit records",
      "Works on iOS, Android, and mobile web browsers",
    ],
  },
  {
    icon: Calendar,
    title: "Drag-and-Drop Scheduling & Dispatch",
    badge: "Smart Dispatch",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    description: "Schedule jobs, assign crews, and balance workloads across days or weeks with a visual color-coded calendar and automated SMS client arrival windows.",
    points: [
      "Visual day, week, month, and crew-timeline views",
      "Automated customer 'On My Way' SMS notifications",
      "Multi-day project milestones and shift re-assignments",
    ],
  },
  {
    icon: FileText,
    title: "Good / Better / Best Multi-Option Quotes",
    badge: "Higher Close Rates",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Create professional tiered proposals that allow homeowners to choose premium upgrades. Capture digital e-signatures instantly on phone, tablet, or web.",
    points: [
      "3-tier Good/Better/Best proposal presentation",
      "Instant client SMS/Email approval with digital signature",
      "Auto-converts approved quotes into work orders & invoices",
    ],
  },
  {
    icon: Receipt,
    title: "Invoicing & Instant Mobile Payments",
    badge: "Same-Day Cash Flow",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    description: "Generate itemized invoices directly from completed work orders. Accept credit cards, debit, and ACH bank transfers on-site or via self-service SMS payment links.",
    points: [
      "Powered by secure Stripe payment processing",
      "Automated overdue payment reminders via SMS & email",
      "Detailed receipt issuance and partial deposit tracking",
    ],
  },
];

const tier2Features: FeatureCard[] = [
  {
    icon: QrCode,
    title: "Equipment & Asset QR Tracking",
    badge: "Lifecycle Management",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Maintain comprehensive records of client equipment (HVAC air handlers, condensers, water heaters, electrical panels) tracked by serial number and physical QR codes.",
    points: [
      "On-site QR and barcode scanning with phone camera",
      "Instant access to full repair history and previous parts used",
      "Manufacturer warranty expiration tracking and alerts",
    ],
  },
  {
    icon: Package,
    title: "Truck & Warehouse Inventory + POs",
    badge: "Van Stock Control",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    description: "Track parts, supplies, and materials across individual service vans and central warehouse locations. Issue vendor purchase orders with low-stock reorder triggers.",
    points: [
      "Multi-location truck vs warehouse stock visibility",
      "Direct supplier purchase order (PO) generation & tracking",
      "Automated stock level deductions upon job completion",
    ],
  },
  {
    icon: RefreshCw,
    title: "Service Agreements & Recurring Clubs",
    badge: "Predictable Recurring Revenue",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Build a high-margin recurring revenue stream with maintenance agreements and VIP service clubs. Automate recurring credit card billing and seasonal tune-up visits.",
    points: [
      "Automated monthly or annual recurring card billing",
      "Pre-scheduled spring/fall maintenance tune-up triggers",
      "Custom member discount tiers on parts and emergency labor",
    ],
  },
  {
    icon: Bot,
    title: "24/7 AI Phone Voice Receptionist & Copilot",
    badge: "Autonomous Voice AI",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    description: "Never miss an emergency call or after-hours inquiry. The AI voice agent answers calls, captures customer details, books calendar slots, and transcribes voice notes to quotes.",
    points: [
      "Human-like conversational voice answering 24/7/365",
      "Direct calendar booking into available technician slots",
      "Field technician speech-to-estimate voice dictation",
    ],
  },
  {
    icon: Smartphone,
    title: "Customer Self-Service Portal & Web Booking",
    badge: "Client Experience",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Embed an instant web booking calendar on your website. Give homeowners a modern self-service portal to approve quotes, track technician ETA, and pay invoices.",
    points: [
      "Embeddable website booking widget with instant confirmation",
      "Homeowner portal for quote e-signing, invoices, and job history",
      "Live GPS technician tracking link on service day",
    ],
  },
  {
    icon: Star,
    title: "Automated Google Review Engine",
    badge: "5-Star Reputation",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Skyrocket your local search ranking on Google Maps. AI analyzes technician completion notes and sends automated review requests via SMS to satisfied homeowners.",
    points: [
      "AI sentiment analysis to target high-satisfaction clients",
      "Automated 1-click Google review link sent via SMS",
      "Internal feedback capture for negative experiences",
    ],
  },
  {
    icon: DollarSign,
    title: "Real-Time Job Costing & Gross Margins",
    badge: "Profit Intelligence",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    description: "Know your exact profitability before leaving the driveway. Itemize technician hourly wages, material costs, equipment rentals, and subcontractor expenses per job.",
    points: [
      "Real-time gross margin calculation against project budgets",
      "Itemized labor, materials, and subcontractor cost ledger",
      "Profitability reporting by trade, technician, and job type",
    ],
  },
  {
    icon: Layers,
    title: "Two-Way QuickBooks & Xero Sync",
    badge: "Clean Accounting",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Bi-directional synchronization for customers, items, timesheets, and invoices. Keep your accounting clean with zero double-entry and no duplicate records.",
    points: [
      "Automatic sync of customers, invoices, and payments",
      "Export payroll-ready geofence-verified timesheets",
      "Reconcile payments and bank deposits automatically",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <SEO
        title="FiledCrews Features — Complete Field Service Management & Dispatch Software"
        description="Explore the full suite of FiledCrews FSM features: Live GPS dispatching, geofence timecards, biometric face verification, equipment QR tracking, inventory POs, service memberships, AI voice receptionist, and QuickBooks sync."
        path="/features"
      />

      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
            <Link to="/" className="flex items-center gap-2" aria-label="FiledCrews Homepage">
              <img src="/favicon.png" alt="FiledCrews" className="h-8 w-8 rounded-lg" width="32" height="32" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                FiledCrews<span className="text-teal-600">.</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <Link to="/features" className="text-teal-700 font-bold">Features</Link>
              <Link to="/#compare" className="hover:text-slate-900 transition-colors">Compare</Link>
              <Link to="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
              <Link to="/about" className="hover:text-slate-900 transition-colors">About</Link>
              <Link to="/support" className="hover:text-slate-900 transition-colors">Support</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">
                  Log In
                </Button>
              </Link>
              <Link to="/wizard">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm" aria-label="Get Started Free">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        <section className="bg-gradient-to-b from-white via-stone-50 to-teal-50/30 pt-16 pb-20 border-b border-stone-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold bg-teal-50 border border-teal-200 text-teal-800">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Complete Field Service Operating System
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Every tool to dispatch, execute, and grow your trade business.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From real-time GPS tracking and geofence timecards to equipment QR lifecycles, van inventory, recurring service clubs, and 24/7 AI voice phone agents.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/wizard">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-slate-950 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-950/20">
                  Start Free Account <ArrowRight className="ml-2 h-5 w-5 text-teal-400" />
                </Button>
              </Link>
              <Link to="/#compare">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base border-stone-300 text-slate-700 font-bold rounded-2xl">
                  Compare with Jobber & ServiceTitan
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Content Sections */}
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-20">
            
            {/* Section 1: Tier 1 Core FSM Operations */}
            <section className="space-y-8">
              <div className="text-center max-w-3xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Core Dispatch & Field Management
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Streamlined Field Dispatch & Real-Time Auditing
                </h2>
                <p className="text-slate-600 text-base">
                  Eliminate paperwork, lost hours, and timesheet fraud with automated GPS and biometric auditing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tier1Features.map((feat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="rounded-3xl bg-white border border-stone-200/90 p-7 shadow-sm hover:shadow-xl hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                          <feat.icon className="h-6 w-6" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${feat.badgeColor}`}>
                          {feat.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{feat.title}</h3>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{feat.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 pt-4 border-t border-stone-100 text-xs text-slate-700 font-medium">
                      {feat.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Section 2: Tier 2 Advanced Operations */}
            <section className="space-y-8 pt-8">
              <div className="text-center max-w-3xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Enterprise Operations & Growth
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Advanced Capabilities for Scaling Contractors
                </h2>
                <p className="text-slate-600 text-base">
                  Equipment tracking, van stock management, recurring service clubs, and 24/7 AI receptionist.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tier2Features.map((feat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="rounded-3xl bg-white border border-stone-200/90 p-7 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                          <feat.icon className="h-6 w-6" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${feat.badgeColor}`}>
                          {feat.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{feat.title}</h3>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{feat.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 pt-4 border-t border-stone-100 text-xs text-slate-700 font-medium">
                      {feat.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Bottom CTA Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-8 sm:p-12 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="max-w-2xl mx-auto space-y-3 relative z-10">
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-400 bg-teal-950/80 border border-teal-500/30 px-3.5 py-1 rounded-full">
                  Get Started in Minutes
                </span>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Ready to upgrade your field service business?
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Join hundreds of HVAC, plumbing, electrical, and landscaping businesses running on FiledCrews today. $0 core tier, no credit card required.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <Link to="/wizard">
                  <Button size="lg" className="w-full sm:w-auto px-9 py-6 text-base bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-full shadow-lg shadow-teal-500/25">
                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/#pricing">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base border-slate-700 text-slate-200 hover:text-white font-bold rounded-full">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-stone-200 bg-white py-10 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="FiledCrews" className="h-5 w-5 rounded-md" width="20" height="20" />
              <span className="font-bold text-slate-800">FiledCrews FSM</span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 font-medium">
              <Link to="/features" className="text-slate-900 font-semibold">Features</Link>
              <Link to="/about" className="hover:text-slate-900 transition-colors">About</Link>
              <Link to="/support" className="hover:text-slate-900 transition-colors">Support</Link>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
