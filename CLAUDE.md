# Project: chef portfolio

A portfolio + inquiry site for a chef (retiring from restaurant work) to post
food photos and video and attract paid work. Built to stay open-ended about
what kind of work: the inquiry form captures an `interest` so demand reveals
the direction rather than us guessing it.

## Stack
Next.js App Router, Supabase (Postgres + Storage + Auth), TypeScript, Tailwind v4.

## Shape
- `/` public gallery — server component, reads published media.
- `/studio` his private area — behind auth (see `middleware.ts`). Upload (bulk,
  sequential), plus per-tile Hide (flips `published`), Delete (two-tap confirm)
  and drag-to-reorder, all via `app/actions/media.ts`. Delete removes the
  storage file *then* the row: an orphaned row is a broken tile, an orphaned
  file stays public forever.
  Reorder writes `sort_order` = position, and the studio queries in the same
  order as `/` so the grid is what visitors see. Drag is off the ⠿ grip only —
  making whole tiles draggable needs `touch-action: none` over most of the
  screen, which kills scrolling on a phone.
- `/admin` Adam's denser surface: edit title and note, toggle live/big, delete,
  reorder, with dates and counts. Gated to `OWNER_EMAIL` (server-only) in
  `middleware.ts`, re-checked in the page. A signed-in non-owner goes to
  `/studio`; an unset `OWNER_EMAIL` denies everyone. This is a UI guardrail,
  not a wall — RLS still lets anyone in `admin_emails()` write.
  Text edits deliberately skip `router.refresh()`: the action revalidates
  anyway, and refreshing would wipe a draft being typed in another row.
- `/login` email + 8-digit code (OTP). `ADMIN_EMAILS` (his + yours) gates who can sign in.
  Two Supabase Auth settings make this work, and neither lives in this repo:
  the Magic Link email template must contain `{{ .Token }}` (that, not omitting
  `emailRedirectTo`, is what sends a code instead of a link), and Email OTP
  length must be 8 (Auth → Providers → Email; default is 6, range 6–10).
  `CODE_LENGTH` in `app/login/page.tsx` is only the placeholder hint — the
  field accepts 6–10 on purpose, so a drifted setting can't lock him out.
- Ordering: `sort_order` alone decides position everywhere. `featured` only
  makes a tile render 2x2 on the public grid — it used to sort first, which
  would have made dragging anything above a featured piece silently no-op.
  The `-- pin to the top` comment and `media_display_idx` in the migration are
  stale about this; don't edit that file, it records what was actually run.
- `/admin/inquiries` the inbox. Unhandled first, mark answered, reply by mail,
  delete. Delete needed a new policy — `0002_owner_deletes_inquiries.sql`,
  applied via the Supabase MCP; nothing in this repo runs migrations, the file
  is only the record.
- Data: `media` and `inquiries` tables, `supabase/migrations/`.
  RLS: public reads published media + submits inquiries; only owner writes
  media / reads inquiries. Admins checked against admin_emails() via is_owner().
- Storage: public `media` bucket, owner-only writes.

## Design intent
The food is the only color. Near-black room, warm paper text, one gold
hairline. Fraunces for display (name, dish titles), Hanken Grotesk for UI.
Keep it quiet so the photos carry the page. Don't add a second accent color.

## Conventions
- An inquiry's email goes into a `mailto:` href, so it passes `isEmailSafe`
  (`lib/email.ts`) on the way in *and* the link is withheld at render if the
  stored value isn't safe. The original check excluded only `@` and whitespace,
  which let `a?subject=x&bcc=…@evil.com` through and made the reply link
  injectable. Tightening validation can't clean rows already in the table.
- Uploads compress images in the browser (`browser-image-compression`) before
  hitting Storage. Keep upload to one tap.
- Copy is plain and active: buttons say what happens ("Send", "Add a photo").

## Known next steps (not built yet)
- Email him on new inquiry (Resend or a Supabase edge function on insert).
- Move video to Mux/Cloudflare Stream if he shoots a lot; `media.type='video'`
  already isolates that path.
- Studio: edit title/note and feature controls (rows exist, no UI). Hide,
  delete and reorder are built.
- A `/studio/inquiries` view of who reached out and what they wanted.
