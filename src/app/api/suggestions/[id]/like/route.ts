import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

function parseIntStrict(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseIntStrict(id);

    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const response = await backendClient.post(
      `/api/suggestions/${suggestionId}/like`,
      {},
      { headers: { Cookie: cookieHeader } }
    );

    const data = response.data;

    return NextResponse.json({
      liked: data.liked ?? false,
      message: data.message ?? (data.liked ? "좋아요를 추가했습니다." : "좋아요를 취소했습니다."),
    });
  } catch (error: any) {
    console.error("Like POST error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
