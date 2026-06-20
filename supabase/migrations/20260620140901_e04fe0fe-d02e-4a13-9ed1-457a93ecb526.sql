
-- Public read for both buckets
create policy "public read property-images" on storage.objects for select
  using (bucket_id = 'property-images');
create policy "public read review-photos" on storage.objects for select
  using (bucket_id = 'review-photos');

-- Authenticated users can upload into their own folder (path starts with their uid)
create policy "authenticated upload property-images" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "authenticated upload review-photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Owners can update / delete their own files
create policy "owner update property-images" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner delete property-images" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner update review-photos" on storage.objects for update to authenticated
  using (bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner delete review-photos" on storage.objects for delete to authenticated
  using (bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text);
