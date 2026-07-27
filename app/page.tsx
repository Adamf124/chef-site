import { createClient } from "@/lib/supabase/server";
import { site } from "@/site.config";
import type { Media } from "@/lib/types";
import { MediaGrid } from "@/components/media-grid";
import { InquiryForm } from "@/components/inquiry-form";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("*")
    .eq("published", true)
    // `sort_order` alone decides position, set by dragging in /admin or /studio.
    // `featured` only makes a tile render 2x2 below; it no longer floats to the
    // top, or dragging something above a featured piece would silently no-op.
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const media = (data ?? []) as Media[];
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

  return (
    <main>
      <header className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-paper-dim)]">
          {site.location}
        </p>
        <h1 className="display mt-4 text-5xl leading-[0.95] sm:text-7xl">
          {site.chefName}
        </h1>
        <p className="mt-6 max-w-md text-lg text-[var(--color-paper-dim)]">
          {site.tagline}
        </p>
      </header>

      <section aria-label="The food">
        {media.length > 0 ? (
          <MediaGrid media={media} bucketUrl={bucketUrl} />
        ) : (
          <p className="mx-auto max-w-6xl px-6 pb-24 text-[var(--color-paper-dim)]">
            The first dishes are on their way.
          </p>
        )}
      </section>

      <section
        id="contact"
        className="mx-auto max-w-6xl border-t hairline px-6 py-24"
      >
        <h2 className="display text-3xl sm:text-4xl">Get in touch</h2>
        <p className="mt-3 max-w-md text-[var(--color-paper-dim)]">
          Tell me what you have in mind and I&apos;ll get back to you.
        </p>
        <div className="mt-10 max-w-lg">
          <InquiryForm />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t hairline px-6 py-10 text-sm text-[var(--color-paper-dim)]">
        {site.chefName} · {site.location}
      </footer>
    </main>
  );
}
