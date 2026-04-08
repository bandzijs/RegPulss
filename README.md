# RegPulss
AI-powered regulatory newsletter for Latvian legal professionals.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Supabase (database + auth)
- Resend (email delivery)
- Vercel (hosting)
- shadcn/ui (admin UI)

## Project Structure
- `app/` — pages, API routes, admin dashboard
- `lib/` — Supabase client, utilities
- `utils/supabase/` — auth helpers
- `__tests__/` — test suite

## Local Development
1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. `npm run dev`

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`

## Scripts
- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — linting
- `npm test` — run tests
