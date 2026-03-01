import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Check, ExternalLink, ShieldAlert, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const TRACKER_URL =
  "https://expo.dev/accounts/eusoulegal6/projects/gps-prototype/builds/5b2eb78d-df55-4269-933f-fc5ace9e3fef";

const TrackerDownload = () => {
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(TRACKER_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8 max-w-xl mx-auto">
      {/* Download Card */}
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle className="text-xl">Download Tracker App</CardTitle>
          <CardDescription>
            Scan the QR code or use the link below to install the GPS tracker on a phone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-xl inline-block">
            <QRCodeSVG value={TRACKER_URL} size={200} />
          </div>

          <div className="w-full flex gap-2">
            <div className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground text-left">
              {TRACKER_URL}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Button asChild variant="secondary" className="w-full">
            <a href={TRACKER_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Installation Notice */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <ShieldAlert className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-base font-semibold">
          Android Installation — Permission Required
        </AlertTitle>
        <AlertDescription className="mt-3 space-y-4 text-sm text-muted-foreground">
          <p>
            Because this app is installed directly (not from the Google Play Store), Android will ask you to allow installation from an <strong className="text-foreground">unknown source</strong>. This is completely normal and safe.
          </p>

          <div className="space-y-2 text-left">
            <p className="font-medium text-foreground">How to allow it:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Download the app using the link or QR code above.</li>
              <li>When prompted, tap <strong className="text-foreground">"Settings"</strong> on the warning popup.</li>
              <li>Toggle on <strong className="text-foreground">"Allow from this source"</strong> (or "Install unknown apps").</li>
              <li>Go back and tap <strong className="text-foreground">"Install"</strong> to complete the installation.</li>
            </ol>
          </div>

          <p className="text-xs">
            💡 The exact wording may vary slightly depending on your phone brand and Android version. If in doubt, watch the tutorial video below.
          </p>

          {/* Video toggle */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowVideo((v) => !v)}
            >
              <Play className="h-4 w-4" />
              {showVideo ? "Hide" : "Watch"} Video Tutorial
              {showVideo ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </Button>

            {showVideo && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border">
                <video
                  src="/videos/install-guide.mp4"
                  controls
                  className="w-full"
                  playsInline
                />
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TrackerDownload;
