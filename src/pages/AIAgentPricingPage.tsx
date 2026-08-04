import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";

export default function AIAgentPricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState<string>("your company");
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free_trial");

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('companies')
        .select('name, subscription_tier')
        .eq('auth_user_id', user.id)
        .single();
      
      if (!error && data) {
        setCompanyName(data.name || "your company");
        setSubscriptionTier(data.subscription_tier || "free_trial");
      }
    };
    
    fetchCompanyData();
  }, [user]);

  const handleGrowthUpgrade = () => {
    const text = `Hi there! I would like to upgrade to the Growth Plan ($29/seat/mo) to unlock the AI Agent add-on for ${companyName}. Please assist with activation.`;
    window.open(`https://wa.me/14094229714?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleFoundingPartnerUpgrade = () => {
    const text = `Hi there! I would like to upgrade to the Founding Partner Yearly Charter to unlock the AI Agent add-on for ${companyName}. Please assist with activation.`;
    window.open(`https://wa.me/14094229714?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <DashboardLayout activeTab="marketplace">
      <SEO title="Upgrade Plan - AI Agent" description="Upgrade your plan to unlock the AI Agent add-on" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link 
          to="/marketplace/ai-agent" 
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          ← Back to AI Agent
        </Link>
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Upgrade Your Plan to Unlock AI Agent
          </h1>
          <p className="text-lg text-slate-600">
            The AI Agent add-on is available on Growth and Founding Partner plans. Choose a plan below to get started.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {/* Free Trial Card */}
          <Card className="relative border-slate-200 p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
                Free Trial
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="text-3xl font-black text-slate-900">$0</span>
                <span className="text-slate-500 ml-1 font-medium text-xs">/ 14 days</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-3 text-xs">
                {[
                  "1 Office Staff",
                  "2 Field Crew Members",
                  "14 Days Full Access",
                  "GPS Map & Checklists"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle2 className="w-4 h-4 mr-2.5 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button variant="outline" className="w-full text-xs font-semibold" disabled>
                {subscriptionTier === "free_trial" ? "Your Current Plan" : "Included in Trial"}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Growth Plan Card */}
          <Card className="relative border-amber-500/50 shadow-md border-2 p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                Growth
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="text-3xl font-black text-slate-900">$495</span>
                <span className="text-slate-500 ml-1 font-medium text-xs">/ mo</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-3 text-xs">
                {[
                  "3 Office Staff",
                  "7 Field Crew Members",
                  "AI Agent Dispatcher",
                  "Safety Hub & Compliance"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle2 className="w-4 h-4 mr-2.5 text-emerald-500 shrink-0" />
                    <span className={feature.includes("AI Agent") ? "font-bold text-slate-900" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                onClick={handleGrowthUpgrade}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Activate via WhatsApp →
              </Button>
            </CardFooter>
          </Card>
          
          {/* Founding Partner Card (VIP Featured Card) */}
          <Card className="relative border-purple-500/80 shadow-xl border-2 p-6 sm:p-7 rounded-3xl flex flex-col justify-between bg-gradient-to-b from-purple-500/5 via-white to-purple-500/5 ring-2 ring-purple-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[9px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
              VIP Charter
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-500 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
                Founding Partner
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="text-3xl font-black text-slate-900">$2,899</span>
                <span className="text-slate-500 ml-1 font-medium text-xs">/ yr</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center text-purple-950 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>🔒 Locked-in pricing forever</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span><strong>20 Total Seats Included</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>👥 Direct access to the founders</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>🗳️ Vote on the product roadmap</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>📞 Quarterly strategy calls</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>🚀 Priority feature requests</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>🤝 White-glove onboarding</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>⚡ Early access to new features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>🌟 Featured Founding Partner</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>💬 Private WhatsApp VIP group</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                onClick={handleFoundingPartnerUpgrade}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold h-11 rounded-xl shadow-lg shadow-purple-600/20"
              >
                Join VIP Charter ($2,899/yr) →
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Card */}
          <Card className="relative border-cyan-500/50 p-6 flex flex-col justify-between">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]">
                Enterprise
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">Custom</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-3 text-xs">
                {[
                  "Custom Unlimited Seats",
                  "Dedicated SLA Guarantee",
                  "Custom API Integrations",
                  "24/7 Account Manager"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle2 className="w-4 h-4 mr-2.5 text-cyan-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                onClick={() => {
                  const text = encodeURIComponent("Hi there! We are interested in an Enterprise Custom Plan on FiledCrews. Please connect us with an Account Manager.");
                  window.open(`https://wa.me/14094229714?text=${text}`, "_blank");
                }}
                className="w-full bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold"
              >
                Contact Sales →
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
