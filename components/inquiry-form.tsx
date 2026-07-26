"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryResult } from "@/app/actions/inquiries";
import { interestOptions } from "@/site.config";

const field =
  "w-full bg-transparent border-b hairline py-3 text-[var(--color-paper)] placeholder:text-[var(--color-paper-dim)] focus:border-[var(--color-gold)] transition";

export function InquiryForm() {
  const [state, action, pending] = useActionState<InquiryResult | null, FormData>(
    submitInquiry,
    null,
  );

  if (state?.ok) {
    return (
      <p className="display text-xl italic text-[var(--color-gold)]">
        Got it. He&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input name="name" placeholder="Your name" className={field} required />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className={field}
        required
      />

      <fieldset className="space-y-3 pt-2">
        <legend className="text-sm text-[var(--color-paper-dim)]">
          What are you interested in?
        </legend>
        {interestOptions.map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="interest"
              value={opt.value}
              className="accent-[var(--color-gold)]"
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <textarea
        name="message"
        rows={3}
        placeholder="Anything else? Dates, headcount, ideas."
        className={field}
      />

      {state && !state.ok && (
        <p className="text-sm text-[var(--color-gold)]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[var(--color-paper)] px-8 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-gold)] disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
