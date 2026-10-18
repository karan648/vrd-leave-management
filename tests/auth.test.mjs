import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedKey = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, derivedKey);
}

function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

test("Password hashing and verification should succeed with correct password", () => {
  const password = "SuperSecretPassword123!";
  const hash = hashPassword(password);

  assert.equal(typeof hash, "string");
  assert.ok(hash.includes(":"));
  assert.equal(verifyPassword(password, hash), true);
});

test("Password verification should fail with incorrect password", () => {
  const password = "CorrectPassword123";
  const hash = hashPassword(password);

  assert.equal(verifyPassword("WrongPassword456", hash), false);
});

test("Random password generator produces expected length and entropy", () => {
  const pwd1 = generateRandomPassword(14);
  const pwd2 = generateRandomPassword(14);

  assert.equal(pwd1.length, 14);
  assert.equal(pwd2.length, 14);
  assert.notEqual(pwd1, pwd2);
});
