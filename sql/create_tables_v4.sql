-- ============================================
-- 기존 테이블 삭제 후 재생성
-- ============================================
drop table if exists product_image cascade;
drop table if exists product_attribute_value cascade;
drop table if exists attribute_definition cascade;
drop table if exists comparison_product cascade;
drop table if exists subcategory cascade;
drop table if exists device cascade;
drop table if exists category cascade;

-- ============================================
-- 1. Category (케이스 / 강화유리 / 보호필름 / 카메라 강화유리) - 4개, 추가 가능
-- ============================================
create table category (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamp with time zone default now()
);

-- ============================================
-- 2. Device (iPhone / Galaxy S / Galaxy Z Flip / Galaxy Z Fold)
-- ============================================
create table device (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);

-- ============================================
-- 3. Subcategory (라인업: 투명 케이스, 투명 강화유리 등)
--    -> 기기와 무관, 제품 단계에서 기기 지정 (없는 조합은 그냥 등록 안 함)
-- ============================================
create table subcategory (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references category(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamp with time zone default now()
);

-- ============================================
-- 4. AttributeDefinition (비교 속성 정의 - 서브카테고리마다 정의, 추후 수정/추가 가능)
--    -> display_type: 'slider'(게이지형) / 'icon'(아이콘 텍스트형) / 'chip'(제목+내용 칩형)
-- ============================================
create table attribute_definition (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid references subcategory(id) on delete cascade,
  name text not null,
  display_type text not null default 'slider',  -- 'slider' | 'icon' | 'chip'
  label_left text,   -- slider일 때만 사용
  label_right text,  -- slider일 때만 사용
  sort_order int not null default 0
);

-- ============================================
-- 5. ComparisonProduct (실제 비교 제품 카드)
-- ============================================
create table comparison_product (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid references subcategory(id) on delete cascade,
  device_id uuid references device(id) on delete cascade,
  name text not null,
  is_recommended boolean default false,
  tagline text,
  configuration_text text,
  price int,
  linked_product_no text,
  detail_url text,
  sort_order int not null default 0,
  status text default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 6. ProductAttributeValue (제품별 실제 속성 값)
--    -> slider: gauge_value(1~4)
--    -> icon: icon_text
--    -> chip: chip_title + chip_content
-- ============================================
create table product_attribute_value (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references comparison_product(id) on delete cascade,
  attribute_definition_id uuid references attribute_definition(id) on delete cascade,
  gauge_value smallint check (gauge_value between 1 and 4),
  icon_text text,
  chip_title text,
  chip_content text,
  description text,  -- 비교 설명 (예: "일상에 충분한 보호력")
  unique (product_id, attribute_definition_id)
);

-- ============================================
-- 7. ProductImage (제품 이미지, 최대 5장 - 개수 제한은 관리자 폼에서 처리)
-- ============================================
create table product_image (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references comparison_product(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

-- ============================================
-- 시드 데이터: Category 4개
-- ============================================
insert into category (name, sort_order) values
  ('케이스', 1),
  ('강화유리', 2),
  ('보호필름', 3),
  ('카메라 강화유리', 4);

-- ============================================
-- 시드 데이터: Device 4개
-- ============================================
insert into device (name, sort_order) values
  ('iPhone', 1),
  ('Galaxy S', 2),
  ('Galaxy Z Flip', 3),
  ('Galaxy Z Fold', 4);
