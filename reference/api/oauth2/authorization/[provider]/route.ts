import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider;

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL; // 
  if (!backend) {
    return NextResponse.json({ error: "BACKEND_URL is not set" }, { status: 500 });
  }

  // whitelist로 provider 제한 (open redirect/임의 경로 방지)
  const allowed = new Set(["google", "naver", "github"]);
  if (!allowed.has(provider)) {
    return NextResponse.json({ error: "invalid provider" }, { status: 400 });
  }

  const url = `${backend}/oauth2/authorization/${provider}`;
  return NextResponse.redirect(url);
}