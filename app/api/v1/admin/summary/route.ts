import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDataScope, hasPermission } from "@/lib/permissions";

type CountRow = RowDataPacket & { total: number };
type ActivityRow = RowDataPacket & { day: string; total: number };

function scopedUserClause(alias: string, isGlobal: boolean, hasCompany: boolean) {
  if (isGlobal) return "1=1";
  return hasCompany
    ? `(${alias}.CompanyID = ? OR ${alias}.id = ?)`
    : `${alias}.id = ?`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdminSession(session))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "page.admin.dashboard", "can_view")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const requestedPeriod = new URL(request.url).searchParams.get("period");
  const requestedGroup = new URL(request.url).searchParams.get("group");
  const requestedAnchor = new URL(request.url).searchParams.get("anchor");
  const requestedUserId = new URL(request.url).searchParams.get("user_id");
  const period =
    requestedPeriod === "all" ||
    requestedPeriod === "day" ||
    requestedPeriod === "week" ||
    requestedPeriod === "month" ||
    requestedPeriod === "year"
      ? requestedPeriod
      : "all";
  const group =
    requestedGroup === "days" ||
    requestedGroup === "weeks" ||
    requestedGroup === "months" ||
    requestedGroup === "quarters"
      ? requestedGroup
      : period === "year"
        ? "months"
        : period === "month"
          ? "weeks"
          : "days";
  const anchor =
    requestedAnchor && /^\d{4}-\d{2}-\d{2}$/.test(requestedAnchor)
      ? requestedAnchor
      : new Date().toISOString().slice(0, 10);
  const baseRangeCondition =
    period === "all"
      ? "created_at IS NOT NULL"
      : period === "day"
      ? `created_at >= DATE('${anchor}') AND created_at < DATE('${anchor}') + INTERVAL 1 DAY`
      : period === "month"
        ? `created_at >= DATE_FORMAT(DATE('${anchor}'), '%Y-%m-01') AND created_at < DATE_FORMAT(DATE('${anchor}') + INTERVAL 1 MONTH, '%Y-%m-01')`
        : period === "year"
          ? `created_at >= DATE_FORMAT(DATE('${anchor}'), '%Y-01-01') AND created_at < DATE_FORMAT(DATE('${anchor}') + INTERVAL 1 YEAR, '%Y-01-01')`
          : `created_at >= DATE('${anchor}') - INTERVAL 6 DAY AND created_at < DATE('${anchor}') + INTERVAL 1 DAY`;
  const rangeConditionFor = (alias: string) =>
    baseRangeCondition.replaceAll("created_at", `${alias}.created_at`);
  const periodExpression =
    period === "day"
      ? "DATE_FORMAT(created_at, '%H')"
      : period === "year"
        ? group === "quarters"
          ? "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))"
          : "DATE_FORMAT(created_at, '%Y-%m')"
        : period === "month"
          ? group === "days"
            ? "DATE_FORMAT(created_at, '%Y-%m-%d')"
            : "CONCAT('week-', CEIL(DAYOFMONTH(created_at) / 7))"
          : period === "all"
            ? "DATE_FORMAT(created_at, '%Y-%m')"
            : "DATE_FORMAT(created_at, '%Y-%m-%d')";

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const adminCompanyId = adminRows[0]?.CompanyID ?? null;
  const adminUserId = Number(session.sub);
  const dashboardScope = await getDataScope(session, "page.admin.dashboard");
  const isGlobalDashboard = dashboardScope === "all";
  const hasCompany = adminCompanyId !== null && adminCompanyId !== undefined;
  const scopeParams = isGlobalDashboard
    ? []
    : hasCompany
      ? [adminCompanyId, adminUserId]
      : [adminUserId];
  const userScope = scopedUserClause("u", isGlobalDashboard, hasCompany);
  const saleUserScope = scopedUserClause("sale_user", isGlobalDashboard, hasCompany);
  const selectedUserId =
    requestedUserId && /^\d+$/.test(requestedUserId)
      ? Number(requestedUserId)
      : null;
  const selectedUserScope = selectedUserId ? " AND u.id = ?" : "";
  const selectedSaleUserScope = selectedUserId ? " AND sale_user.id = ?" : "";
  const scopedParams = () =>
    selectedUserId ? [...scopeParams, selectedUserId] : [...scopeParams];
  const commissionParams = () =>
    selectedUserId
      ? [...scopeParams, selectedUserId, ...scopeParams, selectedUserId]
      : [...scopeParams, ...scopeParams];

  const [summaryRows] = await db.execute<RowDataPacket[]>(
    `SELECT
      (SELECT COUNT(*) FROM users u WHERE ${userScope}${selectedUserScope}) users,
      (SELECT COUNT(*) FROM leads l JOIN users u ON u.id=l.affiliate_user_id WHERE ${userScope}${selectedUserScope}) clients,
      (SELECT COUNT(*) FROM demo_requests d JOIN users u ON u.id=d.affiliate_user_id WHERE ${userScope}${selectedUserScope}) demos,
      (SELECT COUNT(*) FROM quotes q JOIN users u ON u.id=q.affiliate_user_id WHERE ${userScope}${selectedUserScope}) quotes,
      (SELECT COUNT(*) FROM sales s JOIN users u ON u.id=s.affiliate_user_id WHERE ${userScope}${selectedUserScope}) sales,
      (SELECT COUNT(*) FROM support_tickets t JOIN users u ON u.id=t.user_id WHERE ${userScope}${selectedUserScope} AND t.status IN ('open','in_progress')) openTickets,
      (SELECT COUNT(*) FROM quotes q JOIN users u ON u.id=q.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND q.status IN ('draft', 'sent', 'accepted')) openQuotes,
      (SELECT COUNT(*) FROM sales s JOIN users u ON u.id=s.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND s.status = 'pending') uncreatedSalesCommissions,
      (SELECT COUNT(*) FROM commissions c JOIN users u ON u.id=c.affiliate_user_id JOIN sales s ON s.id=c.sale_id JOIN users sale_user ON sale_user.id=s.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND ${saleUserScope}${selectedSaleUserScope} AND c.status = 'pending') invisibleCommissions,
      (SELECT COUNT(*) FROM commissions c JOIN users u ON u.id=c.affiliate_user_id JOIN sales s ON s.id=c.sale_id JOIN users sale_user ON sale_user.id=s.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND ${saleUserScope}${selectedSaleUserScope} AND c.status <> 'paid') unpaidCommissions`,
    [...scopedParams(), ...commissionParams()],
  );
  const summary = summaryRows[0] ?? {};

  const metricQueries: Record<string, string> = {
    users: `SELECT ${periodExpression.replaceAll("created_at", "u.created_at")} day, COUNT(*) total FROM users u WHERE ${userScope}${selectedUserScope} AND ${rangeConditionFor("u")} GROUP BY ${periodExpression.replaceAll("created_at", "u.created_at")} ORDER BY day`,
    clients: `SELECT ${periodExpression.replaceAll("created_at", "l.created_at")} day, COUNT(*) total FROM leads l JOIN users u ON u.id=l.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND ${rangeConditionFor("l")} GROUP BY ${periodExpression.replaceAll("created_at", "l.created_at")} ORDER BY day`,
    demos: `SELECT ${periodExpression.replaceAll("created_at", "d.created_at")} day, COUNT(*) total FROM demo_requests d JOIN users u ON u.id=d.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND ${rangeConditionFor("d")} GROUP BY ${periodExpression.replaceAll("created_at", "d.created_at")} ORDER BY day`,
    quotes: `SELECT ${periodExpression.replaceAll("created_at", "q.created_at")} day, COUNT(*) total FROM quotes q JOIN users u ON u.id=q.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND ${rangeConditionFor("q")} GROUP BY ${periodExpression.replaceAll("created_at", "q.created_at")} ORDER BY day`,
    sales: `SELECT ${periodExpression.replaceAll("created_at", "s.created_at")} day, COUNT(*) total FROM sales s JOIN users u ON u.id=s.affiliate_user_id WHERE ${userScope}${selectedUserScope} AND ${rangeConditionFor("s")} GROUP BY ${periodExpression.replaceAll("created_at", "s.created_at")} ORDER BY day`,
  };

  const seriesEntries: Array<
    readonly [string, Array<{ date: string; value: number }>]
  > = [];
  for (const [key, query] of Object.entries(metricQueries)) {
    const [rows] = await db.execute<ActivityRow[]>(query, scopedParams());
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
      group,
      anchor,
      series: Object.fromEntries(seriesEntries),
    },
  });
}
