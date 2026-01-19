'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';

type AuthUser = {
  id: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
};

export default function AccountMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const inButton = btnRef.current?.contains(t);
      const inMenu = menuRef.current?.contains(t);
      if (!inButton && !inMenu) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onLogout = async () => {
    setOpen(false);
    await fetch("/api/signout", { method: "POST", credentials: "include" });
    router.replace("/");
    router.refresh();        
  };

  const displayName = user.name ?? "사용자";
  const displayEmail = user.email ?? "";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className="h-9 w-9 rounded-full overflow-hidden border bg-white flex items-center justify-center hover:cursor-pointer hover:bg-gray-300"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm font-semibold">
          {(displayName?.[0] ?? "U").toUpperCase()}
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg p-1 z-50"
        >
          <div className="px-3 py-2">
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-gray-500">{displayEmail}</div>
          </div>

          <div className="h-px bg-gray-100 my-1 rounded-lg" />

          <a
            role="menuitem"
            href="/account"
            className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-300 focus:bg-gray-300 outline-none"
            onClick={() => setOpen(false)}
          >
            계정 설정
          </a>

          <button
            role="menuitem"
            type="button"
            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-300 focus:bg-gray-300 outline-none hover:cursor-pointer"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
