import {notFound} from "next/navigation";

export default async function DashboardSponsorshipContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  await params;
  notFound();
}
