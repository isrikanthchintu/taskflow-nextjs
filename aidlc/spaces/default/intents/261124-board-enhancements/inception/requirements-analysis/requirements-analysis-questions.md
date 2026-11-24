# Requirements Analysis Questions

Context: the scope (scope-document.md) fixes ten features in three releases, and the code scan (architecture.md) shows that cards have no position field and saved data is read without validation. These questions settle the facts the requirements cannot assume.

## Q1. [Product owner] How should we check that you can "run your day without another tool"?

Context: the success check from Intent Capture has no pass or fail test yet. A short list of daily scenarios turns it into one, and every requirement can then be tested against it.

A. Use these scenarios as the check: create a board, add and rename lists, add a card with a label, checklist and due date, move it across lists, filter the board, change the theme and reload the page to see it kept
B. Use the scenarios in A, and also require that every feature the board has today (drag between lists, add, edit, delete, search) keeps working
C. Not yet defined
X. Other (please specify)

[Answer]: A. Use these scenarios as the check (create a board, add and rename lists, add a card with a label, checklist and due date, move it across lists, filter the board, change the theme and reload the page to see it kept)

## Q2. [Product owner] What data already in your browser must survive the upgrade?

Context: today all cards are saved under one browser storage key (`taskflow.tasks.v1`). Custom lists and several boards change how they are stored.

A. Convert it automatically: existing cards move into a default board with the three current lists, order and fields kept
B. Convert it automatically, and also save a backup file of the old data before the first conversion
C. Start fresh; old cards need not be kept
X. Other (please specify)

[Answer]: A. Convert it automatically: existing cards move into a default board with the three current lists, order and fields kept

## Q3. [Designer] How far should board backgrounds go, given that image uploads are out of scope?

Context: attachments and image uploads were left out. Browser storage is small (about 5 MB), so large images would risk losing your boards.

A. Preset colors and gradients only
B. Presets, plus a picture chosen by web address (nothing is uploaded or stored)
C. Presets, plus a small picture file saved in the browser, with a size limit
X. Other (please specify)

[Answer]: A. Preset colors and gradients only

## Q4. [Product owner] What should happen to the cards when you delete a list?

Context: this is the destructive case the board must handle safely; Release 1 also adds archive with undo.

A. Archive the list and its cards together, so they can be restored
B. Ask you to move or archive the cards first, then delete the empty list
C. Delete the list and its cards after a confirmation that names how many cards are affected
X. Other (please specify)

[Answer]: A. Archive the list and its cards together, so they can be restored

## Q5. [Product owner] How large a board should it handle comfortably?

Context: browser storage is limited, and the size drives the performance and storage requirements.

A. Personal size: up to 5 boards, 10 lists per board, and 200 cards in total
B. Larger: up to 20 boards, 30 lists per board, and 1,000 cards in total
C. Not yet defined; plan for the personal size and warn before storage runs out
X. Other (please specify)

[Answer]: A. Personal size: up to 5 boards, 10 lists per board, and 200 cards in total

## Q6. [Product owner] When you import a board file, what should happen if a board with the same name already exists?

Context: import is how a small team shares boards, so it must never silently destroy anyone's work.

A. Always add it as a new board, never overwrite
B. Replace the existing board, after a confirmation
C. Ask each time: add as new, or replace
X. Other (please specify)

[Answer]: A. Always add it as a new board, never overwrite

## Q7. [Designer] Should the board be fully usable by keyboard and readable in every theme?

Context: Release 2 adds keyboard shortcuts, and dark mode and custom backgrounds can make text hard to read.

A. Yes: every function works by keyboard, text meets WCAG AA contrast in light and dark mode, and status is never shown by color alone
B. Keyboard operation yes; contrast checked for the built-in themes only
C. Best effort; no formal target
X. Other (please specify)

[Answer]: A. Yes: every function works by keyboard, text meets WCAG AA contrast in light and dark mode, and status is never shown by color alone

## Q8. [Designer] Which theme settings should belong to each board, and which should be global?

Context: Release 2 adds several boards; the theme choices from Intent Capture are background, light and dark mode, accent color, and card and list look.

A. Background per board; light and dark mode, accent color and card and list look global
B. Everything per board
C. Everything global
X. Other (please specify)

[Answer]: A. Background per board; light and dark mode, accent color and card and list look global
