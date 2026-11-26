/**
 * Certificate codes: 14 random characters from Crockford's Base32 alphabet.
 *
 * - 32 symbols (0-9, A-Z without I, L, O, U) → 5 bits each → 70 bits of randomness.
 *   Guessing a valid code is practically impossible, so the code itself is the secret.
 * - No look-alike characters, and typing mistakes are forgiven on input
 *   (lowercase, spaces, dashes, I/L→1, O→0).
 * - Safe to import in the browser and on the server (uses Web Crypto).
 */

export const CODE_LENGTH = 14;
export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  // 256 is a multiple of 32, so `byte & 31` is perfectly uniform (no modulo bias).
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] & 31];
  return out;
}

/** A new random 14-character certificate code, e.g. "7KQ2M9XRBWD4TH". */
export function generateCertificateCode(): string {
  return randomChars(CODE_LENGTH);
}

/** Uppercases and strips separators; maps look-alikes to their canonical symbol. */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
}

export function isValidCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return false;
  return true;
}

/** "7KQ2M9XRBWD4TH" → "7KQ2M9X-RBWD4TH" (two groups of seven, easier to read aloud). */
export function formatCode(code: string): string {
  const c = normalizeCode(code);
  return c.length === CODE_LENGTH ? `${c.slice(0, 7)}-${c.slice(7)}` : c;
}

/** Order numbers shown to customers, e.g. "KS-4Q7M2X". */
export function generateOrderNumber(): string {
  return `KS-${randomChars(6)}`;
}

/** Booking references, e.g. "BK-7HX2QM4D". */
export function generateBookingReference(): string {
  return `BK-${randomChars(8)}`;
}
