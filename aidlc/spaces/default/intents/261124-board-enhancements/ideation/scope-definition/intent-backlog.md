# Intent Backlog

Prioritized from scope-document.md using MoSCoW, ordered dependency first (Q1 of scope-definition-questions.md). Each row is a proto-Unit that later stages refine.

## Backlog

| ID | Capability | Release | Priority | Depends on | Source |
|----|------------|---------|----------|------------|--------|
| P1 | Custom lists: add, rename, reorder, archive, delete | 1 | Must have | none | Q1 market research; Q2 scope |
| P2 | Richer cards: labels, checklists with progress, due-date states, card detail view | 1 | Must have | P1 | Q1 market research; Q2 scope |
| P3 | Filters, sort, group-by | 1 | Must have | P1, P2 | Q1 market research; Q2 scope |
| P4 | Theme customization: background, light and dark mode, accent color, card and list look | 1 | Must have | none | Q3 intent capture; Q2 scope |
| P5 | Archive with undo, duplicate card, card templates | 1 | Should have | P1, P2 | Q2 market research; Q2 scope |
| P6 | Several boards, each with its own lists and theme | 2 | Should have | P1, P4 | Q1 market research; Q2 scope |
| P7 | Board export and import as a file | 2 | Must have | P1, P2, P6 | Q8 intent capture; Q2 scope |
| P8 | Keyboard shortcuts and command menu | 2 | Should have | P1 | Q2 market research; Q2 scope |
| P9 | List limits and swimlanes | 3 | Should have | P1, P3 | Q2 market research; Q2 scope |
| P10 | Simple rules that move or label cards | 3 | Should have | P1, P2 | Q2 market research; Q3 scope |

## Build Order (dependency first)

1. P1, then P2 (data model foundations)
2. P3, P5, P4 (P4 can run alongside)
3. P6, P7, P8
4. P9, P10

## Left Out

Accounts and server-backed sharing, attachments and uploads, and notifications and sync stay out of this backlog (Q6 of intent capture).

## Assumptions & Open Questions

None.
