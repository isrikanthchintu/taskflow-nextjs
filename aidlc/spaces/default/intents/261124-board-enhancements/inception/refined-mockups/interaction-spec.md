# Interaction Specification

Component-level specifications for the screens in mockups.md, in the format of the component specification template. Requirement IDs come from requirements.md. Existing components are marked "existing" and keep their current behavior except where stated.

## Global Interaction Rules

- Every function is reachable by keyboard (NFR3). Tab order follows reading order: top bar, board toolbar, lists left to right, cards top to bottom, then the "Add a list" tile.
- Destructive actions use undo for 10 seconds (FR6.2) except permanent deletion, which uses a confirmation that names the number of lists or cards affected (FR2.5, FR7.4).
- Animations last under 300 ms and are turned off when the user asks the system for reduced motion.
- Status (overdue, due soon, over limit, label) is always shown with words or an icon beside color (NFR3).
- A failed save or unreadable data shows a banner with words and an icon, and the board stays safe (FR1.3, FR1.4).
- Text in cards, titles and imports is shown as plain text and never run as markup (FR8.4).

## TopBar (existing, extended)

| Field | Value |
|---|---|
| Component | TopBar |
| Description | Logo, boards menu, search, Filter button, New task, settings gear, avatar |
| Category | navigation |

### States

| State | Description | Trigger |
|---|---|---|
| default | All controls shown | page load |
| filters active | Filter button shows the count, for example "Filter 2" | any filter on |
| storage error | Banner appears under the bar | FR1.3 or FR1.4 |
| compact | Controls move into a menu button | width below 768px |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| boardName | string | yes | - | Shown in the boards menu button |
| activeFilterCount | number | yes | 0 | Number shown on the Filter button |
| query | string | yes | "" | Search text |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Logo, boards menu and a menu button holding search, Filter, New task, settings |
| tablet (768-1024px) | Search narrows; all controls shown |
| desktop (>1024px) | As drawn in S1 |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | banner landmark with a navigation group |
| Keyboard interaction | Tab through controls; Enter or Space activates; "/" focuses search (R2) |
| Label / aria-label | Search keeps the label "Search tasks"; gear is "Settings"; Filter is "Filters, 2 active" |
| Contrast ratio | WCAG AA (4.5:1 text, 3:1 UI components) over the board background |
| Screen reader | Active filter count is part of the Filter button's name |
| Focus management | Closing a menu returns focus to its button |

## ListColumn (existing, extended)

| Field | Value |
|---|---|
| Component | ListColumn |
| Description | One list with its header, cards and "Add a card" |
| Category | layout |

### States

| State | Description | Trigger |
|---|---|---|
| default | Cards shown in saved order | load |
| drop target | Outline while a card is dragged over | drag over |
| empty | "No cards yet" | no cards |
| filtered empty | "No matching cards" | filter hides all |
| over limit | Header shows "4/3" and "Over limit" | FR10.1 |
| sorted or grouped | Cards sorted or under group headings; drag off | FR4.2, FR4.3 |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| list | object | yes | - | Id, name, card ids, optional limit |
| cards | array | yes | [] | Cards after filter, sort and group |
| onAddCard | function | no | - | Opens the card dialog for this list |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | 85% of the screen wide, next list peeks |
| tablet (768-1024px) | Fixed width, sideways scroll |
| desktop (>1024px) | Fixed width, sideways scroll |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | region labelled "<list name> list" |
| Keyboard interaction | Enter on the header menu opens it; arrow keys move between menu items; list reorder by keyboard through the menu items "Move left" and "Move right" and by drag |
| Label / aria-label | Header menu is "List actions for <name>" |
| Contrast ratio | WCAG AA over list background in every theme |
| Screen reader | "Over limit, 4 of 3 cards" is announced when the count passes the limit |
| Focus management | After "Add a card" saves, focus returns to the button |

## CardTile (existing, extended)

| Field | Value |
|---|---|
| Component | CardTile |
| Description | A card on the board with labels, title, description line, checklist count, due-date chip |
| Category | display |

### States

| State | Description | Trigger |
|---|---|---|
| default | As drawn in S1 | load |
| hover or focus | Drag handle visible, outline | pointer or Tab |
| dragging | Faded with a floating copy | drag start |
| overdue | Chip text "Overdue" with an icon | due date before today and not in the done list (FR3.3) |
| due soon | Chip text "Due soon" with an icon | due today or tomorrow |
| done | Title struck through | in the done list |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| card | object | yes | - | Fields from requirements.md FR3 |
| onOpen | function | yes | - | Opens the card dialog |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Controls stay at least 44 by 44 pixels; drag handle always visible |
| tablet (768-1024px) | As desktop |
| desktop (>1024px) | Handle shows on hover or focus |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | article, with the drag handle as a button |
| Keyboard interaction | Enter opens the card; the drag handle moves it with Space then arrow keys then Space; existing status and delete buttons keep their names |
| Label / aria-label | "Drag <title>", "Mark <title> as <next status>", "Delete <title>" (existing) |
| Contrast ratio | WCAG AA for text and label chips in light and dark mode |
| Screen reader | Reads title, labels by name, checklist as "1 of 4", due state in words |
| Focus management | After delete, focus moves to the next card or the list header |

## CardDialog (replaces the edit dialog)

| Field | Value |
|---|---|
| Component | CardDialog |
| Description | Centred dialog to view and edit one card in full |
| Category | feedback |

### States

| State | Description | Trigger |
|---|---|---|
| default | Fields filled | open |
| create | Empty fields, list chosen by the button used | "Add a card" or New task |
| invalid | Blank title message under the field, typed data kept | Save with blank title |
| list archived | Restore replaced by "Restore the list first" | FR6.1 |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| card | object or null | yes | null | Null means create |
| listId | string | yes | - | Where a new card is added |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Full-screen sheet with a sticky Save bar |
| tablet (768-1024px) | Centred, up to 640px wide |
| desktop (>1024px) | Centred, up to 640px wide |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | dialog, labelled by the title heading |
| Keyboard interaction | Focus stays inside; Escape closes without saving; Enter in a single-line field does not submit the checklist item by accident |
| Label / aria-label | Every field has a visible label above it |
| Contrast ratio | WCAG AA |
| Screen reader | Checklist progress and due state are announced when they change |
| Focus management | Opens on the title field; closing returns focus to the card tile |

## FilterPanel

| Field | Value |
|---|---|
| Component | FilterPanel |
| Description | One panel for filter, sort and group |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| default | Nothing selected, saved order, grouping off | open |
| active | Selections shown; the Filter button shows the count | any choice |
| no labels | The label group says "No labels yet. Add one in a card." | board has no labels |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| labels | array | yes | [] | Board labels |
| value | object | yes | - | Filters, sort field and direction, group field |
| onChange | function | yes | - | Applies at once |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Bottom sheet |
| tablet (768-1024px) | Popover under the button |
| desktop (>1024px) | Popover under the button |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | dialog (non-modal popover) with grouped checkboxes and radio groups, each in a fieldset with a legend |
| Keyboard interaction | Tab through groups; Space toggles; arrows move in radio groups; Escape closes |
| Label / aria-label | "Filters" |
| Contrast ratio | WCAG AA |
| Screen reader | "3 cards match" is announced after a change |
| Focus management | Returns to the Filter button on close |

## SettingsPage

| Field | Value |
|---|---|
| Component | SettingsPage |
| Description | Appearance settings and the open board's background |
| Category | layout |

### States

| State | Description | Trigger |
|---|---|---|
| default | Current choices selected | open |
| saved | Choices apply at once and persist | any change |
| storage error | Banner says the choice could not be saved | FR1.4 |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| mode | "system" or "light" or "dark" | yes | "system" | Global |
| accent | string | yes | preset 1 | Global |
| density | "comfortable" or "compact" | yes | "comfortable" | Global |
| corners | "square" or "rounded" or "very-rounded" | yes | "rounded" | Global |
| boardBackground | string | yes | preset 1 | Per board |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Single column; preview above the groups |
| tablet (768-1024px) | Two columns |
| desktop (>1024px) | Two columns, preview on the right |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | main landmark; each group is a fieldset with a legend; color choices are a radio group |
| Keyboard interaction | Arrow keys move within a group; Tab between groups |
| Label / aria-label | Each color swatch is named ("Ocean", "Forest"), never by color alone |
| Contrast ratio | Every accent and background must keep WCAG AA text contrast (see accessibility-checklist.md) |
| Screen reader | "Dark mode selected" announced |
| Focus management | "Back to board" is the first focusable element and returns to the board with its state kept |

## UndoSnackbar, ConfirmDialog, Banner

| Component | Behavior |
|---|---|
| UndoSnackbar | Shows for 10 seconds with an Undo button; ends on page reload or board switch; has `aria-live="polite"` (FR6.2) |
| ConfirmDialog | Names what will be deleted and the count; default focus on Cancel; Escape cancels (FR2.5, FR7.4) |
| Banner | Icon plus words; "Dismiss" button; role alert for save failures, status for limit notices (FR1.3 to FR1.5) |

## BoardsMenu, ArchiveView, ImportExportDialog (Release 2)

| Component | Behavior |
|---|---|
| BoardsMenu | Menu button showing the board name; radio items for boards; actions New, Rename, Export, Import, Archive board, Archive; "New board" disabled at the limit with the reason in text (FR7, FR8) |
| ArchiveView | Route with Lists, Cards and Boards tabs; Restore and Delete permanently per row; empty tab text "Nothing archived here yet" (FR2.4, FR6.1, FR7.4) |
| ImportExportDialog | Confirms the new board name and that nothing existing changes; errors in plain words (FR8) |

## CommandMenu and ShortcutHelp (Release 2)

| Component | Behavior |
|---|---|
| CommandMenu | Opens with Ctrl+K or Cmd+K; text filters actions; Enter runs; Escape closes; focus returns to where it was (FR9.1) |
| ShortcutHelp | Opens with "?" when no field is focused; lists all shortcuts; Escape closes (FR9.2) |
| Shortcuts | N new card, L new list, "/" focus search, B switch board; off while typing or while a dialog is open (FR9.3) |

## SwimlaneView and RulesDialog (Release 3)

| Component | Behavior |
|---|---|
| SwimlaneView | Bands by priority or label across all lists; a card with several labels shows in each band; off by default (FR10.2) |
| RulesDialog | Rule list with a switch each; "New rule" form: when [a card enters a list, or a checklist is fully checked] do [move to a list, add a label, set a priority]; a broken rule is marked in words and does nothing; a rule's action never triggers another rule (FR11.1 to FR11.3) |

## Key User Flows

Flow: First run after the upgrade. Persona: the requester. Trigger: the page loads with old data. Steps: 1. Loading state -> none -> the board appears with a default board holding the old cards in the three lists (FR1.2). Success outcome: every old card is where it was. Error paths: data unreadable -> storage error banner -> the user downloads a copy and the data is left untouched (FR1.3).

Flow: Run a day on the board (success check). Steps: 1. Boards menu -> New board -> a board with a default background. 2. Add a list -> type a name -> the list appears. 3. Add a card -> dialog opens -> add a label, a checklist item and a due date -> Save. 4. Drag the card to another list. 5. Filter button -> choose a label -> the board narrows. 6. Gear -> Settings page -> choose dark mode -> Back to board. 7. Reload -> everything is still there (FR1 to FR5). Error paths: storage full -> banner -> earlier data intact (FR1.4).

## Assumptions & Open Questions

None.
