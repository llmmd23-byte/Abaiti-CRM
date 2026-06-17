import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {Link} from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

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
        <nav className="nav-links" aria-label={t("nav.label")}>
          <a href="#features">{t("nav.features")}</a>
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          <a className="button button-primary" href="#demo">
            {t("cta.demo")}
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="landing">
          <div className="hero-content">
            <p className="eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="hero-partner-title">
              <span>{locale === "ar" ? "\u0643\u0646 \u0634\u0631\u064a\u0643\u0627\u064b \u0645\u0639 \u0645\u064a\u062f\u0627\u0631" : "Partner with Middar"}</span>
              <small>
                {locale === "ar"
                  ? "\u0639\u0645\u0644\u0627\u0621 \u0645\u0624\u0647\u0644\u064a\u0646\u060c \u0639\u0631\u0648\u0636 \u0623\u0633\u0639\u0627\u0631\u060c \u0645\u062f\u0641\u0648\u0639\u0627\u062a\u060c \u0648\u0639\u0645\u0648\u0644\u0627\u062a \u0645\u062a\u062a\u0628\u0639\u0629."
                  : "Qualified leads, quotes, payments, and tracked commissions."}
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
            <form className="demo-form">
              <label>
                <span>{t("form.name")}</span>
                <input type="text" placeholder={t("form.namePlaceholder")} />
              </label>
              <label>
                <span>{t("form.email")}</span>
                <input type="email" placeholder="name@company.com" />
              </label>
              <label>
                <span>{t("form.phone")}</span>
                <input type="tel" placeholder="+966 5X XXX XXXX" />
              </label>
              <label>
                <span>{t("form.password")}</span>
                <input type="password" placeholder={t("form.passwordPlaceholder")} />
              </label>
              <label>
                <span>{t("form.confirmPassword")}</span>
                <input type="password" placeholder={t("form.confirmPasswordPlaceholder")} />
              </label>
              <button className="button button-form" type="button">
                {t("form.submit")}
              </button>
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
              <Link className="button button-dark" href="/dashboard">
                {t("cta.dashboard")}
              </Link>
            </article>
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.salesTools")}</span>
              <strong>{t("quote.title")}</strong>
              <small>{t("dashboardPages.entry.quotesNote")}</small>
              <Link className="button button-dark" href="/dashboard/quotes">
                {t("portal.salesTools")}
              </Link>
            </article>
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.commissions")}</span>
              <strong>{t("commission.title")}</strong>
              <small>{t("dashboardPages.entry.commissionsNote")}</small>
              <Link className="button button-dark" href="/dashboard/commissions">
                {t("portal.commissions")}
              </Link>
            </article>
            <article className="metric-card dashboard-entry-card">
              <span>{t("portal.helpDesk")}</span>
              <strong>{t("support.title")}</strong>
              <small>{t("dashboardPages.entry.supportNote")}</small>
              <Link className="button button-dark" href="/dashboard/support">
                {t("portal.helpDesk")}
              </Link>
            </article>
          </div>
          <span className="sr-only">{locale}</span>
        </section>

        <section className="lead-capture-footer section" id="lead-request" dir="rtl">
          <div className="lead-capture-intro">
            <p className="eyebrow">{"\u0637\u0644\u0628 \u0639\u0631\u0636 \u0645\u0624\u0633\u0633\u064a"}</p>
            <h2>{"\u0627\u0628\u062f\u0623 \u062a\u0647\u064a\u0626\u0629 \u0645\u0646\u0635\u0629 \u0645\u064a\u062f\u0627\u0631 \u0644\u0645\u0646\u0634\u0623\u062a\u0643"}</h2>
            <p>
              {"\u0627\u0645\u0644\u0623 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0648\u0633\u064a\u062a\u0648\u0627\u0635\u0644 \u0641\u0631\u064a\u0642 \u0645\u064a\u062f\u0627\u0631 \u0644\u062f\u0631\u0627\u0633\u0629 \u0627\u062d\u062a\u064a\u0627\u062c\u0627\u062a\u0643 \u0648\u062a\u0642\u062f\u064a\u0645 \u0639\u0631\u0636 \u0645\u0646\u0627\u0633\u0628."}
            </p>
          </div>

          <form className="lead-capture-card">
            <div className="lead-capture-columns">
              <fieldset>
                <legend>{"\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</legend>
                <label>
                  <span>{"\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</span>
                  <input type="text" placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629"} />
                </label>
                <label>
                  <span>{"\u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</span>
                  <select defaultValue="">
                    <option value="" disabled>
                      {"\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}
                    </option>
                    <option>{"\u0634\u0627\u0644\u064a\u0647\u0627\u062a"}</option>
                    <option>{"\u0635\u0627\u0644\u0648\u0646\u0627\u062a"}</option>
                    <option>{"\u0645\u063a\u0627\u0633\u0644"}</option>
                    <option>{"\u062e\u062f\u0645\u0627\u062a \u0645\u0646\u0632\u0644\u064a\u0629"}</option>
                    <option>{"\u0623\u062e\u0631\u0649"}</option>
                  </select>
                </label>
                <label>
                  <span>{"\u0627\u0644\u0639\u0646\u0648\u0627\u0646"}</span>
                  <input type="text" placeholder={"\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a"} />
                </label>
                <label className="lead-capture-wide">
                  <span>{"\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629"}</span>
                  <textarea placeholder={"\u0627\u0630\u0643\u0631 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u062e\u0627\u0635\u0629 \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629..."} />
                </label>
              </fieldset>

              <fieldset>
                <legend>{"\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644"}</legend>
                <label>
                  <span>{"\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"}</span>
                  <input type="text" placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u062b\u0644\u0627\u062b\u064a"} />
                </label>
                <label>
                  <span>{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</span>
                  <input type="email" placeholder="name@company.com" />
                </label>
                <label>
                  <span>{"\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644"}</span>
                  <input type="tel" placeholder="+966 5X XXX XXXX" />
                </label>
              </fieldset>
            </div>

            <button className="lead-capture-submit" type="button">
              {"\u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0639\u0631\u0636"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
