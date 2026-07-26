# Project: chef portfolio

A portfolio + inquiry site for a chef (retiring from restaurant work) to post
food photos and video and attract paid work. Built to stay open-ended about
what kind of work: the inquiry form captures an `interest` so demand reveals
the direction rather than us guessing it.

## Stack
Next.js App Router, Supabase (Postgres + Storage + Auth), TypeScript, Tailwind v4.

## Shape
- `/` public gallery — server component, reads published media.
- `/studio` his private area — behind auth (see `middleware.ts`). Upload, plus
  per-tile Hide (flips `published`) and Delete (two-tap confirm) via
  `app/actions/media.ts`. Delete removes the storage file *then* the row: an
  orphaned row is a broken tile, an orphaned file stays public forever.
- `/login` email + 8-digit code (OTP). `ADMIN_EMAILS` (his + yours) gates who can sign in.
  Two Supabase Auth settings make this work, and neither lives in this repo:
  the Magic Link email template must contain `{{ .Token }}` (that, not omitting
  `emailRedirectTo`, is what sends a code instead of a link), and Email OTP
  length must be 8 (Auth → Providers → Email; default is 6, range 6–10).
  `CODE_LENGTH` in `app/login/page.tsx` is only the placeholder hint — the
  field accepts 6–10 on purpose, so a drifted setting can't lock him out.
- Data: `media` and `inquiries` tables, `supabase/migrations/0001_init.sql`.
  RLS: public reads published media + submits inquiries; only owner writes
  media / reads inquiries. Admins checked against admin_emails() via is_owner().
- Storage: public `media` bucket, owner-only writes.

## Design intent
The food is the only color. Near-black room, warm paper text, one gold
hairline. Fraunces for display (name, dish titles), Hanken Grotesk for UI.
Keep it quiet so the photos carry the page. Don't add a second accent color.

## Conventions
- Uploads compress images in the browser (`browser-image-compression`) before
  hitting Storage. Keep upload to one tap.
- Copy is plain and active: buttons say what happens ("Send", "Add a photo").

## Known next steps (not built yet)
- Email him on new inquiry (Resend or a Supabase edge function on insert).
- Move video to Mux/Cloudflare Stream if he shoots a lot; `media.type='video'`
  already isolates that path.
- Studio: edit title/note, reorder, and feature controls (rows exist, no UI).
  Hide and delete are built.
- A `/studio/inquiries` view of who reached out and what they wanted.
