# CLAUDE.md — Meeting Room Booking (Sensedia take-home, Full Stack Mid-level)

Read this at the start of every session and follow it strictly.
Product and architecture decisions (in Portuguese): @docs/DECISIONS.md

## Language

- **Always reply to me in Brazilian Portuguese (pt-BR)**: plans, explanations, reviews, summaries, questions.
- Code, identifiers, code comments and commit messages: **English**.
- User-facing text (UI labels, error `message`s, empty states, toasts), README, PR descriptions and `docs/`: **pt-BR**.

## Context

Internal system for booking meeting rooms. Time-boxed technical test (6–8 h).
The author will **explain and modify this code live** in the interview: prefer simple, explicit, small code
over clever code. Every line must be defensible.

## Stack (fixed — do not swap or add anything without asking)

- Next.js (App Router) + React Server Components + Server Actions
- TypeScript with `strict: true` and `noUncheckedIndexedAccess: true`
- Prisma 7 + SQLite via `@prisma/adapter-better-sqlite3` (follow the official Prisma 7 SQLite quickstart; do not use Prisma 5/6 examples)
- Zod (validation shared between client and server)
- `date-fns` + `@date-fns/tz` (dates and time zones)
- Tailwind CSS + shadcn/ui (Radix) + Lucide icons
- Vitest (unit + integration against a real SQLite database); Playwright only if I ask
- npm (not pnpm/yarn)

## Commands

```bash
npm run dev          # dev server
npm run setup        # create .env if missing, apply migrations, run seed
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest (runs with TZ=UTC to mirror CI)
npm run build        # production build
```

Some commands only exist after the setup tasks. If one is missing, tell me; do not invent another.

## Architecture (layers — respect the dependency direction)

```
src/app/(app)/**        pages (Server Components): parse searchParams with Zod, call services
src/app/actions/*.ts    Server Actions: requireUser/requireAdmin → Zod → service → ActionResult
src/server/auth.ts      getCurrentUser, requireUser, requireAdmin (httpOnly cookie)
src/server/services/*   orchestrate transactions, ownership checks and Prisma queries
src/server/db.ts        PrismaClient singleton
src/domain/*            PURE rules: no Next, no Prisma, no Date.now() — `now` is a parameter
src/schemas/*           shared Zod schemas
src/components/**       UI; components/ui = generated shadcn
tests/unit, tests/integration, tests/helpers
```

Dependency rules:

- `domain/` imports nothing from `server/`, `app/`, Prisma or Next.
- Every file in `server/` starts with `import 'server-only'`.
- Components never import from `server/` directly (only through pages/actions).

## Security rules (non-negotiable)

- **Every Server Action is a public endpoint.** First meaningful line: `requireUser()` or `requireAdmin()`.
- **Never** accept `userId`, `role` or ownership from the client (form, URL, body). The user comes only from `getCurrentUser()`.
- Admin is protected in three places: `app/(app)/admin/layout.tsx` (`requireAdmin` → `notFound()`), each admin page, and each admin action. Proxy/middleware is **not** an authorization boundary.
- Conflict messages show the occupied time slot, **never** who booked it.
- Unexpected errors: log on the server (JSON with action, userId, code) and return `INTERNAL_ERROR` with a generic message. Never send stack traces to the client.
- Forbidden: `$queryRawUnsafe`, `dangerouslySetInnerHTML`.

## Current business rules

> Implement **only** the rules in this section. Do not anticipate future rules.
> In particular: do **not** implement business days/hours until I explicitly ask.

Business time zone: `BUSINESS_TIMEZONE` (default `America/Sao_Paulo`). The database stores **UTC**.
Every calendar rule is evaluated in the business time zone — never with the process's `getHours()`/`getDay()`.

Creating a reservation, in this order:

1. Room exists and is active (`ROOM_NOT_FOUND`, `ROOM_INACTIVE`).
2. `endsAt > startsAt` (`INVALID_RANGE`).
3. Start is not in the past: `startsAt < now` → `IN_THE_PAST`.
4. Duration ≥ 15 min (`DURATION_TOO_SHORT`) and ≤ `room.maxBookingMinutes`(`DURATION_TOO_LONG`), which ranges from 15 to 720.
5. No overlap with `ACTIVE` reservations of the same room. Half-open intervals `[start, end)`:
   conflict if `existing.startsAt < new.endsAt && existing.endsAt > new.startsAt`.
   Back-to-back bookings (09–10 and 10–11) are allowed. Cancelled ones do not block (`ROOM_CONFLICT`).
6. Steps 1–5 + INSERT inside **one** `prisma.$transaction(async (tx) => …)`. SQLite concurrency failure → `TRY_AGAIN`.

Cancelling:

- Owner only (`FORBIDDEN` for anyone else, **including admins**).
- Only `ACTIVE` (`ALREADY_CANCELLED`) and not yet started (`ALREADY_STARTED`) reservations.
- Soft cancel: `status = 'CANCELLED'`, `cancelledAt = now`. Never DELETE.

Rooms (admin): create and edit; no deletion — deactivate with `isActive = false`. Unique name (`NAME_TAKEN`).

## Action contract

```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
```

- Rule violations are `DomainError`s (with `code`) thrown in `domain/`/`services/` and converted to `ActionResult` in the action.
- `message` in pt-BR, short, ready for the UI.

## Code conventions

- Files `kebab-case.ts(x)`; components `PascalCase`; functions `camelCase` starting with a verb.
- Component over ~150 lines, or a service with more than one responsibility → split it.
- No premature abstractions: no generic repository, base service, DI container or "generic" hooks.
- No obvious comments. Comment only the **why** of something non-obvious.
- Dates in the UI: `ter, 07/10 · 10:00–11:00`, in the business time zone, with `tabular-nums`.
- Filters and navigable state live in the URL (`searchParams`), not in client state.

## Tests

- New or changed rule → write the test first, show it failing, then implement.
- Always inject `now`; do not scatter `vi.useFakeTimers`.
- Integration tests use a real test SQLite database (`file:./test.db`), reset between tests. Do not mock Prisma to test rules.
- Tests must fail if the rule breaks. A test that only checks "the mock was called" does not count.

## Working protocol

1. **Before coding**, if the task touches more than one file: propose a short plan (files to create/change, decisions) and wait for my "ok".
2. Change **only** what the task asks. Do not refactor, rename or reformat unrelated code.
3. **New dependency:** ask first, with the reason and a no-dependency alternative.
4. **Migrations:** never edit an existing migration. Schema change = new migration.
5. **Never** use `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `.skip`/`.only`, and never delete or weaken a test to make something pass. If you cannot solve it, stop and tell me.
6. When done, run `npm run lint && npm run typecheck && npm test` and show the real output.
7. Finish with: files changed, decisions you made on your own, and what I should test manually.

## Git (the author operates it)

- Do **not** commit, push, merge, rebase, tag, or create/switch branches. I do that.
- You may suggest Conventional Commit messages (`feat(scope): ...`, `fix`, `test`, `chore`, `ci`, `docs`), in English.
- Flow: `main` (production), `develop` (integration), `feature/SALA-<n>-description`, `release/<version>`, `hotfix/<...>`. Everything through PRs with merge commits.
