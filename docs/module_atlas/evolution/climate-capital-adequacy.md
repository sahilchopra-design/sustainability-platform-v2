## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the two RWA mechanics into one calibrated engine (analytics ladder: rung 1 → 3)

**What.** §7 identifies a structural inconsistency, not just a gap: the guide specifies
`ClimateRWA = RWA×(1 + α·Physical + β·Transition)` with ECB/NGFS-calibrated α/β, but
`computeCapital` applies a *Pillar-2 deduction* proportional to climate-RWA share in
which `physicalRiskScore` feeds only a side figure and `transitionRiskScore` is
generated but **never used** — while a separate "Climate RWA Engine" tab applies
per-asset-class multipliers with hard-coded constants. Two half-engines, neither
calibrated. Evolution A unifies them: one RWA-multiplier engine per the guide's
formula, with α anchored to the published ECB 2022 climate stress-test sectoral
haircuts and β to NGFS scenario transition-cost paths (both public; NGFS vintages are
already ingested platform-side), applied consistently in both the institution view
and the asset-class tab.

**How.** (1) `climateRWA(exposures, scenario)` as the single path; the Pillar-2 add-on
becomes `max(0, ClimateRWA − RWA)` as published; the dead `transitionRiskScore` either
enters the formula or is removed. (2) Calibration tables
`ref_ecb_haircuts(sector, scenario, haircut)` and `ref_ngfs_transition_multipliers`
with vintages, replacing hard-coded constants. (3) The 100 synthetic institutions
(real bank names on synthetic balance sheets) re-labelled as fixtures — real names
with fabricated CET1 ratios is a provenance pattern the platform treats as a defect.

**Prerequisites (hard).** The unused-variable and dual-mechanic issues are documented
defects; fixing them is the evolution's gate. ECB haircut tables transcribed with
scenario labels. **Acceptance:** a single fixture bank produces identical climate-RWA
in both tabs; setting α=β=0 reproduces standard RWA exactly; multipliers trace to a
cited calibration row.

### 9.2 Evolution B — Supervisory-dialogue copilot (LLM tier 2)

**What.** An assistant for capital planning: "what's our Pillar-2 add-on under
Disorderly 2030 and which sectors drive it?", "how much CET1 headroom survives the
adverse scenario?", "explain the multiplier applied to our commercial-real-estate
book" — each a tool call into the unified Evolution A engine with scenario parameter,
answers decomposing the add-on by sector with calibration sources cited (the ECB
haircut row, the NGFS path). Framework questions (BCBS d532 principles, CRR2
articles) answer from the §5 corpus.

**How.** Tool schemas over `climateRWA` and the capital-stack evaluator; the
no-fabrication validator on every RWA, ratio, and bps figure; "show work" lists the
calibration rows consulted — exactly the provenance a supervisor would ask for.

**Prerequisites (hard).** Evolution A first: today the two tabs disagree with each
other, and a copilot would have to pick which inconsistent number to narrate.
**Acceptance:** a headroom answer reconciles to the engine output for the stated
scenario; the copilot names calibration vintages and refuses questions outside the
coded scenario set.
