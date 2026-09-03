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
  const title = mode === "create" ? "제품 등록" : mode === "edit" ? "제품 수정" : "제품 상세보기";

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

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    (async () => {
      const { data: product } = await supabase.from("comparison_product").select("*").eq("id", productId).single();
      if (product) {
        setSubcategoryId(product.subcategory_id);
        setDeviceId(product.device_id);
        setName(product.name);
        setPrice(product.price ? String(product.price) : "");
        setTagline(product.tagline || "");
        setStatus(product.status || "draft");
        setIsRecommended(product.is_recommended || false);
      }

      const { data: valueRows } = await supabase.from("product_attribute_value").select("*").eq("product_id", productId);
      const valueMap: Record<string, any> = {};
      (valueRows || []).forEach((v) => (valueMap[v.attribute_definition_id] = v));
      setValues(valueMap);

      const { data: images } = await supabase.from("product_image").select("*").eq("product_id", productId).order("sort_order");
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
    if (totalCount > MAX_IMAGES) setMessage(`이미지는 최대 ${MAX_IMAGES}장까지만 가능합니다.`);
    setNewFiles([...newFiles, ...files].slice(0, MAX_IMAGES - existingImages.length));
  };

  const removeExistingImage = async (imgId: string) => {
    await supabase.from("product_image").delete().eq("id", imgId);
    setExistingImages(existingImages.filter((i) => i.id !== imgId));
  };
  const removeNewFile = (idx: number) => setNewFiles(newFiles.filter((_, i) => i !== idx));

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
      await supabase.from("product_attribute_value").upsert(rows, { onConflict: "product_id,attribute_definition_id" });
    }

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
    <div className="modal-dim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p>불러오는 중...</p>
          ) : (
            <>
              <div className="field">
                <label>
                  서브카테고리 <span className="req">*</span>
                </label>
                <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} disabled={readOnly} className="select">
                  <option value="">선택하세요</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.category?.name}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>
                  기기 <span className="req">*</span>
                </label>
                <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} disabled={readOnly} className="select">
                  <option value="">선택하세요</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>
                  제품명 <span className="req">*</span>
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} className="input" />
              </div>

              <div className="field">
                <label>가격</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={readOnly} className="input" />
              </div>

              <div className="field">
                <label>캐치프레이즈</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} disabled={readOnly} className="input" />
              </div>

              <div className="field" style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                  <input type="checkbox" checked={isRecommended} onChange={(e) => setIsRecommended(e.target.checked)} disabled={readOnly} />
                  추천 제품
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                  상태
                  <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly} className="select" style={{ height: 36, width: 120 }}>
                    <option value="draft">임시저장</option>
                    <option value="published">게시</option>
                  </select>
                </label>
              </div>

              <div className="field">
                <label>제품 이미지 (최대 {MAX_IMAGES}장)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {existingImages.map((img) => (
                    <div key={img.id} style={{ position: "relative" }}>
                      <img src={img.image_url} className="thumb" style={{ width: 72, height: 72 }} />
                      {!readOnly && (
                        <button onClick={() => removeExistingImage(img.id)} className="x" style={imgRemoveStyle}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {newFiles.map((file, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={URL.createObjectURL(file)} className="thumb" style={{ width: 72, height: 72 }} />
                      <button onClick={() => removeNewFile(idx)} className="x" style={imgRemoveStyle}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {!readOnly && <input type="file" accept="image/*" multiple onChange={handleFileSelect} />}
              </div>

              {attributeDefs.map((def) => {
                const v = values[def.id] || {};
                return (
                  <div key={def.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
                    <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 13.5 }}>{def.name}</p>

                    {def.display_type === "slider" && (
                      <div>
                        <p className="help" style={{ marginTop: 0, display: "flex", justifyContent: "space-between" }}>
                          <span>{def.label_left}</span>
                          <span>{def.label_right}</span>
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
                        <p className="help">{v.gauge_value || 2} / 4</p>
                        <input
                          placeholder="비교 설명"
                          value={v.description || ""}
                          disabled={readOnly}
                          onChange={(e) => updateValue(def.id, "description", e.target.value)}
                          className="input"
                          style={{ height: 38, marginTop: 6 }}
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
                          className="input"
                          style={{ height: 38, marginBottom: 6 }}
                        />
                        <input
                          placeholder="비교 설명"
                          value={v.description || ""}
                          disabled={readOnly}
                          onChange={(e) => updateValue(def.id, "description", e.target.value)}
                          className="input"
                          style={{ height: 38 }}
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
                          className="input"
                          style={{ height: 38, marginBottom: 6 }}
                        />
                        <input
                          placeholder="칩 내용"
                          value={v.chip_content || ""}
                          disabled={readOnly}
                          onChange={(e) => updateValue(def.id, "chip_content", e.target.value)}
                          className="input"
                          style={{ height: 38 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {message && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8 }}>{message}</p>}
            </>
          )}
        </div>

        <div className="modal-foot">
          <button onClick={onClose} className="btn btn-soft">
            {readOnly ? "닫기" : "취소"}
          </button>
          {!readOnly && (
            <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
              {saving ? "저장 중..." : "저장"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const imgRemoveStyle: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  width: 20,
  height: 20,
  background: "var(--ink)",
  color: "white",
  fontSize: 10,
};
