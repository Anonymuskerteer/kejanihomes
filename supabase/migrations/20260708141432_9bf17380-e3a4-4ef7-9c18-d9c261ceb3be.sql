-- Review moderation: hide unapproved reviews from the public
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS reviews_is_approved_idx ON public.reviews(is_approved);

-- Drop old public select policy if present and rebuild the read policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "owner read own reviews" ON public.reviews;
DROP POLICY IF EXISTS "admin read all reviews" ON public.reviews;

CREATE POLICY "public read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "owner read own reviews" ON public.reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admin read all reviews" ON public.reviews
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update approval; owner can edit their comment/rating/photos
DROP POLICY IF EXISTS "admin update reviews" ON public.reviews;
CREATE POLICY "admin update reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));