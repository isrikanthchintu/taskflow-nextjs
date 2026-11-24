# Accessibility Checklist

Target: WCAG 2.1 AA, as chosen in requirements-analysis Q7 A and required by NFR3 in requirements.md. Each item is checked at build and test time; none is claimed as passed yet. Mockups and component names refer to mockups.md and interaction-spec.md.

## Perceivable

- [ ] Text contrast is at least 4.5 to 1 and large text at least 3 to 1 in light mode, dark mode, all six accents and all eight board backgrounds (NFR3).
- [ ] UI components (borders of inputs, focus rings, chips) are at least 3 to 1 against their surroundings.
- [ ] No status uses color alone: label chips show their name, due state shows "Overdue" or "Due soon", over limit shows words and an icon, banners have an icon and words (FR3.1, FR3.3, FR10.1, FR1.3 to FR1.5).
- [ ] Every color swatch (accent, board background, label color) has a text name.
- [ ] Icon-only buttons (gear, drag handle, delete, close) have an accessible name.
- [ ] Layout holds at 200% zoom and at 400% zoom without losing content.

## Operable

- [ ] Every function works by keyboard alone: add and rename lists, reorder lists, add and edit cards, checklists, move cards, filters, settings, archive, import and export, command menu (NFR3, FR2, FR3, FR4, FR5, FR7 to FR9).
- [ ] A visible focus indicator at least 2 px and 3 to 1 contrast is on every interactive element.
- [ ] Tab order follows reading order and there are no keyboard traps; dialogs trap focus only while open and return it on close.
- [ ] A skip link to the board is the first focusable element.
- [ ] Drag has a keyboard alternative on cards (existing keyboard sensor) and on lists (Move left and Move right in the list menu).
- [ ] Single-key shortcuts do not fire while typing in a field or while a dialog is open (FR9.3).
- [ ] The undo offer lasts 10 seconds and is reachable by keyboard; a user who needs more time can restore from the Archive (FR6.2, FR6.1).
- [ ] Touch targets are at least 44 by 44 pixels on mobile.
- [ ] Animations are under 300 ms and are disabled when the system asks for reduced motion.

## Understandable

- [ ] The page language is declared.
- [ ] Every field has a visible label above it, not only a placeholder.
- [ ] Errors say what went wrong and how to fix it, in text: blank title, limit reached, invalid import file, storage full (FR1.4, FR1.5, FR3.4, FR8.3).
- [ ] Destructive actions confirm and name the count, or offer undo (FR2.5, FR6.2, FR7.4).
- [ ] Settings changes do not move focus or change context unexpectedly.

## Robust

- [ ] Native elements are used first (button, input, fieldset, dialog); ARIA is added only where needed.
- [ ] Dialogs have `role="dialog"` and a label; lists are `region`s with a label; the settings page has a `main` landmark.
- [ ] Heading levels are in order: page title as the first heading, list titles below it.
- [ ] Live regions announce undo, counts after filtering ("3 cards match"), checklist progress, and over-limit changes.
- [ ] Imported and typed text is shown as plain text and never run as markup (FR8.4).

## How It Is Tested

1. Automated scan with an accessibility checker on every screen in mockups.md.
2. A keyboard-only run of the success scenario (create board, lists, card, move, filter, theme, reload).
3. A screen reader pass on the card dialog, filter panel and settings page.
4. A contrast check of every accent, background and mode pair from design-system-mapping.md.
5. Zoom check at 200% and 400%, and a reduced-motion check.

## Assumptions & Open Questions

None.
