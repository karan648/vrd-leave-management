// =============================================================================
// VRD Exports — Basic Authentication Utilities
// =============================================================================
// Uses Node.js built-in crypto.scrypt for password hashing (no external deps).
// Session management via signed HTTP-only cookies.
// =============================================================================

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Password Hashing (scrypt — Node.js built-in, no bcrypt dependency needed)
// ---------------------------------------------------------------------------

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(hashBuffer, derivedKey);
}

export function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// ---------------------------------------------------------------------------
// Session Management (simple signed cookie)
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "vrd_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "vrd-exports-dev-secret-change-in-production";

function signToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const sig = scryptSync(payload + SESSION_SECRET, "vrd-session-salt", 32).toString("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 3) return null;
    const sig = parts.pop()!;
    const payload = parts.join(":");
    const expectedSig = scryptSync(payload + SESSION_SECRET, "vrd-session-salt", 32).toString("hex");
    if (sig !== expectedSig) return null;
    // Extract userId (first part)
    return parts[0];
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = signToken(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  
  const userId = verifyToken(token);
  if (!userId) return null;
  
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
    },
  });
  
  if (!user || !user.isActive) return null;
  return user;
}

// ---------------------------------------------------------------------------
// Auth check for API routes
// ---------------------------------------------------------------------------

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return { authenticated: false as const, user: null };
  }
  return { authenticated: true as const, user };
}
