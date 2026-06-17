import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader} from "@/components/DashboardSections";
import {LeadsHubView} from "@/components/DashboardNewSections";

export default function DashboardCustomersPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="customers">
      <DashboardHeader eyebrow={t("dashboardPages.customers.eyebrow")} title={t("dashboardPages.customers.title")} />
      <LeadsHubView />
    </DashboardShell>
  );
}
