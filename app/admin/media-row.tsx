"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Media } from "@/lib/types";
import { NOTE_MAX, TITLE_MAX } from "@/lib/media";
import {
  deleteMedia,
  setFeatured,
  setPublished,
  updateMediaDetails,
} from "@/app/actions/media";

// Explicit locale and timezone: a bare toLocaleString() formats with the
// server's locale during SSR and the browser's on hydration, which React
// reports as a mismatch. He's in Ohio.
const when = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

const field =
  "w-full border-b hairline bg-transparent py-1.5 text-sm text-[var(--color-paper)] placeholder:text-[var(--color-paper-dim)] focus:border-[var(--color-gold)]";
const chip =
  "px-2 py-1 text-xs transition disabled:opacity-50 border hairline";
const chipOn = "text-[var(--color-ink)] bg-[var(--color-paper)]";
const chipOff = "text-[var(--color-paper-dim)] hover:text-[var(--color-gold)]";

export function MediaRow({ m, bucketUrl }: { m: Media; bucketUrl: string }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: m.id });

  // Initialised once and never re-synced from props. Every router.refresh()
  // elsewhere on the page re-renders this row; re-syncing here would wipe
  // whatever he was in the middle of typing.
  const [saved, setSaved] = useState(() => ({
    title: m.title ?? "",
    note: m.note ?? "",
  }));
  const [draft, setDraft] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = draft.title !== saved.title || draft.note !== saved.note;
  const src = `${bucketUrl}/${m.storage_path}`;

  async function save() {
    const sending = { title: draft.title.trim(), note: draft.note.trim() };
    setBusy(true);
    setError(null);
    const res = await updateMediaDetails(m.id, sending);
    setBusy(false);
    if (res.ok) {
      // Match what the server stored, and deliberately skip router.refresh():
      // the action already revalidated, and refreshing here is what would
      // clobber a draft in another row.
      setSaved(sending);
      setDraft(sending);
    } else {
      // Keep his typing. This is the one place the studio's rollback is wrong —
      // yanking back 40 characters to stay tidy costs more than it protects.
      setError(res.error);
    }
  }

  function revert() {
    setDraft(saved);
    setError(null);
  }

  async function toggle(what: "published" | "featured") {
    setBusy(true);
    setError(null);
    const res =
      what === "published"
        ? await setPublished(m.id, !m.published)
        : await setFeatured(m.id, !m.featured);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await deleteMedia(m.id);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setConfirming(false);
      setError(res.error);
    }
  }

  const label = m.title || "untitled";

  return (
    <li
      ref={setNodeRef}
      style={{
        // Lock the drag to the vertical axis. @dnd-kit/modifiers isn't
        // installed and isn't worth adding for one line.
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null,
        ),
        transition,
      }}
      className={`grid grid-cols-[auto_4rem_1fr] items-start gap-3 border-b hairline py-4 sm:grid-cols-[auto_5rem_1fr_auto] sm:gap-4 ${
        isDragging ? "relative z-10 opacity-60" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        className="cursor-grab touch-none self-center px-1 text-[var(--color-paper-dim)] transition hover:text-[var(--color-gold)] active:cursor-grabbing"
      >
        ⠿
      </button>

      {m.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={m.title ?? ""}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <video
          src={src}
          muted
          // Metadata only: a dense list would otherwise pull down every clip.
          preload="metadata"
          className="aspect-square w-full object-cover"
        />
      )}

      <div className="min-w-0">
        <input
          value={draft.title}
          maxLength={TITLE_MAX}
          disabled={busy}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && dirty) save();
            if (e.key === "Escape") revert();
          }}
          placeholder="Dish name"
          aria-label={`Title for ${label}`}
          className={field}
        />
        <textarea
          value={draft.note}
          rows={2}
          maxLength={NOTE_MAX}
          disabled={busy}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && dirty) save();
            if (e.key === "Escape") revert();
          }}
          placeholder="Note (shown under the photo when opened)"
          aria-label={`Note for ${label}`}
          className={`${field} mt-2 resize-y`}
        />

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-paper-dim)]">
          <span>{when.format(new Date(m.created_at))}</span>
          {dirty && (
            <>
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="text-[var(--color-gold)] underline underline-offset-4 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={revert}
                disabled={busy}
                className="underline underline-offset-4 disabled:opacity-50"
              >
                Revert
              </button>
            </>
          )}
          {error && <span className="text-[var(--color-gold)]">{error}</span>}
        </div>
      </div>

      <div className="col-span-3 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
        <button
          type="button"
          onClick={() => toggle("published")}
          disabled={busy}
          aria-label={`${m.published ? "Hide" : "Show"} ${label}`}
          className={`${chip} ${m.published ? chipOn : chipOff}`}
        >
          {m.published ? "Live" : "Hidden"}
        </button>

        <button
          type="button"
          onClick={() => toggle("featured")}
          disabled={busy}
          aria-label={`${m.featured ? "Stop featuring" : "Feature"} ${label}`}
          title="Renders this one at 2x on the public grid. Position comes from dragging."
          className={`${chip} ${m.featured ? chipOn : chipOff}`}
        >
          Big
        </button>

        {confirming ? (
          <>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label={`Permanently delete ${label}`}
              className="px-2 py-1 text-xs text-[var(--color-gold)] underline disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete for good"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="px-2 py-1 text-xs text-[var(--color-paper-dim)] disabled:opacity-50"
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            aria-label={`Delete ${label}`}
            className="px-2 py-1 text-xs text-[var(--color-paper-dim)] transition hover:text-[var(--color-gold)] disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}
