## 9 · Future Evolution

### 9.1 Evolution A — Jurisdictional reference levels from real deforestation data (analytics ladder: rung 1 → 3)

**What.** §7 notes the one substantive guide↔code nuance: the guide emphasises
jurisdictional JNR/ART TREES reference-level accounting, but `calcREDD` implements a
project-level exponential-decay baseline (correctly labelled VM0007). Evolution A adds
the jurisdictional layer the guide promises, grounded in public activity data: Hansen
Global Forest Change loss rasters (already named in §5 as the leakage-belt monitoring
source) aggregated to jurisdiction polygons to compute the 10-year historical
deforestation rate that defines an ART TREES crediting level, replacing the
user-typed BDR with a data-derived one.

**How.** (1) `ref_jurisdiction_deforestation(jurisdiction, year, forest_ha, loss_ha,
source)` table ingested from Hansen GFC country/subnational summaries (public CSV
tiles). (2) Reference level per TREES v2.0: mean annual emissions over the 10-year
period, with the uncertainty deduction computed from activity-data variance rather
than the flat 10–15% input. (3) The wetlands engine (`calcWetlands`, a real 3-gas
VM0033-style model) gains AR5/AR6 GWP switching — the page already ships both
`GWP_AR5` and `GWP_AR6` constants but §7 shows only one path in use.

**Prerequisites.** Hansen aggregation done offline into the ref table (no raster
processing in-request); jurisdiction boundaries from the platform's existing PostGIS
layer. **Acceptance:** selecting a Brazilian state pulls a cited 10-year loss series
and produces a TREES-style crediting level; the project-level VM0007 path still
produces identical numbers to today (regression-pinned).

### 9.2 Evolution B — Nature-based methodology copilot (LLM tier 1 → 2)

**What.** A copilot spanning the hub's three real engines: "walk me through the
deduction stack from gross to net" (leakage → buffer → uncertainty, §7 order), "why
does the mangrove case add a CH₄ penalty?" (VM0033 multi-gas logic), "what does the
risk-weighted buffer tool imply for a fire-prone project?" (the 6-factor
`RISK_FACTORS` rubric). Tier-2 what-ifs re-invoke `calcREDD`/`calcWetlands` client-side
with LLM-proposed parameters — no backend routes exist.

**How.** Tier 1: atlas §5/§7 as corpus, live inputs/results as context; the copilot
must distinguish project-level vs jurisdictional accounting explicitly, since §7 shows
that distinction is the guide's known nuance. Tier 2: tool schemas over the two
calculators plus the buffer-rating rubric; validator ties every tCO₂e to an invocation.

**Prerequisites.** None hard — the engines are real; Evolution A upgrades what-if
realism for jurisdictional questions. **Acceptance:** deduction-stack narration
reconciles to on-screen figures line by line; asked for a jurisdictional RL before
Evolution A, the copilot states the module computes project-level baselines only.
