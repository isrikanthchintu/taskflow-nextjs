# Requirements

## Intent Analysis

Goal: turn the existing Trello-style board into a daily-use task manager for personal and small-team use, kept browser-only, with team sharing by exported and imported board files (intent-statement.md; intent-capture Q1, Q2, Q8). The work is an enhancement of existing code: a client-rendered Next.js app whose cards are saved in one flat list under the browser key `taskflow.tasks.v1`, with three fixed lists and no card position field (architecture.md, code-structure.md).

Scope comes from scope-document.md: ten features in three releases, built dependency first.

- Release 1: custom lists, richer cards, filters, sort and group-by, theme customization, archive with undo, duplicate card and templates.
- Release 2: several boards, board export and import, keyboard shortcuts and command menu.
- Release 3: list limits and swimlanes, simple rules.

Type: enhancement. Scope: multi-component (dashboard, board, list, card, storage, theme). Complexity: standard.

How requirements are written: each has a stable ID. "Release" and "Priority" come from scope-document.md and intent-backlog.md. "Source" names the answer or document the requirement comes from. Acceptance criteria use Given/When/Then.

## Functional Requirements

### FR1 Data model, storage and migration (Release 1, Must have; backlog P1, P2)

Source: scope-document.md Constraints; intent-capture Q8; requirements-analysis Q2, Q5; project rule that localStorage stays the only data store.

- **FR1.1** The system shall save boards, lists and cards, with each list's card order, in browser localStorage under a new versioned key, and shall keep localStorage as the only data store.
  - Given the app is open, When a list or card is created, changed, reordered or deleted, Then the change is saved to localStorage and is still there after a page reload.
- **FR1.2** The system shall convert the cards saved under `taskflow.tasks.v1` into a default board with the three current lists (To do, In progress, Completed), keeping each card's fields and its order within its list. (requirements-analysis Q2 A)
  - Given cards exist under `taskflow.tasks.v1`, When the upgraded app first loads, Then a default board shows those cards in the matching lists in their previous order with title, description, priority and due date unchanged.
- **FR1.3** The system shall check stored data when it reads it, and when the data is unreadable or does not match the expected shape it shall tell the user, leave the stored data untouched, and not overwrite it. (Origin: corner-checklist "Formats the product parses" and "Storage and state"; code scan finding that `readTasks` casts without checking.)
  - Given the stored data is damaged, When the app loads, Then a message says the data could not be read and the stored data is not changed.
- **FR1.4** The system shall report a failed save (storage full or unavailable) clearly and shall keep the previously saved data. (Origin: corner-checklist "Disk full or read-only".)
  - Given storage is full, When the user adds a card, Then a message says the change was not saved and the earlier saved data is intact.
- **FR1.5** The system shall support up to 5 boards, 10 lists per board and 200 cards in total, shall warn the user when 90% of any limit is used, and shall refuse to go past a limit with a message naming the limit. (requirements-analysis Q5 A)
  - Given a board has 10 lists, When the user adds an 11th, Then it is refused with a message that the limit is 10 lists per board.

### FR2 Custom lists (Release 1, Must have; backlog P1)

Source: intent-capture Q1; market-research Q1 A; scope-document.md; requirements-analysis Q4 A.

- **FR2.1** The user shall be able to add a list with a name. A blank or whitespace-only name shall be refused.
  - Given a board, When the user adds a list named "Review", Then a list "Review" appears after the last list.
- **FR2.2** The user shall be able to rename a list.
  - Given a list "Review", When the user renames it "Testing", Then the list shows "Testing" and its cards are unchanged.
- **FR2.3** The user shall be able to reorder lists by drag and by keyboard.
  - Given three lists, When the user moves the last list to the first position, Then the order is saved and kept after a reload.
- **FR2.4** The user shall be able to archive a list, which archives the list and all its cards together, and to restore an archived list with its cards. (requirements-analysis Q4 A)
  - Given a list with four cards, When the user archives it, Then the list and its four cards leave the board and appear in the archive; When the user restores it, Then they return with the cards in their previous order.
- **FR2.5** The system shall delete an archived list permanently only after a confirmation that names the number of cards affected. (Origin: corner-checklist "Screens and user input", destructive action; the user chose archive over delete in Q4 A.)
  - Given an archived list with four cards, When the user chooses to delete it permanently, Then a confirmation states that four cards will be deleted and nothing is deleted until the user confirms.
- **FR2.6** The system shall show an empty state with an "Add a list" action when a board has no lists, and an empty list shall show that it has no cards. (Origin: corner-checklist "Collections and lists".)
  - Given a board with no lists, When the board opens, Then an empty state offers "Add a list".

### FR3 Richer cards (Release 1, Must have; backlog P2)

Source: market-research Q1 B; scope-document.md; intent-capture Q1.

- **FR3.1** The user shall be able to give a card any number of labels, each with a name and a color, chosen from the board's label set, and to create, rename, recolor and delete labels in that set. The card shall show each label's name, not color alone. (NFR3)
  - Given a board with the label "Bug", When the user adds it to a card, Then the card shows "Bug" in its color.
- **FR3.2** The user shall be able to add checklists to a card, each with items that can be added, renamed, checked, unchecked, reordered and deleted, and the card shall show the number of items checked out of the total.
  - Given a checklist with four items, When the user checks one, Then the card shows 1 of 4.
- **FR3.3** The card shall show a due-date state: overdue (the due date is before today), due soon (the due date is today or tomorrow), or none, using one stated time zone, the browser's local time zone, for the day boundary, and a card in the last list of the done kind (FR2 default list "Completed") shall not show overdue. (Origin: corner-checklist "Time"; assumption A1.)
  - Given a card due yesterday that is not in "Completed", When the board shows, Then the card shows an overdue state in words as well as color.
- **FR3.4** The user shall open a card in a detail view that shows and edits title, description, priority, due date, labels and checklists, replacing the current edit dialog. Existing fields (title up to 100 characters, description up to 500, priority, due date) keep their current meaning and limits.
  - Given a card, When the user opens it and changes the title, Then the board shows the new title after saving.
- **FR3.5** The system shall keep very long text and unbroken words inside the card without breaking the layout, and shall show a placeholder where a blank would mislead (existing "No description added" and "No due date" wording stays). (Origin: corner-checklist "Text".)
  - Given a title of 100 characters with no spaces, When the card shows, Then the text wraps inside the card.

### FR4 Filters, sort and group-by (Release 1, Must have; backlog P3)

Source: market-research Q1 C; scope-document.md.

- **FR4.1** The user shall be able to filter the board by text (the existing search over title and description), label, priority and due-date state, alone or combined, and to clear all filters at once.
  - Given filters label "Bug" and priority "high", When applied, Then only cards with both show.
- **FR4.2** The user shall be able to sort the cards within each list by due date, priority, or creation time, ascending or descending, with a stable tie-break by creation time. (Origin: corner-checklist "Ordering".)
  - Given two cards with the same due date, When sorted by due date, Then the older card shows first in both directions of repeated sorts.
- **FR4.3** The user shall be able to group the cards within each list under group headings by priority, label or due-date state, or turn grouping off. A card with several labels appears under each of its labels and a card with none appears under "No label". (Origin: corner-checklist "Group totals".)
  - Given grouping by label, When a card has labels "Bug" and "UI", Then it appears under both headings.
- **FR4.4** Filtering, sorting and grouping shall not change the saved card order, and a filter that matches nothing shall show "No matching cards" distinctly from an empty list. (Origin: corner-checklist "Collections and lists"; existing behavior in `kanban-column.tsx`.)
  - Given a filter that matches nothing, When it is cleared, Then every card is back in its saved order.

### FR5 Theme customization (Release 1, Must have; backlog P4)

Source: intent-capture Q3; requirements-analysis Q3 A and Q8 A.

- **FR5.1** The user shall be able to choose light mode, dark mode or the system setting, and the choice shall apply to the whole app and be kept across reloads. (Global; Q8 A)
  - Given dark mode is chosen, When the page is reloaded, Then it opens in dark mode.
- **FR5.2** The user shall be able to choose an accent color from a preset palette that colors buttons and highlights. (Global; Q8 A)
  - Given the accent "green", When chosen, Then primary buttons and highlights use green.
- **FR5.3** The user shall be able to choose each board's background from preset colors and preset gradients only: no image upload and no image by web address. (Per board; requirements-analysis Q3 A, Q8 A)
  - Given two boards, When the user changes one board's background, Then the other board is unchanged.
- **FR5.4** The user shall be able to choose card and list density (compact or comfortable) and corner roundness (square, rounded or very rounded). (Global; Q8 A)
  - Given compact density, When chosen, Then cards and lists use less spacing and the setting is kept after a reload.
- **FR5.5** A theme change shall apply at once without a reload, and a saved theme shall apply on the first paint after a reload, not after a flash of the default theme. (Origin: corner-checklist "Screens and user input" and "First run".)
  - Given a saved dark theme, When the page loads, Then no light-theme flash is visible before dark mode applies.

### FR6 Archive with undo, duplicate card and templates (Release 1, Should have; backlog P5)

Source: market-research Q2 C; scope-document.md.

- **FR6.1** The user shall be able to archive a single card, view archived cards, and restore a card to its list at its earlier position, or to the end of that list when the position no longer exists. When the card's list is itself archived, restoring the card shall tell the user to restore the list first. (Origin: corner-checklist "Identity of things", dangling reference.)
  - Given an archived card, When restored, Then it returns to its list.
- **FR6.2** After a card or list is deleted or archived, the user shall be offered an undo for 10 seconds (assumption A2), and undo shall restore it exactly as it was.
  - Given a card was just deleted, When the user chooses Undo within 10 seconds, Then the card returns with all its fields, labels and checklist.
- **FR6.3** The user shall be able to duplicate a card, which creates a copy in the same list directly after the original, with the title followed by " (copy)", and with description, priority, due date, labels and checklist items copied, and all checklist items unchecked.
  - Given a card "Plan trip", When duplicated, Then "Plan trip (copy)" appears right after it.
- **FR6.4** The user shall be able to save a card as a template and to create a new card from a template, and to delete templates. Templates keep title, description, priority, labels and checklist items, not the due date.
  - Given a template, When the user creates a card from it in a list, Then the card has the template's fields and no due date.

### FR7 Several boards (Release 2, Should have; backlog P6)

Source: market-research Q1 D; scope-document.md; requirements-analysis Q5 A, Q8 A.

- **FR7.1** The user shall be able to create, rename and archive boards, up to the limit in FR1.5.
  - Given 5 boards, When the user creates a sixth, Then it is refused with the limit message.
- **FR7.2** The user shall be able to switch between boards, and the app shall reopen the board that was last open.
  - Given board B was last open, When the page reloads, Then board B opens.
- **FR7.3** Each board shall have its own lists, cards, labels, templates, archive and background, and no change on one board shall appear on another. (Origin: corner-checklist "Identity of things".)
  - Given a label "Bug" on board A, When board B opens, Then board B has no label "Bug" unless it created one.
- **FR7.4** Archiving a board shall archive its lists and cards, and an archived board shall be restorable, and permanent deletion of an archived board shall follow the confirmation rule in FR2.5 (naming the number of lists and cards).
  - Given a board with 2 lists and 6 cards, When the user deletes it permanently, Then the confirmation names 2 lists and 6 cards.

### FR8 Board export and import (Release 2, Must have; backlog P7)

Source: intent-capture Q8; scope-document.md; requirements-analysis Q6 A.

- **FR8.1** The user shall be able to export a board as a single file that contains its lists, cards, labels, checklists, templates, archive and background, and a format version.
  - Given a board, When the user exports it, Then a file downloads and holds all of that board's data.
- **FR8.2** The user shall be able to import such a file, which always adds a new board and never overwrites an existing one. When a board with the same name exists, the new board's name shall be followed by " (imported)". (requirements-analysis Q6 A)
  - Given a board "Work", When the user imports a file for a board named "Work", Then a second board "Work (imported)" appears and "Work" is unchanged.
- **FR8.3** The system shall reject a file that is not a valid board export, or has a newer format version, with a message naming the problem, and shall change nothing (assumption A6). (Origin: corner-checklist "Formats the product parses" and "Hostile input".)
  - Given a file that is not valid, When imported, Then a message explains it and no board is added.
- **FR8.4** An import shall respect the limits in FR1.5 and shall be refused with the limit message when it would exceed them. Imported text shall be shown as plain text, never run as markup. (Origin: corner-checklist "Text", "Markup or control sequences".)
  - Given 5 boards exist, When the user imports a valid file, Then it is refused with the limit message.

### FR9 Keyboard shortcuts and command menu (Release 2, Should have; backlog P8)

Source: market-research Q2 A; scope-document.md; requirements-analysis Q7 A.

- **FR9.1** Pressing Ctrl+K (Cmd+K on Mac) shall open a command menu that lists the available actions, lets the user filter them by typing, and runs the chosen action. Pressing Escape shall close it.
  - Given the board is open, When the user presses Ctrl+K and types "new card", Then the menu lists "New card" and choosing it opens the card creation form.
- **FR9.2** Pressing "?" shall open a list of the keyboard shortcuts. Shortcuts shall cover at least new card, new list, focus the search box, and switch board.
  - Given the board is open and no field is focused, When the user presses "?", Then the shortcut list opens.
- **FR9.3** Single-key shortcuts shall not fire while the user is typing in a field or while a dialog is open. (Origin: corner-checklist "Screens and user input".)
  - Given the user is typing in the search box, When the user types "n", Then the letter is typed and no new card opens.

### FR10 List limits and swimlanes (Release 3, Should have; backlog P9)

Source: market-research Q2 B; scope-document.md.

- **FR10.1** The user shall be able to set an optional card limit on a list. A list that holds more cards than its limit shall be marked in words and color, and moving or adding a card into it shall still be allowed, with a warning. (Warn only, as in the Jira behavior studied.)
  - Given a list limited to 3 with 3 cards, When the user adds a fourth, Then the card is added and the list shows "Over limit: 4 of 3".
- **FR10.2** The user shall be able to turn on swimlanes that group the board into horizontal bands across all lists by priority or label, and to turn them off. A card appears in the band for each of its labels, and cards with none appear under "No label".
  - Given swimlanes by priority, When on, Then each band spans all lists and holds the cards of that priority.

### FR11 Simple rules (Release 3, Should have; backlog P10)

Source: market-research Q2 D; scope-definition Q3 A.

- **FR11.1** The user shall be able to create a rule with one trigger (a card enters a chosen list, or a card's checklist is fully checked) and one action (move the card to a chosen list, add a chosen label, or set a chosen priority), and to name, turn off, turn on and delete rules.
  - Given a rule "when a card enters Completed, add label Done", When a card is moved to Completed, Then it gets the label "Done".
- **FR11.2** Rules shall run only on actions the user takes, and the action of a rule shall not itself trigger any rule, so a rule cannot start a loop. (Origin: corner-checklist "Feedback loop".)
  - Given two rules that move cards between the same two lists, When a card enters the first list, Then it moves once and stops.
- **FR11.3** A rule that refers to a list or label that no longer exists shall be shown as broken and shall do nothing. (Origin: corner-checklist "Dangling reference".)
  - Given a rule that targets an archived list, When it would run, Then it does nothing and shows as broken.

## Non-Functional Requirements

- **NFR1 Persistence and privacy.** All data shall stay in the browser's localStorage; the app shall make no network request that sends board data, and no database, backend or server storage shall be added. Measure: a review of the code finds no data-sending request and no server persistence. (project rule; intent-capture Q8)
- **NFR2 Responsiveness.** With 5 boards and 200 cards in total, adding, moving, filtering and sorting a card shall update the screen within 200 ms on a typical laptop (assumption A3). Measure: a timed test or profile with 200 cards.
- **NFR3 Accessibility.** Every function shall work by keyboard alone, text shall meet WCAG AA contrast (4.5 to 1) in light mode, dark mode and every preset background and accent, and status (overdue, due soon, over limit, label) shall never be shown by color alone. Measure: a keyboard-only run of the success scenarios, and a contrast check of every preset. (requirements-analysis Q7 A)
- **NFR4 Data safety.** No accepted change shall be lost after a reload, a failed save shall never remove earlier data, and a second browser tab shall not silently overwrite the first tab's changes (the tab that saved last wins only for the same item, and the other tab shows the update). Measure: tests for reload, failed save and two-tab updates. (Origin: corner-checklist "Storage and state", "Same user in several tabs".)
- **NFR5 Compatibility.** The app shall work in the current versions of Chrome, Edge and Firefox (assumption A4) and shall work on first run with no saved data. Measure: the success scenarios pass in each browser.

## Constraints

- TypeScript with `strict: true`, internal imports through the `@/` alias, no code comments, and an SSR check before any `window` or `localStorage` use (project rules).
- Prettier formatting and the existing lint and type checks stay in force (team practices).
- Tests are written after each piece works (test-after). Existing and new tests stay green; there is no coverage floor (team practices).
- Prefer well-maintained open-source libraries when they fit (market-research Q3 A); build by hand otherwise.
- Build dependency first: data model before the features that read it (scope-definition Q1 B).
- No hard deadlines (scope-definition Q4 A).

## Success Check

From requirements-analysis Q1 A, the upgrade passes when this run works start to finish with no other tool:

- Given a fresh browser with no data, When the user creates a board, adds and renames lists, adds a card with a label, a checklist and a due date, moves it across lists, filters the board, changes the theme, and reloads the page, Then every step works and the changes (board, lists, card, filter-free view, theme) are all still there.
- Given a browser with old data under `taskflow.tasks.v1`, When the upgraded app loads, Then FR1.2 holds before the run starts.

This run covers FR1 to FR5 (Release 1). The Release 2 and Release 3 features each carry their own acceptance criteria above.

## Assumptions

- **A1** "Due soon" means due today or tomorrow. Rationale: no value was given; a short window suits daily use. Owner: requester. Status: unvalidated.
- **A2** The undo offer lasts 10 seconds. Rationale: a common length for undo prompts. Owner: requester. Status: unvalidated.
- **A3** The 200 ms target and the 200-card size follow requirements-analysis Q5 A. The 200 ms figure is a default, not a stated need. Owner: requester. Status: unvalidated.
- **A4** Chrome, Edge and Firefox are the target browsers. Rationale: no browser list was given. Owner: requester. Status: unvalidated.
- **A5** On first visit, light and dark mode follow the system setting. Rationale: the usual default. Owner: requester. Status: unvalidated.
- **A6** An import with any invalid content is rejected whole. Rationale: simpler and safer than partial imports. Owner: requester. Status: unvalidated.

## Out of Scope

- Accounts, sign-in, server-backed sharing and real-time collaboration (intent-capture Q6 A).
- File attachments and image uploads (intent-capture Q6 B).
- Notifications, emails and calendar sync (intent-capture Q6 C).
- A database, backend API or server storage (project rule).
- Background images of any kind, by upload or by web address (requirements-analysis Q3 A).
- A backup file of the old data before conversion (requirements-analysis Q2: option A chosen, not B).
- Cleanup of legacy CSS, unused Tailwind wiring, the stale README and the 404-line dashboard file. These are technical-debt findings from the code scan, not requested work; the design stage may fold them in where it touches the same files.

## Open Questions

- Whether the board's current behaviors (drag between lists, add, edit, delete, search) must be kept as a requirement was not chosen in requirements-analysis Q1 (option B was not picked). The team testing rule keeps existing tests green, which protects them where tests exist; confirm at the gate if you want it as a standing requirement.
