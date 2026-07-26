# Project: chef portfolio

A portfolio + inquiry site for a chef (retiring from restaurant work) to post
food photos and video and attract paid work. Built to stay open-ended about
what kind of work: the inquiry form captures an `interest` so demand reveals
the direction rather than us guessing it.

## Stack
Next.js App Router, Supabase (Postgres + Storage + Auth), TypeScript, Tailwind v4.

## Shape
- `/` public gallery — server component, reads published media.
- `/studio` his private area — behind magic-link auth (see `middleware.ts`).
- `/login` magic link only. `ADMIN_EMAILS` (his + yours) gates who can sign in.
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
- Studio: edit/hide/reorder/feature controls (rows exist, UI is read-only).
- A `/studio/inquiries` view of who reached out and what they wanted.
