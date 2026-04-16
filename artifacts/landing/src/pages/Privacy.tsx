import { Link } from "react-router-dom";
import { Rocket, ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="glass-strong border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            <span className="text-xl font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>
      <div className="container px-4 mx-auto py-12 max-w-3xl prose prose-invert">
        <h1 className="text-3xl font-heading font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-4">Last updated: April 14, 2026</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">1. Data Controller</h2>
        <p className="text-muted-foreground text-sm mb-4">
          emazingSM ("we", "us", "our") is the data controller responsible for your personal data.<br />
          <strong>Business Address:</strong> 1309 Coffeen Avenue STE 1200, Sheridan, WY 82801, United States<br />
          <strong>Data Protection Officer:</strong> privacy@emazingsm.com<br />
          <strong>General Support:</strong> support@emazingsm.com
        </p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">2. Information We Collect</h2>
        <p className="text-muted-foreground text-sm mb-4">We collect information you provide directly: email address, name, phone number, and payment information. We also collect usage data including IP address, browser type, pages visited, and interaction data through essential cookies.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">3. Legal Basis for Processing (GDPR)</h2>
        <p className="text-muted-foreground text-sm mb-4">We process your data under the following legal bases:</p>
        <ul className="text-muted-foreground text-sm mb-4 list-disc pl-6 space-y-1">
          <li><strong>Contract:</strong> To provide and maintain our services and process transactions.</li>
          <li><strong>Legitimate Interest:</strong> To improve our platform and prevent fraud.</li>
          <li><strong>Consent:</strong> For analytics cookies and promotional communications (which you can withdraw at any time).</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations.</li>
        </ul>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">4. How We Use Your Information</h2>
        <p className="text-muted-foreground text-sm mb-4">We use your information to: provide and maintain our services, process transactions, send service-related communications, improve our platform, prevent fraud, and comply with legal obligations.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">5. Data Retention</h2>
        <p className="text-muted-foreground text-sm mb-4">We retain your personal data for as long as your account is active or as needed to provide services. Transaction records are retained for 7 years for legal and tax compliance. You can request deletion of your account and data at any time through the Account Management section in your dashboard.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">6. Data Security</h2>
        <p className="text-muted-foreground text-sm mb-4">We implement industry-standard security measures including 256-bit TLS encryption, secure data storage, access controls, and regular security audits to protect your information.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">7. Your Rights (GDPR & CCPA)</h2>
        <p className="text-muted-foreground text-sm mb-4">You have the following rights regarding your personal data:</p>
        <ul className="text-muted-foreground text-sm mb-4 list-disc pl-6 space-y-1">
          <li><strong>Access:</strong> Request a copy of your personal data (available via Dashboard → Account → Export Data).</li>
          <li><strong>Rectification:</strong> Correct inaccurate personal data via your profile settings.</li>
          <li><strong>Erasure:</strong> Request permanent deletion of your account and all associated data.</li>
          <li><strong>Restriction:</strong> Request that we limit processing of your data.</li>
          <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format (JSON export).</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent for analytics cookies at any time.</li>
        </ul>
        <p className="text-muted-foreground text-sm mb-4">To exercise any of these rights, contact our Data Protection Officer at <strong>privacy@emazingsm.com</strong>. We will respond within 30 days.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">8. Cookies</h2>
        <p className="text-muted-foreground text-sm mb-4">We use essential cookies for authentication and session management (always active). Analytics cookies are only activated with your explicit consent. You can manage cookie preferences at any time through the cookie banner or by clearing your browser cookies.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">9. Third-Party Services</h2>
        <p className="text-muted-foreground text-sm mb-4">We use third-party payment processors (PCI DSS compliant) and, with your consent, analytics services. These services have their own privacy policies governing their use of your data. We do not sell your personal data to third parties.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">10. International Data Transfers</h2>
        <p className="text-muted-foreground text-sm mb-4">Your data may be processed in countries outside the EEA. We ensure appropriate safeguards (Standard Contractual Clauses) are in place for all international transfers in compliance with GDPR.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">11. Children's Privacy</h2>
        <p className="text-muted-foreground text-sm mb-4">Our services are not directed to individuals under the age of 16. We do not knowingly collect personal data from children.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">12. Changes to This Policy</h2>
        <p className="text-muted-foreground text-sm mb-4">We may update this privacy policy from time to time. Material changes will be communicated via email or platform notification. Continued use constitutes acceptance of the updated policy.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">13. Contact & Complaints</h2>
        <p className="text-muted-foreground text-sm mb-4">
          For any privacy-related questions or complaints:<br />
          <strong>Data Protection Officer:</strong> privacy@emazingsm.com<br />
          <strong>General Support:</strong> support@emazingsm.com<br />
          <strong>Address:</strong> 1309 Coffeen Avenue STE 1200, Sheridan, WY 82801, United States<br /><br />
          If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection supervisory authority.
        </p>
      </div>
    </div>
  );
}
