import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import { MetricsGrid, SalesTable } from "@/components/DashboardSections";

export default function DashboardCommissionsPage() {
  return (
    <DashboardShell active="commissions">
      <DashboardHeaderBanner section="sales" />
      <MetricsGrid />
      <div className="w-full">
        <SalesTable expanded />
      </div>
    </DashboardShell>
  );
}
