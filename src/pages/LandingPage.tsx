import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Menu, X, ArrowRight, PlayCircle, Building2, Smartphone, 
  MapPin, Clock, ShieldCheck, Banknote, Users, Sparkles, CheckCircle2, ChevronRight, LayoutDashboard, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Framer Motion Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/20 font-sans overflow-x-hidden text-slate-900">
      <Helmet>
        <title>FieldSync | Modern FSM for Service Leaders</title>
        <meta name="description" content="The command center for field operations. Geofencing, unified action inbox, and autonomous AI dispatching." />
      </Helmet>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight">FieldSync</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Platform</a>
            <a href="#workflows" className="hover:text-primary transition-colors">Workflows</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Founding Partner</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Sign In</Link>
            <Link to="/wizard">
              <Button className="font-bold shadow-lg hover:shadow-xl transition-all rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-2xl font-black">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Platform</a>
              <a href="#workflows" onClick={() => setMobileMenuOpen(false)}>Workflows</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <hr className="border-slate-100" />
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/wizard" onClick={() => setMobileMenuOpen(false)}>
                <Button size="lg" className="w-full text-lg rounded-xl h-14">Get Started Today</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full -z-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-tr-full -z-10 blur-3xl" />

        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-8">
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
              The command center for modern <span className="text-primary relative">field operations.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 18C80 4 220 4 298 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Ditch the generic tools. Equip your team with precise GPS geofencing, a unified action inbox, and autonomous AI dispatching.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/wizard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-xl shadow-primary/20 group">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-slate-200 hover:bg-slate-100 font-bold">
                <PlayCircle className="mr-2 h-5 w-5 text-slate-500" />
                See How It Works
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero UI Mockup Reveal */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring", bounce: 0.4 }}
            className="mt-20 mx-auto max-w-6xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10" />
            <div className="rounded-2xl border border-slate-200/60 shadow-2xl bg-white p-2 overflow-hidden flex">
              {/* Sidebar Mock */}
              <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 hidden md:block rounded-xl">
                <div className="h-8 w-32 bg-slate-200 rounded mb-8" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-10 rounded-lg ${i === 1 ? 'bg-primary/10 border border-primary/20' : 'bg-slate-200/50'}`} />
                  ))}
                </div>
              </div>
              {/* Main Content Mock */}
              <div className="flex-1 p-6 bg-white">
                <div className="flex justify-between items-center mb-8">
                  <div className="h-8 w-48 bg-slate-100 rounded-lg" />
                  <div className="h-10 w-32 bg-primary rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
                      <div className="h-6 w-12 bg-slate-200 rounded" />
                      <div className="h-8 w-24 bg-slate-300 rounded" />
                    </div>
                  ))}
                </div>
                <div className="h-64 bg-slate-50 rounded-xl border border-slate-100" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Features Bento Box */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Everything in one place.</h2>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">Purpose-built modules that communicate instantly, eliminating data silos and manual entry.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Big Bento 1 */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-100 transition-colors duration-500" />
            <LayoutDashboard className="h-10 w-10 text-indigo-600 mb-6 relative z-10" />
            <h3 className="text-2xl font-bold mb-2 relative z-10">Unified Action Inbox</h3>
            <p className="text-slate-500 font-medium max-w-md relative z-10">
              Never lose a customer message or forget an overdue invoice. We consolidate automated system alerts and omni-channel customer chats into one single feed.
            </p>
          </motion.div>

          {/* Small Bento 1 */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl overflow-hidden relative group"
          >
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-colors" />
            <BrainCircuit className="h-10 w-10 text-primary mb-6 relative z-10" />
            <h3 className="text-2xl font-bold mb-2 relative z-10">AI Copilot</h3>
            <p className="text-slate-400 font-medium relative z-10">
              Auto-generate responses, predict supply shortages, and dynamically route schedules.
            </p>
          </motion.div>

          {/* Small Bento 2 */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm"
          >
            <MapPin className="h-10 w-10 text-emerald-500 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Live GPS Geofencing</h3>
            <p className="text-slate-500 font-medium">Track your crews in real-time and automate timesheets when they cross job site perimeters.</p>
          </motion.div>

          {/* Big Bento 2 */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden relative"
          >
            <Banknote className="h-10 w-10 text-amber-500 mb-6 relative z-10" />
            <h3 className="text-2xl font-bold mb-2 relative z-10">Flawless Financials & Change Orders</h3>
            <p className="text-slate-500 font-medium max-w-md relative z-10">
              From estimate to invoice in one click. Track detailed project costs and execute transparent change orders directly from the field app.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Affiliate & Portals Row */}
      <section id="workflows" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h2 className="text-4xl font-black mb-6">Empower your customers and partners.</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="mt-1 h-10 w-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Self-Serve Customer Portal</h4>
                    <p className="text-slate-500 font-medium">Clients log in to pay invoices, approve change orders, and view service history on their installed assets.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 h-10 w-10 shrink-0 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Built-in Affiliate System</h4>
                    <p className="text-slate-500 font-medium">Generate partner codes. Affiliates get their own portal to track referrals, deal stages, and commissions automatically.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl -z-10 rotate-3 scale-105" />
               <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-white">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center"><Building2 className="text-primary" /></div>
                    <div>
                      <div className="font-bold">Affiliate Dashboard</div>
                      <div className="text-sm text-slate-400">Partner Code: ACME2026</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-medium text-slate-300">Active Referrals</span>
                      <span className="font-bold text-2xl">14</span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-medium text-slate-300">Pending Commissions</span>
                      <span className="font-bold text-2xl text-emerald-400">$4,250</span>
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section id="pricing" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Become a Founding Partner.</h2>
          <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
            Skip the SaaS subscription treadmill. Secure lifetime access to the ultimate field service platform for a one-time investment.
          </p>
          
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-primary" />
            <div className="flex justify-center mb-6">
              <span className="px-4 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-full tracking-wide uppercase">Charter Membership</span>
            </div>
            <div className="text-6xl font-black mb-2">$4,997</div>
            <div className="text-slate-500 font-bold mb-8">One-time payment. Yours forever.</div>
            
            <ul className="text-left space-y-4 mb-10 max-w-sm mx-auto">
              {[
                "Unlimited Staff & Crew Members",
                "Full CRM & Asset Management",
                "Unified Action Inbox & Omnichannel",
                "GPS Geofencing & Real-time Maps",
                "Customer & Affiliate Portals",
                "Priority VIP Support"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 font-medium text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <Link to="/wizard">
              <Button size="lg" className="w-full text-lg h-14 rounded-xl shadow-lg">Claim Your Charter License</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary h-6 w-6" />
            <span className="text-xl font-black text-white">FieldSync</span>
          </div>
          <div className="text-sm font-medium">
            &copy; 2026 FieldSync Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
