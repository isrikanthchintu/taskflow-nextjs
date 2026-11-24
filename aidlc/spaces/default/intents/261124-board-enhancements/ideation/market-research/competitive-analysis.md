# Competitive Analysis

This analysis answers intent-statement.md: a Trello-style board that becomes a daily-use task manager, stays browser-only with export/import, and studies Trello, Notion, Linear, Asana, Jira and GitHub Projects before proposing a ranked shortlist (Q1, Q4, Q8 of intent capture). Findings come from public documentation and review pages found on 2026-11-24; anything not confirmed there is labelled hypothesis.

## Products Studied

| Product | Type | Why it is relevant |
|---------|------|--------------------|
| Trello | Direct: Kanban boards | The model for the current board |
| Notion | Indirect: database with a board view | Strong filter, sort and group on a board |
| Linear | Indirect: issue tracker | Keyboard-first speed |
| Asana | Indirect: work management with a board view | Sections as columns, subtasks, rules |
| Jira | Indirect: Kanban for software teams | Swimlanes, list limits, quick filters |
| GitHub Projects | Indirect: project boards on issues | Custom fields, grouping, sorting |

## Evidence by Product

| Product | What the sources confirm | Source |
|---------|--------------------------|--------|
| Trello | Boards hold lists of cards; cards carry description, attachments, due dates, checklists, labels, members and comments; checklists show a progress bar; custom fields (checkbox, date, dropdown, number, text); Butler rule-based automation on all plans with a monthly run cap; Power-Ups extend the board | [ClickUp review](https://clickup.com/learn/topic/project-management/tools/trello/), [Atlassian Butler post](https://www.atlassian.com/blog/trello/butler-power-up-trello-automation) |
| Notion | Board view groups cards by a property, adds sub-groups, lets you choose which properties show on the card, supports multiple filters with AND/OR logic and sorts, and saves filters and sorts for everyone or for you only | [Notion board view](https://Notion.com/help/boards), [Notion views, filters, sorts and groups](https://notion.com/help/views-filters-and-sorts) |
| Linear | A command menu opens with Ctrl+K (Cmd+K on Mac) and ranks commands by context; pressing ? opens the shortcut help for the current view | [Linear command menu changelog](https://linear.app/changelog/2019-12-18-new-command-menu), [Linear keyboard shortcuts help](https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help) |
| Asana | Sections become board columns; custom fields show on cards; subtasks show a count on the card; rules trigger actions on a board | [Asana board view](https://help.asana.com/s/article/board-view), [Asana custom fields on boards](https://asana.com/inside-asana/asana-boards-view-custom-fields-comment-only) |
| Jira | Kanban swimlanes group cards (assignee, epic, query); limits per column only warn when exceeded; quick filters such as Only My Issues; separate Kanban backlog | [Atlassian Kanban with Jira](https://www.atlassian.com/agile/tutorials/how-to-do-kanban-with-jira-software), [Atlassian Jira boards](https://www.atlassian.com/software/jira/guides/boards) |
| GitHub Projects | Board columns come from a single-select or iteration field; group by creates horizontal sections; boards hide columns that a filter empties; sort by a primary and secondary field; up to 50 fields | [GitHub board layout docs](https://docs.github.com/en/enterprise-server@3.19/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout) |

## Feature Comparison Matrix

Rating: Strong (documented and central), Adequate (documented), Absent (not found in the sources above), Unverified (hypothesis; not confirmed in this research).

| Capability | Current board | Trello | Notion | Linear | Asana | Jira | GitHub Projects |
|------------|---------------|--------|--------|--------|-------|------|-----------------|
| Custom lists (add, rename, reorder, archive) | Absent (three fixed lists) | Strong | Adequate | Unverified | Strong | Adequate | Adequate |
| Labels | Priority label only | Strong | Adequate | Unverified | Adequate | Unverified | Adequate |
| Checklists with progress | Absent | Strong | Unverified | Unverified | Adequate (subtasks) | Unverified | Unverified |
| Filters, sort, group-by | Search only | Unverified | Strong | Adequate | Adequate | Strong (quick filters) | Strong |
| Several boards | Absent | Strong | Adequate | Unverified | Adequate | Adequate | Adequate |
| Keyboard shortcuts and command menu | Absent | Unverified | Unverified | Strong | Unverified | Unverified | Adequate |
| List limits and swimlanes | Absent | Unverified | Adequate (sub-groups) | Unverified | Adequate (subgroups) | Strong | Adequate (group by) |
| Duplicate, templates, archive with undo | Absent (delete only) | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |
| Simple rules and automation | Absent | Strong (Butler) | Unverified | Unverified | Adequate (rules) | Unverified | Unverified |
| Theme and board background | Absent | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified |

Existing-board ratings come from the repository's own component files (`task-dashboard.tsx`, `kanban-board.tsx`, `task-card.tsx`) and the earlier intent's request that built the board.

## Table Stakes and Differentiators

- **Table stakes (documented in two or more products):** column or list structure that follows the user's own workflow (Trello, Asana, GitHub Projects), filters and sorts on the board (Notion, Jira, GitHub Projects), and grouping cards into horizontal bands (Notion, Asana, Jira, GitHub Projects). Basis: the Evidence table above.
- **Differentiators:** the Ctrl+K command menu and context-aware shortcuts (Linear), warn-only list limits (Jira), and rule-based automation (Trello Butler, Asana rules). Basis: the Evidence table above.
- **Hypothesis:** theme and background customization is a Trello hallmark and a motivating feature for the requester (Q3 of intent capture), but this research did not confirm it from documentation, so its ranking rests on the requester's own request.

## Proposed Ranked Shortlist (for you to choose from)

Ranking rule: first, the capabilities you picked (Q1 and Q2 of this stage, all selected); then how many studied products document the capability; then fit for a browser-only app. The shortlist is a proposal; Scope Definition fixes what is in.

| Rank | Capability | Why this rank | Browser-only fit |
|------|------------|---------------|------------------|
| 1 | Custom lists: add, rename, reorder, archive, delete | You picked it; the board's three fixed lists are the biggest gap against Trello, Asana and GitHub Projects | Easy |
| 2 | Richer cards: labels, checklists with progress, due-date states, card detail view | You picked it; Trello's card model is the reference | Easy |
| 3 | Filters, sort, group-by | You picked it; documented in Notion, Jira and GitHub Projects | Easy |
| 4 | Theme customization: background, light and dark mode, accent color, card and list look | Your explicit request (Q3 of intent capture); completes the Trello feel | Easy |
| 5 | Archive with undo, duplicate card, card templates | You picked it; guards against accidental deletion | Easy |
| 6 | Several boards | You picked it; needs a storage design that keeps one localStorage store | Moderate |
| 7 | Keyboard shortcuts and command menu | You picked it; Linear's signature speed feature | Moderate |
| 8 | List limits and swimlanes | You picked it; Jira's flow control | Moderate |
| 9 | Simple rules | You picked it; Trello Butler and Asana rules | Hard |
| 10 | Board export and import as a file | Needed for small-team sharing (Q8 of intent capture) | Easy |

## Assumptions & Open Questions

None.
