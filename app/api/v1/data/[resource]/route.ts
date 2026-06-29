import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {createResource, listResource} from "@/lib/backend";

export async function GET(_request: Request, {params}: {params: Promise<{resource: string}>}) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    return NextResponse.json({data: await listResource((await params).resource, session)});
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, {params}: {params: Promise<{resource: string}>}) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const payload = await request.json();
    const data = await createResource((await params).resource, payload, session);
    return NextResponse.json({data}, {status: 201});
  } catch (error) {
    return apiError(error);
  }
}
