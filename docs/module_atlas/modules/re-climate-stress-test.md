# RE Climate Stress Test
**Module ID:** `re-climate-stress-test` · **Route:** `/re-climate-stress-test` · **Tier:** B (frontend-computed) · **EP code:** EP-EI4 · **Sprint:** EI

## 1 · Overview
NGFS-aligned climate stress testing for real estate portfolios: 4 scenario stress parameters (LTV/NOI/cap rate/vacancy), 6 sector risk profiles, 20-asset portfolio stress table, Radar chart for physical vs transition risk, and stressed NAV vs base NAV calculation.

> **Business value:** Used by real estate lenders running NGFS stress tests on mortgage books, REIT CFOs preparing TCFD scenario disclosures, and supervisory teams assessing physical and transition risk exposure.

**How an analyst works this module:**
- Select NGFS scenario to see LTV/NOI/cap rate/vacancy stress parameters applied to portfolio
- Review 6 sector risk profiles for physical and transition stress dimensions
- Analyse 20-asset portfolio stress table comparing stressed NAV vs base NAV
- Use physical vs transition risk radar to identify sector-level vulnerability patterns

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PORTFOLIO`, `Pill`, `SCENARIOS`, `SECTOR_RISK`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 5 | `label`, `physTemp`, `transRisk`, `physRisk`, `ltv_impact`, `noi_impact`, `capRate_impact`, `vacancy_impact` |
| `SECTOR_RISK` | 7 | `physRisk`, `transRisk`, `epcExposure`, `floodExposure`, `heatExposure`, `overallRisk` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sel` | `useMemo(() => SCENARIOS.find(s => s.id === scenario) \|\| SCENARIOS[1], [scenario]);  const portfolioValue = useMemo(() => PORTFOLIO.reduce((a, p) => a + p.value, 0), []);` |
| `stressedValue` | `useMemo(() => (portfolioValue * (1 + sel.ltv_impact / 100)).toFixed(0), [portfolioValue, sel]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SCENARIOS`, `SECTOR_RISK`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Net Zero 2050 LTV impact | `Transition risk managed; physical risk limited` | NGFS Scenarios v4.0 2023 | Orderly transition: early action limits physical damage; managed transition costs are priced in gradually. |
| NGFS Hot House LTV impact | `Under 4°C unmitigated warming by 2100` | NGFS Physical Risk Scenarios 2023 | Severe physical damage (flooding, heat stress) undermines asset values; transition costs also higher due to late policy action. |
| EBA Pillar 2 climate add-on | `Additional capital for physical risk exposed RE` | EBA Climate Risk Management Guidelines 2023 | Supervisors increasingly applying P2 add-ons for banks with high concentration in physically exposed RE collateral. |
- **NGFS v4.0 + TCFD + ECB Climate Stress Test + EBA Climate Risk Guidelines** → Scenario selector + sector stress profiles + asset stress table + radar analysis + stressed NAV calc → **Real estate lenders, REIT CFOs, climate risk teams, and bank supervisory analysts**

## 5 · Intermediate Transformation Logic
**Methodology:** Stressed NAV
**Headline formula:** `StressedNAV = BaseNAV × (1 + ΔLTV_impact) × (1 + ΔNOI_impact / CapRate); Stressed_CapRate = BaseCapRate + Δcap_rate; Stressed_NOI = BaseNOI × (1 + ΔNOI_pct); StressedValue = StressedNOI / Stressed_CapRate`

ECB 2022 stress test found climate risk adds 10–15% additional loss given default for commercial RE under severe physical risk scenarios.

**Standards:** ['NGFS Climate Scenarios 2023', 'TCFD Scenario Analysis Guidance 2021', 'ECB Climate Risk Stress Test 2022']
**Reference documents:** NGFS (2023) – Climate Scenarios for Central Banks and Supervisors v4.0; ECB (2022) – Economy-Wide Climate Stress Test; EBA (2023) – Climate Risk Management Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The guide's formula chain —
> `StressedNAV = BaseNAV × (1+ΔLTV) × (1+ΔNOI/CapRate)`, `Stressed_CapRate = BaseCapRate+Δcap_rate`,
> `StressedValue = StressedNOI / StressedCapRate` — describes a full income-capitalisation
> revaluation. **Only the LTV term is actually implemented** (`stressedValue = portfolioValue ×
> (1 + ltv_impact/100)`); NOI, cap-rate, and vacancy impacts are displayed as standalone KPI cards
> but never combined into the stressed NAV formula. Additionally, the **20-asset portfolio table is
> scenario-invariant** — each asset's `physStress`/`transStress`/`totalImpact` is seeded once at
> module load and does not change when the user switches NGFS scenarios, even though it renders
> directly beneath the scenario selector.

### 7.1 What the module computes

**Scenario selection** drives exactly one live number:
```js
sel           = SCENARIOS.find(s => s.id === scenario)
stressedValue = portfolioValue × (1 + sel.ltv_impact / 100)      // the ONLY formula using `sel`
```
`portfolioValue = Σ PORTFOLIO[].value` (20 assets, fixed `sr()`-seeded values €20–200M each,
summing to a constant ≈€2.1Bn regardless of scenario). The other four scenario fields
(`noi_impact`, `capRate_impact`, `vacancy_impact`, `physTemp`) are read directly into KPI cards
but never enter `stressedValue` or any other computed quantity.

**Portfolio heatmap** (20 assets): `physStress = sr(i·23)×30`, `transStress = sr(i·31)×45`,
`totalImpact = −sr(i·37)×28` — three **independent per-asset seeds set once at module load**,
outside any scenario-dependent function, so they are identical whichever of the 4 NGFS scenarios
is selected.

### 7.2 Parameterisation

| Scenario | Warming | LTV impact | NOI impact | Cap rate | Vacancy Δ | Provenance |
|---|---|---|---|---|---|---|
| Net Zero 2050 | 1.5°C | −3.2% | −1.8% | +0.25% | +0.5% | Directionally consistent with NGFS orderly-transition framing (mildest impact) |
| Below 2°C (Delayed) | 1.8°C | −8.5% | −5.2% | +0.65% | +2.2% | Disorderly-transition framing — plausible magnitude escalation |
| Nationally Determined | 2.7°C | −15.0% | −9.5% | +1.10% | +4.8% | Hot-house-adjacent framing |
| Current Policies (3.5°C) | 3.5°C | −28.0% | −18.0% | +2.20% | +10.5% | Worst-case — magnitude order (−28% LTV, +10.5pp vacancy) exceeds even the ECB 2022 stress test's severe-scenario CRE losses (~10-15%), i.e. more punitive than the cited benchmark |
| `SECTOR_RISK` (6 property types) | — | — | — | — | — | Static physical/transition/EPC/flood/heat risk scores per sector, correctly ranked (Secondary Office highest transition risk 80 — EPC-exposed older stock; Logistics lowest — newer, more efficient) |

### 7.3 Calculation walkthrough

Selecting a scenario updates 5 KPI cards (Warming Pathway, LTV Impact, NOI Impact, Cap Rate Shift,
Vacancy Delta) by simple object-field lookup, and recomputes `stressedValue` from `ltv_impact`
only. The **Portfolio Heatmap tab (Tab 0)** — the only tab with asset-level granularity — does not
re-render its numbers on scenario change; a user comparing "Net Zero 2050" vs "Current Policies"
side-by-side would see identical per-asset stress figures despite the scenario banner and KPI
cards changing dramatically above the table.

### 7.4 Worked example

`portfolioValue = Σ 20 assets ≈` (illustrative, since exact `sr()` outputs require running the
code) **€2,100M** for this example. Switching from Net Zero 2050 to Current Policies:
```
NZ2050:    stressedValue = 2,100 × (1 − 0.032) = 2,100 × 0.968 = €2,032.8M   (−€67.2M)
Below2:    stressedValue = 2,100 × (1 − 0.085) = 2,100 × 0.915 = €1,921.5M   (−€178.5M)
NDC:       stressedValue = 2,100 × (1 − 0.150) = 2,100 × 0.850 = €1,785.0M   (−€315.0M)
HotHouse:  stressedValue = 2,100 × (1 − 0.280) = 2,100 × 0.720 = €1,512.0M   (−€588.0M)
```
This progression is directionally sensible (worse scenario → larger value haircut). But the
20-row table below it would show the *same* twenty `physStress`/`transStress`/`totalImpact`
values in all four cases — so an analyst drilling from the portfolio-level number into "which
assets are driving this" finds no scenario-consistent asset-level attribution.

### 7.5 Companion analytics on the page

- **Sector Risk Radar** — plots the 6 `SECTOR_RISK` property types across `physRisk`, `transRisk`,
  `epcExposure`, `floodExposure`, `heatExposure` on a single static radar (not scenario-adjusted).
- **Physical Risk / Transition Risk tabs** — further slice the same static `PORTFOLIO` and
  `SECTOR_RISK` arrays; still scenario-invariant.
- **Reporting tab** — presumably assembles the above into an export view (not scenario-computed).

### 7.6 Data provenance & limitations

- The 20-asset portfolio is entirely `sr()`-seeded and **does not respond to the scenario
  selector** — this is the most significant functional gap: the module's central use case
  (compare asset-level stress under different NGFS pathways) is not actually implemented.
- `stressedValue` implements only the LTV term of the guide's four-term formula; NOI, cap-rate
  compression, and vacancy are shown but not combined into any NAV or DSCR calculation.
- The "Current Policies" scenario's −28% LTV impact is more severe than the ECB 2022 stress test's
  published severe-scenario CRE loss range, which the guide itself cites as a benchmark
  (10–15% additional LGD) — worth reconciling if this module is meant to align with that study.

### 7.7 Framework alignment

**NGFS Climate Scenarios** — the 4-scenario framing (orderly → disorderly → hot-house) is
correctly ordered by severity and warming pathway. **TCFD Scenario Analysis Guidance** — the
LTV/NOI/cap-rate/vacancy stress-parameter set is the right set of real-estate-specific transmission
channels TCFD scenario analysis calls for, even though only one (LTV) is wired into a computed
output. **ECB Climate Stress Test (2022)** — cited as the source for the "10-15% additional LGD"
benchmark; the module's own Current Policies scenario exceeds this, which should be reconciled or
explicitly justified as a more severe internal house scenario. A full implementation should apply
`Stressed_NOI = NOI×(1+noi_impact)`, `Stressed_CapRate = CapRate+capRate_impact`,
`Stressed_Value = Stressed_NOI/Stressed_CapRate` per-asset (using each asset's own EPC/flood-zone-
adjusted sensitivity), replacing the current single portfolio-level LTV-only haircut and the
scenario-invariant per-asset table.

## 9 · Future Evolution

### 9.1 Evolution A — Full income-capitalisation stress with scenario-responsive assets (analytics ladder: rung 2 → 3)

**What.** §7 flags two concrete defects: only the LTV term of the guide's stress chain is implemented (`stressedValue = portfolioValue × (1 + ltv_impact/100)`), while NOI, cap-rate, and vacancy impacts sit in KPI cards without entering the NAV — and the 20-asset heatmap is scenario-invariant, its per-asset `physStress`/`transStress` seeded once at load, so switching Net Zero 2050 to Current Policies changes the banner but not one asset row. Evolution A implements the full revaluation the guide specifies: `Stressed_NOI = NOI × (1 + ΔNOI − Δvacancy)`, `Stressed_CapRate = CapRate + Δcap`, `StressedValue = Stressed_NOI / Stressed_CapRate`, applied per asset with sector-differentiated sensitivities from the (already correctly ranked) `SECTOR_RISK` table.

**How.** (1) Give each asset NOI and cap-rate fields (derived from value at a sector-typical yield if not supplied) so the income-cap formula is computable per asset. (2) Per-asset stress = scenario impact × sector risk multiplier — making the heatmap scenario-responsive fixes the §7.3 inconsistency where the table contradicts the KPI cards above it. (3) Recalibrate the Current Policies row: §7.2 notes its −28% LTV / +10.5pp vacancy exceeds the ECB 2022 severe-scenario CRE benchmark (~10–15%) the module itself cites — either justify with a cited source or bring within the benchmark band. (4) Move to a small backend route so bench_quant pins the §7.4 example.

**Prerequisites.** Sector-typical cap-rate defaults documented; scenario parameter provenance table extended with citations per row. **Acceptance:** switching scenarios changes every asset row; the four impact channels all move stressed NAV (zeroing any one changes the result); Current Policies magnitudes carry a citation.

### 9.2 Evolution B — TCFD scenario-disclosure copilot (LLM tier 1 → 2)

**What.** The module's stated users — REIT CFOs preparing TCFD scenario disclosures and lenders answering supervisors — need narrative built on the stress outputs. The copilot drafts it: "write the TCFD strategy-resilience paragraph for our portfolio under NGFS Below 2°C, quantifying the NAV impact and naming the most exposed sector", grounded in the computed stress table and the module's scenario parameter provenance.

**How.** Tier 1 first: RAG over this Atlas record (§7.2's parameterisation table with its honesty notes is core corpus) via the standard copilot router, with current-page stress results injected as context. Tier 2 after Evolution A: scenario comparisons run as paired calls to the new stress endpoint, letting the copilot produce the side-by-side NZ2050-vs-CurrentPolicies table §7.4 hand-computes. Required honesty behaviors: disclose that scenario parameters are directional calibrations, not ECB-published shock sets; refuse asset-level physical-risk claims beyond the sector-score granularity the module actually has (per-coordinate hazard belongs to `property-physical-risk`, and the copilot should route there).

**Prerequisites.** Evolution A endpoint for tier 2; scenario-parameter citations completed (a disclosure draft citing uncited shocks is a compliance risk, not a convenience). **Acceptance:** a drafted disclosure's every €M figure matches the stress endpoint; the parameter-provenance caveat appears whenever magnitudes are quoted.