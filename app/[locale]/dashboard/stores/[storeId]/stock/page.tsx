import StockEditView from "@/components/StockEditView";
import { requireUserPageAccess } from "@/lib/user-page-access";

export default async function DashboardStoreStockPage({
  params,
}: {
  params: Promise<{ locale: string; storeId: string }>;
}) {
  const { locale, storeId } = await params;
  await requireUserPageAccess("page.user.stores", locale);

  return (
    <>
      <StockEditView storeId={storeId} />
    </>
  );
}
