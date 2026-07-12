# Solvency Capital Climate
**Module ID:** `solvency-capital-climate` · **Route:** `/solvency-capital-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Solvency II climate stress capital requirement analytics quantifying climate-driven changes to Solvency Capital Requirement for insurers under EIOPA climate stress scenarios.

> **Business value:** Quantifies climate-driven Solvency II capital impacts under EIOPA stress scenarios to inform insurer capital planning and ORSA.

**How an analyst works this module:**
- Apply EIOPA 2022 climate stress scenario shocks to investment portfolio (transition risk).
- Model physical risk claims inflation on non-life underwriting portfolio under RCP 8.5.
- Recalculate SCR components: market, underwriting, counterparty under stressed assumptions.
- Report climate SCR delta and assess capital adequacy buffer versus solvency floor.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITIES`, `ENTITY_TYPES`, `FRAMEWORKS`, `JURISDICTIONS`, `KpiCard`, `NCPE_TIERS`, `ORSA_SCENARIOS`, `ORSA_STRESS_MULTS`, `PEER_DOMAIN_SCORES`, `PEER_INSURERS`, `REG_FRAMEWORKS`, `RISK_APPETITE`, `SCR_COLORS`, `SCR_CORR`, `SCR_MODULES`, `TabBtn`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REG_FRAMEWORKS` | 11 | `threshold`, `jurisdiction`, `type` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ENTITY_TYPES` | `['Life Insurer','Non-Life Insurer','Reinsurer','Composite','Captive'];` |
| `SCR_MODULES` | `['NatCat','Market Risk','Credit Risk','Operational','Life Underwriting','Health Underwriting','Non-Life Underwriting'];` |
| `scrModules` | `SCR_MODULES.map((_, mi) => +(sr(i * 41 + mi + 1) * 400 + 80).toFixed(0));` |
| `climateLoading` | `+(sr(i * 41 + 8) * 0.4 + 0.05).toFixed(3);` |
| `bscr` | `+Math.sqrt(Math.max(0, bscrSquared)).toFixed(0);` |
| `lacDT` | `+(bscr * (sr(i * 41 + 10) * 0.10 + 0.02)).toFixed(0);` |
| `lacTP` | `+(bscr * (sr(i * 41 + 11) * 0.05 + 0.01)).toFixed(0);` |
| `adjustedSCR` | `Math.max(1, bscr - lacDT - lacTP);` |
| `ownFunds` | `+(adjustedSCR * (sr(i * 41 + 12) * 1.2 + 1.1)).toFixed(0);` |
| `divBenefit` | `+(bscr - adjustedSCR + lacDT + lacTP).toFixed(0);` |
| `framework` | `FRAMEWORKS[Math.floor(sr(i * 41 + 13) * 5)];` |
| `amcr` | `Math.round(sr(i * 41 + 14) * 3000 + 500);` |
| `bmcr` | `Math.round(adjustedSCR * 0.45);` |
| `mcr` | `Math.max(amcr, Math.min(bmcr, adjustedSCR * 0.45));` |
| `PEER_DOMAIN_SCORES` | `PEER_INSURERS.map((n, i) =>` |
| `avgSolvency` | `filtered.reduce((s, e) => s + e.solvencyRatio, 0) / filtered.length;` |
| `avgClimateAdj` | `filtered.reduce((s, e) => s + e.climateAdjSolvencyRatio, 0) / filtered.length;` |
| `avgDiv` | `filtered.reduce((s, e) => s + e.diversificationBenefit, 0) / filtered.length;` |
| `orsaData` | `useMemo(() => { return ORSA_SCENARIOS.map((sc, si) => ({ scenario: sc.slice(0, 20), solvencyRatio: +(drillE.solvencyRatio / ORSA_STRESS_MULTS[si]).toFixed(1), climateAdjRatio: +(drillE.climateAdjSolvencyRatio / ORSA_STRESS_MULTS[si]).toFixed(1), bufferNeeded: Math.max(0, +(drillE.adjustedSCR * ORSA_STRESS_MULTS[si] - drillE.eligibleOwnFun` |
| `bscrModuleData` | `useMemo(() => SCR_MODULES.map((mod, mi) => ({` |
| `capitalEffData` | `useMemo(() => filtered.map(e => ({` |
| `stressed` | `+(drillE.solvencyRatio / ORSA_STRESS_MULTS[si]).toFixed(1);` |
| `avgSCR` | `ents.length ? +(ents.reduce((s, e) => s + e.solvencyRatio, 0) / ents.length).toFixed(1) : 0;` |
| `stressedRatios` | `filtered.map(e => e.solvencyRatio / ORSA_STRESS_MULTS[si]);` |
| `avgStressed` | `filtered.length ? +(stressedRatios.reduce((s, r) => s + r, 0) / filtered.length).toFixed(1) : 0;` |
| `buffers` | `filtered.map(e => Math.max(0, e.adjustedSCR * ORSA_STRESS_MULTS[si] - e.eligibleOwnFunds));` |
| `avgBuf` | `buffers.length ? Math.round(buffers.reduce((s,b) => s+b,0) / buffers.length) : 0;` |
| `totalNeed` | `Math.round(buffers.reduce((s,b) => s+b,0));` |
| `riskLevel` | `breaches > filtered.length * 0.3 ? 'Severe' : breaches > filtered.length * 0.1 ? 'High' : breaches > 0 ? 'Moderate' : 'Low';` |
| `avgClim` | `+(ents.reduce((s,e) => s + e.climateAdjSolvencyRatio, 0) / ents.length).toFixed(1);` |
| `avgOF` | `Math.round(ents.reduce((s,e) => s + e.eligibleOwnFunds, 0) / ents.length);` |
| `avgGreen` | `+(ents.reduce((s,e) => s + e.investmentPortfolioGreenPct, 0) / ents.length).toFixed(1);` |
| `avgT1` | `(ents.reduce((s, e) => s + e.tier1Pct, 0) / ents.length).toFixed(1);` |
| `avgT2` | `(ents.reduce((s, e) => s + (e.tier2Pct \|\| 0), 0) / ents.length).toFixed(1);` |
| `avgT3` | `+(100 - +avgT1 - +avgT2).toFixed(1);` |
| `avgSR` | `ENTITIES.length ? ENTITIES.reduce((sum, e) => {` |
| `stressedSCR` | `e.adjustedSCR * mult;` |
| `baseSCR` | `ENTITIES.length ? ENTITIES.reduce((sum, e) => sum + e.adjustedSCR, 0) / ENTITIES.length : 1;` |
| `scrDelta` | `baseSCR > 0 ? ((avgSCR - baseSCR) / baseSCR * 100).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_TYPES`, `FRAMEWORKS`, `JURISDICTIONS`, `NCPE_TIERS`, `ORSA_SCENARIOS`, `ORSA_STRESS_MULTS`, `PEER_INSURERS`, `REG_FRAMEWORKS`, `RISK_APPETITE`, `SCR_COLORS`, `SCR_CORR`, `SCR_MODULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Base SCR Coverage | — | Internal ORSA | Solvency Capital Requirement coverage ratio under standard EIOPA formula pre-climate stress. |
| Climate SCR Delta | — | EIOPA stress model | Estimated increase in SCR under EIOPA 2022 climate stress scenario (orderly transition + physical). |
| Post-Stress Coverage | — | Calculated | SCR coverage ratio after applying EIOPA climate stress scenario shocks to investment and underwriting portfolios. |
- **Investment portfolio, underwriting data, EIOPA stress scenario parameters** → SCR recalculation, climate shock application, solvency ratio analysis → **Climate SCR delta reports, solvency waterfall charts, ORSA inputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate SCR Delta
**Headline formula:** `SCR_stressed – SCR_base`

Increase in Solvency Capital Requirement under EIOPA climate stress scenario relative to base SCR, measuring climate capital adequacy impact.

**Standards:** ['EIOPA Climate Stress Test 2022', 'Solvency II Art.101']
**Reference documents:** EIOPA Climate Stress Test Methodology 2022; Solvency II Directive 2009/138/EC; EIOPA Opinion on Sustainability within Solvency II 2023; NGFS Insurance Supervisory Scenarios

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (understates complexity).** The guide's formula
> `SCR_stressed − SCR_base` implies a simple before/after delta. The code actually implements a **genuine
> Solvency II Basic SCR (BSCR) aggregation formula** — `BSCR = √(Σᵢⱼ ρᵢⱼ × SCRᵢ × SCRⱼ)` across 7 risk
> modules with a real correlation matrix, plus loss-absorbing capacity (LAC) for deferred tax and technical
> provisions, plus an MCR floor/cap structure — considerably more sophisticated than the guide describes.
> The weak link is that the **climate stress itself (`climateLoading`) is a flat synthetic random loading**,
> not derived from the entity's NatCat SCR or actual scenario shocks.

### 7.1 What the module computes

For 50 synthetic insurers (`sr()`-seeded, across 5 entity types, 5 regulatory frameworks — Solvency II, NAIC
RBC, APRA LAGIC, BMA BSCR, IAIS ICS — and 10 jurisdictions), the module runs a **correct implementation of
the Solvency II standard-formula SCR aggregation**:

```js
// 7 SCR risk modules (NatCat, Market, Credit, Operational, Life UW, Health UW, Non-Life UW), each $80–480M
scrModules[i] = sr(seed) × 400 + 80

// Solvency II BSCR aggregation formula (genuine standard-formula structure)
BSCR = sqrt( Σᵢ Σⱼ ρᵢⱼ × SCRᵢ × SCRⱼ )     // ρᵢⱼ from a 7×7 correlation matrix

// Loss-absorbing capacity (deferred tax + technical provisions)
LAC_DT = BSCR × (2–12%)          // synthetic rate within a plausible LAC range
LAC_TP = BSCR × (1–6%)
adjustedSCR = max(1, BSCR − LAC_DT − LAC_TP)

// MCR (Minimum Capital Requirement) — bounded between AMCR floor and 45% of SCR
MCR = max(AMCR, adjustedSCR × 0.45)

// Climate overlay (the synthetic component)
climateAdjSCR = adjustedSCR × (1 + climateLoading)      // climateLoading = 5–45%, RANDOM per entity
climateAdjSolvencyRatio = ownFunds / climateAdjSCR × 100
```

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| `SCR_CORR` (7×7 correlation matrix) | diagonal=1.00; NatCat↔Non-Life UW 0.35 (highest off-diagonal); NatCat↔Operational 0.10 (lowest) | plausible, symmetric, positive-semi-definite-looking structure consistent with the *type* of correlation matrix Solvency II's standard formula specifies (though not a literal reproduction of EIOPA's published Delegated Regulation Annex IV matrix) |
| `climateLoading` | `sr()×0.4+0.05` → 5–45% | **synthetic, uncorrelated with the entity's own `natcatSCR` or `investmentPortfolioGreenPct`** — the one component that should be climate-scenario-derived but isn't |
| `ORSA_STRESS_MULTS` (10 scenarios) | 0.85 (Technology Revolution, the only <1.0 easing scenario) to 1.55 (NatCat Mega-Event 250yr) | plausible relative severity ordering across climate/NatCat/sovereign/pandemic scenario types |
| MCR bound | `max(AMCR, adjustedSCR×0.45)` | approximates the real Solvency II MCR corridor (25–45% of SCR, floored at an absolute minimum) using the upper 45% bound only — a simplification of the real linear MCR formula, which also incorporates technical provisions and premium volume |
| `REG_FRAMEWORKS` reference table (10 rows) | Solvency II SCR 100%/MCR 133%, NAIC RBC Company Action 200%/Control 150%, APRA PCR 100%/MCR 50%, BMA ECR 100%, IAIS ICS Level 1 100%/Level 2 115%, MAS RBC 120% | **real, correctly-cited regulatory capital thresholds** across 6 major insurance jurisdictions |

### 7.3 Calculation walkthrough

- **BSCR aggregation**: the double-sum correlation formula is computed exactly as Solvency II's standard
  formula specifies — this correctly captures diversification benefit (BSCR < Σ SCR_i when correlations
  <1), unlike a naive linear sum.
- **Diversification benefit**: `divBenefit = BSCR − adjustedSCR + LAC_DT + LAC_TP` — i.e. the gap between
  the undiversified linear sum implicit in the SCR module values and the correlation-adjusted BSCR, plus the
  LAC offsets — correctly captures the capital relief from imperfect correlation.
- **Solvency ratio**: `ownFunds / adjustedSCR × 100` — standard definition.
- **Climate-adjusted solvency ratio**: applies the flat `climateLoading` multiplier to `adjustedSCR` — this
  is where the model diverges from a genuine climate-scenario stress test; a real EIOPA-style exercise would
  re-run the SCR module inputs (especially `natcatSCR` and market/credit risk on the investment portfolio)
  under NGFS physical/transition shocks and re-aggregate via the same BSCR formula, rather than applying a
  single random multiplier to the already-aggregated SCR.
- **ORSA Stress tab**: divides the base/climate-adjusted solvency ratios by `ORSA_STRESS_MULTS[scenario]` —
  a simple scalar stress applied post-hoc, not a re-run of the underlying SCR module inputs under each
  named scenario's actual shock parameters.

### 7.4 Worked example (illustrative single entity)

`scrModules ≈ [280, 220, 180, 130, 200, 150, 190]` (NatCat, Market, Credit, Operational, Life, Health, Non-Life):

| Step | Computation | Result (illustrative) |
|---|---|---|
| BSCR² | Σᵢⱼ ρᵢⱼ×SCRᵢ×SCRⱼ (diag terms alone: 280²+220²+180²+130²+200²+150²+190² = 234,700; plus off-diag cross-terms) | ≈300,000–330,000 (diversification reduces vs the ~1,350² naive-sum-squared) |
| BSCR | √330,000 | ≈**$574M** |
| LAC_DT+LAC_TP | 574×(0.02–0.17 combined) | ≈$40–95M |
| adjustedSCR | 574 − ~65 | ≈**$509M** |
| Given `ownFunds=$750M` | Solvency ratio | 750/509×100 ≈ **147%** |
| Climate loading (random, e.g. 25%) | climateAdjSCR = 509×1.25 | ≈$636M |
| Climate-adjusted ratio | 750/636×100 | ≈**118%** |

The climate overlay in this illustrative case pulls solvency coverage from 147% to 118% — still above the
100% Solvency II SCR threshold, but with materially thinner headroom, correctly illustrating the intended
narrative even though the specific 25% loading is a random draw rather than a scenario-derived shock.

### 7.5 Data provenance & limitations

- **The BSCR/LAC/MCR aggregation machinery is a genuinely correct, non-trivial implementation** of the
  Solvency II standard-formula structure — one of the stronger quantitative engines in this batch.
- **The climate stress itself is not scenario-derived** — `climateLoading` is an independent random draw,
  disconnected from the entity's own `natcatSCR`, `investmentPortfolioGreenPct`, or any named NGFS/EIOPA
  scenario parameter. A production model should instead re-shock `scrModules[NatCat]` (physical risk) and
  `scrModules[Market/Credit]` (transition risk on green vs brown asset allocation) under each named scenario
  and re-run the same BSCR aggregation, rather than applying a flat post-hoc multiplier.
- `SCR_CORR` is a plausible but not literally EIOPA-sourced correlation matrix.
- All 50 entities and their underlying SCR module values are synthetic; entity names are randomly assembled
  from word-pools, not real insurers (contrast with `PEER_INSURERS`, which does use 10 real reinsurer/
  insurer names for the peer-comparison radar).

### 7.6 Framework alignment

- **Solvency II Directive 2009/138/EC / EIOPA standard formula** — the BSCR aggregation, LAC(DT)/LAC(TP)
  concepts, and MCR corridor structure are all correctly named and structurally faithful implementations of
  the real regulatory framework, even though the correlation matrix and LAC rates are illustrative rather
  than EIOPA-published values.
- **EIOPA Climate Stress Test Methodology (2022) / NGFS Insurance Supervisory Scenarios** — cited in the
  guide as the basis for climate shocks; the actual implementation applies a generic random loading rather
  than the named scenarios' specific physical/transition shock parameters.
- **NAIC RBC / APRA LAGIC / BMA BSCR / IAIS ICS** — the multi-framework threshold reference table correctly
  distinguishes each jurisdiction's specific capital-adequacy trigger levels (e.g. NAIC's 200%/150% two-tier
  action levels vs Solvency II's single 100% SCR threshold).

## 9 · Future Evolution

### 9.1 Evolution A — Replace the flat climate loading with scenario-derived module shocks (analytics ladder: rung 1 → 3)

**What.** This tier-B module is more sophisticated than its guide claims: §7 shows it implements a genuine Solvency II Basic SCR aggregation (`BSCR = √(Σᵢⱼ ρᵢⱼ·SCRᵢ·SCRⱼ)` across 7 risk modules with a real correlation matrix), loss-absorbing capacity for deferred tax and technical provisions, and an MCR floor/cap corridor — structurally faithful to the standard formula. Its single weak link (§7 flag) is that the `climateLoading` is a flat synthetic 5–45% random draw per entity, not derived from the EIOPA/NGFS scenario shocks the module names or from the entity's own NatCat SCR. Evolution A makes the climate stress real while keeping the correct SCR machinery.

**How.** (1) Derive `climateLoading` per SCR module from the actual EIOPA 2022 climate-stress shock parameters: transition-risk shocks to the market-risk module (equity/spread/property haircuts by NACE sector), physical-risk claims inflation to the non-life underwriting module under RCP 8.5. (2) Recompute stressed BSCR through the existing aggregation formula with the shocked module inputs — so the climate SCR delta flows through the real correlation structure, not a scalar multiplier. (3) Calibrate the correlation matrix and LAC rates to EIOPA-published values (currently illustrative). (4) Bench-pin a known EIOPA reference insurer.

**Prerequisites.** EIOPA 2022 stress-test shock parameters need encoding per module/sector; the 50 synthetic insurers should be seedable from realistic balance-sheet structures. **Acceptance:** the climate SCR delta is reproducible from the scenario shocks applied to specific SCR modules, not a flat loading; changing the scenario changes which modules are stressed and by how much.

### 9.2 Evolution B — ORSA climate-stress copilot (LLM tier 1)

**What.** A copilot for the insurer capital-planning / ORSA use case: "how much does the disorderly scenario add to our SCR?", "which risk module drives the climate capital impact?", "are we above the Solvency II 100% threshold under stress?" — answered from the BSCR aggregation output, the LAC/MCR corridor, and the multi-framework threshold table (Solvency II / NAIC RBC / APRA LAGIC / BMA / IAIS ICS), never inventing capital figures.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solvency-capital-climate/ask`, corpus = this Atlas record (§7.1 BSCR formula, the module structure, EIOPA/NGFS framework notes) plus live page state. Capital-impact answers decompose the SCR delta by risk module; threshold answers cite the correct jurisdiction-specific trigger (NAIC's 200%/150% two-tier vs Solvency II's single 100%). The copilot flags (pre-Evolution-A) that the climate loading is a generic factor rather than scenario-specific.

**Prerequisites.** Evolution A lets the copilot attribute the SCR delta to real scenario shocks rather than caveating a flat loading. **Acceptance:** every SCR/solvency-ratio figure traces to the aggregation output; threshold verdicts cite the entity's actual regulatory framework; a jurisdiction outside the 5-framework table returns a scoped answer.