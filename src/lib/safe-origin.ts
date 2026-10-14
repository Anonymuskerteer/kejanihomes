// Only links pointing at Kejani Homes' own sites are ever put in emails.
const PUBLISHED = "https://kejanihomes.lovable.app";
export function safeOrigin(requestUrl: string): string {
  try {
    const { origin, hostname } = new URL(requestUrl);
    if (
      hostname === "kejanihomes.lovable.app" ||
      hostname === "localhost" ||
      (hostname.endsWith(".lovable.app") && hostname.includes("15ce9a27-1e71-48ed-a280-e83d73da1fbe"))
    )
      return origin;
  } catch {
    /* fall through */
  }
  return PUBLISHED;
}
