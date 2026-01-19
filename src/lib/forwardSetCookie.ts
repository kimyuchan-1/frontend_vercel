import type { NextResponse } from "next/server";
import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";

export function forwardSetCookie(
  res: NextResponse,
  upstreamHeaders: AxiosResponseHeaders | RawAxiosResponseHeaders | unknown
) {
  if (!upstreamHeaders) {
    return;
  }

  const anyHeader = upstreamHeaders as any;

  // axios의 getSetCookie() 메서드 사용 (axios >= 1.x)
  if (typeof anyHeader.getSetCookie === "function") {
    const cookies: string[] = anyHeader.getSetCookie();
    for (const c of cookies) {
      res.headers.append("Set-Cookie", c);
    }
    return;
  }

  // axios headers 객체에서 직접 접근
  const setCookieValue =
    anyHeader["set-cookie"] ?? anyHeader["Set-Cookie"];

  if (!setCookieValue) {
    return;
  }

  if (Array.isArray(setCookieValue)) {
    for (const c of setCookieValue) {
      res.headers.append("Set-Cookie", c);
    }
  } else if (typeof setCookieValue === "string") {
    res.headers.append("Set-Cookie", setCookieValue);
  }
}