import {readFile} from "node:fs/promises";
import path from "node:path";

import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getResource} from "@/lib/backend";

type Context = {params: Promise<{id: string}>};

function contentDispositionName(value: unknown) {
  return String(value ?? "marketing-file")
    .replace(/[^\x20-\x7E]+/g, "-")
    .replace(/["\\\r\n]/g, "")
    .trim() || "marketing-file";
}

function encodedContentDispositionName(value: unknown) {
  return encodeURIComponent(String(value ?? "marketing-file").replace(/[\r\n]/g, ""));
}

function safePublicPath(root: string, relativeName: string) {
  if (!relativeName) return null;
  const resolved = path.resolve(root, relativeName);
  const safeRoot = path.resolve(root);
  if (resolved !== safeRoot && !resolved.startsWith(`${safeRoot}${path.sep}`)) return null;
  return resolved;
}

function marketingAssetPath(value: unknown) {
  const normalized = String(value ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) return null;

  const uploadRoot = path.join(process.cwd(), "public", "marketing-library");
  const relativePath = normalized.startsWith("public/marketing-library/")
    ? normalized.slice("public/marketing-library/".length)
    : path.posix.basename(normalized);
  return safePublicPath(uploadRoot, relativePath);
}

async function readMarketingAssetFile(asset: Record<string, unknown>) {
  const candidates = [
    marketingAssetPath(asset.file_path),
    safePublicPath(
      path.join(process.cwd(), "public", "landing-pages"),
      path.posix.basename(String(asset.original_name ?? "")),
    ),
    String(asset.mime_type ?? "").includes("pdf")
      ? safePublicPath(
          path.join(process.cwd(), "public", "landing-pages"),
          "coffee-chocolate-expo-2026-v2.pdf",
        )
      : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return await readFile(candidate);
    } catch {
      // Try the next known public location.
    }
  }
  return null;
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

    const buffer = await readMarketingAssetFile(asset);
    if (!buffer) {
      return NextResponse.json({error: "FILE_NOT_FOUND"}, {status: 404});
    }
    const headers = new Headers();
    headers.set("Content-Type", String(asset.mime_type ?? "application/octet-stream"));
    headers.set("Content-Length", String(buffer.byteLength));
    headers.set(
      "Content-Disposition",
      `inline; filename="${contentDispositionName(asset.original_name)}"; filename*=UTF-8''${encodedContentDispositionName(asset.original_name)}`,
    );
    return new NextResponse(buffer, {headers});
  } catch (error) {
    return apiError(error);
  }
}
