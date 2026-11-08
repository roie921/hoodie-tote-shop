-- =====================================================================
-- 04_storage.sql
-- Private Storage bucket for the preview images of custom designs.
-- Run this file FOURTH. Files must be saved under a folder named with the
-- user's id, for example:  <user_id>/<design_id>-front.png
-- Each user can only see and change files in their own folder.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('custom-designs', 'custom-designs', false, 5242880, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "custom_designs_files_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'custom-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "custom_designs_files_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'custom-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "custom_designs_files_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'custom-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'custom-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "custom_designs_files_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'custom-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Admins can open design images (the workshop needs them to produce orders).
create policy "custom_designs_files_select_admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'custom-designs' and public.is_admin());
