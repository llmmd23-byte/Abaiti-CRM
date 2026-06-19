import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import {LeadsHubView} from "@/components/DashboardNewSections";

export default function DashboardCustomersPage() {
  return (
    <DashboardShell active="customers">
      <DashboardHeaderBanner section="leads" />
      <LeadsHubView />
    </DashboardShell>
  );
}
