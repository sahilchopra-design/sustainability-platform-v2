## 9 · Future Evolution

### 9.1 Evolution A — Fix the failing endpoints and the higher-is-better progress bug, then component-score ICMA (analytics ladder: rung 1 → 3)

**What.** The engine (`sll_slb_v2_engine`, blast radius 48 — one of the most-depended-on on the platform) has genuine methods (`assess_sll_slb_quality`, `calibrate_spt`, `screen_greenwashing_flags`, `calculate_margin_impact`), but the lineage sweep records `POST /assess` and `/greenwashing-screen` as **failed** and the other two POSTs as skipped, so the backend is effectively unexercised. Meanwhile the frontend runs on 60 `sr()`-synthetic facilities with two documented defects: the progress formula `(baseline−current)/(baseline−target)` floors to 0 for higher-is-better KPIs (renewable %, gender diversity) because it lacks sign inversion (§7.1 latent bug), and `breachRisk` is an independent random draw uncorrelated with a facility's own progress (§7.6, "a genuine logic gap"). Evolution A fixes the plumbing and the math.

**How.** (1) Triage the two 500-ing POST routes (the deployment-prep sweep's methodology). (2) Fix the progress formula: detect KPI direction and invert (`(current−baseline)/(target−baseline)` for higher-is-better), guarded. (3) Derive `breachRisk` from computed progress-to-target and time-to-observation-date rather than a draw. (4) Replace the flat `icmaAlign`/`lmaAlign` scores with the engine's real component logic — `_score_kpi_materiality` and `_score_spt_ambition` exist but the page ignores them; surface the ICMA SLBP five-component breakdown. (5) Model the real ±5–25bps one-time observation-date adjustment instead of the linear bps schedule.

**Prerequisites.** The `/assess` and `/greenwashing-screen` failures are the gate; because blast radius is 48, engine edits need the shared-engine regression check. **Acceptance:** all four POST routes pass the lineage sweep; a 90%-renewable-progress facility no longer shows 0%; breachRisk correlates with progress.

### 9.2 Evolution B — Greenwashing-screen and margin-impact analyst (LLM tier 2)

**What.** A tool-calling analyst over the (repaired) endpoints: "screen this SLB for greenwashing flags", "what's the margin impact if this KPI misses at the observation date", "is this SPT ambitious versus the SDA trajectory". Each calls `POST /greenwashing-screen`, `/margin-impact`, or `/calibrate-spt` and narrates the engine's structured output — the five ICMA components, the SDA-benchmarked ambition, the bps ratchet — with the greenwashing verdict grounded in `screen_greenwashing_flags` rather than LLM opinion.

**How.** Tool schemas from the module's OpenAPI operations plus the four `GET /ref/*` endpoints (icma-principles, kpi-materiality, sda-trajectories, verification-agents) as the citation corpus. The no-fabrication validator checks every bps and score against tool outputs; greenwashing flags must each cite the specific principle component that triggered them.

**Prerequisites (hard).** Evolution A — the greenwashing-screen endpoint currently fails, so there is nothing to narrate; and narrating the buggy progress figures would mislabel on-track facilities. **Acceptance:** every flag traces to a `/greenwashing-screen` response component; margin figures match `/margin-impact`; asking to screen a facility while the endpoint 500s surfaces the error, not an invented verdict.
