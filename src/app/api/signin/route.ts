import { NextResponse } from "next/server";
import axios from "axios";
import { backendClient } from "@/lib/backendClient";

type SignInBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SignInBody | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { success: false, message: "이메일과 비밀번호가 필요합니다.", data: null },
      { status: 400 }
    );
  }

  try {
    // 브라우저 -> Next 로 들어온 쿠키가 있으면 Spring으로도 전달
    const cookie = req.headers.get("cookie") ?? "";

    // Spring Boot 로그인 엔드포인트로 프록시
    const upstream = await backendClient.post("/api/auth/login", body, {
      headers: { "content-type": "application/json", cookie },
      validateStatus: () => true, // 401/403도 throw 하지 않고 그대로 다룸
    });

    // Spring이 만든 응답(JSON)을 그대로 전달
    const res = NextResponse.json(upstream.data ?? null, { status: upstream.status });

    // Spring이 Set-Cookie를 내려주면 프론트엔드 도메인에서 쿠키 설정
    const setCookies = upstream.headers["set-cookie"];
    if (setCookies) {
      const cookieArray = Array.isArray(setCookies) ? setCookies : [setCookies];
      for (const cookieStr of cookieArray) {
        // 백엔드에서 온 쿠키를 파싱하여 프론트엔드 도메인에 맞게 재설정
        const match = cookieStr.match(/^([^=]+)=([^;]*)/);
        if (match) {
          const [, name, value] = match;
          res.cookies.set(name, value, {
            httpOnly: true,
            secure: false, // 로컬 개발: false / 운영(HTTPS): true
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60, // 1시간
          });
        }
      }
    }

    return res;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return NextResponse.json(
        { success: false, message: "백엔드 연결 실패", data: { detail: err.message } },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Internal server error", data: null },
      { status: 500 }
    );
  }
}
