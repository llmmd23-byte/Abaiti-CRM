import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {createUserPayoutMethod, getUserPayoutMethods} from "@/lib/backend";

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  return NextResponse.json({data: await getUserPayoutMethods(session)});
}

export async function POST(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    return NextResponse.json({data: await createUserPayoutMethod(session, await request.json())});
  } catch (error) {
    return apiError(error);
  }
}
