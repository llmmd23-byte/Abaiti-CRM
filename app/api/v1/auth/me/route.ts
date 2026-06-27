import {NextResponse} from "next/server";

import {getSession} from "@/lib/auth";
import {getProfile} from "@/lib/backend";
import {getSessionPermissions} from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  const [profile, permissions] = await Promise.all([
    getProfile(session),
    getSessionPermissions(session),
  ]);

  return NextResponse.json({
    data: {
      userid: Number(session.sub),
      name: String(profile?.name ?? session.name),
      email: session.email,
      role: session.role,
      permissions,
      level: String(profile?.level ?? "\u0645\u0628\u062a\u062f\u0626"),
      status: String(profile?.status ?? "inactive")
    }
  });
}
