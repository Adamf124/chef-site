import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// @supabase/ssr types `cookies` as a union with the deprecated get/set/remove
// shape, so these params don't get contextually typed. Annotate or `next build`
// fails on implicit any under strict mode.
type CookiesToSet = { name: string; value: string; options: CookieOptions }[];

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component. Safe to ignore when middleware
            // is refreshing sessions.
          }
        },
      },
    },
  );
}
