import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {CommissionTable, DashboardHeader, MetricsGrid} from "@/components/DashboardSections";

export default function DashboardCommissionsPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="commissions">
      <DashboardHeader eyebrow={t("dashboardPages.commissions.eyebrow")} title={t("dashboardPages.commissions.title")} />
      <MetricsGrid />
      <div className="full-width-section">
        <CommissionTable expanded />
      </div>
    </DashboardShell>
  );
}
