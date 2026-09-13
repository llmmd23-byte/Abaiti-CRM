import {notFound} from "next/navigation";

export default async function DashboardParticipationContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  await params;
  notFound();
}
