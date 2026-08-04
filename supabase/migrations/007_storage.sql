insert into storage.buckets (id, name, public) values ('dentist-photos','dentist-photos', true)
  on conflict do nothing;
insert into storage.buckets (id, name, public) values ('article-covers','article-covers', true)
  on conflict do nothing;
insert into storage.buckets (id, name, public) values ('private-docs','private-docs', false)
  on conflict do nothing;

-- Public read on the two public buckets.
create policy "public read dentist photos" on storage.objects
  for select using (bucket_id = 'dentist-photos');
create policy "public read article covers" on storage.objects
  for select using (bucket_id = 'article-covers');

-- Admins manage everything in all three buckets (including private-docs,
-- which is read only via signed URLs with a 60-second expiry from app code).
create policy "admin all storage objects" on storage.objects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- A dentist manages their own photo uploads in dentist-photos. Storage sets
-- `owner` to the uploader's auth.uid(); updates/deletes must be on their own
-- objects.
create policy "dentist uploads own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dentist-photos' and public.is_dentist());

create policy "dentist updates own photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'dentist-photos' and public.is_dentist() and owner = auth.uid());

create policy "dentist deletes own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dentist-photos' and public.is_dentist() and owner = auth.uid());
