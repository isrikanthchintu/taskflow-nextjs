# Scope Document

Source: intent-statement.md (intent capture), the research in competitive-analysis.md, and your answers in scope-definition-questions.md (Q1 to Q4).

## Goal

Turn the existing Trello-style board into a daily-use task manager for personal and small-team use. It stays browser-only, with team sharing by exported and imported board files, and the success check is that you can run day-to-day tasks on it without another tool (Q1, Q5 and Q8 of intent capture).

## In Scope

Three releases, accepted as proposed (Q2). Each release is usable on its own.

### Release 1

- Custom lists: add, rename, reorder, archive and delete lists (P1)
- Richer cards: labels, checklists with progress, due-date states such as overdue and due soon, and a card detail view (P2)
- Filters, sort and group-by on the board (P3)
- Theme customization: board background, light and dark mode, accent color, and card and list look (P4)
- Archive with undo, duplicate card, and card templates (P5)

### Release 2

- Several boards, each with its own lists and theme (P6)
- Board export and import as a file, which is how a small team shares boards (P7)
- Keyboard shortcuts and a command menu (P8)

### Release 3

- List limits that warn when a list holds too many cards, and swimlanes that group cards across lists (P9)
- Simple rules that move or label cards automatically, kept as Should have (Q3) (P10)

## Out of Scope

- Accounts, sign-in, sharing and real-time collaboration that need a server (Q6 of intent capture). File-based export and import in Release 2 stays in scope.
- File attachments and image uploads (Q6 of intent capture)
- Notifications, emails and calendar sync (Q6 of intent capture)
- A database, backend API or server-side storage: browser localStorage stays the only data store (project rule; Q8 of intent capture)

## Priority (MoSCoW)

| Priority | Items | Basis |
|----------|-------|-------|
| Must have | P1, P2, P3, P4, P7 | Your core picks (Q1 of market research), the theme request (Q3 of intent capture), and small-team sharing (Q8 of intent capture) |
| Should have | P5, P6, P8, P9, P10 | Your power picks (Q2 of market research); rules confirmed as Should have (Q3) |
| Won't have this time | Everything under Out of Scope | Q6 of intent capture |

Must have items are 5 of 10, within the 60% guideline.

## Sequencing

Dependency first (Q1). Inside each release, build the foundations before the features that need them:

1. The list and card data model in the existing store (P1, P2), because filters, archive, several boards and export all depend on it.
2. Features that read that model (P3, P5), then theme (P4), which is independent and can run alongside.
3. Release 2: storage for several boards (P6), then export and import (P7), which needs the board data shape, then shortcuts and the command menu (P8).
4. Release 3: list limits and swimlanes (P9), then rules (P10).

## Constraints

- No hard deadlines (Q4).
- Prefer well-maintained open-source libraries when they fit (Q3 of market research).
- All existing features (drag between lists, add, edit, delete, search) stay in place until a feature replaces them; the data already in the browser must survive each release.

## Value Stream Map

| Step | Capability | Release |
|------|------------|---------|
| Shape the workflow | Custom lists, several boards | 1, 2 |
| Capture work | Richer cards, templates, duplicate | 1 |
| Find and focus | Filters, sort, group-by, list limits, swimlanes, shortcuts and command menu | 1, 2, 3 |
| Make it mine | Theme customization | 1 |
| Keep it safe and share it | Archive with undo, export and import | 1, 2 |
| Reduce busywork | Simple rules | 3 |

## Hand-off Notes

- The success check "run day-to-day tasks without another tool" (Q5 of intent capture) is not yet a pass/fail test. Requirements Analysis turns it into testable criteria, together with the existing-features-keep-working check, which you have not yet confirmed as a requirement.
- Whether background images are in scope for P4, given that uploads are out, is decided in Requirements Analysis.

## Assumptions & Open Questions

None.
