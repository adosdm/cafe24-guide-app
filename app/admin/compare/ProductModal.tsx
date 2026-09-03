"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const MAX_IMAGES = 5;

type Props = {
  mode: "create" | "edit" | "view";
  productId: string | null;
  subcategories: any[];
  devices: any[];
  onClose: () => void;
  onSaved: () => void;
};

export default function ProductModal({ mode, productId, subcategories, devices, onClose, onSaved }: Props) {
  const [subcategoryId, setSubcategoryId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tagline, setTagline] = useState("");
  const [status, setStatus] = useState("draft");
  const [isRecommended, setIsRecommended] = useState(false);

  const [attributeDefs, setAttributeDefs] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});

  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const readOnly = mode === "view";

  // 서브카테고리의 속성 정의 불러오기
  useEffect(() => {
    if (!subcategoryId) {
      setAttributeDefs([]);
      return;
    }
    supabase
      .from("attribute_definition")
      .select("*")
      .eq("subcategory_id", subcategoryId)
      .order("sort_order")
      .then(({ data }) => setAttributeDefs(data || []));
  }, [subcategoryId]);

  // 수정/보기 모드일 때 기존 데이터 불러오기
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    (async () => {
      const { data: product } = await supabase
        .from("comparison_product")
        .select("*")
        .eq("id", productId)
        .single();

      if (product) {
        setSubcategoryId(product.subcategory_id);
        setDeviceId(product.device_id);
        setName(product.name);
        setPrice(product.price ? String(product.price) : "");
        setTagline(product.tagline || "");
        setStatus(product.status || "draft");
        setIsRecommended(product.is_recommended || false);
      }

      const { data: valueRows } = await supabase
        .from("product_attribute_value")
        .select("*")
        .eq("product_id", productId);

      const valueMap: Record<string, any> = {};
      (valueRows || []).forEach((v) => {
        valueMap[v.attribute_definition_id] = v;
      });
      setValues(valueMap);

      const { data: images } = await supabase
        .from("product_image")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      setExistingImages(images || []);

      setLoading(false);
    })();
  }, [productId]);

  const updateValue = (attrId: string, field: string, val: string) => {
    setValues((prev) => ({ ...prev, [attrId]: { ...prev[attrId], [field]: val } }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length + newFiles.length + files.length;
    if (totalCount > MAX_IMAGES) {
      setMessage(`이미지는 최대 ${MAX_IMAGES}장까지만 가능합니다.`);
    }
    setNewFiles([...newFiles, ...files].slice(0, MAX_IMAGES - existingImages.length));
  };

  const removeExistingImage = async (imgId: string) => {
    await supabase.from("product_image").delete().eq("id", imgId);
    setExistingImages(existingImages.filter((i) => i.id !== imgId));
  };

  const removeNewFile = (idx: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!subcategoryId || !deviceId || !name) {
      setMessage("서브카테고리, 기기, 제품명은 필수입니다.");
      return;
    }
    setSaving(true);
    setMessage("");

    const payload = {
      subcategory_id: subcategoryId,
      device_id: deviceId,
      name,
      price: price ? Number(price) : null,
      tagline,
      status,
      is_recommended: isRecommended,
    };

    let currentProductId = productId;

    if (mode === "create") {
      const { data, error } = await supabase.from("comparison_product").insert(payload).select().single();
      if (error || !data) {
        setMessage("저장 실패: " + error?.message);
        setSaving(false);
        return;
      }
      currentProductId = data.id;
    } else if (mode === "edit" && productId) {
      const { error } = await supabase.from("comparison_product").update(payload).eq("id", productId);
      if (error) {
        setMessage("저장 실패: " + error.message);
        setSaving(false);
        return;
      }
    }

    // 속성값 upsert
    if (attributeDefs.length > 0 && currentProductId) {
      const rows = attributeDefs.map((def) => {
        const v = values[def.id] || {};
        return {
          product_id: currentProductId,
          attribute_definition_id: def.id,
          gauge_value: def.display_type === "slider" && v.gauge_value ? Number(v.gauge_value) : null,
          icon_text: def.display_type === "icon" ? v.icon_text || null : null,
          chip_title: def.display_type === "chip" ? v.chip_title || null : null,
          chip_content: def.display_type === "chip" ? v.chip_content || null : null,
          description: v.description || null,
        };
      });
      await supabase
        .from("product_attribute_value")
        .upsert(rows, { onConflict: "product_id,attribute_definition_id" });
    }

    // 새 이미지 업로드
    if (newFiles.length > 0 && currentProductId) {
      const startOrder = existingImages.length + 1;
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const filePath = `${currentProductId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);
        if (uploadError) continue;
        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
        await supabase.from("product_image").insert({
          product_id: currentProductId,
          image_url: publicUrlData.publicUrl,
          sort_order: startOrder + i,
        });
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {mode === "create" ? "제품 등록" : mode === "edit" ? "제품 수정" : "제품 상세보기"}
          </h2>
          <button onClick={onClose} style={{ fontSize: 18 }}>
            ×
          </button>
        </div>

        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <>
            <Field label="서브카테고리">
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={readOnly}
                style={inputStyle}
              >
                <option value="">선택하세요</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.category?.name}] {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="기기">
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} disabled={readOnly} style={inputStyle}>
                <option value="">선택하세요</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="제품명">
              <input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} style={inputStyle} />
            </Field>

            <Field label="가격">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={readOnly}
                style={inputStyle}
              />
            </Field>

            <Field label="캐치프레이즈">
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} disabled={readOnly} style={inputStyle} />
            </Field>

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label>
                <input
                  type="checkbox"
                  checked={isRecommended}
                  onChange={(e) => setIsRecommended(e.target.checked)}
                  disabled={readOnly}
                />{" "}
                추천 제품
              </label>
              <label>
                상태:{" "}
                <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly}>
                  <option value="draft">임시저장</option>
                  <option value="published">게시</option>
                </select>
              </label>
            </div>

            {/* 이미지 */}
            <Field label={`제품 이미지 (최대 ${MAX_IMAGES}장)`}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {existingImages.map((img) => (
                  <div key={img.id} style={{ position: "relative" }}>
                    <img src={img.image_url} style={thumbStyle} />
                    {!readOnly && (
                      <button onClick={() => removeExistingImage(img.id)} style={removeBtnStyle}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {newFiles.map((file, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img src={URL.createObjectURL(file)} style={thumbStyle} />
                    <button onClick={() => removeNewFile(idx)} style={removeBtnStyle}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {!readOnly && (
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} />
              )}
            </Field>

            {/* 속성값 */}
            {attributeDefs.map((def) => {
              const v = values[def.id] || {};
              return (
                <div key={def.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>{def.name}</p>

                  {def.display_type === "slider" && (
                    <div>
                      <p style={{ fontSize: 12, color: "#666" }}>
                        {def.label_left} ↔ {def.label_right}
                      </p>
                      <input
                        type="range"
                        min={1}
                        max={4}
                        value={v.gauge_value || 2}
                        disabled={readOnly}
                        onChange={(e) => updateValue(def.id, "gauge_value", e.target.value)}
                        style={{ width: "100%" }}
                      />
                      <p style={{ fontSize: 12 }}>{v.gauge_value || 2} / 4</p>
                      <input
                        placeholder="비교 설명"
                        value={v.description || ""}
                        disabled={readOnly}
                        onChange={(e) => updateValue(def.id, "description", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {def.display_type === "icon" && (
                    <div>
                      <input
                        placeholder="아이콘/텍스트 값"
                        value={v.icon_text || ""}
                        disabled={readOnly}
                        onChange={(e) => updateValue(def.id, "icon_text", e.target.value)}
                        style={{ ...inputStyle, marginBottom: 8 }}
                      />
                      <input
                        placeholder="비교 설명"
                        value={v.description || ""}
                        disabled={readOnly}
                        onChange={(e) => updateValue(def.id, "description", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {def.display_type === "chip" && (
                    <div>
                      <input
                        placeholder="칩 제목"
                        value={v.chip_title || ""}
                        disabled={readOnly}
                        onChange={(e) => updateValue(def.id, "chip_title", e.target.value)}
                        style={{ ...inputStyle, marginBottom: 8 }}
                      />
                      <input
                        placeholder="칩 내용"
                        value={v.chip_content || ""}
                        disabled={readOnly}
                        onChange={(e) => updateValue(def.id, "chip_content", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {!readOnly && (
              <button onClick={handleSubmit} disabled={saving} style={submitBtnStyle}>
                {saving ? "저장 중..." : "저장"}
              </button>
            )}
            {message && <p style={{ marginTop: 8, color: "#DC2626" }}>{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
      {children}
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
  width: 560,
  maxHeight: "85vh",
  overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
};
const thumbStyle: React.CSSProperties = { width: 72, height: 72, objectFit: "cover", borderRadius: 8 };
const removeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  background: "black",
  color: "white",
  borderRadius: "50%",
  width: 20,
  height: 20,
  fontSize: 12,
};
const submitBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "#111",
  color: "white",
  borderRadius: 8,
  fontWeight: 600,
  marginTop: 8,
};
