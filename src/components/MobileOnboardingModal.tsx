import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Zap,
  Flame,
  Trees,
  Building2,
  Sparkles,
  Sun,
  ShieldCheck,
  Smartphone,
  Monitor,
  Bot,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  X,
  UserCheck,
  Briefcase,
  Rocket,
  MapPin,
  Clock,
  Mic,
  Volume2,
  Play,
  Layers,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MobileOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStep?: number;
}

// Verticals definition with vector illustrations and color themes
export const INDUSTRY_VERTICALS = [
  {
    id: "hvac",
    name: "HVAC & Climate Control",
    icon: Flame,
    color: "from-cyan-500/20 via-blue-500/10 to-teal-500/20",
    borderColor: "border-cyan-500/40",
    badgeColor: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
    accentGlow: "shadow-cyan-500/10",
    tagline: "EPA Certification & Diagnostic Copilot",
    highlight: "Auto-detect refrigerant types & log equipment serial numbers via camera.",
    stat: "Saved 4.5 hrs/week per tech"
  },
  {
    id: "electrical",
    name: "Electrical & Power Systems",
    icon: Zap,
    color: "from-amber-500/20 via-yellow-500/10 to-orange-500/20",
    borderColor: "border-amber-500/40",
    badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    accentGlow: "shadow-amber-500/10",
    tagline: "Hands-Free Voice-to-Invoice Dictation",
    highlight: "Dictate technical wiring notes while hands are on tools — AI builds the job invoice.",
    stat: "3x faster job closeout"
  },
  {
    id: "plumbing",
    name: "Plumbing & Piping",
    icon: Wrench,
    color: "from-sky-500/20 via-indigo-500/10 to-blue-500/20",
    borderColor: "border-sky-500/40",
    badgeColor: "bg-sky-500/15 text-sky-600 border-sky-500/30",
    accentGlow: "shadow-sky-500/10",
    tagline: "Before/After Photo Audits & Estimates",
    highlight: "Snap pipe repair photos with automated water-mark & geofence timestamping.",
    stat: "100% dispute protection"
  },
  {
    id: "landscaping",
    name: "Landscaping & Grounds Care",
    icon: Trees,
    color: "from-emerald-500/20 via-green-500/10 to-teal-500/20",
    borderColor: "border-emerald-500/40",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    accentGlow: "shadow-emerald-500/10",
    tagline: "Multi-Zone Geofence Crew Tracking",
    highlight: "Clock in automatically as trucks arrive at lawn maintenance property zones.",
    stat: "Zero manual timecard errors"
  },
  {
    id: "construction",
    name: "Construction & General Contracting",
    icon: Building2,
    color: "from-orange-500/20 via-amber-500/10 to-red-500/20",
    borderColor: "border-orange-500/40",
    badgeColor: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    accentGlow: "shadow-orange-500/10",
    tagline: "Biometric Face-ID Site Verification",
    highlight: "Enforce site safety compliance & sub-contractor identity verification.",
    stat: "Fully OSHA compliant"
  },
  {
    id: "cleaning",
    name: "Commercial & Residential Cleaning",
    icon: Sparkles,
    color: "from-purple-500/20 via-indigo-500/10 to-pink-500/20",
    borderColor: "border-purple-500/40",
    badgeColor: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    accentGlow: "shadow-purple-500/10",
    tagline: "Smart Room-by-Room Checklists",
    highlight: "Complete interactive checklists with instant client progress notifications.",
    stat: "99.4% customer satisfaction"
  },
  {
    id: "solar",
    name: "Solar & Renewable Energy",
    icon: Sun,
    color: "from-yellow-500/20 via-amber-500/10 to-orange-500/20",
    borderColor: "border-yellow-500/40",
    badgeColor: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    accentGlow: "shadow-yellow-500/10",
    tagline: "Roof Inspection & Equipment Scan",
    highlight: "Scan solar inverter barcodes & log panel tilt specs directly to job file.",
    stat: "2x faster inspection logs"
  },
  {
    id: "security",
    name: "Security Patrol & Facility Guard",
    icon: ShieldCheck,
    color: "from-slate-500/20 via-indigo-500/10 to-slate-800/20",
    borderColor: "border-indigo-500/40",
    badgeColor: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    accentGlow: "shadow-indigo-500/10",
    tagline: "Real-Time Patrol GPS Breadcrumb Trail",
    highlight: "Generate verified patrol route proof for commercial property owners.",
    stat: "Live 24/7 supervisor audit"
  }
];

export default function MobileOnboardingModal({
  isOpen,
  onClose,
  defaultStep = 0
}: MobileOnboardingModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(defaultStep);
  const [selectedVertical, setSelectedVertical] = useState("hvac");
  const [isPlayingAudioDemo, setIsPlayingAudioDemo] = useState(false);

  if (!isOpen) return null;

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const activeVerticalData = INDUSTRY_VERTICALS.find(v => v.id === selectedVertical) || INDUSTRY_VERTICALS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="FiledCrews" className="h-7 w-7 rounded-lg shadow-sm" />
            <span className="font-bold text-sm tracking-tight text-foreground">FiledCrews Mobile Guide</span>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-6 bg-primary"
                    : idx < currentStep
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-hidden">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: Welcome & Core Purpose */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center"
              >
                {/* Hero Vector Graphic Illustration */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-cyan-500/20 animate-pulse blur-xl" />
                  <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-teal-500/30 p-3 shadow-xl flex flex-col items-center justify-center gap-2">
                    <Smartphone className="h-10 w-10 text-teal-400 animate-bounce" />
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-bold text-teal-300">Live GPS</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge className="bg-teal-500/15 text-teal-600 border-teal-500/30 font-bold px-3 py-1">
                    Mobile First Operations
                  </Badge>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                    How FiledCrews Connects Mobile & Web
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Whether you're a <strong>Sole Trader / Solo Contractor</strong> or leading a <strong>multi-truck crew</strong>, FiledCrews bridges your field phone with an admin dashboard.
                  </p>
                </div>

                {/* Ecosystem Features Grid */}
                <div className="grid grid-cols-2 gap-3 text-left pt-2">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 space-y-1.5">
                    <Smartphone className="h-5 w-5 text-teal-500" />
                    <h4 className="font-bold text-xs text-foreground">Mobile App (Field)</h4>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      GPS live map, automated geofence timecards, camera photo verification, voice AI assistant.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 space-y-1.5">
                    <Monitor className="h-5 w-5 text-indigo-500" />
                    <h4 className="font-bold text-xs text-foreground">Web Portal (Admin)</h4>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Supervisor map, customer job dispatching, estimate-to-invoice billing, team payroll.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Interactive Industry Vertical Selector */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5">
                  <Badge className="bg-indigo-500/15 text-indigo-600 border-indigo-500/30 font-bold px-3 py-0.5">
                    Step 2 of 5
                  </Badge>
                  <h2 className="text-xl font-extrabold text-foreground">
                    Select Your Industry Vertical
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tailored workflows, checklists, and AI prompts designed for your exact trade.
                  </p>
                </div>

                {/* Horizontal / Grid Vertical Badges */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto p-1 scrollbar-hidden">
                  {INDUSTRY_VERTICALS.map(v => {
                    const Icon = v.icon;
                    const isSelected = selectedVertical === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVertical(v.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-2.5 ${
                          isSelected
                            ? `bg-gradient-to-br ${v.color} ${v.borderColor} ring-2 ring-primary/40 shadow-lg ${v.accentGlow}`
                            : "bg-card hover:bg-muted/50 border-border/70"
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground truncate">{v.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{v.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Selected Vertical Highlight Box */}
                <div className={`p-4 rounded-2xl border bg-gradient-to-br ${activeVerticalData.color} ${activeVerticalData.borderColor} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <activeVerticalData.icon className="h-5 w-5 text-primary" />
                      <span className="font-bold text-xs text-foreground">{activeVerticalData.name} Workflows</span>
                    </div>
                    <Badge className={activeVerticalData.badgeColor}>{activeVerticalData.stat}</Badge>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    "{activeVerticalData.highlight}"
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: How Sole Traders & Techs Get Mobile Access */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 text-center"
              >
                <div className="space-y-1.5">
                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold px-3 py-0.5">
                    Step 3 of 5
                  </Badge>
                  <h2 className="text-xl font-extrabold text-foreground">
                    Getting Access on Mobile
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Two simple ways to unlock the FiledCrews mobile experience:
                  </p>
                </div>

                {/* Two Path Comparison Cards */}
                <div className="space-y-3 text-left">
                  {/* Path A: Sole Trader */}
                  <div className="p-4 rounded-2xl border bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-card border-teal-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-teal-500" />
                        <h4 className="font-bold text-xs text-foreground">1. Sole Trader / Business Owner</h4>
                      </div>
                      <Badge className="bg-teal-500/15 text-teal-600 border-teal-500/30 text-[10px] font-bold">Free Setup</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Register your company workspace in 60 seconds. You automatically become administrator and can sign into both the web portal and mobile app using your email & password.
                    </p>
                  </div>

                  {/* Path B: Employee Crew Member */}
                  <div className="p-4 rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-card border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-indigo-500" />
                        <h4 className="font-bold text-xs text-foreground">2. Hired Field Crew Member</h4>
                      </div>
                      <Badge className="bg-indigo-500/15 text-indigo-600 border-indigo-500/30 text-[10px] font-bold">Sign In</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If your employer created your account, sign in using your assigned username (e.g. <code className="text-indigo-400 font-mono">@JOHN_DOE</code>) or email. You will enter the mobile portal directly.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Mila Voice AI Copilot Feature Demo */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 text-center"
              >
                <div className="space-y-1.5">
                  <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 font-bold px-3 py-0.5">
                    Step 4 of 5
                  </Badge>
                  <h2 className="text-xl font-extrabold text-foreground">
                    Meet Mila — Your AI Field Assistant
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Built right into the mobile app for voice dictation, smart job notes, and diagnostic support.
                  </p>
                </div>

                {/* Copilot Demo Simulator Card */}
                <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 space-y-3 text-left shadow-xl">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-indigo-400 animate-pulse" />
                      <span className="font-bold text-xs text-white">Mila Mobile Copilot</span>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px]">
                      Voice Enabled
                    </Badge>
                  </div>

                  {/* Sample Chat Message */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/10 text-indigo-100 flex items-start gap-2">
                      <Mic className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>"Mila, log 35ft copper tubing and 2 lbs R410A refrigerant for job #104."</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-600/40 border border-indigo-400/30 text-white flex items-start gap-2">
                      <Bot className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-emerald-300">✓ Logged to Job Invoice #104</p>
                        <p className="text-[11px] text-indigo-200">
                          Added $145.00 parts cost to estimate. Geofence timecard updated.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs font-bold gap-1.5 border-indigo-400/40 text-indigo-200 hover:bg-indigo-500/20"
                    onClick={() => {
                      setIsPlayingAudioDemo(true);
                      toast.info("Mila AI Copilot demo active: Try voice commands inside your workspace!");
                      setTimeout(() => setIsPlayingAudioDemo(false), 2500);
                    }}
                  >
                    {isPlayingAudioDemo ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> Playing Audio Voice Demo...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 text-indigo-400" /> Listen to Audio Voice Sample
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Sole Trader Gateway & Call to Action */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold px-3 py-1">
                    Ready to Launch
                  </Badge>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                    Start Your FiledCrews Journey
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Select your action below to access the mobile app or create your company workspace.
                  </p>
                </div>

                {/* Gateway Choice Buttons */}
                <div className="space-y-3 pt-1">
                  <Button
                    onClick={() => {
                      onClose();
                      navigate(`/wizard?vertical=${selectedVertical}`);
                    }}
                    className="w-full h-12 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/20"
                  >
                    <Rocket className="h-5 w-5" />
                    Create Free Workspace (Sole Trader / Owner)
                  </Button>

                  <Button
                    onClick={() => {
                      onClose();
                      navigate("/auth");
                    }}
                    variant="outline"
                    className="w-full h-12 text-sm font-bold gap-2 border-border/80 hover:bg-muted"
                  >
                    <UserCheck className="h-5 w-5 text-primary" />
                    Sign In as Hired Crew Member
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-2">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Free 14-day trial · No credit card required · Instant mobile access
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/60 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-xs font-bold gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              size="sm"
              onClick={handleNext}
              className="text-xs font-bold gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onClose}
              variant="outline"
              className="text-xs font-bold"
            >
              Close Guide
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
