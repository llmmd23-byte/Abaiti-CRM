import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getProfile, updateProfile} from "@/lib/backend";

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  return NextResponse.json({data: await getProfile(session)});
}

export async function PUT(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    return NextResponse.json({data: await updateProfile(session, await request.json())});
  } catch (error) {
    return apiError(error);
  }
}
