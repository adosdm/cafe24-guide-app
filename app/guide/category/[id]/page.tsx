"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function GuideCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<any>(null);
  const [guides, setGuides] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    supabase.from("category").select("*").eq("id", categoryId).single().then(({ data }) => setCategory(data));

    supabase
      .from("guide")
      .select("id, title, thumbnail_url")
      .eq("category_id", categoryId)
      .eq("status", "published")
      .order("sort_order", { ascending: false })
      .then(({ data }) => setGuides(data || []));
  }, [categoryId]);

  const filtered = guides.filter((g) => !keyword || g.title.includes(keyword));

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px 100px", fontFamily: "Pretendard, sans-serif" }}>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 4 }}>
        <Link href="/guide" style={{ color: "#999" }}>
          가이드
        </Link>{" "}
        / {category?.name}
      </p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{category?.name}</h1>

      {category?.guide_show_search && (
        <input
          placeholder="가이드 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            width: "100%",
            height: 46,
            padding: "0 16px",
            borderRadius: 10,
            border: "1px solid #e6e8ea",
            marginBottom: 32,
            fontSize: 14,
          }}
        />
      )}

      {filtered.length === 0 && (
        <div style={{ padding: "80px 0", textAlign: "center", color: "#999" }}>등록된 가이드가 없습니다.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
        {filtered.map((g) => (
          <Link key={g.id} href={`/guide/${g.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
              {g.thumbnail_url && (
                <div style={{ width: "100%", height: 160, background: "#EFF1F2" }}>
                  <img src={g.thumbnail_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ padding: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{g.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
