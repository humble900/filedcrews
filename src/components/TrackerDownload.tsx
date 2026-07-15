import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Info, ChevronDown, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const TrackerDownload = () => {
  const [activeGuide, setActiveGuide] = useState<"android" | "ios">("android");
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const portalUrl = `${window.location.origin}/auth`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success("Portal link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 sm:py-8 max-w-xl mx-auto w-full">
      <Card className="w-full bg-[#0c121f] border-[#233558] text-slate-100">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">Install OnSite Crew Manager</CardTitle>
          <CardDescription className="text-sm text-slate-400 mt-1">
            This platform is optimized to run as a Progressive Web App (PWA) directly on any smartphone with zero store downloads required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <div className="bg-[#10192e] border border-blue-900/50 rounded-lg p-3.5 flex gap-2.5 text-xs text-slate-300">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">PWA Recommended Installation</span>
              PWAs install instantly on your home screen, support full-screen launching without browser bars, and update automatically.
            </div>
          </div>

          <Tabs value={activeGuide} onValueChange={(val) => setActiveGuide(val as any)} className="w-full">
            <TabsList className="grid grid-cols-2 bg-[#080d1a] border border-[#233558] rounded-md p-1 h-10">
              <TabsTrigger
                value="android"
                className="text-xs font-semibold data-[state=active]:bg-[#172544] data-[state=active]:text-white text-slate-400 transition-all rounded"
              >
                Android (Chrome)
              </TabsTrigger>
              <TabsTrigger
                value="ios"
                className="text-xs font-semibold data-[state=active]:bg-[#172544] data-[state=active]:text-white text-slate-400 transition-all rounded"
              >
                iPhone (Safari)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="android" className="space-y-4 pt-4">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Installation Steps</p>
                {[
                  "Open Google Chrome on your phone and navigate to this website.",
                  "Tap the three dots menu icon (⋮) in the top-right corner of Chrome.",
                  "Select 'Install App' or 'Add to Home screen' from the menu options.",
                  "Follow the prompt and click 'Add' to place it on your home screen.",
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-xs sm:text-sm">
                    <div className="h-6 w-6 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-slate-300 pt-0.5 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ios" className="space-y-4 pt-4">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Installation Steps</p>
                {[
                  "Open Safari on your iPhone and navigate to this website.",
                  "Tap the Share button at the bottom center of the screen (a box with an arrow pointing up).",
                  "Scroll down the menu list and tap 'Add to Home Screen'.",
                  "Give the shortcut a name (e.g. 'OnSite Crew') and tap 'Add' in the top-right corner.",
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-xs sm:text-sm">
                    <div className="h-6 w-6 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-slate-300 pt-0.5 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t border-[#233558]/40 pt-5 mt-4 flex flex-col items-center gap-5">
            {/* QR Code Section */}
            <div className="flex flex-col items-center gap-2.5 p-4 bg-[#080d1a] border border-[#233558]/60 rounded-xl w-full">
              <div className="bg-white p-2.5 rounded-lg flex items-center justify-center">
                <QRCodeSVG
                  value={`${window.location.origin}/auth`}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#0c121f"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Scan with your phone's camera to install instantly
              </p>
            </div>

            {/* Link Copy Box */}
            <div className="w-full space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Share Application Link
              </Label>
              <div className="flex gap-2">
                <div className="bg-[#080d1a] border border-[#233558] rounded-md px-3 flex items-center flex-1 h-10 select-all overflow-x-auto whitespace-nowrap text-xs text-slate-300 font-mono scrollbar-none">
                  {`${window.location.origin}/auth`}
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 shrink-0 transition-all rounded-md flex items-center gap-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">
                Send this link to crew members so they can sign in and run the portal app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackerDownload;
