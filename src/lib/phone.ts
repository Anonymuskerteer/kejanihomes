// Kenyan phone helpers: accepts 07XXXXXXXX, 010XXXXXXX, 011XXXXXXX, 254…, +254…
export function normalizeKePhone(input: string | null | undefined): string | null {
  const d = (input ?? "").replace(/[^\d+]/g, "").replace(/^(\+?254|0)/, "");
  return /^(7\d{8}|1[01]\d{7})$/.test(d) ? `+254${d}` : null;
}

export const isKePhone = (input: string) => normalizeKePhone(input) !== null;

/** WhatsApp wa.me digits, e.g. 2547XXXXXXXX */
export const waDigits = (input: string | null | undefined) => normalizeKePhone(input)?.slice(1) ?? null;

/** Internal login identifier used when a user signs up without an email. */
export const phoneAuthEmail = (e164: string) => `${e164.slice(1)}@phone.kejanihomes.ke`;
export const isPhoneAuthEmail = (email: string | null | undefined) => !!email?.endsWith("@phone.kejanihomes.ke");
