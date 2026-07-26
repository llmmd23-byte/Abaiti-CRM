import {randomUUID} from "crypto";
import {mkdir, writeFile} from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {getProfile, updateSkillProofFiles} from "@/lib/backend";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function storedFiles(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;

  try {
    const profile = await getProfile(session);
    const existingFiles = storedFiles(profile?.skills_proof_files);
    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (!files.length || existingFiles.length + files.length > 8) throw new Error("VALIDATION_ERROR");

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "skill-proofs");
    await mkdir(uploadDirectory, {recursive: true});
    const uploadedFiles: string[] = [];

    for (const file of files) {
      const extension = path.extname(file.name).toLowerCase();
      if (!allowedExtensions.has(extension) || file.size > MAX_FILE_SIZE) throw new Error("VALIDATION_ERROR");
      const fileName = `${session.sub}-${Date.now()}-${randomUUID().slice(0, 10)}${extension}`;
      await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));
      uploadedFiles.push(`/uploads/skill-proofs/${fileName}`);
    }

    return NextResponse.json({data: await updateSkillProofFiles(session, [...existingFiles, ...uploadedFiles])});
  } catch (error) {
    return apiError(error);
  }
}
