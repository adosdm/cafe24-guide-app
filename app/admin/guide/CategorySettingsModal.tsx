"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
};

export default function CategorySettingsModal({ categories, onClose, onSaved }: Props) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [saving, setSaving] = useState(false);

  const updateLocal = (id: string, field: string, value: any) => {
    setLocalCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const uploadImage = async (id: string, file: File) => {
    const filePath = `guide/category/${id}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) return;
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    updateLocal(id, "guide_image_url", data.publicUrl);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const c of localCategories) {
      await supabase
        .from("category")
        .update({
          guide_image_url: c.guide_image_url,
          guide_show_search: c.guide_show_search,
        })
        .eq("id", c.id);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="modal-dim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>카테고리 설정 (가이드용)</h3>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {localCategories.map((c) => (
            <div key={c.id} className="card" style={{ padding: 12, marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
              {c.guide_image_url && <img src={c.guide_image_url} className="thumb" style={{ width: 56, height: 56 }} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>{c.name}</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(c.id, file);
                  }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={c.guide_show_search ?? true}
                    onChange={(e) => updateLocal(c.id, "guide_show_search", e.target.checked)}
                  />
                  이 카테고리 페이지에 검색창 노출
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button onClick={onClose} className="btn btn-soft">
            취소
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
