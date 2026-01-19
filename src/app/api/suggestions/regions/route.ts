import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/lib/backendClient";

export async function GET(request: NextRequest) {
  try {
    const response = await backendClient.get("/api/suggestions/regions");
    const regions = response.data ?? [];
    
    return NextResponse.json(regions);
  } catch (error: any) {
    console.error("Regions API error:", error?.response?.data ?? error.message);
    const status = error?.response?.status ?? 500;
    const message = error?.response?.data?.message ?? error.message ?? "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
