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
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Trial Card */}
          <Card className="relative opacity-75 border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-xl">14-Day Free Trial</CardTitle>
                {subscriptionTier === "free_trial" && (
                  <Badge variant="secondary">Current Plan</Badge>
                )}
              </div>
              <CardDescription>
                <span className="text-3xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500 ml-1">/ 14 days</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "5 Field Crew Seats",
                  "Live GPS",
                  "Timesheets",
                  "Job Checklists"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-600">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-slate-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Your Current Plan
              </Button>
            </CardFooter>
          </Card>
          
          {/* Growth Plan Card */}
          <Card className="relative border-emerald-500 shadow-sm border-2">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">AI Agent Included</Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl mb-2">Growth Plan</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-slate-900">$29</span>
                <span className="text-slate-500 ml-1">/ seat / mo</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Unlimited Crew Seats",
                  "Dispatch & Quote Engine",
                  "Client Portal",
                  "AI Agent Add-on"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500" />
                    <span className={feature === "AI Agent Add-on" ? "font-medium" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGrowthUpgrade}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Activate via WhatsApp →
              </Button>
            </CardFooter>
          </Card>
          
          {/* Founding Partner Card */}
          <Card className="relative border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-xl">Founding Partner</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">AI Agent Included</Badge>
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-slate-900">Yearly Charter</span>
                <span className="text-slate-500 ml-1">/ annual</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Yearly VIP Charter",
                  "White-Glove Migration",
                  "Direct Co-Design Access",
                  "AI Agent Add-on"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-blue-500" />
                    <span className={feature === "AI Agent Add-on" ? "font-medium" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleFoundingPartnerUpgrade}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Join Yearly Charter →
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
