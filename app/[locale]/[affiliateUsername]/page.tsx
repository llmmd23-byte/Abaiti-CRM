import {captureAffiliateLead} from "@/app/actions";
import {formControl, formLabel, HeroLayout, LeadPanel, PublicHeader} from "@/components/PublicLanding";
import {cn, SectionTitle, theme} from "@/components/ui";
import {Link} from "@/i18n/navigation";
import {useLocale, useTranslations} from "next-intl";
import {notFound} from "next/navigation";

const reservedRoutes = new Set(["dashboard", "api", "_next"]);

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
  params: Promise<{affiliateUsername: string}>;
}) {
  const {affiliateUsername} = await params;

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
  const locale = useLocale();
  const affiliateId = `aff_${affiliateUsername.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;

  return (
    <>
      <PublicHeader
        nav={
          <>
          <Link href="/">{t("affiliatePage.navPlatform")}</Link>
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
          </>
        }
      />

      <main>
        <HeroLayout
          affiliate
          eyebrow={t("affiliatePage.eyebrow", {affiliateName})}
          title={t("affiliatePage.title")}
          copy={t("affiliatePage.copy")}
          trust={[t("trust.crm"), t("trust.payments"), t("trust.payouts")]}
          panel={
          <LeadPanel tag={t("affiliatePage.formTag", {affiliateName})} title={t("affiliatePage.formTitle")}>
            <form action={captureAffiliateLead} className="grid gap-3.5">
              <input name="affiliateUsername" type="hidden" value={affiliateUsername} />
              <input name="affiliateId" type="hidden" value={affiliateId} />
              <input name="locale" type="hidden" value={locale} />
              <label className={formLabel}>
                <span>{t("form.name")}</span>
                <input className={formControl} name="fullName" required type="text" placeholder={t("form.namePlaceholder")} />
              </label>
              <label className={formLabel}>
                <span>{t("form.email")}</span>
                <input className={formControl} name="email" required type="email" placeholder="name@company.com" />
              </label>
              <label className={formLabel}>
                <span>{t("form.phone")}</span>
                <input className={formControl} name="phone" type="tel" placeholder="+966 5X XXX XXXX" />
              </label>
              <label className={formLabel}>
                <span>{t("form.size")}</span>
                <select className={formControl} name="companySize">
                  <option>{t("form.size1")}</option>
                  <option>{t("form.size2")}</option>
                  <option>{t("form.size3")}</option>
                  <option>{t("form.size4")}</option>
                </select>
              </label>
              <label className={formLabel}>
                <span>{t("affiliatePage.message")}</span>
                <textarea className={cn(formControl, "min-h-[104px] resize-y py-3")} name="message" placeholder={t("affiliatePage.messagePlaceholder")} />
              </label>
              <button className={theme.primaryButton} type="submit">
                {t("form.submit")}
              </button>
              <p className="m-0 text-xs font-normal leading-relaxed text-[#647280]">{t("affiliatePage.crmNote", {affiliateId})}</p>
            </form>
          </LeadPanel>
          }
        />

        <section className="px-[clamp(18px,5vw,72px)] py-[clamp(52px,8vw,104px)]">
          <SectionTitle eyebrow={t("affiliatePage.specsEyebrow")} title={t("affiliatePage.specsTitle")} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <article className={cn("p-6", theme.glass)} key={item}>
                <span className="mb-6 inline-flex font-medium text-[#22b8b8]">0{item}</span>
                <h3 className="m-0 text-lg font-bold leading-tight text-[#0b1f3a]">{t(`affiliatePage.spec${item}.title`)}</h3>
                <p className="mb-0 mt-3 font-normal leading-8 text-[#647280]">{t(`affiliatePage.spec${item}.copy`)}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
