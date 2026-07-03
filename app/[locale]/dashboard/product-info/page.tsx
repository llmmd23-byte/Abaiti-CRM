import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import ProductInfoView from "@/components/ProductInfoView";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardProductInfoPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.activation", locale);
  return (
    <DashboardShell active="productInfo">
      <DashboardHeaderBanner section="activation" />
      <ProductInfoView />
    </DashboardShell>
  );
}
