import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader} from "@/components/DashboardSections";
import {AccountsView} from "@/components/DashboardNewSections";

export default function DashboardAccountsPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="accounts">
      <DashboardHeader eyebrow={t("dashboardPages.accounts.eyebrow")} title={t("dashboardPages.accounts.title")} />
      <AccountsView />
    </DashboardShell>
  );
}
