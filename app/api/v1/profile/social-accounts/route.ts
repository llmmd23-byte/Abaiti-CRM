import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getUserSocialAccounts, saveUserSocialAccounts} from "@/lib/backend";

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  return NextResponse.json({data: await getUserSocialAccounts(session)});
}

export async function PUT(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    return NextResponse.json({data: await saveUserSocialAccounts(session, await request.json())});
  } catch (error) {
    return apiError(error);
  }
}
