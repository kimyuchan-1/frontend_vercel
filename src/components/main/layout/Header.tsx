import Link from "next/link";
import NavTabs from "./NavTabs";
import AccountMenu from "./AccountMenu";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser(); // null이면 비로그인

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-gray-100/80 backdrop-blur">
      <nav className="w-full flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 select-none" aria-label="Go to Home">
          <span className="text-lg font-extrabold tracking-tight text-gray-900">PedSafe</span>
          <span className="hidden sm:inline text-sm text-gray-500">보행자 교통안전 대시보드</span>
        </Link>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                회원가입
              </Link>
            </>
          ) : (
            <>
              <NavTabs />
              <span className="mx-1" aria-hidden="true" />
              <AccountMenu user={user} /> {/* user 넘기면 메뉴에서 이름 표시 가능 */}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
