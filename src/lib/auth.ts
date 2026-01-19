import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export type AuthUser = {
  id: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  // Next(server) -> Spring Boot로 쿠키 수동 전달
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) return null;

  try {
    const res = await backendClient.get("/api/auth/me", {
      headers: { cookie: cookieHeader },
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (res.status !== 200) return null;

    // 백엔드 응답 DTO에 맞춰 매핑
    const payload = res.data ?? {};
    const user = payload.data ?? {}; // ApiResponse의 data

    return {
      id: user.id?.toString?.() ?? user.id ?? null,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role ?? null,
    };
  } catch {
    return null;
  }
}
