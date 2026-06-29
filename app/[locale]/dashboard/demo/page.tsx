import DashboardShell from "@/components/DashboardShell";
import ProductsWorkspace from "@/components/ProductsWorkspace";

export default function DashboardDemoPage() {
  return (
    <DashboardShell active="demo">
      <h1 className="sr-only">Customer demonstrations</h1>
      <ProductsWorkspace initialView="form" />
    </DashboardShell>
  );
}
