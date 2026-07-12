## 9 · Future Evolution

### 9.1 Evolution A — Derive job projections from deployment paths (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's `Jobs(sector, year) = Deployment(sector, year) × Jobs_per_unit(sector)` is not implemented — the 2025/2030/2035/2040 job counts across the 8 sectors (solar, wind, EV, battery, green H₂, retrofit, nature restoration, circular) are pre-tabulated static literals (informed by IRENA/ILO but not computed), so the tracker cannot answer "how do jobs change if deployment accelerates?" Evolution A builds the projection model: take sector deployment paths (GW/units by year) and multiply by jobs-per-unit employment factors, so job counts are derived from — and respond to — deployment scenarios rather than being fixed. This complements the sibling `green-jobs-growth`'s investment-multiplier (deployment-driven here vs investment-driven there).

**How.** (1) A backend route computing `Jobs(sector, year)` from a deployment path × jobs-per-unit factors (IRENA/ILO). (2) Deployment paths as scenario inputs (baseline/accelerated), so the 2025–2040 trajectory is computed. (3) The skills taxonomy and wage/geographic layers tied to the computed job counts. Static literals become the model's default/baseline, not the only value.

**Prerequisites.** Jobs-per-unit employment factors by sector; deployment-path scenarios (from the platform's renewable-deployment data); the static job literals reframed as baseline outputs. **Acceptance:** job counts recompute from deployment × jobs-per-unit reproducing §5; an accelerated deployment scenario raises projected jobs; the skills/wage layers reflect computed counts.

### 9.2 Evolution B — Green-workforce planning copilot (LLM tier 1 → 2)

**What.** A copilot for regional workforce and policy planners: "how many green-H₂ jobs by 2035 under an accelerated deployment path, and what skills and wages do they require?" narrates the sector job projections, skills taxonomy, and geographic distribution from the atlas corpus, with tier-2 computing scenario-driven projections via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the 8-sector taxonomy, IRENA/ILO framing, skills/wage data) — the copilot cites the baseline projections while flagging them as static estimates. Tier 2 tool-calls the deployment→jobs endpoint so scenario what-ifs are computed. The copilot's value is scenario-based workforce planning tied to deployment ambition. Guardrail: pre-Evolution-A it presents job counts as static IRENA/ILO-informed estimates, not model outputs.

**Prerequisites.** Corpus embedding; Evolution A for scenario projections. **Acceptance:** post-Evolution-A, every job-projection figure traces to a tool call reproducing the deployment multiplication; the accelerated-scenario answer differs from baseline; pre-Evolution-A the copilot labels counts as static estimates.
