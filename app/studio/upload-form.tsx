"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB cap until video moves to Mux

export function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const isVideo = file.type.startsWith("video/");
      let upload: File | Blob = file;

      if (isVideo) {
        if (file.size > MAX_VIDEO_BYTES) {
          setStatus("That video is large. Keep clips short for now.");
          setBusy(false);
          return;
        }
      } else {
        // Phone photos are often 8 MB+. Shrink before upload; no visible loss.
        upload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 2400,
          useWebWorker: true,
        });
      }

      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, upload, { contentType: file.type });
      if (upErr) throw upErr;

      const { error: rowErr } = await supabase.from("media").insert({
        storage_path: path,
        type: isVideo ? "video" : "image",
        title: title.trim() || null,
      });
      if (rowErr) throw rowErr;

      setTitle("");
      setStatus("Posted.");
      router.refresh();
    } catch {
      setStatus("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Dish name (optional)"
        className="w-full border-b hairline bg-transparent py-3 placeholder:text-[var(--color-paper-dim)] focus:border-[var(--color-gold)]"
      />

      {/* The whole point: one big tap target that opens the camera roll. */}
      <label className="block cursor-pointer bg-[var(--color-paper)] px-8 py-5 text-center text-lg font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-gold)]">
        {busy ? "Uploading…" : "Add a photo or video"}
        <input
          type="file"
          accept="image/*,video/*"
          capture="environment"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
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
