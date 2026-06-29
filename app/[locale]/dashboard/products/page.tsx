import DashboardShell from "@/components/DashboardShell";
import ProductsWorkspace from "@/components/ProductsWorkspace";

export default function DashboardProductsPage() {
  return (
    <DashboardShell active="products">
      <h1 className="sr-only">Products and industries</h1>
      <ProductsWorkspace />
    </DashboardShell>
  );
}
