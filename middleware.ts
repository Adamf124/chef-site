import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// See lib/supabase/server.ts: the union type on `cookies` blocks inference.
type CookiesToSet = { name: string; value: string; options: CookieOptions }[];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Any redirect has to carry the cookies `setAll` just wrote. Returning a bare
  // NextResponse.redirect drops them, so a refresh token Supabase rotated during
  // this request is lost and the browser goes on replaying a stale one.
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const path = request.nextUrl.pathname;
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const email = user?.email?.trim().toLowerCase();

  // /admin is the owner's alone. Fails closed: no OWNER_EMAIL set means nobody
  // gets in. A signed-in non-owner goes to /studio, which is where he was
  // headed anyway — showing a signed-in man a login form helps no one.
  if (path.startsWith("/admin")) {
    if (!user) return redirectTo("/login");
    if (!owner || email !== owner) return redirectTo("/studio");
  }

  // Protect the studio. Everything else is public.
  if (path.startsWith("/studio") && !user) return redirectTo("/login");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
