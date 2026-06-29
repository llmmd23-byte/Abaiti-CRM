import {getTranslations, setRequestLocale} from "next-intl/server";
import Image from "next/image";
import LandingPointerGlow from "@/components/LandingPointerGlow";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {Link} from "@/i18n/navigation";
import {registerAffiliate} from "@/app/actions";

export default async function HomePage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{registration?: string}>;
}) {
  const {locale} = await params;
  const {registration} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={t("brand.home")}>
          <Image
            className="brand-logo"
            src="/middar-logo-transparent-v2.png"
            alt={`${t("brand.name")} logo`}
            width={747}
            height={211}
            priority
            unoptimized
          />
        </Link>
        <div className="header-actions">
          <LanguageSwitcher />
          <Link className="button button-primary" href="/signin">
            {t("nav.dashboard")}
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <LandingPointerGlow />
        <section className="hero" id="landing">
          <div className="hero-content">
            <p className="eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="hero-partner-title">
              <span>{locale === "ar" ? "\u0643\u0646 \u0634\u0631\u064a\u0643\u0627\u064b \u0645\u0639 \u0645\u064a\u062f\u0627\u0631" : "Partner with Middar"}</span>
              <small>
                {locale === "ar"
                  ? "\u0639\u0645\u0644\u0627\u0621 \u0645\u0647\u062a\u0645\u064a\u0646\u060c \u0639\u0631\u0648\u0636 \u0623\u0633\u0639\u0627\u0631\u060c \u0645\u062f\u0641\u0648\u0639\u0627\u062a\u060c \u0648\u0639\u0645\u0648\u0644\u0627\u062a \u0645\u062a\u062a\u0628\u0639\u0629."
                  : "Interested leads, quotes, payments, and tracked commissions."}
              </small>
            </h1>
            <p className="hero-copy">{t("hero.copy")}</p>
            <div className="trust-row" aria-label={t("trust.label")}>
              <span>{t("trust.crm")}</span>
              <span>{t("trust.payments")}</span>
              <span>{t("trust.payouts")}</span>
            </div>
          </div>

          <aside className="lead-panel" id="demo" aria-label={t("form.aria")}>
            <div className="panel-heading">
              <span className="status-dot" />
              <span>{t("form.recommended")}</span>
            </div>
            <h2>{t("form.title")}</h2>
            <form action={registerAffiliate} className="demo-form">
              <input name="locale" type="hidden" value={locale} />
              <label>
                <span>{t("form.name")}</span>
                <input name="name" required type="text" placeholder={t("form.namePlaceholder")} />
              </label>
              <label>
                <span>{t("form.email")}</span>
                <input name="email" required type="email" placeholder="name@company.com" />
              </label>
              <label>
                <span>{t("form.phone")}</span>
                <input name="phone" type="tel" placeholder="+966 5X XXX XXXX" />
              </label>
              <label>
                <span>{t("form.password")}</span>
                <input minLength={6} name="password" required type="password" placeholder={t("form.passwordPlaceholder")} />
              </label>
              <label>
                <span>{t("form.confirmPassword")}</span>
                <input minLength={6} name="confirmPassword" required type="password" placeholder={t("form.confirmPasswordPlaceholder")} />
              </label>
              <button className="button button-form" type="submit">
                {t("form.submit")}
              </button>
              {registration === "pending" ? (
                <p className="registration-message success" role="status">
                  {locale === "ar"
                    ? "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645. \u0627\u0644\u062d\u0633\u0627\u0628 \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629."
                    : "Your join request was submitted. The account is pending approval."}
                </p>
              ) : null}
              <p>{t("form.note")}</p>
            </form>
          </aside>
        </section>

        <section className="section" id="features">
          <div className="section-heading">
            <p className="eyebrow">{t("features.eyebrow")}</p>
            <h2>{t("features.title")}</h2>
          </div>
          <div className="feature-grid">
            {[1, 2, 3, 4].map((item) => (
              <article key={item}>
                <span className="icon">0{item}</span>
                <h3>{t(`features.item${item}.title`)}</h3>
                <p>{t(`features.item${item}.copy`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-entry section" id="dashboard">
          <div className="section-heading">
            <p className="eyebrow">{t("dashboard.eyebrow")}</p>
            <h2>{t("dashboardPages.entry.title")}</h2>
          </div>
          <div className="dashboard-entry-grid">
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.overview")}</span>
              <strong>{t("dashboardPages.entry.overviewTitle")}</strong>
              <small>{t("dashboardPages.entry.overviewNote")}</small>
            </article>
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.salesTools")}</span>
              <strong>{t("quote.title")}</strong>
              <small>{t("dashboardPages.entry.quotesNote")}</small>
            </article>
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.commissions")}</span>
              <strong>{t("commission.title")}</strong>
              <small>{t("dashboardPages.entry.commissionsNote")}</small>
            </article>
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.helpDesk")}</span>
              <strong>{t("support.title")}</strong>
              <small>{t("dashboardPages.entry.supportNote")}</small>
            </article>
          </div>
          <span className="sr-only">{locale}</span>
        </section>

      </main>
    </>
  );
}
