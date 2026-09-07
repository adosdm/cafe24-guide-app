"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const VISIBLE_BANNERS = 4;

export default function GuideHomePage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    supabase
      .from("guide")
      .select("id, title, banner_image_url, thumbnail_url")
      .eq("show_in_banner", true)
      .eq("status", "published")
      .order("sort_order")
      .then(({ data }) => setBanners(data || []));

    supabase
      .from("category")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(banners.length / VISIBLE_BANNERS));
  const visibleBanners = banners.slice(page * VISIBLE_BANNERS, page * VISIBLE_BANNERS + VISIBLE_BANNERS);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 100px", fontFamily: "Pretendard, sans-serif" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", color: "#131416", marginBottom: 8 }}>
        제품 가이드
      </h1>
      <p style={{ fontSize: 14, textAlign: "center", color: "#4e4e4e", marginBottom: 40 }}>
        제품 선택 기준, 기술 설명, 호환성 정보 등을 구조화한 가이드 콘텐츠입니다.
      </p>

      {/* 배너 캐러셀 */}
      {banners.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {visibleBanners.map((b) => (
              <Link key={b.id} href={`/guide/${b.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "343/189",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#EFF1F2",
                  }}
                >
                  {(b.banner_image_url || b.thumbnail_url) && (
                    <img
                      src={b.banner_image_url || b.thumbnail_url}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to bottom, rgba(0,0,0,0) 29%, rgba(0,0,0,0.6))",
                    }}
                  />
                  <div style={{ position: "absolute", left: 14, bottom: 14 }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{b.title}</p>
                    <p style={{ fontSize: 11, fontWeight: 500, color: "#fff" }}>영상 보러가기 →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 페이지 인디케이터 + 화살표 */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 2,
                      borderRadius: 2,
                      background: i === page ? "#000" : "#e6e8ea",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={arrowBtnStyle}
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={arrowBtnStyle}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 카테고리 2x2 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {categories.map((c) => (
          <Link key={c.id} href={`/guide/category/${c.id}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "608/427",
                borderRadius: 15,
                overflow: "hidden",
                background: "#111",
              }}
            >
              {c.guide_image_url && (
                <img src={c.guide_image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0) 17%, #000)",
                }}
              />
              <p
                style={{
                  position: "absolute",
                  left: 24,
                  bottom: 20,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: -0.24,
                }}
              >
                {c.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const arrowBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
