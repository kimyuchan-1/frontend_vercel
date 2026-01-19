import { NextResponse } from "next/server";
import { backendClient } from "@/lib/backendClient"; // 네 경로로 수정

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";

  // 1) Spring Boot 로그아웃 호출 (쿠키 수동 전달)
  await backendClient.post(
    "/api/auth/logout",
    null,
    {
      headers: { cookie },
      // (선택) 백엔드가 204/200/401 등으로 응답할 수 있으면
      // validateStatus로 예외 덜 내게 처리 가능
      validateStatus: (s) => s >= 200 && s < 500,
    }
  );

  // 2) 프론트 쿠키 정리 + 3) 리다이렉트
  const url = new URL("/", req.url);
  const res = NextResponse.redirect(url, { status: 303 });

  res.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
