"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  async function sendLink() {
    if (admins.length && !admins.includes(email.trim().toLowerCase())) {
      setError("That email isn't set up to manage this site.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/studio`,
      },
    });
    setPending(false);
    if (error) setError("Couldn't send the link. Check the email and retry.");
    else setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="display text-3xl">Studio</h1>
      {sent ? (
        <p className="mt-6 text-[var(--color-paper-dim)]">
          Check your email for a sign-in link.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="w-full border-b hairline bg-transparent py-3 placeholder:text-[var(--color-paper-dim)] focus:border-[var(--color-gold)]"
          />
          {error && <p className="text-sm text-[var(--color-gold)]">{error}</p>}
          <button
            onClick={sendLink}
            disabled={pending || !email}
            className="bg-[var(--color-paper)] px-8 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-gold)] disabled:opacity-50"
          >
            {pending ? "Sending…" : "Email me a link"}
          </button>
        </div>
      )}
    </main>
  );
}
