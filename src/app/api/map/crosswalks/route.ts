import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";
import { forwardSetCookie } from "@/lib/forwardSetCookie";

type Bounds = { south: number; west: number; north: number; east: number };

function parseBounds(str: string | null): Bounds | null {
  if (!str) return null;
  const [south, west, north, east] = str.split(",").map(Number);
  if ([south, west, north, east].some(Number.isNaN)) return null;
  if (south > north || west > east) return null;
  return { south, west, north, east };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bound = parseBounds(searchParams.get("bounds"));
    const limit = searchParams.get("limit") ?? "5000";

    if (!bound) {
      return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
    }

    // Next(server) -> Spring Boot로 쿠키 전달
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const upstream = await backendClient.get("/api/crosswalks", {
      params: {
        bounds: `${bound.south},${bound.west},${bound.north},${bound.east}`,
        limit,
      },
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    const res = NextResponse.json(upstream.data, { status: upstream.status });

    // 백엔드가 Set-Cookie를 내려주면 프론트로 그대로 전달
    forwardSetCookie(res, upstream.headers);

    return res;
  } catch (e) {
    console.error("API Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
