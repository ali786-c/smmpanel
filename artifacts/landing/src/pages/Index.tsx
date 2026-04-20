import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  Zap, Shield, BarChart3, Clock, Globe, 
  ChevronRight, Star, ArrowRight, Rocket,
  Instagram, Youtube, Twitter, Facebook, Music, MessageCircle,
  ExternalLink, Send, MessageSquare, BookOpen, Headphones
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Helmet } from "react-helmet-async";
import LiveSocialProof from "@/components/landing/LiveSocialProof";
import LiveOrderFeed from "@/components/landing/LiveOrderFeed";
import TrustBadges from "@/components/landing/TrustBadges";
import SystemStatus from "@/components/landing/SystemStatus";
import StickyMobileCTA from "@/components/landing/StickyMobileCTA";
import ExitIntentPopup from "@/components/landing/ExitIntentPopup";
import FloatingChatWidget from "@/components/landing/FloatingChatWidget";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";

const isMaintenance = false; // Set to false to disable maintenance mode

const featureKeys = [
  { icon: Headphones, titleKey: "landing.features.smartCampaign", descKey: "landing.features.smartCampaignDesc" },
  { icon: Zap, titleKey: "landing.features.rapidLaunch", descKey: "landing.features.rapidLaunchDesc" },
  { icon: Shield, titleKey: "landing.features.qualityMonitor", descKey: "landing.features.qualityMonitorDesc" },
  { icon: BarChart3, titleKey: "landing.features.analytics", descKey: "landing.features.analyticsDesc" },
  { icon: Clock, titleKey: "landing.features.autoSupport", descKey: "landing.features.autoSupportDesc" },
  { icon: Globe, titleKey: "landing.features.payments", descKey: "landing.features.paymentsDesc" },
];

const platformKeys = [
  { icon: Instagram, nameKey: "landing.platformsList.instagram", servicesKey: "landing.platformsList.instagramServices" },
  { icon: Youtube, nameKey: "landing.platformsList.youtube", servicesKey: "landing.platformsList.youtubeServices" },
  { icon: Twitter, nameKey: "landing.platformsList.twitter", servicesKey: "landing.platformsList.twitterServices" },
  { icon: Facebook, nameKey: "landing.platformsList.facebook", servicesKey: "landing.platformsList.facebookServices" },
  { icon: Music, nameKey: "landing.platformsList.tiktok", servicesKey: "landing.platformsList.tiktokServices" },
  { icon: MessageCircle, nameKey: "landing.platformsList.telegram", servicesKey: "landing.platformsList.telegramServices" },
];

const stepKeys = [
  { step: "01", titleKey: "landing.steps.createAccount", descKey: "landing.steps.createAccountDesc" },
  { step: "02", titleKey: "landing.steps.fundAccount", descKey: "landing.steps.fundAccountDesc" },
  { step: "03", titleKey: "landing.steps.launchCampaign", descKey: "landing.steps.launchCampaignDesc" },
  { step: "04", titleKey: "landing.steps.trackResults", descKey: "landing.steps.trackResultsDesc" },
];

const testimonialKeys = [
  { name: "Alex K.", role: "Marketing Director", textKey: "landing.testimonials.t1" },
  { name: "Maria S.", role: "Agency CEO", textKey: "landing.testimonials.t2" },
  { name: "James T.", role: "Growth Manager", textKey: "landing.testimonials.t3" },
  { name: "Priya R.", role: "Content Strategist", textKey: "landing.testimonials.t4" },
  { name: "Hassan M.", role: "Agency Partner", textKey: "landing.testimonials.t5" },
  { name: "Sara L.", role: "Brand Manager", textKey: "landing.testimonials.t6" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "emazingSM",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://emazingsm.com",
  "description": "Social media marketing platform with rapid campaign delivery, autonomous support, and intelligent performance monitoring.",
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "2300", "bestRating": "5" },
  "featureList": ["Smart Campaign Manager", "Real-Time Analytics", "Multi-Platform Support", "Automated Campaign Support", "Crypto, PayPal, Stripe Payments", "Reseller API", "White-Label Option"]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is emazingSM?", "acceptedAnswer": { "@type": "Answer", "text": "emazingSM is a social media marketing platform that helps brands, agencies, and creators grow their audiences on Instagram, YouTube, TikTok, Twitter, Facebook, and Telegram through targeted campaigns and data-driven strategies." } },
    { "@type": "Question", "name": "Which social media platforms does emazingSM support?", "acceptedAnswer": { "@type": "Answer", "text": "emazingSM supports Instagram, YouTube, Twitter/X, Facebook, TikTok, and Telegram with hundreds of specialized marketing services for each platform." } },
    { "@type": "Question", "name": "What payment methods does emazingSM accept?", "acceptedAnswer": { "@type": "Answer", "text": "emazingSM accepts cryptocurrency, PayPal, Stripe credit/debit card payments, and bank transfers for adding campaign budgets." } },
    { "@type": "Question", "name": "Does emazingSM have an API for resellers?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, emazingSM provides a full reseller API on the Enterprise plan, allowing agencies to integrate campaign management into their own platforms with white-label options." } }
  ]
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "emazingSM",
  "url": "https://emazingsm.com",
  "logo": "https://emazingsm.com/logo.png",
  "sameAs": ["https://twitter.com/emazingsm", "https://instagram.com/emazingsm", "https://t.me/emazingsm"],
  "contactPoint": { "@type": "ContactPoint", "email": "support@emazingsm.com", "contactType": "customer support", "availableLanguage": "English" }
};

const trustedByNames = ["Growthify", "ScaleUp Media", "ViralReach", "Amplifyd", "SocialPulse"];

export default function Index() {
  const { t } = useTranslation();
  const [navScrolled, setNavScrolled] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      apiFetch(`/affiliates/track/${ref}`).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isMaintenance) {
    return <MaintenanceOverlay />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>emazingSM — #1 Social Media Marketing Platform | Grow Your Audience</title>
        <meta name="description" content="Social media marketing platform. Grow your Instagram, YouTube, TikTok, Twitter, Facebook & Telegram audiences with automated campaigns. Free to start. 99.9% uptime." />
        <meta name="keywords" content="emazingSM, social media marketing, Instagram growth, YouTube promotion, TikTok marketing, Twitter growth, Facebook marketing, Telegram growth, campaign automation, social media agency" />
        <link rel="canonical" href="https://emazingsm.com" />
        <meta property="og:title" content="emazingSM — #1 Social Media Marketing Platform" />
        <meta property="og:description" content="Grow your social media audiences with automated campaigns. Instagram, YouTube, TikTok, Twitter, Facebook & Telegram. Free to start." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://emazingsm.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="emazingSM — Social Media Marketing Platform" />
        <meta name="twitter:description" content="Grow your audiences with automated campaigns across all major social platforms." />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>

      {/* Navigation — glow on scroll */}
      <nav className={`fixed top-0 left-0 right-0 z-50 glass-strong transition-shadow duration-300 ${navScrolled ? "nav-glow" : ""}`} aria-label="Main navigation">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2" aria-label="emazingSM Home">
            <Rocket className="w-6 h-6 text-primary" />
            <span className="text-xl font-heading font-bold text-foreground">
              emazin<span className="text-primary">gSM</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("nav.features")}</a>
            <a href="#platforms" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("nav.platforms")}</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("nav.howItWorks")}</a>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("nav.blog")}</Link>
            <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("nav.reviews")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:block" />
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t("nav.login")}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground font-semibold">
                {t("nav.getStarted")} <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — with decorative orbs + integrated LiveOrderFeed */}
      <section className="relative pt-32 pb-20 overflow-hidden" aria-label="Hero">
        <div className="absolute inset-0 gradient-dark" />
        {/* Decorative orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="container relative px-4 mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left — Hero text (3 cols) */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <div className="flex flex-col items-center lg:items-start gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-primary">
                  <Zap className="w-3.5 h-3.5" />
                  {t("landing.badge")}
                </div>
                <SystemStatus />
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
                {t("landing.heroTitle1")}
                <br />
                <span className="text-primary">{t("landing.heroTitle2")}</span>
              </h1>
              
              <p className="max-w-2xl text-lg text-muted-foreground mb-8">
                {t("landing.heroSubtitle")}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gradient-primary text-primary-foreground font-semibold text-lg px-8">
                    {t("landing.launchCampaign")} <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 border-primary/30 hover:bg-primary/10">
                    {t("landing.viewDashboard")}
                  </Button>
                </Link>
              </div>

              <TrustBadges />
            </div>

            {/* Right — Live Order Feed (2 cols, desktop only as floating card) */}
            <div className="lg:col-span-2 hidden lg:block">
              <LiveOrderFeed />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto lg:mx-0">
            {[
              { value: "50ms", labelKey: "landing.avgResponse" },
              { value: "99.9%", labelKey: "landing.uptime" },
              { value: "24/7", labelKey: "landing.campaignSupport" },
              { value: "10K+", labelKey: "landing.campaignTemplates" },
            ].map((stat) => (
              <div key={stat.labelKey} className="glass rounded-xl p-4 text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>

          {/* Mobile LiveOrderFeed */}
          <div className="mt-8 lg:hidden">
            <LiveOrderFeed />
          </div>

          <div className="mt-8">
            <LiveSocialProof />
          </div>
        </div>
      </section>

      {/* Trusted By — agency names row */}
      <section className="py-8 border-b border-border section-alt" aria-label="Trusted by agencies">
        <div className="container px-4 mx-auto">
          <p className="text-xs text-muted-foreground text-center mb-4 font-heading uppercase tracking-widest">Trusted by 3,200+ agencies worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {trustedByNames.map((name) => (
              <span key={name} className="text-lg font-heading font-bold text-muted-foreground/40 select-none">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20" aria-label="Features">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("landing.builtFor")} <span className="text-primary">{t("landing.marketingAgencies")}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.builtForDesc")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((feature) => (
              <article key={feature.titleKey} className="glass rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms — alt background */}
      <section id="platforms" className="py-20 section-alt" aria-label="Supported platforms">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("landing.allPlatforms")} <span className="text-primary">{t("landing.platformsCovered")}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.platformsDesc")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformKeys.map((p) => (
              <article key={p.nameKey} className="glass rounded-2xl p-5 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold">{t(p.nameKey)}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{t(p.servicesKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — with step connectors */}
      <section id="how-it-works" className="py-20" aria-label="How it works">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("landing.howIt")} <span className="text-primary">{t("landing.works")}</span>
            </h2>
          </div>
          <ol className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto list-none p-0">
            {stepKeys.map((step) => (
              <li key={step.step} className="text-center step-connector">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 text-xl font-heading font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="font-heading font-semibold mb-1">{t(step.titleKey)}</h3>
                <p className="text-xs text-muted-foreground">{t(step.descKey)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Blog Preview — alt background + gradient header strips */}
      <section className="py-20 section-alt" aria-label="Blog articles">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("landing.marketing")} <span className="text-primary">{t("landing.insights")}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.insightsDesc")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "10 Proven Strategies to Grow Your Instagram Audience in 2026", category: "Instagram", readTime: "5" },
              { title: "Why Content Promotion is the Key to YouTube Success", category: "YouTube", readTime: "4" },
              { title: "TikTok Marketing: A Complete Guide for Agencies", category: "TikTok", readTime: "7" },
            ].map((post) => (
              <Link to="/blog" key={post.title} className="glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                {/* Gradient header strip */}
                <div className="h-28 gradient-primary opacity-70 group-hover:opacity-90 transition-opacity" />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{post.category}</span>
                    <span className="text-xs text-muted-foreground">{post.readTime} min {t("common.read")}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm mb-2">{post.title}</h3>
                  <span className="text-xs text-primary flex items-center gap-1">{t("landing.readMore")} <ArrowRight className="w-3 h-3" /></span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/blog">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                <BookOpen className="w-4 h-4 mr-2" /> {t("landing.viewAllArticles")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials — show top 3 on desktop */}
      <section id="reviews" className="py-20" aria-label="Customer reviews">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("landing.trustedBy")} <span className="text-primary">{t("landing.agenciesWorldwide")}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonialKeys.slice(0, 3).map((tItem) => (
              <blockquote key={tItem.name} className="glass rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="flex gap-1 mb-3" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">"{t(tItem.textKey)}"</p>
                <footer>
                  <cite className="text-sm font-semibold not-italic">{tItem.name}</cite>
                  <p className="text-xs text-muted-foreground">{tItem.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
          {/* Second row — staggered offset for visual interest */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-6">
            {testimonialKeys.slice(3, 6).map((tItem) => (
              <blockquote key={tItem.name} className="glass rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="flex gap-1 mb-3" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">"{t(tItem.textKey)}"</p>
                <footer>
                  <cite className="text-sm font-semibold not-italic">{tItem.name}</cite>
                  <p className="text-xs text-muted-foreground">{tItem.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — full-width gradient */}
      <section className="py-24 relative overflow-hidden" aria-label="Call to action">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="container px-4 mx-auto text-center relative">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
            {t("landing.readyTo")} <span className="text-primary">{t("landing.scaleMarketing")}</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
            {t("landing.ctaDesc")}
          </p>
          <Link to="/signup">
            <Button size="lg" className="gradient-primary text-primary-foreground font-semibold text-lg px-10 py-6 glow">
              {t("landing.startFreeCampaign")} <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div className="mt-6">
            <TrustBadges />
          </div>
        </div>
      </section>

      {/* Trustpilot Banner — green accent */}
      <section className="py-10 border-t border-border section-alt" aria-label="Trustpilot rating">
        <div className="container px-4 mx-auto">
          <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4" style={{ borderLeftColor: "hsl(var(--primary))" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1" aria-label="4.8 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <div>
                <p className="text-sm font-heading font-semibold">{t("landing.excellent")}</p>
                <p className="text-xs text-muted-foreground">{t("landing.basedOnReviews")}</p>
              </div>
            </div>
            <a href="https://trustpilot.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              {t("landing.readReviews")} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20" aria-label="Frequently asked questions">
        <div className="container px-4 mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("landing.faqTitle")} <span className="text-primary">{t("landing.questions")}</span>
            </h2>
          </div>
          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((faq, i) => (
              <details key={i} className="glass rounded-xl p-5 group">
                <summary className="font-heading font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                  {faq.name}
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.acceptedAnswer.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — brand fix */}
      <footer className="border-t border-border py-12">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {t("landing.footerDesc")}
              </p>
              <div className="flex items-center gap-3">
                <a href="https://t.me/emazingsm" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-primary/20 transition-colors" aria-label="Telegram">
                  <Send className="w-4 h-4 text-primary" />
                </a>
                <a href="https://discord.gg/emazingsm" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-primary/20 transition-colors" aria-label="Discord">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </a>
                <a href="https://instagram.com/emazingsm" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-primary/20 transition-colors" aria-label="Instagram">
                  <Instagram className="w-4 h-4 text-primary" />
                </a>
                <a href="https://twitter.com/emazingsm" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-primary/20 transition-colors" aria-label="Twitter">
                  <Twitter className="w-4 h-4 text-primary" />
                </a>
              </div>
            </div>
            <nav aria-label="Platform links">
              <h4 className="font-heading font-semibold text-sm mb-3">{t("nav.platform")}</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("nav.features")}</a></li>
                <li><a href="#how-it-works" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("nav.howItWorks")}</a></li>
                <li><Link to="/blog" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("nav.blog")}</Link></li>
                <li><Link to="/signup" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("landing.signUp")}</Link></li>
              </ul>
            </nav>
            <nav aria-label="Community links">
              <h4 className="font-heading font-semibold text-sm mb-3">{t("nav.community")}</h4>
              <ul className="space-y-2">
                <li><a href="https://t.me/emazingsm" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"><Send className="w-3 h-3" /> {t("landing.telegramChannel")}</a></li>
                <li><a href="https://discord.gg/emazingsm" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {t("landing.discordServer")}</a></li>
                <li><a href="https://trustpilot.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"><Star className="w-3 h-3" /> {t("landing.trustpilotReviews")}</a></li>
                <li><a href="mailto:support@emazingsm.com" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("landing.contactSupport")}</a></li>
              </ul>
            </nav>
            <nav aria-label="Legal links">
              <h4 className="font-heading font-semibold text-sm mb-3">{t("nav.legal")}</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("landing.privacyPolicy")}</Link></li>
                <li><Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("landing.termsOfService")}</Link></li>
                <li><span className="text-xs text-muted-foreground">{t("landing.gdprCompliant")}</span></li>
                <li><span className="text-xs text-muted-foreground">{t("landing.dmcaProtected")}</span></li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">{t("landing.copyright")}</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{t("landing.sslSecured")}</span>
              <span className="text-xs text-muted-foreground">{t("landing.gdpr")}</span>
              <span className="text-xs text-muted-foreground">{t("landing.uptimeBadge")}</span>
              <span className="text-xs text-muted-foreground">{t("landing.trustpilotBadge")}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Conversion Widgets */}
      <StickyMobileCTA />
      <ExitIntentPopup />
      <FloatingChatWidget />
    </div>
  );
}
