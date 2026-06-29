import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {deleteUserPayoutMethod, updateUserPayoutMethod} from "@/lib/backend";

type Context = {params: Promise<{id: string}>};

export async function PUT(request: Request, {params}: Context) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const {id} = await params;
    return NextResponse.json({data: await updateUserPayoutMethod(session, Number(id), await request.json())});
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, {params}: Context) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const {id} = await params;
    return NextResponse.json({data: await deleteUserPayoutMethod(session, Number(id))});
  } catch (error) {
    return apiError(error);
  }
}
