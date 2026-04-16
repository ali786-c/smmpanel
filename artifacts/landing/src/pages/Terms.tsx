import { Link } from "react-router-dom";
import { Rocket, ArrowLeft } from "lucide-react";

export default function Terms() {
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
        <h1 className="text-3xl font-heading font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-4">Last updated: April 14, 2026</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground text-sm mb-4">By accessing or using emazingSM ("the Platform"), you agree to be bound by these Terms. If you do not agree, do not use our services.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">2. Service Description</h2>
        <p className="text-muted-foreground text-sm mb-4">emazingSM is a social media marketing technology platform that provides campaign management, audience growth tools, and content promotion services. Our platform facilitates marketing campaigns across various social media channels. We act as a technology provider and marketing automation platform — results may vary depending on campaign parameters, target audience, and platform algorithms.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">3. Account Registration</h2>
        <p className="text-muted-foreground text-sm mb-4">You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">4. Acceptable Use</h2>
        <p className="text-muted-foreground text-sm mb-4">You agree to use emazingSM solely for lawful marketing purposes. You are responsible for ensuring your campaigns comply with the terms of service of the respective social media platforms. emazingSM does not guarantee or endorse any particular outcome from campaign usage. Users must not use the platform for spam, harassment, impersonation, or any activity that violates applicable laws.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">5. Payments & Billing</h2>
        <p className="text-muted-foreground text-sm mb-4">All payments are processed through secure, PCI-compliant third-party payment processors. Funds added to your account balance are used to purchase marketing campaigns on the platform. All prices are displayed in USD unless otherwise specified. You agree to provide valid and complete payment information.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">6. No Refund Policy</h2>
        <p className="text-muted-foreground text-sm mb-4">
          <strong>All sales are final.</strong> Due to the digital and instant nature of our services, all purchases are non-refundable. Once funds are added to your account or a campaign is placed, no refunds, returns, or chargebacks will be issued under any circumstances.
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          Our services are delivered digitally and begin processing immediately upon order placement. Unlike physical goods, digital services cannot be "returned." By adding funds or placing an order, you acknowledge and agree to this no-refund policy.
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          <strong>Partial Delivery:</strong> In rare cases where a campaign is only partially delivered due to technical issues on our end, the undelivered portion may be credited back to your account balance at our sole discretion. This is not a refund — it is an internal credit.
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          <strong>Chargebacks:</strong> Filing a chargeback or payment dispute without contacting support will result in immediate and permanent account suspension. All evidence of service delivery will be submitted to the payment processor.
        </p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">7. Intellectual Property</h2>
        <p className="text-muted-foreground text-sm mb-4">All content, branding, and technology on the platform are owned by emazingSM. You retain ownership of your content and data. By using our services, you grant us a limited license to process your campaign data as necessary to deliver the services.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
        <p className="text-muted-foreground text-sm mb-4">emazingSM is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to changes in social media platform algorithms or policies. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">9. Termination</h2>
        <p className="text-muted-foreground text-sm mb-4">We reserve the right to terminate or suspend accounts that violate these terms. Upon termination, your right to use the service ceases immediately. Any remaining account balance from paid deposits (excluding bonuses) may be refunded upon written request within 30 days of termination.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">10. Governing Law</h2>
        <p className="text-muted-foreground text-sm mb-4">These terms are governed by applicable law. Any disputes arising from these terms shall be resolved through arbitration or in the courts of the applicable jurisdiction.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">11. Changes to Terms</h2>
        <p className="text-muted-foreground text-sm mb-4">We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. Material changes will be communicated via email or platform notification.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">12. Contact Information</h2>
        <p className="text-muted-foreground text-sm mb-4">
          <strong>emazingSM</strong><br />
          Email: support@emazingsm.com<br />
          Data Protection Officer: privacy@emazingsm.com<br />
          Business Address: 1309 Coffeen Avenue STE 1200, Sheridan, WY 82801, United States<br />
          Operating since 2018
        </p>
      </div>
    </div>
  );
}
