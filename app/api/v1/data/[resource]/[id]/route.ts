import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {deleteResource, getResource, updateResource} from "@/lib/backend";

type Context = {params: Promise<{resource: string; id: string}>};

export async function GET(_request: Request, {params}: Context) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const {resource, id} = await params;
    const data = await getResource(resource, Number(id), session);
    return data ? NextResponse.json({data}) : NextResponse.json({error: "NOT_FOUND"}, {status: 404});
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, {params}: Context) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const {resource, id} = await params;
    return NextResponse.json({data: await updateResource(resource, Number(id), await request.json(), session)});
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, {params}: Context) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const {resource, id} = await params;
    await deleteResource(resource, Number(id), session);
    return NextResponse.json({success: true});
  } catch (error) {
    return apiError(error);
  }
}
