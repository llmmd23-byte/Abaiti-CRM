import DashboardShell from "@/components/DashboardShell";
import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {MetricsGrid, PerformanceChart} from "@/components/DashboardSections";

export default function DashboardOverviewPage() {
  return (
    <DashboardShell active="overview">
      <DashboardHeaderBanner section="overview" />
      <MetricsGrid />
      <div className="grid grid-cols-1">
        <PerformanceChart />
      </div>
    </DashboardShell>
  );
}
