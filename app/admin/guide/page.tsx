"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import GuideModal from "./GuideModal";
import CategorySettingsModal from "./CategorySettingsModal";

export default function GuidePage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  const [modalMode, setModalMode] = useState<null | "create" | "edit" | "view">(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [showCategorySettings, setShowCategorySettings] = useState(false);

  const loadStaticData = useCallback(async () => {
    const [{ data: cat }, { data: dev }] = await Promise.all([
      supabase.from("category").select("*").order("sort_order"),
      supabase.from("device").select("*").order("sort_order"),
    ]);
    setCategories(cat || []);
    setDevices(dev || []);
  }, []);

  const loadGuides = useCallback(async () => {
    const { data } = await supabase
      .from("guide")
      .select("id, title, status, thumbnail_url, created_at, category:category_id(id, name)")
      .order("created_at", { ascending: false });
    setGuides(data || []);
  }, []);

  useEffect(() => {
    loadStaticData();
    loadGuides();
  }, [loadStaticData, loadGuides]);

  const filtered = guides.filter((g) => {
    if (categoryFilter && g.category?.id !== categoryFilter) return false;
    if (keyword && !g.title.includes(keyword)) return false;
    return true;
  });

  const stats = {
    total: guides.length,
    published: guides.filter((g) => g.status === "published").length,
    draft: guides.filter((g) => g.status === "draft").length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 가이드를 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    await supabase.from("guide").delete().eq("id", id);
    loadGuides();
  };

  const openCreate = () => {
    setSelectedGuideId(null);
    setModalMode("create");
  };
  const openEdit = (id: string) => {
    setSelectedGuideId(id);
    setModalMode("edit");
  };
  const openView = (id: string) => {
    setSelectedGuideId(id);
    setModalMode("view");
  };
  const closeModal = () => {
    setModalMode(null);
    setSelectedGuideId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">가이드 관리</h1>
          <p className="page-desc">카테고리별 부착 가이드를 등록하고 관리합니다.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowCategorySettings(true)} className="btn btn-soft">
            카테고리 설정
          </button>
          <button onClick={openCreate} className="btn btn-primary">
            + 가이드 등록
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{ margin: "24px 0" }}>
        <div className="stat-card">
          <p className="stat-label">등록 가이드</p>
          <p className="stat-value">{stats.total}개</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">게시중</p>
          <p className="stat-value" style={{ color: "var(--green)" }}>
            {stats.published}개
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">임시저장</p>
          <p className="stat-value" style={{ color: "var(--ink-3)" }}>
            {stats.draft}개
          </p>
        </div>
      </div>

      <div className="filters">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select" style={{ width: 160 }}>
          <option value="">카테고리 전체</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="search-box" style={{ flex: 1 }}>
          <input
            placeholder="가이드 제목 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input"
            style={{ height: 40, width: "100%" }}
          />
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="list">
          <thead>
            <tr>
              <th>썸네일</th>
              <th>카테고리</th>
              <th>제목</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty">
                    <p>등록된 가이드가 없습니다</p>
                    <span>+ 가이드 등록 버튼으로 시작해보세요</span>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((g) => (
              <tr key={g.id}>
                <td>
                  {g.thumbnail_url ? (
                    <img src={g.thumbnail_url} className="thumb" style={{ width: 44, height: 44 }} />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{g.category?.name}</td>
                <td style={{ fontWeight: 700 }}>{g.title}</td>
                <td>
                  <span className={g.status === "published" ? "badge badge-green" : "badge badge-soft"}>
                    {g.status === "published" ? "게시중" : "임시저장"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openView(g.id)} className="btn btn-sm btn-soft">
                      보기
                    </button>
                    <button onClick={() => openEdit(g.id)} className="btn btn-sm btn-soft">
                      수정
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="btn btn-sm btn-danger">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCategorySettings && (
        <CategorySettingsModal categories={categories} onClose={() => setShowCategorySettings(false)} onSaved={loadStaticData} />
      )}

      {modalMode && (
        <GuideModal
          mode={modalMode}
          guideId={selectedGuideId}
          categories={categories}
          devices={devices}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            loadGuides();
          }}
        />
      )}
    </div>
  );
}
