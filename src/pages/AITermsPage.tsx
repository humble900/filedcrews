import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Bot } from "lucide-react";

import AIKeyActivationModal from "@/components/AIKeyActivationModal";

export default function AITermsPage() {
  const { company, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    if (!authLoading && company) {
      if (
        company.subscription_tier !== "growth" &&
        company.subscription_tier !== "founding_partner" &&
        company.subscription_tier !== "Founding Partner" &&
        company.subscription_tier !== "enterprise"
      ) {
        navigate("/marketplace/ai-agent");
      } else if (company.ai_agent_enabled) {
        navigate("/ai-agent");
      }
    }
  }, [company, authLoading, navigate]);

  const handleAccept = () => {
    if (!company) return;
    setShowKeyModal(true);
  };

  if (authLoading || !company) {
    return (
      <DashboardLayout activeTab="marketplace">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="marketplace">
      <SEO title="AI Agent Terms of Use | FiledCrews" />

      <div className="mx-auto max-w-3xl px-4 py-8 pb-32">
        <div className="mb-8">
          <Link
            to="/marketplace/ai-agent"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Agent
          </Link>
        </div>

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
            FiledCrews AI Agent — Terms of Use
          </h1>
          <p className="text-sm text-slate-500">
            Effective Date: July 25, 2026 · Last Updated: July 25, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              1. Service Description
            </h2>
            <p>
              The FiledCrews AI Agent is an AI-powered operational assistant utilizing
              third-party Large Language Model (LLM) providers. It is designed to
              assist with scheduling, dispatch, invoicing, estimating, and other
              operational tasks within the FiledCrews platform. The AI Agent is NOT a
              replacement for human judgment, oversight, or decision-making.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              2. Third-Party AI Providers & API Keys
            </h2>
            <p>
              The AI Agent requires a Bring Your Own Key (BYOK) model. Users must
              provide their own API keys from supported LLM providers (e.g., OpenAI,
              Anthropic). All API usage costs incurred from these providers are the
              sole responsibility of the User. Users must comply with their chosen
              LLM provider's terms of service and acceptable use policies. API keys
              are stored securely and encrypted by FiledCrews.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              3. Accuracy & Reliability Disclaimer
            </h2>
            <p className="font-medium text-slate-900 uppercase">
              THE AI AGENT IS NOT PERFECT AND CAN MAKE MISTAKES. IT MAY ASSIGN
              TECHNICIANS INCORRECTLY, GENERATE WRONG INVOICES, MISINTERPRET
              INSTRUCTIONS, CREATE SCHEDULING CONFLICTS, OR MAKE INVENTORY ERRORS.
              THE USER IS SOLELY RESPONSIBLE FOR REVIEWING ALL AI OUTPUTS BEFORE
              ACTING UPON THEM.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              4. Limitation of Liability
            </h2>
            <p className="font-bold text-slate-900 uppercase">
              FILEDCREW SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM THE USE OF
              THE AI AGENT, INCLUDING BUT NOT LIMITED TO: FINANCIAL LOSSES, REVENUE
              LOSS, CUSTOMER DAMAGE, INVENTORY LOSSES, PAYROLL ISSUES, REGULATORY
              PENALTIES, REPUTATIONAL HARM, DATA LOSS, OR BUSINESS INTERRUPTION. IN NO
              EVENT SHALL FILEDCREW'S TOTAL LIABILITY EXCEED THE FEES PAID BY THE
              USER TO FILEDCREW IN THE PRIOR 12 MONTHS.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              5. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless FiledCrews, its officers,
              directors, employees, and agents from any and all claims, liabilities,
              damages, and expenses (including legal fees) arising from your use of
              the AI Agent, misuse, failure to review AI outputs, violations of LLM
              provider terms, or third-party claims related to the AI Agent's
              actions on your behalf.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              6. Data Processing & Privacy
            </h2>
            <p>
              By utilizing the AI Agent, you consent to the transmission of your
              company data (including customer information, scheduling details, and
              operational data) to the third-party LLM provider associated with your
              API key. You are solely responsible for ensuring your use of the AI
              Agent complies with applicable privacy regulations (such as GDPR or
              CCPA). FiledCrews does not use your operational data or API inputs to
              train proprietary or third-party AI models.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              7. Usage Restrictions
            </h2>
            <p>
              You agree not to use the AI Agent for fraudulent activities, illegal
              operations, circumventing local or federal regulations, or generating
              content that violates any laws.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              8. Availability & Support
            </h2>
            <p>
              The AI Agent is provided on an "as is" and "as available" basis.
              Performance is highly dependent on the availability and responsiveness
              of your chosen LLM provider. FiledCrews reserves the right to modify,
              suspend, or discontinue the AI Agent functionality at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              9. Termination
            </h2>
            <p>
              Users may deactivate the AI Agent at any time from their account
              settings. FiledCrews reserves the right to suspend or terminate your
              access to the AI Agent immediately if a violation of these terms is
              suspected. In the event of a subscription downgrade, your AI
              configuration will be preserved for 90 days before permanent deletion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              10. Amendments
            </h2>
            <p>
              FiledCrews may update these Terms of Use at any time. Continued use of
              the AI Agent after such modifications constitutes your acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              11. Governing Law
            </h2>
            <p>
              These Terms of Use and any disputes arising out of or related to the AI
              Agent shall be governed by and construed in accordance with the laws of
              the State of Texas, United States.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              12. Contact Information
            </h2>
            <p>
              If you have any questions regarding these terms, please contact us at:
              <br />
              Email: legal@filedcrews.com
              <br />
              WhatsApp: +1 (409) 422-9714
            </p>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)] lg:left-64">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <Label
              htmlFor="accept-terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the FiledCrews AI Agent Terms of Use
            </Label>
          </div>
          <Button
            size="lg"
            onClick={handleAccept}
            disabled={!accepted}
            className="w-full sm:w-auto font-bold shadow-md"
          >
            Accept & Activate AI Agent
          </Button>
        </div>
      </div>

      {company && (
        <AIKeyActivationModal
          open={showKeyModal}
          onOpenChange={setShowKeyModal}
          companyId={company.id}
          existingApiKey={company.ai_api_key}
          existingProvider={company.ai_provider}
          onSuccess={() => navigate("/ai-agent")}
        />
      )}
    </DashboardLayout>
  );
}
