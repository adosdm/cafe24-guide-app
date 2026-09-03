"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOn = (path: string) => (pathname === path ? "on" : "");
  const isOnPrefix = (prefix: string) => (pathname?.startsWith(prefix) ? "on" : "");

  return (
    <div>
      <header className="gnb">
        <div className="gnb-inner">
          <nav className="gnb-menu">
            <Link href="/admin/compare" className={isOnPrefix("/admin/compare")}>
              비교하기
            </Link>
            <Link href="/admin/guide" className={isOnPrefix("/admin/guide")}>
              가이드
            </Link>
          </nav>

          {/* 로고 자리 - 원하는 텍스트나 이미지로 교체하세요 */}
          <div className="gnb-logo">SMART GUIDE</div>

          <div className="gnb-util">
            <Link href="/compare" target="_blank" className="btn btn-primary btn-sm">
              고객 화면 보기 ↗
            </Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {children}
      </main>
    </div>
  );
}
