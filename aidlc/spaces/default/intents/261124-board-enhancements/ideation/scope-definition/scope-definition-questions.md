# Scope Definition Questions

Context: Market Research ranked 10 candidate features and you picked every core and power feature (Q1 and Q2 of market-research-questions.md). Intent Capture fixed what stays out: accounts and real-time sharing, attachments, and notifications (Q6 of intent-capture-questions.md). These questions decide order and what can wait.

## Q1. [Product owner] In what order should the work be sequenced?

Context: some features depend on others (several boards needs a storage redesign; export/import depends on the board's data shape), so order affects risk and rework.

A. Value first: the features you would use every day come first
B. Dependency first: build the foundations (storage, lists, card model) before everything else
C. Risk first: tackle the hardest pieces (several boards, rules) early
D. Not yet defined
X. Other (please specify)

[Answer]: B. Dependency first: build the foundations (storage, lists, card model) before everything else

## Q2. [Product owner] I propose three releases. Do you accept this split?

Context: the proposal keeps the first release usable by itself and puts the heaviest items last.

Release 1: custom lists, richer cards (labels, checklists, due-date states, card detail), filters/sort/group-by, theme customization, archive with undo, duplicate card and card templates.
Release 2: several boards, board export and import, keyboard shortcuts and command menu.
Release 3: list limits and swimlanes, simple rules.

A. Accept the three releases as proposed
B. Accept, but move board export and import into Release 1
C. Accept, but move several boards into Release 1
D. No split: build everything as one release
X. Other (please specify)

[Answer]: A. Accept the three releases as proposed

## Q3. [Product owner] How important are simple rules (automatic moving or labelling of cards)?

Context: rules are the hardest item in a browser-only app and were the highest-effort item in the market research.

A. Should have: keep in Release 3
B. Could have: build only if time allows after everything else
C. Won't have this time: leave out of this scope
D. Not yet defined
X. Other (please specify)

[Answer]: A. Should have: keep in Release 3

## Q4. [Product owner] Is there a date or event that a particular feature must be ready for?

Context: a hard deadline would change the sequencing.

A. No deadline
B. Yes; I will give the date and the feature
C. Not yet defined
X. Other (please specify)

[Answer]: A. No deadline
