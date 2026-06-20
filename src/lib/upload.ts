import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a list of files to a Supabase storage bucket under the user's folder
 * and returns the public URLs (buckets have a public-read RLS policy).
 */
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
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
