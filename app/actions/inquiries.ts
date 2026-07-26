"use server";

import { createClient } from "@/lib/supabase/server";

export type InquiryResult = { ok: true } | { ok: false; error: string };

export async function submitInquiry(
  _prev: InquiryResult | null,
  formData: FormData,
): Promise<InquiryResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const interest = String(formData.get("interest") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!name) return { ok: false, error: "Add your name so he knows who wrote." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "That email doesn't look right. Check it?" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .insert({ name, email, interest, message });

  if (error) {
    return { ok: false, error: "Something broke on our end. Try again?" };
  }

  // Next step when he's ready: send him an email here (Resend, or a Supabase
  // edge function on insert) so he sees inquiries without opening the studio.
  return { ok: true };
}
