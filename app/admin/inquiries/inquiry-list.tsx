"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Inquiry } from "@/lib/types";
import { site, interestOptions } from "@/site.config";
import { mailtoHref } from "@/lib/email";
import { adminDateTime } from "@/lib/format";
import { chip, chipOff, chipOn } from "@/lib/ui";
import { deleteInquiry, setInquiryHandled } from "@/app/actions/inquiries";

// Fall back to the stored value: interestOptions can change in site.config.ts
// and old rows keep whatever string they were submitted with.
function interestLabel(value: string | null) {
  if (!value) return null;
  return interestOptions.find((o) => o.value === value)?.label ?? value;
}

export function InquiryList({ inquiries }: { inquiries: Inquiry[] }) {
  if (inquiries.length === 0) {
    return (
      <p className="text-[var(--color-paper-dim)]">
        No inquiries yet. They arrive from the form at the bottom of the{" "}
        <a href="/#contact" className="underline underline-offset-4">
          home page
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="border-t hairline">
      {inquiries.map((i) => (
        <InquiryRow key={i.id} inquiry={i} />
      ))}
    </ul>
  );
}

function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interest = interestLabel(inquiry.interest);
  // Null when the stored address isn't safe to put in a URL. Tightening the
  // submit check can't clean rows that are already in the table, so the link
  // is withheld here rather than trusted.
  const mailto = mailtoHref(inquiry.email, `Re: your note to ${site.chefName}`);

  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await setInquiryHandled(inquiry.id, !inquiry.handled);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await deleteInquiry(inquiry.id);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setConfirming(false);
      setError(res.error);
    }
  }

  return (
    <li className="border-b hairline py-5">
      {/* The dim marks a row answered, but it only wraps the message. Dimming
          the whole row put the meta text and the Delete button at 2.6:1 against
          the page — under AA, and under the 3:1 floor for controls. Paper at
          55% is 5.3:1, so the message survives it. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="display text-lg">{inquiry.name}</span>
        {mailto ? (
          <a
            href={mailto}
            className="text-sm text-[var(--color-paper-dim)] underline underline-offset-4 transition hover:text-[var(--color-gold)]"
          >
            {inquiry.email}
          </a>
        ) : (
          <span
            title="This address can't be turned into a safe reply link. Copy it by hand if it's genuine."
            className="text-sm text-[var(--color-paper-dim)]"
          >
            {inquiry.email}
          </span>
        )}
        <span className="ml-auto text-xs text-[var(--color-paper-dim)]">
          {adminDateTime.format(new Date(inquiry.created_at))}
        </span>
      </div>

      {interest && (
        <p className="mt-1 text-sm text-[var(--color-gold)]">{interest}</p>
      )}

      {inquiry.message && (
        // Their line breaks are worth keeping; the text is untrusted, so it
        // goes in as text and never as markup.
        <p
          className={`mt-2 whitespace-pre-wrap text-[var(--color-paper)] ${
            inquiry.handled ? "opacity-55" : ""
          }`}
        >
          {inquiry.message}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-label={`Mark ${inquiry.name}'s inquiry as ${
            inquiry.handled ? "still open" : "answered"
          }`}
          className={`${chip} ${inquiry.handled ? chipOn : chipOff}`}
        >
          {busy ? "…" : inquiry.handled ? "Answered" : "Mark answered"}
        </button>

        {mailto && (
          <a
            href={mailto}
            className="text-[var(--color-paper-dim)] underline underline-offset-4 transition hover:text-[var(--color-gold)]"
          >
            Reply
          </a>
        )}

        {confirming ? (
          <>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label={`Permanently delete ${inquiry.name}'s inquiry`}
              className="ml-auto text-[var(--color-gold)] underline disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete for good"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="text-[var(--color-paper-dim)] disabled:opacity-50"
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            aria-label={`Delete ${inquiry.name}'s inquiry`}
            className="ml-auto text-[var(--color-paper-dim)] transition hover:text-[var(--color-gold)] disabled:opacity-50"
          >
            Delete
          </button>
        )}

        {error && <span className="text-[var(--color-gold)]">{error}</span>}
      </div>
    </li>
  );
}
