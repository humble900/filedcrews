import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Search } from "lucide-react";
import appListing from "@/assets/play-store-app-listing.jpeg";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.livestafftracker.stafftracker";

const TrackerDownload = () => {
  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 sm:py-8 max-w-xl mx-auto w-full">
      <Card className="w-full text-center">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">Get the Live Staff Tracker App</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Now available on the Google Play Store.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 px-4 sm:px-6">
          {/* Search instructions */}
          <div className="w-full rounded-lg border border-border bg-muted/50 p-4 sm:p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span>How to find it</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open the Play Store and search for{" "}
              <strong className="text-foreground">"Live Staff Tracking"</strong>.
              Make sure the app looks like this:
            </p>
            <div className="rounded-md border border-border bg-background p-2 sm:p-3">
              <img
                src={appListing}
                alt="Live Staff Tracker app listing on the Google Play Store"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Direct link button */}
          <Button asChild className="w-full" size="lg">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open on Google Play
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackerDownload;
