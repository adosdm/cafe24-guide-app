-- 고객이 조회하는 테이블들: RLS 켜고 "읽기만" 전체 허용
alter table category enable row level security;
alter table device enable row level security;
alter table subcategory enable row level security;
alter table attribute_definition enable row level security;
alter table comparison_product enable row level security;
alter table product_attribute_value enable row level security;
alter table product_image enable row level security;

create policy "public read category" on category for select using (true);
create policy "public read device" on device for select using (true);
create policy "public read subcategory" on subcategory for select using (true);
create policy "public read attribute_definition" on attribute_definition for select using (true);
create policy "public read comparison_product" on comparison_product for select using (status = 'published');
create policy "public read product_attribute_value" on product_attribute_value for select using (true);
create policy "public read product_image" on product_image for select using (true);

-- 쓰기(insert/update/delete)는 정책을 안 만들면 자동으로 막힙니다.
-- 관리자 화면(admin)에서는 별도의 서버 API + service_role key로 우회해야 합니다.
-- (지금 관리자 폼은 anon key로 직접 쓰기 때문에, RLS 켜면 관리자 등록도 막힙니다 — 이 부분은 다음 단계로 같이 처리해야 합니다.)

-- 토큰 테이블은 절대 공개 금지
alter table cafe24_token enable row level security;
-- 정책을 하나도 안 만들면 anon으로는 조회/쓰기 전부 차단됩니다 (서버 코드는 별도 처리 필요).
