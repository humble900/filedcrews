import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Clock, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import appListing from "@/assets/play-store-app-listing.jpeg";

const TrackerDownload = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const downloadUrl = `${window.location.origin}/downloads/Ocrem.apk`;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    toast.success("Download link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 sm:py-8 max-w-xl mx-auto w-full">
      <Card className="w-full text-center">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">Get the OnSite Crew Manager App</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Install the application package directly onto your Android device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 px-4 sm:px-6">
          {/* Direct download & copy action row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <a href="/downloads/Ocrem.apk" download className="flex-1">
              <Button className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" />
                Download Android APK
              </Button>
            </a>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="gap-2 border-border/80 hover:bg-muted/50"
              size="lg"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted rounded-full px-4 py-1.5">
            <Clock className="h-3.5 w-3.5" /> Direct Download (No Play Store Required)
          </span>

          {/* Search instructions */}
          <div className="w-full rounded-lg border border-border bg-muted/50 p-4 sm:p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span>How to install the APK</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Once downloaded, tap the file in your notification bar or downloads folder, and allow installation from your browser.
              The mobile application setup will look like this:
            </p>
            <div className="rounded-md border border-border bg-background p-2 sm:p-3">
              <img
                src={appListing}
                alt="OnSite Crew Manager app listing preview"
                className="w-full h-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackerDownload;
