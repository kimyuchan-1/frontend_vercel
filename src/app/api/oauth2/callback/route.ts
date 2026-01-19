import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(error)}`, url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/signin?error=no_code", url)
      );
    }

    const supabase = await getSupabaseServerClient();

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, url)
      );
    }

    if (!data.user) {
      return NextResponse.redirect(
        new URL("/signin?error=no_user", url)
      );
    }

    // Check if user exists in users table, if not create
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", data.user.email)
      .maybeSingle();

    if (userCheckError) {
      console.error("User check error:", userCheckError);
    }

    // Create user record if doesn't exist
    if (!existingUser && data.user.email) {
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
          picture: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        });

      if (insertError) {
        console.error("User insert error:", insertError);
        // Continue anyway, user might already exist due to race condition
      }
    }

    // Redirect to home page
    return NextResponse.redirect(new URL("/", url));
  } catch (error: any) {
    console.error("OAuth callback error:", error?.message ?? error);
    const url = new URL(req.url);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent("callback_failed")}`, url)
    );
  }
}
