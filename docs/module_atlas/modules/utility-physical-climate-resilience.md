# Utility Physical Climate Risk & Asset Resilience
**Module ID:** `utility-physical-climate-resilience` · **Route:** `/utility-physical-climate-resilience` · **Tier:** B (frontend-computed) · **EP code:** EP-EL5 · **Sprint:** EL

## 1 · Overview
Multi-peril physical risk scoring for 15 utility assets (T&D substations, gas compressors, hydro dams, water treatment, offshore wind, solar, nuclear, control centres) across flood/heat/wind/wildfire/ice perils, hardening measure cost-effectiveness matrix (10 interventions), RCP 2.6/4.5/8.5 annual loss trajectories, insurance gap analysis, SAIDI/SAIFI improvement by intervention, and adaptation finance structures.

> **Business value:** Used by utility climate risk officers conducting TCFD physical risk assessment, infrastructure investors stress-testing asset values under RCP scenarios, and insurance underwriters pricing utility physical risk coverage.

**How an analyst works this module:**
- Click any asset row to load its multi-peril risk profile with flood/heat/wind/wildfire/ice scores and RCP scenario loss figures
- On Physical Risk Map tab, view the portfolio average peril exposure radar and select assets for individual risk deep-dives
- Review Hardening Economics tab for all 10 interventions ranked by risk reduction%, payback period, and ERCOT credit eligibility
- In Loss Trajectory tab, toggle between RCP 2.6/4.5/8.5 scenarios to see diverging annual loss % curves through 2044

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `HARDENING_MEASURES`, `INSURANCE_GAP`, `KpiCard`, `LOSS_TIMELINE`, `PERIL_RADAR`, `Pill`, `RiskBar`, `SAIDI_IMPROVEMENT`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSETS` | 16 | `name`, `type`, `region`, `flood_risk`, `heat_risk`, `wind_risk`, `wildfire`, `ice_storm`, `rav`, `hardening_capex`, `insurance_coverage`, `aep_loss_pct`, `saidi_impact`, `adaptation_roi`, `rcp45_loss`, `rcp85_loss` |
| `HARDENING_MEASURES` | 11 | `cost_per_site`, `peril`, `risk_reduction`, `payback_yrs`, `ercot_credit` |
| `SAIDI_IMPROVEMENT` | 7 | `saidi_before`, `saidi_after`, `cost`, `bcr` |
| `PERIL_RADAR` | 6 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `types` | `['All', ...new Set(ASSETS.map(a => a.type))];` |
| `filtered` | `useMemo(() => filterType === 'All' ? ASSETS : ASSETS.filter(a => a.type === filterType), [filterType]);  const totalRAV = useMemo(() => ASSETS.reduce((s,a)=>s+a.rav,0),[]);` |
| `totalHardening` | `useMemo(() => ASSETS.reduce((s,a)=>s+a.hardening_capex,0).toFixed(0),[]);` |
| `avgInsGap` | `useMemo(() => Math.round(ASSETS.reduce((s,a)=>s+(1-a.insurance_coverage),0)/ASSETS.length*100),[]);` |
| `totalAAEL` | `useMemo(() => (ASSETS.reduce((s,a)=>s+a.rav*a.aep_loss_pct/100,0)/1000).toFixed(1),[]);` |
| `tabs` | `['Asset Universe', 'Physical Risk Map', 'Hardening Economics', 'Loss Trajectory', 'Insurance Gap', 'SAIDI/Reliability', 'Adaptation Finance'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `HARDENING_MEASURES`, `PERIL_RADAR`, `SAIDI_IMPROVEMENT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| US utility storm costs (2022–23) | `Insurance and uninsured losses from weather events affecting electric utilities` | NOAA Billion-Dollar Weather Events 2023 | Average annual increase 8.5% since 2000; 2022 record year $165Bn total weather losses; utilities carrying increasing self-insured retention as commercial rates rise 20-40% pa. |
| Average insurance gap (T&D) | `Uninsured physical exposure as % of RAV` | Lloyd's of London Infrastructure Risk Survey 2023 | Transmission assets typically 65-75% insured; distribution 55-65%; water treatment 58-75%; increasing climate risk driving insurers to reduce exposure in high-risk regions (Florida/Gulf Coast/California). |
| Grid hardening BCR | `Benefit-cost ratio for various hardening interventions` | EPRI Grid Resilience Investment Framework 2022 | ADMS deployment highest BCR at 4.4× (low capex, broad SAIDI benefit); underground cable conversion lowest BCR at 3.2× (high capex, comprehensive risk reduction). |
- **NERC CIP-014 + IPCC AR6 + Swiss Re thermal stress + EPRI grid resilience + FEMA BRIC grant criteria + Lloyds infrastructure risk + EU Taxonomy climate adaptation criteria** → 15-asset risk universe + multi-peril scoring + hardening economics + RCP loss trajectories + insurance gap + SAIDI improvement + adaptation finance → **Climate risk officers at utilities, infrastructure investors conducting TCFD physical risk scenario analysis, insurance underwriters pricing utility asset risk, and ESG analysts assessing utility adaptation investment programmes**

## 5 · Intermediate Transformation Logic
**Methodology:** Physical Risk Loss Modelling & Hardening ROI
**Headline formula:** `AAEL = RAV × AEP_Loss_Pct / 100; Hardening_ROI = (AAEL_Before − AAEL_After) × PV_Factor / Capex; Insurance_Gap = RAV × (1 − Coverage_Ratio); Adaptation_BCR = Σ(Loss_Avoided_t) / (1+r)^t / Hardening_Capex; SAIDI_Improvement = (SAIDI_Before − SAIDI_After) × Customer_Minutes_Value`

US Winter Storm Uri (Feb 2021): ~4.5M Texas customers lost power for 3+ days; ~$100Bn economic losses; ERCOT grid failure linked to lack of weatherisation standards; led to Texas SB 3 weatherisation mandate and $800M hardening programme.

**Standards:** ['NERC Physical Security Standards CIP-014', 'IPCC AR6 Chapter 6 — Adaptation Limits and Loss & Damage', 'Swiss Re Institute — Thermal Stress on Electricity Infrastructure 2023']
**Reference documents:** Swiss Re (2023) – Thermal Stress and the Electricity Sector; EPRI (2022) – Grid Resilience Investment Framework; NERC (2023) – Long-Term Reliability Assessment — Physical Risk Chapter

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry lists four formulas — `AAEL`,
> `Hardening_ROI`, `Insurance_Gap`, `Adaptation_BCR`, `SAIDI_Improvement`. Only **one** of the five,
> `AAEL = RAV × AEP_Loss_Pct / 100`, is actually computed in code. `Insurance_Gap` is computed too
> (`RAV × (1 − coverage)`), but the other three — `Hardening_ROI`, `Adaptation_BCR`, and the SAIDI
> before/after improvement — are **hardcoded per-row attributes** (`adaptation_roi`, `bcr`,
> `saidi_before/after`) baked into the seed arrays, not derived from the stated formulas anywhere in
> the component. The sections below separate what is genuinely calculated from what is display-only.

### 7.1 What the module computes

For 15 named utility assets (substations, gas infrastructure, hydro, water treatment, offshore wind,
solar, nuclear, control centres), two portfolio KPIs are genuinely derived from per-asset primitives:

```js
AAEL_portfolio  = Σ(rav_i × aep_loss_pct_i / 100) / 1000        // $Bn, "Portfolio AAEL" KPI
InsGap_avg      = Σ(1 − insurance_coverage_i) / 15 × 100          // %, "Avg Insurance Gap" KPI
InsGap_i        = rav_i × (1 − insurance_coverage_i)              // per-asset gap, $M (INSURANCE_GAP table)
totalRAV        = Σ rav_i ;  totalHardening = Σ hardening_capex_i
```

Everything else displayed per asset — `hardening_capex`, `insurance_coverage`, `saidi_impact`,
`adaptation_roi`, `rcp45_loss`, `rcp85_loss` — is a **fixed attribute set by the author** for each of
the 15 named assets (e.g. Coastal Transmission Substation A: `rav=$85M`, `flood_risk=0.82`,
`adaptation_roi=2.8×`), not a function of the five multi-peril risk scores.

### 7.2 Parameterisation

| Field | Range across the 15 assets | Provenance |
|---|---|---|
| `rav` (regulatory asset value) | $28M – $4,200M (nuclear outlier) | Author-assigned per named asset |
| Peril scores (flood/heat/wind/wildfire/ice) | 0.02 – 0.96 | Author-assigned, plausible by asset type/region (e.g. Mojave solar `heat_risk=0.96`) |
| `insurance_coverage` | 0.55 – 0.95 | Author-assigned; nuclear highest (0.95), UK pipeline lowest (0.55) |
| `adaptation_roi` | 1.6× – 5.8× | Author-assigned "×" multiple, not derived from `HARDENING_MEASURES.risk_reduction/payback_yrs` |
| `HARDENING_MEASURES.risk_reduction` | 58% – 92% | Static table, 10 interventions, independent of the 15-asset universe |
| `SAIDI_IMPROVEMENT.bcr` | 2.8× – 5.2× | Static table, matches guide's cited EPRI 2.4–5.8× range but not computed from `cost`/`saidi_before-after` |

### 7.3 Calculation walkthrough

1. **Asset Universe tab** renders `ASSETS` directly with colour-coded thresholds (peril `>0.7` red,
   `>0.45` amber) — pure display logic, no aggregation.
2. **Physical Risk Map tab** — `PERIL_RADAR` averages each of the 5 peril scores across all 15 assets
   (`Σ score_i / 15 × 100`) for the portfolio radar; selecting an asset swaps in its own row.
3. **Hardening Economics tab** — lists the 10 `HARDENING_MEASURES` sorted/filtered by
   `risk_reduction`, `payback_yrs`, and an `ercot_credit` boolean flag; no linkage back to which of
   the 15 assets would receive each measure.
4. **Loss Trajectory tab** — `LOSS_TIMELINE` (2025–2044) plots RCP 2.6/4.5/8.5 and an "insured" loss
   series that grow via `base + i·slope + sr(seed)·noise` — an illustrative monotonically-rising
   curve, not a peril-conditioned catastrophe model.
5. **Insurance Gap tab** — `INSURANCE_GAP` (built from the first 8 `ASSETS`) shows `total_exposure`,
   `insured = round(rav × coverage)`, `gap = round(rav × (1−coverage))`, `gap_pct`.
6. **SAIDI/Reliability tab** — `SAIDI_IMPROVEMENT` bar/scatter (before vs after, cost vs BCR) is a
   static 6-row table entirely independent of the 15-asset SAIDI impact field.
7. **Adaptation Finance tab** — six named instrument templates (Green UoP Bond, SLB, ERCOT
   securitisation, FEMA BRIC grant, resilience cat bond, IFC/WB loan) with fixed size/tenor/rate —
   illustrative deal comps, not computed from portfolio hardening need.

### 7.4 Worked example

Coastal Gas Terminal I: `rav = $520M`, `aep_loss_pct = 4.8%`, `insurance_coverage = 0.72`.

| Step | Computation | Result |
|---|---|---|
| AAEL (this asset) | 520 × 4.8 / 100 | **$24.96M/yr** |
| Insurance gap $ | 520 × (1 − 0.72) | **$145.6M** |
| Insurance gap % | (1 − 0.72) × 100 | **28%** |
| RCP 8.5 loss (2044, illustrative) | `rcp85_loss` field | **12.4%** (static, not derived from AAEL) |

Portfolio AAEL (all 15 assets) sums to the "$X.XB" KPI — with the $4.2Bn nuclear RAV at only 0.8%
AEP loss contributing $33.6M, comparable in magnitude to the $520M gas terminal's $25M despite being
8× the asset value, because AAEL is loss-rate-driven, not RAV-driven.

### 7.5 Data provenance & limitations

- **All 15 assets, the 10 hardening measures, the SAIDI table, and the 6 finance instruments are
  synthetic/illustrative** — author-curated point values, not sourced from an actual utility asset
  register, EPRI cost-effectiveness study, or live bond pricing feed, despite plausible calibration
  to the guide's cited ranges (EPRI BCR 2.4–5.8×, Lloyd's 32% insurance gap).
- Only `AAEL` and `Insurance_Gap` are formulaically derived; `Hardening_ROI`, `Adaptation_BCR`, and
  SAIDI improvement are **not computed from the AAEL-before/AAEL-after difference the guide's formula
  implies** — they are independent hardcoded fields, so changing `hardening_capex` for an asset does
  not move its displayed `adaptation_roi`.
- No peril-specific damage function (Jensen wind-loss curve, FEMA HAZUS flood-depth-damage curve,
  etc.) underlies the loss trajectory — RCP curves are smoothed random-walk illustrations.
- No linkage between the 10 generic hardening measures and the 15 specific assets — a production
  tool would need an asset-to-measure applicability matrix.

**Framework alignment:** NERC CIP-014 (named, physical security standard — not implemented as a
compliance check) · IPCC AR6 Ch.6 adaptation-limits framing (RCP labels only) · Swiss Re thermal-
stress research (cited as `brief`, not wired into `heat_risk`) · EU Taxonomy Art. 10 climate
adaptation (named in Key Frameworks panel, descriptive only).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Grid Hardening Investment model would let a utility CFO or infrastructure lender size
and prioritise capex across a real asset register, answering: which hardening measures at which
sites maximise avoided AAEL per dollar, and what SAIDI/insurance-premium benefit follows. Scope:
transmission, generation, gas and water utility assets with multi-peril physical exposure.

### 8.2 Conceptual approach
Combine (1) **catastrophe-model-style average annual loss (AAL)** estimation per FEMA HAZUS / RMS
methodology — hazard intensity × exposure × vulnerability (damage) function, aggregated over a
peril-frequency distribution — with (2) **EPRI Grid Resilience Investment Framework** benefit-cost
ranking, which nets avoided AAL and avoided customer-minutes-lost against measure capex. Benchmark:
Moody's RMS North Atlantic Hurricane Model for peril severity curves; EPRI's public BCR framework for
measure ranking (this platform's own cited source, currently unimplemented).

### 8.3 Mathematical specification

```
AAL_i,peril   = Σ_k P(intensity_k) · DamageFn_peril(intensity_k) · RAV_i      // per asset, per peril
AAL_i         = Σ_peril AAL_i,peril  (with peril-correlation adjustment, not simple sum, if compound events matter)
AAL_after_i,m = AAL_i · (1 − RiskReduction_m)                                 // after hardening measure m
NPV_avoided_i,m = Σ_{t=1..T} (AAL_i − AAL_after_i,m) / (1+r)^t
BCR_i,m       = NPV_avoided_i,m / Capex_m
SAIDI_Δ_i,m   = (SAIDI_before_i − SAIDI_after_i,m) · CustomerMinutesValue     // $ reliability benefit
InsGapValue_i = RAV_i · (1 − Coverage_i) · P(loss > deductible)              // risk-adjusted, not flat
```

| Parameter | Calibration source |
|---|---|
| `DamageFn_peril` (vulnerability curves) | FEMA HAZUS depth-damage functions (flood); NOAA/ASCE 7 wind-damage curves |
| `P(intensity_k)` | NOAA Atlas 14 (flood), ASCE 7-22 wind maps, NIFC wildfire probability layers |
| Discount rate `r` | Utility regulatory WACC (Ofgem/FERC allowed return), typically 5–7% real |
| `RiskReduction_m` per measure | EPRI Grid Resilience Investment Framework 2022 (public) |
| `CustomerMinutesValue` | Regulator-published VoLL (Value of Lost Load), e.g. Ofgem CDCM |

### 8.4 Data requirements
Real asset register with geocodes (for hazard-layer intersection), FEMA/NOAA/ASCE hazard raster
data (public), EPRI measure cost-effectiveness table (licensed), utility SAIDI/SAIFI regulatory
filings (public via PUC dockets), and bond/insurance market pricing feeds. The platform's existing
`ASSETS`/`HARDENING_MEASURES` schemas are directly reusable containers once populated from real
sources; `reference_data` tables would need new `hazard_layers` and `epri_measures` entries.

### 8.5 Validation & benchmarking plan
Backtest AAL estimates against realised storm losses (e.g. Winter Storm Uri, Hurricane Ian) for
comparable asset classes; reconcile against RMS/Verisk cat-model outputs where licensed; sensitivity-
test BCR ranking stability under ±20% hazard-frequency perturbation (NGFS-style scenario stress).

### 8.6 Limitations & model risk
Compound/cascading perils (e.g. flood-triggered grid failure amplifying heat-stress outages) are not
captured by a peril-additive AAL sum — a production model needs a correlation/copula structure for
tail events. Vulnerability curves are asset-type generic; site-specific engineering assessment
(structural condition, elevation) should override generic curves where available, with the generic
curve as a conservative fallback.

## 9 · Future Evolution

### 9.1 Evolution A — Derived hardening ROI on the platform's hazard grids (analytics ladder: rung 1 → 2)

**What.** Only two of the guide's five formulas are real today (`AAEL = RAV ×
AEP_loss%` and `Insurance_Gap = RAV × (1−coverage)`); §7 flags that `Hardening_ROI`,
`Adaptation_BCR`, and SAIDI improvement are hardcoded per-row fields — changing an
asset's `hardening_capex` never moves its displayed `adaptation_roi` — and the 10
hardening measures have no linkage to the 15 assets. Evolution A implements the §8
spec's core loop: `AAL_after = AAL × (1 − RiskReduction_m)` per applicable
asset-measure pair, discounted at regulatory WACC into `BCR = NPV_avoided / Capex`,
with an asset-to-measure applicability matrix (flood barriers don't apply to the
Mojave solar site). Peril scores stop being author-assigned: geocode the 15 assets and
resolve flood/wind/wildfire drivers from the platform's populated `ref_*_zones`
digital-twin grids (real USGS/IBTrACS/GWIS/OpenFEMA sources), keeping heat/ice as
curated values until sources exist.

**How.** New backend `utility_resilience_engine` (module is Tier B, EP-EL5) with
`POST /aal`, `POST /hardening-rank`; RCP loss trajectories re-derived from
peril-conditioned AAL scaling rather than the current smoothed random-walk curves
(§7.3 step 4). Pin the Coastal Gas Terminal I worked example in `bench_quant`.

**Prerequisites.** The random-walk LOSS_TIMELINE acknowledged and replaced; asset
geocodes added to the seed data; flood grid coverage caveat (48 rows, named-city
samples) stated in output metadata. **Acceptance:** editing `hardening_capex` changes
BCR on the page; each measure's ranked list only contains applicable assets; bench pin
reproduces AAEL $24.96M for the gas terminal.

### 9.2 Evolution B — Resilience-capex copilot for TCFD filings and PUC dockets (LLM tier 2)

**What.** The module's users (utility climate risk officers, infrastructure lenders)
need defendable narratives: "justify the $X hardening programme to the regulator" or
"write the TCFD physical-risk section for our T&D segment." Evolution B is a
tool-calling assistant over Evolution A's endpoints: it runs `POST /hardening-rank`
for the portfolio, cites each asset's AAL, insurance gap, and measure-level BCR from
tool outputs, and drafts the filing text mapped to the module's real reference
frameworks (NERC CIP-014, EPRI Grid Resilience Investment Framework, EU Taxonomy
adaptation criteria) — including honest statements about which perils are grid-sourced
versus curated.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; system prompt
assembled from this Atlas page with the §7.5 limitations block included so the copilot
states, for example, that SAIDI benefits use regulator-published VoLL assumptions.
Adaptation-finance instrument templates (the 6 illustrative deals on the Finance tab)
are presented as comps, never as live pricing.

**Prerequisites (hard).** Evolution A's engine — narrating today's hardcoded
`adaptation_roi` fields would launder author-assigned numbers into regulatory filings.
**Acceptance:** every $ figure and BCR in a drafted filing traces to a tool call;
asked for a cat-model PML the engine doesn't compute, the copilot refuses and names
the AAL metric it does have.