import {redirect} from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import {getSession} from "@/lib/auth";

export default async function AdminPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin`);
  if (session.role !== "admin") redirect(`/${locale}/dashboard`);
  return <AdminDashboard />;
}
