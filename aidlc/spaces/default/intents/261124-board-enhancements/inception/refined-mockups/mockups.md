# Mockups

Designed from requirements.md (FR1 to FR11, NFR1 to NFR5) and your answers in refined-mockups-questions.md (Q1 settings page, Q2 centred card dialog, Q3 top bar boards menu, Q4 one filter panel). Rough wireframes and a user flow do not exist because Rough Mockups was skipped in this plan; nothing here assumes them. The current screen (dark top bar, coloured board, fixed-width lists, card tiles) is the starting point.

Notation: ASCII only. `[ ]` is a button or control, `(x)` is a selected option, `[x]` a checked box, `...` is more content. Release tags: R1, R2, R3 from scope-document.md.

## Screen Map

| Screen | Release | Requirements |
|--------|---------|--------------|
| S1 Board (populated) | R1 | FR1, FR2, FR3, FR4, FR5.3 |
| S2 Board (empty, loading, error, over limit) | R1, R3 | FR1.3, FR1.4, FR1.5, FR2.6, FR10.1 |
| S3 Card detail dialog | R1 | FR3.1 to FR3.5, FR6.2, FR6.3 |
| S4 Filter panel (filter, sort, group) | R1 | FR4.1 to FR4.4 |
| S5 List menu and delete confirmation | R1 | FR2.2, FR2.4, FR2.5, FR10.1 |
| S6 Settings page | R1 | FR5.1 to FR5.5 |
| S7 Archive | R1, R2 | FR2.4, FR2.5, FR6.1, FR7.4 |
| S8 Boards menu | R2 | FR7.1 to FR7.4 |
| S9 Export and import | R2 | FR8.1 to FR8.4 |
| S10 Command menu and shortcut help | R2 | FR9.1 to FR9.3 |
| S11 Swimlanes and rules | R3 | FR10.2, FR11.1 to FR11.3 |

## S1 Board (populated), Release 1

```
+----------------------------------------------------------------------------------+
| [TF] TaskFlow  [ Work board v ]   Search [______________]   [Filter 2] [New task] (JD) [gear] |
+----------------------------------------------------------------------------------+
| Work board                                          Total 9  To do 4  Doing 3  Done 2 |
|                                                                                  |
| +----------------+  +----------------+  +----------------+  +--------------+     |
| | To do   4  [...]|  | In progress 3 [...]|  | Completed 2 [...]|  | [+ Add a list] |     |
| |                |  |                |  |                |  +--------------+     |
| | +------------+ |  | +------------+ |  | +------------+ |                       |
| | |[Bug][UI]   | |  | |[high]      | |  | |[low]       | |                       |
| | |Fix header  | |  | |Review road.| |  | |Nav spacing | |                       |
| | |= 2 lines.. | |  | |= Align the.| |  | |= Check...  | |                       |
| | |[o] 1/4 Nov20| |  | |[o] 2/3 OVERDUE| |  | |[x] Nov14  | |                       |
| | +------------+ |  | +------------+ |  | +------------+ |                       |
| | [+ Add a card] |  | [+ Add a card] |  | [+ Add a card] |                       |
| +----------------+  +----------------+  +----------------+                       |
+----------------------------------------------------------------------------------+
```

Text fallback: a dark top bar holds the logo, the boards menu, search, the Filter button with a count of active filters, New task, the avatar and a gear icon that opens the settings page. Below it the board title sits left and four count pills right. Lists run left to right in fixed-width columns with a count and a menu; each list ends with "Add a card"; after the last list is an "Add a list" tile. A card shows its labels (name and color), title, a two-line description, a checklist count, and a due-date chip that says "Overdue" or "Due soon" in words.

Card tile detail:

```
+------------------------------+
| [Bug] [UI]            [drag] |
| Fix header spacing           |
| = Check the sidebar and hea..|
| [o] 1/4   (cal) Nov 20  Due soon |
|                         [bin]|
+------------------------------+
```

Text fallback: labels on the first line, then the title, description with a notes icon, then a row with the checklist progress, the due date with its state in words, and a delete icon. The drag handle appears on hover or keyboard focus.

Covers FR2.1, FR3.1 to FR3.3, FR3.5, FR4.4, FR5.3 (the board background is the page color behind the lists).

## S2 Board states, Releases 1 and 3

Empty (no lists), FR2.6:

```
+----------------------------------------------------------+
| top bar (as S1)                                          |
| Work board                                               |
|                                                          |
|            (icon) This board has no lists yet            |
|     Lists are the stages your cards move through.        |
|                  [ Add a list ]                          |
+----------------------------------------------------------+
```

Empty list: the list shows "No cards yet" with the "Add a card" button. A list emptied by a filter shows "No matching cards" (FR4.4), worded differently from "No cards yet".

Loading (existing text kept):

```
+----------------------------------------------------------+
| top bar (as S1)                                          |
|  Loading your tasks...    (three grey list outlines)     |
+----------------------------------------------------------+
```

Storage error, FR1.3 and FR1.4:

```
+----------------------------------------------------------+
| [!] Your saved data could not be read. Nothing was       |
|     changed. [ Download a copy ] [ Learn what to do ]    |
+----------------------------------------------------------+
| board shows read-only, with "Add a card" disabled        |
+----------------------------------------------------------+
```

A failed save shows a banner "Your last change was not saved because browser storage is full. Earlier data is safe." with [Dismiss]. Both banners use an icon and words, not color alone.

Near and at a limit, FR1.5: at 90% a banner reads "You have used 9 of 10 lists on this board". At the limit, the "Add a list" tile is disabled and shows "List limit reached (10)".

Over a list limit, R3, FR10.1:

```
| In progress  4/3  [OVER LIMIT] [...]|
```

The list header shows "4/3" and the words "Over limit". Adding and moving cards still work.

## S3 Card detail dialog, Release 1

```
+--------------------------------------------------------------+
| Fix header spacing                                    [ X ]  |
| in list: To do                                               |
+--------------------------------------------------------------+
| Labels   [Bug x] [UI x] [+ Add label v]                      |
| Priority [ Medium v ]      Due date [ 2026-11-20 ] Due soon  |
| Description                                                  |
| [ Check the sidebar and header at small breakpoints.      ]  |
|                                                              |
| Checklist: Release steps                  1 of 4 done        |
| [x] Update the layout                                        |
| [ ] Test on mobile                                           |
| [ ] Test in dark mode                                        |
| [ ] Merge                                                    |
| [ Add an item ]                         [ Add a checklist ]  |
+--------------------------------------------------------------+
| [ Duplicate ] [ Save as template ] [ Archive ] [ Delete ]    |
|                                        [ Cancel ] [ Save ]   |
+--------------------------------------------------------------+
```

Text fallback: a centred dialog titled with the card title; below it the list name; then labels, priority and due date with its state in words, description, checklists with progress, then card actions, and Cancel and Save. Title length is limited to 100 characters and description to 500, as today.

States: invalid title (blank) shows "Add a title to save this card" under the field and keeps everything typed (FR3.4); a card in an archived list shows "Restore the list first" instead of Restore (FR6.1).

Covers FR3.1 to FR3.5, FR6.2 to FR6.4.

## S4 Filter panel, Release 1

```
+----------------------------------+
| Filters                  [Clear all] |
| Label     [ ] Bug  [ ] UI  [ ] Docs  |
| Priority  [ ] High [ ] Medium [ ] Low|
| Due       [ ] Overdue [ ] Due soon   |
| ------------------------------------ |
| Sort lists by   ( ) Saved order      |
|                 ( ) Due date  ( ) Priority  ( ) Created |
|                 Direction (x) Up ( ) Down |
| Group lists by  (x) Off ( ) Priority |
|                 ( ) Label ( ) Due state |
|                              [ Done ]    |
+----------------------------------+
```

Text fallback: one panel opened from the Filter button holds filters (label, priority, due-date state), a sort choice with direction, and a group choice. The search box stays in the top bar. The Filter button shows the number of active filters, for example "Filter 2". While a sort or group is on, dragging cards inside a list is disabled and the list shows "Sorted by due date: drag is off". (Design answer to a drag-versus-sort question from the review of the requirements; confirm at the gate.)

Covers FR4.1 to FR4.4.

## S5 List menu and delete confirmation, Release 1

```
+-----------------------+
| Rename list           |
| Set card limit...  R3 |
| Move left / Move right|
| Archive list          |
+-----------------------+
```

Archiving shows an undo bar: "List 'Review' and its 4 cards archived. [Undo]" for 10 seconds (FR6.2).

Permanent delete is only offered from the Archive screen (S7) and asks:

```
+--------------------------------------------+
| Delete 'Review' permanently?               |
| This deletes the list and its 4 cards.     |
| This cannot be undone.                     |
|                  [ Cancel ] [ Delete 4 cards ] |
+--------------------------------------------+
```

Covers FR2.2 to FR2.5, FR6.2, FR10.1.

## S6 Settings page, Release 1

A separate route reached from the gear icon, with a "Back to board" link at the top (Q1 C).

```
+------------------------------------------------------------------+
| [< Back to board]   Settings                                      |
+------------------------------------------------------------------+
| Appearance                                  | Preview             |
|  Mode      (x) System ( ) Light ( ) Dark    | +-----------------+ |
|  Accent    (o)(o)(o)(o)(o)(o)  Blue selected| | list            | |
|  Density   (x) Comfortable ( ) Compact      | | [card] [card]   | |
|  Corners   ( ) Square (x) Rounded ( ) Very  | +-----------------+ |
|                                             |                     |
| Board background (for 'Work board')         |                     |
|  [c][c][c][c][c][c][c][c]  8 colors/gradients|                    |
|  Selected: Ocean                            |                     |
+------------------------------------------------------------------+
```

Text fallback: the page has an Appearance group (mode, accent, density, corners; all global) and a Board background group for the open board (per board). A live preview of a list with two cards sits to the right, because the board is not visible on a separate page. Every choice applies at once and is kept after a reload (FR5.5). On first visit the mode follows the system (assumption A5).

Covers FR5.1 to FR5.5.

## S7 Archive, Releases 1 and 2

```
+--------------------------------------------------------------+
| [< Back to board]  Archive                                    |
|  [ Lists ] [ Cards ] [ Boards (R2) ]                          |
+--------------------------------------------------------------+
| Review   (4 cards)      [ Restore ] [ Delete permanently ]    |
| Old plan (0 cards)      [ Restore ] [ Delete permanently ]    |
+--------------------------------------------------------------+
```

Empty tab text: "Nothing archived here yet". Cards tab rows show the card title, its list, and Restore; a card whose list is archived shows "Restore the list first". Covers FR2.4, FR2.5, FR6.1, FR7.4.

## S8 Boards menu, Release 2

```
+--------------------------+
| (x) Work board           |
| ( ) Home                 |
| ( ) Side project         |
| ------------------------ |
| + New board   (3 of 5)   |
| Rename this board        |
| Export this board...     |
| Import a board...        |
| Archive this board       |
| Archive                  |
+--------------------------+
```

Opened from the board name in the top bar. At 5 boards "New board" is disabled and says "Board limit reached (5)". Covers FR7.1 to FR7.4, FR8.

## S9 Export and import, Release 2

Export downloads a file named from the board. Import opens a file picker, then:

```
+--------------------------------------------+
| Import 'Work.board.json'?                  |
| Adds a new board 'Work (imported)'.        |
| Your existing boards are not changed.      |
|                       [ Cancel ] [ Import ]|
+--------------------------------------------+
```

Error text, FR8.3 and FR8.4: "This file is not a valid TaskFlow board, so nothing was added." or "This file was made by a newer version." or "Importing would pass the limit of 5 boards." Imported text is shown as plain text.

## S10 Command menu and shortcut help, Release 2

```
+-----------------------------------------+
| > new car_                              |
|  New card                      N        |
|  New list                      L        |
|  Go to search                  /        |
|  Switch board...               B        |
+-----------------------------------------+
```

Opened with Ctrl+K (Cmd+K on Mac), filtered as you type, Enter runs, Escape closes. "?" opens a shortcut list in a dialog. Single-key shortcuts are off while typing in a field or while a dialog is open (FR9.3). Covers FR9.1 to FR9.3.

## S11 Swimlanes and rules, Release 3

Swimlanes (FR10.2), bands across all lists:

```
| High     | To do: [card] | In progress: [card] | Completed: -   |
| Medium   | To do: [card] | In progress: -      | Completed: [card] |
| No label | ...                                              |
```

Rules dialog (FR11): a list of rules with a switch each; "New rule" asks "When [a card enters v list] do [move to v list / add label / set priority]". A broken rule shows "Broken: its list was archived" in words and does nothing (FR11.3). Covers FR10.2, FR11.1 to FR11.3.

## Responsive Behavior

Breakpoints follow the current board: lists keep a fixed width and the board scrolls sideways. Mobile (below 768px): the top bar keeps logo, boards menu, and a menu button that holds search, Filter, New task and settings; lists show at 85% width with the next list peeking; the card dialog becomes a full-screen sheet. Tablet (768 to 1024px): the top bar shows everything; lists at the fixed width. Desktop (above 1024px): as drawn. Touch targets are at least 44 by 44 pixels on mobile.

## Edge Cases Designed For

- Very long list or card titles wrap or truncate with the full text in the dialog; unbroken words wrap inside the tile (FR3.5).
- Zero, one and 200 cards: counts show singular and plural correctly; the list scrolls inside itself.
- A label with the same name as another is allowed but shows its color swatch and name in the picker, so they can be told apart.
- Limits: the board shows the limit banner instead of silently refusing (FR1.5).

## Assumptions & Open Questions

- Drag inside a list is disabled while a sort or group is on (S4). This is a design choice made here, not an answer you gave; confirm at the gate.
- A Release 3 rules dialog and swimlane view are drawn at low detail because their triggers and actions were assumptions in requirements.md.
