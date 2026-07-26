# Chef portfolio

A portfolio site for a chef to post photos and videos of his food, and a way
for people to reach him about work. Built to stay open-ended: it does not
assume he is a "private chef" or a "caterer." The inquiry form asks what people
want, so the demand reveals the direction instead of guessing it up front.

Stack: Next.js (App Router) · Supabase (Postgres, Storage, Auth) · TypeScript · Tailwind v4.

## Setup

1. Create a Supabase project. Copy the project URL and anon key.

2. Copy env and fill it in:
   ```
   cp .env.example .env.local
   ```

3. Run the migration. Either paste `supabase/migrations/0001_init.sql` into the
   Supabase SQL editor, or with the CLI:
   ```
   supabase db push
   ```
   This creates the `media` and `inquiries` tables, row-level security, and the
   `media` storage bucket with its policies.

4. Set who is allowed to log in. Auth is magic-link only, but to be safe the
   RLS policies also check the email against an allowlist. Put both emails
   (his and yours) in `NEXT_PUBLIC_ADMIN_EMAILS` in `.env.local` AND in the
   migration's `admin_emails()` function (one line, marked with a TODO). Keep
   the two in sync.

5. Install and run:
   ```
   npm install
   npm run dev
   ```

6. He logs in at `/login`, lands at `/studio`, and uploads. The public gallery
   is `/`.

## Notes

- **Images** are compressed in the browser before upload (phone photos are
  often 8 MB; this gets them under ~1 MB without visible loss).
- **Video** currently uploads straight to Supabase Storage with a size cap.
  That is fine to start. If he shoots a lot of video, move it to Mux or
  Cloudflare Stream later; the `media.type = 'video'` column is already there so
  the swap is isolated to the upload path and the grid.
- **PWA**: `app/manifest.ts` makes it installable to his home screen so upload
  is one tap from the lock screen.
- Fill in his name and details in `site.config.ts`.
