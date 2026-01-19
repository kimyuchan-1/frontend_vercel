import { NextResponse } from "next/server";
import axios from "axios";
import { backendClient } from "@/lib/backendClient";
import { forwardSetCookie } from "@/lib/forwardSetCookie";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") ?? "";

    const upstream = await backendClient.get("/api/auth/me", {
      headers: { cookie },
      validateStatus: () => true,
    });

    const res = NextResponse.json(upstream.data ?? null, { status: upstream.status });
    forwardSetCookie(res, upstream.headers); // 백엔드가 토큰 갱신(set-cookie)하면 전달
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
