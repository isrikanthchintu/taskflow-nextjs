# Technology Stack

## Language

- **TypeScript** — ^5.7.2 (devDependency), `strict: true` in `tsconfig.json`. All application source files are `.ts`/`.tsx`; `allowJs: false`.

## Runtime / Framework

- **Next.js** — ^15.5.0 — React framework providing the App Router, build tooling (`next build`), dev server (`next dev`), and production server (`next start`). `next.config.ts` enables only `reactStrictMode: true`; no other Next.js features (images, redirects, middleware, i18n) are configured.
- **React** — ^19.1.0 — UI library.
- **react-dom** — ^19.1.0 — DOM renderer paired with React 19.

## UI / Styling

- **Tailwind CSS** — ^3.4.17 (devDependency) — configured via `tailwind.config.ts` (`content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]`, empty theme extension, no plugins) and engaged in `globals.css` via the three `@tailwind` directives. In practice, the component markup does not use Tailwind utility classes inline; the visible styling is the hand-written CSS rules in the same file (see `code-structure.md`).
- **PostCSS** — ^8.4.49 (devDependency) — processes the Tailwind pipeline, configured in `postcss.config.mjs`.
- **Autoprefixer** — ^10.6.2 (devDependency) — vendor-prefixing plugin in the PostCSS pipeline.
- **lucide-react** — ^0.468.0 — icon component library; used extensively throughout `task-dashboard.tsx` (Activity, ArrowDownWideNarrow, CalendarDays, Check, CheckCircle2, Circle, ClipboardList, LayoutDashboard, ListTodo, Plus, Search, Settings2, Trash2, X).

## Tooling

- **ESLint** — ^9.17.0 (devDependency) — flat config format (`eslint.config.mjs`), extending `next/core-web-vitals` and `next/typescript` via `FlatCompat` from `@eslint/eslintrc` (^3.3.7). Ignores `.next/**` and `node_modules/**`.
- **eslint-config-next** — ^15.5.0 (devDependency) — supplies the Next.js-recommended lint rule presets consumed above.
- **TypeScript compiler (`tsc`)** — used in `--noEmit` mode only (type-checking, not emitting JS; Next.js's own bundler handles compilation) via the `pnpm typecheck` script.
- **@types/node** ^22.10.0, **@types/react** ^19.0.0, **@types/react-dom** ^19.0.0 (devDependencies) — TypeScript type definitions for Node, React, and React DOM APIs.

## Package Manager

- **pnpm** — evidenced by the committed `pnpm-lock.yaml` (125KB lockfile) and the README's explicit `pnpm install`/`pnpm dev` instructions. No `package-lock.json` or `yarn.lock` present.

## Persistence

- **Browser `localStorage` (Web Storage API)** — the application's only data store. No database, ORM, or query library of any kind (no Prisma, Drizzle, SQL/NoSQL driver) appears anywhere in the dependency list. See `architecture.md` for the full persistence flow.

## Build Output / Artifacts (not scanned as source, confirmed present)

- `.next/` — Next.js build output directory (git-ignored, left unopened per scan rules).
- `tsconfig.tsbuildinfo` — TypeScript incremental build cache (git-ignored via `*.tsbuildinfo`).

## Explicitly Absent

- No testing framework (Jest, Vitest, Playwright, Cypress, Testing Library, etc.).
- No state-management library (Redux, Zustand, Jotai, Recoil, React Query/TanStack Query, SWR).
- No backend framework, ORM, or database driver.
- No authentication library.
- No CI/CD tooling configuration (no GitHub Actions, GitLab CI, etc.).
