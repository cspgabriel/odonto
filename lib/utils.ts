import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize PostgreSQL/database error code to string for comparison.
 * Drivers may return codes as numbers (e.g. 57014); comparing to "57014" fails unless coerced.
 */
export function getDbErrorCode(err: unknown): string {
  if (err == null || typeof err !== "object" || !("code" in err)) return "";
  return String((err as { code: unknown }).code);
}

/** Get initials from a name (e.g. "John Doe" -> "JD") */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
