## 9 · Future Evolution

### 9.1 Evolution A — GEM-plant-linked phase-out assessment with pipeline risk (analytics ladder: rung 2 → 3)

**What.** A self-contained coal phase-out alignment checker (no separate engine) scoring
counterparties against IEA NZE / NZBA / PPCA criteria: `POST /check` scores 5 criteria (10 pts
each) → `overall = Σ/50 × 100` with entity RAG (5/5 GREEN, ≥3/5 AMBER, else RED, plus two RED
overrides) and a portfolio roll-up (RED if any exclusion entity or >10% coal exposure). The
revenue thresholds (≥25% Exclusion, ≥10% Watchlist) match NZBA practice. `GET /gem-summary` reads
the Global Energy Monitor Coal Plant Tracker from `dh_reference_data`. The gap: the check is
counterparty-input-driven and doesn't yet cross-reference the GEM plant data to detect undisclosed
coal capacity or expansion pipelines. Evolution A links them.

**How.** (1) Cross-reference the counterparty (via entity resolution) against the GEM Coal Plant
Tracker rows already in `dh_reference_data`, so the checker flags operating capacity and — critically
— *pipeline* (announced/under-construction) plants that a self-reported coal-revenue % would miss.
This makes the pipeline-risk criterion evidence-based rather than declared. (2) Add a forward
phase-out trajectory check: does the counterparty's retirement schedule meet the OECD-2030 /
global-2040 deadlines the thresholds encode? (3) Confirm `/check` (traces `skipped`) works
end-to-end. (4) Bench-pin the 5-criterion scoring and portfolio roll-up.

**Prerequisites.** Entity resolution to link counterparties to GEM plant rows; GEM tracker fully
loaded in `dh_reference_data`. **Acceptance:** the check flags GEM-recorded pipeline capacity not in
the self-reported revenue %; a retirement-schedule vs deadline verdict is returned; `/check` returns
`passed`; scoring bench-pinned.

### 9.2 Evolution B — Coal-policy screening copilot (LLM tier 2)

**What.** A copilot that screens a counterparty or portfolio against coal policy — "this utility
fails NZBA: 18% thermal-coal revenue (Watchlist) plus 2 GEM-tracked plants under construction, no
2030 retirement plan" — each figure from a tool call, citing the GEM evidence and the threshold
rubric.

**How.** Three endpoints (`/check`, `/thresholds`, `/gem-summary`) form the tool set; the
`/thresholds` rubric grounds every RAG band and deadline, and `/gem-summary` provides the plant-level
evidence. The 5-criterion decomposition lets the copilot explain exactly why a counterparty is
excluded. Portfolio what-ifs ("if we divest this name, does our coal exposure drop below 5%?") re-run
statelessly. Node for a financing/exclusions desk, cross-linking to `sfdr_exclusion` and
`gdelt_controversy`.

**Prerequisites.** Evolution A's GEM linkage for evidence-based pipeline claims; `/check` fix.
**Acceptance:** every revenue %, criterion score, and plant reference traces to a tool response; the
copilot cites GEM plant evidence for capacity claims rather than only self-reported revenue; it
frames verdicts as policy-alignment screening against the stated thresholds, not investment advice.
