import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  Shield,
  Smartphone,
  ChevronRight,
  CheckCircle2,
  Map,
  ScanFace,
  Bell,
  ArrowRight,
  Clock,
  Target,
  Menu,
  X,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

import heroDashboard from "@/assets/hero-dashboard.jpg";
import heroMobile from "@/assets/hero-mobile.jpg";
import featureStaffList from "@/assets/feature-staff-list.jpg";
import featureGeofence from "@/assets/feature-geofence.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: Map,
    title: "Live Map Tracking",
    desc: "See exactly where every team member is in real time on an interactive map with photo markers.",
  },
  {
    icon: Target,
    title: "Geofence Zones",
    desc: "Draw virtual boundaries on the map. Get notified when staff enter or leave designated areas.",
  },
  {
    icon: ScanFace,
    title: "Face Verification",
    desc: "Optional AI-powered face check ensures the right person checks in. Not just the right phone.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    desc: "Push notifications for check-ins, check-outs, and geofence events keep you informed 24/7.",
  },
  {
    icon: Clock,
    title: "Shift Management",
    desc: "Track work hours automatically. See who checked in, when, and for how long.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Company-scoped data isolation, encrypted communications, and role-based access controls.",
  },
];

const steps = [
  {
    num: "1",
    title: "Create your account",
    desc: "Sign up in seconds. Set your company name and unique prefix.",
  },
  {
    num: "2",
    title: "Add your staff",
    desc: "Add team members with photos. They get instant mobile app access.",
  },
  {
    num: "3",
    title: "Set up geofences",
    desc: "Draw zones on the map for offices, sites, or client locations.",
  },
  {
    num: "4",
    title: "Track in real time",
    desc: "Watch your team's locations update live. Get alerts automatically.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <SEO
        title="Staff Tracker — Real-Time Staff Location & Attendance Dashboard"
        description="Track your team in real time with GPS, geofences, and face verification. Manage staff attendance, monitor movement, and get instant alerts from one powerful dashboard."
        path="/"
        ogImageAlt="Staff Tracker dashboard showing a live map with staff locations, geofence zones, and a mobile app companion view."
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* ──── NAVBAR ──── */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span className="text-lg sm:text-xl font-bold text-foreground">Staff Tracker</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-base font-medium text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#mobile" className="hover:text-foreground transition-colors">Mobile App</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">Log In</Button>
              </Link>
              <Link to="/auth?tab=signup" className="hidden md:inline-flex">
                <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Get Started <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" /></Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-border/40"
              >
                <nav className="flex flex-col px-4 py-3 gap-1">
                  <a
                    href="#features"
                    className="py-2.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="py-2.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </a>
                  <a
                    href="#mobile"
                    className="py-2.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mobile App
                  </a>
                  <div className="flex gap-2 pt-2 pb-1">
                    <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full text-sm">Log In</Button>
                    </Link>
                    <Link to="/auth?tab=signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full text-sm">Get Started</Button>
                    </Link>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ──── HERO ──── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30 pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-28 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                <motion.div variants={fadeUp} custom={0} className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-base font-medium text-primary">
                    <Smartphone className="h-4 w-4" /> Admin Dashboard + Mobile App
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                    Know where your<br />
                    <span className="text-primary">team is. Always.</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground max-w-lg">
                    Real-time staff location tracking with geofencing, face verification, and instant alerts. All from one powerful dashboard.
                  </p>
                </motion.div>
                <motion.div variants={fadeUp} custom={2} className="flex flex-wrap gap-4">
                  <Link to="/auth?tab=signup">
                    <Button size="lg" className="text-base px-8">
                      Start Tracking <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="outline" className="text-base px-8">
                      See Features
                    </Button>
                  </a>
                </motion.div>
                <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-x-6 gap-y-2 text-base text-muted-foreground">
                  {["Real-time GPS", "Face verification", "Geofence alerts", "Works offline"].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-success" /> {t}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="rounded-xl overflow-hidden shadow-2xl border border-border/50">
                  <img
                    src={heroDashboard}
                    alt="Staff Tracker admin dashboard showing live map with staff locations"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                  />
                </div>
                {/* Floating mobile mockup */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="absolute -bottom-4 left-0 sm:-bottom-8 sm:-left-8 w-28 sm:w-36 md:w-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-background"
                >
                  <img
                    src={heroMobile}
                    alt="Staff Tracker mobile app showing check-in status"
                    width={800}
                    height={1200}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ──── SOCIAL PROOF BAR ──── */}
        <section className="border-y border-border/50 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            {[
              { val: "Real-Time", label: "GPS Tracking" },
              { val: "AI-Powered", label: "Face Verification" },
              { val: "Unlimited", label: "Geofence Zones" },
              { val: "Instant", label: "Push Notifications" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary">{s.val}</p>
                <p className="text-base text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──── FEATURES ──── */}
        <section id="features" className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16 space-y-4"
            >
              <motion.span variants={fadeUp} custom={0} className="inline-block rounded-full bg-accent px-4 py-1.5 text-base font-medium text-accent-foreground">
                Features
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-foreground">
                Everything you need to<br />manage a mobile workforce
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto text-xl">
                From live tracking to automated attendance, Staff Tracker gives you complete visibility over your field operations.
              </motion.p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  custom={i}
                  variants={fadeUp}
                >
                  <Card className="h-full border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                    <CardContent className="p-6 space-y-4">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <f.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── SCREENSHOTS SHOWCASE ──── */}
        <section className="py-20 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-20">
            {/* Staff management */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6"
              >
                <motion.span variants={fadeUp} custom={0} className="inline-flex items-center gap-2 text-base font-medium text-primary">
                  <Users className="h-5 w-5" /> Staff Management
                </motion.span>
                <motion.h3 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-foreground">
                  Your entire team at a glance
                </motion.h3>
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-xl leading-relaxed">
                  Add staff with their photos, assign them to zones, and see their status instantly. Know who's active, who's offline, and where they were last seen. All from a single dashboard.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-3">
                  {["Photo-based staff profiles", "Active/offline status tracking", "Location history per staff member"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-lg text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> {t}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-xl overflow-hidden shadow-xl border border-border/50"
              >
                <img src={featureStaffList} alt="Staff management list view" width={1200} height={700} className="w-full h-auto" loading="lazy" />
              </motion.div>
            </div>

            {/* Geofences */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-xl overflow-hidden shadow-xl border border-border/50 order-2 lg:order-1"
              >
                <img src={featureGeofence} alt="Geofence zone configuration" width={1200} height={700} className="w-full h-auto" loading="lazy" />
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6 order-1 lg:order-2"
              >
                <motion.span variants={fadeUp} custom={0} className="inline-flex items-center gap-2 text-base font-medium text-primary">
                  <Target className="h-5 w-5" /> Geofence Zones
                </motion.span>
                <motion.h3 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-foreground">
                  Smart boundaries, smarter alerts
                </motion.h3>
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-xl leading-relaxed">
                  Draw circles on the map to define work zones. When staff enter or leave these zones, you know immediately. Set check-in/check-out times and enable face verification for extra security.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-3">
                  {["Visual geofence editor on map", "Customizable radius and schedules", "Optional face ID on check-in"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-lg text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> {t}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ──── HOW IT WORKS ──── */}
        <section id="how-it-works" className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16 space-y-4"
            >
              <motion.span variants={fadeUp} custom={0} className="inline-block rounded-full bg-accent px-4 py-1.5 text-base font-medium text-accent-foreground">
                How It Works
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-foreground">
                Up and running in minutes
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto text-xl">
                No complex setup. No technical expertise required. Four simple steps to full visibility.
              </motion.p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  custom={i}
                  variants={fadeUp}
                  className="relative"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground text-xl font-bold">
                      {s.num}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{s.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[4.5rem] w-[calc(100%-3.5rem)] border-t-2 border-dashed border-border" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── MOBILE APP ──── */}
        <section id="mobile" className="py-20 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-8"
              >
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
                  <Smartphone className="h-4 w-4" />
                  Available on Google Play
                </motion.div>
                <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold">
                  A mobile app your<br />staff will actually use
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-xl opacity-90 max-w-lg">
                  Live Staff Tracker is officially listed on the Google <span className="font-extrabold">Play Store</span>. Easy to find, quick to install, and works on any modern Android device. Background location updates, automatic check-ins, and face verification. All handled seamlessly.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="space-y-4">
                  {[
                    'Search "Live Staff Tracking" on Google Play',
                    "Works on any Android phone or tablet",
                    "Free, secure install. Auto-updates via Play Store",
                    "Background GPS, face verification & push notifications",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="text-lg opacity-90">{t}</span>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.livestafftracker.stafftracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform hover:scale-105"
                    aria-label="Get it on Google Play"
                  >
                    <img
                      alt="Get it on Google Play"
                      src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                      className="h-16 sm:h-20 w-auto"
                    />
                  </a>
                  <Link to="/auth?tab=signup">
                    <Button size="lg" variant="secondary" className="text-base">
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex justify-center lg:justify-end"
              >
                <div className="w-72 sm:w-80 md:w-96 lg:w-[420px] xl:w-[480px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                  <img
                    src={heroMobile}
                    alt="Staff Tracker mobile app"
                    width={800}
                    height={1200}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ──── CTA ──── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold text-foreground">
                Ready to know where your team is?
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-xl text-muted-foreground mt-4 max-w-xl mx-auto">
                Set up your account in under 2 minutes. Add your staff, draw your zones, and start tracking. No credit card required.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="flex flex-wrap justify-center gap-4 mt-8">
                <Link to="/auth?tab=signup">
                  <Button size="lg" className="text-base px-10">
                    Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="text-base px-10">
                    Log In
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ──── FOOTER ──── */}
        <footer className="border-t border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Staff Tracker</span>
              </div>
              <nav className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-sm sm:text-base text-muted-foreground">
                <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
                <Link to="/account-deletion" className="hover:text-foreground transition-colors">Account Deletion</Link>
              </nav>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              © {new Date().getFullYear()} Staff Tracker. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
