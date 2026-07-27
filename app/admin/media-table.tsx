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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Media } from "@/lib/types";
import { reorderMedia } from "@/app/actions/media";
import { MediaRow } from "./media-row";

export function MediaTable({
  media,
  bucketUrl,
}: {
  media: Media[];
  bucketUrl: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(media);
  const [error, setError] = useState<string | null>(null);

  // Resync when the server sends a new list (delete, publish, upload elsewhere).
  // Rows are keyed by id, so a row keeps its own in-progress text draft across
  // this — see the note in media-row.tsx about never re-syncing drafts.
  useEffect(() => {
    setItems(media);
  }, [media]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
    setItems(arrayMove(items, from, to));
    setError(null);

    const res = await reorderMedia(arrayMove(items, from, to).map((m) => m.id));
    if (res.ok) {
      router.refresh();
    } else {
      setItems(previous);
      setError(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-[var(--color-paper-dim)]">
        Nothing posted yet. Add something in the studio.
      </p>
    );
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-[var(--color-gold)]">{error}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="border-t hairline">
            {items.map((m) => (
              <MediaRow key={m.id} m={m} bucketUrl={bucketUrl} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}
