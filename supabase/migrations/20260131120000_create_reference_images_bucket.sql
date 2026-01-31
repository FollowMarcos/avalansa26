-- Create storage bucket for temporary reference images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reference-images',
  'reference-images',
  false,  -- Private bucket, requires auth
  5242880,  -- 5MB max per file
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- Policy: Users can upload their own reference images
create policy "Users can upload reference images"
  on storage.objects for insert
  with check (
    bucket_id = 'reference-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read their own reference images
create policy "Users can read own reference images"
  on storage.objects for select
  using (
    bucket_id = 'reference-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own reference images
create policy "Users can delete own reference images"
  on storage.objects for delete
  using (
    bucket_id = 'reference-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Service role can read all reference images (for server-side fetching)
create policy "Service role can read all reference images"
  on storage.objects for select
  using (
    bucket_id = 'reference-images'
    and auth.role() = 'service_role'
  );
