import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export async function GET() {
  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const response = await backendClient.get("/api/dashboard/provinces", {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("[Dashboard Provinces API] Error:", error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to fetch provinces" },
      { status: error.response?.status || 500 }
    );
  }
}
