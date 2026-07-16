import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getDashboardSummary} from "@/lib/backend";

export async function GET(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const period = new URL(request.url).searchParams.get("period");
    const group = new URL(request.url).searchParams.get("group");
    const anchor = new URL(request.url).searchParams.get("anchor");
    const trendPeriod =
      period === "month" || period === "year" ? period : "week";
    const trendGroup =
      group === "days" || group === "weeks" || group === "months" || group === "quarters"
        ? group
        : trendPeriod === "year"
          ? "months"
          : trendPeriod === "month"
            ? "weeks"
            : "days";
    return NextResponse.json({
      data: await getDashboardSummary(session, trendPeriod, anchor ?? undefined, trendGroup),
    });
  } catch (error) {
    return apiError(error);
  }
}
