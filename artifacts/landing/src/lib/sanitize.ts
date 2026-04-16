/**
 * sanitize.ts
 * Input sanitization utilities to prevent XSS and injection attacks.
 */

/**
 * Strips all HTML tags from a string.
 * Use before rendering any user-provided text as HTML.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Encodes HTML special characters to prevent XSS when injecting into HTML.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes a URL to ensure it only uses http/https protocols.
 * Returns an empty string for dangerous protocols like javascript:
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return url;
  } catch {
    return "";
  }
}

/**
 * Validates that an email is properly formatted.
 */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/**
 * Validates password strength: min 8 chars, at least 1 letter and 1 number.
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters." };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, message: "Password must contain at least one letter." };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least one number." };
  return { valid: true, message: "" };
}

/**
 * Trims and normalizes a user-input string.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return stripHtml(input.trim()).slice(0, 2000);
}
