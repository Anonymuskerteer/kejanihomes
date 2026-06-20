import { useState } from "react";
import { Star, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadFiles } from "@/lib/upload";

interface Props {
  propertyId: string;
  userId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ propertyId, userId, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 6));
    e.target.value = "";
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return toast.error("Please choose a star rating");
    if (comment.trim().length < 10) return toast.error("Add at least 10 characters of feedback");
    if (files.length < 1) return toast.error("Please attach at least one photo with your review");
    setBusy(true);
    try {
      const photos = await uploadFiles("review-photos", userId, files);
      const { error } = await supabase.from("reviews").upsert(
        {
          property_id: propertyId,
          user_id: userId,
          rating,
          comment: comment.trim(),
          photos,
        },
        { onConflict: "property_id,user_id" },
      );
      if (error) throw error;
      toast.success("Thanks for your review!");
      setRating(0);
      setComment("");
      setFiles([]);
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <div className="text-sm font-semibold">Your rating</div>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="rounded p-0.5"
            >
              <Star
                className={`h-7 w-7 ${
                  (hover || rating) >= n
                    ? "fill-accent text-accent"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Your review</label>
        <Textarea
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your honest experience — neighbourhood, the unit, the landlord, water and power…"
          rows={4}
          className="mt-1"
        />
      </div>
      <div>
        <div className="text-sm font-semibold">Photos (required)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-foreground/80 text-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {files.length < 6 && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" />
              Add
              <input type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">At least one photo helps other tenants trust your review.</p>
      </div>
      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}
