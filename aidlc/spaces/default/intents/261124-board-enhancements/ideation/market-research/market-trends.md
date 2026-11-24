# Market Trends

This report supports intent-statement.md. Market positioning is not needed for this board, which is for personal and small-team use (Q4 of this stage), so only trends that shape what the board should offer are covered. All statements come from the cited pages found on 2026-11-24; anything else is labelled hypothesis.

## Observed Trends

| Trend | Evidence | Source |
|-------|----------|--------|
| Board views are being added to everything, not only Kanban tools | Notion and Asana offer a board view over their own data; GitHub Projects offers a board layout over issues; Trello adds Timeline, Calendar, Table, Dashboard and Map views on paid plans | [Notion board view](https://Notion.com/help/boards), [Asana board view](https://help.asana.com/s/article/board-view), [GitHub board layout docs](https://docs.github.com/en/enterprise-server@3.19/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout), [ClickUp review of Trello](https://clickup.com/learn/topic/project-management/tools/trello/) |
| The board is driven by a field, so the same cards can be regrouped | Notion groups by any property; GitHub Projects uses a single-select or iteration field for columns; Asana users ask for columns driven by a custom field | [Notion views, filters, sorts and groups](https://notion.com/help/views-filters-and-sorts), [GitHub board layout docs](https://docs.github.com/en/enterprise-server@3.19/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout), [Asana forum request](https://forum.asana.com/t/allow-board-view-columns-to-be-associated-to-a-custom-fields-options-similar-to-sorted-sections-in-list-view/328349) |
| Keyboard-first navigation | Linear's command menu and context-ranked commands; GitHub's ? shortcut list | [Linear command menu changelog](https://linear.app/changelog/2019-12-18-new-command-menu), [GitHub 2018 board post](https://blog.github.com/2018-06-14-project-board-side-panel-view) |
| Automation built into the board | Trello Butler on all plans with a monthly cap; Asana rules | [Atlassian Butler post](https://www.atlassian.com/blog/trello/butler-power-up-trello-automation), [Asana board view](https://help.asana.com/s/article/board-view) |
| Flow control through warnings, not blocks | Jira list limits only warn when exceeded | [Atlassian Kanban with Jira](https://www.atlassian.com/agile/tutorials/how-to-do-kanban-with-jira-software) |

## What This Means for the Board

- Making lists user-defined, and grouping and filtering by card fields, matches the field-driven direction in Notion and GitHub Projects. Hypothesis: a card field such as label or priority can drive grouping without a database.
- A command menu and shortcuts are cheap to add in a browser app and are the most visible speed feature in the products studied. Hypothesis: shortcuts matter more for daily use than rules.
- Warn-only list limits are the lowest-friction way to introduce flow control and fit a single-user board.

## Caveats

- Sources disagree on Trello pricing and Power-Up limits, and third-party shortcut lists for Linear disagree with each other, so specific plan limits and key bindings are not relied on here. Verify in the product before copying any exact behavior.
- Linear's and Trello's behavior for checklists, archive and templates was not confirmed in this research.

## Assumptions & Open Questions

None.
