import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import type { Media } from "@/lib/types";
import { MediaTable } from "./media-table";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const supabase = await requireOwner();

  // Same rows and same order as /studio and /, so dragging here means what it
  // looks like it means. reorderMedia writes sort_order = array index, so this
  // list must never be filtered.
  const { data } = await supabase
    .from("media")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // Count only — the inquiries themselves are read on their own page.
  const { count: openInquiries } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("handled", false);

  const media = (data ?? []) as Media[];
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

  const hidden = media.filter((m) => !m.published).length;
  const big = media.filter((m) => m.featured).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="display text-4xl">Admin</h1>
        <nav className="flex gap-5 text-sm text-[var(--color-paper-dim)]">
          <Link
            href="/admin/inquiries"
            className="underline underline-offset-4 transition hover:text-[var(--color-gold)]"
          >
            Inquiries
            {openInquiries ? (
              <span className="ml-1 text-[var(--color-gold)]">
                ({openInquiries})
              </span>
            ) : null}
          </Link>
          <Link
            href="/studio"
            className="underline underline-offset-4 transition hover:text-[var(--color-gold)]"
          >
            Studio (upload)
          </Link>
        </nav>
      </div>

      <p className="mt-2 text-sm text-[var(--color-paper-dim)]">
        {media.length} {media.length === 1 ? "piece" : "pieces"}
        {hidden > 0 && ` · ${hidden} hidden`}
        {big > 0 && ` · ${big} big`}
        {" · "}top of this list is top of the page
      </p>

      <div className="mt-8">
        <MediaTable media={media} bucketUrl={bucketUrl} />
      </div>
    </main>
  );
}
