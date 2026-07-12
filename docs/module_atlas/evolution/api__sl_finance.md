## 9 · Future Evolution

### 9.1 Evolution A — Ambition benchmarking against sector pathways and observed SLB market data (analytics ladder: rung 2 → 3)

**What.** The E17 engine assesses sustainability-linked bonds/loans against the ICMA SLB Principles
2023 and LMA/APLMA/LSTA SLL Principles 2023: per-KPI improvement required/achieved, an `on_track =
achieved ≥ 0.5 × required` rule, a 5-part SMART score (20 pts each), a weighted 5-component
compliance score (blocking components ×1.5, compliant if every blocking ≥70), a step-up trigger,
and SPT calibration. The KPI library (10 KPIs) carries *typical improvement* values that anchor
ambition testing — but those typicals are static registry entries, and the `0.5 × required`
on-track rule is a platform convention. Evolution A benchmarks ambition against real pathways.

**How.** (1) Calibrate each KPI's "typical improvement" against the platform's sector pathway data —
GHG-intensity SPTs tested against the NZBA/IEA glidepaths (`glidepath` module) and SBTi rates, so
"ambitious" means beyond-pathway, not beyond-a-static-registry-value. (2) Add coupon-impact
analytics: expected step-up cost as `P(miss) × step_up_bps × remaining tenor`, with P(miss) from the
KPI trajectory rather than a binary on-track flag. (3) Justify or calibrate the 0.5× on-track
threshold with documented rationale. (4) Bench-pin the SMART score, component weighting, and SPT
calibration.

**Prerequisites.** Glidepath/SBTi linkage for ambition benchmarks; issuer KPI history for
trajectory-based P(miss). **Acceptance:** ambition verdicts cite the sector pathway the SPT is
tested against; an expected step-up cost with a probability is returned; the on-track threshold is
documented; scoring bench-pinned.

### 9.2 Evolution B — SLB/SLL structuring copilot (LLM tier 2)

**What.** A copilot for DCM/lending teams: "assess this SLB against ICMA — is the GHG SPT
ambitious, is the KPI material, and will the step-up trigger?" (calling `/assess` and citing the
per-component and SMART decompositions), plus "calibrate an SPT for a 2030 water-intensity target"
via `/calibrate-spt`.

**How.** Four POST endpoints (`/assess`, `/assess/batch`, `/validate-kpi`, `/calibrate-spt`) plus
reference GETs (the 10-KPI library with typicals, ICMA/LMA components with blocking flags and
article citations, coupon guidance, cross-framework) — a self-contained principles corpus, so the
copilot cites the exact ICMA component behind each deduction. The calibrate endpoint is the natural
structuring action: propose a target value and test its ambition. What-ifs re-run statelessly.
Node for a sustainable-finance desk, cross-linking to `net_zero_targets` and `glidepath`.

**Prerequisites.** None hard — the engine is honest and reference-complete; ambition narration is
stronger after Evolution A's pathway benchmarks. **Acceptance:** every component score, SMART
point, and on-track verdict traces to a tool response; the copilot names the ICMA/LMA component and
its blocking status per finding; it labels ambition as registry-typical-based until Evolution A,
and refuses to predict a step-up as certain rather than probabilistic.
