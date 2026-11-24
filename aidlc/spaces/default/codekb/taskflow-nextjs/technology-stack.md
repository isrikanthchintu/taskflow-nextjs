# Technology Stack

## Languages and Runtime

- TypeScript ^5.7.2, `strict: true`, `allowJs: false`, target ES2017, `moduleResolution: bundler`, `jsx: preserve`, path alias `@/*` -> `./src/*` (`tsconfig.json`).
- Node.js 20.9 or later (README); CI uses `lts/*`.
- Browser runtime: React client components; `crypto.randomUUID` and `localStorage`.

## Frameworks and Libraries (runtime)

| Package | Range | Purpose |
|---|---|---|
| next | ^15.5.0 | App Router framework |
| react, react-dom | ^19.1.0 | UI |
| @mui/material | ^9.5.0 | Component library |
| @mui/icons-material | ^9.5.0 | Icons used in `TaskCard` |
| @mui/material-nextjs | ^9.5.0 | App Router emotion cache (`v15-appRouter`) |
| @emotion/react, @emotion/styled | ^11.14.0, ^11.14.1 | MUI styling engine |
| @dnd-kit/core | ^6.1.0 | Drag and drop primitives |
| @dnd-kit/sortable | ^8.0.0 | Sortable lists, keyboard coordinates |
| lucide-react | ^0.468.0 | Icons in dashboard and column |

## Tooling (dev)

| Package | Range | Purpose |
|---|---|---|
| tailwindcss | ^3.4.17 | Directives in `globals.css` (no utility classes in components) |
| postcss, autoprefixer | ^8.4.49, ^10.6.2 | CSS pipeline |
| eslint, eslint-config-next, @eslint/eslintrc | ^9.17.0, ^15.5.0, ^3.3.7 | Linting (flat config via FlatCompat) |
| prettier | ^3.4.2 | Formatting |
| jest, jest-environment-jsdom | ^29.7.0 | Tests (via `next/jest`) |
| @testing-library/react, jest-dom, user-event | ^16.1.0, ^6.6.3, ^14.5.2 | Component testing |
| @types/jest, node, react, react-dom | ^29.5.14, ^22.10.0, ^19.0.0, ^19.0.0 | Types |
| ts-node | ^10.9.2 | Loads `jest.config.ts` |

## Package Manager and Scripts

pnpm with `pnpm-lock.yaml`. Scripts: `dev`, `build`, `start`, `lint` (`eslint src/`), `typecheck` (`tsc --noEmit`), `test` (`jest`), `format` (`prettier --write .`), `format:check`.

## Configuration

- `next.config.ts`: `reactStrictMode: true`.
- `jest.config.ts`: `next/jest`, `jsdom`, setup file `jest.setup.ts` (jest-dom and `crypto.randomUUID` polyfill), 20 s timeout.
- `.prettierrc.json`: `tabWidth: 2`, `singleQuote: false`, `trailingComma: "none"`.
- `eslint.config.mjs`: `next/core-web-vitals`, `next/typescript`; ignores `.next` and `node_modules`.
- `.env.example`: states no environment variables are required.

## Persistence

Browser `localStorage` only. No database, ORM, API, or server state.

## Infrastructure

GitHub Actions CI (`.github/workflows/ci.yml`). No deployment target, container, or IaC.
