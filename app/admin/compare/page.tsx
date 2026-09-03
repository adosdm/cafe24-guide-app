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
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>비교하기 관리</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            카테고리 · 기기별로 비교 제품을 등록하고 관리합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowSubcategoryModal(true)}
            style={btnSecondary}
          >
            서브카테고리 관리
          </button>
          <button onClick={openCreate} style={btnPrimary}>
            + 제품 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "24px 0" }}>
        <StatCard label="등록 제품" value={stats.total} />
        <StatCard label="게시중" value={stats.published} accent="#16A34A" />
        <StatCard label="임시저장" value={stats.draft} accent="#999" />
        <StatCard label="서브카테고리 수" value={stats.subcategoryCount} />
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="">카테고리 전체</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)} style={selectStyle}>
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
          style={{ ...selectStyle, flex: 1 }}
        />
      </div>

      {/* 테이블 */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#FAFAFA", textAlign: "left" }}>
              <Th>카테고리</Th>
              <Th>서브카테고리</Th>
              <Th>기기</Th>
              <Th>제품명</Th>
              <Th>가격</Th>
              <Th>추천</Th>
              <Th>상태</Th>
              <Th>관리</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#999" }}>
                  등록된 제품이 없습니다.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                <Td>{p.subcategory?.category?.name}</Td>
                <Td>{p.subcategory?.name}</Td>
                <Td>{p.device?.name}</Td>
                <Td style={{ fontWeight: 600 }}>{p.name}</Td>
                <Td>{p.price ? p.price.toLocaleString() + "원" : "-"}</Td>
                <Td>{p.is_recommended ? "⭐ 추천" : "-"}</Td>
                <Td>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      background: p.status === "published" ? "#DCFCE7" : "#F1F1F1",
                      color: p.status === "published" ? "#16A34A" : "#888",
                    }}
                  >
                    {p.status === "published" ? "게시중" : "임시저장"}
                  </span>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openView(p.id)} style={btnTiny}>
                      보기
                    </button>
                    <button onClick={() => openEdit(p.id)} style={btnTiny}>
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{ ...btnTiny, color: "#DC2626", borderColor: "#FCA5A5" }}
                    >
                      삭제
                    </button>
                  </div>
                </Td>
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

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #eee", padding: 20 }}>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent || "#111" }}>{value}개</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "12px 16px", fontWeight: 600, color: "#555" }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "12px 16px", ...style }}>{children}</td>;
}

const btnPrimary: React.CSSProperties = {
  background: "#111",
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  background: "white",
  border: "1px solid #ddd",
  padding: "10px 16px",
  borderRadius: 8,
  fontSize: 14,
};
const btnTiny: React.CSSProperties = {
  background: "white",
  border: "1px solid #ddd",
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 12,
};
const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
};
