function normalizeOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.origin;
  } catch {
    return undefined;
  }
}

export function getBrowserAppOrigin(): string {
  return normalizeOrigin(import.meta.env.VITE_APP_URL) ?? window.location.origin;
}

export function getServerAppOrigin(requestUrl: string): string {
  const configured =
    normalizeOrigin(process.env.APP_URL) ??
    normalizeOrigin(process.env.VITE_APP_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL);

  return configured ?? new URL(requestUrl).origin;
}
