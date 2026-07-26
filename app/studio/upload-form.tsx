"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB cap until video moves to Mux

// One line covering everything that happened, since a batch can partly fail.
function summarize(added: number, failed: number, tooLarge: number) {
  const parts: string[] = [];
  if (added) parts.push(added === 1 ? "Posted." : `Posted ${added}.`);
  if (tooLarge) {
    parts.push(
      `${tooLarge} ${tooLarge === 1 ? "video was" : "videos were"} too large — keep clips short for now.`,
    );
  }
  if (failed) {
    parts.push(`${failed} didn't upload. Try ${failed === 1 ? "it" : "them"} again.`);
  }
  return parts.join(" ") || "Nothing to upload.";
}

export function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sequential on purpose: compressing several phone photos at once is enough
  // to get the tab killed on an older device. One file at a time, with a count
  // so he can see it moving. A single bad file never stops the rest.
  async function handleFiles(files: File[]) {
    setBusy(true);
    setStatus(null);

    const supabase = createClient();
    // Whatever he typed applies to the whole batch — several shots of one dish
    // is the common case.
    const sharedTitle = title.trim() || null;
    let added = 0;
    let failed = 0;
    let tooLarge = 0;

    for (const [i, file] of files.entries()) {
      setProgress(
        files.length === 1
          ? "Uploading…"
          : `Uploading ${i + 1} of ${files.length}…`,
      );

      const isVideo = file.type.startsWith("video/");
      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        tooLarge++;
        continue;
      }

      try {
        let upload: File | Blob = file;
        if (!isVideo) {
          // Phone photos are often 8 MB+. Shrink before upload; no visible loss.
          upload = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 2400,
            useWebWorker: true,
          });
        }

        const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
        const path = `${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, upload, { contentType: file.type });
        if (upErr) throw upErr;

        const { error: rowErr } = await supabase.from("media").insert({
          storage_path: path,
          type: isVideo ? "video" : "image",
          title: sharedTitle,
        });
        if (rowErr) {
          // Don't strand the file: the bucket is public, so an orphan with no
          // row pointing at it stays reachable at its URL forever.
          await supabase.storage.from("media").remove([path]);
          throw rowErr;
        }

        added++;
      } catch {
        failed++;
      }
    }

    setProgress(null);
    setBusy(false);
    if (added) {
      setTitle("");
      router.refresh();
    }
    setStatus(summarize(added, failed, tooLarge));
  }

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Dish name (optional)"
        className="w-full border-b hairline bg-transparent py-3 placeholder:text-[var(--color-paper-dim)] focus:border-[var(--color-gold)]"
      />

      {/* The whole point: one big tap target. No `capture` attribute — that
          jumps straight to the camera and hides the photo library and Files,
          which is the opposite of what he needs when the shot is already on
          his phone. Without it the picker offers the camera too. */}
      <label className="block cursor-pointer bg-[var(--color-paper)] px-8 py-5 text-center text-lg font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-gold)]">
        {busy ? (progress ?? "Uploading…") : "Add photos or video"}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          disabled={busy}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) handleFiles(files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>

      {status && (
        <p className="text-sm text-[var(--color-paper-dim)]">{status}</p>
      )}
    </div>
  );
}
