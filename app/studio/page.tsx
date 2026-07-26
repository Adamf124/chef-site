import { createClient } from "@/lib/supabase/server";
import type { Media } from "@/lib/types";
import { UploadForm } from "./upload-form";
import { MediaControls } from "./media-controls";

export const dynamic = "force-dynamic";

export default async function Studio() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("*")
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
      <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {media.map((m) => (
          <li
            key={m.id}
            className="relative aspect-square overflow-hidden bg-[var(--color-ink-raised)]"
          >
            {m.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${bucketUrl}/${m.storage_path}`}
                alt={m.title ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={`${bucketUrl}/${m.storage_path}`}
                muted
                className="h-full w-full object-cover"
              />
            )}
            {!m.published && (
              <span className="absolute left-1 top-1 bg-black/70 px-1.5 py-0.5 text-[10px] text-[var(--color-paper-dim)]">
                hidden
              </span>
            )}
            <MediaControls
              id={m.id}
              published={m.published}
              title={m.title}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
