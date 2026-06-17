import {useLocale, useTranslations} from "next-intl";
import {DashboardCard} from "@/components/DashboardPrimitives";
import {formControl, formLabel, HeroLayout, LeadPanel, PublicHeader} from "@/components/PublicLanding";
import {cn, SectionTitle, theme} from "@/components/ui";
import {Link} from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <>
      <PublicHeader
        nav={
          <>
          <a href="#features">{t("nav.features")}</a>
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
          </>
        }
        action={
          <a className={theme.primaryButton} href="#demo">
            {t("cta.demo")}
          </a>
        }
      />

      <main>
        <HeroLayout
          id="landing"
          eyebrow={t("hero.eyebrow")}
          title={locale === "ar" ? "\u0643\u0646 \u0634\u0631\u064a\u0643\u0627\u064b \u0645\u0639 \u0645\u064a\u062f\u0627\u0631" : "Partner with Middar"}
          subtitle={
            locale === "ar"
              ? "\u0639\u0645\u0644\u0627\u0621 \u0645\u0624\u0647\u0644\u064a\u0646\u060c \u0639\u0631\u0648\u0636 \u0623\u0633\u0639\u0627\u0631\u060c \u0645\u062f\u0641\u0648\u0639\u0627\u062a\u060c \u0648\u0639\u0645\u0648\u0644\u0627\u062a \u0645\u062a\u062a\u0628\u0639\u0629."
              : "Qualified leads, quotes, payments, and tracked commissions."
          }
          copy={t("hero.copy")}
          trust={[t("trust.crm"), t("trust.payments"), t("trust.payouts")]}
          panel={
            <LeadPanel id="demo" tag={t("form.recommended")} title={t("form.title")}>
            <form className="grid gap-3.5">
              <label className={formLabel}>
                <span>{t("form.name")}</span>
                <input className={formControl} type="text" placeholder={t("form.namePlaceholder")} />
              </label>
              <label className={formLabel}>
                <span>{t("form.email")}</span>
                <input className={formControl} type="email" placeholder="name@company.com" />
              </label>
              <label className={formLabel}>
                <span>{t("form.phone")}</span>
                <input className={formControl} type="tel" placeholder="+966 5X XXX XXXX" />
              </label>
              <label className={formLabel}>
                <span>{t("form.password")}</span>
                <input className={formControl} type="password" placeholder={t("form.passwordPlaceholder")} />
              </label>
              <label className={formLabel}>
                <span>{t("form.confirmPassword")}</span>
                <input className={formControl} type="password" placeholder={t("form.confirmPasswordPlaceholder")} />
              </label>
              <button className={theme.primaryButton} type="button">
                {t("form.submit")}
              </button>
              <p className="m-0 text-xs font-normal leading-relaxed text-[#647280]">{t("form.note")}</p>
            </form>
            </LeadPanel>
          }
        />

        <section className="px-[clamp(18px,5vw,72px)] py-[clamp(52px,8vw,104px)]" id="features">
          <SectionTitle eyebrow={t("features.eyebrow")} title={t("features.title")} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <article className={cn("p-6", theme.glass)} key={item}>
                <span className="mb-6 inline-flex font-medium text-[#22b8b8]">0{item}</span>
                <h3 className="m-0 text-lg font-bold leading-tight text-[#0b1f3a]">{t(`features.item${item}.title`)}</h3>
                <p className="mb-0 mt-3 font-normal leading-8 text-[#647280]">{t(`features.item${item}.copy`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-[clamp(18px,5vw,72px)] py-[clamp(52px,8vw,104px)]" id="dashboard">
          <SectionTitle eyebrow={t("dashboard.eyebrow")} title={t("dashboardPages.entry.title")} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard>
              <span className="text-[13px] font-medium text-[#647280]">{t("portal.overview")}</span>
              <strong className="text-xl font-black leading-snug text-[#0b1f3a]">{t("dashboardPages.entry.overviewTitle")}</strong>
              <small className="text-[13px] font-medium leading-relaxed text-[#647280]">{t("dashboardPages.entry.overviewNote")}</small>
              <Link className={theme.darkButton} href="/dashboard">
                {t("cta.dashboard")}
              </Link>
            </DashboardCard>
            <DashboardCard>
              <span className="text-[13px] font-medium text-[#647280]">{t("portal.salesTools")}</span>
              <strong className="text-xl font-black leading-snug text-[#0b1f3a]">{t("quote.title")}</strong>
              <small className="text-[13px] font-medium leading-relaxed text-[#647280]">{t("dashboardPages.entry.quotesNote")}</small>
              <Link className={theme.darkButton} href="/dashboard/quotes">
                {t("portal.salesTools")}
              </Link>
            </DashboardCard>
            <DashboardCard>
              <span className="text-[13px] font-medium text-[#647280]">{t("portal.commissions")}</span>
              <strong className="text-xl font-black leading-snug text-[#0b1f3a]">{t("commission.title")}</strong>
              <small className="text-[13px] font-medium leading-relaxed text-[#647280]">{t("dashboardPages.entry.commissionsNote")}</small>
              <Link className={theme.darkButton} href="/dashboard/commissions">
                {t("portal.commissions")}
              </Link>
            </DashboardCard>
            <DashboardCard>
              <span className="text-[13px] font-medium text-[#647280]">{t("portal.helpDesk")}</span>
              <strong className="text-xl font-black leading-snug text-[#0b1f3a]">{t("support.title")}</strong>
              <small className="text-[13px] font-medium leading-relaxed text-[#647280]">{t("dashboardPages.entry.supportNote")}</small>
              <Link className={theme.darkButton} href="/dashboard/support">
                {t("portal.helpDesk")}
              </Link>
            </DashboardCard>
          </div>
          <span className="sr-only">{locale}</span>
        </section>

        <section className="px-[clamp(18px,5vw,72px)] py-[clamp(52px,8vw,104px)]" id="lead-request" dir="rtl">
          <div className="mb-7 max-w-[760px]">
            <SectionTitle eyebrow={"\u0637\u0644\u0628 \u0639\u0631\u0636 \u0645\u0624\u0633\u0633\u064a"} title={"\u0627\u0628\u062f\u0623 \u062a\u0647\u064a\u0626\u0629 \u0645\u0646\u0635\u0629 \u0645\u064a\u062f\u0627\u0631 \u0644\u0645\u0646\u0634\u0623\u062a\u0643"}>
              {"\u0627\u0645\u0644\u0623 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0648\u0633\u064a\u062a\u0648\u0627\u0635\u0644 \u0641\u0631\u064a\u0642 \u0645\u064a\u062f\u0627\u0631 \u0644\u062f\u0631\u0627\u0633\u0629 \u0627\u062d\u062a\u064a\u0627\u062c\u0627\u062a\u0643 \u0648\u062a\u0642\u062f\u064a\u0645 \u0639\u0631\u0636 \u0645\u0646\u0627\u0633\u0628."}
            </SectionTitle>
          </div>

          <form className={cn("grid gap-5 rounded-[22px] border border-[#dde6ee]/90 bg-white/85 p-6 shadow-[0_24px_70px_rgba(11,31,58,0.12)]", "[&_fieldset]:grid [&_fieldset]:gap-3.5 [&_fieldset]:rounded-2xl [&_fieldset]:border [&_fieldset]:border-slate-200 [&_fieldset]:p-5 [&_legend]:px-1.5 [&_legend]:text-[15px] [&_legend]:font-black [&_legend]:text-[#0b1f3a]")}>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <fieldset>
                <legend>{"\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</legend>
                <label>
                  <span>{"\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</span>
                  <input className={formControl} type="text" placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629"} />
                </label>
                <label>
                  <span>{"\u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</span>
                  <select className={formControl} defaultValue="">
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
                  <input className={formControl} type="text" placeholder={"\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a"} />
                </label>
                <label>
                  <span>{"\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629"}</span>
                  <textarea className={cn(formControl, "min-h-[104px] resize-y py-3")} placeholder={"\u0627\u0630\u0643\u0631 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u062e\u0627\u0635\u0629 \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629..."} />
                </label>
              </fieldset>

              <fieldset>
                <legend>{"\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644"}</legend>
                <label>
                  <span>{"\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"}</span>
                  <input className={formControl} type="text" placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u062b\u0644\u0627\u062b\u064a"} />
                </label>
                <label>
                  <span>{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</span>
                  <input className={formControl} type="email" placeholder="name@company.com" />
                </label>
                <label>
                  <span>{"\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644"}</span>
                  <input className={formControl} type="tel" placeholder="+966 5X XXX XXXX" />
                </label>
              </fieldset>
            </div>

            <button className={theme.primaryButton} type="button">
              {"\u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0639\u0631\u0636"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
