import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import {AccountsView} from "@/components/DashboardNewSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardAccountsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.accounts", locale);
  return (
    <DashboardShell active="accounts">
      <DashboardHeaderBanner section="accounts" />
      <AccountsView />
    </DashboardShell>
  );
}
