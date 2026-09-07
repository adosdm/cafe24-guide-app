"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const MAX_VARIANTS = 4;
const MAX_TIPS = 4;

type Props = {
  mode: "create" | "edit" | "view";
  guideId: string | null;
  categories: any[];
  devices: any[];
  onClose: () => void;
  onSaved: () => void;
};

export default function GuideModal({ mode, guideId, categories, onClose, onSaved }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [linkedProductNo, setLinkedProductNo] = useState("");
  const [status, setStatus] = useState("draft");
  const [showInBanner, setShowInBanner] = useState(false);
  const [groupLabel, setGroupLabel] = useState("");

  const [qnaBoardNo, setQnaBoardNo] = useState("");
  const [qnaKeyword, setQnaKeyword] = useState("");

  // 부착가이드 영상 (최대 4개)
  const [variants, setVariants] = useState<any[]>([]);
  // 관련 콘텐츠
  const [contents, setContents] = useState<any[]>([]);
  // TIP 쇼츠 (최대 4개)
  const [tips, setTips] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const readOnly = mode === "view";
  const title_text = mode === "create" ? "가이드 등록" : mode === "edit" ? "가이드 수정" : "가이드 상세보기";

  useEffect(() => {
    if (!guideId) return;
    setLoading(true);
    (async () => {
      const { data: guide } = await supabase.from("guide").select("*").eq("id", guideId).single();
      if (guide) {
        setCategoryId(guide.category_id);
        setTitle(guide.title);
        setThumbnailUrl(guide.thumbnail_url || "");
        setLinkedProductNo(guide.linked_product_no || "");
        setStatus(guide.status || "draft");
        setShowInBanner(guide.show_in_banner || false);
        setGroupLabel(guide.group_label || "");
        setQnaBoardNo(guide.qna_board_no || "");
        setQnaKeyword(guide.qna_keyword || "");
      }

      const { data: variantRows } = await supabase
        .from("guide_device_variant")
        .select("*")
        .eq("guide_id", guideId)
        .order("sort_order");
      setVariants(variantRows || []);

      const { data: contentRows } = await supabase
        .from("guide_related_content")
        .select("*")
        .eq("guide_id", guideId)
        .order("sort_order");
      setContents(contentRows || []);

      const { data: tipRows } = await supabase
        .from("guide_tip")
        .select("*")
        .eq("guide_id", guideId)
        .order("sort_order");
      setTips(tipRows || []);

      setLoading(false);
    })();
  }, [guideId]);

  const uploadFile = async (file: File, pathPrefix: string) => {
    const filePath = `${pathPrefix}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) return null;
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ── 부착가이드 영상 (variants) ──
  const addVariant = () => {
    if (variants.length >= MAX_VARIANTS) {
      setMessage(`부착가이드 영상은 최대 ${MAX_VARIANTS}개까지 가능합니다.`);
      return;
    }
    setVariants([
      ...variants,
      { _new: true, device_range_label: "", youtube_url: "", thumbnail_url: "", description: "" },
    ]);
  };
  const updateVariant = (idx: number, field: string, value: any) => {
    const next = [...variants];
    next[idx] = { ...next[idx], [field]: value };
    setVariants(next);
  };
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  // ── 관련 콘텐츠 (contents) ──
  const addContent = () => {
    setContents([
      ...contents,
      { _new: true, title: "", subtitle: "", youtube_url: "", thumbnail_url: "", badge_text: "" },
    ]);
  };
  const updateContent = (idx: number, field: string, value: any) => {
    const next = [...contents];
    next[idx] = { ...next[idx], [field]: value };
    setContents(next);
  };
  const removeContent = (idx: number) => setContents(contents.filter((_, i) => i !== idx));

  // ── TIP 쇼츠 (tips) ──
  const addTip = () => {
    if (tips.length >= MAX_TIPS) {
      setMessage(`TIP 쇼츠 영상은 최대 ${MAX_TIPS}개까지 가능합니다.`);
      return;
    }
    setTips([...tips, { _new: true, title: "", shorts_video_url: "", thumbnail_url: "", play_mode: "inline" }]);
  };
  const updateTip = (idx: number, field: string, value: any) => {
    const next = [...tips];
    next[idx] = { ...next[idx], [field]: value };
    setTips(next);
  };
  const removeTip = (idx: number) => setTips(tips.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!categoryId || !title) {
      setMessage("카테고리와 제목은 필수입니다.");
      return;
    }
    setSaving(true);
    setMessage("");

    let finalThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      const uploaded = await uploadFile(thumbnailFile, "guide/thumbnail");
      if (uploaded) finalThumbnailUrl = uploaded;
    }

    const payload = {
      category_id: categoryId,
      title,
      thumbnail_url: finalThumbnailUrl,
      linked_product_no: linkedProductNo || null,
      status,
      show_in_banner: showInBanner,
      group_label: groupLabel || null,
      qna_board_no: qnaBoardNo || null,
      qna_keyword: qnaKeyword || null,
    };

    let currentGuideId = guideId;

    if (mode === "create") {
      const { data, error } = await supabase.from("guide").insert(payload).select().single();
      if (error || !data) {
        setMessage("저장 실패: " + error?.message);
        setSaving(false);
        return;
      }
      currentGuideId = data.id;
    } else if (mode === "edit" && guideId) {
      const { error } = await supabase.from("guide").update(payload).eq("id", guideId);
      if (error) {
        setMessage("저장 실패: " + error.message);
        setSaving(false);
        return;
      }
    }

    if (!currentGuideId) {
      setSaving(false);
      return;
    }

    // 기존 하위 데이터 전체 삭제 후 재삽입 (단순하고 안전한 방식)
    await supabase.from("guide_device_variant").delete().eq("guide_id", currentGuideId);
    await supabase.from("guide_related_content").delete().eq("guide_id", currentGuideId);
    await supabase.from("guide_tip").delete().eq("guide_id", currentGuideId);

    if (variants.length > 0) {
      const rows = variants.map((v, idx) => ({
        guide_id: currentGuideId,
        device_range_label: v.device_range_label,
        youtube_url: v.youtube_url,
        thumbnail_url: v.thumbnail_url,
        description: v.description,
        sort_order: idx + 1,
      }));
      await supabase.from("guide_device_variant").insert(rows);
    }

    if (contents.length > 0) {
      const rows = contents.map((c, idx) => ({
        guide_id: currentGuideId,
        title: c.title,
        subtitle: c.subtitle,
        youtube_url: c.youtube_url,
        thumbnail_url: c.thumbnail_url,
        badge_text: c.badge_text,
        sort_order: idx + 1,
      }));
      await supabase.from("guide_related_content").insert(rows);
    }

    if (tips.length > 0) {
      const rows = tips.map((t, idx) => ({
        guide_id: currentGuideId,
        title: t.title,
        shorts_video_url: t.shorts_video_url,
        thumbnail_url: t.thumbnail_url,
        play_mode: t.play_mode || "inline",
        sort_order: idx + 1,
      }));
      await supabase.from("guide_tip").insert(rows);
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="modal-dim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title_text}</h3>
          <button className="x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p>불러오는 중...</p>
          ) : (
            <>
              {/* 기본 정보 */}
              <div className="field">
                <label>
                  카테고리 <span className="req">*</span>
                </label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={readOnly} className="select">
                  <option value="">선택하세요</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>
                  제목 <span className="req">*</span>
                </label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} className="input" placeholder="예: 신지글래스 2.5D 부착가이드" />
              </div>

              <div className="field">
                <label>대표 썸네일</label>
                {thumbnailUrl && <img src={thumbnailUrl} className="thumb" style={{ width: 80, height: 80, marginBottom: 8 }} />}
                {!readOnly && (
                  <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                )}
              </div>

              <div className="field">
                <label>연동 상품번호 (선택)</label>
                <input value={linkedProductNo} onChange={(e) => setLinkedProductNo(e.target.value)} disabled={readOnly} className="input" />
              </div>

              <div className="field">
                <label>소그룹 라벨 (전체가이드 페이지에서 묶어 보여줄 제목, 예: 강화유리)</label>
                <input value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)} disabled={readOnly} className="input" placeholder="예: 강화유리, 필름" />
              </div>

              <div className="field" style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                  <input type="checkbox" checked={showInBanner} onChange={(e) => setShowInBanner(e.target.checked)} disabled={readOnly} />
                  가이드_메인 상단 배너 노출
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                  상태
                  <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly} className="select" style={{ height: 36, width: 120 }}>
                    <option value="draft">임시저장</option>
                    <option value="published">게시</option>
                  </select>
                </label>
              </div>

              {/* 1. 부착가이드 영상 */}
              <div className="card" style={{ padding: 16, marginBottom: 16, marginTop: 24 }}>
                <p style={{ fontWeight: 700, marginBottom: 12 }}>
                  부착가이드 영상 (기기 그룹별, 최대 {MAX_VARIANTS}개)
                </p>
                {variants.map((v, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--line-2)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      <input
                        placeholder="기기 범위 (예: 15 series 이상 Galaxy 24 series 이상)"
                        value={v.device_range_label || ""}
                        disabled={readOnly}
                        onChange={(e) => updateVariant(idx, "device_range_label", e.target.value)}
                        className="input"
                        style={{ height: 36, flex: 1 }}
                      />
                      {!readOnly && (
                        <button onClick={() => removeVariant(idx)} className="btn btn-sm btn-danger">
                          삭제
                        </button>
                      )}
                    </div>
                    <input
                      placeholder="유튜브 영상 URL"
                      value={v.youtube_url || ""}
                      disabled={readOnly}
                      onChange={(e) => updateVariant(idx, "youtube_url", e.target.value)}
                      className="input"
                      style={{ height: 36, marginBottom: 6 }}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      {v.thumbnail_url && <img src={v.thumbnail_url} className="thumb" style={{ width: 48, height: 48 }} />}
                      {!readOnly && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await uploadFile(file, "guide/variant");
                            if (url) updateVariant(idx, "thumbnail_url", url);
                          }}
                        />
                      )}
                    </div>
                    <input
                      placeholder="설명 (선택)"
                      value={v.description || ""}
                      disabled={readOnly}
                      onChange={(e) => updateVariant(idx, "description", e.target.value)}
                      className="input"
                      style={{ height: 36 }}
                    />
                  </div>
                ))}
                {!readOnly && variants.length < MAX_VARIANTS && (
                  <button onClick={addVariant} className="btn btn-soft btn-block">
                    + 부착가이드 영상 추가
                  </button>
                )}
              </div>

              {/* 2. 관련 콘텐츠 */}
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 12 }}>관련 콘텐츠 (클릭 시 팝업 재생)</p>
                {contents.map((c, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--line-2)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      <input
                        placeholder="제목 (예: 신지글래스 부착가이드)"
                        value={c.title || ""}
                        disabled={readOnly}
                        onChange={(e) => updateContent(idx, "title", e.target.value)}
                        className="input"
                        style={{ height: 36, flex: 1 }}
                      />
                      {!readOnly && (
                        <button onClick={() => removeContent(idx)} className="btn btn-sm btn-danger">
                          삭제
                        </button>
                      )}
                    </div>
                    <input
                      placeholder="부제 (예: 2.5Dx 지문 인식 강화유리 시리즈)"
                      value={c.subtitle || ""}
                      disabled={readOnly}
                      onChange={(e) => updateContent(idx, "subtitle", e.target.value)}
                      className="input"
                      style={{ height: 36, marginBottom: 6 }}
                    />
                    <input
                      placeholder="뱃지 문구 (예: Galaxy series)"
                      value={c.badge_text || ""}
                      disabled={readOnly}
                      onChange={(e) => updateContent(idx, "badge_text", e.target.value)}
                      className="input"
                      style={{ height: 36, marginBottom: 6 }}
                    />
                    <input
                      placeholder="유튜브 영상 URL"
                      value={c.youtube_url || ""}
                      disabled={readOnly}
                      onChange={(e) => updateContent(idx, "youtube_url", e.target.value)}
                      className="input"
                      style={{ height: 36, marginBottom: 6 }}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {c.thumbnail_url && <img src={c.thumbnail_url} className="thumb" style={{ width: 48, height: 48 }} />}
                      {!readOnly && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await uploadFile(file, "guide/content");
                            if (url) updateContent(idx, "thumbnail_url", url);
                          }}
                        />
                      )}
                    </div>
                    <p className="help">썸네일은 유튜브 자동 썸네일이 아니라 직접 업로드한 이미지가 노출됩니다.</p>
                  </div>
                ))}
                {!readOnly && (
                  <button onClick={addContent} className="btn btn-soft btn-block">
                    + 관련 콘텐츠 추가
                  </button>
                )}
              </div>

              {/* 3. TIP 쇼츠 */}
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>
                  알아두면 좋은 TIP (쇼츠 영상, 최대 {MAX_TIPS}개)
                </p>
                <p className="help" style={{ marginTop: 0, marginBottom: 12 }}>
                  지금은 그 자리에서 바로 재생되는 방식입니다. (재생방식은 항목별로 나중에 팝업으로 바꿀 수 있습니다)
                </p>
                {tips.map((t, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--line-2)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      <input
                        placeholder="제목"
                        value={t.title || ""}
                        disabled={readOnly}
                        onChange={(e) => updateTip(idx, "title", e.target.value)}
                        className="input"
                        style={{ height: 36, flex: 1 }}
                      />
                      <select
                        value={t.play_mode || "inline"}
                        onChange={(e) => updateTip(idx, "play_mode", e.target.value)}
                        disabled={readOnly}
                        className="select"
                        style={{ height: 36, width: 110 }}
                      >
                        <option value="inline">바로재생</option>
                        <option value="popup">팝업재생</option>
                      </select>
                      {!readOnly && (
                        <button onClick={() => removeTip(idx)} className="btn btn-sm btn-danger">
                          삭제
                        </button>
                      )}
                    </div>
                    <input
                      placeholder="쇼츠 영상 URL (mp4 또는 유튜브 쇼츠 링크)"
                      value={t.shorts_video_url || ""}
                      disabled={readOnly}
                      onChange={(e) => updateTip(idx, "shorts_video_url", e.target.value)}
                      className="input"
                      style={{ height: 36, marginBottom: 6 }}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {t.thumbnail_url && <img src={t.thumbnail_url} className="thumb" style={{ width: 48, height: 48 }} />}
                      {!readOnly && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await uploadFile(file, "guide/tip");
                            if (url) updateTip(idx, "thumbnail_url", url);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {!readOnly && tips.length < MAX_TIPS && (
                  <button onClick={addTip} className="btn btn-soft btn-block">
                    + TIP 쇼츠 추가
                  </button>
                )}
              </div>

              {/* 4. Q&A 연동 */}
              <div className="card" style={{ padding: 16, marginBottom: 8 }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Q&A (카페24 게시판 실시간 연동)</p>
                <p className="help" style={{ marginTop: 0, marginBottom: 12 }}>
                  이 가이드 상세페이지 하단 Q&A는 여기 등록한 값 기준으로 카페24 게시판 글을 그때그때 불러옵니다.
                </p>
                <div className="field">
                  <label>게시판 번호</label>
                  <input value={qnaBoardNo} onChange={(e) => setQnaBoardNo(e.target.value)} disabled={readOnly} className="input" placeholder="예: 4" />
                </div>
                <div className="field">
                  <label>검색 키워드 (선택 — 비워두면 게시판 글 전체)</label>
                  <input value={qnaKeyword} onChange={(e) => setQnaKeyword(e.target.value)} disabled={readOnly} className="input" placeholder="예: 신지글래스 2.5D" />
                </div>
              </div>

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
