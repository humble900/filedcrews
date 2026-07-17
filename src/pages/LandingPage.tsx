import { useState, useRef, useCallback, useEffect, Suspense, lazy } from "react";
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
  CheckCircle2,
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
  Shield,
  Layers,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SEO from "@/components/SEO";

// Eagerly import the FSM WebGL 3D Scene
import FsmThreeScene from "@/components/FsmThreeScene";

import heroMobile from "@/assets/hero-mobile.webp";
import featureStaffList from "@/assets/feature-staff-list.webp";
import featureGeofence from "@/assets/feature-geofence.webp";
import playStoreListing from "@/assets/play-store-app-listing.webp";

/* ── Animation Constants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

/* ── Interactive Moon / Ambient Glow Orb ── */
function InteractiveMoon({
  mouseX, mouseY, top, left, size = 100,
  color = "rgba(13, 148, 136, 0.35)", delay = 0,
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
    setProximity(Math.max(0, 1 - dist / 500));
  }, [mouseX, mouseY]);

  const s = size + proximity * size * 0.5;

  return (
    <motion.div
      ref={ref}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className="absolute rounded-full pointer-events-none"
      style={{
        top, left, width: s, height: s,
        background: `radial-gradient(circle at 35% 35%, ${color} 0%, transparent 70%)`,
        opacity: 0.6 + proximity * 0.4,
        filter: `blur(${Math.max(2, 8 - proximity * 6)}px)`,
        transition: "width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out",
        zIndex: 0,
      }}
    />
  );
}

/* ── 2D Interactive Particles Canvas (Footer & Accents) ── */
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

    const particleCount = Math.min(60, Math.floor((width * height) / 16000));

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

    window.addEventListener("resize", handleResize);

    const render = () => {
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
            const alpha = (1 - distToMouse / 180) * 0.22;
            ctx.strokeStyle = `rgba(${color}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${color}, 0.4)`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (parent) {
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [color]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

/* ── Landing Page Content Data ── */
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
  { q: "How does real-time GPS tracking work?", a: "Each crew member downloads the OnSite Crew Manager mobile app. The app securely transmits their GPS coordinates in the background, updating your admin dashboard map every few seconds. All location data is encrypted end-to-end." },
  { q: "What is geofencing and how do I set it up?", a: "Geofencing lets you draw a virtual boundary on the map around any job site or office. When a crew member enters or exits that zone, you receive an instant push notification. Setting up a geofence takes under 30 seconds — just click on the map, set the radius, and save." },
  { q: "How does face verification prevent buddy punching?", a: "When face verification is enabled for a geofence, the crew member must take a selfie upon arrival. Our AI compares it against their enrolled profile photo, ensuring the person checking in is who they claim to be. This eliminates proxy attendance (buddy punching)." },
  { q: "Is the platform suitable for small teams?", a: "Absolutely. OnSite Crew Manager works for teams of any size — from a 3-person plumbing crew to a 500-person construction company. You only pay for the seats you use, and setup takes under 2 minutes." },
  { q: "What devices does the mobile app support?", a: "The OnSite Crew Manager mobile app is available for Android phones and tablets. An iOS version is currently in development. The admin dashboard works on any modern web browser — Chrome, Firefox, Safari, or Edge." },
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

const marqueeCSS = `
@keyframes marquee-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.marquee-track { will-change: transform; }
.marquee-wrap:hover .marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
  .marquee-track { animation: none !important; transform: none !important; }
}
`;

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

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
        title="OnSite Crew Manager — Real-Time Staff Location & Attendance Dashboard"
        description="Track your field service team in real time with GPS, geofences, and face verification. Manage HVAC, plumbing, electrical, and construction crews from one dashboard."
        path="/"
        ogImageAlt="OnSite Crew Manager dashboard showing a live map with staff locations, geofence zones, and a mobile app companion view."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <style dangerouslySetInnerHTML={{ __html: marqueeCSS }} />

      <div className="min-h-screen bg-[#030712] text-white overflow-hidden" onMouseMove={handleMouseMove}>

        {/* ──── NAVBAR ──── */}
        <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/favicon.png" alt="Ocrem" className="h-8.5 w-8.5 rounded-lg ring-2 ring-teal-500/20" />
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                OnSite Crew Manager
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#industries" className="hover:text-white transition-colors">Trades</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900">
                  Log In
                </Button>
              </Link>
              <Link to="/wizard">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/10">
                  Apply for Access
                </Button>
              </Link>
            </div>

            {/* Mobile Nav Button */}
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Dropdown Nav */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="md:hidden border-b border-slate-900 bg-slate-950 px-4 py-6 space-y-4">
                <nav className="flex flex-col gap-4 text-sm font-semibold text-slate-400">
                  <a href="#features" className="hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
                  <a href="#industries" className="hover:text-white" onClick={() => setMobileMenuOpen(false)}>Trades</a>
                  <a href="#how-it-works" className="hover:text-white" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                  <a href="#faq" className="hover:text-white" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                </nav>
                <hr className="border-slate-900" />
                <div className="flex flex-col gap-3">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-slate-800 text-slate-300 bg-transparent hover:text-white hover:bg-slate-900">Log In</Button>
                  </Link>
                  <Link to="/wizard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Apply for Access</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ──── HERO ──── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60 border-b border-slate-900/60">
          {/* Animated Mesh Grid Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-30 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          
          {/* Glowing Brand Accent Spheres */}
          <div className="absolute top-10 right-0 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-5 left-10 w-[550px] h-[550px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" />

          {/* Interactive Floating Glowing Moons */}
          <InteractiveMoon mouseX={mx} mouseY={my} top="12%" left="78%" size={180} color="rgba(13, 148, 136, 0.3)" delay={0} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="45%" left="4%" size={120} color="rgba(6, 182, 212, 0.25)" delay={1.5} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="28%" left="90%" size={90} color="rgba(245, 158, 11, 0.2)" delay={2.5} />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16 lg:py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div initial="hidden" animate="visible" className="space-y-8 text-left">
                <motion.div variants={fadeUp} custom={0} className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-400 uppercase tracking-widest backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Interactive 3D Worksite Operations
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-white">
                    Run the field and the<br />
                    <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 bg-clip-text text-transparent" style={{ textShadow: "0 0 50px rgba(13,148,136,0.3)" }}>
                      office from one place.
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed font-medium">
                    Real-time crew location tracking with interactive WebGL geofencing, AI face verification, and instant dispatch updates. Built for modern trade operations.
                  </p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ⚡ Drag, rotate, and interact with the 3D grid model ➔
                  </p>
                </motion.div>
                
                <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4">
                  <Link to="/wizard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-600/30 border border-teal-500/20">
                      Apply for Access <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 group border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900" onClick={() => setDemoOpen(true)}>
                    <PlayCircle className="mr-2 h-5 w-5 text-teal-400 transition-transform group-hover:scale-110" /> Watch Demo
                  </Button>
                </motion.div>
              </motion.div>

              {/* Futuristic Interactive 3D WebGL Scene Column */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="relative bg-slate-950/40 border border-slate-900/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl ring-1 ring-white/5"
              >
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 border border-slate-900 rounded-full px-3 py-1.5 text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Live WebGL Render
                </div>
                <FsmThreeScene />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ──── TRUST STRIP ──── */}
        <section className="bg-slate-950 py-10 md:py-14 border-b border-slate-900/60 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900/20 pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Integrated Ecosystem</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">One operating view for your entire business</h2>
              <p className="text-slate-400 text-base md:text-lg max-w-lg leading-relaxed">
                Connect the office and the field without stitching together separate calendar schedules, timesheets, and invoicing apps.
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {outcomes.map((outcome) => (
                <Card key={outcome.title} className="border-slate-900 bg-slate-900/30 backdrop-blur-md shadow-lg hover:border-teal-500/20 hover:bg-slate-900/50 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                      <outcome.icon className="h-5.5 w-5.5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{outcome.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">{outcome.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ──── METRICS BAR ──── */}
        <section className="border-b border-slate-900 bg-slate-950 py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            {[
              { val: "Guided", label: "Founder Setup" },
              { val: "Connected", label: "Office + Field Workflows" },
              { val: "Configurable", label: "Worksite Boundaries" },
              { val: "Mobile", label: "Real-Time Updates" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-black bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">{s.val}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──── INDUSTRIES / TRADES ──── */}
        <section id="industries" className="py-10 md:py-14 bg-slate-950 overflow-hidden relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="text-center mb-8 space-y-2">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                Built for every field service trade
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
                Whether you manage a 5-person crew or a multi-city operation, OnSite adapts to your trade.
              </motion.p>
            </motion.div>
          </div>

          <div className="marquee-wrap space-y-4">
            {/* Row 1 → scrolls left */}
            <div className="overflow-hidden">
              <div className="marquee-track flex gap-5" style={{ animation: "marquee-left 35s linear infinite", width: "max-content" }}>
                {[...industriesRow1, ...industriesRow1].map((ind, i) => (
                  <div key={`r1-${i}`} className="flex items-center gap-3.5 rounded-2xl bg-slate-900/40 border border-slate-900 px-5 py-4 shrink-0 hover:border-teal-500/20 hover:bg-slate-900/70 transition-all duration-300 group cursor-default">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/15">
                      <ind.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white whitespace-nowrap">{ind.name}</p>
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">{ind.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 → scrolls right */}
            <div className="overflow-hidden">
              <div className="marquee-track flex gap-5" style={{ animation: "marquee-right 40s linear infinite", width: "max-content" }}>
                {[...industriesRow2, ...industriesRow2].map((ind, i) => (
                  <div key={`r2-${i}`} className="flex items-center gap-3.5 rounded-2xl bg-slate-900/40 border border-slate-900 px-5 py-4 shrink-0 hover:border-teal-500/20 hover:bg-slate-900/70 transition-all duration-300 group cursor-default">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/15">
                      <ind.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white whitespace-nowrap">{ind.name}</p>
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">{ind.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ──── 2026 BENTO GRID FEATURES ──── */}
        <section id="features" className="relative py-14 md:py-20 bg-slate-950 border-t border-slate-900">
          {/* Neon mesh background */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-[140px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-12 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Core Capabilities</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                Everything you need in a modern workspace
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
                Complete control over your field service workflows. Fast, configurable, and completely transparent.
              </p>
            </motion.div>

            {/* Asymmetric 2026 Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">
              
              {/* Card 1: Live GPS Tracking (Large - 2 cols) */}
              <div className="md:col-span-2 md:row-span-2 rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 flex flex-col justify-between overflow-hidden group hover:border-teal-500/20 transition-all duration-300 relative">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                    <Map className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Live Map Dispatching</h3>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    Monitor crew members in real time on an interactive map. Drill down to individual routes, check status tags, and update job dispatches immediately.
                  </p>
                </div>
                {/* Visual indicator (2026 aesthetic) */}
                <div className="mt-4 border border-slate-800 bg-slate-950/80 rounded-2xl p-4 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Crew active: 14 / 15</span>
                  </div>
                  <div className="text-teal-400 font-bold uppercase">Live Map Overlay</div>
                </div>
              </div>

              {/* Card 2: Geofence Boundaries (Standard - 1 col) */}
              <div className="rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-teal-500/20 transition-all duration-300 group relative">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Smart Geofences</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Draw digital perimeters around job sites. Automatically record client arrivals, departure times, and duration logs.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-4">Automated boundary logs</div>
              </div>

              {/* Card 3: Face ID Gatekeeper (Standard - 1 col) */}
              <div className="rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-teal-500/20 transition-all duration-300 group relative">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                    <ScanFace className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Face ID Gatekeeper</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Verify identities at clock-in using secure visual recognition. Ensure correct staffing credentials on critical sites.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-4">AI Identity check</div>
              </div>

              {/* Card 4: Invoices & Billing (Standard - 1 col) */}
              <div className="rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-teal-500/20 transition-all duration-300 group relative">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Invoices & Billing</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Instantly draft invoice sheets from completed jobs. Monitor client payments, manual ledger receipts, and balances.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-4">Linked Ledger Accounts</div>
              </div>

              {/* Card 5: Jobs & Scheduling (Large - 2 cols) */}
              <div className="md:col-span-2 rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-teal-500/20 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Jobs & Scheduling</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Create single visits or complex projects. Dispatch checklists to mobile devices, track job progress indicators, and schedule recurring services.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-4">Complete FSM dispatcher</div>
              </div>

            </div>
          </div>
        </section>

        {/* ──── SCREENSHOTS SHOWCASE ──── */}
        <section className="py-12 md:py-16 bg-slate-950 border-t border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-16">
            
            {/* Staff management */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
                <motion.p variants={fadeUp} custom={0} className="text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-2">
                  <Users className="h-4.5 w-4.5" /> Staff Management
                </motion.p>
                <motion.h3 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-extrabold text-white">Your entire team at a glance</motion.h3>
                <motion.p variants={fadeUp} custom={2} className="text-slate-400 text-base leading-relaxed">
                  Add staff profiles with custom titles and roles. Assign them to crew groups, watch status updates, and monitor location coordinates per staff member.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {["Photo-based staff profiles", "Active/offline status tracking", "Location history mapping"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                      <CheckCircle2 className="h-4.5 w-4.5 text-teal-500 shrink-0" /> {t}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-2xl overflow-hidden shadow-2xl border border-slate-900 ring-4 ring-slate-950">
                <img src={featureStaffList} alt="Staff management list view" width={1200} height={700} className="w-full h-auto" loading="lazy" />
              </motion.div>
            </div>

            {/* Geofences */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-2xl overflow-hidden shadow-2xl border border-slate-900 ring-4 ring-slate-950 order-2 lg:order-1">
                <img src={featureGeofence} alt="Geofence zone configuration" width={1200} height={700} className="w-full h-auto" loading="lazy" />
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5 order-1 lg:order-2">
                <motion.p variants={fadeUp} custom={0} className="text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-2">
                  <Target className="h-4.5 w-4.5" /> Geofence Zones
                </motion.p>
                <motion.h3 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-extrabold text-white">Smart boundaries, smarter alerts</motion.h3>
                <motion.p variants={fadeUp} custom={2} className="text-slate-400 text-base leading-relaxed">
                  Draw virtual perimeters around job locations. Log when field service technicians arrive and leave, and automatically flag delays or anomalies.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {["Visual boundary drawing on map", "Configurable radius settings", "Verification gates & safety alerts"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                      <CheckCircle2 className="h-4.5 w-4.5 text-teal-500 shrink-0" /> {t}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ──── HOW IT WORKS ──── */}
        <section id="how-it-works" className="relative py-12 md:py-16 bg-slate-950 border-t border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-10 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Onboarding Flow</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">Up and running in minutes</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">No complex server setups. Access is ready immediately.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((s, i) => (
                <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp}>
                  <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 h-full space-y-3 hover:border-teal-500/20 transition-all duration-300">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-teal-500/10 text-teal-400 text-sm font-bold border border-teal-500/20">
                      {s.num}
                    </div>
                    <h3 className="text-base font-bold text-white">{s.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── COMPLIANCE BANNER ──── */}
        <section className="bg-slate-950 py-10 md:py-14 border-t border-slate-900">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Security & Accountability</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">Configurable privacy and location controls</h2>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                Your company decides how worksites and attendance checklists are configured. Define geofence boundaries, track active shifts, and audit exceptions according to local guidelines.
              </p>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {["Company-managed worksites", "Role-based account controls", "Active shift updates only", "Privacy security guards"].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-900 bg-slate-900/10 p-4 text-xs sm:text-sm font-semibold text-slate-200">
                  <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-400" /> {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── MOBILE APP PREVIEW ──── */}
        <section id="mobile" className="py-12 md:py-16 bg-gradient-to-b from-teal-650 to-teal-800 text-white relative">
          {/* Subtle particles */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <InteractiveParticlesCanvas color="255, 255, 255" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
                <h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-black leading-tight">
                  A mobile app your<br />crew will actually use
                </h2>
                <p variants={fadeUp} custom={1} className="text-base text-teal-100 max-w-lg leading-relaxed">
                  The OnSite Crew Manager companion app is <span className="font-extrabold text-white">coming soon</span> to the Google Play Store. Download the secure Android APK package directly to start tracking now.
                </p>
                <div variants={fadeUp} custom={2} className="space-y-2.5">
                  {[
                    "Android APK package download available",
                    "Optimized battery & background location GPS tracking",
                    "Seamless geofence automated check-ins",
                    "Face ID selfie verification check gates",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300 shrink-0" />
                      <span className="text-teal-100 text-sm font-medium">{t}</span>
                    </div>
                  ))}
                </div>
                <div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <a href="/downloads/Ocrem.apk" download>
                    <Button size="lg" className="text-base gap-2 bg-white text-teal-700 hover:bg-teal-50 font-extrabold shadow-xl">
                      <Download className="h-5 w-5" /> Download Android APK
                    </Button>
                  </a>
                  <div className="inline-block opacity-45 cursor-not-allowed grayscale pointer-events-none">
                    <img alt="Get it on Google Play — Coming Soon" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" className="h-14 w-auto" />
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative flex justify-center pt-2">
                <div className="relative z-10 w-full max-w-sm">
                  <div className="rounded-3xl bg-slate-900 border border-slate-800 text-white p-4 shadow-2xl">
                    <div className="flex items-center gap-3 rounded-full bg-slate-950 px-4 py-2.5 mb-3 border border-slate-900">
                      <Search className="h-4 w-4 text-slate-500 shrink-0" />
                      <div className="text-xs font-semibold text-slate-300 truncate">OnSite Crew Manager</div>
                      <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold border border-teal-500/25">O</div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">App interface preview</div>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={playStoreListing} alt="OnSite Crew Manager on Google Play" className="w-full h-auto block" loading="lazy" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-300">Direct APK</span>
                        <span>•</span>
                        <span>Android OS</span>
                      </div>
                      <div className="inline-flex items-center gap-1 bg-slate-950 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-900">
                        Coming Soon
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ──── FAQ ──── */}
        <section id="faq" className="py-12 md:py-16 bg-slate-950 border-t border-slate-900">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="text-center mb-8 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Support Desk</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">Frequently asked questions</h2>
              <p className="text-slate-400 text-sm sm:text-base">Everything you need to know about OnSite Crew Manager.</p>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.details
                  key={faq.q} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                  className="group border border-slate-900 rounded-2xl bg-slate-900/10 hover:border-teal-500/20 transition-all duration-200 [&[open]]:border-teal-500/40"
                >
                  <summary className="flex items-center justify-between gap-4 p-4 cursor-pointer text-sm sm:text-base font-bold text-white select-none [&::-webkit-details-marker]:hidden list-none">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 text-slate-400 leading-relaxed text-xs sm:text-sm">{faq.a}</div>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        {/* ──── CTA ──── */}
        <section className="relative overflow-hidden py-14 md:py-18 bg-slate-950 border-t border-slate-900">
          <InteractiveMoon mouseX={mx} mouseY={my} top="15%" left="6%" size={140} color="rgba(13, 148, 136, 0.2)" delay={0.3} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="45%" left="86%" size={90} color="rgba(245, 158, 11, 0.15)" delay={1.8} />

          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-extrabold text-white">Ready to bring your field and office together?</h2>
              <p variants={fadeUp} custom={1} className="text-base text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">
                Configure your company credentials, geofenced worksites, and assign mobile accounts.
              </p>
              <div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Link to="/wizard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base px-10 bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg border border-teal-500/20">
                    Apply for Access <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-10 border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900">Log In</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ──── FOOTER ──── */}
        <footer className="relative border-t border-slate-900 bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
            <InteractiveParticlesCanvas color="13, 148, 136" />
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <img src="/favicon.png" alt="Ocrem" className="h-7 w-7 rounded-md" />
                <span className="font-bold text-white text-base">OnSite Crew Manager</span>
              </div>
              <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400">
                <Link to="/about" className="hover:text-white transition-colors">About</Link>
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/support" className="hover:text-white transition-colors">Support</Link>
                <Link to="/account-deletion" className="hover:text-white transition-colors">Account Deletion</Link>
              </nav>
            </div>
            <p className="text-center text-xs text-slate-500 mt-6">© {new Date().getFullYear()} OnSite Crew Manager. All rights reserved.</p>
          </div>
        </footer>

        {/* Demo Video Dialog */}
        <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden border-slate-900 bg-slate-950 sm:rounded-2xl">
            <VisuallyHidden>
              <DialogTitle>OnSite Crew Manager product demo</DialogTitle>
              <DialogDescription>Watch a short demo of the OnSite Crew Manager dashboard and mobile app.</DialogDescription>
            </VisuallyHidden>
            <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
              {demoOpen && (
                <iframe
                  src="https://iframe.mediadelivery.net/embed/655691/433c41a7-5218-48e4-8dc5-f87a011c3060?autoplay=true&loop=false&muted=false&preload=true&responsive=true"
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                  title="OnSite Crew Manager demo"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
