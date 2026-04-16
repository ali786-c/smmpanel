import { Link } from "react-router-dom";
import { Rocket, ArrowLeft, ShieldAlert } from "lucide-react";

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

      {/* Prominent no-refund banner at top of Terms */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3 px-4">
        <div className="container mx-auto max-w-3xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Important:</strong> All wallet top-ups and service purchases are final and non-refundable. Digital services begin processing immediately upon order placement and cannot be reversed. By using this platform you agree to this policy.
          </p>
        </div>
      </div>

      <div className="container px-4 mx-auto py-12 max-w-3xl prose prose-invert">
        <h1 className="text-3xl font-heading font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-4">Last updated: April 16, 2026</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground text-sm mb-4">By accessing, registering on, or using emazingSM ("the Platform"), you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you must not access or use the Platform. Your continued use constitutes ongoing acceptance. These Terms include our No-Refund Policy (Section 6), which you explicitly acknowledge and accept by making any payment or deposit.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">2. Service Description</h2>
        <p className="text-muted-foreground text-sm mb-4">emazingSM is a social media marketing technology platform that provides campaign management, audience growth tools, and content promotion services. Our platform facilitates marketing campaigns across various social media channels. We act as a technology provider and marketing automation platform — results may vary depending on campaign parameters, target audience, and platform algorithms.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">3. Account Registration</h2>
        <p className="text-muted-foreground text-sm mb-4">You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use. We reserve the right to refuse service or terminate accounts at our sole discretion.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">4. Acceptable Use</h2>
        <p className="text-muted-foreground text-sm mb-4">You agree to use emazingSM solely for lawful marketing purposes. You are responsible for ensuring your campaigns comply with the terms of service of the respective social media platforms. emazingSM does not guarantee any particular outcome from campaign usage. Users must not use the platform for spam, harassment, impersonation, or any activity that violates applicable laws or regulations.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">5. Payments & Billing</h2>
        <p className="text-muted-foreground text-sm mb-4">We accept payments via Stripe (credit/debit card), PayPal, and cryptocurrency (Bitcoin, Ethereum, USDT, and others as listed on the platform). All payments are processed through secure, PCI-compliant payment processors. Funds added to your account wallet are used to purchase marketing services on the platform. All prices are displayed in USD unless otherwise specified.</p>
        <p className="text-muted-foreground text-sm mb-4">By initiating any payment or clicking any "Add Funds," "Deposit," or equivalent button, you confirm that you have read, understood, and agreed to these Terms — including the No-Refund Policy in Section 6 — and that your agreement is recorded with timestamp and IP address for compliance and dispute-resolution purposes.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">6. No-Refund Policy — All Sales Final</h2>
        <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-foreground mb-2">⚠️ Please read this section carefully before making any payment.</p>
          <p className="text-muted-foreground text-sm">All wallet deposits and service purchases are <strong>strictly non-refundable</strong>. By depositing funds or placing any order, you explicitly and irrevocably accept this policy.</p>
        </div>
        <p className="text-muted-foreground text-sm mb-4"><strong>Digital nature of services:</strong> Our services are entirely digital in nature. Upon placing an order or adding funds to your wallet, the fulfillment process begins immediately and automatically. Digital services, once initiated, cannot be "returned," "un-delivered," or reversed. This is the fundamental nature of digital and instant-delivery services, which is why all transactions are final.</p>
        <p className="text-muted-foreground text-sm mb-4"><strong>Wallet top-ups:</strong> Funds added to your account balance are non-refundable under any circumstances, including but not limited to: change of mind, dissatisfaction with results, account suspension due to violations of these Terms, or service interruptions caused by third-party social media platform policy changes.</p>
        <p className="text-muted-foreground text-sm mb-4"><strong>Partial delivery:</strong> In the rare event that a service is only partially delivered due to a confirmed technical failure on our end, the undelivered portion may, at our sole discretion, be credited to your account as internal platform credit. This is not a monetary refund — it is an account credit applicable to future orders only.</p>
        <p className="text-muted-foreground text-sm mb-4"><strong>Chargebacks and payment disputes:</strong> Filing a chargeback, payment reversal, or dispute with your bank or payment provider — without first contacting our support team and allowing us a reasonable period to resolve the issue — is a material breach of these Terms. In such cases:</p>
        <ul className="text-muted-foreground text-sm mb-4 list-disc pl-5 space-y-1">
          <li>Your account will be immediately and permanently suspended.</li>
          <li>All evidence of service delivery, including order logs, delivery reports, IP records, timestamps, and your explicit TOS acceptance record, will be submitted to the payment processor and/or your issuing bank to contest the dispute.</li>
          <li>You may be held liable for any fees or costs we incur as a result of the chargeback.</li>
        </ul>
        <p className="text-muted-foreground text-sm mb-4"><strong>No exceptions:</strong> We do not make exceptions to this policy. If you are uncertain about a purchase, we strongly encourage you to contact our support team before adding funds. Our team is available to assist with any questions before you commit to a payment.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">7. Intellectual Property</h2>
        <p className="text-muted-foreground text-sm mb-4">All content, branding, and technology on the platform are owned by emazingSM. You retain ownership of your content and data. By using our services, you grant us a limited license to process your campaign data as necessary to deliver the services.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
        <p className="text-muted-foreground text-sm mb-4">emazingSM is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to changes in social media platform algorithms or policies. Our total liability shall not exceed the amount paid by you in the 30 days preceding the claim.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">9. Termination</h2>
        <p className="text-muted-foreground text-sm mb-4">We reserve the right to terminate or suspend accounts that violate these Terms at our sole discretion and without prior notice. Upon termination, your right to use the service ceases immediately. Any remaining wallet balance is forfeited in cases of termination due to violations of these Terms. No refunds or transfers will be issued upon account closure for any reason.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">10. Governing Law</h2>
        <p className="text-muted-foreground text-sm mb-4">These Terms are governed by applicable law. Any disputes shall first be submitted to binding arbitration before any court action may be initiated. You agree that by accepting these Terms, you waive the right to participate in any class-action lawsuit or class-wide arbitration relating to our services.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">11. Changes to Terms</h2>
        <p className="text-muted-foreground text-sm mb-4">We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms. Material changes will be communicated via email or platform notification. The "Last updated" date at the top of this page always reflects the most recent revision.</p>

        <h2 className="text-xl font-heading font-semibold mt-8 mb-3">12. Contact Information</h2>
        <p className="text-muted-foreground text-sm mb-4">
          If you have questions about these Terms or our No-Refund Policy, please contact our support team <strong>before</strong> making any payment.<br /><br />
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
