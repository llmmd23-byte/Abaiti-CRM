import {randomUUID} from "crypto";
import {mkdir, writeFile} from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {updateLicenseFile} from "@/lib/backend";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx"]);

export async function POST(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE) {
      throw new Error("VALIDATION_ERROR");
    }

    const extension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.has(extension)) throw new Error("VALIDATION_ERROR");

    const baseName = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60) || "license";
    const fileName = `${session.sub}-${Date.now()}-${baseName}-${randomUUID().slice(0, 8)}${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "licenses");
    await mkdir(uploadDirectory, {recursive: true});
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));

    const fileUrl = `/uploads/licenses/${fileName}`;
    return NextResponse.json({data: await updateLicenseFile(session, fileUrl)});
  } catch (error) {
    return apiError(error);
  }
}
