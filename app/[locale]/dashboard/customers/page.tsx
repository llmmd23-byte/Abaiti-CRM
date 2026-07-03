import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import {LeadsHubView} from "@/components/DashboardNewSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardCustomersPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.customers", locale);
  return (
    <DashboardShell active="customers">
      <DashboardHeaderBanner section="leads" />
      <LeadsHubView />
    </DashboardShell>
  );
}
