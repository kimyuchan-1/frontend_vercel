import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;


  const backend = process.env.BACKEND_URL_NIP; // ex) https://xxxx.ngrok-free.dev
  if (!backend) {
    return NextResponse.json({ error: "BACKEND_URL_NGROK is not set" }, { status: 500 });
  }

  const url = `${backend}/oauth2/authorization/${provider}`;

  const res = NextResponse.redirect(url, { status: 302 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
