import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F8", fontFamily: "sans-serif" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 40px",
          background: "white",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>스마트가이드</span>
          <Link href="/admin" style={{ color: "#333", textDecoration: "none" }}>
            개요
          </Link>
          <Link
            href="/admin/compare"
            style={{ color: "#111", fontWeight: 700, textDecoration: "none", borderBottom: "2px solid #111" }}
          >
            비교하기
          </Link>
          <Link href="/admin/guide" style={{ color: "#999", textDecoration: "none" }}>
            가이드
          </Link>
        </div>
        <Link
          href="/compare"
          target="_blank"
          style={{
            background: "#111",
            color: "white",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          고객 화면 보기 ↗
        </Link>
      </nav>
      <main style={{ padding: "32px 40px" }}>{children}</main>
    </div>
  );
}
