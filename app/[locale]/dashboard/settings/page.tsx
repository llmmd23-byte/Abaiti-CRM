import {setRequestLocale} from "next-intl/server";
import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import SettingsDashboard from "@/components/SettingsDashboard";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardSettingsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.settings", locale);
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeaderBanner section="settings" />
      <SettingsDashboard />
    </>
  );
}
