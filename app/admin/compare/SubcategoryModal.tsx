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
    const { data } = await supabase.from("attribute_definition").select("*").eq("subcategory_id", selectedId).order("sort_order");
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
    <div className="modal-dim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>서브카테고리 관리</h3>
          <button className="x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: "flex", gap: 24 }}>
            {/* 왼쪽 */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--ink-2)" }}>기존 서브카테고리</p>
              <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 20 }}>
                {subcategories.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: selectedId === s.id ? "var(--soft)" : "transparent",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontSize: 13.5 }}>
                      <span className="badge badge-soft" style={{ marginRight: 6 }}>
                        {s.category?.name}
                      </span>
                      {s.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubcategory(s.id);
                      }}
                      className="btn btn-sm btn-danger"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--ink-2)" }}>+ 새 서브카테고리</p>
              <div className="field">
                <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="select">
                  <option value="">카테고리 선택</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <input placeholder="서브카테고리명" value={newName} onChange={(e) => setNewName(e.target.value)} className="input" />
              </div>
              <div className="field">
                <input placeholder="설명" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="input" />
              </div>
              <button onClick={handleCreateSubcategory} className="btn btn-primary btn-block">
                추가
              </button>
              {message && <p className="help">{message}</p>}
            </div>

            {/* 오른쪽 */}
            <div style={{ flex: 1, borderLeft: "1px solid var(--line-2)", paddingLeft: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--ink-2)" }}>
                {selectedId ? "비교 속성 정의" : "왼쪽에서 서브카테고리를 선택하세요"}
              </p>
              {selectedId && (
                <>
                  {attributeDefs.map((attr) => (
                    <div key={attr.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                        <input
                          value={attr.name}
                          onChange={(e) => updateAttribute(attr.id, "name", e.target.value)}
                          className="input"
                          style={{ height: 36, flex: 1 }}
                        />
                        <select
                          value={attr.display_type}
                          onChange={(e) => updateAttribute(attr.id, "display_type", e.target.value)}
                          className="select"
                          style={{ height: 36, width: 100 }}
                        >
                          <option value="slider">게이지</option>
                          <option value="icon">아이콘</option>
                          <option value="chip">칩</option>
                        </select>
                        <button onClick={() => deleteAttribute(attr.id)} className="btn btn-sm btn-danger">
                          삭제
                        </button>
                      </div>
                      {attr.display_type === "slider" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input
                            placeholder="왼쪽 라벨"
                            value={attr.label_left || ""}
                            onChange={(e) => updateAttribute(attr.id, "label_left", e.target.value)}
                            className="input"
                            style={{ height: 34, flex: 1 }}
                          />
                          <input
                            placeholder="오른쪽 라벨"
                            value={attr.label_right || ""}
                            onChange={(e) => updateAttribute(attr.id, "label_right", e.target.value)}
                            className="input"
                            style={{ height: 34, flex: 1 }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={addAttributeRow} className="btn btn-soft btn-block">
                    + 속성 추가
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button onClick={onClose} className="btn btn-primary">
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
