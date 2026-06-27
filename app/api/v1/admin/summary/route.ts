import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

type CountRow = RowDataPacket & { total: number };
type ActivityRow = RowDataPacket & { day: string; total: number };

export async function GET(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "page.admin.dashboard", "can_view")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const requestedPeriod = new URL(request.url).searchParams.get("period");
  const period =
    requestedPeriod === "day" ||
    requestedPeriod === "week" ||
    requestedPeriod === "month" ||
    requestedPeriod === "year"
      ? requestedPeriod
      : "week";
  const rangeCondition =
    period === "day"
      ? "created_at >= CURDATE()"
      : period === "month"
        ? "created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        : period === "year"
          ? "created_at >= DATE_FORMAT(CURDATE(), '%Y-01-01')"
          : "created_at >= CURDATE() - INTERVAL 6 DAY";
  const periodExpression =
    period === "day"
      ? "DATE_FORMAT(created_at, '%H')"
      : period === "year"
        ? "DATE_FORMAT(created_at, '%Y-%m')"
        : "DATE_FORMAT(created_at, '%Y-%m-%d')";

  const [summaryRows] = await db.execute<RowDataPacket[]>(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE ${rangeCondition}) users,
      (SELECT COUNT(*) FROM leads WHERE ${rangeCondition}) clients,
      (SELECT COUNT(*) FROM demo_requests WHERE ${rangeCondition}) demos,
      (SELECT COUNT(*) FROM quotes WHERE ${rangeCondition}) quotes,
      (SELECT COUNT(*) FROM sales WHERE ${rangeCondition}) sales,
      (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open','in_progress') AND ${rangeCondition}) openTickets,
      (SELECT COUNT(*) FROM quotes WHERE status IN ('draft', 'sent', 'accepted') AND ${rangeCondition}) openQuotes,
      (SELECT COUNT(*) FROM sales WHERE status = 'pending' AND ${rangeCondition}) uncreatedSalesCommissions,
      (SELECT COUNT(*) FROM commissions WHERE status = 'pending' AND ${rangeCondition}) invisibleCommissions,
      (SELECT COUNT(*) FROM commissions WHERE status <> 'paid' AND ${rangeCondition}) unpaidCommissions`,
  );
  const summary = summaryRows[0] ?? {};

  const metricQueries: Record<string, string> = {
    users: `SELECT ${periodExpression} day, COUNT(*) total FROM users WHERE ${rangeCondition} GROUP BY ${periodExpression} ORDER BY day`,
    clients: `SELECT ${periodExpression} day, COUNT(*) total FROM leads WHERE ${rangeCondition} GROUP BY ${periodExpression} ORDER BY day`,
    demos: `SELECT ${periodExpression} day, COUNT(*) total FROM demo_requests WHERE ${rangeCondition} GROUP BY ${periodExpression} ORDER BY day`,
    quotes: `SELECT ${periodExpression} day, COUNT(*) total FROM quotes WHERE ${rangeCondition} GROUP BY ${periodExpression} ORDER BY day`,
    sales: `SELECT ${periodExpression} day, COUNT(*) total FROM sales WHERE ${rangeCondition} GROUP BY ${periodExpression} ORDER BY day`,
  };

  const seriesEntries: Array<
    readonly [string, Array<{ date: string; value: number }>]
  > = [];
  for (const [key, query] of Object.entries(metricQueries)) {
    const [rows] = await db.execute<ActivityRow[]>(query);
    seriesEntries.push([
      key,
      rows.map((row) => ({ date: String(row.day), value: Number(row.total) })),
    ]);
  }

  return NextResponse.json({
    data: {
      totals: {
        users: Number(summary.users ?? 0),
        clients: Number(summary.clients ?? 0),
        demos: Number(summary.demos ?? 0),
        quotes: Number(summary.quotes ?? 0),
        sales: Number(summary.sales ?? 0),
        openTickets: Number(summary.openTickets ?? 0),
        openQuotes: Number(summary.openQuotes ?? 0),
        uncreatedSalesCommissions: Number(
          summary.uncreatedSalesCommissions ?? 0,
        ),
        invisibleCommissions: Number(summary.invisibleCommissions ?? 0),
        unpaidCommissions: Number(summary.unpaidCommissions ?? 0),
      },
      period,
      series: Object.fromEntries(seriesEntries),
    },
  });
}
