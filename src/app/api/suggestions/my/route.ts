import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export async function GET(req: Request) {
  try {
    const c = await cookies();
    const cookieHeader = c.getAll().map((x) => `${x.name}=${x.value}`).join("; ");

    if (!cookieHeader) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다", data: null },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const qs = url.searchParams.toString();
    const path = qs ? `/api/suggestions/my?${qs}` : "/api/suggestions/my";

    const upstream = await backendClient.get(path, {
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
