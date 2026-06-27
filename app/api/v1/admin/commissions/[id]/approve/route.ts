import {NextResponse} from "next/server";
import type {ResultSetHeader} from "mysql2";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {hasPermission} from "@/lib/permissions";

export async function PUT(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (session.role !== "admin") return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.commissions", "can_approve")))
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({error: "INVALID_ID"}, {status: 422});

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE commissions SET status='approved', approved_at=NOW() WHERE id=? AND status='pending'",
    [id]
  );
  if (!result.affectedRows) return NextResponse.json({error: "COMMISSION_NOT_PENDING"}, {status: 409});
  return NextResponse.json({ok: true});
}
