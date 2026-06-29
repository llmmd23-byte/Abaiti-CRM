import {NextResponse} from "next/server";

import {authenticateUser, createSession} from "@/lib/auth";

export async function POST(request: Request) {
  let body: {email?: string; password?: string; remember?: boolean};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: "INVALID_JSON"}, {status: 400});
  }

  const identifier = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!identifier || !password) {
    return NextResponse.json({error: "EMAIL_AND_PASSWORD_REQUIRED"}, {status: 422});
  }

  const user = await authenticateUser(identifier, password);
  if (!user) return NextResponse.json({error: "INVALID_CREDENTIALS"}, {status: 401});

  await createSession(user, body.remember === true);
  return NextResponse.json({
    data: {
      userid: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferred_locale: user.preferred_locale,
      redirect_to: user.role === "admin" ? `/${user.preferred_locale}/admin` : `/${user.preferred_locale}/dashboard`
    }
  });
}
