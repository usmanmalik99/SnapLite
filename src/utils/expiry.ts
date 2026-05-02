// src/utils/expiry.ts
export type ExpiryMode = "view_once" | "24h" | "7d";

export function calcExpiresAt(mode: ExpiryMode, from: Date = new Date()): Date {
  const base = from.getTime();

  if (mode === "24h") return new Date(base + 24 * 60 * 60 * 1000);
  if (mode === "7d") return new Date(base + 7 * 24 * 60 * 60 * 1000);

  // view_once: we still set something (example: 5 minutes) until you implement "delete after viewed"
  return new Date(base + 5 * 60 * 1000);
}

export function isExpired(expiresAt?: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now();
}
