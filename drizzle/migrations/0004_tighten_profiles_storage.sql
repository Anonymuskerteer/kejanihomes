DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_select_admin ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_select_chat_partner ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE (c.tenant_id = auth.uid() AND c.landlord_id = profiles.id) OR (c.landlord_id = auth.uid() AND c.tenant_id = profiles.id))
);
DROP POLICY IF EXISTS "public read review-photos" ON storage.objects;
DROP POLICY IF EXISTS "public read property-images" ON storage.objects;
CREATE POLICY "owner read review-photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'review-photos' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "owner read property-images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'property-images' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(), 'admin')));