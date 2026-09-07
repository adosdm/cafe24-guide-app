-- ============================================
-- 0. category에 검색창 노출 여부 컬럼 추가
-- ============================================
alter table category
add column guide_show_search boolean default true;

-- ============================================
-- 1. Guide (가이드 글)
-- ============================================
create table guide (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references category(id) on delete cascade,
  title text not null,
  thumbnail_url text,
  linked_product_no text,

  show_in_banner boolean default false,   -- 가이드_메인 상단 롤링 배너 노출
  banner_image_url text,

  -- Q&A: 카페24 게시판 실시간 연동
  qna_board_no text,
  qna_keyword text,

  sort_order int not null default 0,
  status text default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 2. GuideDeviceVariant
--    = "부착가이드 영상" 영역 (기기 그룹별, 최대 4개, 유튜브 영상 중심)
-- ============================================
create table guide_device_variant (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid references guide(id) on delete cascade,
  device_range_label text,      -- 예: "15 series 이상 Galaxy 24 series 이상"
  youtube_url text,             -- 부착가이드 영상
  thumbnail_url text,           -- 영상 썸네일 (박스 목업 이미지 등, 직접 업로드)
  description text,
  sort_order int not null default 0
);

-- ============================================
-- 3. GuideRelatedContent (관련 콘텐츠 - 클릭시 팝업 재생, 최대 제한 없음/캐러셀)
-- ============================================
create table guide_related_content (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid references guide(id) on delete cascade,
  title text,
  subtitle text,           -- 예: "2.5Dx 지문 인식 강화유리 시리즈"
  youtube_url text not null,
  thumbnail_url text,      -- 커스텀 썸네일 (필수, 직접 업로드)
  badge_text text,         -- 예: "Galaxy series"
  sort_order int not null default 0
);

-- ============================================
-- 4. GuideTip (알아두면 좋은 TIP - 쇼츠 영상, 최대 4개)
--    play_mode: 지금은 inline 고정, 나중에 popup으로 바꿀 수 있게 필드로 분리
-- ============================================
create table guide_tip (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid references guide(id) on delete cascade,
  title text,
  shorts_video_url text,        -- 쇼츠(세로) 영상 URL
  thumbnail_url text,
  play_mode text default 'inline', -- 'inline' | 'popup'
  sort_order int not null default 0
);
