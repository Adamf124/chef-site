import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate an /admin route to OWNER_EMAIL and hand back the same Supabase client,
 * so the caller doesn't build a second one.
 *
 * Middleware already does this check — this is the belt to its braces, since
 * middleware is one matcher regex away from being wrong. Fails closed: an
 * unset OWNER_EMAIL redirects everyone.
 */
export async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!owner || user?.email?.trim().toLowerCase() !== owner) {
    redirect("/studio");
  }

  return supabase;
}
