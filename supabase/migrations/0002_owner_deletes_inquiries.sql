-- APPLIED 2026-07-27 via the Supabase MCP. This file is the record, not the
-- trigger — nothing in this repo runs migrations automatically.
--
-- The inquiry form is public, so spam is inevitable. Reading and marking
-- handled were already covered by policies; deletion had none at all, which
-- meant nobody could remove a row through the API.

create policy "owner deletes inquiries"
  on public.inquiries for delete
  using (public.is_owner());
