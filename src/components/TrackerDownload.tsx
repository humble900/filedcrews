import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";

const TRACKER_URL =
  "https://expo.dev/accounts/eusoulegal6/projects/gps-prototype/builds/5b2eb78d-df55-4269-933f-fc5ace9e3fef";

const TrackerDownload = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(TRACKER_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
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
    </div>
  );
};

export default TrackerDownload;
