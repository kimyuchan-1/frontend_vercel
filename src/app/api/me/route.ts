import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export async function GET(_req: Request) {
  try {
    const c = await cookies();

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

    const upstream = await backendClient.get("/api/auth/me", {
      headers: { Cookie: cookieHeader },
      validateStatus: () => true,
    });

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

export async function PATCH(req: Request) {
  try {
    const c = await cookies();
    const cookieHeader = c.getAll().map(x => `${x.name}=${x.value}`).join("; ");
    if (!cookieHeader) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다", data: null },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // 백엔드의 실제 프로필 수정 엔드포인트로 맞춰야 함 (예: /api/me 또는 /api/users/me)
    const upstream = await backendClient.patch("/api/auth/me", body, {
      headers: { Cookie: cookieHeader },
      validateStatus: () => true,
    });

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

