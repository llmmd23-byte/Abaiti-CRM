import {getTranslations, setRequestLocale} from "next-intl/server";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader, HelpDeskPanel} from "@/components/DashboardSections";

export default async function DashboardSupportPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <DashboardShell active="support">
      <DashboardHeader eyebrow={t("dashboardPages.support.eyebrow")} title={t("dashboardPages.support.title")} />
      <div className="w-full">
        <HelpDeskPanel expanded />
      </div>
    </DashboardShell>
  );
}
