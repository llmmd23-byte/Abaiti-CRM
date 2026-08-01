import StaticAffiliateLeadForm from "@/components/StaticAffiliateLeadForm";
import {Link} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {setRequestLocale} from "next-intl/server";
import Image from "next/image";
import {notFound} from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;

const staticAffiliateUsernames = ["abdullah", "abdullah-partner", "demo-partner"] as const;
const reservedRoutes = new Set(["dashboard", "api", "_next"]);

export function generateStaticParams() {
  return staticAffiliateUsernames.map((affiliateUsername) => ({affiliateUsername}));
}

function formatAffiliateName(username: string) {
  return username
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AffiliateLandingPage({
  params
}: {
  params: Promise<{affiliateUsername: string; locale: string}>;
}) {
  const {affiliateUsername, locale} = await params;
  setRequestLocale(locale);

  if (reservedRoutes.has(affiliateUsername)) {
    notFound();
  }

  const affiliateName = formatAffiliateName(affiliateUsername);

  return <AffiliatePageContent affiliateName={affiliateName} affiliateUsername={affiliateUsername} />;
}

function AffiliatePageContent({
  affiliateName,
  affiliateUsername
}: {
  affiliateName: string;
  affiliateUsername: string;
}) {
  const t = useTranslations();
  const affiliateId = `aff_${affiliateUsername.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={t("brand.home")}>
          <Image
            className="brand-logo"
            src="/middar-logo-eng.png"
            alt={`${t("brand.name")} logo`}
            width={747}
            height={211}
            priority
            unoptimized
          />
        </Link>
        <nav className="nav-links" aria-label={t("nav.label")}>
          <Link href="/">{t("affiliatePage.navPlatform")}</Link>
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
        </nav>
      </header>

      <main>
        <section className="hero affiliate-hero">
          <div className="hero-content">
            <p className="eyebrow">{t("affiliatePage.eyebrow", {affiliateName})}</p>
            <h1>{t("affiliatePage.title")}</h1>
            <p className="hero-copy">{t("affiliatePage.copy")}</p>
            <div className="trust-row" aria-label={t("trust.label")}>
              <span>{t("trust.crm")}</span>
              <span>{t("trust.payments")}</span>
              <span>{t("trust.payouts")}</span>
            </div>
          </div>

          <aside className="lead-panel affiliate-lead-panel">
            <div className="panel-heading">
              <span className="status-dot" />
              <span>{t("affiliatePage.formTag", {affiliateName})}</span>
            </div>
            <h2>{t("affiliatePage.formTitle")}</h2>
            <StaticAffiliateLeadForm
              affiliateId={affiliateId}
              affiliateName={affiliateName}
              affiliateUsername={affiliateUsername}
            />
          </aside>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">{t("affiliatePage.specsEyebrow")}</p>
            <h2>{t("affiliatePage.specsTitle")}</h2>
          </div>
          <div className="feature-grid">
            {[1, 2, 3, 4].map((item) => (
              <article key={item}>
                <span className="icon">0{item}</span>
                <h3>{t(`affiliatePage.spec${item}.title`)}</h3>
                <p>{t(`affiliatePage.spec${item}.copy`)}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
