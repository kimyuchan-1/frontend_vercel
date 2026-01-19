import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendClient } from "@/lib/backendClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const province = searchParams.get("province");

  if (!province || !province.trim()) {
    return NextResponse.json({ error: "province is required" }, { status: 400 });
  }

  try {
    const c = await cookies();
    const cookieHeader = c
      .getAll()
      .map((x) => `${x.name}=${x.value}`)
      .join("; ");

    const response = await backendClient.get(`/api/district/cities`,{
      params : { province: province.trim() },
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    return NextResponse.json(response.data);

  } catch (error : any) {

    console.error("[PedAcc Cities API] Error:",error.message);

    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to fetch cities" },
      { status: error.response?.status || 500 }
    )
  }
}
