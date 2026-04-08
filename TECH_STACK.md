# RegPulss Technical Stack Summary

Comprehensive codebase summary generated from project files in:
- root configs (`package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `vitest.config.ts`, `.eslintrc.json`, `middleware.ts`)
- `app/`, `lib/`, `utils/`, `__tests__/`, `components/`
- related runtime/config files used by the app (`emails/`, `supabase/functions/`, `supabase/config.toml`, `components.json`, `postcss.config.js`, `vitest.setup.ts`, `.env.example`)

---

## 1) Languages

| Language | Where Used | Version / Config Evidence |
|---|---|---|
| TypeScript | App Router pages, API routes, utils, tests, UI components, Edge Functions | `typescript@^5.3.0`, strict mode enabled in `tsconfig.json` |
| JavaScript | Build/config files (`next.config.js`, `tailwind.config.js`, `postcss.config.js`) | Node runtime via Next.js tooling |
| CSS | Global styles and utility layers | `app/globals.css`, Tailwind + custom CSS variables |
| TOML | Supabase function config | `supabase/config.toml` |
| JSON | Project/tooling configs | `components.json`, `deno.json` files |
| SQL | Not currently active in repository logic | No active migration/policy SQL files in current root after cleanup |

### TypeScript Configuration (`tsconfig.json`)

- `target`: `es2020`
- `lib`: `es2020`, `dom`, `dom.iterable`
- `module`: `esnext`
- `moduleResolution`: `bundler`
- `jsx`: `preserve`
- `strict`: `true`
- `noUnusedLocals`: `true`
- `noUnusedParameters`: `true`
- `noFallthroughCasesInSwitch`: `true`
- `allowJs`: `true`
- `incremental`: `true`
- `noEmit`: `true`
- Path alias: `@/* -> ./*`
- Include: all `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`
- Exclude: `node_modules`, `supabase/**/*`

---

## 2) Frameworks & Libraries

### Production Dependencies (`package.json`)

| Package | Version | Usage in this project |
|---|---:|---|
| `@base-ui/react` | `^1.3.0` | Primitive components used by shadcn-generated UI (`button`, `tabs`, `input`, `avatar`, etc.) |
| `@react-email/components` | `^1.0.10` | React email templates in `emails/confirmation.tsx` and `emails/newsletter.tsx` |
| `@supabase/ssr` | `^0.10.0` | SSR/browser/middleware auth clients in `utils/supabase/*` |
| `@supabase/supabase-js` | `^2.102.1` | Database/auth clients in API routes, pages, and helpers |
| `@vercel/analytics` | `^1.6.1` | Analytics component in `app/layout.tsx` |
| `class-variance-authority` | `^0.7.1` | Variant systems for shadcn UI components (`button`, `tabs`, `badge`) |
| `clsx` | `^2.1.1` | Classname composition via `cn()` helper |
| `lucide-react` | `^1.7.0` | Icons in admin dashboard (`Bolt`, `Users`, etc.) |
| `next` | `^14.0.0` | Main framework (App Router, API routes, metadata routes) |
| `react` | `^18.2.0` | UI runtime |
| `react-dom` | `^18.2.0` | DOM rendering |
| `react-email` | `^5.2.10` | Local email development tooling integration |
| `recharts` | `^3.8.1` | Admin subscriber growth charts |
| `resend` | `^6.9.4` | Newsletter send API route integration |
| `shadcn` | `^4.1.2` | shadcn CLI package used for component generation |
| `tailwind-merge` | `^3.5.0` | Tailwind class conflict merging in `cn()` |
| `tw-animate-css` | `^1.4.0` | Tailwind animation utilities imported in global CSS |
| `zod` | `^4.3.6` | Environment variable validation (`lib/env.ts`) |

### Dev Dependencies

| Package | Version | Usage in this project |
|---|---:|---|
| `@react-email/preview-server` | `^5.2.10` | Local email preview development |
| `@testing-library/jest-dom` | `^6.9.1` | DOM matchers in test setup |
| `@testing-library/react` | `^16.3.2` | React component/hook testing |
| `@types/node` | `^20.0.0` | Node typings |
| `@types/react` | `^18.2.0` | React typings |
| `@types/react-dom` | `^18.2.0` | React DOM typings |
| `@vitejs/plugin-react` | `^5.1.3` | Vitest/Vite React plugin |
| `@vitest/ui` | `^4.0.18` | Vitest UI mode |
| `autoprefixer` | `^10.4.27` | PostCSS vendor prefixing |
| `eslint` | `^8.0.0` | Linting |
| `eslint-config-next` | `^14.0.0` | Next.js ESLint rules |
| `jsdom` | `^28.0.0` | Browser-like test environment |
| `postcss` | `^8.5.8` | CSS transformation pipeline |
| `tailwindcss` | `^3.4.17` | Utility CSS framework |
| `typescript` | `^5.3.0` | TypeScript compiler |
| `vitest` | `^4.0.18` | Test runner |

---

## 3) Frontend

### Next.js and React

- Next.js: `14.x` (App Router structure under `app/`)
- React: `18.2.0`
- React Strict Mode: enabled (`next.config.js`)
- SWC minification: enabled

### `next.config.js` Details

- Security headers for all paths:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Compression enabled (`compress: true`)
- `poweredByHeader: false`
- Image config:
  - formats: AVIF/WebP
  - `dangerouslyAllowSVG: true`
  - image CSP: `"default-src 'self'; script-src 'none'; sandbox;"`
- Public env passthrough:
  - `NEXT_PUBLIC_SITE_URL` defaulting to `https://regpulss.com`

### shadcn/ui Components Present

In `components/ui/`:
- `button`
- `card`
- `table`
- `tabs`
- `input`
- `badge`
- `separator`
- `avatar`

Also:
- shadcn config file: `components.json`
- Style preset: `base-nova`
- `rsc: true`, `tsx: true`, `iconLibrary: lucide`

### CSS Architecture

- Global stylesheet: `app/globals.css`
- Layers:
  - `@tailwind base; @tailwind components; @tailwind utilities;`
  - Additional `@layer base` token mapping for shadcn-compatible vars
- Two style systems coexist:
  1. **Custom semantic CSS classes** (`.hero`, `.cta-button`, `.container`, etc.)
  2. **Tailwind utility classes** (especially in admin dashboard and shadcn components)
- Core design tokens in `:root`:
  - `--color-primary`, `--color-accent`, `--color-text-*`, `--color-background*`, `--color-border`
  - typography vars: `--font-sans`, `--font-serif`
- Tailwind config extends color/radius tokens based on CSS vars (`border`, `ring`, `background`, `card`, etc.)

### Fonts

Loaded via `next/font/google` in `app/layout.tsx`:
- `Inter` (weights 400/500/600, variable `--font-inter`)
- `Libre Baskerville` (weights 400/700, variable `--font-libre`)

### Custom Components in `app/components/`

- `CookieConsent.tsx`
- `ErrorBoundary.tsx`
- `ConfirmationToast.tsx`
- `SubscribeForm.tsx`
- `language-switcher.tsx`
- `sections/Header.tsx`
- `sections/HeroSection.tsx`
- `sections/TrustSection.tsx`
- `sections/BenefitsSection.tsx`
- `sections/Footer.tsx`

---

## 4) Backend / API

### API Routes (`app/api/*`)

| Route | Methods | Purpose |
|---|---|---|
| `/api/locale` | `POST` | Sets locale cookie (`regpulss_locale`) to `en` or `lv` |
| `/api/subscribe` | `POST` | Validates email, rate-limits, inserts subscription, logs duplicates, invokes confirmation Edge Function |
| `/api/unsubscribe` | `GET` | Uses service-role key to mark subscription as unconfirmed via `unsubscribe_token`, then redirects to status page |
| `/api/send-newsletter` | `POST` | Auth-protected bulk newsletter sender via Resend |

### Middleware Configuration

- Root `middleware.ts` delegates to `utils/supabase/middleware.ts`
- Matcher excludes static/image assets:
  - `_next/static`, `_next/image`, `favicon.ico`, and common image extensions

### Rate Limiting

Implemented in `lib/rate-limit.ts`:
- In-memory map keyed by identifier (IP)
- Defaults: `5` requests per `1 hour`
- `subscribe` route uses IP from `x-forwarded-for` / `x-real-ip`
- Returns headers: `X-RateLimit-*`, `Retry-After`
- Automatic cleanup interval every 10 minutes

### Authentication Flow (Supabase Auth + SSR)

- Browser client: `utils/supabase/client.ts` (`createBrowserClient`)
- Server component/API client: `utils/supabase/server.ts` (`createServerClient` + cookies)
- Middleware client: `utils/supabase/middleware.ts` for session refresh and redirect logic
- Protected admin behavior:
  - unauthenticated `/admin/*` (except login) -> redirect `/admin/login`
  - authenticated user visiting `/admin/login` -> redirect `/admin/dashboard`

---

## 5) Database

### Supabase Tables Referenced

- `email_subscriptions`
  - fields used: `id`, `email`, `created_at`, `confirmed`, `confirmation_token`, `unsubscribe_token`
- `email_duplicates`
  - fields used: `email`, `reason`, `user_agent`, `attempted_at`
- `duplicate_statistics` (view or table)
  - fields used: `email`, `duplicate_count`, `first_attempt`, `last_attempt`, `unique_reasons`

### RLS Policies

- No explicit SQL migration/policy files are currently present in repository root.
- Supabase policy behavior must be verified in Supabase Dashboard/project migrations (not represented in current tracked SQL files).

### Supabase Client Configuration Modes

| Mode | File | Auth/Cookies Behavior |
|---|---|---|
| Browser | `utils/supabase/client.ts` | Public anon client for client components |
| Server | `utils/supabase/server.ts` | Uses `cookies()` to bind session server-side |
| Middleware | `utils/supabase/middleware.ts` | Reads/sets cookies during request pipeline and route protection |
| Legacy global client | `lib/supabaseClient.ts` | Shared anon client built from validated env |

---

## 6) Email

### Resend Integration

- App API bulk newsletter: `app/api/send-newsletter/route.ts`
  - Uses `new Resend(process.env.RESEND_API_KEY)`
  - Sends in batches of 50 recipients per request
  - Sender: `noreply@regpulss.lv`
- Confirmation email (Supabase Edge Function):
  - `supabase/functions/send-confirmation/index.ts`
  - Calls Resend REST API directly (`https://api.resend.com/emails`)
  - Sender there: `RegPulss <newsletter@regpulss.lv>`

### Email Templates

- React Email templates (for local template development):
  - `emails/confirmation.tsx`
  - `emails/newsletter.tsx`
- Runtime send implementations:
  - Confirmation: raw HTML builder in Edge Function
  - Newsletter: raw HTML builder in Next API route

---

## 7) Authentication

### Auth Flow Description

1. Admin user signs in on `/admin/login` via `signInWithPassword`.
2. Supabase session cookie is established.
3. Middleware (`updateSession`) reads/refreshes session and gates admin routes.
4. `/admin/dashboard` server page checks `supabase.auth.getUser()` before rendering.
5. Logout button calls `supabase.auth.signOut()` and redirects to `/admin/login`.

### Protected Routes

- `/admin/dashboard`
- `/admin/duplicates`
- Any `/admin/*` except `/admin/login`

### Session Management

- Cookie-aware SSR with `@supabase/ssr`
- Middleware synchronizes auth cookies between request and response

---

## 8) Testing

### Framework/Tooling

- Vitest (`vitest@^4.0.18`)
- React Testing Library
- JSDOM environment (`vitest.config.ts`)
- Setup file: `vitest.setup.ts` (`@testing-library/jest-dom`, env var mocks)
- Coverage provider: `v8`
- Coverage reporters: `text`, `json`, `html`

### Test Files and Coverage Scope

| Test File | What It Covers |
|---|---|
| `__tests__/api/subscribe.test.ts` | Email validation and expected response-shape behavior (unit-style) |
| `__tests__/api/unsubscribe.test.ts` | Unsubscribe route redirect behavior with mocked Supabase client |
| `__tests__/validators/email.test.ts` | Email regex validation edge cases |
| `__tests__/components/ErrorBoundary.test.tsx` | Error boundary rendering and fallback UI presence |
| `__tests__/lib/useSupabase.test.ts` | `useAuth` hook state lifecycle and cleanup |

### Coverage Percentage

- No current committed coverage output/report file was found in repo.
- Coverage tooling is configured, but an exact up-to-date percentage is not derivable from source files alone.

---

## 9) DevOps & Deployment

### Hosting/Platform

- Vercel is implied by:
  - `@vercel/analytics`
  - Next.js app structure/config
- Supabase used for DB/Auth and Edge Functions.

### Supabase Edge Functions

Defined in `supabase/config.toml`:
- `send-confirmation`
  - `verify_jwt = true`
  - import map: `functions/send-confirmation/deno.json`
- `notify-discord`
  - `verify_jwt = false`
  - import map: `functions/notify-discord/deno.json`

### Environment Variables Required

From runtime/config code and `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for `/api/unsubscribe`)
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM` (present in example)
- Supabase Edge Function secrets:
  - `RESEND_API_KEY`
  - `SITE_URL`
  - `DISCORD_WEBHOOK_URL`

### Build Configuration

- Build command: `next build`
- Lint command: `next lint`
- Tests: `vitest`
- PostCSS enabled via `postcss.config.js`
- Tailwind scanning paths configured in `tailwind.config.js`

---

## 10) Security

### Security Headers

From `next.config.js`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Additional image CSP for SVG handling under Next Image config

### Rate Limiting

- In-memory IP-based limiter on `/api/subscribe`
- 5 requests/hour with response headers for limits and reset

### Input Validation

- Email format validation in subscription flow
- Zod-based environment variable validation in `lib/env.ts`
- JSON body validation and required field checks in API handlers
- HTML escaping in newsletter email content generation

### Auth/API Protection

- `/api/send-newsletter` requires authenticated Supabase user
- `/api/unsubscribe` requires service role key and token match
- Admin pages protected by middleware + server-side user checks

### RLS Status

- RLS policy definitions are not explicitly versioned in currently tracked SQL files.
- Code assumes table access permissions are managed in Supabase project configuration.

---

## Additional Notable Architecture Details

- Internationalization:
  - Cookie-based locale (`regpulss_locale`)
  - Dictionaries in `lib/i18n/en.ts` and `lib/i18n/lv.ts`
- SEO:
  - `app/robots.ts`
  - `app/sitemap.ts`
- Error handling:
  - React `ErrorBoundary` wrapper around homepage sections
  - Structured logger in `lib/logger.ts`
- Mixed admin stack:
  - New shadcn dashboard (`/admin/dashboard`)
  - Existing Tailwind-only duplicates dashboard (`/admin/duplicates`)

