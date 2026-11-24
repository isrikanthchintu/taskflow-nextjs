# Build vs Buy Assessment

This assessment follows intent-statement.md: the board stays browser-only with export/import, serves personal and small-team use, and leaves out accounts, real-time sharing, attachments and notifications. You prefer well-maintained open-source libraries when they fit (Q3 of this stage). Market sizing is skipped because the board is not meant for a public release (Q4 of this stage).

## Options for the Overall Goal

| Option | What it means | Verdict |
|--------|---------------|---------|
| Buy: use Trello, Notion, Linear, Asana, Jira or GitHub Projects directly | Stop building the board and adopt a hosted tool | Rejected: the requester wants this board enhanced, and hosted tools need accounts and servers, which this project deliberately avoids |
| Build: extend the existing board | Keep the current app and add the shortlisted features | Chosen, because the app already has the board, drag and drop, and localStorage persistence |
| Partner: connect to a hosted tool | Sync with Trello or similar | Rejected for this version: it needs accounts and a server, both left out |

## Build vs Buy by Feature (library guidance)

The decision rule: use a maintained open-source library when it fits a browser-only TypeScript app, otherwise build by hand. Library names below are candidates to be confirmed by a later design stage, not decisions; they are hypotheses from general knowledge and were not verified in this research.

| Feature | Approach | Candidate (hypothesis) |
|---------|----------|------------------------|
| List and card drag and drop | Keep the existing library | The project already uses `@dnd-kit` |
| Custom lists, labels, checklists, archive, duplicate, templates | Build by hand | Plain React state on the existing task store; small enough that a library adds more than it saves |
| Filters, sort, group-by | Build by hand | Simple array operations on the card list |
| Theme: background, light and dark mode, accent color, card and list look | Use the existing UI library's theming | The project already uses MUI, which supports custom themes |
| Command menu and keyboard shortcuts | Library, if it fits | A small command-palette or hotkey library, to be chosen at design time |
| Several boards | Build by hand | Extend the single localStorage store; no library needed |
| Board export and import | Build by hand | Browser file APIs and JSON |
| Simple rules | Build by hand | A small rule model evaluated on card events; no suitable lightweight library assumed |

## Cost and Risk Notes

- Every added library increases bundle size and upkeep, so each is judged when it is designed, not now.
- Hypothesis: rules are the highest-effort item and the one most likely to be cut, because no studied product's rule model fits a single-user board without added complexity.

## Assumptions & Open Questions

None.
