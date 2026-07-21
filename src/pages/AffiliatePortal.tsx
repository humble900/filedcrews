import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import {
  DollarSign,
  Link as LinkIcon,
  Copy,
  Check,
  TrendingUp,
  Users,
  MousePointer,
  Download,
  Mail,
  Share2,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Gift,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  MoreHorizontal,
  ExternalLink,
  Clock,
  Star,
  ArrowUpRight,
  Building2,
  UserCheck,
  CalendarDays,
  Zap,
  Shield,
  Target,
  Megaphone,
} from "lucide-react";

// ─── Mock Data ─────────────────────────────────────────────────────────
const mockPerformanceData = [
  { day: "Day 1", clicks: 35, signups: 2, earnings: 40 },
  { day: "Day 5", clicks: 42, signups: 3, earnings: 80 },
  { day: "Day 10", clicks: 68, signups: 5, earnings: 120 },
  { day: "Day 15", clicks: 95, signups: 8, earnings: 280 },
  { day: "Day 20", clicks: 120, signups: 11, earnings: 420 },
  { day: "Day 25", clicks: 155, signups: 14, earnings: 560 },
  { day: "Day 30", clicks: 198, signups: 18, earnings: 740 },
];

const mockReferrals = [
  {
    id: "REF-001",
    name: "Anderson Heating & AC",
    trade: "HVAC",
    avatar: "AH",
    avatarBg: "bg-orange-100 text-orange-700",
    date: "July 12, 2026",
    tier: "Growth Plan",
    tierColor: "text-violet-700 bg-violet-50 border-violet-200/60",
    seats: 8,
    status: "Active Paid",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    earnings: "+$85.00/mo",
    earningsColor: "text-emerald-700",
    lastActivity: "2 hours ago",
  },
  {
    id: "REF-002",
    name: "Apex Plumbing Solutions",
    trade: "Plumbing",
    avatar: "AP",
    avatarBg: "bg-blue-100 text-blue-700",
    date: "July 18, 2026",
    tier: "Starter Plan",
    tierColor: "text-sky-700 bg-sky-50 border-sky-200/60",
    seats: 3,
    status: "Trial Period",
    statusColor: "text-indigo-700 bg-indigo-50 border-indigo-200/60",
    earnings: "$0.00",
    earningsColor: "text-slate-400",
    lastActivity: "5 hours ago",
  },
  {
    id: "REF-003",
    name: "GreenTech Landscaping",
    trade: "Landscaping",
    avatar: "GL",
    avatarBg: "bg-green-100 text-green-700",
    date: "June 28, 2026",
    tier: "Growth Plan",
    tierColor: "text-violet-700 bg-violet-50 border-violet-200/60",
    seats: 5,
    status: "Active Paid",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    earnings: "+$54.00/mo",
    earningsColor: "text-emerald-700",
    lastActivity: "1 day ago",
  },
  {
    id: "REF-004",
    name: "Vance Electrical Corp",
    trade: "Electrical",
    avatar: "VE",
    avatarBg: "bg-amber-100 text-amber-700",
    date: "May 10, 2026",
    tier: "Lite Plan",
    tierColor: "text-slate-600 bg-slate-50 border-slate-200/60",
    seats: 1,
    status: "Churned",
    statusColor: "text-rose-600 bg-rose-50 border-rose-200/60",
    earnings: "Voided",
    earningsColor: "text-slate-400 line-through",
    lastActivity: "30 days ago",
  },
  {
    id: "REF-005",
    name: "Summit HVAC Services",
    trade: "HVAC",
    avatar: "SH",
    avatarBg: "bg-red-100 text-red-700",
    date: "July 19, 2026",
    tier: "Growth Plan",
    tierColor: "text-violet-700 bg-violet-50 border-violet-200/60",
    seats: 12,
    status: "Active Paid",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    earnings: "+$120.00/mo",
    earningsColor: "text-emerald-700",
    lastActivity: "Just now",
  },
  {
    id: "REF-006",
    name: "Rivera Construction Co",
    trade: "Construction",
    avatar: "RC",
    avatarBg: "bg-purple-100 text-purple-700",
    date: "June 05, 2026",
    tier: "Pro Plan",
    tierColor: "text-teal-700 bg-teal-50 border-teal-200/60",
    seats: 20,
    status: "Active Paid",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    earnings: "+$190.00/mo",
    earningsColor: "text-emerald-700",
    lastActivity: "3 hours ago",
  },
  {
    id: "REF-007",
    name: "Blue Wave Plumbing",
    trade: "Plumbing",
    avatar: "BW",
    avatarBg: "bg-cyan-100 text-cyan-700",
    date: "July 20, 2026",
    tier: "Starter Plan",
    tierColor: "text-sky-700 bg-sky-50 border-sky-200/60",
    seats: 2,
    status: "Pending Setup",
    statusColor: "text-amber-700 bg-amber-50 border-amber-200/60",
    earnings: "$0.00",
    earningsColor: "text-slate-400",
    lastActivity: "10 min ago",
  },
  {
    id: "REF-008",
    name: "ProFlow Fire & Safety",
    trade: "Fire Protection",
    avatar: "PF",
    avatarBg: "bg-rose-100 text-rose-700",
    date: "April 22, 2026",
    tier: "Growth Plan",
    tierColor: "text-violet-700 bg-violet-50 border-violet-200/60",
    seats: 6,
    status: "Active Paid",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    earnings: "+$72.00/mo",
    earningsColor: "text-emerald-700",
    lastActivity: "6 hours ago",
  },
];

const mockPayouts = [
  { id: "PO-78401", date: "July 15, 2026", method: "Stripe Transfer", status: "Completed", amount: "$940.00", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "PO-76295", date: "June 15, 2026", method: "Stripe Transfer", status: "Completed", amount: "$1,120.00", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "PO-72104", date: "May 15, 2026", method: "Stripe Transfer", status: "Completed", amount: "$840.00", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "PO-68421", date: "April 15, 2026", method: "Stripe Transfer", status: "Pending Hold", amount: "$920.00", color: "text-amber-700 bg-amber-50 border-amber-200" },
];

// ─── Component ─────────────────────────────────────────────────────────
export default function AffiliatePortal() {
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConnectedStripe, setIsConnectedStripe] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [referralSearch, setReferralSearch] = useState("");
  const [referralFilter, setReferralFilter] = useState("all");
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");

  const referralLink = "https://filedcrews.com?aff=partner_fc";
  const customPromoCode = "CREW10";

  const handleDemoUnlock = () => {
    setIsJoined(true);
    toast({
      title: "Welcome to Partner Dashboard",
      description: "You've successfully entered the affiliate demo panel.",
    });
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and email address.",
        variant: "destructive",
      });
      return;
    }
    setIsJoined(true);
    toast({
      title: "Application Received!",
      description: "Your partner profile is active. Welcome to FiledCrews!",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast({ title: "Link Copied!", description: "Your unique partner link is ready to share." });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customPromoCode);
    setCopiedCode(false);
    setTimeout(() => setCopiedCode(true), 50);
    toast({ title: "Promo Code Copied!", description: "Coupon code copied to clipboard." });
  };

  useEffect(() => {
    if (copiedLink) {
      const t = setTimeout(() => setCopiedLink(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copiedLink]);

  useEffect(() => {
    if (copiedCode) {
      const t = setTimeout(() => setCopiedCode(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copiedCode]);

  const handleConnectStripe = () => {
    setIsConnectingStripe(true);
    setTimeout(() => {
      setIsConnectingStripe(false);
      setIsConnectedStripe(true);
      toast({
        title: "Stripe Connect Linked!",
        description: "Direct bank transfer payouts are now configured.",
      });
    }, 1500);
  };

  // ─── Filtered referrals ────────────────────────────────────────
  const filteredReferrals = mockReferrals.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(referralSearch.toLowerCase()) || r.trade.toLowerCase().includes(referralSearch.toLowerCase());
    const matchFilter = referralFilter === "all" || (referralFilter === "active" && r.status === "Active Paid") || (referralFilter === "trial" && r.status === "Trial Period") || (referralFilter === "churned" && r.status === "Churned") || (referralFilter === "pending" && r.status === "Pending Setup");
    return matchSearch && matchFilter;
  });

  // ─── Tab items (used for both desktop tabs and mobile bottom nav) ───
  const tabItems = [
    { id: "dashboard", label: "Analytics", shortLabel: "Analytics", Icon: BarChart3 },
    { id: "referrals", label: "Referred Crews", shortLabel: "Referrals", Icon: Users },
    { id: "assets", label: "Marketing Kit", shortLabel: "Assets", Icon: Megaphone },
    { id: "payouts", label: "Payouts", shortLabel: "Payouts", Icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <SEO
        title="Partner & Affiliate Portal | FiledCrews"
        description="Recommend FiledCrews to your trade contacts, help them grow their business, and earn 20% recurring monthly commission."
      />

      {/* ─── Sticky Header ──────────────────────────────────────── */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-[11px] tracking-tighter">FC</span>
            </span>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
              FiledCrews <span className="hidden sm:inline text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full ml-1 border border-teal-200/50">Partners</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              ← Main Site
            </Link>
            {!isJoined && (
              <Button size="sm" onClick={handleDemoUnlock} className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg h-8 px-3">
                Quick Demo
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Landing / Registration ─────────────────────────────── */}
      {!isJoined ? (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-20 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                Earn 20% recurring monthly
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Recommend FiledCrews.<br />
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Grow Your Income.</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed max-w-xl">
                Partner with the leading field operations platform. Help local HVAC techs, plumbers, landscapers, and construction crews automate scheduling, invoicing, and dispatch.
              </p>
            </div>

            {/* Why Join Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { Icon: DollarSign, title: "High Payouts", desc: "Get 20% recurring monthly commission for the first 12 months on every activated paid crew subscription." },
                { Icon: LinkIcon, title: "60-Day Cookie Tracking", desc: "We track your leads for 60 full days. If they signup within two months, you receive full credit." },
                { Icon: Sparkles, title: "Premium Asset Kit", desc: "Access customized email swipes, promotional code coupon systems, and high-res visual templates." },
                { Icon: CreditCard, title: "Direct Payouts", desc: "Fast, reliable automatic monthly bank transfer payouts handled securely via Stripe Express Integration." },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex gap-3.5 p-4 bg-white border border-stone-200/60 rounded-2xl shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                    <Icon className="h-4.5 w-4.5 text-teal-600" />
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card className="border-stone-200/80 shadow-lg sticky top-20">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-950">Join the Partner Network</CardTitle>
              <CardDescription className="text-slate-500 text-xs sm:text-sm">Apply in 60 seconds and start generating links.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApply} className="space-y-3.5">
                {[
                  { label: "Full Name", value: fullName, set: setFullName, placeholder: "Enter your name", type: "text", required: true },
                  { label: "Email Address", value: email, set: setEmail, placeholder: "john@example.com", type: "email", required: true },
                  { label: "Company Name (Optional)", value: companyName, set: setCompanyName, placeholder: "e.g. Acme Consultancy", type: "text", required: false },
                  { label: "Website URL (Optional)", value: website, set: setWebsite, placeholder: "https://example.com", type: "text", required: false },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">{f.label}</label>
                    <Input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      required={f.required}
                      className="border-stone-200 focus-visible:ring-teal-500 rounded-lg text-sm h-10"
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md mt-1 h-11">
                  Submit Application <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      ) : (
        /* ─── Authenticated Dashboard ────────────────────────────── */
        <main className="mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8 pb-24 md:pb-8">
          {/* Welcome HUD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-5">
            <div className="space-y-0.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Partner Control Center</h2>
              <p className="text-xs sm:text-sm text-slate-500">Track referrals, generate assets, and verify monthly commissions.</p>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Partner
              </span>
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-stone-200">
                <Star className="h-3 w-3 text-amber-500" /> Tier 2
              </span>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Total Clicks", value: "1,248", change: "+12.4%", Icon: MousePointer, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
              { label: "Crews Referred", value: "38", change: "+3 new", Icon: Users, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
              { label: "Conversion Rate", value: "3.04%", change: "+0.8%", Icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
              { label: "Total Earned", value: "$4,850", change: "+$920", Icon: DollarSign, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
            ].map(({ label, value, change, Icon, iconBg, iconColor }) => (
              <div key={label} className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5 hover:shadow-md transition-shadow duration-300 group">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                  <span className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} />
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums">{value}</h3>
                  <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-600">
                    <ArrowUpRight className="h-2.5 w-2.5" /> {change} this month
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick-Copy Links & Promo Codes */}
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-5">
            <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-teal-600" /> Referral Link
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400">Share to automatically track cookie signups</p>
              </div>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="border-stone-200 font-mono text-[10px] sm:text-xs bg-slate-50 rounded-lg h-9" />
                <Button size="icon" onClick={handleCopyLink} className="bg-teal-600 hover:bg-teal-700 text-white shrink-0 rounded-lg h-9 w-9">
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-amber-500" /> Promo Code
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400">Gives crews 10% off for 3 months</p>
              </div>
              <div className="flex gap-2">
                <Input value={customPromoCode} readOnly className="border-stone-200 font-mono text-xs bg-slate-50 rounded-lg text-amber-700 font-bold h-9" />
                <Button size="icon" onClick={handleCopyCode} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 rounded-lg h-9 w-9">
                  {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Desktop Tab Navigation ──────────────────────────── */}
          <div className="space-y-5 sm:space-y-6">
            <div className="hidden md:flex gap-1 border-b border-stone-200 pb-px overflow-x-auto scrollbar-none">
              {tabItems.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all relative whitespace-nowrap ${
                    activeTab === t.id ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <t.Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Mobile tab pills (visible below md) */}
            <div className="flex md:hidden gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {tabItems.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1 px-3 py-2 text-[10px] font-bold rounded-full whitespace-nowrap transition-all ${
                    activeTab === t.id
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-white text-slate-500 border border-stone-200 hover:border-teal-200"
                  }`}
                >
                  <t.Icon className="h-3 w-3" />
                  {t.shortLabel}
                </button>
              ))}
            </div>

            {/* ═══ ANALYTICS TAB ═══ */}
            {activeTab === "dashboard" && (
              <div className="space-y-5 sm:space-y-6">
                <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 items-start">
                  {/* Area Chart */}
                  <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-stone-100 pb-3">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Performance Growth (30 Days)</h4>
                        <p className="text-[9px] sm:text-[10px] text-slate-400">Total clicks vs free trial signups</p>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold bg-slate-50 border px-2 py-0.5 rounded-md self-start">Live Update</span>
                    </div>
                    <div className="h-52 sm:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <RechartsTooltip
                            contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                            labelStyle={{ fontWeight: 700, color: "#0f172a" }}
                          />
                          <Area type="monotone" dataKey="clicks" name="Total Clicks" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                          <Area type="monotone" dataKey="signups" name="Free Signups" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Program Tips Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-4 lg:col-span-1 h-fit border border-slate-800">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-teal-400">
                        <Target className="h-3.5 w-3.5" /> Success Playbook
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400">Maximize your monthly referral conversions</p>
                    </div>
                    <div className="space-y-3 pt-1">
                      {[
                        { title: "Target the Right Niche", desc: "HVAC, plumbing, electrical, and commercial landscaping crews get the most value.", icon: Zap },
                        { title: "Use Custom Swipes", desc: "Copy the outreach emails in the Marketing Kit tab to message trade admins.", icon: Mail },
                        { title: "Offer the Discount", desc: "Share coupon code CREW10. Referred leads receive 10% off for 3 months.", icon: Gift },
                      ].map((tip, idx) => (
                        <div key={idx} className="flex gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                            <tip.icon className="h-3 w-3 text-teal-400" />
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <h5 className="text-[11px] font-bold text-slate-200">{tip.title}</h5>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{tip.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick referral snapshot */}
                <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Recent Referrals</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400">Latest 3 referred crews</p>
                    </div>
                    <button onClick={() => setActiveTab("referrals")} className="text-[10px] sm:text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 self-start transition-colors">
                      View All <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {mockReferrals.slice(0, 3).map((ref) => (
                      <div key={ref.id} className="flex items-center gap-3 p-3 border border-stone-100 rounded-xl hover:border-teal-200 transition-colors">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${ref.avatarBg}`}>
                          {ref.avatar}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{ref.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${ref.statusColor}`}>{ref.status}</span>
                            <span className={`text-[10px] font-bold ${ref.earningsColor}`}>{ref.earnings}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ REFERRALS TAB (Premium Scrollable Table) ═══ */}
            {activeTab === "referrals" && (
              <div className="bg-white border border-stone-200/60 rounded-2xl shadow-sm overflow-hidden">
                {/* Table header bar */}
                <div className="p-4 sm:p-5 border-b border-stone-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-teal-600" />
                        Referred Crews Activity Log
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-400">Real-time tracking of onboarded crews, plans, and commission earnings</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                        {filteredReferrals.length} of {mockReferrals.length} crews
                      </span>
                    </div>
                  </div>

                  {/* Search + Filter bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Search by name or trade..."
                        value={referralSearch}
                        onChange={(e) => setReferralSearch(e.target.value)}
                        className="pl-9 h-9 text-xs border-stone-200 rounded-lg bg-slate-50 focus-visible:ring-teal-500"
                      />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                      {[
                        { id: "all", label: "All" },
                        { id: "active", label: "Active" },
                        { id: "trial", label: "Trial" },
                        { id: "pending", label: "Pending" },
                        { id: "churned", label: "Churned" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setReferralFilter(f.id)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${
                            referralFilter === f.id
                              ? "bg-teal-600 text-white shadow-sm"
                              : "bg-slate-50 text-slate-500 border border-stone-200 hover:border-teal-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── In-Screen Scrollable Table ────────────────── */}
                <div
                  ref={tableScrollRef}
                  className="overflow-auto"
                  style={{ maxHeight: "calc(100vh - 420px)", minHeight: "300px" }}
                >
                  {/* Desktop Table View */}
                  <table className="w-full text-left text-xs border-collapse hidden sm:table">
                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
                      <tr className="border-b border-stone-200/80">
                        <th className="py-3 px-4 sm:px-5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Crew</th>
                        <th className="py-3 px-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Onboard Date</th>
                        <th className="py-3 px-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan</th>
                        <th className="py-3 px-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Seats</th>
                        <th className="py-3 px-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                        <th className="py-3 px-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</th>
                        <th className="py-3 px-4 sm:px-5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.map((ref, idx) => (
                        <tr
                          key={ref.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-teal-50/30 transition-colors duration-200 group cursor-pointer"
                        >
                          <td className="py-3.5 px-4 sm:px-5">
                            <div className="flex items-center gap-3">
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${ref.avatarBg} group-hover:scale-105 transition-transform`}>
                                {ref.avatar}
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 text-xs block truncate max-w-[180px]">{ref.name}</span>
                                <span className="text-[9px] font-semibold text-slate-400">{ref.trade}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <CalendarDays className="h-3 w-3 text-slate-300" />
                              {ref.date}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${ref.tierColor}`}>
                              {ref.tier}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-50 border border-stone-200 text-[10px] font-bold text-slate-700">
                              {ref.seats}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-block text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ref.statusColor}`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="h-2.5 w-2.5" /> {ref.lastActivity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right">
                            <span className={`text-xs font-bold ${ref.earningsColor}`}>{ref.earnings}</span>
                          </td>
                        </tr>
                      ))}
                      {filteredReferrals.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <div className="space-y-2">
                              <Users className="h-8 w-8 text-slate-200 mx-auto" />
                              <p className="text-xs font-semibold text-slate-400">No matching referrals found</p>
                              <p className="text-[10px] text-slate-300">Try adjusting your search or filter criteria</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* ─── Mobile Card View (below sm) ─────────────── */}
                  <div className="sm:hidden divide-y divide-stone-100">
                    {filteredReferrals.map((ref) => (
                      <div key={ref.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2.5 active:bg-teal-50/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${ref.avatarBg}`}>
                              {ref.avatar}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{ref.name}</p>
                              <p className="text-[10px] text-slate-400">{ref.trade} · {ref.date}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${ref.earningsColor}`}>{ref.earnings}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ref.statusColor}`}>
                            {ref.status}
                          </span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${ref.tierColor}`}>
                            {ref.tier}
                          </span>
                          <span className="text-[8px] font-semibold text-slate-400 bg-slate-50 border border-stone-200 px-2 py-0.5 rounded-full">
                            {ref.seats} {ref.seats === 1 ? "seat" : "seats"}
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] text-slate-400 ml-auto">
                            <Clock className="h-2.5 w-2.5" /> {ref.lastActivity}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredReferrals.length === 0 && (
                      <div className="py-16 text-center space-y-2">
                        <Users className="h-8 w-8 text-slate-200 mx-auto" />
                        <p className="text-xs font-semibold text-slate-400">No matching referrals</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table footer */}
                <div className="border-t border-stone-100 px-4 sm:px-5 py-3 flex items-center justify-between bg-slate-50/50">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold">
                    Showing {filteredReferrals.length} of {mockReferrals.length} total referrals
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-stone-200 text-slate-400 hover:text-slate-600 hover:border-stone-300 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-7 w-7 flex items-center justify-center rounded-lg bg-teal-600 text-white text-[10px] font-bold">1</span>
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-stone-200 text-slate-400 hover:text-slate-600 hover:border-stone-300 transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ MARKETING ASSETS TAB ═══ */}
            {activeTab === "assets" && (
              <div className="grid gap-5 sm:gap-6">
                {/* Email Swipe */}
                <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-teal-600" /> Cold Outreach Email Swipe
                    </h4>
                  </div>
                  <div className="bg-slate-50 border border-stone-100 rounded-xl p-3 sm:p-4 space-y-2.5 font-mono text-[10px] sm:text-xs text-slate-700 select-all leading-relaxed">
                    <p><strong>Subject:</strong> Streamlining scheduling and invoicing for your crews</p>
                    <p>Hi [Contact Name],</p>
                    <p>I hope your crew is having a busy week on the field. I wanted to reach out because I noticed you guys are managing quite a few dispatch technicians.</p>
                    <p>If you're still juggling whiteboards and text messages to coordinate schedules or follow up on invoices, you should take a look at FiledCrews. It connects dispatchers and technicians without the complexity of legacy tools, and handles mapping, GPS tracking, cost ledgers, and payments automatically.</p>
                    <p>You can check it out and get started completely free using my link: <strong>{referralLink}</strong> (or use code <strong>{customPromoCode}</strong> at checkout for an extra discount).</p>
                    <p>Let me know if you'd like a quick walk-through.</p>
                  </div>
                </div>

                {/* Social Media Swipe */}
                <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Share2 className="h-4 w-4 text-indigo-600" /> Social Media Caption Swipe
                    </h4>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        platform: "LinkedIn",
                        text: "🔧 If you manage a field crew (HVAC, plumbing, electrical), check out FiledCrews — it's free scheduling + invoicing + GPS tracking for trade teams. I've seen teams cut admin time by 60%. Link in comments 👇",
                      },
                      {
                        platform: "Facebook Group",
                        text: "Hey fellow contractors! Found this app called FiledCrews that actually makes dispatch and invoicing painless. No more spreadsheets. Free to start, and code CREW10 gets you 10% off if you go premium. Worth a look!",
                      },
                    ].map((s) => (
                      <div key={s.platform} className="bg-slate-50 border border-stone-100 rounded-xl p-3 space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.platform}</span>
                        <p className="text-[10px] sm:text-[11px] text-slate-600 leading-relaxed select-all">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banner Graphics */}
                <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Download className="h-4 w-4 text-teal-600" /> Downloadable Marketing Graphics
                    </h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { size: "1080×1080", format: "Instagram / LinkedIn", type: "Visual mockup" },
                      { size: "1200×630", format: "Facebook / Twitter Card", type: "Dashboard screenshot" },
                      { size: "728×90", format: "Leaderboard Banner", type: "Text logo banner" },
                    ].map((g, idx) => (
                      <div key={idx} className="border border-stone-100 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between min-h-[120px] hover:border-teal-200 transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">{g.size}</span>
                          <span className="text-[11px] font-bold text-slate-800 block">{g.format}</span>
                          <span className="text-[9px] text-slate-500">{g.type}</span>
                        </div>
                        <Button size="sm" className="w-full bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-stone-200 text-[10px] gap-1 py-1 h-7 rounded-lg shadow-sm mt-3">
                          <Download className="h-3 w-3" /> Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ PAYOUTS TAB ═══ */}
            {activeTab === "payouts" && (
              <div className="grid gap-5 sm:gap-6">
                {/* Stripe Connect */}
                <div className="bg-white border border-stone-200/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-200 transition-colors">
                  <div className="flex gap-3 sm:gap-4">
                    <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Direct Bank Transfers via Stripe Connect</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 max-w-md">Configure your payout banking details securely. Transfers occur automatically every 30 days.</p>
                    </div>
                  </div>
                  {isConnectedStripe ? (
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 sm:px-4 py-2 rounded-xl self-start sm:self-auto">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Connected
                    </span>
                  ) : (
                    <Button onClick={handleConnectStripe} disabled={isConnectingStripe} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md self-start sm:self-auto min-w-[140px] h-10 text-xs">
                      {isConnectingStripe ? "Connecting..." : "Connect Bank Account"}
                    </Button>
                  )}
                </div>

                {/* Earnings Summary Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Paid Out", value: "$2,900.00", Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pending This Month", value: "$920.00", Icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Lifetime Earnings", value: "$4,850.00", Icon: DollarSign, color: "text-teal-600", bg: "bg-teal-50" },
                  ].map(({ label, value, Icon, color, bg }) => (
                    <div key={label} className="bg-white border border-stone-200/60 rounded-2xl p-3 sm:p-4 shadow-sm text-center space-y-1.5">
                      <span className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </span>
                      <h4 className="text-sm sm:text-lg font-black text-slate-900 tabular-nums">{value}</h4>
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Payout History Table */}
                <div className="bg-white border border-stone-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-stone-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Commission Payout History</h4>
                  </div>

                  {/* Desktop payout table */}
                  <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-100">
                          <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Payout ID</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Method</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                          <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        {mockPayouts.map((po, idx) => (
                          <tr key={idx} className="border-b border-stone-50 last:border-0 hover:bg-slate-50/50">
                            <td className="py-3.5 px-5 font-mono text-slate-900 font-semibold">{po.id}</td>
                            <td className="py-3.5 px-3">{po.date}</td>
                            <td className="py-3.5 px-3">{po.method}</td>
                            <td className="py-3.5 px-3">
                              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${po.color}`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right font-bold text-slate-900">{po.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile payout cards */}
                  <div className="sm:hidden divide-y divide-stone-100">
                    {mockPayouts.map((po, idx) => (
                      <div key={idx} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">{po.id}</span>
                          <span className="text-xs font-bold text-slate-900">{po.amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{po.date}</span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] text-slate-500">{po.method}</span>
                          <span className={`ml-auto text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${po.color}`}>
                            {po.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ─── Mobile Bottom Navigation (visible when dashboard is active) ─── */}
      {isJoined && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-stone-200/80 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
            {tabItems.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  activeTab === t.id
                    ? "text-teal-600"
                    : "text-slate-400"
                }`}
              >
                <t.Icon className={`h-4.5 w-4.5 ${activeTab === t.id ? "text-teal-600" : "text-slate-400"}`} />
                <span className={`text-[9px] font-bold ${activeTab === t.id ? "text-teal-600" : "text-slate-400"}`}>
                  {t.shortLabel}
                </span>
                {activeTab === t.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-teal-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200/80 bg-white mt-12 sm:mt-16 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-1.5 text-slate-400 text-[10px] sm:text-xs">
          <p>© {new Date().getFullYear()} FiledCrews. All rights reserved.</p>
          <p>
            For partner program support, reach out to{" "}
            <a href="mailto:partners@filedcrews.com" className="text-teal-600 hover:underline">
              partners@filedcrews.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
