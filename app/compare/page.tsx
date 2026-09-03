"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CustomerComparePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("category")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data || []);
        if (data && data[0]) setCategoryId(data[0].id);
      });
    supabase
      .from("device")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setDevices(data || []);
        if (data && data[0]) setDeviceId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!categoryId || !deviceId) return;
    (async () => {
      const { data: subs } = await supabase
        .from("subcategory")
        .select("id, name, description")
        .eq("category_id", categoryId)
        .order("sort_order");

      const result = [];
      for (const sub of subs || []) {
        const { data: products } = await supabase
          .from("comparison_product")
          .select(
            `id, name, price, tagline, is_recommended, detail_url,
             product_image ( image_url, sort_order ),
             product_attribute_value (
               gauge_value, icon_text, chip_title, chip_content, description,
               attribute_definition ( name, display_type, label_left, label_right, sort_order )
             )`
          )
          .eq("subcategory_id", sub.id)
          .eq("device_id", deviceId)
          .eq("status", "published");

        if (products && products.length > 0) result.push({ subcategory: sub, products });
      }
      setGroups(result);
    })();
  }, [categoryId, deviceId]);

  return (
    <div>
      <header className="gnb">
        <div className="gnb-inner">
          <div className="gnb-logo">SMART GUIDE</div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 900 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          다양한 제품을 한눈에 비교해 보세요
        </h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={c.id === categoryId ? "btn btn-primary btn-sm" : "btn btn-soft btn-sm"}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setDeviceId(d.id)}
              className={d.id === deviceId ? "badge badge-dark" : "badge badge-soft"}
              style={{ cursor: "pointer", border: "none" }}
            >
              {d.name}
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="empty">
            <p>이 조합에 등록된 제품이 아직 없습니다</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.subcategory.id} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>{group.subcategory.name}</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 16 }}>{group.subcategory.description}</p>

            {group.products.map((p: any) => {
              const images = (p.product_image || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
              const attrs = (p.product_attribute_value || []).sort(
                (a: any, b: any) => (a.attribute_definition?.sort_order || 0) - (b.attribute_definition?.sort_order || 0)
              );
              return (
                <div key={p.id} className="card" style={{ padding: 20, marginBottom: 16, display: "flex", gap: 20 }}>
                  {images[0] && <img src={images[0].image_url} className="thumb" style={{ width: 140, height: 140 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {p.is_recommended && <span className="badge badge-accent">추천</span>}
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</h3>
                    </div>
                    <p style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 12 }}>{p.tagline}</p>

                    {attrs.map((v: any, idx: number) => {
                      const def = v.attribute_definition;
                      if (!def) return null;
                      if (def.display_type === "slider") {
                        return (
                          <div key={idx} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)" }}>
                              <span>{def.label_left}</span>
                              <span style={{ fontWeight: 700, color: "var(--ink)" }}>{def.name}</span>
                              <span>{def.label_right}</span>
                            </div>
                            <div style={{ background: "var(--line-2)", borderRadius: 4, height: 6, marginTop: 4 }}>
                              <div
                                style={{
                                  width: `${((v.gauge_value || 1) / 4) * 100}%`,
                                  background: "var(--accent)",
                                  height: 6,
                                  borderRadius: 4,
                                }}
                              />
                            </div>
                            {v.description && <p className="help">{v.description}</p>}
                          </div>
                        );
                      }
                      if (def.display_type === "icon") {
                        return (
                          <p key={idx} style={{ fontSize: 12.5, marginBottom: 6 }}>
                            <b>{def.name}:</b> {v.icon_text}
                          </p>
                        );
                      }
                      if (def.display_type === "chip") {
                        return (
                          <div key={idx} className="badge badge-soft" style={{ height: "auto", display: "inline-block", padding: "6px 12px", marginBottom: 6 }}>
                            <p style={{ fontSize: 12, fontWeight: 700 }}>{v.chip_title}</p>
                            <p style={{ fontSize: 11, color: "var(--ink-3)" }}>{v.chip_content}</p>
                          </div>
                        );
                      }
                      return null;
                    })}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
                      <span className="num" style={{ fontWeight: 800, fontSize: 15 }}>
                        {p.price ? p.price.toLocaleString() + "원" : ""}
                      </span>
                      {p.detail_url && (
                        <a href={p.detail_url} className="btn btn-primary btn-sm">
                          구입하기
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
