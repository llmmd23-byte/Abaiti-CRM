import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const USER_PAGE_ACCESS = [
  { key: "page.user.overview", path: "/dashboard" },
  { key: "page.user.marketing", path: "/dashboard/products" },
  { key: "page.user.customers", path: "/dashboard/customers" },
  { key: "page.user.quotes", path: "/dashboard/quotes" },
  { key: "page.user.sales", path: "/dashboard/commissions" },
  { key: "page.user.activation", path: "/dashboard/product-info" },
  { key: "page.user.education", path: "/educational-hub" },
  { key: "page.user.support", path: "/dashboard/support" },
  { key: "page.user.accounts", path: "/dashboard/accounts" },
  { key: "page.user.settings", path: "/dashboard/settings" },
] as const;

export type UserPagePermissionKey = (typeof USER_PAGE_ACCESS)[number]["key"];

export async function requireUserPageAccess(
  permissionKey: UserPagePermissionKey,
  locale: string,
) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin`);
  if (await hasPermission(session, permissionKey, "can_view")) return session;

  for (const page of USER_PAGE_ACCESS) {
    if (
      page.key !== permissionKey &&
      (await hasPermission(session, page.key, "can_view"))
    ) {
      redirect(`/${locale}${page.path}`);
    }
  }

  redirect(`/${locale}`);
}
