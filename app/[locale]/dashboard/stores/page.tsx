import StoresView from "@/components/StoresView";
import { requireUserPageAccess } from "@/lib/user-page-access";

export default async function DashboardStoresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUserPageAccess("page.user.stores", locale);

  return (
    <>
      <StoresView />
    </>
  );
}
