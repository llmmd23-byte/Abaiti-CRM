import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader, MetricsGrid, PerformanceChart} from "@/components/DashboardSections";

export default function DashboardOverviewPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="overview">
      <DashboardHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.greeting")}
        action={t("dashboard.createQuote")}
      />
      <MetricsGrid />
      <div className="dashboard-grid single-dashboard-grid">
        <PerformanceChart />
      </div>
    </DashboardShell>
  );
}
