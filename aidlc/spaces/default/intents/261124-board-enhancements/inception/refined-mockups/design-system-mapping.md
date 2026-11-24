# Design System Mapping

The app keeps its existing design system: Material UI with the project theme in `src/theme.ts` and the emotion cache in `src/theme-registry.tsx`, plus `lucide-react` icons and `@mui/icons-material` already in use (technology-stack.md in the code map). No second UI library is introduced. Requirement IDs come from requirements.md.

## Component Mapping

| Screen element | MUI component (or existing component) | Notes |
|---|---|---|
| Top bar | `Stack` header (existing) | Add the boards menu button and the gear |
| Boards menu, list menu | `Menu`, `MenuItem` | Radio behavior for boards through `role="menuitemradio"` |
| Filter panel | `Popover` (desktop and tablet), `Drawer` anchor bottom (mobile) with `FormControlLabel`, `Checkbox`, `RadioGroup` | One panel for filter, sort and group (Q4 B) |
| Card dialog | `Dialog` (existing form dialog), `TextField`, `Chip`, `Checkbox`, `LinearProgress` | Centred (Q2 A); full-screen on mobile with `fullScreen` |
| Label chips | `Chip` with a name and color swatch | Name always shown (FR3.1, NFR3) |
| Checklist progress | `LinearProgress` plus text "1 of 4" | Text carries the meaning (NFR3) |
| Due-date chip | `Chip` with an icon and words | "Overdue", "Due soon" (FR3.3) |
| Banners | `Alert` with `severity` and an icon | Words plus icon (FR1.3 to FR1.5) |
| Undo | `Snackbar` with an `Alert` and an `Undo` action | 10 seconds (FR6.2) |
| Confirm | `Dialog` | Default focus on Cancel (FR2.5) |
| Settings page | New route `/settings` using `Container`, `Grid`, `RadioGroup`, `ToggleButtonGroup` | Separate page (Q1 C) |
| Archive | New route `/archive` with `Tabs`, `List` | Lists, Cards, Boards (R2) |
| Command menu | `Dialog` with `Autocomplete` or a small command-palette library | Library choice is for design time (Q3 of market research) |
| Drag and drop | `@dnd-kit` (existing) | Sort and group turn it off inside a list (S4) |

A structural change to flag for the design stage: the app has one route today (`/`); settings and archive add `/settings` and `/archive`. The team practice describes the single-route structure as the current shape, not a rule, and both new pages are required by your answers (Q1 C) and by FR2.4 and FR6.1.

## Design Tokens

Current values in `src/theme.ts` stay as the base: primary `#0079bf`, error `#eb5a46`, warning `#f2d600`, success `#61bd4f`, text `#202238` and `#6b778c`. New tokens below are proposals for the design stage to confirm. Contrast ratios are targets to verify, not measured results.

### Spacing and density (FR5.4)

| Token | Comfortable | Compact |
|---|---|---|
| Card padding | 12 px | 8 px |
| Gap between cards | 8 px | 4 px |
| List header height | 44 px | 36 px |
| Minimum touch target on mobile | 44 px | 44 px |

### Corner roundness (FR5.4)

| Token | Square | Rounded (default) | Very rounded |
|---|---|---|---|
| Card radius | 0 px | 8 px | 16 px |
| List radius | 0 px | 12 px | 20 px |
| Button radius | 0 px | 8 px | 999 px |

### Accent presets (FR5.2, global)

Six presets: Blue (the current `#0079bf`), Green, Purple, Orange, Red, Slate. Each must keep text on primary buttons at 4.5 to 1 and the focus ring at 3 to 1 in light and dark mode. Each swatch has a text name.

### Board background presets (FR5.3, per board)

Eight presets: four solid colors and four two-color gradients, no images (requirements-analysis Q3 A). The default is the current blue gradient from `#0079bf` to `#026aa7`. Because list and card surfaces cover most of the board, only the top bar text, board title text and count pills sit directly on the background, so those are the elements whose contrast is checked per preset. The top bar uses a dark translucent layer so white text keeps contrast on any preset.

### Mode palettes (FR5.1)

| Token | Light | Dark (proposal) |
|---|---|---|
| List surface | `#f1f2f4` (current) | `#161a1d` |
| Card surface | `#ffffff` | `#22272b` |
| Primary text | `#172b4d` (current card text) | `#b6c2cf` |
| Secondary text | `#626f86` (current) | `#9fadbc` |

The dark values are proposals; each text and surface pair is checked at 4.5 to 1 before the design stage accepts them.

### Typography

Font stack stays as in `theme.ts` (Inter, then system fonts). Card title 14 px weight 500; description 12 px; list title 14 px weight 700; page title 20 px weight 700.

## Icons

New icons use `lucide-react` (settings, filter, archive, copy, undo). Existing `@mui/icons-material` icons stay where they are. Two icon libraries are already in use; reducing to one is a code-scan finding, not part of this design.

## First-Paint Theme (FR5.5)

The saved theme must apply before the first paint so there is no light flash in dark mode. The design stage decides how (for example a small inline script that sets the mode attribute before hydration, guarded for the server per the project rule). The design requirement is only that no wrong-theme flash is visible.

## Assumptions & Open Questions

None.
