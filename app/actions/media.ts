"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MediaResult = { ok: true } | { ok: false; error: string };

export async function setPublished(
  id: string,
  published: boolean,
): Promise<MediaResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("media")
    .update({ published })
    .eq("id", id);

  if (error) return { ok: false, error: "Couldn't change that. Try again." };

  refresh();
  return { ok: true };
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

function refresh() {
  revalidatePath("/studio");
  revalidatePath("/"); // the public gallery is ISR'd, so nudge it too
}
