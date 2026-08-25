import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Users,
  Sparkles,
  Crown,
  Headphones,
  Zap,
  ShieldCheck,
  Rocket,
  Award,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";

export default function AIAgentPricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free_trial");
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, subscription_tier")
        .eq("auth_user_id", user.id)
        .single();
      
      if (!error && data) {
        setSubscriptionTier(data.subscription_tier || "free_trial");
        setCompanyId(data.id);
      }
    };
    
    fetchCompanyData();
  }, [user]);

  const handleStripeUpgrade = async (planId: string) => {
    if (!companyId) return;
    setIsRedirectingToStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe_subscription", {
        body: {
          action: "create_checkout_session",
          planId,
          companyId,
          returnUrl: `${window.location.origin}/marketplace/ai-agent/pricing?upgrade=success`,
        }
      });
      if (error || !data?.url) throw new Error(data?.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err: any) {
      setIsRedirectingToStripe(false);
      alert(err.message || "Checkout session initialization failed.");
    }
  };

  return (
    <DashboardLayout>
      <SEO 
        title="AI Agent Plans & Pricing" 
        description="Upgrade your workspace with autonomous AI dispatching and crew management."
        path="/marketplace/ai-agent/pricing"
      />
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5">
            Flexible Scaling & VIP Options
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Plans for Growing Trade Teams
          </h1>
          <p className="text-sm text-muted-foreground">
            Activate autonomous AI scheduling, real-time crew routing, or lock in permanent pricing with our VIP Charter.
          </p>
        </div>

        {/* 4 Cards Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          
          {/* Free Trial Card */}
          <Card className="relative border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold">Free Trial</CardTitle>
              <CardDescription className="mt-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">$0</span>
                <span className="text-slate-500 ml-1 font-medium text-xs">/ 14 days</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span><strong>1 Office Staff Seat</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span><strong>2 Field Crew Members</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span>Live GPS Map & Geofences</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span>Automated Timesheets</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                variant="outline"
                className="w-full text-xs font-bold"
                disabled
              >
                Current Default
              </Button>
            </CardFooter>
          </Card>

          {/* Growth Card */}
          <Card className="relative border-amber-500/50 p-6 flex flex-col justify-between shadow-md hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              10 Seats
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                Growth
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">$495</span>
                <span className="text-slate-500 ml-1 font-medium text-xs">/ mo</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span><strong>3 Office Staff Seats</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span><strong>7 Field Crew Members</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span>Autonomous AI Dispatcher</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span>Safety Hub & Compliance</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                onClick={() => handleStripeUpgrade("growth")}
                disabled={isRedirectingToStripe}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {isRedirectingToStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Subscribe via Stripe ($495/mo) <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Founding Partner Card (VIP Featured Card) */}
          <Card className="relative border-purple-500/80 shadow-xl border-2 p-6 sm:p-7 rounded-3xl flex flex-col justify-between bg-gradient-to-b from-purple-500/5 via-white to-purple-500/5 dark:from-purple-950/20 dark:via-slate-900 dark:to-purple-950/20 ring-2 ring-purple-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[9px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
              VIP Charter
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-500 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
                Founding Partner
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">$2,899</span>
                <span className="text-slate-500 ml-1 font-medium text-xs">/ yr</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                <li className="flex items-center text-purple-950 dark:text-purple-300 font-bold">
                  <Lock className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Locked-in pricing forever</span>
                </li>
                <li className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span><strong>20 Total Seats Included</strong></span>
                </li>
                <li className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Direct access to the founders</span>
                </li>
                <li className="flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Vote on the product roadmap</span>
                </li>
                <li className="flex items-center">
                  <Headphones className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Quarterly strategy calls</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Priority feature requests</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>White-glove onboarding</span>
                </li>
                <li className="flex items-center">
                  <Rocket className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Early access to new features</span>
                </li>
                <li className="flex items-center">
                  <Award className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Featured Founding Partner badge</span>
                </li>
                <li className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                  <span>Private executive VIP channel</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                onClick={() => handleStripeUpgrade("founding_partner")}
                disabled={isRedirectingToStripe}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold h-11 rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5"
              >
                {isRedirectingToStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Join VIP Charter via Stripe ($2,899/yr) <ArrowRight className="h-3.5 w-3.5" />
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
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Custom</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <ul className="space-y-3 text-xs">
                {[
                  "Custom Unlimited Seats",
                  "Dedicated SLA Guarantee",
                  "Custom API Integrations",
                  "24/7 Dedicated Account Manager"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 mr-2.5 text-cyan-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button 
                onClick={() => {
                  window.location.href = `mailto:enterprise@filedcrews.com?subject=${encodeURIComponent('Enterprise AI Agent Plan Inquiry')}`;
                }}
                className="w-full bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                Contact Enterprise <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
