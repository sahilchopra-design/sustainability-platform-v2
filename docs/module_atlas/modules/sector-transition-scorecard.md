# Sector Transition Scorecard
**Module ID:** `sector-transition-scorecard` · **Route:** `/sector-transition-scorecard` · **Tier:** B (frontend-computed) · **EP code:** EP-CB1 · **Sprint:** CB

## 1 · Overview
PACE 4-pillar sector transition framework (Physical risk, Abatement cost, Carbon cost, Energy price) for 6 GICS sectors. Includes SBTi pathway comparison, marginal abatement cost curves, and emissions trajectories.

**How an analyst works this module:**
- Review sector scorecards with PACE radar chart
- Compare PACE pillars across 6 GICS sectors
- SBTi Pathways tab shows actual vs required emissions trajectory
- Abatement Cost Curves rank decarbonization options by $/tCO₂
- Emissions Trajectories show historical and projected sector emissions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `RATING_COLOR`, `RISK_COLOR`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 41 | `gics`, `sub`, `color`, `icon`, `pace`, `physical`, `abatement`, `carbon_cost`, `energy_price` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `radarData` | `useMemo(() => [ { subject: 'Physical Risk', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.physical])) }, { subject: 'Abatement', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.abatement])) }, { subject: 'Carbon Cost', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.carbon_cost` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PACE Composite | `Average of 4 pillars` | Model output | Higher = better transition position; Energy sector typically 35-45, Tech sector 70-78 |
| Abatement Cost Curve | `Marginal cost ranking` | McKinsey MAC | Cost of emission reduction technologies ranked from cheapest to most expensive |
| SBTi Pathway Gap | `Actual vs SBTi target` | SBTi SDA | Deviation of sector emissions from science-based pathway |

## 5 · Intermediate Transformation Logic
**Methodology:** PACE composite scoring
**Headline formula:** `paceComposite(s) = avg(Physical, Abatement, Carbon, Energy)`

Each sector scored on 4 dimensions (0-100): Physical risk exposure, Abatement cost ($/tCO₂ for available decarbonization options), Carbon cost pass-through capacity, and Energy price sensitivity. SBTi Sectoral Decarbonisation Approach (SDA) provides sector-specific emission pathways to 2050.

**Standards:** ['IEA', 'IPCC AR6 WGIII', 'SBTi SDA']
**Reference documents:** IEA World Energy Outlook 2024; IPCC AR6 WGIII Chapter 11-16; SBTi Sectoral Decarbonisation Approach; McKinsey Global Abatement Cost Curve

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most sibling benchmarking modules, this page is built on **hand-curated, static reference data**
(no `sr()` PRNG) for 6 GICS sectors (Energy, Materials, Industrials, Utilities, Real Estate, and — per the
`SECTORS` array continuing past the excerpt — a 6th sector), each with: a 4-pillar PACE score, an SBTi
alignment %, an implied `pathway`/`temp_2100`, emissions figures (2019 actual, 2030/2050 targets), green/
brown revenue split, a named marginal-abatement-cost (MAC) curve, and a 2019–2030 emissions trajectory.

```js
paceComposite(s) = (pace.physical + pace.abatement + pace.carbon_cost + pace.energy_price) / 4
```

`abatementData` builds a running cumulative-abatement series for the MAC curve chart:

```js
cum = 0
abatementData = sector.abatement_curve.map(m => { cum += m.abatement; return {...m, cumulative: cum}; })
```

### 7.2 Parameterisation — PACE pillar scores and sector fundamentals

| Sector | Physical | Abatement | Carbon Cost | Energy Price | **PACE composite** | SBTi aligned | Pathway | Stranded risk |
|---|---|---|---|---|---|---|---|---|
| Energy | 72 | 38 | 85 | 65 | **65.0** | 22% | Not Aligned (3.8°C) | Critical |
| Materials | 58 | 55 | 70 | 72 | **63.8** | 34% | Below 2°C (2.8°C) | High |
| Industrials | 48 | 62 | 55 | 58 | **55.8** | 41% | Well-below 2°C (2.2°C) | Medium |
| Utilities | 65 | 75 | 60 | 80 | **70.0** | 58% | Well-below 2°C (2.0°C) | Medium |
| Real Estate | 55 | 68 | 40 | 62 | **56.3** | 29% | Below 2°C (2.5°C) | (n/a, excerpt cut) |

All four pillar scores, `sbti_aligned_pct`, `pathway`, `temp_2100`, and emissions figures are
**hand-authored constants per sector** — internally consistent with each other (Energy has the worst
implied temperature and lowest SBTi alignment, matching its low Abatement score) but not derived from a
live IEA/IPCC/SBTi dataset in code; treat as a curated illustrative dataset, directionally credible but not
independently source-cited per cell.

| Sector | Sample abatement-curve measures (abatement Mt, $/tCO₂) |
|---|---|
| Energy | Methane leak fix (820 Mt, **−$15**), Solar PV (1,200 Mt, $12), Wind (980 Mt, $18), CCS on power (2,400 Mt, $65), Blue H₂ (1,100 Mt, $90), DAC (450 Mt, $280) |
| Materials | EAF steel (1,100 Mt, $20), Clinker reduction (680 Mt, $8), Industrial heat pump (420 Mt, $35), Green H₂ steel (1,800 Mt, $95), CCS cement (950 Mt, $120) |
| Utilities | Solar PV scale-up (2,200 Mt, $10), Onshore wind (1,800 Mt, $14), Battery storage (900 Mt, $45), Coal retirement (1,600 Mt, $0), Offshore wind (1,400 Mt, $55) |

These MAC curve entries mirror the real McKinsey Global Abatement Cost Curve convention (negative-cost
efficiency measures first, escalating through renewables/electrification into expensive DAC/blue hydrogen)
— directionally faithful to published MAC curves, though the specific $/tCO₂ and Mt figures are
platform-curated rather than pulled live from a McKinsey dataset.

### 7.3 Calculation walkthrough

1. `paceComposite(sector)` is called wherever a headline PACE score is shown (Sector Scorecards, PACE
   Analysis radar, PACE bar chart) — always the unweighted 4-pillar mean, no pillar is weighted more
   heavily than another despite sectors plausibly having different sensitivity profiles (e.g. Energy's
   carbon-cost pillar arguably should dominate its composite more than its energy-price pillar).
2. **PACE Analysis tab** — builds a 5-axis radar (`Physical Risk, Abatement, Carbon Cost, Energy Price,
   Composite`) per sector using `Object.fromEntries(SECTORS.map(...))`, i.e. one radar overlay per sector,
   directly from the static pillar constants.
3. **SBTi Pathways tab** — renders `sbti_aligned_pct` as a horizontal bar per sector (blue fill width =
   `sbti_aligned_pct`%), a direct 1:1 mapping of the static constant, no computation.
4. **Abatement Cost Curves tab** — `abatementData` accumulates each sector's named measures **in their
   listed array order** (not sorted ascending by `cost`), so the "cumulative" MAC curve chart is only a true
   MAC curve if the source array happens to already be cost-sorted — for Energy, the listed order
   (Methane −15 → Solar 12 → Wind 18 → CCS 65 → Blue H₂ 90 → DAC 280) is indeed monotonically increasing by
   cost, so the curve renders correctly for that sector, but this is not enforced by a `.sort()` call, so a
   future sector added with an unsorted `abatement_curve` array would render an incorrect (non-monotonic)
   MAC curve.
5. **Emissions Trajectories tab** — plots each sector's `trajectory` array (`actual` vs `target` per year,
   with `actual: null` for future years 2025/2030) — a real vs. plan comparison chart using the hand-curated
   historical/target figures.

### 7.4 Worked example

Energy sector PACE composite: `(72 + 38 + 85 + 65) / 4 = 260/4 = 65.0` — matches the table above.
Cumulative MAC for Energy through the first 3 measures: `820 (Methane) → 820+1,200=2,020 (Solar) →
2,020+980=3,000 (Wind)` Mt CO₂e abated at ≤$18/tCO₂e, before the curve crosses into the CCS/Blue H₂/DAC
tier (≥$65/tCO₂e) — a genuine MAC-curve read: roughly 3.0 Gt of Energy-sector abatement is available at
"cheap" (<$20/tCO₂e) cost before expensive measures are needed.

### 7.5 Companion analytics on the page

- **Emissions Trajectory vs Target** — for Energy: `emissions_2019=15,800`, actual through 2023 dipped to
  13,200 (2020, COVID effect) then rose back to 14,900 (2023), while `target` declines steadily to 8,900 by
  2030 — visually shows the sector falling behind its own stated pathway, a genuine and useful "actual vs
  plan" gap read using real-shaped (COVID-dip-then-rebound) historical data.
- **Stranded-asset risk rating** (`Critical`/`High`/`Medium`) and letter `rating` (`E`/`D`/`C`) per sector
  are additional hand-set qualitative labels, broadly consistent with (but not formulaically derived from)
  the PACE composite and `temp_2100` figures.

### 7.6 Data provenance & limitations

- **All sector data is static and hand-curated** — a meaningful step up in rigor from `sr()`-random sibling
  modules in that the numbers are internally consistent and directionally correct, but there is no live data
  pipeline; updating requires manually editing the `SECTORS` array.
- `paceComposite` is an unweighted 4-pillar average — no cited methodology assigns equal 25% weight to
  Physical Risk, Abatement Cost, Carbon Cost pass-through, and Energy Price Sensitivity; a production PACE
  score would need pillar weights calibrated to their actual predictive relationship with transition
  outcomes.
- The MAC curve's cumulative computation trusts input ordering rather than sorting by `cost` — a latent
  correctness risk if a sector's `abatement_curve` array is ever entered out of cost order.
- `sbti_aligned_pct`/`pathway`/`temp_2100`/emissions figures are illustrative, sector-level constants —
  useful for narrative/demo purposes but not sourced from a live SBTi Target Dashboard or IEA WEO dataset.

**Framework alignment:** IEA World Energy Outlook (informs the shape/scale of sectoral emissions and
transition-capex figures) · IPCC AR6 WGIII (chapter-level informs the abatement-measure taxonomy per
sector) · SBTi Sectoral Decarbonisation Approach (SDA) — `sbti_aligned_pct`/`pathway` fields mirror SDA's
temperature-pathway classification (1.5°C / Well-below 2°C / Below 2°C / Not Aligned) though the underlying
percentage is not computed from SBTi's live target dashboard · McKinsey Global Abatement Cost Curve — the
`abatement_curve` structure (measure, Mt abated, $/tCO₂e) directly mirrors McKinsey's MAC curve convention.

## 9 · Future Evolution

### 9.1 Evolution A — Carbon-price scenarios over a live-refreshed PACE dataset (analytics ladder: rung 1 → 2)

**What.** This tier-B page is a cut above its `sr()`-seeded siblings — the 6-sector PACE data is hand-curated, internally consistent, and directionally correct (§7.6) — but it is static (updating requires editing the `SECTORS` array), the `paceComposite` is an uncited equal-25% average, and the MAC-curve cumulative sum trusts input ordering rather than sorting by cost (a latent correctness bug the deep-dive flags). Evolution A adds the scenario dimension the framework begs for: recompute Carbon Cost and Abatement pillars under user-selected carbon-price paths (NGFS scenario prices are already used elsewhere on the platform) and refresh the static anchors from live sources.

**How.** (1) Sort `abatement_curve` by `$/tCO₂` before the cumulative map — one-line fix, do it first. (2) Parameterise the MAC chart: measures below the scenario carbon price are "in the money"; the crossover point becomes a computed output per sector per scenario. (3) Replace hardcoded `sbti_aligned_pct` with the SBTi target-dashboard public export via a small refresh job, and emissions trajectories with IEA WEO sectoral series where licensing permits. (4) Make pillar weights explicit and user-adjustable with the equal-weight default labelled as convention, addressing the §7.6 caveat that no cited methodology assigns 25/25/25/25.

**Prerequisites.** SBTi export ingestion; a decision on IEA data licensing (fallback: keep curated values but stamp vintage + source per field). **Acceptance:** MAC cumulative totals are invariant to input array order; changing the carbon-price scenario visibly re-ranks in-the-money abatement measures.

### 9.2 Evolution B — Sector transition-brief writer (LLM tier 1)

**What.** The PACE scorecard's natural output is a written sector brief — "why does Utilities score 70.0 while Energy scores 65.0, and what does Energy's 3.8°C pathway imply for holdings?" Evolution B is a copilot that composes that brief strictly from the module's own data: the 4 pillar scores, SBTi alignment, stranded-risk rating, green/brown revenue split, and the MAC curve's cheapest remaining abatement options, cross-referenced against the IPCC AR6 WGIII measure taxonomy the curve already mirrors.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sector-transition-scorecard/ask`, corpus = this Atlas record (§7.2 pillar table is the core grounding) plus live page state (selected sector and, post-Evolution-A, the active carbon-price scenario). Comparative questions ("rank sectors by abatement optionality") are answered by deterministic sorts the copilot narrates, not by LLM arithmetic. The brief template ends with the data-vintage stamp so readers know when the curated constants were last refreshed.

**Prerequisites.** None hard — the static data is honest enough to narrate today if every answer carries the "curated, not live" caveat from §7.6; Evolution A removes the need for that caveat. **Acceptance:** every figure in a generated brief appears in the `SECTORS` dataset or a computed sort of it; questions about sectors outside the 6 covered return a refusal naming the coverage limit.