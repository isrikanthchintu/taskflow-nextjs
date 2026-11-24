# Intent Capture Questions

## Sources

- [desc] Initial description: "update all new functionalities to enhance that trello like board"
- [scope] Workflow-selected scope: `bugfix`.

## Q1. [Product owner] What should this board upgrade mainly achieve for you?

Context: your request says to enhance the Trello-style board with all the new functionality worth having. This tells us what "better" means, so the features we pick later serve it.

A. Make it a real daily-use task manager for me, comparable to Trello for personal work
B. Make it a polished showcase or demo of what the app can do
C. Both: daily use first, showcase second
D. Not yet defined
X. Other (please specify)

[Answer]: A. Make it a real daily-use task manager for me, comparable to Trello for personal work

## Q2. [Product owner] Who will use the board?

Context: this decides whether features like sharing or assignees make sense. The app stores everything in the browser's localStorage today, with no accounts or server.

A. Just me, in one browser
B. Me, on a few of my own browsers or devices (data would stay separate per browser unless we add export/import)
C. A small team (would need shared data, which a browser-only app cannot provide)
D. Not yet defined
X. Other (please specify)

[Answer]: C. A small team (would need shared data, which a browser-only app cannot provide)

## Q3. [Designer] Which parts of the board should the theme customization cover? (select all that apply)

Context: you asked for theme customization. Each choice below is a separate piece of work, so picking only what you want keeps the plan small.

A. Board background (solid colors, gradients, maybe images)
B. Light and dark mode
C. Accent color for buttons and highlights
D. Card and list look (density, corner roundness, label colors)
X. Other (please specify)

[Answer]: A. Board background (solid colors, gradients, maybe images), B. Light and dark mode, C. Accent color for buttons and highlights, D. Card and list look (density, corner roundness, label colors)

## Q4. [Product owner] Which other products should I study for ideas, and how far should I take what I find?

Context: you asked me to refer to other websites and add the best functionality. This sets the research list and how much of what I find becomes part of the plan.

A. Trello, Notion, Linear, Asana, Jira and GitHub Projects; propose a ranked shortlist and I choose what gets built
B. Trello, Notion, Linear, Asana, Jira and GitHub Projects; build everything that fits a browser-only app
C. Only the sites I name below
D. No research needed; I will list the features myself
X. Other (please specify)

[Answer]: A. Trello, Notion, Linear, Asana, Jira and GitHub Projects; propose a ranked shortlist and I choose what gets built

## Q5. [Product owner] How will you know the upgrade succeeded?

Context: a clear check lets us test the result instead of guessing. The existing features (drag between lists, add, edit, delete, search) must keep working.

A. I can run my day-to-day tasks on the board without needing another tool
B. The board offers the core Trello features I listed and my chosen theme survives a page reload
C. Both A and B, and every existing feature still works
D. Not yet defined
X. Other (please specify)

[Answer]: A. I can run my day-to-day tasks on the board without needing another tool

## Q6. [Product owner] What should this first version leave out? (select all that apply)

Context: this fixes the product boundary so the researched ideas do not grow without limit. The workflow plan itself is already chosen.

A. Accounts, sign-in, sharing and real-time collaboration (needs a server)
B. File attachments and image uploads
C. Notifications, emails and calendar sync
D. None; everything is on the table
X. Other (please specify)

[Answer]: A. Accounts, sign-in, sharing and real-time collaboration (needs a server), B. File attachments and image uploads, C. Notifications, emails and calendar sync

## Q7. [Product owner] Who decides what gets built, and who else needs to be kept informed?

Context: this fills in the stakeholder map; if it is only you, say so and nothing else is needed.

A. Only me; no one else needs updates
B. Me, plus someone who reviews the result (name them below)
C. Not yet defined
X. Other (please specify)

[Answer]: A. Only me; no one else needs updates

## Q8. [Product owner] You said a small team will use the board (Q2), but the project keeps all data in each browser's localStorage with no server. How should we reconcile that?

Context: browser-only storage means each team member would see only their own board. The project rule is to keep localStorage as the only data store unless you decide otherwise.

A. Keep browser-only storage; each person has their own board, and we add export/import so boards can be shared as files
B. Keep browser-only storage and treat "small team" as a future goal, out of this first version
C. Change the rule: add a shared server or database so the team sees one board (a much larger piece of work and a change to the project's affirmed rules)
D. Not yet defined
X. Other (please specify)

[Answer]: A. Keep browser-only storage; each person has their own board, and we add export/import so boards can be shared as files
