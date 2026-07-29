"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/types";

// Enough to show the work without pushing the contact form below a long scroll.
const PREVIEW_MIN = 8;
// The widest layout, and what a featured tile costs there: sm:col-span-2 plus
// sm:row-span-2 is four cells, not one.
const WIDEST_COLUMNS = 4;
const FEATURED_CELLS = 4;

/**
 * How many pieces to show collapsed. A fixed count leaves a hole the moment a
 * featured tile is in view — eight items with two featured is fourteen cells,
 * and fourteen doesn't divide by four, so the last row comes up short. Take
 * whole rows instead: keep adding until the cells land on a row boundary.
 */
function previewCount(media: Media[]) {
  let cells = 0;
  for (let i = 0; i < media.length; i++) {
    cells += media[i].featured ? FEATURED_CELLS : 1;
    if (i + 1 >= PREVIEW_MIN && cells % WIDEST_COLUMNS === 0) return i + 1;
  }
  return media.length;
}
// A swipe shorter than this is a tap that wandered, not a page turn.
const SWIPE_THRESHOLD = 50;

export function MediaGrid({
  media,
  bucketUrl,
}: {
  media: Media[];
  bucketUrl: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const src = (m: Media) => `${bucketUrl}/${m.storage_path}`;
  const isOpen = activeIndex !== null;
  const active = activeIndex === null ? null : media[activeIndex];

  const cut = previewCount(media);
  const collapsible = media.length > cut;
  // Always a prefix of `media`, so a tile's index is its index in the full
  // list — which is what the lightbox navigates.
  const visible = collapsible && !expanded ? media.slice(0, cut) : media;

  // Wrap around: at the last dish, next goes back to the first. The lightbox
  // walks the whole set, including anything still hidden behind "Show more".
  const step = useCallback(
    (delta: number) =>
      setActiveIndex((i) =>
        i === null ? i : (i + delta + media.length) % media.length,
      ),
    [media.length],
  );

  // Freeze the page behind the lightbox. `position: fixed` rather than just
  // `overflow: hidden` because iOS Safari happily scrolls the body anyway;
  // the offset is restored on close so he lands back where he was.
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step]);

  return (
    <>
      {/* A dense mosaic. Featured dishes span two columns so his best work
          leads. Titles stay hidden until hover, the way a menu reveals a dish
          only when you look. */}
      <div className="relative">
        <ul className="grid grid-cols-2 gap-1 px-1 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((m, i) => (
            <li
              key={m.id}
              className={m.featured ? "sm:col-span-2 sm:row-span-2" : ""}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
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

        {/* Fade the last row into the page so the grid reads as continuing,
            not as ending. pointer-events-none keeps the tiles under it tappable. */}
        {collapsible && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/80 to-transparent" />
        )}
      </div>

      {collapsible && !expanded && (
        <div className="flex justify-center pt-6">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="border hairline px-8 py-3 text-sm text-[var(--color-paper)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          >
            Show more ({media.length - cut})
          </button>
        </div>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title ?? "Dish"}
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <div
            className="max-h-[90dvh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start === null) return;
              const dx = e.changedTouches[0].clientX - start;
              if (Math.abs(dx) > SWIPE_THRESHOLD) step(dx < 0 ? 1 : -1);
            }}
          >
            {active.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={active.id}
                src={src(active)}
                alt={active.title ?? "A dish"}
                className="max-h-[80dvh] w-auto object-contain"
              />
            ) : (
              <video
                key={active.id}
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

          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous dish"
                className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-6 text-3xl text-[var(--color-paper)] transition hover:text-[var(--color-gold)] sm:left-5"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next dish"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-6 text-3xl text-[var(--color-paper)] transition hover:text-[var(--color-gold)] sm:right-5"
              >
                ›
              </button>
              <p className="absolute inset-x-0 bottom-5 text-center text-sm text-[var(--color-paper-dim)]">
                {media.indexOf(active) + 1} / {media.length}
              </p>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveIndex(null)}
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
