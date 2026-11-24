# Refined Mockups Questions

Context: Rough Mockups and User Stories were skipped in this plan, so the design works from requirements.md and the screens the board has today (a dark top bar, a coloured board, fixed-width lists, cards with a label, title, description line, due date and controls). Wireframes and a user flow were not produced, so none is assumed. The app keeps using Material UI and its existing theme file.

## Q1. [Designer] Where should theme settings live?

Context: FR5 adds light and dark mode, accent color, density, corner roundness, and a per-board background. They need one findable home.

A. A settings panel that slides in from the right, opened from a gear icon in the top bar, with the background picker for the open board at the top
B. A "Theme" menu in the top bar with the choices listed in the menu itself
C. A separate settings page
X. Other (please specify)

[Answer]: C. A separate settings page

## Q2. [Designer] How should a card open for editing?

Context: FR3.4 replaces the current edit dialog with a detail view that holds title, description, priority, due date, labels and checklists. The detail view is larger than the old dialog.

A. A centred dialog over the board, like Trello
B. A panel on the right side of the screen, so the board stays visible beside it
C. A full page
X. Other (please specify)

[Answer]: A. A centred dialog over the board, like Trello

## Q3. [Designer] How should you switch between boards and reach the archive?

Context: FR7 adds several boards (up to 5), and FR2.4 and FR6.1 add an archive for lists, cards and boards. Today the screen has no sidebar.

A. A boards menu in the top bar (shows the open board's name, lists the others, and has "Archive" and "New board"), no sidebar
B. A collapsible left sidebar listing the boards, with "Archive" at the bottom
C. Tabs along the top for each board
X. Other (please specify)

[Answer]: A. A boards menu in the top bar (shows the open board's name, lists the others, and has "Archive" and "New board"), no sidebar

## Q4. [Designer] Where should filter, sort and group controls go?

Context: FR4 adds filters by label, priority and due state, sort within lists, and group-by within lists. Today only a search box exists, in the top bar.

A. A toolbar row under the board title, with a Filter button, a Sort menu, a Group menu, and chips showing the active filters
B. A single Filter button that opens a panel holding all of it
C. Inside the command menu only
X. Other (please specify)

[Answer]: B. A single Filter button that opens a panel holding all of it
