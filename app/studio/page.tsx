import { createClient } from "@/lib/supabase/server";
import type { Media } from "@/lib/types";
import { UploadForm } from "./upload-form";
import { MediaManager } from "./media-manager";

export const dynamic = "force-dynamic";

export default async function Studio() {
  const supabase = await createClient();
  // Same ordering as the public page, so what he drags into place here is
  // exactly what visitors see. Unpublished pieces sit in this list too.
  const { data } = await supabase
    .from("media")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const media = (data ?? []) as Media[];
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="display text-4xl">Studio</h1>
      <p className="mt-2 text-[var(--color-paper-dim)]">
        Add a photo or video. It goes live on your page right away.
      </p>

      <div className="mt-10">
        <UploadForm />
      </div>

      <h2 className="display mt-16 text-2xl">Posted</h2>
      <MediaManager media={media} bucketUrl={bucketUrl} />
    </main>
  );
}
