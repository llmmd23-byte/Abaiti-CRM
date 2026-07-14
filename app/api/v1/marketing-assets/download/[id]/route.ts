import {readFile} from "node:fs/promises";
import path from "node:path";

import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getResource} from "@/lib/backend";

type Context = {params: Promise<{id: string}>};

function contentDispositionName(value: unknown) {
  return String(value ?? "marketing-file").replace(/["\r\n]/g, "");
}

function marketingAssetPath(value: unknown) {
  const fileName = path.basename(String(value ?? ""));
  if (!fileName) return null;
  return path.join(process.cwd(), "public", "marketing-library", fileName);
}

export async function GET(_request: Request, {params}: Context) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  try {
    const {id} = await params;
    const asset = await getResource("marketing-assets", Number(id), session);
    if (!asset) {
      return NextResponse.json({error: "NOT_FOUND"}, {status: 404});
    }

    const filePath = marketingAssetPath(asset.file_path);
    if (!filePath) {
      return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
    }

    const buffer = await readFile(filePath);
    const headers = new Headers();
    headers.set("Content-Type", String(asset.mime_type ?? "application/octet-stream"));
    headers.set(
      "Content-Disposition",
      `attachment; filename="${contentDispositionName(asset.original_name)}"`,
    );
    headers.set("Content-Length", String(buffer.byteLength));
    return new NextResponse(buffer, {headers});
  } catch (error) {
    return apiError(error);
  }
}
