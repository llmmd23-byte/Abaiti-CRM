import {redirect} from "next/navigation";

import {getSession} from "@/lib/auth";

export default async function ProtectedDashboardLayout({
  children,
  params
}: Readonly<{children: React.ReactNode; params: Promise<{locale: string}>}>) {
  const {locale} = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/signin`);
  return children;
}
