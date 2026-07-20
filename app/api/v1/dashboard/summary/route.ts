import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getDashboardSummary} from "@/lib/backend";

export async function GET(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const period = new URL(request.url).searchParams.get("period");
    const searchParams = new URL(request.url).searchParams;
    const group = searchParams.get("group");
    const anchor = searchParams.get("anchor");
    const selectedUserId = Number(searchParams.get("userId") ?? 0);
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
      data: await getDashboardSummary(
        session,
        trendPeriod,
        anchor ?? undefined,
        trendGroup,
        Number.isFinite(selectedUserId) && selectedUserId > 0 ? selectedUserId : null,
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}
