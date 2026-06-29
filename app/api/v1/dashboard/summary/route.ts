import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getDashboardSummary} from "@/lib/backend";

export async function GET(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const period = new URL(request.url).searchParams.get("period");
    const trendPeriod =
      period === "month" || period === "year" ? period : "week";
    return NextResponse.json({
      data: await getDashboardSummary(session, trendPeriod),
    });
  } catch (error) {
    return apiError(error);
  }
}
