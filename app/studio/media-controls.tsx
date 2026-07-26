"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia, setPublished } from "@/app/actions/media";

export function MediaControls({
  id,
  published,
  title,
}: {
  id: string;
  published: boolean;
  title: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // He's on a phone, so these stay visible rather than waiting for a hover.
  const what = title ?? "this one";

  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await setPublished(id, !published);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await deleteMedia(id);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setConfirming(false);
      setError(res.error);
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-8 text-[11px]">
      {error && (
        <p className="pb-1 leading-tight text-[var(--color-gold)]">{error}</p>
      )}

      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={`Permanently delete ${what}`}
            className="text-[var(--color-gold)] underline disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete for good"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="ml-auto text-[var(--color-paper-dim)] disabled:opacity-50"
          >
            Keep
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-label={`${published ? "Hide" : "Show"} ${what}`}
            className="text-[var(--color-paper)] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {busy ? "…" : published ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            aria-label={`Delete ${what}`}
            className="ml-auto text-[var(--color-paper-dim)] transition hover:text-[var(--color-gold)] disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
