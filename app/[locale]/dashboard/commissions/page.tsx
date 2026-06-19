import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import {CommissionTable, MetricsGrid} from "@/components/DashboardSections";

export default function DashboardCommissionsPage() {
  return (
    <DashboardShell active="commissions">
      <DashboardHeaderBanner section="sales" />
      <MetricsGrid />
      <div className="w-full">
        <CommissionTable expanded />
      </div>
    </DashboardShell>
  );
}
