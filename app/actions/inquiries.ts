"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEmailSafe } from "@/lib/email";

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
  // isEmailSafe, not a loose pattern: this address ends up in a mailto: link,
  // so anything that could inject URL parameters must never reach the table.
  if (!isEmailSafe(email)) {
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
  // edge function on insert) so he sees inquiries without opening /admin.
  revalidatePath("/admin/inquiries");
  return { ok: true };
}

export async function setInquiryHandled(
  id: string,
  handled: boolean,
): Promise<InquiryResult> {
  const supabase = await createClient();
  // `.select("id")` for the same reason as the media writes: PostgREST reports
  // error: null when RLS filters an UPDATE to zero rows, so without checking
  // the affected count a blocked write looks like it worked.
  const { data, error } = await supabase
    .from("inquiries")
    .update({ handled })
    .eq("id", id)
    .select("id");

  if (error || data?.length !== 1) {
    return { ok: false, error: "Couldn't change that. Try again." };
  }

  revalidatePath("/admin/inquiries");
  return { ok: true };
}

export async function deleteInquiry(id: string): Promise<InquiryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || data?.length !== 1) {
    return { ok: false, error: "Couldn't delete that. Try again." };
  }

  revalidatePath("/admin/inquiries");
  return { ok: true };
}
