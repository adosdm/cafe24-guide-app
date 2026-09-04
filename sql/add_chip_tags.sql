alter table product_attribute_value
add column chip_tags text;

comment on column product_attribute_value.chip_tags is
  '칩 타입일 때 표시할 작은 태그 알약들. 콤마로 구분 (예: "PC,TPU,무광"). 최대 3개 권장.';
