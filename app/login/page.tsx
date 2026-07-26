"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// What we expect and show in the placeholder: "Email OTP length" in Supabase
// Auth (see CLAUDE.md).
const CODE_LENGTH = 8;
// What we'll actually accept: Supabase's whole legal range, so a setting that
// isn't 8 can't lock him out of his own studio. Let the server reject a wrong
// code; don't let this button refuse a right one.
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 10;

const field =
  "w-full border-b hairline bg-transparent py-3 placeholder:text-[var(--color-paper-dim)] focus:border-[var(--color-gold)]";
const button =
  "bg-[var(--color-paper)] px-8 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-gold)] disabled:opacity-50";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  async function sendCode() {
    if (admins.length && !admins.includes(email.trim().toLowerCase())) {
      setError("That email isn't set up to manage this site.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    // No emailRedirectTo, so there's no link to click. What actually makes the
    // email carry a code is {{ .Token }} in the Magic Link template.
    const { error } = await supabase.auth.signInWithOtp({ email });
    setPending(false);
    if (error) setError("Couldn't send the code. Check the email and retry.");
    else setStep("code");
  }

  async function verifyCode() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code, // already digits-only, see onChange
      type: "email",
    });
    setPending(false);
    if (error) {
      setError("That code didn't work. Check it or request a new one.");
    } else {
      router.push("/studio");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="display text-3xl">Studio</h1>

      {step === "email" ? (
        <div className="mt-8 space-y-5">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && sendCode()}
            placeholder="Your email"
            className={field}
          />
          {error && <p className="text-sm text-[var(--color-gold)]">{error}</p>}
          <button onClick={sendCode} disabled={pending || !email} className={button}>
            {pending ? "Sending…" : "Email me a code"}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <p className="text-sm text-[var(--color-paper-dim)]">
            Enter the code sent to {email}.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={MAX_CODE_LENGTH}
            value={code}
            // Strip spaces/dashes from pasting, and never hold more than the code.
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, MAX_CODE_LENGTH))
            }
            onKeyDown={(e) =>
              e.key === "Enter" && code.length >= MIN_CODE_LENGTH && verifyCode()
            }
            placeholder={`${CODE_LENGTH}-digit code`}
            className={`${field} tracking-[0.4em] text-lg`}
          />
          {error && <p className="text-sm text-[var(--color-gold)]">{error}</p>}
          <button
            onClick={verifyCode}
            disabled={pending || code.length < MIN_CODE_LENGTH}
            className={button}
          >
            {pending ? "Checking…" : "Sign in"}
          </button>
          <button
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="block text-sm text-[var(--color-paper-dim)] underline"
          >
            Use a different email
          </button>
        </div>
      )}
    </main>
  );
}
