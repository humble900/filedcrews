import PublicPageLayout from "@/components/PublicPageLayout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, MapPin, ShieldCheck, Clock } from "lucide-react";

const steps = [
  {
    icon: Monitor,
    title: "1. Companies Set Up on the Dashboard",
    description:
      "A company administrator creates an account on the FiledCrews website. From the dashboard, they register staff members, define geofenced work sites, and configure tracking and verification settings.",
  },
  {
    icon: Smartphone,
    title: "2. Staff Sign In on the Mobile App",
    description:
      "Each staff member receives credentials from their administrator and signs in on the FiledCrews mobile app installed on their phone.",
  },
  {
    icon: MapPin,
    title: "3. Live Tracking During Work",
    description:
      "When staff start their work session, the app shares their live GPS location with the company dashboard. Tracking runs only during active work sessions and stops when the session ends.",
  },
  {
    icon: Clock,
    title: "4. Supervisors Monitor in Real Time",
    description:
      "Supervisors and administrators view staff locations, geofence entries/exits, attendance records, and shift activity on the dashboard in real time.",
  },
  {
    icon: ShieldCheck,
    title: "5. Optional Face Verification",
    description:
      "For enhanced site compliance, administrators can request face verification checks. When triggered, the staff member takes a selfie through the app, which is compared to their profile photo to confirm identity.",
  },
];

export default function About() {
  return (
    <PublicPageLayout>
      <SEO
        title="About FiledCrews"
        description="Learn how FiledCrews connects the mobile app for field staff with the admin dashboard for supervisors."
        path="/about"
      />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">How FiledCrews Works</h1>
          <p className="mt-2 text-muted-foreground text-lg">
            A simple two-part system for real-time workforce tracking and management.
          </p>
        </div>

        {/* Two-part overview */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                Mobile App — For Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground/90 text-sm">
              The FiledCrews mobile app is installed on staff members' phones. Staff sign in with credentials
              provided by their company, start live location sharing during work hours, and respond to optional
              face verification requests. The app is distributed to authorized staff through official channels.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                Admin Dashboard — For Supervisors
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground/90 text-sm">
              The FiledCrews web dashboard is used by company administrators and supervisors. From the
              dashboard, they manage staff accounts, define geofenced work sites, monitor live locations on a
              map, review attendance and shift data, and manage face verification settings.
            </CardContent>
          </Card>
        </div>

        {/* Step-by-step */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Step by Step</h2>
          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title}>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="rounded-lg bg-accent p-2.5 shrink-0">
                      <Icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-foreground/80 mt-1">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
