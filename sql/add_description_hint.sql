alter table attribute_definition
add column description_hint text;

comment on column attribute_definition.description_hint is
  '제품 등록 시 비교설명 입력칸에 보여줄 가이드 문구 (예: "OO에 강한 느낌으로 작성")';
