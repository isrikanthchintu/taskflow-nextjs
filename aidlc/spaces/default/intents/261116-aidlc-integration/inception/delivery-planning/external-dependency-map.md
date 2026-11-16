# External Dependency Map

This intent is fully AI-contained with one exception, already flagged as an assumption in `requirements.md` (Assumption A1):

| External Item | Owner | Blocks | What Happens If It Slips |
|---|---|---|---|
| Creating a GitHub remote and pushing this repository to it | The person (requires their own GitHub account/credentials, outside this agent's reach) | Nothing in this intent — Bolt 1 and Bolt 2 both complete fully without a remote existing. It only blocks the CI workflow (Bolt 2) from ever actually *running* on GitHub Actions. | No impact on this intent's completion; the workflow file is still correctly written and ready to run once the person creates the remote, at their own pace, after this intent ships. |

No other external dependency exists: no third-party API, no data availability window, no approval lead time, no other team's hand-off.
