import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import type { Inquiry } from "@/lib/types";
import { InquiryList } from "./inquiry-list";

export const dynamic = "force-dynamic";

export default async function Inquiries() {
  const supabase = await requireOwner();

  // Unhandled first, newest first within that — marking one handled drops it
  // down the page, which is the behaviour an inbox should have.
  const { data } = await supabase
    .from("inquiries")
    .select("*")
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false });

  const inquiries = (data ?? []) as Inquiry[];
  const open = inquiries.filter((i) => !i.handled).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="display text-4xl">Inquiries</h1>
        <Link
          href="/admin"
          className="text-sm text-[var(--color-paper-dim)] underline underline-offset-4 transition hover:text-[var(--color-gold)]"
        >
          Back to admin
        </Link>
      </div>

      <p className="mt-2 text-sm text-[var(--color-paper-dim)]">
        {inquiries.length === 0
          ? "Nobody has written yet."
          : `${inquiries.length} total · ${open} to answer`}
      </p>

      <div className="mt-8">
        <InquiryList inquiries={inquiries} />
      </div>
    </main>
  );
}
