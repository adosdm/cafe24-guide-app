import { NextRequest, NextResponse } from "next/server";

// TODO: 실제 값으로 교체하세요
const MALL_ID = "adoworldwidetest"; // 카페24 쇼핑몰 아이디
const CLIENT_ID = process.env.IAvgWaXLGNPsCapdtYe5fO!;
const CLIENT_SECRET = process.env.go9SVhetPCaNXqK03exQTF!;
const REDIRECT_URI = "https://cafe24-guide-app.vercel.app/api/auth/callback";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "code 값이 없습니다." },
      { status: 400 }
    );
  }

  try {
    // code -> access token 교환
    const tokenResponse = await fetch(
      `https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Basic 인증: client_id:client_secret 을 base64 인코딩
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("토큰 교환 실패:", tokenData);
      return NextResponse.json(
        { error: "토큰 교환 실패", detail: tokenData },
        { status: 400 }
      );
    }

    // tokenData 안에 access_token, refresh_token 등이 들어있습니다.
    // 지금은 화면 확인용으로만 반환하고,
    // 다음 단계에서 이 값을 Supabase DB에 저장하는 로직을 추가합니다.
    console.log("발급된 토큰:", tokenData);

    return NextResponse.json({
      message: "토큰 발급 성공",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
    });
  } catch (err) {
    console.error("에러:", err);
    return NextResponse.json(
      { error: "서버 에러", detail: String(err) },
      { status: 500 }
    );
  }
}
