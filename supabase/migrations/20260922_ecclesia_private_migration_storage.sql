-- Private tenant-isolated storage for Migration Center source files.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('migration-imports','migration-imports',false,10485760,array['text/csv','application/csv','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "ecclesia migration uploads" on storage.objects;
create policy "ecclesia migration uploads" on storage.objects for insert to authenticated with check (
 bucket_id='migration-imports' and (storage.foldername(name))[1] is not null
 and private.has_church_role(((storage.foldername(name))[1])::uuid,array['owner','pastor','administrator']::public.church_role[])
);
drop policy if exists "ecclesia migration reads" on storage.objects;
create policy "ecclesia migration reads" on storage.objects for select to authenticated using (
 bucket_id='migration-imports' and (storage.foldername(name))[1] is not null
 and private.has_church_role(((storage.foldername(name))[1])::uuid,array['owner','pastor','administrator']::public.church_role[])
);
drop policy if exists "ecclesia migration deletes" on storage.objects;
create policy "ecclesia migration deletes" on storage.objects for delete to authenticated using (
 bucket_id='migration-imports' and (storage.foldername(name))[1] is not null
 and private.has_church_role(((storage.foldername(name))[1])::uuid,array['owner','pastor','administrator']::public.church_role[])
);