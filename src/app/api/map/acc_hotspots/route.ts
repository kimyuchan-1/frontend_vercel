import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";
import type { ApiResponse } from "@/lib/api/account"

function parseBounds(str: string | null) {
  if (!str) return null;
  const [south, west, north, east] = str.split(",").map(Number);
  if ([south, west, north, east].some(Number.isNaN)) return null;
  if (south > north || west > east) return null;
  return { south, west, north, east };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boundsStr = searchParams.get("bounds");
  const limit = searchParams.get("limit") ?? "5000";

  const bound = parseBounds(boundsStr);
  if (!bound) {
    const body: ApiResponse<null> = { success: false, message: "Invalid bounds", data: null };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    const c = await cookies(); 
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const res = await backendClient.get("/api/accidents", {
      params: {
        bounds: `${bound.south},${bound.west},${bound.north},${bound.east}`,
        limit,
      },
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    const body: ApiResponse<typeof res.data> = {
      success: true,
      message: "ok",
      data: res.data,
    };

    return NextResponse.json(body, { status: res.status });
  } catch (error: any) {
    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      "Failed to fetch accidents";

    const body: ApiResponse<null> = { success: false, message: String(message), data: null };
    return NextResponse.json(body, { status });
  }
}
