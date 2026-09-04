"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductModal from "./ProductModal";
import SubcategoryModal from "./SubcategoryModal";

export default function ComparePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  const [modalMode, setModalMode] = useState<null | "create" | "edit" | "view">(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const loadStaticData = useCallback(async () => {
    const [{ data: cat }, { data: dev }, { data: sub }] = await Promise.all([
      supabase.from("category").select("*").order("sort_order"),
      supabase.from("device").select("*").order("sort_order"),
      supabase.from("subcategory").select("id, name, category_id, category:category_id(name)").order("sort_order"),
    ]);
    setCategories(cat || []);
    setDevices(dev || []);
    setSubcategories(sub || []);
  }, []);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from("comparison_product")
      .select(
        `id, name, price, is_recommended, status, created_at,
         subcategory:subcategory_id ( id, name, category:category_id ( id, name ) ),
         device:device_id ( id, name ),
         product_image ( image_url, sort_order )`
      )
      .order("created_at", { ascending: false });
    setProducts(data || []);
  }, []);

  useEffect(() => {
    loadStaticData();
    loadProducts();
  }, [loadStaticData, loadProducts]);

  const filtered = products.filter((p) => {
    if (categoryFilter && p.subcategory?.category?.id !== categoryFilter) return false;
    if (deviceFilter && p.device?.id !== deviceFilter) return false;
    if (keyword && !p.name.includes(keyword)) return false;
    return true;
  });

  const stats = {
    total: products.length,
    published: products.filter((p) => p.status === "published").length,
    draft: products.filter((p) => p.status === "draft").length,
    subcategoryCount: subcategories.length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 제품을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    await supabase.from("comparison_product").delete().eq("id", id);
    loadProducts();
  };

  const handleSyncPrices = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/cafe24/sync-prices");
      const data = await res.json();
      if (!res.ok) {
        setSyncMessage("동기화 실패: " + (data.error || "알 수 없는 오류"));
      } else {
        setSyncMessage(`동기화 완료 — 총 ${data.total}개 중 ${data.updated}개 가격 변경됨`);
        loadProducts();
      }
    } catch (err) {
      setSyncMessage("동기화 실패: " + String(err));
    }
    setSyncing(false);
  };

  const openCreate = () => {
    setSelectedProductId(null);
    setModalMode("create");
  };
  const openEdit = (id: string) => {
    setSelectedProductId(id);
    setModalMode("edit");
  };
  const openView = (id: string) => {
    setSelectedProductId(id);
    setModalMode("view");
  };
  const closeModal = () => {
    setModalMode(null);
    setSelectedProductId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">비교하기 관리</h1>
          <p className="page-desc">카테고리 · 기기별로 비교 제품을 등록하고 관리합니다.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSubcategoryModal(true)} className="btn btn-soft">
            서브카테고리 관리
          </button>
          <button onClick={handleSyncPrices} disabled={syncing} className="btn btn-soft">
            {syncing ? "동기화 중..." : "전체 가격 동기화"}
          </button>
          <button onClick={openCreate} className="btn btn-primary">
            + 제품 등록
          </button>
        </div>
      </div>

      {syncMessage && (
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 8 }}>{syncMessage}</p>
      )}

      <div className="stat-grid" style={{ margin: "24px 0" }}>
        <div className="stat-card">
          <p className="stat-label">등록 제품</p>
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
        <div className="stat-card">
          <p className="stat-label">서브카테고리 수</p>
          <p className="stat-value">{stats.subcategoryCount}개</p>
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
        <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)} className="select" style={{ width: 160 }}>
          <option value="">기기 전체</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          placeholder="제품명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="input"
          style={{ flex: 1, height: 40 }}
        />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="list">
          <thead>
            <tr>
              <th>카테고리</th>
              <th>서브카테고리</th>
              <th>기기</th>
              <th>제품명</th>
              <th>가격</th>
              <th>추천</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty">
                    <p>등록된 제품이 없습니다</p>
                    <span>+ 제품 등록 버튼으로 시작해보세요</span>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.subcategory?.category?.name}</td>
                <td>{p.subcategory?.name}</td>
                <td>{p.device?.name}</td>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td className="num">{p.price ? p.price.toLocaleString() + "원" : "-"}</td>
                <td>{p.is_recommended ? <span className="badge badge-accent">추천</span> : "-"}</td>
                <td>
                  <span className={p.status === "published" ? "badge badge-green" : "badge badge-soft"}>
                    {p.status === "published" ? "게시중" : "임시저장"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openView(p.id)} className="btn btn-sm btn-soft">
                      보기
                    </button>
                    <button onClick={() => openEdit(p.id)} className="btn btn-sm btn-soft">
                      수정
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-danger">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <ProductModal
          mode={modalMode}
          productId={selectedProductId}
          subcategories={subcategories}
          devices={devices}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            loadProducts();
          }}
        />
      )}

      {showSubcategoryModal && (
        <SubcategoryModal
          categories={categories}
          onClose={() => {
            setShowSubcategoryModal(false);
            loadStaticData();
          }}
        />
      )}
    </div>
  );
}
