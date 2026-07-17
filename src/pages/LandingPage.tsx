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
.marquee-track { will-change: transform; }
.marquee-wrap:hover .marquee-track { animation-play-state: paused; }
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

      <div className="min-h-screen bg-white text-slate-900" onMouseMove={handleMouseMove}>

        {/* ──── NAVBAR ──── */}
        <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/favicon.png" alt="Ocrem" className="h-8 w-8 rounded-lg" />
              <span className="text-lg sm:text-xl font-bold text-slate-900">OnSite Crew Manager</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
              <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
              <a href="#industries" className="hover:text-slate-900 transition-colors">Industries</a>
              <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" className="text-sm text-slate-600 hover:text-slate-900">Log In</Button>
              </Link>
              <Link to="/wizard" className="hidden md:inline-flex">
                <Button size="sm" className="text-sm px-4 bg-teal-600 hover:bg-teal-700 text-white">
                  Apply as a Founder Partner <ChevronRight className="ml-1 h-4 w-4" />
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
                  {[{ href: "#features", label: "Features" }, { href: "#industries", label: "Industries" }, { href: "#how-it-works", label: "How It Works" }, { href: "#faq", label: "FAQ" }, { href: "#mobile", label: "Mobile App" }].map((link) => (
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
        <section className="relative overflow-hidden bg-slate-50/20 border-b border-stone-100/60">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <InteractiveParticlesCanvas color="13, 148, 136" />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-3xl pointer-events-none" />
          <InteractiveMoon mouseX={mx} mouseY={my} top="6%" left="78%" size={200} color="rgba(13, 148, 136, 0.22)" delay={0} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="50%" left="1%" size={130} color="rgba(20, 184, 166, 0.18)" delay={1.2} />
          <InteractiveMoon mouseX={mx} mouseY={my} top="25%" left="93%" size={80} color="rgba(245, 158, 11, 0.15)" delay={2.5} />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-14 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div initial="hidden" animate="visible" className="space-y-7">
                <motion.div variants={fadeUp} custom={0} className="space-y-4">

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-slate-900">
                    Run the field and the<br />
                    <span className="text-teal-600" style={{ textShadow: "0 0 40px rgba(13,148,136,0.25)" }}>office from one place.</span>
                  </h1>
                  <p className="text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed">
                    Real-time crew location tracking with geofencing, face verification, and instant alerts — built for HVAC, plumbing, electrical, cleaning, and construction teams.
                  </p>
                  <p className="text-sm font-medium text-slate-600 max-w-lg">Founder Partners receive guided setup. Access is reviewed and activated manually for each company.</p>
                </motion.div>
                <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link to="/wizard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20">
                      Apply for Founder Partner Access <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 group border-stone-200 text-slate-700 hover:bg-stone-50" onClick={() => setDemoOpen(true)}>
                    <PlayCircle className="mr-2 h-5 w-5 text-teal-600 transition-transform group-hover:scale-110" /> Watch the 2-minute demo
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-stone-200/80 ring-1 ring-slate-900/5">
                  <img src={heroDashboard} alt="OnSite Crew Manager admin dashboard showing live map with staff locations" width={1920} height={1080} className="w-full h-auto" />
                </div>
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="absolute -bottom-4 left-0 sm:-bottom-8 sm:-left-8 w-28 sm:w-36 md:w-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-900/5">
                  <img src={heroMobile} alt="Mobile app check-in view" width={800} height={1200} className="w-full h-auto" loading="lazy" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-white py-8 md:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Built for the work that matters</p>
              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900">One operating view for your entire service business</h2>
              <p className="text-slate-500 text-lg leading-relaxed">Keep the office and the field connected without stitching together separate dispatch, time, and billing tools.</p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {outcomes.map((outcome) => (
                <Card key={outcome.title} className="border-stone-200 bg-stone-50/50 shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <outcome.icon className="h-6 w-6 text-teal-600" />
                    <h3 className="text-lg font-bold text-slate-900">{outcome.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{outcome.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-stone-100 bg-stone-50/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            {[
              { val: "Guided", label: "Founder Partner Setup" },
              { val: "Connected", label: "Office + Field Workflows" },
              { val: "Configurable", label: "Worksite Boundaries" },
              { val: "Mobile", label: "Crew Updates" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold text-teal-600">{s.val}</p>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──── INDUSTRIES — Marquee ──── */}
        <section id="industries" className="py-8 md:py-10 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="text-center mb-8 space-y-2">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold text-slate-900">
                Built for every field service trade
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-500 max-w-lg mx-auto">
                Whether you manage a 5-person crew or a 500-person operation, OnSite Crew Manager adapts to your trade.
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

        {/* ──── SCREENSHOTS SHOWCASE ──── */}
        <section className="py-8 md:py-10 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-14">
            {/* Staff management */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
                <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-widest text-teal-600 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Staff Management
                </motion.p>
                <motion.h3 variants={fadeUp} custom={1} className="text-2xl md:text-3xl font-extrabold text-slate-900">Your entire team at a glance</motion.h3>
                <motion.p variants={fadeUp} custom={2} className="text-slate-500 text-lg leading-relaxed">
                  Add staff with their photos, assign them to zones, and see their status instantly. Know who's active, who's offline, and where they were last seen.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {["Photo-based staff profiles", "Active/offline status tracking", "Location history per staff member"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" /> {t}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-xl overflow-hidden shadow-xl border border-stone-200/60 ring-1 ring-slate-900/5">
                <img src={featureStaffList} alt="Staff management list view" width={1200} height={700} className="w-full h-auto" loading="lazy" />
              </motion.div>
            </div>

            {/* Geofences */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-xl overflow-hidden shadow-xl border border-stone-200/60 ring-1 ring-slate-900/5 order-2 lg:order-1">
                <img src={featureGeofence} alt="Geofence zone configuration" width={1200} height={700} className="w-full h-auto" loading="lazy" />
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4 order-1 lg:order-2">
                <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-widest text-teal-600 flex items-center gap-2">
                  <Target className="h-4 w-4" /> Geofence Zones
                </motion.p>
                <motion.h3 variants={fadeUp} custom={1} className="text-2xl md:text-3xl font-extrabold text-slate-900">Smart boundaries, smarter alerts</motion.h3>
                <motion.p variants={fadeUp} custom={2} className="text-slate-500 text-lg leading-relaxed">
                  Draw circles on the map to define work zones. When staff enter or leave these zones, you know immediately. Enable face verification for extra security.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {["Visual geofence editor on map", "Customizable radius and schedules", "Optional face ID on check-in"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" /> {t}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
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

        {/* ──── MOBILE APP ──── */}
        <section className="bg-slate-950 py-8 text-white md:py-10">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-300">Built for accountable operations</p>
              <h2 className="text-2xl font-extrabold md:text-4xl">Your company controls how field workflows are configured.</h2>
              <p className="text-slate-300 leading-relaxed">Use worksite boundaries, shift workflows, and optional verification features according to your company policies and local requirements. Give your team clear notice and review exceptions before taking action.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Company-managed worksite settings", "Role-based office and crew access", "Configurable attendance workflows", "Privacy and account controls"].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-medium text-slate-100">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" /> {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="mobile" className="py-8 md:py-12 bg-teal-600 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
                <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold">
                  A mobile app your<br />crew will actually use
                </motion.h2>
                <motion.p variants={fadeUp} custom={1} className="text-base text-teal-100 max-w-lg leading-relaxed">
                  The OnSite Crew Manager mobile app is <span className="font-extrabold text-white">coming soon</span> to the Google Play Store. Background location, automatic check-ins, and face verification — all seamless.
                </motion.p>
                <motion.div variants={fadeUp} custom={2} className="space-y-2">
                  {[
                    "Android APK available now; Google Play listing planned",
                    "Works on any Android phone or tablet",
                    "Free, secure install",
                    "Background GPS, face verification & push notifications",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                      <span className="text-teal-100 text-sm">{t}</span>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                  <a href="/downloads/Ocrem.apk" download>
                    <Button size="lg" className="text-base gap-2 bg-white text-teal-700 hover:bg-teal-50 font-bold shadow-lg">
                      <Download className="h-5 w-5" /> Download Android APK
                    </Button>
                  </a>
                  <div className="inline-block opacity-40 cursor-not-allowed grayscale pointer-events-none" aria-label="Coming soon on Google Play">
                    <img alt="Get it on Google Play — Coming Soon" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" className="h-14 w-auto" />
                  </div>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative flex justify-center pt-4 pb-10">
                <div className="absolute inset-0 -z-0 flex items-center justify-center pointer-events-none">
                  <div className="h-[350px] w-[350px] rounded-full bg-white/5 blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-md">
                  <div className="rounded-3xl bg-white text-slate-900 p-4 shadow-2xl ring-1 ring-black/5">
                    <div className="flex items-center gap-3 rounded-full bg-stone-100 px-4 py-2.5 mb-3">
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="text-sm font-medium text-slate-900 truncate">OnSite Crew Manager</div>
                      <span className="ml-auto inline-block h-4 w-px bg-stone-200" />
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold">O</div>
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Android mobile app preview</div>
                    <div className="rounded-xl overflow-hidden border border-stone-200 bg-white">
                      <img src={playStoreListing} alt="OnSite Crew Manager on Google Play" className="w-full h-auto block" loading="lazy" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-slate-700">Direct download</div>
                        <div className="text-slate-400">Free</div>
                        <div className="text-slate-400">Android</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-slate-400 px-4 py-1.5 font-semibold cursor-not-allowed opacity-60">
                        <Download className="h-3.5 w-3.5" /> Coming Soon
                      </div>
                    </div>
                  </div>

                  <motion.div initial={{ opacity: 0, x: -20, y: 10 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }} className="hidden sm:flex absolute -left-8 -top-6 z-20 items-center gap-3 rounded-2xl bg-white text-slate-900 px-4 py-3 shadow-xl ring-1 ring-black/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-500" aria-hidden><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.3 2.8 1-5.9L1.5 7.7l5.9-.9z" /></svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold leading-tight">Founder Partner</div>
                      <div className="text-xs text-slate-400">Guided setup included</div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20, y: 10 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.45, duration: 0.5 }} className="hidden sm:flex absolute -right-8 -bottom-10 z-20 items-center gap-3 rounded-2xl bg-white text-slate-900 px-4 py-3 shadow-xl ring-1 ring-black/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                      <Smartphone className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold leading-tight">Any Android</div>
                      <div className="text-xs text-slate-400">Phone or tablet</div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ──── FAQ ──── */}
        <section id="faq" className="py-8 md:py-10 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="text-center mb-8 space-y-2">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-4xl font-extrabold text-slate-900">Frequently asked questions</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-slate-500">Everything you need to know about OnSite Crew Manager.</motion.p>
            </motion.div>

            <div className="space-y-2.5">
              {faqs.map((faq, i) => (
                <motion.details
                  key={faq.q} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                  className="group border border-stone-200 rounded-xl bg-white hover:border-teal-200 transition-colors duration-200 [&[open]]:border-teal-300 [&[open]]:shadow-md [&[open]]:shadow-teal-600/5"
                >
                  <summary className="flex items-center justify-between gap-4 p-4 cursor-pointer text-sm font-semibold text-slate-900 select-none [&::-webkit-details-marker]:hidden list-none">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 text-slate-600 leading-relaxed text-sm">{faq.a}</div>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        {/* ──── CTA ──── */}
        <section className="relative overflow-hidden py-8 md:py-10 bg-stone-50/50">
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
                  <Button size="lg" className="w-full sm:w-auto text-base px-10 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20">
                    Apply for Founder Partner Access <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-10 border-stone-200 text-slate-700 hover:bg-stone-50">Log In</Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <footer className="relative border-t border-stone-100 bg-stone-50 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-45">
            <InteractiveParticlesCanvas color="13, 148, 136" />
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/favicon.png" alt="Ocrem" className="h-6 w-6 rounded-md" />
                <span className="font-semibold text-slate-900">OnSite Crew Manager</span>
              </div>
              <nav className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-sm text-slate-500">
                <Link to="/about" className="hover:text-slate-900 transition-colors">About</Link>
                <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                <Link to="/support" className="hover:text-slate-900 transition-colors">Support</Link>
                <Link to="/account-deletion" className="hover:text-slate-900 transition-colors">Account Deletion</Link>
              </nav>
            </div>
            <p className="text-center text-sm text-slate-400 mt-5">© {new Date().getFullYear()} OnSite Crew Manager. All rights reserved.</p>
          </div>
        </footer>

        {/* Demo Video Dialog */}
        <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden border-stone-200 bg-white sm:rounded-2xl">
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
