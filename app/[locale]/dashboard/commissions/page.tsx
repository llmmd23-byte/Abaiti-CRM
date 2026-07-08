import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import { MetricsGrid, SalesTable } from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardCommissionsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.sales", locale);
  return (
    <>
      <DashboardHeaderBanner section="sales" />
      <MetricsGrid />
      <div className="w-full">
        <SalesTable expanded />
      </div>
    </>
  );
}
