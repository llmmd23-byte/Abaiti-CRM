import DashboardShell from "@/components/DashboardShell";
import ProductsWorkspace from "@/components/ProductsWorkspace";

export default function DashboardProductsPage() {
  return (
    <DashboardShell active="products">
      <ProductsWorkspace />
    </DashboardShell>
  );
}
