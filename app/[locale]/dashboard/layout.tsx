import {redirect} from "next/navigation";

import DashboardShell from "@/components/DashboardShell";
import {getSession} from "@/lib/auth";
import {getProfile} from "@/lib/backend";
import {getSessionPermissions} from "@/lib/permissions";

export default async function ProtectedDashboardLayout({
  children,
  params
}: Readonly<{children: React.ReactNode; params: Promise<{locale: string}>}>) {
  const {locale} = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/signin`);
  const [profile, permissions] = await Promise.all([
    getProfile(session),
    getSessionPermissions(session),
  ]);

  return (
    <DashboardShell
      locale={locale === "en" ? "en" : "ar"}
      initialUser={{
        name: String(profile?.name ?? session.name),
        role: session.role,
        permissions,
        level: String(profile?.level ?? "مبتدئ"),
        status: String(profile?.status ?? "inactive"),
      }}
    >
      {children}
    </DashboardShell>
  );
}
