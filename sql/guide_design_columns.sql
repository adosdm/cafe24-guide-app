-- 가이드_메인 카테고리 그리드용 대표 이미지
alter table category
add column guide_image_url text;

-- 전체가이드 페이지에서 소그룹으로 묶어 보여주기 위한 라벨 (예: "강화유리", "필름")
alter table guide
add column group_label text;
