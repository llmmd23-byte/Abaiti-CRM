import DashboardShell from "@/components/DashboardShell";
import ProductsWorkspace from "@/components/ProductsWorkspace";

export default function DashboardDemoPage() {
  return (
    <DashboardShell active="demo">
      <ProductsWorkspace initialView="form" />
    </DashboardShell>
  );
}
