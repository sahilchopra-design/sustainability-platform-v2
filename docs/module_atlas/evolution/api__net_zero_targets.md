## 9 · Future Evolution

### 9.1 Evolution A — Sector-pathway-anchored temperature scoring and achieved-vs-required tracking (analytics ladder: rung 2 → 4)

**What.** The E33 engine validates decarbonisation targets against SBTi/FLAG/NZBA/NZAMI/
NZAOA, derives an implied temperature score, and generates a linear-interpolated
required-emissions glidepath between base year, the 2030 milestone, and net-zero. The
temperature score is a coarse lookup from 2030 reduction % to warming °C
(`_derive_temperature_score`), and the pathway is straight-line interpolation. The engine
is admirably honest — it returns `None`/`insufficient_data` for anything the caller didn't
supply (Scope-3 coverage, achieved-vs-required projection). Evolution A upgrades the
science while preserving that honesty.

**How.** (1) Replace the reduction-%-to-temperature lookup with the SBTi/CDP-WWF temperature
methodology anchored to real sector pathways (`/ref/sector-pathways` already exists as a
scaffold; wire it to the platform's NGFS/glidepath data). (2) Add achieved-vs-required
tracking: when the entity supplies an emissions time series, compute the gap trajectory and
project whether the target is on track (rung 4 predictive) — currently the projection is an
input, not a computation. (3) Fix the persistence path: `/assessment/{id}` and
`/assessments/{entity_id}` trace **failed**, so saved assessments aren't retrievable. (4)
Bench-pin the glidepath interpolation and compliance penalty.

**Prerequisites.** Sector-pathway data linked (glidepath modules); assessment persistence
repaired (`net_zero_target_assessments` write/read path). **Acceptance:** temperature score
derives from sector pathways, not a flat lookup; achieved-vs-required is computed from a
supplied series with an on-track verdict; `/assessment/{id}` returns `passed`; honest-null
behaviour retained and bench-pinned.

### 9.2 Evolution B — Net-zero target-setting copilot (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the verdict — "your near-term target
(42% by 2030) qualifies as 1.5°C-aligned under SBTi, but your net-zero year of 2060 exceeds
the framework maximum; Scope-3 coverage is insufficient to score" — each figure tool-sourced,
with what-ifs on target ambition.

**How.** Two POST endpoints (`/assess`, `/temperature-score`) plus three reference GETs
(frameworks, pathways, sector-pathways) that ground every SBTi/NZBA threshold. The
penalty-based compliance % lets the copilot enumerate exactly which gaps and warnings cost
points. What-ifs ("what 2030 reduction do we need for a 1.5°C score?") re-run statelessly.
The engine's `insufficient_data` returns are a strong refusal-path test — the copilot must
report them, not fill them in. Cross-links to the glidepath and PCAF copilots.

**Prerequisites.** None hard for tier-1; assessment persistence (Evolution A) for
"show my saved targets". **Acceptance:** every reduction %, temperature score, and
compliance figure traces to a tool response; the copilot reports `insufficient_data` for
unsupplied inputs rather than estimating; it cites the specific framework minimum behind
each pass/fail from the reference endpoints.
