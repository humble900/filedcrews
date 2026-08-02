import { useParams, Link } from "react-router-dom";
import { 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Thermometer, 
  Droplets, 
  Leaf, 
  ShieldCheck, 
  BarChart3, 
  Clock, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

// Define the content for each industry
const USE_CASES: Record<string, any> = {
  hvac: {
    title: "How Apex HVAC Scaled to 50 Trucks Using FiledCrews Agentic",
    industry: "HVAC & Cooling",
    icon: Thermometer,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    heroImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop",
    stats: [
      { label: "Reduction in Windshield Time", value: "32%" },
      { label: "Increase in Service Agreements", value: "2.4x" },
      { label: "Faster Dispatching", value: "85%" }
    ],
    paragraphs: [
      "Apex HVAC was struggling with the chaotic summer rush. Dispatchers were overwhelmed, field techs were driving across town inefficiently, and paper service agreements were getting lost in the shuffle.",
      "By switching to the platform and enabling FiledCrews Agentic, the AI began automatically routing technicians based on real-time traffic and skill-matching. A job requiring a specialized EPA certification was instantly assigned to the closest qualified tech, entirely bypassing the human bottleneck.",
      "The Customer Portal completely changed how they sell Service Agreements. Homeowners can now see their active HVAC maintenance plans in a beautiful dashboard and book their seasonal tune-ups without calling the office."
    ],
    testimonial: {
      quote: "FiledCrews Agentic took our dispatching off autopilot and put it into hyperdrive. We've reclaimed hours of wasted driving time every single day.",
      author: "Sarah Jenkins, Operations Manager at Apex HVAC"
    }
  },
  plumbing: {
    title: "Eliminating Emergency Chaos: The PlumbPro Story",
    industry: "Plumbing Services",
    icon: Droplets,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    heroImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2070&auto=format&fit=crop",
    stats: [
      { label: "Faster Emergency Response", value: "45%" },
      { label: "More 5-Star Reviews", value: "3.1x" },
      { label: "Invoice Time-to-Paid", value: "< 24h" }
    ],
    paragraphs: [
      "In the plumbing industry, emergencies don't wait. PlumbPro needed a solution that could handle 2AM burst pipe calls without waking up a manual dispatcher.",
      "With our Offline-First Mobile App, PlumbPro technicians can now update task statuses and upload inspection photos even when deep in a concrete basement with zero cellular service. The moment they step outside, the app automatically syncs the data back to the office.",
      "Furthermore, the Automated Reputation Engine automatically detects when a job went perfectly by analyzing the tech's closing notes. It then fires an automated SMS to the homeowner requesting a Google Review, skyrocketing PlumbPro's local SEO ranking."
    ],
    testimonial: {
      quote: "The offline mobile reliability is a game-changer. My guys no longer lose their notes when working in underground parking garages.",
      author: "Mike Vance, Owner of PlumbPro"
    }
  },
  electrical: {
    title: "Wired for Growth: Volt Electric's Transformation",
    industry: "Electrical Contractors",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    heroImage: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop",
    stats: [
      { label: "Safety Compliance", value: "100%" },
      { label: "Admin Time Saved", value: "20hrs/wk" },
      { label: "Asset Tracking Accuracy", value: "99.9%" }
    ],
    paragraphs: [
      "Volt Electric handles complex commercial wiring projects and massive residential generator installs. Tracking the service history of every installed panel and generator was a nightmare using standard CRM tools.",
      "Our Visual Asset Timelines transformed their workflow. Technicians now open the app and see a beautiful, glassmorphic timeline of every repair and maintenance visit ever performed on a specific generator. They know exactly when the warranty expires and when to pitch a replacement.",
      "With FiledCrews Agentic, electricians can dictate their highly technical job notes using voice. The AI perfectly formats the text and automatically generates a pristine invoice for the customer."
    ],
    testimonial: {
      quote: "The Asset Timelines are beautiful. We can show a customer the exact history of their 22kW generator and prove exactly why it needs a replacement.",
      author: "David Chen, Lead Master Electrician"
    }
  },
  landscaping: {
    title: "Greener Pastures: Scaling Recurring Maintenance",
    industry: "Landscaping & Lawn Care",
    icon: Leaf,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    heroImage: "https://images.unsplash.com/photo-1592424001801-9bc0ed11394a?q=80&w=2070&auto=format&fit=crop",
    stats: [
      { label: "Route Efficiency", value: "+40%" },
      { label: "Customer Retention", value: "96%" },
      { label: "Crew Accountability", value: "100%" }
    ],
    paragraphs: [
      "Managing 15 different lawn care crews driving to 100 properties a day requires absolute precision. TurfMasters was losing money on fuel and poorly routed schedules.",
      "We deployed our True Route Optimization (TSP) engine. Now, the system mathematically calculates the most efficient driving path for every crew, slashing fuel costs by thousands of dollars a month.",
      "To solve crew accountability, TurfMasters utilizes the Face ID Gatekeeper. Crew members must take a quick selfie to clock in at the first property, completely eliminating buddy punching and payroll fraud."
    ],
    testimonial: {
      quote: "The route optimization paid for the software in the first week. We are doing 2 extra properties a day per truck simply by driving smarter.",
      author: "Jessica Alba, Fleet Manager at TurfMasters"
    }
  }
};

export default function UseCasePage() {
  const { industry } = useParams<{ industry: string }>();
  
  const content = USE_CASES[industry || ""] || USE_CASES["hvac"];
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-white">
      <SEO title={`${content.industry} Case Study | Field Service Software`} description={content.title} path={`/use-cases/${industry}`} />

      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">FiledCrews</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Back to Home
            </Link>
            <Button className="h-11 px-6 rounded-full font-bold bg-slate-900 text-white hover:bg-slate-800">
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${content.bg} ${content.color} font-bold text-sm uppercase tracking-wider`}>
              <Icon className="h-4 w-4" /> {content.industry}
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              {content.title}
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
              Discover how modern field service software completely transformed operations, cutting administrative waste and accelerating revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20">
                Start Your Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative z-10 lg:h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10">
            <img 
              src={content.heroImage} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-slate-50 rounded-full blur-3xl -z-10" />
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {content.stats.map((stat: any, i: number) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3">
                <div className={`h-16 w-16 rounded-2xl ${content.bg} ${content.color} flex items-center justify-center mb-2`}>
                  {i === 0 ? <Clock className="h-8 w-8" /> : i === 1 ? <BarChart3 className="h-8 w-8" /> : <Users className="h-8 w-8" />}
                </div>
                <h3 className="text-4xl font-black text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {content.paragraphs.map((p: string, i: number) => (
            <p key={i} className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
              {p}
            </p>
          ))}

          {/* Testimonial */}
          <div className="mt-16 bg-slate-900 rounded-3xl p-10 md:p-12 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 ${content.bg} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20`} />
            <div className="relative z-10 space-y-6">
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl text-white font-bold leading-tight">
                "{content.testimonial.quote}"
              </blockquote>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <p className="text-slate-400 font-medium">{content.testimonial.author}</p>
                <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Ready to upgrade your operations?
          </h2>
          <p className="text-xl text-slate-500 font-medium">
            Join thousands of modern field service companies scaling effortlessly.
          </p>
          <Button size="lg" className="h-16 px-10 rounded-full font-black text-lg bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-transform hover:scale-105">
            Start Your 14-Day Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
