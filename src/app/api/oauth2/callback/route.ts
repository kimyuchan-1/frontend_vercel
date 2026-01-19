import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/signin?error=no_token", url));
  }

  // 프론트엔드 도메인에서 쿠키 설정
  const res = NextResponse.redirect(new URL("/", url));
  res.cookies.set("accessToken", token, {
    httpOnly: true,
    secure: false, // 로컬 개발: false / 운영(HTTPS): true
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1시간
  });

  return res;
}
