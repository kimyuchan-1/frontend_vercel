import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export async function POST(req: Request) {
  try {
    const c = await cookies();

    // 브라우저 -> Next 로 들어온 쿠키들을 백엔드로 전달
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다", data: null },
        { status: 401 }
      );
    }

    // 요청 body (currentPassword, newPassword)
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "요청 본문이 올바르지 않습니다", data: null },
        { status: 400 }
      );
    }

    const upstream = await backendClient.post("/api/auth/change-password", body, {
      headers: {
        Cookie: cookieHeader, // ✅ 대문자 권장
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    });

    // 백엔드가 ApiResponse를 주면 그대로 전달
    return NextResponse.json(upstream.data ?? null, { status: upstream.status });
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
