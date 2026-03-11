-- Supabase Storage: policies for bucket "profile-pictures"
-- Run this in Supabase Dashboard → SQL Editor (or create the bucket in Storage UI first, then run the policies).

-- 1. Create the bucket if it doesn't exist (optional; you can also create it in Storage UI).
-- Set it to PUBLIC so avatar URLs are readable without auth.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Allow anyone to read (SELECT) – needed for public avatar URLs.
--    For a PUBLIC bucket, Supabase may allow reads without this; this makes it explicit.
create policy "Public read profile pictures"
on storage.objects for select
to public
using (bucket_id = 'profile-pictures');

-- 3. Allow uploads (INSERT) – for your backend (anon or service_role) or authenticated users.
create policy "Allow uploads to profile-pictures"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'profile-pictures');

-- 4. Allow update (needed for upsert: replace existing avatar).
create policy "Allow update profile pictures"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'profile-pictures')
with check (bucket_id = 'profile-pictures');

-- 5. Optional: allow delete (e.g. remove avatar).
create policy "Allow delete profile pictures"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'profile-pictures');
