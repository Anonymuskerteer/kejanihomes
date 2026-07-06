import { supabase } from "@/integrations/supabase/client";

// 10 years — buckets are private, so we bake a long-lived signed URL into the row.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

export async function uploadFiles(
  bucket: "property-images" | "review-photos",
  userId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signErr || !data?.signedUrl) throw signErr ?? new Error("Could not sign URL");
    urls.push(data.signedUrl);
  }
  return urls;
}
