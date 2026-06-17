import {useTranslations} from "next-intl";
import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader, QuoteSystem} from "@/components/DashboardSections";

export default function DashboardQuotesPage() {
  const t = useTranslations();

  return (
    <DashboardShell active="quotes">
      <DashboardHeader
        eyebrow={t("dashboardPages.quotes.eyebrow")}
        title={t("dashboardPages.quotes.title")}
      />
      <QuoteSystem />
    </DashboardShell>
  );
}
