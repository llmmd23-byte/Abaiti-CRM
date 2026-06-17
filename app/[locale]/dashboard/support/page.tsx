import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader, HelpDeskPanel} from "@/components/DashboardSections";

export default function DashboardSupportPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="support">
      <DashboardHeader eyebrow={t("dashboardPages.support.eyebrow")} title={t("dashboardPages.support.title")} />
      <div className="w-full">
        <HelpDeskPanel expanded />
      </div>
    </DashboardShell>
  );
}
