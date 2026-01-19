"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "지도" },
  { href: "/pedacc", label: "사고 현황"},
  { href: "/board", label: "건의 게시판" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="flex items-center gap-6">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "inline-flex items-center py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-300",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
