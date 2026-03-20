import PublicPageLayout from "@/components/PublicPageLayout";
import SEO from "@/components/SEO";

const EFFECTIVE_DATE = "March 20, 2026";
const CONTACT_EMAIL = "eusoulegal6@gmail.com";
const WEBSITE_URL = "https://livestafftracker.com";

export default function PrivacyPolicy() {
  return (
    <PublicPageLayout>
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Live Staff Tracker — mobile app and admin dashboard."
        path="/privacy"
      />
      <article className="prose prose-sm sm:prose max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Effective date: {EFFECTIVE_DATE}</p>
        <p>
          This Privacy Policy describes how Live Staff Tracker ("we", "us", or "our") collects, uses, and shares information
          in connection with the <strong>Staff Tracker mobile application</strong> (the "App") and the
          <strong> Staff Tracker admin dashboard</strong> (the "Dashboard"), collectively the "Service," accessible at{" "}
          <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer">{WEBSITE_URL}</a>.
        </p>

        <h2>1. What the Service Does</h2>
        <p>
          The Service provides workforce location tracking and management tools. Companies and their authorized
          administrators use the Dashboard to manage staff accounts, set up geofenced work sites, and monitor
          staff location and attendance. Staff members use the mobile App to sign in, start and stop live
          location tracking during active work sessions, and complete optional face verification checks when
          requested by their employer.
        </p>

        <h2>2. Information We Collect</h2>

        <h3>2.1 Account Information</h3>
        <p>
          When a company administrator creates an account or registers staff, we collect names, email addresses,
          usernames, and company identifiers. Staff may also have profile photos uploaded by their administrator.
        </p>

        <h3>2.2 Authentication Data</h3>
        <p>
          We collect login credentials (email and password) processed through our authentication system. Passwords
          are securely hashed and never stored in plain text.
        </p>

        <h3>2.3 Precise and Background Location Data</h3>
        <p>
          When a staff member has the App active and location tracking is enabled, we collect precise GPS
          location data, including background location updates. <strong>Background location is used solely for
          workforce tracking functionality during active work/tracking sessions initiated by the staff user.</strong> It
          is not used for general consumer, social, or advertising-related tracking purposes. Location data
          includes latitude, longitude, and accuracy measurements.
        </p>

        <h3>2.4 Camera / Selfie Photos</h3>
        <p>
          When face verification is requested by an administrator for site compliance or workflow purposes, the
          App may capture selfie photos using the device camera. These photos are used to verify staff identity
          and are stored securely.
        </p>

        <h3>2.5 Push Notification Tokens and Device Identifiers</h3>
        <p>
          We collect push notification tokens (such as Expo push tokens) and device-related identifiers necessary
          to deliver notifications to staff devices when required by the Service.
        </p>

        <h3>2.6 Operational and Usage Data</h3>
        <p>
          We collect operational data related to the use of the Service, including geofence entry/exit events,
          check-in/check-out timestamps, shift records, and general usage activity.
        </p>

        <h2>3. How We Use the Data</h2>
        <ul>
          <li>To provide and operate the workforce tracking and management Service.</li>
          <li>To allow administrators to monitor staff location, attendance, and site compliance.</li>
          <li>To deliver push notifications related to work events or verification requests.</li>
          <li>To process face verification checks when requested.</li>
          <li>To maintain security, troubleshoot issues, and improve the Service.</li>
          <li>To comply with legal obligations.</li>
        </ul>

        <h2>4. How We Share the Data</h2>
        <ul>
          <li>
            <strong>With the Company/Administrators:</strong> Staff location, attendance, shift data, and
            verification results are shared with the authorized company administrators who manage those
            staff members through the Dashboard.
          </li>
          <li>
            <strong>Service Providers:</strong> We use third-party hosting and backend infrastructure
            providers (such as cloud hosting and database services) to operate the Service. These providers
            process data on our behalf under appropriate security measures.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose information if required by law, regulation,
            or legal process.
          </li>
        </ul>
        <p>We do not sell personal data to third parties.</p>

        <h2>5. Data Retention</h2>
        <p>
          We retain data for as long as necessary to provide the Service and fulfill the purposes described in
          this policy. Location history and operational data may be retained for a reasonable period to support
          business reporting and compliance needs. When an account is deleted, associated personal data will be
          removed in accordance with our deletion process, subject to any legal or operational retention
          requirements.
        </p>

        <h2>6. Security</h2>
        <p>
          We implement industry-standard security measures to protect data, including encrypted connections
          (HTTPS/TLS), secure authentication, and access controls. However, no system is completely secure, and
          we cannot guarantee absolute security of your data.
        </p>

        <h2>7. Your Rights and Data Deletion</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data at any time. To submit a
          deletion request, please visit our <a href="/account-deletion">Account Deletion</a> page or contact us
          directly. We will process your request in accordance with applicable laws.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our data practices, please contact us at:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <hr />
        <p className="text-sm text-muted-foreground">
          This Privacy Policy applies to the Staff Tracker mobile application and the Staff Tracker admin
          dashboard at <a href={WEBSITE_URL}>{WEBSITE_URL}</a>.
        </p>
      </article>
    </PublicPageLayout>
  );
}
