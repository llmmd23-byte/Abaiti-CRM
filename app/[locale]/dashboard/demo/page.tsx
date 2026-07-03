import DashboardShell from "@/components/DashboardShell";
import ProductsWorkspace from "@/components/ProductsWorkspace";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardDemoPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.activation", locale);
  return (
    <DashboardShell active="demo">
      <h1 className="sr-only">Customer demonstrations</h1>
      <ProductsWorkspace initialView="form" />
    </DashboardShell>
  );
}
