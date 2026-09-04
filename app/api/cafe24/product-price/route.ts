import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, MALL_ID } from "@/lib/cafe24Auth";

// 상세페이지 URL에서 상품번호(product_no) 추출
// 지원 형태:
//  - ?product_no=123
//  - /product/상품명/123/category/...  (카페24 SEO형 URL, 숫자만 있는 세그먼트 중 카테고리 앞의 숫자)
function extractProductNo(url: string): string | null {
  try {
    const u = new URL(url);
    const queryNo = u.searchParams.get("product_no");
    if (queryNo) return queryNo;

    // /product/상품명/123/category/24/ 형태 매칭
    const match = u.pathname.match(/\/product\/[^/]+\/(\d+)/);
    if (match) return match[1];

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const detailUrl = request.nextUrl.searchParams.get("detail_url");

  if (!detailUrl) {
    return NextResponse.json({ error: "detail_url 파라미터가 필요합니다." }, { status: 400 });
  }

  const productNo = extractProductNo(detailUrl);
  if (!productNo) {
    return NextResponse.json(
      { error: "URL에서 상품번호를 찾을 수 없습니다. product_no가 포함된 카페24 상품 URL인지 확인해주세요." },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken();

    const response = await fetch(
      `https://${MALL_ID}.cafe24api.com/api/v2/admin/products/${productNo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Cafe24-Api-Version": "2024-06-01",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "상품 조회 실패", detail: data }, { status: response.status });
    }

    const product = data.product;

    return NextResponse.json({
      product_no: productNo,
      product_name: product.product_name,
      price: Number(product.price),
    });
  } catch (err) {
    return NextResponse.json({ error: "서버 에러", detail: String(err) }, { status: 500 });
  }
}
