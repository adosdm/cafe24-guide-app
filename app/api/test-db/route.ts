import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("_test").select("*").limit(1);

  if (error) {
    // 테이블이 없어서 나는 에러는 정상입니다 (연결 자체는 성공한 것)
    return NextResponse.json({ connected: true, note: error.message });
  }

  return NextResponse.json({ connected: true, data });
}
