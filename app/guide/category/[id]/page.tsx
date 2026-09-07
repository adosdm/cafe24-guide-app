"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function GuideCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [guides, setGuides] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    supabase.from("category").select("*").order("sort_order").then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    supabase.from("category").select("*").eq("id", categoryId).single().then(({ data }) => setCategory(data));

    supabase
      .from("guide")
      .select("id, title, thumbnail_url, group_label")
      .eq("category_id", categoryId)
      .eq("status", "published")
      .order("sort_order")
      .then(({ data }) => setGuides(data || []));
  }, [categoryId]);

  const filtered = guides.filter((g) => !keyword || g.title.includes(keyword));

  // group_label 기준으로 그룹핑 (없으면 "전체"로 묶음)
  const groups: Record<string, any[]> = {};
  filtered.forEach((g) => {
    const key = g.group_label || "전체";
    if (!groups[key]) groups[key] = [];
    groups[key].push(g);
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px 100px", fontFamily: "Pretendard, sans-serif" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", color: "#131416", marginBottom: 32 }}>
        전체 가이드
      </h1>

      {/* 카테고리 세그먼트 탭 */}
      <div
        style={{
          display: "flex",
          background: "#f8f8f8",
          borderRadius: 10,
          padding: 4,
          marginBottom: 32,
        }}
      >
        {categories.map((c) => {
          const active = c.id === categoryId;
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/guide/category/${c.id}`)}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 8,
                border: "none",
                fontSize: 18,
                fontWeight: active ? 700 : 500,
                background: active ? "#000" : "transparent",
                color: active ? "#fff" : "#bbb",
                cursor: "pointer",
              }}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* 검색창 (카테고리별 노출 설정) */}
      {category?.guide_show_search && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: 400,
              borderBottom: "1px solid #e6e8ea",
              paddingBottom: 10,
            }}
          >
            <input
              placeholder="제품명을 입력하세요."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 16,
                textAlign: "center",
                color: "#58616a",
              }}
            />
            <span style={{ fontSize: 16 }}>🔍</span>
          </div>
        </div>
      )}

      {Object.keys(groups).length === 0 && (
        <div style={{ padding: "80px 0", textAlign: "center", color: "#999" }}>등록된 가이드가 없습니다.</div>
      )}

      {Object.entries(groups).map(([label, list]) => (
        <div key={label} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{label}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {list.map((g) => (
              <Link key={g.id} href={`/guide/${g.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div>
                  <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", background: "#f8f9fa" }}>
                    {g.thumbnail_url && (
                      <img src={g.thumbnail_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <p style={{ fontSize: 16, textAlign: "center", color: "#000", marginTop: 12 }}>{g.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
