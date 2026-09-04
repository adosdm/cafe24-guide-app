import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidAccessToken, MALL_ID } from "@/lib/cafe24Auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // linked_product_no가 있는 제품만 동기화 대상
  const { data: products, error } = await supabase
    .from("comparison_product")
    .select("id, linked_product_no, price")
    .not("linked_product_no", "is", null);

  if (error) {
    return NextResponse.json({ error: "제품 목록 조회 실패", detail: error.message }, { status: 500 });
  }

  if (!products || products.length === 0) {
    return NextResponse.json({ message: "동기화할 상품이 없습니다.", updated: 0 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    return NextResponse.json({ error: "토큰 오류", detail: String(err) }, { status: 500 });
  }

  const results: any[] = [];

  for (const p of products) {
    try {
      const res = await fetch(
        `https://${MALL_ID}.cafe24api.com/api/v2/admin/products/${p.linked_product_no}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Cafe24-Api-Version": "2026-09-01",
          },
        }
      );
      const data = await res.json();

      if (!res.ok) {
        results.push({ id: p.id, product_no: p.linked_product_no, status: "실패", detail: data });
        continue;
      }

      const newPrice = Number(data.product.price);

      if (newPrice !== p.price) {
        await supabase.from("comparison_product").update({ price: newPrice }).eq("id", p.id);
        results.push({ id: p.id, product_no: p.linked_product_no, status: "변경됨", oldPrice: p.price, newPrice });
      } else {
        results.push({ id: p.id, product_no: p.linked_product_no, status: "변동없음", price: newPrice });
      }

      // 카페24 API 호출 제한(초당 요청수) 보호를 위한 짧은 대기
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      results.push({ id: p.id, product_no: p.linked_product_no, status: "에러", detail: String(err) });
    }
  }

  return NextResponse.json({
    message: "동기화 완료",
    total: products.length,
    updated: results.filter((r) => r.status === "변경됨").length,
    results,
  });
}
