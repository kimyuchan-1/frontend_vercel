import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!; 

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
