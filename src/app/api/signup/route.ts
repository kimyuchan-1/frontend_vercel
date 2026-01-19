import { NextResponse } from "next/server";
import { backendClient } from "@/lib/backendClient";
import { forwardSetCookie } from "@/lib/forwardSetCookie";
import axios from "axios";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid request body" }, { status: 400 });

  try {
    const cookie = req.headers.get("cookie") ?? "";

    const upstream = await backendClient.post("/api/auth/register", body, {
      headers: { "content-type": "application/json", cookie },
      validateStatus: () => true,
    });

    const res = NextResponse.json(upstream.data ?? null, { status: upstream.status });
    forwardSetCookie(res, upstream.headers);
    return res;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return NextResponse.json({ message: "Upstream error", detail: err.message }, { status: 502 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
