import {getTranslations, setRequestLocale} from "next-intl/server";
import {DashboardHeader} from "@/components/DashboardSections";
import {HelpDeskPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardSupportPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.support", locale);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <DashboardHeader eyebrow={t("dashboardPages.support.eyebrow")} title={t("dashboardPages.support.title")} />
      <div className="w-full">
        <HelpDeskPanel expanded />
      </div>
    </>
  );
}
