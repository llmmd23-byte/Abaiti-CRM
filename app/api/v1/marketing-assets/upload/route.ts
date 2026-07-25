import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {createResource} from "@/lib/backend";
import {isAdminSession} from "@/lib/auth";

const uploadRoot = path.join(process.cwd(), "public", "marketing-library");

function assetTypeFor(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (
    file.type.includes("pdf") ||
    file.type.includes("document") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("presentation") ||
    file.type.startsWith("text/")
  ) {
    return "document";
  }
  return "other";
}

function safeFilePart(value: string) {
  return value
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "file";
}

export async function POST(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (!isAdminSession(session)) {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }
  try {
    const form = await request.formData();
    const fileValue = form.get("file");
    if (!(fileValue instanceof File) || fileValue.size === 0) {
      return NextResponse.json({error: "VALIDATION_ERROR"}, {status: 422});
    }

    await mkdir(uploadRoot, {recursive: true});
    const originalName = fileValue.name || "marketing-file";
    const storedName = `${Date.now()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}-${safeFilePart(originalName)}`;
    const filePath = path.join(uploadRoot, storedName);
    const buffer = Buffer.from(await fileValue.arrayBuffer());
    await writeFile(filePath, buffer);

    const title = String(form.get("title") ?? "").trim() || originalName;
    const description = String(form.get("description") ?? "").trim();
    const data = await createResource(
      "marketing-assets",
      {
        title,
        asset_type: assetTypeFor(fileValue),
        original_name: originalName,
        mime_type: fileValue.type || null,
        file_size: fileValue.size,
        file_path: path.relative(process.cwd(), filePath),
        file_data: buffer,
        description: description || null,
      },
      session,
    );

    return NextResponse.json({data}, {status: 201});
  } catch (error) {
    return apiError(error);
  }
}
