import PublicPageLayout from "@/components/PublicPageLayout";
import SEO from "@/components/SEO";

const EFFECTIVE_DATE = "March 20, 2026";
const CONTACT_EMAIL = "eusoulegal6@gmail.com";

export default function TermsOfService() {
  return (
    <PublicPageLayout>
      <SEO
        title="Terms of Service"
        description="Terms of Service for FiledCrews mobile app and admin dashboard."
        path="/terms"
      />
      <article className="prose prose-sm sm:prose max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Effective date: {EFFECTIVE_DATE}</p>
        <p>
          These Terms of Service ("Terms") govern your use of the FiledCrews mobile application and the
          FiledCrews admin dashboard (collectively, the "Service") provided by FiledCrews ("we",
          "us", or "our"). By accessing or using the Service, you agree to these Terms.
        </p>

        <h2>1. Nature of the Service</h2>
        <p>
          The Service is a business-to-business workforce management platform. Companies ("Customers") use the
          admin dashboard to manage staff accounts, configure work sites, and monitor workforce location and
          attendance. Staff members use the mobile application under the authority of their employer.
        </p>

        <h2>2. Account Responsibilities</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You agree to provide accurate and current information when creating or managing accounts.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
        </ul>

        <h2>3. Company/Administrator Responsibilities</h2>
        <p>
          Company administrators who create and manage staff accounts are responsible for:
        </p>
        <ul>
          <li>Obtaining appropriate consent from staff members before enabling location tracking.</li>
          <li>Ensuring that staff are informed about the nature and purpose of tracking.</li>
          <li>Using the Service in compliance with applicable labor, privacy, and data protection laws.</li>
          <li>Managing and deactivating staff accounts when employment ends or access is no longer needed.</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its systems.</li>
          <li>Interfere with or disrupt the Service or its infrastructure.</li>
          <li>Use the Service to track individuals without proper authorization or consent.</li>
          <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
        </ul>

        <h2>5. Service Availability</h2>
        <p>
          We strive to provide reliable and continuous service, but we do not guarantee that the Service will be
          available at all times without interruption. The Service may be subject to scheduled maintenance,
          updates, or unforeseen outages. We are not liable for any loss or damage resulting from service
          interruptions.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, or any loss of profits, data, or business opportunity
          arising out of or related to your use of the Service. Our total liability for any claim related to the
          Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
        </p>

        <h2>7. Termination and Suspension</h2>
        <p>
          We reserve the right to suspend or terminate your access to the Service at our discretion if we
          reasonably believe you have violated these Terms or if continued access poses a risk to the Service or
          other users. You may also stop using the Service at any time. Upon termination, your right to access the
          Service ceases, and we may delete your data in accordance with our Privacy Policy.
        </p>

        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we will notify users through
          the Service or by other reasonable means. Continued use of the Service after changes take effect
          constitutes acceptance of the updated Terms.
        </p>

        <h2>9. Contact</h2>
        <p>
          If you have questions about these Terms, please contact us at:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>
          For support, visit our <a href="/support">Support</a> page.
        </p>
      </article>
    </PublicPageLayout>
  );
}
