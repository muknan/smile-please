# Build notes

Judgement calls, non-standard choices, and things that need a human decision. Format:
`- [phase N] <what happened> — <what you did>`

- [phase 1] logo.svg is a placeholder — client will supply the real asset.
- [phase 1] Master §4 lists `Table` and `Card` under `components/ui/` but Phase 1 Task 1.7 specifies only six primitives — added minimal token-styled `Card` and `Table` shells to match the master directory shape without building ahead.
- [phase 1] Phase 1 Task 1.2 specifies `postcss.config.js` (CommonJS); the template generated `postcss.config.mjs` — removed the `.mjs` and added the `.js` with `tailwindcss` + `autoprefixer` as specified.
- [phase 1] Required-field asterisk in `Field` uses `marigold-500` for visibility — Task 1.7 did not specify a colour.
- [phase 1] `--no-turbopack` accepted by create-next-app@15.1.6 without issue — template installs Tailwind v3 (no v4 downgrade needed); `npm ls tailwindcss` = 3.4.17.
