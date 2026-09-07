import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, MALL_ID } from "@/lib/cafe24Auth";

// TODO: 실제 카페24 게시판 Front/Admin API 확정되면 이 부분만 교체하면 됩니다.
// 지금은 구조만 잡아둔 상태입니다.
export async function GET(request: NextRequest) {
  const boardNo = request.nextUrl.searchParams.get("board_no");
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!boardNo) {
    return NextResponse.json({ error: "board_no가 필요합니다." }, { status: 400 });
  }

  try {
    const accessToken = await getValidAccessToken();

    // 카페24 게시판 API 예시 경로 (실제 문서 확인 후 조정 필요)
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

    if (!response.ok) {
      return NextResponse.json({ error: "게시판 조회 실패", detail: data, posts: [] }, { status: 200 });
    }

    const posts = (data.articles || []).map((a: any) => ({
      title: a.title,
      content: a.content,
      answer: a.reply_content,
    }));

    return NextResponse.json({ posts });
  } catch (err) {
    // 아직 토큰/API 미확정이라 에러 나도 화면이 깨지지 않게 빈 배열 반환
    return NextResponse.json({ error: String(err), posts: [] }, { status: 200 });
  }
}
