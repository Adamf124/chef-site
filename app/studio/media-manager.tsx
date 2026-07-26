"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Media } from "@/lib/types";
import { reorderMedia } from "@/app/actions/media";
import { MediaControls } from "./media-controls";

export function MediaManager({
  media,
  bucketUrl,
}: {
  media: Media[];
  bucketUrl: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(media);
  const [error, setError] = useState<string | null>(null);

  // The server stays the source of truth: an upload, hide or delete refreshes
  // the page and this picks up the new list.
  useEffect(() => {
    setItems(media);
  }, [media]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Dragging is off the grip only, so a short delay is enough to tell a
    // deliberate drag from a stray touch.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex((m) => m.id === active.id);
    const to = items.findIndex((m) => m.id === over.id);
    if (from === -1 || to === -1) return;

    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next); // optimistic: the tile lands where he dropped it
    setError(null);

    const res = await reorderMedia(next.map((m) => m.id));
    if (res.ok) {
      router.refresh();
    } else {
      setItems(previous); // put it back rather than lie about what's saved
      setError(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-6 text-[var(--color-paper-dim)]">
        Nothing posted yet.
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-[var(--color-paper-dim)]">
        Drag ⠿ to reorder. This is the order people see.
      </p>
      {error && <p className="mt-2 text-sm text-[var(--color-gold)]">{error}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((m) => (
              <SortableTile key={m.id} m={m} bucketUrl={bucketUrl} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

function SortableTile({ m, bucketUrl }: { m: Media; bucketUrl: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: m.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative aspect-square overflow-hidden bg-[var(--color-ink-raised)] ${
        isDragging ? "z-10 opacity-60" : ""
      }`}
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

      {/* Only the grip opts out of touch scrolling. Making the whole tile
          draggable would mean `touch-action: none` across most of the screen,
          and he could no longer scroll the studio on his phone. */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${m.title ?? "this one"}`}
        className="absolute right-1 top-1 cursor-grab touch-none bg-black/70 px-2 py-1 text-[11px] leading-none text-[var(--color-paper-dim)] transition hover:text-[var(--color-gold)] active:cursor-grabbing"
      >
        ⠿
      </button>

      <MediaControls id={m.id} published={m.published} title={m.title} />
    </li>
  );
}
