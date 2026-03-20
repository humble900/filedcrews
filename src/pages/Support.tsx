import PublicPageLayout from "@/components/PublicPageLayout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, HelpCircle, MapPin, Bell, Camera, LogIn } from "lucide-react";

const CONTACT_EMAIL = "eusoulegal6@gmail.com";

const faqItems = [
  {
    icon: LogIn,
    title: "Login Issues",
    content:
      "If you cannot sign in, make sure you are using the correct username and password provided by your company administrator. If you have forgotten your password, use the password reset option on the login screen. If the issue persists, contact your company administrator or reach out to us at the email below.",
  },
  {
    icon: MapPin,
    title: "Location Permissions",
    content:
      'For the tracker to work correctly, you must grant "Always Allow" (or "Allow all the time") location permission when the app requests it. If you selected a different option, go to your phone\'s Settings → Apps → Staff Tracker → Permissions → Location, and change it to "Allow all the time." Without this permission, background tracking will not function.',
  },
  {
    icon: Bell,
    title: "Push Notifications",
    content:
      "If you are not receiving notifications, ensure notifications are enabled for the Staff Tracker app in your device settings. Also check that your device is connected to the internet. If notifications are still not arriving, try signing out and signing back in to refresh your notification token.",
  },
  {
    icon: Camera,
    title: "Face Verification",
    content:
      "When your administrator requests face verification, make sure you are in a well-lit environment and position your face clearly in the camera frame. If verification fails repeatedly, try adjusting lighting conditions or contact your administrator to update your profile photo.",
  },
];

export default function Support() {
  return (
    <PublicPageLayout>
      <SEO
        title="Support"
        description="Get help with the Staff Tracker mobile app and admin dashboard."
        path="/support"
      />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support</h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Need help with Staff Tracker? Find answers below or contact us directly.
          </p>
        </div>

        {/* What is Staff Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What is Staff Tracker?</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-2">
            <p>
              Staff Tracker is a workforce location management service. It consists of a <strong>mobile app</strong> used
              by staff members to share their live location during work sessions, and an <strong>admin dashboard</strong>{" "}
              used by company supervisors to monitor attendance, manage geofenced work sites, and verify staff presence.
            </p>
            <p>
              If you are a <strong>staff member</strong>, your company administrator is your primary point of contact for
              account setup, work site questions, and day-to-day issues. For technical problems with the app itself, you
              can also reach us using the contact information below.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90">
            <p>
              For support inquiries, account issues, or any other questions, email us at:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 inline-block text-primary font-medium hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              We aim to respond within 1–2 business days.
            </p>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            Troubleshooting
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {faqItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-foreground/80">{item.content}</CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
