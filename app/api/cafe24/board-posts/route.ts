import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, MALL_ID } from "@/lib/cafe24Auth";

// TODO: 실제 카페24 게시판 Front/Admin API 확정되면 이 부분만 교체하면 됩니다.
// 지금은 구조만 잡아둔 상태입니다.
export async function GET(request: NextRequest) {
  const boardNoParam = request.nextUrl.searchParams.get("board_no");
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!boardNoParam) {
    return NextResponse.json({ error: "board_no가 필요합니다." }, { status: 400 });
  }

  // 콤마로 구분된 여러 게시판 번호 지원 (예: "1,4,7")
  const boardNos = boardNoParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const accessToken = await getValidAccessToken();

    const allPosts: any[] = [];

    for (const boardNo of boardNos) {
      const url = new URL(`https://${MALL_ID}.cafe24api.com/api/v2/admin/boards/${boardNo}/articles`);
      if (keyword) url.searchParams.set("search_keyword", keyword);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Cafe24-Api-Version": "2026-09-01",
        },
      });

      const data = await response.json();
      if (response.ok) {
        const posts = (data.articles || []).map((a: any) => ({
          title: a.title,
          content: a.content,
          answer: a.reply_content,
        }));
        allPosts.push(...posts);
      }
    }

    return NextResponse.json({ posts: allPosts });
  } catch (err) {
    return NextResponse.json({ error: String(err), posts: [] }, { status: 200 });
  }
}
