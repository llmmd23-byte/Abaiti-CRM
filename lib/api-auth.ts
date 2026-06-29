import "server-only";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function apiSession() {
  const session = await getSession();
  return (
    session ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  );
}

export function apiError(error: unknown) {
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const known = [
    "NOT_FOUND",
    "FORBIDDEN",
    "UNKNOWN_RESOURCE",
    "EMPTY_PAYLOAD",
    "READ_ONLY_RESOURCE",
    "VALIDATION_ERROR",
    "DUPLICATE_PHONE",
    "DUPLICATE_CUSTOMER_QUOTE",
    "PRODUCT_IN_USE",
    "INDUSTRY_IN_USE",
  ];
  const publicCode = known.includes(code) ? code : "INTERNAL_ERROR";
  const status =
    code === "NOT_FOUND"
      ? 404
      : code === "FORBIDDEN"
        ? 403
        : ["PRODUCT_IN_USE", "INDUSTRY_IN_USE"].includes(code)
          ? 409
          : [
                "UNKNOWN_RESOURCE",
                "EMPTY_PAYLOAD",
                "READ_ONLY_RESOURCE",
                "VALIDATION_ERROR",
                "DUPLICATE_PHONE",
                "DUPLICATE_CUSTOMER_QUOTE",
              ].includes(code)
            ? 422
            : 500;
  if (status === 500) console.error("BACKEND_API_ERROR", error);
  return NextResponse.json({ error: publicCode }, { status });
}
