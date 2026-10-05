---
description: Review the current diff as a demanding reviewer, without changing files
---

Review the uncommitted changes (`git diff` and `git diff --staged`) and new files (`git status`).
Do not change any file. **Answer in pt-BR**, grouped by severity (critical, important, minor), citing file and line.

Check, in this order:

1. **CLAUDE.md rules**: layers respected (`domain/` pure, `server-only`), no future rule anticipated.
2. **Authorization**: every new action and page calls `requireUser`/`requireAdmin`; no `userId`/`role` coming from the client.
3. **Business rules**: they live in `domain/` and match "Current business rules"; the business time zone is used in every calendar rule.
4. **Tests**: the change has a test that would fail if the rule broke; no `.skip`, `.only`, or Prisma mocks to test rules.
5. **Quality**: `any`, `ts-ignore`, `eslint-disable`, leftover `console.log`, dead code, duplication, oversized component or service, vague names, obvious comments.
6. **Scope**: files changed unrelated to the task; new dependencies without justification; edited old migration.
7. **UX**: loading, empty, error and success states on the touched screens; accessible labels and focus.

Then run `npm run lint && npm run typecheck && npm test` and report the real result.
End with a short list of suggested Conventional Commit messages (in English) for this diff. $ARGUMENTS
