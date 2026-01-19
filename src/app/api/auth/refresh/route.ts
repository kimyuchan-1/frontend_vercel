import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export async function POST() {
  try {
    const c = await cookies();
    const refreshToken = c.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "refresh token 없음", data: null },
        { status: 401 }
      );
    }

    const upstream = await backendClient.post(
      "/api/auth/refresh",
      { refreshToken },
      { validateStatus: () => true }
    );

    if (upstream.status !== 200 || !upstream.data?.accessToken) {
      return NextResponse.json(upstream.data ?? null, { status: upstream.status });
    }

    const res = NextResponse.json({ success: true }, { status: 200 });

    // ✅ Next 도메인 쿠키로 재발급
    res.cookies.set("access_token", upstream.data.accessToken, {
      httpOnly: true,
      secure: false, // 운영 HTTPS면 true
      sameSite: "lax",
      path: "/",
    });

    // (옵션) refreshToken 회전이면 같이 갱신
    if (upstream.data.refreshToken) {
      res.cookies.set("refresh_token", upstream.data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
    }

    return res;
  } catch (err: any) {
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
