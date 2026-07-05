import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

type CountRow = RowDataPacket & { total: number };
type ActivityRow = RowDataPacket & { day: string; total: number };

function scopedUserClause(alias: string, hasCompany: boolean) {
  return hasCompany
    ? `(${alias}.CompanyID = ? OR ${alias}.id = ?)`
    : `${alias}.id = ?`;
}

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
    requestedPeriod === "all" ||
    requestedPeriod === "day" ||
    requestedPeriod === "week" ||
    requestedPeriod === "month" ||
    requestedPeriod === "year"
      ? requestedPeriod
      : "all";
  const rangeCondition =
    period === "all"
      ? "created_at IS NOT NULL"
      : period === "day"
      ? "created_at >= CURDATE()"
      : period === "month"
        ? "created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        : period === "year"
          ? "created_at >= DATE_FORMAT(CURDATE(), '%Y-01-01')"
          : "created_at >= CURDATE() - INTERVAL 6 DAY";
  const periodExpression =
    period === "day"
      ? "DATE_FORMAT(created_at, '%H')"
      : period === "all" || period === "year"
        ? "DATE_FORMAT(created_at, '%Y-%m')"
        : "DATE_FORMAT(created_at, '%Y-%m-%d')";

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const adminCompanyId = adminRows[0]?.CompanyID ?? null;
  const adminUserId = Number(session.sub);
  const hasCompany = adminCompanyId !== null && adminCompanyId !== undefined;
  const scopeParams = hasCompany ? [adminCompanyId, adminUserId] : [adminUserId];
  const userScope = scopedUserClause("u", hasCompany);
  const saleUserScope = scopedUserClause("sale_user", hasCompany);

  const [summaryRows] = await db.execute<RowDataPacket[]>(
    `SELECT
      (SELECT COUNT(*) FROM users u WHERE ${userScope}) users,
      (SELECT COUNT(*) FROM leads l JOIN users u ON u.id=l.affiliate_user_id WHERE ${userScope} AND l.${rangeCondition}) clients,
      (SELECT COUNT(*) FROM demo_requests d JOIN users u ON u.id=d.affiliate_user_id WHERE ${userScope} AND d.${rangeCondition}) demos,
      (SELECT COUNT(*) FROM quotes q JOIN users u ON u.id=q.affiliate_user_id WHERE ${userScope} AND q.${rangeCondition}) quotes,
      (SELECT COUNT(*) FROM sales s JOIN users u ON u.id=s.affiliate_user_id WHERE ${userScope} AND s.${rangeCondition}) sales,
      (SELECT COUNT(*) FROM support_tickets t JOIN users u ON u.id=t.user_id WHERE ${userScope} AND t.status IN ('open','in_progress') AND t.${rangeCondition}) openTickets,
      (SELECT COUNT(*) FROM quotes q JOIN users u ON u.id=q.affiliate_user_id WHERE ${userScope} AND q.status IN ('draft', 'sent', 'accepted') AND q.${rangeCondition}) openQuotes,
      (SELECT COUNT(*) FROM sales s JOIN users u ON u.id=s.affiliate_user_id WHERE ${userScope} AND s.status = 'pending' AND s.${rangeCondition}) uncreatedSalesCommissions,
      (SELECT COUNT(*) FROM commissions c JOIN users u ON u.id=c.affiliate_user_id JOIN sales s ON s.id=c.sale_id JOIN users sale_user ON sale_user.id=s.affiliate_user_id WHERE ${userScope} AND ${saleUserScope} AND c.status = 'pending' AND c.${rangeCondition}) invisibleCommissions,
      (SELECT COUNT(*) FROM commissions c JOIN users u ON u.id=c.affiliate_user_id JOIN sales s ON s.id=c.sale_id JOIN users sale_user ON sale_user.id=s.affiliate_user_id WHERE ${userScope} AND ${saleUserScope} AND c.status <> 'paid' AND c.${rangeCondition}) unpaidCommissions`,
    [
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
      ...scopeParams,
    ],
  );
  const summary = summaryRows[0] ?? {};

  const metricQueries: Record<string, string> = {
    users: `SELECT ${periodExpression.replaceAll("created_at", "u.created_at")} day, COUNT(*) total FROM users u WHERE ${userScope} AND u.${rangeCondition} GROUP BY ${periodExpression.replaceAll("created_at", "u.created_at")} ORDER BY day`,
    clients: `SELECT ${periodExpression.replaceAll("created_at", "l.created_at")} day, COUNT(*) total FROM leads l JOIN users u ON u.id=l.affiliate_user_id WHERE ${userScope} AND l.${rangeCondition} GROUP BY ${periodExpression.replaceAll("created_at", "l.created_at")} ORDER BY day`,
    demos: `SELECT ${periodExpression.replaceAll("created_at", "d.created_at")} day, COUNT(*) total FROM demo_requests d JOIN users u ON u.id=d.affiliate_user_id WHERE ${userScope} AND d.${rangeCondition} GROUP BY ${periodExpression.replaceAll("created_at", "d.created_at")} ORDER BY day`,
    quotes: `SELECT ${periodExpression.replaceAll("created_at", "q.created_at")} day, COUNT(*) total FROM quotes q JOIN users u ON u.id=q.affiliate_user_id WHERE ${userScope} AND q.${rangeCondition} GROUP BY ${periodExpression.replaceAll("created_at", "q.created_at")} ORDER BY day`,
    sales: `SELECT ${periodExpression.replaceAll("created_at", "s.created_at")} day, COUNT(*) total FROM sales s JOIN users u ON u.id=s.affiliate_user_id WHERE ${userScope} AND s.${rangeCondition} GROUP BY ${periodExpression.replaceAll("created_at", "s.created_at")} ORDER BY day`,
  };

  const seriesEntries: Array<
    readonly [string, Array<{ date: string; value: number }>]
  > = [];
  for (const [key, query] of Object.entries(metricQueries)) {
    const [rows] = await db.execute<ActivityRow[]>(query, scopeParams);
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
