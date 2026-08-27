import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Scan,
  Calendar,
  FileCheck,
  CreditCard,
  QrCode,
  Box,
  Repeat,
  Phone,
  Globe,
  Star,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

interface FeatureDetail {
  icon: typeof MapPin;
  title: string;
  description: string;
  specs: string[];
}

const dispatchFeatures: FeatureDetail[] = [
  {
    icon: MapPin,
    title: "Live GPS Fleet & Tech Dispatching",
    description: "Monitor your entire workforce on an interactive live map with real-time speed tracking, traffic overlays, and instant nearest-technician dispatch to emergency service calls.",
    specs: ["Sub-second location refreshes", "Historical route breadcrumbs", "Nearest technician routing algorithm"],
  },
  {
    icon: Clock,
    title: "Automated Geofence Time Audits",
    description: "Define 50m–500m virtual boundaries around job addresses. Shift check-ins and departures are logged automatically when entering or exiting the perimeter.",
    specs: ["Hands-free auto clock-in/out", "Tamper-proof GPS audit trails", "Instant perimeter departure alerts"],
  },
  {
    icon: Scan,
    title: "Biometric Face ID Verification",
    description: "Require a quick selfie at shift start. AI facial recognition matches the technician's profile photo to ensure the right crew member is physically on site.",
    specs: ["Instant identity verification", "Encrypted facial embedding match", "Zero buddy-punching or proxy sign-ins"],
  },
];

const operationsFeatures: FeatureDetail[] = [
  {
    icon: Calendar,
    title: "Drag-and-Drop Scheduling Calendar",
    description: "Visual calendar dispatching with multi-technician day, week, and timeline views. Adjust assignments in seconds and trigger automated customer arrival windows.",
    specs: ["Color-coded trade categorization", "Automated customer 'On My Way' SMS", "Multi-day milestone tracking"],
  },
  {
    icon: FileCheck,
    title: "Good / Better / Best Multi-Tier Proposals",
    description: "Present clean multi-option proposals directly on phone or tablet. Allow clients to choose premium upgrades with built-in digital signature capture.",
    specs: ["3-tier proposal layouts", "SMS & email instant approval links", "One-click conversion to active work orders"],
  },
  {
    icon: CreditCard,
    title: "On-Site Invoicing & Stripe Card Processing",
    description: "Generate itemized invoices upon job completion and collect payments immediately on-site via card reader, tap-to-pay, or secure self-service SMS payment links.",
    specs: ["Direct Stripe payment integration", "Automated overdue balance reminders", "Instant receipt generation"],
  },
];

const assetFeatures: FeatureDetail[] = [
  {
    icon: QrCode,
    title: "Equipment & Asset QR Lifecycle Tracking",
    description: "Track customer HVAC systems, water heaters, and electrical panels by serial number. Scan QR codes on-site for immediate access to full service history and warranty status.",
    specs: ["Camera-based QR & barcode scanning", "Complete parts and maintenance history", "Warranty expiration tracking & alerts"],
  },
  {
    icon: Box,
    title: "Truck Van Stock & Warehouse Inventory",
    description: "Track parts and consumable supplies across every individual service vehicle and central warehouse. Create supplier purchase orders with low-stock warnings.",
    specs: ["Real-time van stock inventory counts", "Supplier PO creation and receiving", "Auto-depletion upon job completion"],
  },
  {
    icon: Repeat,
    title: "Recurring Maintenance Agreements & Service Clubs",
    description: "Build predictable recurring revenue with VIP service memberships. Automate monthly credit card charging and auto-schedule spring and fall tune-ups.",
    specs: ["Automated recurring subscription billing", "Seasonal tune-up scheduler", "Member-specific pricing & discount tiers"],
  },
];

const aiAutomationFeatures: FeatureDetail[] = [
  {
    icon: Phone,
    title: "24/7 Autonomous AI Voice Phone Receptionist",
    description: "Never lose a high-value after-hours call. The autonomous voice agent answers incoming calls, captures customer requirements, and books available appointment slots.",
    specs: ["Natural conversational voice handling", "Direct calendar scheduling integration", "Voice-to-quote dictation for field techs"],
  },
  {
    icon: Globe,
    title: "Customer Self-Service Portal & Web Booking",
    description: "Embed an instant booking calendar on your website and provide homeowners with a self-service portal to approve estimates, track technician ETA, and download receipts.",
    specs: ["Embeddable responsive web widget", "Live GPS technician tracking on service day", "Self-service quote approval & payment"],
  },
  {
    icon: Star,
    title: "Automated Google Review SMS Engine",
    description: "Analyze technician job notes for positive sentiment upon completion and trigger automated review requests via SMS to satisfied clients to boost local Google ranking.",
    specs: ["Sentiment-triggered SMS invitations", "Direct 1-click Google review link", "Internal feedback capture for exceptions"],
  },
  {
    icon: TrendingUp,
    title: "Real-Time Job Costing & Profit Margins",
    description: "Track exact labor hours, material costs, equipment rentals, and subcontractor expenses per job to calculate gross profit margins before leaving the site.",
    specs: ["Live budget vs. actual cost ledger", "Gross margin percentage alerts", "Technician and trade profitability reports"],
  },
  {
    icon: RefreshCw,
    title: "Two-Way QuickBooks & Xero Synchronization",
    description: "Bi-directional accounting sync for customers, items, timesheets, and invoices. Keep books reconciled with zero double-entry and no duplicate records.",
    specs: ["Continuous two-way data sync", "Export geofence-verified payroll hours", "Automatic payment reconciliation"],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <SEO
        title="FiledCrews Features — Complete Field Service Management Software"
        description="Comprehensive feature overview of FiledCrews: Live GPS dispatch, geofence time tracking, biometric face ID, equipment QR lifecycle, van inventory, recurring service agreements, and 24/7 AI voice phone receptionist."
        path="/features"
      />

      <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        
        {/* Navigation */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
            <Link to="/" className="flex items-center gap-2.5" aria-label="FiledCrews Homepage">
              <img src="/favicon.png" alt="FiledCrews" className="h-7 w-7 rounded-md" width="28" height="28" />
              <span className="text-xl font-bold tracking-tight text-slate-950">
                FiledCrews<span className="text-teal-600">.</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <Link to="/features" className="text-slate-950 font-semibold">Features</Link>
              <Link to="/#compare" className="hover:text-slate-950 transition-colors">Compare</Link>
              <Link to="/#pricing" className="hover:text-slate-950 transition-colors">Pricing</Link>
              <Link to="/about" className="hover:text-slate-950 transition-colors">About</Link>
              <Link to="/support" className="hover:text-slate-950 transition-colors">Support</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-950 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/wizard">
                <Button size="sm" className="bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-lg px-4 py-2 text-sm shadow-sm" aria-label="Get Started Free">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-100 bg-[#fafaf9]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
              Complete Field Service Architecture
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1]">
              Every tool required to run, dispatch, and scale your field operations.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Consolidate dispatching, time tracking, customer equipment records, van inventory, recurring maintenance contracts, and automated invoicing into a single high-performance platform.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link to="/wizard">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-950/10">
                  Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-white">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-28">

          {/* Category 1: Dispatch & Field Audits */}
          <section className="space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Module 01</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Real-Time Dispatching & Field Verification
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Automated location tracking, verified arrival times, and facial biometric confirmation that eliminate timesheet disputes entirely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dispatchFeatures.map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-7 flex flex-col justify-between space-y-6 hover:border-slate-400 transition-colors">
                  <div className="space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    {f.specs.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Category 2: Scheduling, Estimates & Invoicing */}
          <section className="space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Module 02</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Scheduling, Proposals & Fast Payments
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Move seamlessly from initial customer inquiry to multi-tier estimates, scheduled jobs, and same-day payment collection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {operationsFeatures.map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-7 flex flex-col justify-between space-y-6 hover:border-slate-400 transition-colors">
                  <div className="space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    {f.specs.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Category 3: Asset Lifecycles, Van Inventory & Memberships */}
          <section className="space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Module 03</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Equipment QR Scanning, Van Stock & Recurring Clubs
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Built-in enterprise modules to manage physical machinery on-site, prevent truck stock shortages, and lock in recurring revenue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {assetFeatures.map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-7 flex flex-col justify-between space-y-6 hover:border-slate-400 transition-colors">
                  <div className="space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    {f.specs.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Category 4: AI Receptionist, Reputation & Integrations */}
          <section className="space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Module 04</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                AI Voice Agents, Reputation & Accounting Sync
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Autonomous after-hours phone handling, automated 5-star Google review collection, job cost ledgers, and seamless QuickBooks/Xero synchronization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiAutomationFeatures.map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-7 flex flex-col justify-between space-y-6 hover:border-slate-400 transition-colors">
                  <div className="space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    {f.specs.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Full Platform Summary Table */}
          <section className="space-y-8 pt-8">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Feature Matrix</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Complete Capabilities Summary
              </h2>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                  <tr>
                    <th className="p-4 sm:p-5">Capability Area</th>
                    <th className="p-4 sm:p-5">Feature Functionality</th>
                    <th className="p-4 sm:p-5">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    { area: "Field Dispatch", feat: "Live GPS Map with vehicle speed & route replay", tier: "Included ($0 Core)" },
                    { area: "Time & Attendance", feat: "50m–500m Geofenced check-in/out audits", tier: "Included ($0 Core)" },
                    { area: "Security", feat: "Biometric Face ID selfie verification", tier: "Included ($0 Core)" },
                    { area: "Scheduling", feat: "Visual drag-and-drop calendar & arrival windows", tier: "Included ($0 Core)" },
                    { area: "Sales", feat: "Good/Better/Best multi-tier estimates with e-signatures", tier: "Included ($0 Core)" },
                    { area: "Billing", feat: "On-site card payments & invoice generation via Stripe", tier: "Included ($0 Core)" },
                    { area: "Equipment Tracking", feat: "QR code & barcode scanning for machinery service records", tier: "Included ($0 Core)" },
                    { area: "Inventory", feat: "Truck van stock vs warehouse stock with supplier POs", tier: "Included ($0 Core)" },
                    { area: "Agreements", feat: "Recurring maintenance contracts with auto card charges", tier: "Included ($0 Core)" },
                    { area: "AI Voice", feat: "24/7 AI receptionist for after-hours call booking", tier: "Integrated Copilot" },
                    { area: "Customer Portal", feat: "Online web booking widget & self-service client hub", tier: "Included ($0 Core)" },
                    { area: "Reputation", feat: "Automated Google review SMS requests with sentiment filter", tier: "Included ($0 Core)" },
                    { area: "Job Costing", feat: "Itemized labor, material, and gross margin tracking", tier: "Included ($0 Core)" },
                    { area: "Accounting", feat: "Two-way live synchronization with QuickBooks & Xero", tier: "Included ($0 Core)" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-slate-950">{row.area}</td>
                      <td className="p-4 sm:p-5 text-slate-600">{row.feat}</td>
                      <td className="p-4 sm:p-5 font-medium text-teal-800">{row.tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA Footer Banner */}
          <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-14 text-center space-y-6 shadow-xl">
            <div className="max-w-2xl mx-auto space-y-3">
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Run your entire field service business on FiledCrews.
              </h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Free core platform for small crews, with transparent seat scaling as your company expands.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/wizard">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-md">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/#compare">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base border-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl">
                  Compare with Competitors
                </Button>
              </Link>
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="FiledCrews" className="h-5 w-5 rounded-md" width="20" height="20" />
              <span className="font-bold text-slate-900">FiledCrews</span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 font-medium">
              <Link to="/features" className="text-slate-950 font-semibold">Features</Link>
              <Link to="/about" className="hover:text-slate-950 transition-colors">About</Link>
              <Link to="/support" className="hover:text-slate-950 transition-colors">Support</Link>
              <Link to="/privacy" className="hover:text-slate-950 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-950 transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </footer>

      </div>
    </>
  );
}
