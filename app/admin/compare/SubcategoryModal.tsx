"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  categories: any[];
  onClose: () => void;
};

export default function SubcategoryModal({ categories, onClose }: Props) {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attributeDefs, setAttributeDefs] = useState<any[]>([]);

  // 새 서브카테고리 입력값
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [message, setMessage] = useState("");

  const loadSubcategories = async () => {
    const { data } = await supabase
      .from("subcategory")
      .select("id, name, description, category:category_id(id, name)")
      .order("sort_order");
    setSubcategories(data || []);
  };

  useEffect(() => {
    loadSubcategories();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setAttributeDefs([]);
      return;
    }
    supabase
      .from("attribute_definition")
      .select("*")
      .eq("subcategory_id", selectedId)
      .order("sort_order")
      .then(({ data }) => setAttributeDefs(data || []));
  }, [selectedId]);

  const handleCreateSubcategory = async () => {
    if (!newCategoryId || !newName) {
      setMessage("카테고리와 이름을 입력해주세요.");
      return;
    }
    const { error } = await supabase.from("subcategory").insert({
      category_id: newCategoryId,
      name: newName,
      description: newDescription,
    });
    if (error) {
      setMessage("저장 실패: " + error.message);
      return;
    }
    setNewName("");
    setNewDescription("");
    setMessage("서브카테고리가 추가되었습니다.");
    loadSubcategories();
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("서브카테고리를 삭제하면 소속 제품도 함께 삭제됩니다. 계속할까요?")) return;
    await supabase.from("subcategory").delete().eq("id", id);
    if (selectedId === id) setSelectedId(null);
    loadSubcategories();
  };

  const addAttributeRow = async () => {
    if (!selectedId) return;
    await supabase.from("attribute_definition").insert({
      subcategory_id: selectedId,
      name: "새 속성",
      display_type: "slider",
      label_left: "기본형",
      label_right: "강화형",
      sort_order: attributeDefs.length + 1,
    });
    const { data } = await supabase
      .from("attribute_definition")
      .select("*")
      .eq("subcategory_id", selectedId)
      .order("sort_order");
    setAttributeDefs(data || []);
  };

  const updateAttribute = async (id: string, field: string, value: string) => {
    setAttributeDefs((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
    await supabase.from("attribute_definition").update({ [field]: value }).eq("id", id);
  };

  const deleteAttribute = async (id: string) => {
    await supabase.from("attribute_definition").delete().eq("id", id);
    setAttributeDefs((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>서브카테고리 관리</h2>
          <button onClick={onClose} style={{ fontSize: 18 }}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* 왼쪽: 서브카테고리 목록 + 새로 추가 */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>기존 서브카테고리</h3>
            <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
              {subcategories.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: selectedId === s.id ? "#F1F1F1" : "transparent",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    [{s.category?.name}] {s.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubcategory(s.id);
                    }}
                    style={{ color: "#DC2626", fontSize: 12 }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>+ 새 서브카테고리</h3>
            <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} style={inputStyle}>
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="서브카테고리명"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ ...inputStyle, marginTop: 8 }}
            />
            <input
              placeholder="설명"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ ...inputStyle, marginTop: 8 }}
            />
            <button onClick={handleCreateSubcategory} style={{ ...submitBtnStyle, marginTop: 8 }}>
              추가
            </button>
            {message && <p style={{ fontSize: 12, marginTop: 8 }}>{message}</p>}
          </div>

          {/* 오른쪽: 선택한 서브카테고리의 속성 정의 */}
          <div style={{ flex: 1, borderLeft: "1px solid #eee", paddingLeft: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {selectedId ? "비교 속성 정의" : "왼쪽에서 서브카테고리를 선택하세요"}
            </h3>
            {selectedId && (
              <>
                {attributeDefs.map((attr) => (
                  <div key={attr.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      <input
                        value={attr.name}
                        onChange={(e) => updateAttribute(attr.id, "name", e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <select
                        value={attr.display_type}
                        onChange={(e) => updateAttribute(attr.id, "display_type", e.target.value)}
                      >
                        <option value="slider">게이지</option>
                        <option value="icon">아이콘</option>
                        <option value="chip">칩</option>
                      </select>
                      <button onClick={() => deleteAttribute(attr.id)} style={{ color: "#DC2626" }}>
                        삭제
                      </button>
                    </div>
                    {attr.display_type === "slider" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          placeholder="왼쪽 라벨"
                          value={attr.label_left || ""}
                          onChange={(e) => updateAttribute(attr.id, "label_left", e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <input
                          placeholder="오른쪽 라벨"
                          value={attr.label_right || ""}
                          onChange={(e) => updateAttribute(attr.id, "label_right", e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={addAttributeRow} style={btnSecondary}>
                  + 속성 추가
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};
const modalStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 24,
  width: 720,
  maxHeight: "85vh",
  overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
};
const submitBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#111",
  color: "white",
  borderRadius: 8,
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  background: "white",
  border: "1px solid #ddd",
  padding: "8px 16px",
  borderRadius: 8,
};
