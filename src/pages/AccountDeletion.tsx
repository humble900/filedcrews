import PublicPageLayout from "@/components/PublicPageLayout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Mail } from "lucide-react";

const CONTACT_EMAIL = "eusoulegal6@gmail.com";

export default function AccountDeletion() {
  return (
    <PublicPageLayout>
      <SEO
        title="Account & Data Deletion"
        description="Request deletion of your FiledCrews account and associated data."
        path="/account-deletion"
      />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account & Data Deletion</h1>
          <p className="mt-2 text-muted-foreground text-lg">
            You have the right to request deletion of your account and personal data from FiledCrews.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-primary" />
              How to Request Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-4">
            <p>
              To request deletion of your account and associated data, please send an email to:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Account%20Deletion%20Request`}
              className="inline-block text-primary font-medium hover:underline"
            >
              {CONTACT_EMAIL}
            </a>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Please include the following in your request:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your full name as registered in the Service.</li>
                <li>The email address or username associated with your account.</li>
                <li>The name of your company (if applicable).</li>
                <li>Whether you are requesting deletion as a <strong>staff member</strong> or as a <strong>company administrator</strong>.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Happens After Your Request</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-3 text-sm">
            <p>
              Once we receive your request, we will verify your identity and process the deletion. You will
              receive a confirmation email when your account and data have been removed.
            </p>
            <p>
              <strong>For staff members:</strong> Your company administrator can also deactivate or remove your
              account through the admin dashboard. You may wish to contact your administrator directly for
              faster processing.
            </p>
            <p>
              <strong>For company administrators:</strong> Deleting a company account will remove all associated
              staff accounts and data managed under that company.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-3 text-sm">
            <p>
              Upon deletion, your personal data — including profile information, location history, and
              verification photos — will be permanently removed from our systems.
            </p>
            <p>
              In limited cases, some data may need to be retained for a reasonable period where required by law,
              regulation, or legitimate operational needs (such as maintaining audit records for compliance
              purposes). Any retained data will be kept securely and deleted when no longer required.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>
            Questions? Contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
          </span>
        </div>
      </div>
    </PublicPageLayout>
  );
}
