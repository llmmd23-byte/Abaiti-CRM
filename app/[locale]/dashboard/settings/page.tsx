import {getTranslations, setRequestLocale} from "next-intl/server";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader} from "@/components/DashboardSections";
import SettingsDashboard from "@/components/SettingsDashboard";

export default async function DashboardSettingsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <DashboardShell active="settings">
      <DashboardHeader eyebrow={t("dashboardPages.settings.eyebrow")} title={t("dashboardPages.settings.title")} />
      <SettingsDashboard />
    </DashboardShell>
  );
}
