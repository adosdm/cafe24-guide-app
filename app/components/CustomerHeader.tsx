"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerHeader() {
  const pathname = usePathname();
  const isCompare = pathname?.startsWith("/compare");
  const isGuide = pathname?.startsWith("/guide");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* 왼쪽: 관리자 이동 버튼 */}
        <Link
          href="/admin/compare"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#666",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "6px 12px",
            textDecoration: "none",
          }}
        >
          관리자
        </Link>

        {/* 중앙: 로고 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1,
            color: "#1E2124",
          }}
        >
          SMART GUIDE
        </div>

        {/* 오른쪽: 메뉴 */}
        <nav style={{ marginLeft: "auto", display: "flex", gap: 28 }}>
          <Link
            href="/compare"
            style={{
              fontSize: 14,
              fontWeight: isCompare ? 700 : 500,
              color: isCompare ? "#1E2124" : "#999",
              textDecoration: "none",
            }}
          >
            비교하기
          </Link>
          <Link
            href="/guide"
            style={{
              fontSize: 14,
              fontWeight: isGuide ? 700 : 500,
              color: isGuide ? "#1E2124" : "#999",
              textDecoration: "none",
            }}
          >
            가이드
          </Link>
        </nav>
      </div>
    </header>
  );
}
