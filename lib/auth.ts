import "server-only";

import bcrypt from "bcryptjs";
import {createHash, timingSafeEqual} from "node:crypto";
import {SignJWT, jwtVerify, type JWTPayload} from "jose";
import {cookies} from "next/headers";
import type {RowDataPacket} from "mysql2";

import {db} from "@/lib/db";

export const AUTH_COOKIE = "middar_session";

type UserRole = "admin" | "affiliate" | "sales" | "support";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  username: string | null;
  password_hash: string;
  role: UserRole;
  status: "active" | "inactive" | "pending" | "suspended";
  is_active: number;
  preferred_locale: "ar" | "en";
}

export interface MiddarSession extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

const jwtSecret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
};

async function verifyPassword(password: string, storedHash: string) {
  if (/^\$2[aby]\$/.test(storedHash)) return bcrypt.compare(password, storedHash);

  if (/^[a-f\d]{64}$/i.test(storedHash)) {
    const calculated = createHash("sha256").update(password, "utf8").digest();
    const expected = Buffer.from(storedHash, "hex");
    return calculated.length === expected.length && timingSafeEqual(calculated, expected);
  }

  return false;
}

export async function authenticateUser(identifier: string, password: string) {
  const [rows] = await db.execute<UserRow[]>(
    `SELECT u.id, u.name, u.email, u.username, u.password_hash,
            COALESCE(r.slug, 'affiliate') AS role,
            u.status, u.is_active, u.preferred_locale
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.username) = LOWER(?)
      LIMIT 1`,
    [identifier, identifier]
  );

  const user = rows[0];
  if (!user || Number(user.is_active) !== 1) return null;
  if (!(await verifyPassword(password, user.password_hash))) return null;

  await db.execute("UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [user.id]);
  return user;
}

export async function createSession(user: UserRow, remember: boolean) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role
  })
    .setProtectedHeader({alg: "HS256", typ: "JWT"})
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(jwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });
}

export async function getSession(): Promise<MiddarSession | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const {payload} = await jwtVerify(token, jwtSecret(), {algorithms: ["HS256"]});
    return payload as MiddarSession;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(AUTH_COOKIE);
}
