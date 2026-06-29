"use server";

import { redirect } from "next/navigation";

import { authenticateUser, createSession, deleteSession } from "@/lib/auth";

export type SignInState = { error?: string };

const signInMessages = {
  missing: "\u0623\u062f\u062e\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.",
  busy: "\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u0634\u063a\u0648\u0644\u0629 \u062d\u0627\u0644\u064a\u064b\u0627. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0628\u0639\u062f \u0644\u062d\u0638\u0627\u062a.",
  invalid: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062f\u062e\u0648\u0644 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629 \u0623\u0648 \u0627\u0644\u062d\u0633\u0627\u0628 \u063a\u064a\u0631 \u0646\u0634\u0637.",
};

export async function signInAction(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!identifier || !password) {
    return {
      error: locale === "ar" ? signInMessages.missing : "Enter your email and password.",
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
            ? signInMessages.busy
            : "The database is currently busy. Please try again shortly.",
      };
    }

    throw error;
  }

  if (!user) {
    return {
      error:
        locale === "ar"
          ? signInMessages.invalid
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
