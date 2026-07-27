"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOTE_MAX, TITLE_MAX } from "@/lib/media";

export type MediaResult = { ok: true } | { ok: false; error: string };

type RowPatch = {
  title?: string | null;
  note?: string | null;
  published?: boolean;
  featured?: boolean;
};

// One place for every single-row write. The `.select("id")` is load-bearing:
// PostgREST reports error: null when RLS filters an UPDATE down to zero rows,
// so without checking the affected count a blocked write looks like a success
// and the optimistic UI keeps that lie until a hard reload.
async function writeRow(
  id: string,
  patch: RowPatch,
  failure: string,
): Promise<MediaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .update(patch)
    .eq("id", id)
    .select("id");

  if (error || data?.length !== 1) return { ok: false, error: failure };

  refresh();
  return { ok: true };
}

export async function setPublished(
  id: string,
  published: boolean,
): Promise<MediaResult> {
  return writeRow(id, { published }, "Couldn't change that. Try again.");
}

export async function setFeatured(
  id: string,
  featured: boolean,
): Promise<MediaResult> {
  return writeRow(id, { featured }, "Couldn't change that. Try again.");
}

export async function updateMediaDetails(
  id: string,
  patch: { title?: string | null; note?: string | null },
): Promise<MediaResult> {
  const next: RowPatch = {};

  // A key that isn't in the patch is left alone; a blank one clears the column.
  if ("title" in patch) {
    const title = (patch.title ?? "").trim();
    if (title.length > TITLE_MAX) {
      return { ok: false, error: `Keep the title under ${TITLE_MAX} characters.` };
    }
    next.title = title || null;
  }

  if ("note" in patch) {
    const note = (patch.note ?? "").trim();
    if (note.length > NOTE_MAX) {
      return { ok: false, error: `Keep the note under ${NOTE_MAX} characters.` };
    }
    next.note = note || null;
  }

  if (Object.keys(next).length === 0) return { ok: true };

  return writeRow(id, next, "That didn't save. Try again.");
}

export async function deleteMedia(id: string): Promise<MediaResult> {
  const supabase = await createClient();

  // Look the path up here instead of taking one from the browser, so nothing
  // can hand us a crafted path and take out an unrelated file in the bucket.
  const { data: row, error: readErr } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (readErr || !row) return { ok: false, error: "Couldn't find that one." };

  // File first, then the row. An orphaned row is a broken tile he can delete
  // again; an orphaned file stays reachable at its public URL with nothing
  // left pointing at it. `remove` is idempotent, so retrying is safe.
  const { error: fileErr } = await supabase.storage
    .from("media")
    .remove([row.storage_path]);

  if (fileErr) {
    return { ok: false, error: "Couldn't remove the file. Try again." };
  }

  const { error: rowErr } = await supabase.from("media").delete().eq("id", id);

  if (rowErr) {
    return { ok: false, error: "The file went but the row didn't. Try again." };
  }

  refresh();
  return { ok: true };
}

export async function reorderMedia(orderedIds: string[]): Promise<MediaResult> {
  const supabase = await createClient();

  const { data: current, error: readErr } = await supabase
    .from("media")
    .select("id, sort_order")
    .in("id", orderedIds);

  if (readErr || !current) {
    return { ok: false, error: "Couldn't read the current order." };
  }

  // Only write rows that actually moved. A drag shifts a contiguous run, so
  // this is usually a handful of updates rather than the whole gallery.
  const currentOrder = new Map(current.map((r) => [r.id, r.sort_order]));
  const moved = orderedIds
    .map((id, position) => ({ id, position }))
    .filter(({ id, position }) => currentOrder.get(id) !== position);

  if (moved.length === 0) return { ok: true };

  const results = await Promise.all(
    moved.map(({ id, position }) =>
      supabase.from("media").update({ sort_order: position }).eq("id", id),
    ),
  );

  if (results.some((r) => r.error)) {
    return { ok: false, error: "The new order didn't save. Try again." };
  }

  refresh();
  return { ok: true };
}

function refresh() {
  revalidatePath("/studio");
  revalidatePath("/admin"); // two UIs over one table; an edit in either shows in both
  revalidatePath("/"); // the public gallery is ISR'd, so nudge it too
}
