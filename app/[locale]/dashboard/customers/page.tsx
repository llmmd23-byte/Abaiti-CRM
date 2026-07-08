import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {LeadsHubView} from "@/components/DashboardNewSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardCustomersPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.customers", locale);
  return (
    <>
      <DashboardHeaderBanner section="leads" />
      <LeadsHubView />
    </>
  );
}
