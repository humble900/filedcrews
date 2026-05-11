import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Search } from "lucide-react";
import appListing from "@/assets/play-store-app-listing.jpeg";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.livestafftracker.stafftracker";

const TrackerDownload = () => {
  return (
    <div className="flex flex-col items-center gap-6 py-8 max-w-xl mx-auto">
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Get the Live Staff Tracker App</CardTitle>
          <CardDescription className="text-base">
            The tracker app is now available on the Google Play Store.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* Google Play badge */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-105"
            aria-label="Get it on Google Play"
          >
            <img
              alt="Get it on Google Play"
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              className="h-16 w-auto"
            />
          </a>

          {/* Search instructions */}
          <div className="w-full rounded-lg border border-border bg-muted/50 p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Search className="h-5 w-5 text-primary" />
              <span>How to find it on the Play Store</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open the Google Play Store and search for{" "}
              <strong className="text-foreground">"Live Staff Tracking"</strong>.
              Make sure you install the right app — it should look exactly like this:
            </p>
            <div className="rounded-md border border-border bg-background p-3">
              <img
                src={appListing}
                alt="Live Staff Tracker app listing on the Google Play Store"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>

          {/* Direct link button */}
          <div className="w-full space-y-2">
            <p className="text-sm text-muted-foreground">Or click the button below to open it directly:</p>
            <Button asChild className="w-full" size="lg">
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Or click here to open the app on Google Play
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackerDownload;
