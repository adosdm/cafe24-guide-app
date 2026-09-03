import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  console.log("받은 code:", code);
  console.log("받은 state:", state);

  if (!code) {
    return NextResponse.json(
      { error: "code 값이 없습니다." },
      { status: 400 }
    );
  }

  // 다음 단계에서 여기에 code -> access token 교환 로직을 추가합니다.
  return NextResponse.json({ message: "콜백 수신 성공", code });
}
