"use client";

import { useState } from "react";
import type { Media } from "@/lib/types";

export function MediaGrid({
  media,
  bucketUrl,
}: {
  media: Media[];
  bucketUrl: string;
}) {
  const [active, setActive] = useState<Media | null>(null);
  const src = (m: Media) => `${bucketUrl}/${m.storage_path}`;

  return (
    <>
      {/* A dense mosaic. Featured dishes span two columns so his best work
          leads. Titles stay hidden until hover, the way a menu reveals a dish
          only when you look. */}
      <ul className="grid grid-cols-2 gap-1 px-1 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((m) => (
          <li
            key={m.id}
            className={m.featured ? "sm:col-span-2 sm:row-span-2" : ""}
          >
            <button
              type="button"
              onClick={() => setActive(m)}
              className="group relative block aspect-square w-full overflow-hidden bg-[var(--color-ink-raised)]"
            >
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src(m)}
                  alt={m.title ?? "A dish"}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <video
                  src={src(m)}
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
              )}
              {m.title && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-left opacity-0 transition group-hover:opacity-100">
                  <span className="display italic text-lg text-[var(--color-paper)]">
                    {m.title}
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title ?? "Dish"}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <div
            className="max-h-[90dvh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src(active)}
                alt={active.title ?? "A dish"}
                className="max-h-[80dvh] w-auto object-contain"
              />
            ) : (
              <video
                src={src(active)}
                controls
                autoPlay
                className="max-h-[80dvh] w-auto"
              />
            )}
            {(active.title || active.note) && (
              <div className="pt-4">
                {active.title && (
                  <p className="display text-xl italic">{active.title}</p>
                )}
                {active.note && (
                  <p className="mt-1 text-sm text-[var(--color-paper-dim)]">
                    {active.note}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-5 top-5 text-2xl text-[var(--color-paper)]"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
