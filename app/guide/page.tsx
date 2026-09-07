"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function GuideHomePage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

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

  // 롤링 배너 자동 전환
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setBannerIdx((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(t);
  }, [banners]);

  const currentBanner = banners[bannerIdx];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px 100px", fontFamily: "Pretendard, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 40 }}>가이드</h1>

      {/* 상단 롤링 배너 */}
      {currentBanner && (
        <Link href={`/guide/${currentBanner.id}`}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 220,
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 20,
              background: "#EFF1F2",
            }}
          >
            <img
              src={currentBanner.banner_image_url || currentBanner.thumbnail_url}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                left: 24,
                bottom: 24,
                color: "#fff",
                fontSize: 20,
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {currentBanner.title}
            </div>
          </div>
        </Link>
      )}

      {/* 배너 인디케이터 */}
      {banners.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 48 }}>
          {banners.map((_, i) => (
            <span
              key={i}
              onClick={() => setBannerIdx(i)}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i === bannerIdx ? "#FF7B00" : "#ddd",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}

      {/* 카테고리 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
        {categories.map((c) => (
          <Link key={c.id} href={`/guide/category/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
                transition: "0.15s",
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
