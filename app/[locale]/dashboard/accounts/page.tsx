import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import {AccountsView} from "@/components/DashboardNewSections";

export default function DashboardAccountsPage() {
  return (
    <DashboardShell active="accounts">
      <DashboardHeaderBanner section="accounts" />
      <AccountsView />
    </DashboardShell>
  );
}
