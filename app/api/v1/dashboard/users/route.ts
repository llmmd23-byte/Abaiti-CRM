import { NextResponse } from "next/server";

import { apiError, apiSession } from "@/lib/api-auth";
import { listDashboardUsers } from "@/lib/backend";

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    return NextResponse.json({ data: await listDashboardUsers(session) });
  } catch (error) {
    return apiError(error);
  }
}
