import DashboardShell from "@/components/DashboardShell";
import ProductsWorkspace from "@/components/ProductsWorkspace";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardProductsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.marketing", locale);
  return (
    <DashboardShell active="products">
      <h1 className="sr-only">Products and industries</h1>
      <ProductsWorkspace />
    </DashboardShell>
  );
}
