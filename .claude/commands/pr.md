---
description: Draft the PR description for the current branch using the repository template
---

Target branch: $ARGUMENTS (if empty, use `develop`).

1. Read `.github/pull_request_template.md`.
2. Read `git log <target>..HEAD --oneline` and `git diff <target>...HEAD --stat`, and open the main changed files.
3. Write the description **in pt-BR**, filling **O quê**, **Por quê**, **Como testar** (steps with a seed user and URL) and **Testes automatizados** (what each test guarantees).
4. If there was a new product decision, name it and confirm it is in `docs/DECISIONS.md`.
5. Suggest a Conventional Commits title in English that includes the card, e.g. `feat(rooms): SALA-1 room listing with URL filters`.

Do not open the PR, commit or push. Just give me the title and the markdown body to paste.
