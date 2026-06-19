import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import {QuoteSystem} from "@/components/DashboardSections";

export default function DashboardQuotesPage() {
  return (
    <DashboardShell active="quotes">
      <DashboardHeaderBanner section="quotes" />
      <QuoteSystem />
    </DashboardShell>
  );
}
