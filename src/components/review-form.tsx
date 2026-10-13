import { useEffect, useState } from "react";
import { Star, Camera, X, Clock, CheckCircle2 } from "lucide-react";
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

interface ExistingReview {
  id: string;
  rating: number;
  comment: string;
  photos: string[];
  is_approved: boolean;
}

export function ReviewForm({ propertyId, userId, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<ExistingReview | null>(null);
  const [keptPhotos, setKeptPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, photos, is_approved")
        .eq("property_id", propertyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const row = data as ExistingReview;
        setExisting(row);
        setRating(row.rating);
        setComment(row.comment);
        setKeptPhotos(row.photos ?? []);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, userId]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 6));
    e.target.value = "";
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const removeKeptPhoto = (idx: number) =>
    setKeptPhotos((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return toast.error("Please choose a star rating");
    if (comment.trim().length < 10) return toast.error("Add at least 10 characters of feedback");
    const totalPhotos = keptPhotos.length + files.length;
    if (totalPhotos < 1) return toast.error("Please attach at least one photo with your review");
    setBusy(true);
    try {
      const newPhotos = files.length > 0 ? await uploadFiles("review-photos", userId, files) : [];
      const allPhotos = [...keptPhotos, ...newPhotos];
      const { error } = await supabase.from("reviews").upsert(
        {
          property_id: propertyId,
          user_id: userId,
          rating,
          comment: comment.trim(),
          photos: allPhotos,
          is_approved: false, // resets moderation on edit
        },
        { onConflict: "property_id,user_id" },
      );
      if (error) throw error;
      toast.success(existing ? "Review updated — awaiting re-approval." : "Thanks! Your review is queued for approval.");
      setFiles([]);
      // Reload
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, photos, is_approved")
        .eq("property_id", propertyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setExisting(data as ExistingReview);
        setKeptPhotos((data as ExistingReview).photos ?? []);
      }
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Loading your review…
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      {existing && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
            existing.is_approved
              ? "bg-success/10 text-success"
              : "bg-accent/20 text-accent-foreground"
          }`}
        >
          {existing.is_approved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Your review is published. Editing sends it back for approval.
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" /> Awaiting admin approval — you can keep editing until it's approved.
            </>
          )}
        </div>
      )}
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
          {keptPhotos.map((src, i) => (
            <div key={`kept-${i}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeKeptPhoto(i)}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-foreground/80 text-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {files.map((f, i) => (
            <div key={`new-${i}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
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
          {keptPhotos.length + files.length < 6 && (
<>
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" />
              Add
              <input type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
            </label>
<label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" />
              Camera
              <input type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
            </label>
</>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">At least one photo helps other tenants trust your review.</p>
      </div>
      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? "Saving…" : existing ? "Update review" : "Post review"}
      </Button>
    </form>
  );
}
