import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Users,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Map,
  ScanFace,
  ArrowRight,
  Target,
  Menu,
  X,
  Search,
  Download,
  PlayCircle,
  ClipboardList,
  Building2,
  Receipt,
  ShieldAlert,
  Bell,
  Thermometer,
  Droplets,
  Zap,
  Sparkles,
  Hammer,
  Leaf,
  ShieldCheck,
  Sun,
  Bug,
  Home,
  Link2,
  MessageSquare,
  CreditCard,
  Calendar,
  FileText,
  TrendingDown,
  Quote,
  DollarSign,
  MapPin,
  TrendingUp,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SEO from "@/components/SEO";

import heroDashboard from "@/assets/hero-dashboard.webp";
import heroMobile from "@/assets/hero-mobile.webp";
import featureStaffList from "@/assets/feature-staff-list.webp";
import featureGeofence from "@/assets/feature-geofence.webp";
import playStoreListing from "@/assets/play-store-app-listing.webp";

/* ── Animation ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

/* ── Interactive Moon ── */
function InteractiveMoon({
  mouseX, mouseY, top, left, size = 100,
  color = "rgba(13, 148, 136, 0.25)", delay = 0,
}: {
  mouseX: number; mouseY: number; top: string; left: string;
  size?: number; color?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [proximity, setProximity] = useState(0);

  useEffect(() => {
    if (!ref.current || (mouseX === 0 && mouseY === 0)) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    setProximity(Math.max(0, 1 - dist / 400));
  }, [mouseX, mouseY]);

  const s = size + proximity * size * 0.7;

  return (
    <motion.div
      ref={ref}
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className="absolute rounded-full pointer-events-none"
      style={{
        top, left, width: s, height: s,
        background: `radial-gradient(circle at 35% 35%, ${color} 0%, transparent 65%)`,
        opacity: 0.4 + proximity * 0.5,
        filter: `blur(${Math.max(1, 6 - proximity * 5)}px)`,
        transition: "width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out",
      }}
    />
  );
}

/* ── Feature Card ── */
function FeatureCard({ f }: { f: { icon: React.ElementType; title: string; desc: string } }) {
  return (
    <Card className="h-full bg-white border-stone-100 hover:shadow-lg hover:shadow-teal-600/5 hover:border-teal-100 transition-all duration-300 group ring-1 ring-stone-900/[0.04]">
      <CardContent className="p-5 space-y-3">
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-[0_0_24px_rgba(13,148,136,0.35)] transition-all duration-300">
          <f.icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
      </CardContent>
    </Card>
  );
}



/* ── Data ── */
const features = [
  { icon: Map, title: "Live Map Dispatching", desc: "Monitor every crew member in real time on an interactive GPS map with photo markers and live status indicators." },
  { icon: Target, title: "Geofence Boundaries", desc: "Draw virtual perimeters around job sites. Automatic entry and exit logging triggers instant notifications." },
  { icon: ScanFace, title: "Face ID Gatekeeper", desc: "Verify identity at every check-in with AI facial recognition. Ensure the right person clocks in at the right site." },
  { icon: Bell, title: "Push Notifications", desc: "Receive real-time alerts for check-ins, check-outs, boundary crossings, and shift exceptions as they happen." },
  { icon: ClipboardList, title: "Jobs & Scheduling", desc: "Create projects, assign tasks to crews, and track shift hours through an integrated scheduling calendar." },
  { icon: Building2, title: "CRM & Asset Tracing", desc: "Maintain client directories and trace the full service history of every piece of site-installed equipment." },
  { icon: Receipt, title: "Invoices & Billing", desc: "Generate invoices linked to jobs and projects. Track payments, outstanding balances, and collection status." },
  { icon: ShieldAlert, title: "Safety & Compliance", desc: "Digital safety audits, incident logs, and compliance checklists to keep your crew and operations protected." },
];

const outcomes = [
  { icon: Target, title: "Dispatch with confidence", desc: "See the jobs, crews, and sites that need attention before delays turn into missed appointments." },
  { icon: ClipboardList, title: "Verify work on site", desc: "Connect shifts, worksite boundaries, and task updates so your office has an accurate record of the day." },
  { icon: Receipt, title: "Bill from completed work", desc: "Move from completed jobs to estimates, invoices, and payment tracking in the same workspace." },
];

const steps = [
  { num: "01", title: "Create your company", desc: "Sign up and set your company name and unique prefix in under 60 seconds." },
  { num: "02", title: "Onboard your crew", desc: "Add staff with profile photos. They receive instant mobile app credentials." },
  { num: "03", title: "Configure your sites", desc: "Draw geofence zones on the map for offices, job sites, and client locations." },
  { num: "04", title: "Go live", desc: "Watch locations update in real time. Dispatch jobs, track shifts, and invoice clients." },
];

const industriesRow1 = [
  { icon: Thermometer, name: "HVAC & Cooling", tag: "Install, maintain & repair" },
  { icon: Droplets, name: "Plumbing", tag: "Emergency calls & contracts" },
  { icon: Zap, name: "Electrical", tag: "Licensed trade operations" },
  { icon: Sparkles, name: "Cleaning Services", tag: "Recurring crew scheduling" },
  { icon: Hammer, name: "Construction", tag: "Site crews & contractors" },
];

const industriesRow2 = [
  { icon: Leaf, name: "Landscaping", tag: "Route planning & upkeep" },
  { icon: ShieldCheck, name: "Security & Fire", tag: "Guard patrol tracking" },
  { icon: Sun, name: "Solar & Energy", tag: "Panel install & service" },
  { icon: Bug, name: "Pest Control", tag: "Recurring treatments" },
  { icon: Home, name: "Property Mgmt", tag: "Multi-site coordination" },
];

const faqs = [
  { q: "How does real-time GPS tracking work?", a: "Each crew member downloads the FiledCrews mobile app. The app securely transmits their GPS coordinates in the background, updating your admin dashboard map every few seconds. All location data is encrypted end-to-end." },
  { q: "What is geofencing and how do I set it up?", a: "Geofencing lets you draw a virtual boundary on the map around any job site or office. When a crew member enters or exits that zone, you receive an instant push notification. Setting up a geofence takes under 30 seconds — just click on the map, set the radius, and save." },
  { q: "How does face verification prevent buddy punching?", a: "When face verification is enabled for a geofence, the crew member must take a selfie upon arrival. Our AI compares it against their enrolled profile photo, ensuring the person checking in is who they claim to be. This eliminates proxy attendance (buddy punching)." },
  { q: "Is the platform suitable for small teams?", a: "Absolutely. FiledCrews works for teams of any size — from a 3-person plumbing crew to a 500-person construction company. Setup takes under 2 minutes and is completely free." },
  { q: "What devices does the mobile app support?", a: "The FiledCrews mobile app is available for Android phones and tablets. An iOS version is currently in development. The admin dashboard works on any modern web browser — Chrome, Firefox, Safari, or Edge." },
  { q: "How do invoices and billing work?", a: "You can generate invoices directly from completed jobs or projects. Each invoice links to tracked hours, assigned crew, and project details. Track payment status, send reminders, and export to CSV for your accounting software." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/* ── Marquee keyframes ── */
const marqueeCSS = `
@keyframes marquee-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
@keyframes flow {
  to {
    stroke-dashoffset: -20;
  }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.marquee-track { will-change: transform; }
.marquee-wrap:hover .marquee-track { animation-play-state: paused; }
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
  .marquee-track { animation: none !important; transform: none !important; }
}
`;

/* ══════════════════════════════════════════════════════════ */

interface InteractiveParticlesCanvasProps {
  color?: string;
}

export function InteractiveParticlesCanvas({ color = "13, 148, 136" }: InteractiveParticlesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const particleCount = Math.min(50, Math.floor((width * height) / 18000));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    const parent = canvas.parentElement;
    if (parent) {
      window.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const render = () => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.12;
            ctx.strokeStyle = `rgba(${color}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (isHovering) {
          const distToMouse = Math.hypot(p1.x - mouseX, p1.y - mouseY);
          if (distToMouse < 180) {
            const alpha = (1 - distToMouse / 180) * 0.2;
            ctx.strokeStyle = `rgba(${color}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${color}, 0.35)`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (parent) {
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [color]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);

  const phrases = [
    { text: "field service business.", color: "from-teal-600 to-emerald-600" },
    { text: "plumbing business.", color: "from-indigo-600 to-violet-600" },
    { text: "HVAC business.", color: "from-amber-600 to-orange-600" },
    { text: "electrical business.", color: "from-sky-600 to-blue-600" },
    { text: "cleaning business.", color: "from-pink-600 to-rose-600" },
    { text: "landscaping business.", color: "from-green-600 to-lime-600" },
    { text: "pest control business.", color: "from-red-600 to-orange-600" },
    { text: "appliance repair business.", color: "from-cyan-600 to-teal-600" },
    { text: "locksmith business.", color: "from-yellow-600 to-amber-600" },
    { text: "maintenance business.", color: "from-purple-600 to-fuchsia-600" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setMousePos({ x: e.clientX, y: e.clientY });
      rafRef.current = null;
    });
  }, []);

  const mx = mousePos.x;
  const my = mousePos.y;

  return (
    <>
      <SEO
        title="FiledCrews — Free Field Service Management (FSM) & Dispatch Software"
        description="Manage field operations with FiledCrews, the best free Field Service Management (FSM) software. Features live GPS map tracking, automatic geofence audits, customer job dispatching, custom category cost tracking, and biometric face check verification."
        path="/"
        ogImageAlt="FiledCrews FSM dashboard showing live map tracking, geofence zones, and mobile dispatching."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <style dangerouslySetInnerHTML={{ __html: marqueeCSS }} />

      <div className="min-h-screen bg-white text-slate-900" onMouseMove={handleMouseMove}>

        {/* ──── NAVBAR ──── */}
        <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/favicon.png" alt="FiledCrews" className="h-8 w-8 rounded-lg" />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">FiledCrews<span className="text-teal-600">.</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
              <a href="#compare" className="hover:text-slate-900 transition-colors">Why FiledCrews</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" className="text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-full px-4">Log In</Button>
              </Link>
              <Link to="/wizard" className="hidden md:inline-flex">
                <Button size="sm" className="text-sm px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-full shadow-md transition-all hover:scale-[1.02]">
                  Start for free
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-stone-100 bg-white">
                <nav className="flex flex-col px-4 py-3 gap-1">
                  {[{ href: "#features", label: "Features" }, { href: "#compare", label: "Why FiledCrews" }].map((link) => (
                    <a key={link.href} href={link.href} className="py-2.5 px-3 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
                  ))}
                  <div className="flex gap-2 pt-2 pb-1">
                    <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full text-sm border-stone-200 text-slate-700">Log In</Button>
                    </Link>
                    <Link to="/wizard" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full text-sm bg-teal-600 hover:bg-teal-700 text-white">Apply for Access</Button>
                    </Link>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ──── HERO ──── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/90 via-slate-50 to-teal-50/40 pt-12 md:pt-18 pb-20 md:pb-28 rounded-b-[3.5rem] sm:rounded-b-[5rem] md:rounded-b-[6.5rem] shadow-[0_20px_50px_-15px_rgba(13,148,136,0.12)] border-b border-stone-200/80">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <InteractiveParticlesCanvas color="13, 148, 136" />
          </div>
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
          <InteractiveMoon mouseX={mx} mouseY={my} top="8%" left="84%" size={180} color="rgba(13, 148, 136, 0.22)" delay={0} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="45%" left="2%" size={140} color="rgba(20, 184, 166, 0.18)" delay={1.2} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="18%" left="92%" size={90} color="rgba(245, 158, 11, 0.15)" delay={2.5} />

          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-8 relative z-10">

            {/* Title & Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4 max-w-4xl mx-auto"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                Everything you need to run and grow your{" "}
                <span className="inline-block relative">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activePhraseIndex}
                      initial={{ y: 16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -16, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className={`inline-block bg-gradient-to-r ${phrases[activePhraseIndex].color} bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(13,148,136,0.35)]`}
                    >
                      {phrases[activePhraseIndex].text}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal pt-1">
                Manage your entire field service business in one place, from customer enquiries and job scheduling to AI-powered dispatch, field technician management, inventory, automated customer follow-ups, invoicing, payments, and more.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            >
              <Link to="/wizard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-9 py-6 bg-slate-950 hover:bg-slate-800 text-white font-extrabold shadow-xl shadow-slate-950/20 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Start for free <ArrowRight className="ml-2 h-5 w-5 text-teal-400" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Sweeping Arc Curve Layer */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none z-20">
            <svg className="relative block w-full h-12 sm:h-16 md:h-20 text-white opacity-90" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,40 Q600,120 1200,40 L1200,120 L0,120 Z" fill="currentColor" />
            </svg>
          </div>
        </section>

        {/* ──── INDUSTRIES — Marquee ──── */}
        <section id="industries" className="pt-8 pb-8 md:pt-12 md:pb-12 bg-white border-b border-stone-100 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="text-center mb-8 space-y-2">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold text-slate-900">
                Built for every field service trade
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-500 max-w-lg mx-auto">
                Whether you manage a 5-person crew or a 500-person operation, FiledCrews adapts to your trade.
              </motion.p>
            </motion.div>
          </div>

          <div className="marquee-wrap space-y-4">
            {/* Row 1 → scrolls left */}
            <div className="overflow-hidden">
              <div className="marquee-track flex gap-5" style={{ animation: "marquee-left 30s linear infinite", width: "max-content" }}>
                {[...industriesRow1, ...industriesRow1].map((ind, i) => (
                  <div key={`r1-${i}`} className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-5 py-3.5 shrink-0 hover:border-teal-200 hover:shadow-md hover:shadow-teal-600/5 transition-all duration-300 group cursor-default">
                    <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-teal-600 shadow-sm group-hover:shadow-[0_0_16px_rgba(13,148,136,0.25)] transition-shadow duration-300">
                      <ind.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{ind.name}</p>
                      <p className="text-xs text-slate-400 whitespace-nowrap">{ind.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 → scrolls right */}
            <div className="overflow-hidden">
              <div className="marquee-track flex gap-5" style={{ animation: "marquee-right 35s linear infinite", width: "max-content" }}>
                {[...industriesRow2, ...industriesRow2].map((ind, i) => (
                  <div key={`r2-${i}`} className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-5 py-3.5 shrink-0 hover:border-teal-200 hover:shadow-md hover:shadow-teal-600/5 transition-all duration-300 group cursor-default">
                    <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-teal-600 shadow-sm group-hover:shadow-[0_0_16px_rgba(13,148,136,0.25)] transition-shadow duration-300">
                      <ind.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{ind.name}</p>
                      <p className="text-xs text-slate-400 whitespace-nowrap">{ind.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ──── REAL CREWS FIELD PHOTOGRAPHY SHOWCASE ──── */}
        <section className="bg-slate-900 py-16 md:py-24 text-white relative overflow-hidden border-b border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Real Crews. Real Work. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400">Complete Operations Control.</span>
              </h2>
              <p className="text-slate-400 text-base md:text-lg">
                From residential HVAC & security installs to high-voltage commercial electrical grids and emergency plumbing repairs.
              </p>
            </div>

            {/* 3-Photo Feature Grid */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              
              {/* Photo 1: HVAC & Security */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0}
                className="group relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl hover:border-teal-500/50 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src="/images/hvac-security.jpg"
                    alt="HVAC & Security Technicians"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3 bg-slate-950">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                      Dual-Specialization Operations
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Technicians install AC condenser units and mount security cameras simultaneously while FiledCrews auto-assigns parts inventory.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Photo 2: Commercial Electrical */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={1}
                className="group relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl hover:border-teal-500/50 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src="/images/electrician-panel.jpg"
                    alt="Commercial Electrician Panel Work"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3 bg-slate-950">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      High-Voltage & Scissor Lift Safety
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Master electricians log high-voltage breaker panel audits on-site with required safety check-ins before main breaker energizing.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Photo 3: Residential Plumbing */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={2}
                className="group relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl hover:border-teal-500/50 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src="/images/plumber-sink.jpg"
                    alt="Plumbing Specialist Repair"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3 bg-slate-950">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      On-Site Estimates & Instant Invoicing
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Plumbers diagnose under-sink leaks, present itemized estimates on mobile, and collect digital customer sign-offs before leaving.
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ──── SOCIAL PROOF + IMPACT STATS (Apollo-style) ──── */}
        <section className="bg-[#f5f3ef] pt-12 md:pt-16 pb-12 md:pb-14 border-b border-stone-200/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">

            {/* Testimonial quote + attribution */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8 lg:gap-14 items-end mb-10 md:mb-14">
              <motion.div variants={fadeUp} custom={0}>
                <blockquote className="text-lg sm:text-xl md:text-2xl font-semibold leading-[1.4] tracking-[-0.005em] text-slate-800">
                  {"\u201C"}We used to run our 40-person crew on WhatsApp groups and Excel spreadsheets. Now our office manager schedules every technician, tracks project costs in real-time, and sends invoices, all from one screen before lunch.{"\u201D"}
                </blockquote>
              </motion.div>
              <motion.div variants={fadeUp} custom={1} className="flex flex-col justify-end">
                <div className="space-y-0.5 lg:pl-4">
                  <p className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Andrew Mitchell</p>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-slate-400">Operations Director</p>
                  <div className="flex items-center gap-2 pt-2">
                    <img src="/favicon.png" alt="Premier Mechanical" className="h-5 w-5 rounded" />
                    <span className="text-sm font-extrabold tracking-tight text-slate-900">Premier Mechanical</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Impact stat cards — compact, Apollo-style */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-3 gap-3 md:gap-4">
              {[
                { stat: "85%", desc: "Fewer scheduling conflicts", brand: "Field Operations" },
                { stat: "3x", desc: "Faster job-to-invoice cycle", brand: "Service Companies" },
                { stat: "$14K", desc: "Saved annually on software per crew", brand: "Cost Analysis" },
              ].map((item, i) => (
                <motion.div
                  key={item.stat}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-xl border border-stone-200/70 bg-white/80 px-5 py-5 md:px-6 md:py-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] font-medium text-slate-500 leading-snug max-w-[170px]">{item.desc}</p>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-slate-400 shrink-0 ml-3">{item.brand}</span>
                  </div>
                  <p className="text-[3.2rem] md:text-[3.8rem] font-extrabold tracking-[-0.03em] leading-none text-slate-900">{item.stat}</p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </section>

        {/* ──── SHOPIFY STANDARD FLAGSHIP SHOWCASE SECTION ──── */}
        <section className="bg-slate-950 py-16 md:py-24 text-white relative overflow-hidden border-b border-slate-800">
          {/* Subtle Ambient Radial Backlight Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-radial from-teal-500/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 space-y-12">
            
            {/* Header with Top-Right Graphic Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid lg:grid-cols-[1fr_380px] gap-8 items-center justify-between"
            >
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Manage everywhere your crews operate.{" "}
                <span className="block text-slate-400/80 font-normal text-xl sm:text-2xl md:text-3xl mt-3 leading-normal">
                  On site and in the office. Across GPS and dispatch. Locally and nationwide.
                </span>
              </motion.h2>

              {/* Top-Right Realistic HVAC Technician Image Card (Clean Photo Showcase) */}
              <motion.div
                variants={fadeUp}
                custom={1}
                className="hidden lg:block relative rounded-3xl bg-slate-900 border border-slate-700/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden group hover:border-teal-500/50 transition-all duration-500"
              >
                <div className="relative h-80 w-full overflow-hidden">
                  <img
                    src="/hvac-technician.jpg"
                    alt="HVAC Field Technician"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Shopify "Grow around the world" Style Container */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7 }}
              className="rounded-[2.5rem] bg-[#0b101b] border border-slate-800/80 p-8 md:p-14 relative overflow-hidden shadow-2xl group"
            >
              {/* Radial Cyan Ambient Halo inside Card */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/25 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-10 items-center relative z-10">
                
                {/* Left Text Box */}
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Built for field service, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">engineered for scale.</span>
                  </h3>
                  <p className="text-slate-400 text-base md:text-lg leading-relaxed">
                    FiledCrews takes the complexity out of field dispatch, automatic geofencing, biometric identity verification, and multi-site job accounting into one unified platform.
                  </p>
                  <div className="pt-2">
                    <a
                      href="#features"
                      className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors border-b border-teal-400/40 pb-1 hover:border-teal-300"
                    >
                      Explore how FiledCrews powers trades <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Right Clean Fleet Photo Showcase */}
                <div className="relative min-h-[340px] md:min-h-[400px] rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group/fleet shadow-2xl">
                  <img
                    src="/images/fleet-vans.jpg"
                    alt="Service Fleet in Motion"
                    className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05] transition-transform duration-700 group-hover/fleet:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>

              </div>
            </motion.div>

          </div>
        </section>

        {/* ──── FIVE TOOLS REPLACEMENT & PROJECT FLOW VISUALIZER ──── */}
        <section className="bg-white py-10 md:py-16 border-b border-stone-100 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-[1.1fr_1.3fr] gap-12 lg:gap-20 items-center">
              
              {/* Left side: Heading, copy and interactive selector steps */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    Why pay for five tools <br />
                    <span className="italic text-teal-600">when one does it better?</span>
                  </h2>
                  <p className="text-slate-500 text-base leading-relaxed">
                    FiledCrews replaces separate dispatching systems, timesheet software, expense sheets, invoicing tools, and team alerts. One unified database controls your operations from initial estimate to final net profit reports.
                  </p>
                </div>

                {/* Interactive Steps List */}
                <div className="space-y-2">
                  {[
                    { id: 0, title: "1. Instant Estimates & Guardrails", desc: "Say goodbye to manual double-entry. Clients approve proposals digitally, immediately locking in cost codes and materials budgets." },
                    { id: 1, title: "2. Frictionless Dispatch & Routes", desc: "Eliminate scheduling bottlenecks. Assign jobs by proximity, dispatch maps directly to crew, and notify clients with automated ETAs." },
                    { id: 2, title: "3. Automated Labor Compliance", desc: "Stop timesheet rounding and labor leaks. GPS boundaries auto-clock crews in when they cross the geofence on-site." },
                    { id: 3, title: "4. Real-Time Profit Analytics", desc: "Never guess if you made a profit. Convert completed work into Stripe-ready invoices and instantly compare actual vs. budgeted costs." }
                  ].map((step) => {
                    const isActive = activeStep === step.id;
                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStep(step.id)}
                        className={`group relative pl-6 py-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                          isActive 
                            ? "bg-slate-50 border border-stone-200/50 shadow-sm" 
                            : "hover:bg-slate-50/40 border border-transparent"
                        }`}
                      >
                        {/* Glowing progress line indicating active state */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-500 ${
                          isActive ? "bg-teal-500 scale-y-100" : "bg-transparent scale-y-0"
                        }`} />
                        <h4 className={`text-sm font-bold transition-colors ${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"}`}>
                          {step.title}
                        </h4>
                        <p className={`text-xs mt-1.5 transition-colors leading-relaxed ${isActive ? "text-slate-500" : "text-slate-400"}`}>
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right side: Modern Animative Project Management Dashboard Screen Mock */}
              <div className="relative rounded-3xl bg-slate-950 p-6 md:p-10 border border-slate-800/85 shadow-2xl overflow-hidden h-[460px] flex flex-col justify-between text-white select-none">
                {/* Header background glow */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Dashboard top-bar */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase ml-2 bg-white/5 px-2 py-0.5 rounded">Project Workspace</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Activity className="h-3 w-3 text-teal-400 animate-pulse" />
                    <span>Live Syncing</span>
                  </div>
                </div>

                {/* Interactive State Area */}
                <div className="flex-1 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    
                    {/* Step 0: Estimating & Budgeting */}
                    {activeStep === 0 && (
                      <motion.div
                        key="step0"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(20,184,166,0.35)] uppercase tracking-wider inline-block mb-1">Project ID: WO-9204</span>
                            <h3 className="text-lg font-bold text-slate-100">Residential HVAC System Install</h3>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)] text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">Client Approved</span>
                        </div>

                        <div className="space-y-3">
                          {/* Cost lines */}
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                              <span>Materials: HVAC Unit + Copper Piping</span>
                              <span className="text-slate-100">$3,200.00</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                              <span><code className="font-mono text-teal-400 bg-teal-500/10 border border-teal-500/30 px-1 py-0.2 rounded shadow-[0_0_8px_rgba(20,184,166,0.3)]">Code: MAT-010</code> • Planned Cost</span>
                              <span>Approved • Qty 1</span>
                            </div>
                          </div>
                          
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                              <span>Township Building Permit Fees</span>
                              <span className="text-slate-100">$450.00</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                              <span><code className="font-mono text-teal-400 bg-teal-500/10 border border-teal-500/30 px-1 py-0.2 rounded shadow-[0_0_8px_rgba(20,184,166,0.3)]">Code: PRM-022</code> • Expense Account</span>
                              <span>Approved • Internal</span>
                            </div>
                          </div>
                        </div>

                        {/* Cost progress bar */}
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                            <span>Project Cost Allocation</span>
                            <span className="text-teal-400">$3,650.00 Budgeted</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "75%" }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-teal-500 rounded-full" 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 1: Dispatching */}
                    {activeStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-lg">
                            MV
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Technician Dispatch</span>
                            <h3 className="text-base font-bold text-slate-100">Marcus Vance</h3>
                          </div>
                          <span className="ml-auto bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">En Route</span>
                        </div>

                        {/* Real-time SMS bubble */}
                        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>Auto-SMS Outbox</span>
                            <span>Just now</span>
                          </div>
                          <p className="text-xs text-slate-300 italic leading-relaxed">
                            "Hello Premier Client, technician Marcus Vance is en route to your location. Expected arrival: 08:42 AM. View live technician location map here: fc.co/t/7a82f"
                          </p>
                        </div>

                        {/* Route card */}
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 bg-white/[0.01] border border-white/5 rounded-xl p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                            <span>Destination: 104 Oak Dr</span>
                          </div>
                          <span className="text-slate-300">ETA 12 mins</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Geofenced Compliance */}
                    {activeStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Worksite Compliance</span>
                            <h3 className="text-base font-bold text-slate-100">Geofence Attendance Verification</h3>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">Clock-in Verified</span>
                        </div>

                        {/* Geofence Map Mock */}
                        <div className="relative h-[160px] bg-slate-905 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
                          {/* Pulsing geofence circle */}
                          <div className="absolute h-24 w-24 rounded-full border border-teal-500/40 bg-teal-500/10 flex items-center justify-center animate-pulse">
                            <div className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                          </div>
                          {/* Technician dot */}
                          <div className="absolute top-[48%] left-[47%] h-4 w-4 bg-teal-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[7px] font-bold shadow-lg shadow-teal-500/50">
                            MV
                          </div>
                          {/* Small Map Label */}
                          <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-white/10 px-2 py-0.5 rounded text-[8px] font-bold text-slate-400 tracking-wider">
                            150m Safety Radius Boundary
                          </div>
                        </div>

                        {/* Verified details */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Clock In time</span>
                            <span className="text-xs font-bold text-slate-200">08:30:12 AM</span>
                          </div>
                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Biometrics Check</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Face Verified
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Profit Ledger */}
                    {activeStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Finance Ledger</span>
                            <h3 className="text-base font-bold text-slate-100">Project Net Profitability</h3>
                          </div>
                          <span className="bg-teal-500 text-slate-950 border border-teal-400 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">Invoice Sent</span>
                        </div>

                        {/* Revenue vs Cost Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Collected Revenue</span>
                            <span className="text-lg font-black text-emerald-400">$4,800.00</span>
                          </div>
                          <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Actual Costs</span>
                            <span className="text-lg font-black text-red-400">$1,224.00</span>
                          </div>
                        </div>

                        {/* Profit Margin Details */}
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Net Income Margin</span>
                            <span className="text-xl font-black text-teal-400">+$3,576.00 Profit</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500">Planned Margin: 72%</span>
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" /> 74.5% Net Margin
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* Footer progress bar representing the step transition */}
                <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-slate-500 text-[10px] font-semibold">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((stepIdx) => (
                      <button
                        key={stepIdx}
                        onClick={() => setActiveStep(stepIdx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeStep === stepIdx ? "w-6 bg-teal-500" : "w-2 bg-white/10 hover:bg-white/20"
                        }`}
                        aria-label={`Go to step ${stepIdx + 1}`}
                      />
                    ))}
                  </div>
                  <span>Real-Time Database Sync</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ──── PRODUCT FEATURES (Clay-style stacked blocks) ──── */}
        <section className="bg-[#faf8f5] py-10 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center max-w-3xl mx-auto space-y-4 mb-10 md:mb-12">
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                One unified workspace for office{" "}
                <span className="italic text-teal-600">and field operations.</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-500 text-lg leading-relaxed">
                Experience how FiledCrews connects dispatchers and technicians without the complexity or cost of legacy software.
              </motion.p>
            </motion.div>

            <div className="relative">
              {/* Block 1 — Live GPS Map */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="sticky top-[100px] z-10 bg-[#f0fafb] text-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-10 items-center shadow-md border border-teal-100/30 mb-6"
              >
                <div className="space-y-5">
                  {/* Badge Style: Trailing Echoes */}
                  <div className="relative inline-flex items-center pl-6 select-none">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-9 rounded-full border border-teal-400/10" />
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-5 w-9 rounded-full border border-teal-400/20 bg-teal-400/5" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-9 rounded-full border border-teal-400/35 bg-teal-400/10" />
                    <span className="relative z-10 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white bg-gradient-to-r from-teal-600 to-teal-500 px-3.5 py-1 rounded-full ml-4 shadow-[0_2px_8px_rgba(20,184,166,0.3)]">
                      Real-time tracking
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[2.5rem] font-extrabold leading-tight text-slate-900">
                    Live GPS Map{" "}
                    <span className="italic text-teal-600">Tracking</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    Monitor staff locations, view current work status, and dispatch emergency jobs instantly on an interactive, live-updating map view.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Link to="/wizard">
                      <Button size="sm" className="text-sm px-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm">
                        Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                    <button onClick={() => setDemoOpen(true)} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Watch the demo</button>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(15,118,110,0.12)] border border-stone-200/80 ring-1 ring-slate-900/5">
                  <img src={heroDashboard} alt="Live GPS Map Dispatching — real-time crew tracking" className="w-full h-auto animate-fade-in" loading="lazy" />
                </div>
              </motion.div>

              {/* Block 2 — Smart Geofences (reversed layout) */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="sticky top-[130px] z-20 bg-[#fef0f7] text-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-10 items-center shadow-md border border-rose-100/30 mb-6"
              >
                <div className="rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(15,118,110,0.12)] border border-stone-200/80 ring-1 ring-slate-900/5 order-2 lg:order-1">
                  <img src={featureGeofence} alt="Smart Geofence Boundaries — automated site compliance" className="w-full h-auto animate-fade-in" loading="lazy" />
                </div>
                <div className="space-y-5 order-1 lg:order-2">
                  {/* Badge Style: Signal Pulse */}
                  <div className="inline-flex items-center gap-2.5 select-none">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                    </span>
                    <span className="h-px w-4 bg-gradient-to-r from-rose-400 to-rose-200" />
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full shadow-sm">
                      Automated compliance
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[2.5rem] font-extrabold leading-tight text-slate-900">
                    Smart Geofence{" "}
                    <span className="italic text-rose-600">Boundaries</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    Draw virtual boundaries around customer job locations. Shift entries and exits are audited automatically to verify timesheet accuracy.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Link to="/wizard">
                      <Button size="sm" className="text-sm px-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm">
                        Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                    <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Explore all features</a>
                  </div>
                </div>
              </motion.div>

              {/* Block 3 — Cost Tracking (dark themed) */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="sticky top-[160px] z-30 bg-slate-950 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-10 items-center shadow-2xl mb-6"
              >
                <div className="space-y-5">
                  {/* Badge Style: Neon Glow Outline */}
                  <div className="inline-flex select-none">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-400 border border-amber-400/50 px-4 py-1 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.2),inset_0_0_12px_rgba(251,191,36,0.06)] backdrop-blur-sm">
                      Financial control
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[2.5rem] font-extrabold leading-tight">
                    Custom Category{" "}
                    <span className="italic text-teal-400">Cost Ledgers</span>
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Track planned and actual expenses against projects. Create cost categories for Marketing, Foundation, Permits, and Materials with real-time budget progress.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Link to="/wizard">
                      <Button size="sm" className="text-sm px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg shadow-sm">
                        Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="space-y-5">
                  {/* Budget progress mockup */}
                  {[
                    { label: "Marketing Campaign", pct: 80, budget: "$5,000", actual: "$4,000" },
                    { label: "Foundation Work", pct: 45, budget: "$12,000", actual: "$5,400" },
                    { label: "Building Permits", pct: 100, budget: "$2,200", actual: "$2,200" },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2.5">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>{row.label}</span>
                        <span className={row.pct >= 100 ? "text-emerald-400" : "text-teal-400"}>{row.pct}% Spent</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${row.pct >= 100 ? "bg-emerald-500" : "bg-teal-500"}`} style={{ width: `${row.pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Budget: {row.budget}</span>
                        <span>Actual: {row.actual}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Block 4 — Invoicing & Billing */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="sticky top-[190px] z-40 bg-[#fdf8f2] text-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-10 items-center shadow-md border border-amber-100/30"
              >
                <div className="space-y-5">
                  {/* Badge Style: Split Chip */}
                  <div className="inline-flex items-center bg-white border border-stone-200 rounded-full pl-1.5 pr-3.5 py-0.5 shadow-sm select-none">
                    <span className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_2px_4px_rgba(245,158,11,0.3)] mr-2 flex items-center justify-center">
                      <DollarSign className="h-2.5 w-2.5 text-white" />
                    </span>
                    <span className="h-3 w-px bg-stone-200 mr-2" />
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-800">
                      Billing & payments
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[2.5rem] font-extrabold leading-tight text-slate-900">
                    Invoices &{" "}
                    <span className="italic text-teal-600">Profitability Reports</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    Convert completed jobs directly to draft invoices, track collection status, and run detailed financial reports showing project net margins.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { title: "Total Invoiced", val: "$14,250", color: "text-slate-900" },
                      { title: "Outstanding", val: "$3,400", color: "text-amber-600" },
                      { title: "Paid Margin", val: "+74.5%", color: "text-emerald-600" },
                    ].map((stat) => (
                      <div key={stat.title} className="rounded-xl bg-white border border-stone-200/80 p-3.5 shadow-sm">
                        <span className="text-[10px] text-slate-400 font-medium block mb-0.5">{stat.title}</span>
                        <span className={`text-sm font-bold ${stat.color}`}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <Link to="/wizard">
                      <Button size="sm" className="text-sm px-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm">
                        Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(15,118,110,0.12)] border border-stone-200/80 ring-1 ring-slate-900/5">
                  <img src={featureStaffList} alt="Staff and crew management — invoices and scheduling" className="w-full h-auto animate-fade-in" loading="lazy" />
                </div>
              </motion.div>

              {/* Block 5 — Shifts & Scheduling (reversed layout) */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="sticky top-[220px] z-50 bg-[#f5f3ff] text-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-10 items-center shadow-md border border-indigo-100/30 mb-6"
              >
                <div className="space-y-4 order-2 lg:order-1 bg-white border border-stone-200/60 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                    <span className="text-xs font-bold text-indigo-700 uppercase">Scheduler Board</span>
                    <span className="text-[10px] font-semibold text-slate-400">Today • 3 Active Crews</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { time: "08:00 AM", task: "Residential HVAC Service", crew: "Marcus Vance", status: "Active", dotColor: "bg-emerald-500" },
                      { time: "01:00 PM", task: "Permit Inspection", crew: "Sarah Jenkins", status: "Pending", dotColor: "bg-amber-500" },
                      { time: "03:30 PM", task: "Emergency Pipe Leak", crew: "Alex Mercer", status: "Dispatched", dotColor: "bg-indigo-500" }
                    ].map((shift, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-indigo-100 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-slate-400">{shift.time}</span>
                            <span className="text-xs font-bold text-slate-900">{shift.task}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">Crew: {shift.crew}</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                          <span className={`h-2.5 w-2.5 rounded-full ${shift.dotColor} ${shift.status === 'Active' ? 'animate-pulse' : ''}`} />
                          {shift.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 order-1 lg:order-2">
                  {/* Badge Style: Gradient Shimmer */}
                  <div className="inline-flex select-none">
                    <span className="relative overflow-hidden text-[9px] font-extrabold uppercase tracking-[0.2em] text-white bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] px-4 py-1 rounded-full shadow-[0_2px_10px_rgba(99,102,241,0.35)]">
                      Dynamic Dispatching
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[2.5rem] font-extrabold leading-tight text-slate-900">
                    Crew Shift &{" "}
                    <span className="italic text-indigo-600">Work Schedules</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    Ditch the whiteboard. Drag-and-drop shift blocks, check real-time crew availability, and notify teams instantly on the FiledCrews mobile app about shift updates.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Link to="/wizard">
                      <Button size="sm" className="text-sm px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm">
                        Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Block 6 — Biometric Attendance Verification */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="sticky top-[250px] z-60 bg-[#f0fdf4] text-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-10 items-center shadow-md border border-emerald-100/30"
              >
                <div className="space-y-5">
                  {/* Badge Style: Verified Seal */}
                  <div className="inline-flex items-center gap-2 select-none">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15),0_2px_6px_rgba(16,185,129,0.25)]">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
                      Attendance Security
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[2.5rem] font-extrabold leading-tight text-slate-900">
                    Biometric Face ID{" "}
                    <span className="italic text-emerald-600">Attendance Audits</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    Stop buddy clock-ins and double entry. Technicians clock in on site by taking a quick selfie to confirm coordinate matches and facial bio-identity verification.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Link to="/wizard">
                      <Button size="sm" className="text-sm px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm">
                        Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm space-y-4 max-w-sm mx-auto w-full">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">Mobile Check-In Audit</span>
                  </div>
                  {/* Viewfinder Mock */}
                  <div className="relative h-44 bg-slate-950 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center">
                    {/* Viewfinder corners */}
                    <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                    <div className="absolute top-4 right-4 h-4 w-4 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                    <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                    <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                    {/* Scan indicator line */}
                    <div className="absolute inset-x-4 h-0.5 bg-emerald-400/40 top-[40%] animate-bounce" />
                    {/* Scan text */}
                    <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded">Identity Confirmed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-slate-600">MV</div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">Marcus Vance (HVAC Tech)</span>
                      <span className="text-[9px] text-slate-500 block">GPS coordinates verified within geofence</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>



        {/* ──── FEATURES ──── */}
        <section id="features" className="relative overflow-hidden py-8 md:py-10 bg-stone-50/50">
          <InteractiveMoon mouseX={mx} mouseY={my} top="8%" left="87%" size={140} color="rgba(20, 184, 166, 0.18)" delay={0.5} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="65%" left="2%" size={100} color="rgba(13, 148, 136, 0.15)" delay={2} />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-10 space-y-2">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold text-slate-900">
                Everything you need to manage a mobile workforce
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-500 max-w-2xl mx-auto text-lg">
                From live tracking to automated invoicing — complete visibility and control over your field operations.
              </motion.p>
            </motion.div>

            {/* Mobile: horizontal slider */}
            <div className="sm:hidden overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 pb-4 snap-x snap-mandatory">
              <div className="flex gap-4" style={{ width: "max-content" }}>
                {features.map((f, i) => (
                  <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="w-[260px] shrink-0 snap-start">
                    <FeatureCard f={f} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Desktop: grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f, i) => (
                <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp}>
                  <FeatureCard f={f} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── COMPETITOR COMPARISON GRID (GEO/AEO Focus) ──── */}
        <section id="compare" className="py-10 md:py-16 bg-white border-b border-stone-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-8 md:mb-10">

              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                How we compare to legacy software.
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed">
                Most Field Service Management tools charge hefty per-user subscription fees. FiledCrews offers enterprise capabilities completely free.
              </p>
            </div>

            <div className="overflow-x-auto border border-stone-200/80 rounded-2xl shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="p-5 text-sm font-bold text-slate-900">Feature Capabilities</th>
                    <th className="p-5 text-sm font-bold text-teal-700 bg-teal-50/30">FiledCrews FSM</th>
                    <th className="p-5 text-sm font-medium text-slate-500">Legacy Paid FSM</th>
                    <th className="p-5 text-sm font-medium text-slate-500">Paper & Spreadsheets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {[
                    { f: "Pricing Model", c1: "$0 Free Forever", c2: "$150+/mo per user", c3: "Free (but high time cost)" },
                    { f: "Live GPS Tracking Map", c1: "Included (Real-time updates)", c2: "Paid add-on", c3: "None" },
                    { f: "Geofenced Check-in Audits", c1: "Automated (Map boundary)", c2: "Basic tracking", c3: "Manual entries" },
                    { f: "Biometric Face ID verification", c1: "Included (AI face match)", c2: "Rarely supported", c3: "None" },
                    { f: "Custom Cost categories Ledger", c1: "Included (Budget vs Actual)", c2: "Requires integrations", c3: "Manual formulas" },
                    { f: "Invoice & Billing dispatch", c1: "Direct draft creation", c2: "Paid subscription", c3: "Manual creation" },
                    { f: "Multi-Country Tax support", c1: "US, UK, CA, AU & EU presets", c2: "Single region focus", c3: "Custom setup needed" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/40 transition-colors">
                      <td className="p-5 font-semibold text-slate-900">{row.f}</td>
                      <td className="p-5 font-bold text-teal-600 bg-teal-50/10">{row.c1}</td>
                      <td className="p-5 text-slate-600">{row.c2}</td>
                      <td className="p-5 text-slate-500">{row.c3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>



        {/* ──── HOW IT WORKS ──── */}
        <section id="how-it-works" className="relative overflow-hidden py-8 md:py-10 bg-stone-50/50">
          <InteractiveMoon mouseX={mx} mouseY={my} top="20%" left="90%" size={120} color="rgba(20, 184, 166, 0.18)" delay={1} />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-10 space-y-2">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold text-slate-900">Up and running in minutes</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-500 max-w-xl mx-auto text-lg">No complex setup. No technical expertise required.</motion.p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((s, i) => (
                <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp}>
                  <div className="bg-white rounded-2xl p-5 h-full space-y-3 border border-stone-100 hover:shadow-md transition-shadow duration-300">
                    <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-teal-600 text-white text-base font-bold shadow-[0_0_18px_rgba(13,148,136,0.3)]">
                      {s.num}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── INTEGRATIONS (Clay-style animated diagram) ──── */}
        <section className="bg-slate-950 py-16 md:py-24 text-white overflow-hidden relative">
          {/* Subtle backgrounds */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,118,110,0.15),transparent_60%)] pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <div className="grid lg:grid-cols-[1.1fr_1.3fr] gap-12 lg:gap-20 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-[2.5rem] font-extrabold leading-tight">
                  Connects seamlessly with{" "}
                  <span className="italic text-teal-400">your business stack.</span>
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  No isolated data silos. FiledCrews integrates directly with the software you already use to sync financial ledgers, process cards, and alert your crew instantly.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  {[
                    { title: "QuickBooks & Xero", desc: "Sync timesheets & client billing" },
                    { title: "Stripe Payments", desc: "Accept card payments in the field" },
                    { title: "Slack & Teams", desc: "Real-time office alerts & logs" },
                    { title: "Twilio SMS", desc: "Auto-notify clients when crew arrives" },
                  ].map((int) => (
                    <div key={int.title} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-1 hover:border-white/10 transition-colors">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        {int.title}
                      </h4>
                      <p className="text-xs text-slate-500">{int.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated Interactive Diagram */}
              <div className="relative h-[400px] w-full max-w-[400px] mx-auto flex items-center justify-center shrink-0">
                {/* SVG connection lines */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 400" fill="none">
                  {/* QuickBooks line */}
                  <path d="M 70 70 L 200 200" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-[flow_1.5s_linear_infinite]" />
                  {/* Stripe line */}
                  <path d="M 330 70 L 200 200" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-[flow_1.5s_linear_infinite]" />
                  {/* Slack line */}
                  <path d="M 70 330 L 200 200" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-[flow_1.5s_linear_infinite]" />
                  {/* Twilio line */}
                  <path d="M 330 330 L 200 200" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-[flow_1.5s_linear_infinite]" />
                </svg>

                {/* Central FiledCrews Orb with brand logo */}
                <div className="absolute left-[200px] top-[200px] -translate-x-1/2 -translate-y-1/2 z-20 h-20 w-20 rounded-3xl bg-slate-900 border-2 border-teal-500 shadow-[0_0_50px_rgba(13,148,136,0.6)] flex items-center justify-center animate-[pulse_4s_ease-in-out_infinite]">
                  <img src="/favicon.png" alt="FiledCrews logo" className="h-10 w-10 rounded-xl" />
                </div>

                {/* Floating Node 1 — QuickBooks */}
                <div className="absolute left-[70px] top-[70px] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 shadow-lg animate-[float_6s_ease-in-out_infinite] w-[130px]">
                    <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <ClipboardList className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold">QuickBooks</div>
                      <div className="text-[9px] text-slate-500 font-medium">Accounting</div>
                    </div>
                  </div>
                </div>

                {/* Floating Node 2 — Stripe */}
                <div className="absolute left-[330px] top-[70px] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 shadow-lg animate-[float_7s_ease-in-out_infinite_1.5s] w-[130px]">
                    <div className="h-6 w-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <CreditCard className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold">Stripe</div>
                      <div className="text-[9px] text-slate-500 font-medium">Payments</div>
                    </div>
                  </div>
                </div>

                {/* Floating Node 3 — Slack */}
                <div className="absolute left-[70px] top-[330px] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 shadow-lg animate-[float_5s_ease-in-out_infinite_0.8s] w-[130px]">
                    <div className="h-6 w-6 rounded-md bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold">Slack</div>
                      <div className="text-[9px] text-slate-500 font-medium">Alerts</div>
                    </div>
                  </div>
                </div>

                {/* Floating Node 4 — Twilio */}
                <div className="absolute left-[330px] top-[330px] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 shadow-lg animate-[float_8s_ease-in-out_infinite_2.2s] w-[130px]">
                    <div className="h-6 w-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold">Twilio</div>
                      <div className="text-[9px] text-slate-500 font-medium">SMS Dispatch</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── MOBILE INFRASTRUCTURE (Clay-style premium visual card) ──── */}
        <section id="mobile" className="py-10 md:py-16 bg-white border-b border-stone-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="bg-[#faf8f5] rounded-[2rem] md:rounded-[3rem] border border-stone-200/60 p-6 md:p-10 space-y-12">
              
              {/* Header Grid (2-column layout matching Clay screenshot) */}
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                <div className="space-y-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-700">FIELD INFRASTRUCTURE</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    A mobile app your <span className="italic text-teal-600">crew will actually use</span>
                  </h2>
                  <a href="/downloads/FiledCrews.apk" download className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors pt-2">
                    Download Android APK <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="space-y-6">
                  <p className="text-slate-500 text-base leading-relaxed">
                    The FiledCrews mobile app makes field operations completely seamless. Technicians can check in automatically via geofencing, log tasks, and verify their identity with quick biometric Face ID checks.
                  </p>
                  
                  {/* Quote block matching Clay screenshot style */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-stone-200/50">
                    <div className="flex -space-x-1.5 shrink-0 pt-0.5">
                      <div className="h-5 w-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-extrabold">H</div>
                      <div className="h-5 w-5 rounded-full bg-teal-50 border-2 border-white flex items-center justify-center text-[9px] font-extrabold">F</div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      <strong className="text-slate-800">HVAC Solutions</strong> got a +45% lift in check-in logs accuracy by switching to geofenced shift checklists on day one.
                    </p>
                  </div>
                </div>
              </div>

              {/* Huge visual display block representing device / app mock */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-8 md:p-14 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-around gap-10">
                <div className="space-y-4 max-w-sm text-left">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Biometric Check-in</span>
                  <h4 className="text-xl md:text-2xl font-extrabold text-slate-900">Secure. Accountable. Zero friction.</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Technicians get immediate access to assigned work orders, routes, and client histories. Office managers verify shifts automatically without tracking calls or manual corrections.</p>
                </div>
                
                {/* Visual Stack Layout */}
                <div className="relative w-full max-w-xs shrink-0">
                  <div className="rounded-3xl bg-[#faf8f5] text-slate-900 p-4 shadow-2xl border border-stone-200/50 relative">
                    <div className="flex items-center gap-3 rounded-full bg-stone-100 px-4 py-2 mb-3">
                      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="text-xs font-medium text-slate-700 truncate">FiledCrews Mobile</div>
                      <span className="ml-auto inline-block h-3.5 w-px bg-stone-200" />
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-teal-600 text-[8px] font-bold">O</div>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-stone-200/60 bg-white">
                      <img src={playStoreListing} alt="FiledCrews Mobile app on Google Play Store" className="w-full h-auto block" loading="lazy" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Android App Preview</span>
                      <span className="text-teal-600 font-bold">Available Now</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ──── CTA ──── */}
        <section className="relative overflow-hidden py-12 md:py-16 bg-stone-50/50">
          <InteractiveMoon mouseX={mx} mouseY={my} top="15%" left="6%" size={160} color="rgba(13, 148, 136, 0.18)" delay={0.3} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="45%" left="86%" size={100} color="rgba(245, 158, 11, 0.12)" delay={1.8} />

          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-5 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold text-slate-900">Ready to bring your field and office together?</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-base text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
                Apply for Founder Partner access, then we will help configure your company, crew, and first worksite workflows.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6">
                <Link to="/wizard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base px-10 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 rounded-full font-bold">
                    Apply for Founder Partner Access <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-10 border-stone-200 text-slate-700 hover:bg-stone-50 rounded-full font-bold">Log In</Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ──── FOOTER WITH EMBEDDED FAQ ──── */}
        <footer className="relative border-t border-stone-200 bg-stone-50 overflow-hidden pt-12 pb-8">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-45">
            <InteractiveParticlesCanvas color="13, 148, 136" />
          </div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
            
            {/* Embedded FAQ Section inside Footer */}
            <div id="faq" className="max-w-4xl mx-auto pt-2 pb-6 border-b border-stone-200/80">
              <div className="text-center mb-8 space-y-2">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">Frequently asked questions</h3>
                <p className="text-sm text-slate-500">Everything you need to know about FiledCrews.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {faqs.map((faq, i) => (
                  <motion.details
                    key={faq.q} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="group border border-stone-200/90 rounded-xl bg-white hover:border-teal-300 transition-all duration-200 [&[open]]:border-teal-400 [&[open]]:shadow-sm"
                  >
                    <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-xs sm:text-sm font-bold text-slate-900 select-none [&::-webkit-details-marker]:hidden list-none">
                      <span>{faq.q}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 text-slate-600 leading-relaxed text-xs sm:text-sm pt-1 border-t border-stone-100">{faq.a}</div>
                  </motion.details>
                ))}
              </div>
            </div>

            {/* Footer Bottom Links & Copyright */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/favicon.png" alt="FiledCrews" className="h-6 w-6 rounded-md" />
                <span className="font-bold text-slate-900">FiledCrews</span>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-sm text-slate-500">
                <Link to="/about" className="hover:text-slate-900 transition-colors">About</Link>
                <Link to="/affiliates" className="hover:text-teal-700 hover:border-teal-300 text-teal-600 bg-teal-50/80 px-2.5 py-0.5 rounded-full border border-teal-200/50 transition-all font-semibold text-xs uppercase tracking-wider">Partner Program</Link>
                <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                <Link to="/support" className="hover:text-slate-900 transition-colors">Support</Link>
                <Link to="/account-deletion" className="hover:text-slate-900 transition-colors">Account Deletion</Link>
              </nav>
            </div>
            <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} FiledCrews. All rights reserved.</p>
          </div>
        </footer>



        {/* Demo Video Dialog */}
        <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden border-stone-200 bg-white sm:rounded-2xl">
            <VisuallyHidden>
              <DialogTitle>FiledCrews product demo</DialogTitle>
              <DialogDescription>Watch a short demo of the FiledCrews dashboard and mobile app.</DialogDescription>
            </VisuallyHidden>
            <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
              {demoOpen && (
                <iframe
                  src="https://iframe.mediadelivery.net/embed/655691/433c41a7-5218-48e4-8dc5-f87a011c3060?autoplay=true&loop=false&muted=false&preload=true&responsive=true"
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                  title="FiledCrews demo"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
