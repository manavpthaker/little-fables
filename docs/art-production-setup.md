# Production art pipeline — one-time setup

This wires the art pipeline so you can **generate → review → approve, all on the
live site**, and an approval goes live in the reader immediately (no redeploy,
no commit). Storage + state live in Supabase (which the app already uses).

You must do steps 1–3 once. After that everything runs from **Parent Corner →
Art** on prod.

## 1. Create the two storage buckets

In the Supabase dashboard → **Storage → New bucket**:

| Bucket | Public? | Holds |
| --- | --- | --- |
| `art-candidates` | **Private** (public OFF) | every generated candidate — viewed in the Art tab via short-lived signed URLs |
| `art-live` | **Public** (public ON) | only approved images — the reader/shelf read these |

Nothing un-approved is ever publicly reachable: candidates sit in the private
bucket and are only ever shown to you through signed URLs.

## 2. Create the tracking table

Run `supabase/migrations/0001_art_artifacts.sql` in the Supabase **SQL editor**
(paste + Run). It creates `art_artifacts` and a public-read policy that exposes
**only approved** rows.

## 3. Add the env vars in Vercel

Project → **Settings → Environment Variables** (Production **and** Preview):

| Var | Value | Why |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` secret | server-side storage + table writes. **Server only** — never prefix `NEXT_PUBLIC_`. |
| `GEMINI_API_KEY` | your Gemini key | on-prod image generation |
| `ANTHROPIC_API_KEY` | your Anthropic key | the art-director planning pass |

`NEXT_PUBLIC_SUPABASE_URL` is already set. Redeploy after adding these.

## 4. Use it (on the live site)

Parent Corner → **Art**:

1. **Generate** a character sheet or a book's scenes → candidates land in the
   private bucket and appear as *pending* thumbnails.
2. **Approve** the one you like → it's copied to the public bucket and marked
   approved. **The next time the reader/shelf opens that book, the art is
   there.** No redeploy.
3. **Reject** to discard a candidate.

## How "goes live" works

Approved art is **not** written back into the committed pack file. Instead the
reader, shelf, and cover fetch approved overrides from `/api/art/live` at load
and lay them over the book. So an approval is live on the next open, and the
source pack stays clean. If the art env isn't configured, every art route
returns a clear "not configured" response and the reader simply shows the drawn
placeholders — reading is never affected.
