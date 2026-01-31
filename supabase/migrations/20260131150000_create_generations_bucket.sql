-- Create storage bucket for generated images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generations',
  'generations',
  true,  -- Public bucket for easy image access
  52428800,  -- 50MB max per file (supports full 4K images)
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- Policy: Users can upload their own generated images
create policy "Users can upload generated images"
  on storage.objects for insert
  with check (
    bucket_id = 'generations'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Anyone can read generated images (public bucket)
create policy "Anyone can read generated images"
  on storage.objects for select
  using (
    bucket_id = 'generations'
  );

-- Policy: Users can delete their own generated images
create policy "Users can delete own generated images"
  on storage.objects for delete
  using (
    bucket_id = 'generations'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Service role can manage all generated images
create policy "Service role can manage generated images"
  on storage.objects for all
  using (
    bucket_id = 'generations'
    and auth.role() = 'service_role'
  );
