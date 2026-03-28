# Orchestrator agent playbook

Use this document when acting as an **orchestrator agent**. You **do not** replace the specialist agents; you **sequence** them, track state, run gates, and loop until the agreed work is done or you stop with a clear report.

## Specialist agents (this repo)

| Agent | Playbook | Primary artifact |
|--------|-----------|------------------|
| Review | [`REVIEW_AGENT.md`](./REVIEW_AGENT.md) | Appends findings to [`REVIEW_FINDINGS.md`](./REVIEW_FINDINGS.md) |
| Senior developer | [`SENIOR_DEVELOPER_AGENT.md`](./SENIOR_DEVELOPER_AGENT.md) | Implements fixes; updates statuses and **Resolution** in `REVIEW_FINDINGS.md` |
| (Context) | [`AGENTS.md`](../AGENTS.md) at repo root | Stack, layout, commands — share with all participants |

The orchestrator **assigns roles** by instructing each turn which playbook to follow and what to read first.

## Inputs you need from the human

Capture these at the start (paraphrase them into your run summary):

1. **Goal** — What “done” means (feature, refactor, audit, release prep, etc.).
2. **Scope** — Paths, files, or behavior boundaries (optional).
3. **Severity policy** — Which severities must be **cleared or explicitly closed** before exit (default: resolve all `open` with severity `blocker`, `high`, `medium`; `low` and `suggestion` may remain `open` only if the human said so).
4. **Budget** — Maximum **review rounds** (default: `5`). One round is defined below.
5. **Stop conditions** — e.g. “stop after first review if only suggestions,” or “must get green `npm test && npm run lint`.”

## Artifacts you maintain

1. **`docs/REVIEW_FINDINGS.md`** — The handoff log; both specialist agents already write here. You **append** an **Orchestrator run** section (template below) so humans can see the loop history without reading the whole chat.
2. **Repository state** — After a senior developer pass, `npm test && npm run lint` must be green before you call a review pass “complete” unless the human accepted known failures (document that in the run summary).

### Orchestrator run block (append to `REVIEW_FINDINGS.md`)

After each full loop or when stopping, append:

```markdown
## Orchestrator run — YYYY-MM-DD HH:MM (optional TZ)

- **Human goal:** …
- **Scope:** …
- **Severity policy:** …
- **Round:** N / max M
- **Actions this round:** e.g. “Review session added RV-…; Senior dev resolved RV-…; tests/lint: pass”
- **Open findings remaining:** list IDs and severities, or “none per policy”
- **Next step:** e.g. “Another verification review” | “Stop — criteria met” | “Stop — budget exhausted; risks: …”

---
```

## Phases

### Phase 1 — Intake and planning

1. Restate the goal, scope, policy, and budget in your own words.
2. If the human asked for **new implementation** not yet in the tree, plan: implementation first (follow [`AGENTS.md`](../AGENTS.md)), then enter the review loop. Do not run a hollow review on missing work.
3. Append the first **Orchestrator run** block with **Round: 0** (planning only) if useful.

### Phase 2 — Review round (specialist: review agent)

1. Instruct the participant to adopt **`REVIEW_AGENT.md`**.
2. Require a **new Review session** in `REVIEW_FINDINGS.md` with target commit/branch and `npm test` / `npm run lint` results.
3. Wait until findings are recorded (each with **Status:** `open`).

If the review finds **nothing** in scope that violates the severity policy, you may skip Phase 3 for that round and jump to Phase 4 (verification) or exit if the human only wanted a review.

### Phase 3 — Fix round (specialist: senior developer agent)

1. Instruct the participant to adopt **`SENIOR_DEVELOPER_AGENT.md`**.
2. Require work on every finding that is still **`open`** and within the severity policy (triage order is in that playbook).
3. Require **`npm test && npm run lint`** after substantive changes.
4. Require each handled finding to have **Status** updated and a **Resolution** block per `SENIOR_DEVELOPER_AGENT.md`.

Repeat Phase 3 only if the senior developer pass was incomplete (e.g. partial/wontfix still violates policy); otherwise proceed.

### Phase 4 — Verification gate

1. Instruct the participant to adopt **`REVIEW_AGENT.md`** again for a **focused verification pass** (new Review session): regressions, new issues near touched code, contract drift.
2. If new findings appear within policy → that counts as **starting a new round** at Phase 3 (not infinite depth on the same round number).

### Phase 5 — Loop control

One **round** = Phases 2 → 3 → 4 (verification may be folded into Phase 2 as a second review session if you prefer, but keep the pattern: **review → fix → re-review**).

- **Continue** if verification added policy-relevant `open` findings and `round < max_rounds`.
- **Stop — success** if no policy-relevant `open` findings remain and checks are green (or human-accepted).
- **Stop — budget** if `round >= max_rounds`: append **Orchestrator run** with remaining IDs, severities, and recommended human action.

## Rules for the orchestrator

- **Single writer per role per step** — One review pass, then one senior dev pass; avoid interleaving competing edits to the same finding.
- **Never delete history** in `REVIEW_FINDINGS.md`; append sessions and resolutions.
- **Escalate** — If `blocker`/`high` is marked `wontfix` without human approval, stop the loop and state the conflict in the Orchestrator run block.
- **Idempotency** — If asked to orchestrate again, read current `REVIEW_FINDINGS.md` first; do not assume a clean slate.
- **Commands** — From repo root: `npm test && npm run lint` (and `npm run dev` only when the human needs interactive verification).

## Quick checklist (copy for each round)

- [ ] Review session appended; IDs assigned; tests/lint noted.
- [ ] Every in-policy `open` finding either fixed with **Resolution** or explicitly `partial` / `wontfix` with rationale (and human policy allows it).
- [ ] `npm test && npm run lint` green after fixes (or documented exception).
- [ ] Verification review done if code changed this round.
- [ ] **Orchestrator run** appended with round number and next step.

## Handoff

If stopping mid-loop, the next orchestrator (or human) should read **`REVIEW_FINDINGS.md`** from the bottom up for the latest sessions, then resume at the appropriate phase.
