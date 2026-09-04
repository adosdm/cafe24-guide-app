import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MALL_ID = "adoworldwidetest"; // 실제 쇼핑몰 아이디로 교체
const CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;
const REDIRECT_URI = "https://cafe24-guide-app.vercel.app/api/auth/callback";

// 서버 전용 supabase 클라이언트 (anon key로도 동작하지만, 이후 RLS 켜면 service role key로 교체 권장)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "code 값이 없습니다." }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch(`https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "토큰 교환 실패", detail: tokenData }, { status: 400 });
    }

    // DB에 저장 (mall_id 기준으로 upsert: 이미 있으면 갱신, 없으면 새로 생성)
    const { error: upsertError } = await supabase.from("cafe24_token").upsert(
      {
        mall_id: MALL_ID,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mall_id" }
    );

    if (upsertError) {
      return NextResponse.json({ error: "토큰 저장 실패", detail: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "인증 및 토큰 저장 성공" });
  } catch (err) {
    return NextResponse.json({ error: "서버 에러", detail: String(err) }, { status: 500 });
  }
}
