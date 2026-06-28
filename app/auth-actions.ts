"use server";

import { redirect } from "next/navigation";

import { authenticateUser, createSession, deleteSession } from "@/lib/auth";

export type SignInState = { error?: string };

export async function signInAction(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!identifier || !password) {
    return {
      error:
        locale === "ar"
          ? "أدخل البريد الإلكتروني وكلمة المرور."
          : "Enter your email and password.",
    };
  }

  let user: Awaited<ReturnType<typeof authenticateUser>>;
  try {
    user = await authenticateUser(identifier, password);
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";

    if (code === "ER_CON_COUNT_ERROR") {
      return {
        error:
          locale === "ar"
            ? "قاعدة البيانات مشغولة حاليًا. يرجى المحاولة مرة أخرى بعد لحظات."
            : "The database is currently busy. Please try again shortly.",
      };
    }

    throw error;
  }

  if (!user) {
    return {
      error:
        locale === "ar"
          ? "بيانات الدخول غير صحيحة أو الحساب غير نشط."
          : "Invalid credentials or inactive account.",
    };
  }

  await createSession(user, formData.get("remember") === "on");
  redirect(user.role === "admin" ? `/${locale}/admin` : `/${locale}/dashboard`);
}

export async function signOutAction(formData: FormData) {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  await deleteSession();
  redirect(`/${locale}/signin`);
}
