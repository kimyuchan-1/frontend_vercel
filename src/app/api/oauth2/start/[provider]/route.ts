import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Provider = "google" | "github" | "kakao";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    const supabase = await getSupabaseServerClient();

    // Validate provider
    const validProviders: Provider[] = ["google", "github", "kakao"];
    if (!validProviders.includes(provider as Provider)) {
      return NextResponse.json(
        { error: `Invalid provider: ${provider}` },
        { status: 400 }
      );
    }

    // Get the origin for redirect URL
    const url = new URL(req.url);
    const redirectTo = `${url.origin}/api/oauth2/callback`;

    // Start OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error("OAuth start error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redirect to OAuth provider
    return NextResponse.redirect(data.url, { status: 302 });
  } catch (error: any) {
    console.error("OAuth start error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
