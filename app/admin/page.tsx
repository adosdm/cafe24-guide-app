import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>개요</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        왼쪽 상단 메뉴에서 관리할 기능을 선택하세요.
      </p>
      <Link
        href="/admin/compare"
        style={{
          display: "inline-block",
          background: "#111",
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        비교하기 관리로 이동 →
      </Link>
    </div>
  );
}
