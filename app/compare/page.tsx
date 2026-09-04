"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CustomerComparePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("category")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data || []);
        if (data && data[0]) setCategoryId(data[0].id);
      });
    supabase
      .from("device")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setDevices(data || []);
        if (data && data[0]) setDeviceId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!categoryId || !deviceId) return;
    (async () => {
      const { data: subs } = await supabase
        .from("subcategory")
        .select("id, name, description")
        .eq("category_id", categoryId)
        .order("sort_order");

      const result = [];
      for (const sub of subs || []) {
        const { data: products } = await supabase
          .from("comparison_product")
          .select(
            `id, name, price, tagline, configuration_text, is_recommended, detail_url,
             product_image ( image_url, sort_order ),
             product_attribute_value (
               gauge_value, icon_text, chip_title, chip_content, chip_tags, description,
               attribute_definition ( name, display_type, label_left, label_right, sort_order )
             )`
          )
          .eq("subcategory_id", sub.id)
          .eq("device_id", deviceId)
          .eq("status", "published")
          .order("sort_order");

        if (products && products.length > 0) result.push({ subcategory: sub, products });
      }
      setGroups(result);
    })();
  }, [categoryId, deviceId]);

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px 100px" }}>
        {/* 타이틀 */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1E2124", marginBottom: 8 }}>비교하기</h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 32 }}>
            다양한 제품을 한눈에 비교해 보세요.
          </p>

          {/* 카테고리 탭 - 알약형 세그먼트 버튼 (기기탭보다 상위 위계) */}
          <div
            style={{
              display: "inline-flex",
              gap: 4,
              background: "#F0F0F0",
              padding: 4,
              borderRadius: 999,
              marginBottom: 20,
            }}
          >
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 700,
                    background: active ? "#000" : "transparent",
                    color: active ? "#fff" : "#888",
                    border: "none",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <div style={{ borderBottom: "1px solid #eee", marginBottom: 28 }} />

          {/* 기기 탭 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            {devices.map((d) => {
              const active = d.id === deviceId;
              return (
                <button
                  key={d.id}
                  onClick={() => setDeviceId(d.id)}
                  style={{
                    padding: "8px 25px",
                    borderRadius: 60,
                    fontSize: 16,
                    fontWeight: active ? 700 : 500,
                    background: active ? "#000" : "#fff",
                    color: active ? "#fff" : "#bbb",
                    border: active ? "none" : "1px solid #bbb",
                  }}
                >
                  {d.name}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 13, color: "#999", marginBottom: 48 }}>
            ※ 아래 비교표 이미지는 참고용이며, 실제 제품 사양은 시리즈 전체가 동일합니다.
          </p>
        </div>

        {groups.length === 0 && (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#999" }}>
            이 조합에 등록된 제품이 아직 없습니다.
          </div>
        )}

        {groups.map((group) => (
          <div key={group.subcategory.id} style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1E2124", marginBottom: 8 }}>
              {group.subcategory.name}
            </h2>
            <p style={{ fontSize: 14, color: "#999", marginBottom: 28 }}>{group.subcategory.description}</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {group.products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ attrs }: { attrs: { name: string; value: number }[] }) {
  const n = attrs.length;
  if (n < 3) return null;

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 32;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(angle(i)),
    cy + r * Math.sin(angle(i)),
  ];

  const outerPts = attrs.map((_, i) => point(i, R).join(",")).join(" ");
  const valuePts = attrs.map((a, i) => point(i, R * (Math.min(a.value, 4) / 4)).join(",")).join(" ");

  return (
    <svg width={size} height={size} style={{ display: "block", margin: "0 auto 16px" }}>
      {/* 기준 도형 */}
      <polygon points={outerPts} fill="#E3E3E3" fillOpacity={0.2} stroke="#C1C1C1" strokeWidth={1} />
      {/* 중심에서 각 축으로의 격자선 */}
      {attrs.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#C1C1C1" strokeOpacity={0.5} strokeWidth={0.5} />;
      })}
      {/* 실제 값 도형 */}
      <polygon points={valuePts} fill="#DDAF91" fillOpacity={0.2} stroke="#FF7B00" strokeOpacity={0.8} strokeWidth={0.5} />
      {/* 꼭짓점 점 */}
      {attrs.map((a, i) => {
        const [x, y] = point(i, R * (Math.min(a.value, 4) / 4));
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#FF7B00" />;
      })}
      {/* 축 라벨 */}
      {attrs.map((a, i) => {
        const [x, y] = point(i, R + 18);
        return (
          <text key={i} x={x} y={y} fontSize={11} fontWeight={700} fill="#808080" textAnchor="middle" dominantBaseline="middle">
            {a.name}
          </text>
        );
      })}
    </svg>
  );
}

function ProductCard({ product }: { product: any }) {
  const images = (product.product_image || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const attrs = (product.product_attribute_value || []).sort(
    (a: any, b: any) => (a.attribute_definition?.sort_order || 0) - (b.attribute_definition?.sort_order || 0)
  );
  const taglineLines = (product.tagline || "").split("\n");

  return (
    <div
      style={{
        width: 280,
        borderRadius: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* 이미지 */}
      <div style={{ position: "relative", width: 280, height: 279, background: "#EFF1F2" }}>
        {images[0] && (
          <img src={images[0].image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {product.is_recommended && (
          <span
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 5,
            }}
          >
            추천
          </span>
        )}
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* 제품명 */}
        <p style={{ fontSize: 18, fontWeight: 600, textAlign: "center", color: "#000", marginBottom: 8 }}>
          {product.name}
        </p>

        {/* 설명 2줄 */}
        {product.tagline && (
          <p style={{ fontSize: 14, textAlign: "center", color: "rgba(0,0,0,0.7)", marginBottom: 8, lineHeight: 1.4 }}>
            {taglineLines.map((line: string, i: number) => (
              <span key={i}>
                {line}
                {i < taglineLines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )}

        {/* 상세페이지 보기 */}
        {product.detail_url && (
          <a
            href={product.detail_url}
            style={{
              display: "block",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 500,
              color: "#FF7B00",
              marginBottom: 16,
            }}
          >
            상세페이지 보기 →
          </a>
        )}

        <div style={{ borderTop: "1px solid #eee", marginBottom: 16 }} />

        {/* 육각형 그래프 - 슬라이더형 속성 요약 */}
        {(() => {
          const sliderAttrs = attrs
            .filter((v: any) => v.attribute_definition?.display_type === "slider")
            .map((v: any) => ({ name: v.attribute_definition.name, value: v.gauge_value || 1 }));
          return sliderAttrs.length >= 3 ? <RadarChart attrs={sliderAttrs} /> : null;
        })()}

        {/* 속성값들 */}
        {attrs.map((v: any, idx: number) => {
          const def = v.attribute_definition;
          if (!def) return null;

          if (def.display_type === "slider") {
            const pct = ((v.gauge_value || 1) / 4) * 100;
            return (
              <div key={idx} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, textAlign: "center", color: "#1E1E1E", marginBottom: 8 }}>{def.name}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>
                  <span>{def.label_left}</span>
                  <span>{def.label_right}</span>
                </div>
                <div style={{ position: "relative", height: 6, borderRadius: 999, background: "#EFF1F2", border: "1px solid rgba(123,123,123,0.2)" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 999,
                      background: "linear-gradient(to right, rgba(30,33,36,0.4), #1E2124)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: `calc(${pct}% - 6px)`,
                      transform: "translateY(-50%)",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#1E2124",
                    }}
                  />
                </div>
                {v.description && (
                  <p style={{ fontSize: 14, fontWeight: 600, textAlign: "center", color: "#000", marginTop: 6 }}>
                    {v.description}
                  </p>
                )}
              </div>
            );
          }

          if (def.display_type === "icon") {
            return (
              <div key={idx} style={{ marginBottom: 16, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#1E1E1E", marginBottom: 4 }}>{def.name}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{v.icon_text}</p>
              </div>
            );
          }

          if (def.display_type === "chip") {
            const tags = (v.chip_tags || "")
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean);
            return (
              <div key={idx} style={{ marginBottom: 16, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#1E1E1E", marginBottom: 8 }}>{v.chip_title}</p>
                {tags.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {tags.map((tag: string, tagIdx: number) => (
                      <span
                        key={tagIdx}
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "1px solid #8A8A8A",
                          background: "#fff",
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#717171",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{v.chip_content}</p>
              </div>
            );
          }
          return null;
        })}

        {/* 구성 */}
        {product.configuration_text && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "#1E1E1E", marginBottom: 4 }}>구성</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{product.configuration_text}</p>
          </div>
        )}

        {/* 가격 */}
        {product.price && (
          <p style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 16 }}>
            {product.price.toLocaleString()}원
          </p>
        )}

        {/* 구입하기 */}
        <a
          href={product.detail_url || "#"}
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px 0",
            borderRadius: 46,
            background: "#FF7B00",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          구입하기
        </a>
      </div>
    </div>
  );
}
