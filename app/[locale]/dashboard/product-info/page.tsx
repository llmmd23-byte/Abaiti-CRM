import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import DashboardShell from "@/components/DashboardShell";
import ProductInfoView from "@/components/ProductInfoView";

export default function DashboardProductInfoPage() {
  return (
    <DashboardShell active="productInfo">
      <DashboardHeaderBanner section="activation" />
      <ProductInfoView />
    </DashboardShell>
  );
}
