import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {MetricsGrid, PerformanceChart} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardOverviewPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.overview", locale);
  return (
    <>
      <DashboardHeaderBanner section="overview" />
      <MetricsGrid />
      <div className="grid grid-cols-1">
        <PerformanceChart />
      </div>
    </>
  );
}
