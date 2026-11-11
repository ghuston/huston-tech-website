@AGENTS.md

# Working rules for Claude Code

AGENTS.md (imported above) is the single source of repo rules. This file only
adds how I want you to work.

If the two files conflict: CLAUDE.md wins on workflow and deployment (the gated
pipeline: plan, branch, build, check, PR, review, merge, auto-deploy on merge).
AGENTS.md wins on code, content and architecture rules. If a conflict isn't
clearly one or the other, ask me.

## Git workflow
- Never commit or push to `main`.
- One branch per change, named `type/short-name` (for example `feat/faq-section`,
  `fix/nav-focus`, `chore/claude-md`).
- Plan first and wait for my approval before editing anything.
- Run `npm run check` before every commit. If it fails, stop and show me the
  exact error; do not commit.
- When the work is done, open a pull request. Never merge it yourself; I merge.

## Commands
- `npm run dev`: dev server at http://localhost:4821 (port is fixed in package.json).
  If the port is busy, tell me what is using it instead of killing it.
- `npm run check`: lint, then typecheck, then production build (static export to `out/`).
- `npm run preview`: serves the built `out/` folder the way Cloudflare Pages will,
  including `public/_headers`. Run `npm run build` first.
- `npm run check:placeholders`: launch gate; failing is expected until content is final.

## Design migration
The repo is mid-migration to design v2. The design-token and motion sections of
AGENTS.md may be out of date. Before relying on a token name, motion rule, or
component described there, confirm it exists in `src/app/globals.css`,
`src/app/motion.css`, or the component itself, and tell me if they disagree.

## Secrets
- No secrets in code, ever. `NEXT_PUBLIC_*` variables are public, so nothing
  sensitive goes there either.
- `.env` files are never committed (only `.env.example`). If a command would
  stage one, stop and tell me.

## How to explain things to me
I'm entry-level. For each non-obvious action (a git command, a flag, a config
change, a new file, a dependency), say in one or two plain sentences what it does
and why you are doing it. Define jargon the first time you use it. Prefer small
steps over large ones, and show me the result of each before moving on.
