"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function toEmbedUrl(url: string) {
  if (!url) return "";
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url;
}

export default function GuideDetailPage() {
  const params = useParams();
  const guideId = params.id as string;

  const [guide, setGuide] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [qnaPosts, setQnaPosts] = useState<any[]>([]);
  const [qnaLoading, setQnaLoading] = useState(false);

  const [playingVariant, setPlayingVariant] = useState<string | null>(null);
  const [popupContent, setPopupContent] = useState<any>(null); // 관련 콘텐츠 팝업
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    if (!guideId) return;

    supabase.from("guide").select("*").eq("id", guideId).single().then(({ data }) => setGuide(data));

    supabase
      .from("guide_device_variant")
      .select("*")
      .eq("guide_id", guideId)
      .order("sort_order")
      .then(({ data }) => setVariants(data || []));

    supabase
      .from("guide_related_content")
      .select("*")
      .eq("guide_id", guideId)
      .order("sort_order")
      .then(({ data }) => setContents(data || []));

    supabase
      .from("guide_tip")
      .select("*")
      .eq("guide_id", guideId)
      .order("sort_order")
      .then(({ data }) => setTips(data || []));
  }, [guideId]);

  // Q&A: 카페24 게시판 실시간 조회
  useEffect(() => {
    if (!guide?.qna_board_no) return;
    setQnaLoading(true);
    const qs = new URLSearchParams({
      board_no: guide.qna_board_no,
      ...(guide.qna_keyword ? { keyword: guide.qna_keyword } : {}),
    });
    fetch(`/api/cafe24/board-posts?${qs.toString()}`)
      .then((res) => res.json())
      .then((data) => setQnaPosts(data.posts || []))
      .catch(() => setQnaPosts([]))
      .finally(() => setQnaLoading(false));
  }, [guide]);

  if (!guide) return null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px 100px", fontFamily: "Pretendard, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 40 }}>{guide.title}</h1>

      {/* 1. 부착가이드 영상 (기기 그룹별, 최대 4개) */}
      {variants.map((v) => (
        <div key={v.id} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{guide.title}</p>
          {v.device_range_label && <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>{v.device_range_label}</p>}

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: 16,
              overflow: "hidden",
              background: "#333",
              cursor: playingVariant === v.id ? "default" : "pointer",
            }}
            onClick={() => v.youtube_url && setPlayingVariant(v.id)}
          >
            {playingVariant === v.id ? (
              <iframe
                src={toEmbedUrl(v.youtube_url)}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <>
                {v.thumbnail_url && (
                  <img src={v.thumbnail_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {v.youtube_url && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.85)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      ▶
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {v.description && <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>{v.description}</p>}
        </div>
      ))}

      {/* 2. 관련 콘텐츠 (클릭시 팝업) */}
      {contents.length > 0 && (
        <div style={{ marginTop: 48, marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>관련 콘텐츠</h2>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {contents.map((c) => (
              <div
                key={c.id}
                onClick={() => setPopupContent(c)}
                style={{ minWidth: 220, cursor: "pointer", borderRadius: 12, overflow: "hidden", border: "1px solid #eee" }}
              >
                <div style={{ width: "100%", height: 130, background: "#EFF1F2" }}>
                  {c.thumbnail_url && (
                    <img src={c.thumbnail_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  {c.badge_text && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#F0F0F0",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginBottom: 4,
                        display: "inline-block",
                      }}
                    >
                      {c.badge_text}
                    </span>
                  )}
                  {c.subtitle && <p style={{ fontSize: 11, color: "#999" }}>{c.subtitle}</p>}
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TIP 쇼츠 */}
      {tips.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>알아두면 좋은 TIP</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
            {tips.map((t) => (
              <TipCard key={t.id} tip={t} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Q&A - 카페24 게시판 실시간 연동 */}
      {guide.qna_board_no && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Q&A</h2>
          <div style={{ borderTop: "1px solid #000" }}>
            {qnaLoading && <p style={{ padding: 16, color: "#999", fontSize: 13 }}>불러오는 중...</p>}
            {!qnaLoading && qnaPosts.length === 0 && (
              <p style={{ padding: 16, color: "#999", fontSize: 13 }}>등록된 문의가 없습니다.</p>
            )}
            {qnaPosts.map((post, idx) => (
              <div key={idx} style={{ borderBottom: "1px solid #eee" }}>
                <div
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "16px 4px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <span>Q. {post.title}</span>
                  <span>{openFaqIdx === idx ? "−" : "+"}</span>
                </div>
                {openFaqIdx === idx && (
                  <div style={{ background: "#FAFAFA", padding: 16, fontSize: 13, color: "#555" }}>
                    A. {post.content || post.answer || "답변 준비중입니다."}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 관련 콘텐츠 팝업 */}
      {popupContent && (
        <div className="modal-dim" onClick={() => setPopupContent(null)}>
          <div
            style={{ width: "90%", maxWidth: 720, aspectRatio: "16/9", borderRadius: 12, overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={toEmbedUrl(popupContent.youtube_url)}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TipCard({ tip }: { tip: any }) {
  const [popupOpen, setPopupOpen] = useState(false);

  const isVideo = tip.shorts_video_url && /\.(mp4|webm)$/i.test(tip.shorts_video_url);

  const player = (
    <div style={{ width: "100%", height: "100%", background: "#000" }}>
      {isVideo ? (
        <video src={tip.shorts_video_url} controls autoPlay muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <iframe
          src={toEmbedUrl(tip.shorts_video_url)}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; encrypted-media"
        />
      )}
    </div>
  );

  if (tip.play_mode === "popup") {
    return (
      <>
        <div
          onClick={() => setPopupOpen(true)}
          style={{
            position: "relative",
            aspectRatio: "9/16",
            borderRadius: 12,
            overflow: "hidden",
            background: "#111",
            cursor: "pointer",
          }}
        >
          {tip.thumbnail_url && <img src={tip.thumbnail_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <p style={{ position: "absolute", bottom: 8, left: 8, color: "#fff", fontSize: 12, fontWeight: 700 }}>{tip.title}</p>
        </div>
        {popupOpen && (
          <div className="modal-dim" onClick={() => setPopupOpen(false)}>
            <div style={{ width: 280, aspectRatio: "9/16" }} onClick={(e) => e.stopPropagation()}>
              {player}
            </div>
          </div>
        )}
      </>
    );
  }

  // inline: 바로 그 자리에서 재생
  return (
    <div style={{ aspectRatio: "9/16", borderRadius: 12, overflow: "hidden" }}>
      {player}
      <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{tip.title}</p>
    </div>
  );
}
