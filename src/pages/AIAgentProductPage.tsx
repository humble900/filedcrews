import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainCircuit,
  MapPin,
  ClipboardList,
  Receipt,
  FileText,
  Mic,
  Package,
  Clock,
  ArrowLeft,
  Lock,
  ArrowRight
} from "lucide-react";

export default function AIAgentProductPage() {
  const navigate = useNavigate();
  const { company } = useAuth();
  
  const isAgentEnabled = (company as any)?.ai_agent_enabled === true;
  const tier = (company as any)?.subscription_tier;
  const isEligiblePlan = tier === 'growth' || tier === 'founding_partner';

  const features = [
    {
      icon: BrainCircuit,
      title: "Natural Language Commands",
      description: "Tell the agent what to do in plain English via the CMD+K command bar."
    },
    {
      icon: MapPin,
      title: "Smart Dispatch",
      description: "Auto-assign the best technician using GPS proximity, certifications, and performance scoring."
    },
    {
      icon: ClipboardList,
      title: "Project & Job Creation",
      description: "Create projects, work orders, and task checklists from a single natural language prompt."
    },
    {
      icon: Receipt,
      title: "Invoice Automation",
      description: "Auto-generate draft invoices from completed jobs with correct line items and tax calculations."
    },
    {
      icon: FileText,
      title: "Estimate Builder",
      description: "Build multi-option Good/Better/Best proposals from your pricebook catalog."
    },
    {
      icon: Mic,
      title: "Voice Copilot",
      description: "Field technicians dictate job notes and the AI structures them into formatted invoices."
    },
    {
      icon: Package,
      title: "Inventory Alerts",
      description: "Auto-draft purchase orders when part stock levels drop below minimum thresholds."
    },
    {
      icon: Clock,
      title: "Timesheet Auditing",
      description: "Auto-approve timesheet entries that match geofence check-in and check-out data."
    }
  ];

  return (
    <DashboardLayout activeTab="marketplace">
      <SEO 
        title="FiledCrew AI Agent | Marketplace" 
        description="Your autonomous AI coworker for field operations." 
      />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Button 
          variant="ghost" 
          className="mb-8 -ml-4 text-slate-500 hover:text-slate-900" 
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
        </Button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-16">
          <img 
            src="/ai-agent-logo.jpg" 
            alt="AI Agent Logo" 
            className="w-16 h-16 rounded-xl object-cover shadow-sm border border-slate-200" 
            onError={(e) => {
              // Fallback if image is missing
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23f1f5f9"/><circle cx="32" cy="32" r="16" fill="%233b82f6"/></svg>';
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                FiledCrew AI Agent
              </h1>
              {isAgentEnabled && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 px-2.5 py-0.5 text-sm">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
              Your autonomous AI coworker that dispatches crews, creates projects, drafts invoices, and manages your field operations — all from natural language commands.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-8">Capabilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow border-slate-200 bg-white">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-12 text-center md:text-left">
            How It Works
          </h2>
          <div className="flex flex-col md:flex-row gap-8 relative">
            <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-[2px] bg-slate-100 z-0"></div>
            
            {[
              { 
                step: 1, 
                title: "Connect Your AI Provider", 
                desc: "Bring your own OpenAI, Anthropic, or Google Gemini API key." 
              },
              { 
                step: 2, 
                title: "Write Your Playbook", 
                desc: "Give the agent natural language instructions for dispatch rules, invoicing, and scheduling." 
              },
              { 
                step: 3, 
                title: "Enable Skills", 
                desc: "Toggle which operations the agent is allowed to perform across your platform." 
              },
            ].map(s => (
              <div key={s.step} className="flex-1 relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold flex items-center justify-center text-xl mb-5 shadow-sm">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 pb-16">
          {isAgentEnabled ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Agent Configured</h3>
              <p className="text-slate-600 mb-8 text-lg">Your AI Agent is active and ready to assist you.</p>
              <Button onClick={() => navigate('/ai-agent')} size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
                Go to Agent Settings <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : isEligiblePlan ? (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to automate your operations?</h3>
              <p className="text-slate-600 mb-8 text-lg max-w-md">
                Activate the FiledCrew AI Agent add-on and start transforming how you manage your field teams.
              </p>
              <Button onClick={() => navigate('/marketplace/ai-agent/terms')} size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
                Activate FiledCrew AI Agent <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Card className="border-amber-200 bg-amber-50/50 shadow-sm max-w-2xl mx-auto">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-amber-100/50 flex items-center justify-center mb-5">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Upgrade Required</h3>
                <p className="text-slate-600 mb-8 text-lg max-w-md">
                  The AI Agent add-on is available on Growth and Founding Partner plans.
                </p>
                <Button 
                  onClick={() => navigate('/marketplace/ai-agent/pricing')} 
                  variant="outline" 
                  size="lg"
                  className="border-amber-200 text-amber-800 hover:bg-amber-100 h-12 px-8 text-base"
                >
                  View Plans & Subscribe <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
      </div>
    </DashboardLayout>
  );
}
