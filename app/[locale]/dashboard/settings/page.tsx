import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader} from "@/components/DashboardSections";
import SettingsDashboard from "@/components/SettingsDashboard";

export default function DashboardSettingsPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="settings">
      <DashboardHeader eyebrow={t("dashboardPages.settings.eyebrow")} title={t("dashboardPages.settings.title")} />
      <SettingsDashboard />
    </DashboardShell>
  );
}
