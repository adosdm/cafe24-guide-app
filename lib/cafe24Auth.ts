import { createClient } from "@supabase/supabase-js";

const MALL_ID = "adoworldwidetest"; // 실제 쇼핑몰 아이디로 교체
const CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getValidAccessToken(): Promise<string> {
  const { data: tokenRow, error } = await supabase
    .from("cafe24_token")
    .select("*")
    .eq("mall_id", MALL_ID)
    .single();

  if (error || !tokenRow) {
    throw new Error("저장된 토큰이 없습니다. 먼저 카페24 인증을 다시 진행해주세요.");
  }

  const isExpired = new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000; // 1분 여유

  if (!isExpired) {
    return tokenRow.access_token;
  }

  // 만료됨 -> refresh_token으로 재발급
  const refreshResponse = await fetch(`https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenRow.refresh_token,
    }),
  });

  const refreshed = await refreshResponse.json();

  if (!refreshResponse.ok) {
    throw new Error("토큰 갱신 실패: " + JSON.stringify(refreshed));
  }

  await supabase
    .from("cafe24_token")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("mall_id", MALL_ID);

  return refreshed.access_token;
}

export { MALL_ID };
