-- product-images 버킷: 누구나 읽기 가능 (공개 이미지)
create policy "public read product-images"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- product-images 버킷: 지금은 개발 단계라 누구나 업로드 가능
-- (나중에 관리자 인증 붙이면 이 정책을 더 좁게 수정합니다)
create policy "public upload product-images"
on storage.objects for insert
with check ( bucket_id = 'product-images' );
