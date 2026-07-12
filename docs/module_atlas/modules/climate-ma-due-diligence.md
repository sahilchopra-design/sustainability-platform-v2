# Climate M&A Due Diligence Engine
**Module ID:** `climate-ma-due-diligence` · **Route:** `/climate-ma-due-diligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DD3 · **Sprint:** DD

## 1 · Overview
Climate M&A due diligence engine assessing target company physical and transition risk, stranded asset exposure, carbon liability quantification, climate-adjusted enterprise value, and TCFD-aligned due diligence checklist.

> **Business value:** Delivers systematic climate M&A due diligence integrating TCFD checklist, carbon liability quantification, stranded asset identification, and physical risk impairment into a climate-adjusted enterprise value.

**How an analyst works this module:**
- Complete TCFD-aligned climate due diligence checklist across governance, strategy, risk management, and metrics
- Quantify carbon liability using Scope 1+2+3 emissions and shadow carbon price trajectory (NGFS orderly/disorderly)
- Identify stranded assets using IEA NZE scenario asset retirement timeline
- Calculate climate-adjusted EV and implied climate risk discount to headline enterprise value

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `CRITERIA_WEIGHTS`, `DEAL_STATUS`, `SBTI_STATUS`, `SECTORS`, `SECTOR_COLORS`, `TABS`, `TARGETS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CRITERIA_WEIGHTS` | 8 | `weight` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `revenue` | `ev * (0.3 + sr(i * 11) * 0.7);` |
| `ebitda` | `revenue * (0.08 + sr(i * 13) * 0.22);` |
| `scope1` | `sec === 'Energy' ? 500 + sr(i * 17) * 4500 : sec === 'Materials' ? 200 + sr(i * 17) * 1800 : 20 + sr(i * 17) * 480;` |
| `scope2` | `scope1 * (0.1 + sr(i * 19) * 0.3);` |
| `scope3` | `scope1 * (2 + sr(i * 23) * 8);` |
| `physicalRiskScore` | `sr(i * 29) * 85 + 10;` |
| `transitionRiskScore` | `sr(i * 31) * 80 + 15;` |
| `esgScore` | `25 + sr(i * 37) * 65;` |
| `strandedAssetPct` | `sec === 'Energy' ? 15 + sr(i * 41) * 45 : sec === 'Materials' ? 5 + sr(i * 41) * 25 : sr(i * 41) * 8;` |
| `fossilRevenuePct` | `sec === 'Energy' ? 40 + sr(i * 43) * 55 : sec === 'Materials' ? 10 + sr(i * 43) * 30 : sr(i * 43) * 10;` |
| `greenRevenuePct` | `100 - fossilRevenuePct - sr(i * 47) * (100 - fossilRevenuePct) * 0.5;` |
| `climateValAdj` | `-(physicalRiskScore * 0.05 + transitionRiskScore * 0.06 + strandedAssetPct * 0.04);` |
| `avgEv` | `filtered.length ? filtered.reduce((s, d) => s + d.ev, 0) / filtered.length : 0;` |
| `avgClimateAdj` | `filtered.length ? filtered.reduce((s, d) => s + d.climateValAdj, 0) / filtered.length : 0;` |
| `avgStranded` | `filtered.length ? filtered.reduce((s, d) => s + d.strandedAssetPct, 0) / filtered.length : 0;` |
| `sectorRiskProfile` | `useMemo(() => SECTORS.map(s => {` |
| `carbonLiabilityNpv` | `useMemo(() => filtered.slice(0, 12).map(d => {` |
| `scope12` | `d.scope1 + d.scope2;` |
| `lowNpv` | `scope12 * 30 / 1000000;` |
| `midNpv` | `scope12 * carbonPrice / 1000000;` |
| `highNpv` | `scope12 * 200 / 1000000;` |
| `regulatoryData` | `useMemo(() => filtered.slice(0, 10).map(d => ({` |
| `compositeScore` | `useMemo(() => { const total = scorecardData.reduce((s, c) => s + c.score * c.weight / 100, 0);` |
| `radarData` | `useMemo(() => scorecardData.map(c => ({` |
| `valuationAdj` | `useMemo(() => filtered.slice(0, 10).map(d => {` |
| `physAdj` | `-(d.physicalRiskScore / 100 * 0.08 * baseEv);` |
| `transAdj` | `-(d.transitionRiskScore / 100 * 0.10 * baseEv);` |
| `strandedAdj` | `-(d.strandedAssetPct / 100 * 0.12 * baseEv);` |
| `esgUplift` | `(d.esgScore / 100 * 0.05 * baseEv);` |
| `adjustedEv` | `baseEv + physAdj + transAdj + strandedAdj + esgUplift;` |
| `combined` | `(d.physicalRiskScore + d.transitionRiskScore + d.regulatoryRisk) / 3;` |
| `pct` | `filtered.length ? (count / filtered.length * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `CRITERIA_WEIGHTS`, `DEAL_STATUS`, `SBTI_STATUS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Liability NPV | `Σ(Scope 1+2+3 emissions × shadow price trajectory) discounted to PV` | WBCSD ACE framework, SCC $51-220/t | Social cost of carbon $185/t (IWG 2021 update); internal carbon price trajectory fed through DCF model; dominant for energy assets |
| Stranded Asset Exposure | `Assets at risk of early retirement under 1.5°C / 2°C scenario / total PP&E` | IEA NZE scenario asset stranding analysis | Unburnable reserves plus fossil fuel infrastructure; quantified using IEA NZE remaining carbon budget by asset type |
| Physical Risk Impairment | `Expected value of physical asset writedowns from climate hazards over holding period` | RMS/AIR physical risk model | Coastal, flood-prone, and water-stressed assets most vulnerable; key for real estate and infrastructure M&A |
- **Target company CDP disclosures and ESG reports** → Scope 1+2+3 emissions, climate governance, physical risk exposure → due diligence inputs → **Carbon liability and TCFD checklist**
- **IEA NZE scenario stranding database** → Asset-type retirement timelines by scenario → stranded asset quantification → **Stranded asset EV adjustment**
- **RMS / AIR physical risk platform** → Asset-level physical hazard exposure → impairment risk quantification → **Physical risk EV adjustment**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Enterprise Value
**Headline formula:** `Climate EV = Reported EV - Carbon Liability NPV - Stranded Asset Writedown - Physical Risk Impairment; Carbon Liability = Scope 1+2+3 × Shadow Carbon Price`

EV adjustment framework quantifying climate liabilities (carbon cost, stranded assets, physical impairment) to derive climate-adjusted acquisition price

**Standards:** ['TCFD Recommendations 2017 + 2021 update', 'IFRS S2 Climate-related Disclosures 2023', 'ACE (Accounting for Carbon Emissions) Framework — WBCSD 2023']
**Reference documents:** TCFD (2021) Implementing the Recommendations of the Task Force on Climate-related Financial Disclosures; IFRS S2 (2023) Climate-related Disclosures Standard; WBCSD (2023) ACE Framework — Accounting for Carbon Emissions in M&A; IEA (2023) World Energy Outlook — Net Zero Emissions Scenario Asset Stranding

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Climate-Adjusted Enterprise
> Value* framework — `Climate EV = Reported EV − Carbon Liability NPV − Stranded Asset Writedown −
> Physical Risk Impairment` with Scope 1+2+3 shadow-priced at the $185/t social cost of carbon (IWG
> 2021), IEA-NZE stranding analysis, an RMS/AIR physical-risk model, and a TCFD-aligned due-diligence
> checklist. **The code implements none of that machinery.** What actually runs is a set of *linear
> percentage haircuts* on EV (fixed coefficients 0.05/0.06/0.04 and 0.08/0.10/0.12), an
> **undiscounted** Scope 1+2-only carbon cost (Scope 3 is generated but never enters the liability),
> and a 7-criterion weighted deal scorecard. There is no NPV discounting, no SCC anchor, no TCFD
> checklist tab. The sections below document the code as it behaves.

### 7.1 What the module computes

For 45 synthetic M&A targets across 6 sectors (Energy, Utilities, Industrials, Materials, Real
Estate, Consumer), the page computes two *separate* climate valuation adjustments plus a deal
scorecard:

```js
// Headline haircut, embedded in each target record (screening table, KPI):
climateValAdj = −(physicalRiskScore × 0.05 + transitionRiskScore × 0.06 + strandedAssetPct × 0.04)   // %

// Tab 6 "Valuation Adjustment" — EV bridge with different coefficients:
physAdj     = −(physicalRiskScore / 100 × 0.08 × baseEv)
transAdj    = −(transitionRiskScore / 100 × 0.10 × baseEv)
strandedAdj = −(strandedAssetPct   / 100 × 0.12 × baseEv)
esgUplift   = +(esgScore           / 100 × 0.05 × baseEv)
adjustedEv  = baseEv + physAdj + transAdj + strandedAdj + esgUplift

// Tab 3 "Stranded Asset Analysis" — carbon liability at three price points (no discounting):
scope12 = scope1 + scope2                       // ktCO₂e
lowNpv  = scope12 × 30          / 1e6           // $Bn at $30/t
midNpv  = scope12 × carbonPrice / 1e6           // user slider, $30–200/t, default $75
highNpv = scope12 × 200         / 1e6
haircut = midNpv / max(0.01, ev) × 100          // % of EV
```

Note the two haircut formulas are inconsistent with each other by design of the demo: the registry
column and the EV bridge use different coefficient sets, so the same target shows different
"climate adjustments" on different tabs.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Physical / transition / stranded haircut (registry) | 0.05 / 0.06 / 0.04 per score-point | Synthetic demo heuristic — no cited source |
| Physical / transition / stranded / ESG EV-bridge caps | 8% / 10% / 12% / +5% of EV at score 100 | Synthetic demo heuristic |
| Carbon price slider | $30–200/tCO₂, default $75 | Range loosely spans EU ETS ~$75 to NGFS NZ2050 shadow prices; not cited in code |
| Regulatory fine exposure | `regulatoryRisk × ev × 0.003` | Synthetic scaling |
| Litigation liability | `litigationRisk × ev × 0.002` | Synthetic scaling |
| Carbon tax (regulatory tab) | `scope1 × carbonPrice / 1e6` ($Bn) | Scope 1 only, single year, undiscounted |
| Recommendation rule | Proceed: ESG > 65 **and** stranded < 15; Conditional: ESG > 45 and stranded < 30; else Decline | Synthetic screening thresholds |

Deal-scorecard weights (`CRITERIA_WEIGHTS` / `scorecardData` — the two are duplicated in code and
agree):

| Criterion | Weight | Score mapping |
|---|---|---|
| ESG Score | 20% | raw `esgScore` |
| Physical Risk | 18% | `100 − physicalRiskScore` (inverse) |
| Transition Risk | 15% | `100 − transitionRiskScore` (inverse) |
| Stranded Assets | 15% | `100 − strandedAssetPct` (inverse) |
| Green Revenue | 12% | raw `greenRevenuePct` |
| SBTi Status | 10% | Targets Set 90 · Committed 70 · In Progress 50 · Not Committed 20 |
| Litigation Risk | 10% | `100 − litigationRisk` (inverse) |

`compositeScore = Σ scoreᵢ × weightᵢ / 100`, displayed as `/100` with green > 70, amber > 50, red
otherwise.

### 7.3 Calculation walkthrough

1. **Seed generation.** All 45 targets are built once at module load from
   `sr(s) = frac(sin(s+1)×10⁴)`. Sector is `SECTORS[i % 6]`; EV ~ $0.5–25Bn; emissions are
   sector-conditioned (Energy Scope 1 = 500–5,000 kt, Materials 200–2,000 kt, others 20–500 kt;
   Scope 2 = 10–40% of Scope 1; Scope 3 = 2–10× Scope 1). Stranded-asset % and fossil-revenue %
   are likewise sector-tiered (Energy 15–60% / 40–95%, Materials 5–30% / 10–40%, others ≤8% / ≤10%).
2. **Filtering.** Sector and deal-status dropdowns filter the registry; all KPIs (`avgEv`,
   `avgClimateAdj`, `highRisk` count at score > 60, `sbtiAligned`, `avgStranded`) are guarded
   averages over the filtered set.
3. **Carbon price slider** (`carbonPrice`, $30–200) re-prices the Tab-3 liability bars and the
   Tab-4 regulatory carbon-tax column live; the $30 and $200 bars are fixed low/high bookends.
4. **Scorecard** re-computes for the target picked in the header dropdown; the radar chart mirrors
   the 7 criterion scores.

### 7.4 Worked example — target #1 (i = 0, "Nexus Energy Corp")

For i = 0 every seed collapses to `sr(0) = frac(sin(1)×10⁴) ≈ 0.70985`.

| Step | Computation | Result |
|---|---|---|
| EV | 0.5 + 0.70985 × 24.5 | **$17.9Bn** |
| Scope 1 / Scope 2 | 500 + 0.70985×4500 · Scope1 × (0.1 + 0.70985×0.3) | **3,694 / 1,156 kt** |
| Physical / transition score | 0.70985×85+10 · 0.70985×80+15 | **70.3 / 71.8** |
| Stranded asset % (Energy tier) | 15 + 0.70985 × 45 | **46.9%** |
| Registry haircut | −(70.3×0.05 + 71.8×0.06 + 46.9×0.04) | **−9.7%** |
| Carbon liability (mid, $75/t) | (3694+1156) × 75 / 1e6 | **$0.36Bn** (2.0% of EV) |
| EV bridge | −0.703×0.08×17.9 − 0.718×0.10×17.9 − 0.469×0.12×17.9 + 0.711×0.05×17.9 = −1.01 − 1.29 − 1.01 + 0.64 | **adjustedEv $15.2Bn (−14.9%)** |
| Scorecard | 71.1×.20 + 29.7×.18 + 28.2×.15 + 53.1×.15 + 13.5×.12 + 20×.10 + 45.3×.10 | **39.9/100** (red) |
| Recommendation | ESG 71.1 > 65 but stranded 46.9 ≥ 15 → next rule fails on stranded ≥ 30 | **Decline** |

The same company thus shows −9.7% on the screening tab but −14.9% on the valuation tab —
illustrating the coefficient inconsistency noted in §7.1.

### 7.5 Companion analytics

- **Tab 1 Physical Risk** — sector-mean bar chart + physical×transition scatter (bubble = EV) +
  a combined-risk table where `combined = (physical + transition + regulatory)/3`, flagged HIGH > 60.
- **Tab 2 Transition Risk** — stacked fossil/green revenue mix and mean green-capex % per sector.
- **Tab 4 Regulatory Exposure** — per-target fine + carbon tax + litigation liability stack.
- **Tab 5 ESG Integration** — SBTi status distribution over the filtered set.

### 7.6 Data provenance & limitations

- **Every target is synthetic**, generated by the platform PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`.
  Because all attributes of target *i* reuse seeds `i×k`, and `sr(0)` is identical for every
  multiplier at i = 0, the first company's attributes are perfectly rank-correlated — a PRNG
  artefact, not an economic signal. No real deal, emissions, or valuation data enters the module.
- Carbon "NPV" is a single-year undiscounted cost; no price trajectory, no abatement, no pass-through.
- Scope 3 is generated but excluded from every liability calculation.
- Haircut coefficients are uncalibrated point heuristics; a real DD would use scenario-conditioned
  DCF deltas per target.
- Guide-promised TCFD checklist, WBCSD ACE framework, and IEA NZE stranding quantification are absent.

### 7.7 Framework alignment

- **TCFD (2017/2021)** — the guide claims a TCFD-aligned checklist; the code only mirrors TCFD's
  physical/transition risk taxonomy in its scoring axes. TCFD itself prescribes disclosure across
  Governance/Strategy/Risk Management/Metrics & Targets, not a scoring formula.
- **IFRS S2 (2023)** — named in the guide; IFRS S2 requires disclosure of climate-resilience
  analysis and Scope 1–3 emissions. The module's Scope 1–3 fields echo this but no S2 metric is computed.
- **SBTi** — status is a categorical field mapped to a 20–90 scorecard rubric. Real SBTi validation
  assesses target ambition against sectoral decarbonisation pathways (e.g. 1.5°C-aligned linear
  reduction of ~4.2%/yr for Scope 1+2), which the module does not model.
- **Social Cost of Carbon (IWG 2021, $51–$185/t)** — cited only in the guide; the slider default
  ($75) and bookends ($30/$200) are unattributed demo values.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

#### 8.1 Purpose & scope

Support bid/no-bid and price-adjustment decisions in corporate M&A by producing a defensible
climate-adjusted enterprise value (CaEV) per target, with an auditable bridge: carbon liability NPV,
stranded-asset writedown, physical-damage impairment, and green-growth uplift. Coverage: listed and
private targets with disclosed or estimable Scope 1–3 emissions and asset registers; deal sizes
$0.1–50Bn across the module's 6 sectors.

#### 8.2 Conceptual approach

Replace linear score haircuts with a **scenario-conditioned DCF delta**, mirroring (1) **MSCI
Climate Value-at-Risk** (policy-risk NPV = future carbon costs to 2080 discounted against company
profits, plus technology-opportunity NPV) and (2) **BlackRock Aladdin Climate** transition-repricing
(security-level cash-flow adjustment under NGFS scenarios). Stranding follows **CRREM/IEA NZE**
asset-life truncation logic; physical impairment follows a catastrophe-model AAL approach as in
**S&P Global Trucost / Sustainable1** physical risk exposure scores.

#### 8.3 Mathematical specification

```
CaEV = EV_base − CL_NPV − SA_WD − PR_NPV + GO_NPV

CL_NPV  = Σ_{t=2026}^{2050}  [E1(t) + E2(t)] × (1 − pass_s) × P_c(t, scenario) / (1+r)^(t−2025)
E_k(t)  = E_k(2025) × (1 − g_k)^(t−2025)                    (abatement-adjusted emissions path)
SA_WD   = Σ_assets  BV_a × max(0, 1 − L_NZE,a / L_econ,a)   (book value lost to early retirement)
PR_NPV  = Σ_t  AAL(t, RCP) / (1+r)^(t−2025),  AAL = Σ_hazards EAD_h × V_h(intensity_t)
GO_NPV  = Σ_t  ΔRev_green(t) × m_green × (1+r)^−(t−2025)
```

| Parameter | Definition | Calibration source |
|---|---|---|
| `P_c(t)` | Scenario carbon price path | NGFS Phase IV (Net Zero 2050: ~$150/t 2030 → $250+/t 2050; Current Policies ≈ today's ETS) |
| `pass_s` | Sector cost pass-through | ECB/EBA climate stress-test assumptions (0.3–0.8 by sector) |
| `g_k` | Committed abatement rate | SBTi-validated target trajectories; default 1.5°C ~4.2%/yr S1+2 |
| `L_NZE,a` | NZE-consistent remaining asset life | IEA NZE 2023 phase-out schedules (unabated coal 2030/2040 OECD/non-OECD) |
| `V_h(·)` | Hazard damage functions | EM-DAT-calibrated + Swiss Re sigma loss ratios; JRC flood depth-damage curves |
| `r` | Discount rate | Target WACC (deal model) or 7% real per IWG SCC sensitivity band |
| `m_green` | Green revenue margin multiple | EU Taxonomy-aligned revenue premium studies (MSCI ESG research) |

#### 8.4 Data requirements

Target Scope 1/2/3 (CDP, annual reports; platform `reference_data` OWID CO2 + Verra/SBTi tables
already ingested), asset register with geo-coordinates and book values (vendor: S&P Capital IQ,
Trucost; free: company 10-K PP&E notes), hazard layers (WRI Aqueduct, EM-DAT — both already seeded
in the platform's public-data layer), NGFS scenario prices (free, NGFS Scenario Explorer), EU
Taxonomy revenue alignment (EU Taxonomy Compass seed file already present).

#### 8.5 Validation & benchmarking plan

- **Benchmark reconciliation:** per-target CaEV delta vs MSCI Climate VaR (aggregated policy +
  physical %) and Trucost carbon earnings-at-risk for overlapping public tickers; tolerance ±30%
  at portfolio level.
- **Backtest:** compare predicted stranding writedowns against realised 2015–2024 impairments in
  European utilities (RWE, Uniper coal fleets) and O&G majors' 2020 reserve writedowns (~$80Bn).
- **Sensitivity:** tornado on `P_c`, `pass_s`, `r`; CaEV must be monotone in carbon price and
  stranding share; stability test across NGFS vintage updates.

#### 8.6 Limitations & model risk

Scope 3 double-counting between acquirer and target chains; pass-through parameters are
sector-mean, not firm-specific; damage functions understate tail/compound events — apply a
conservative ×1.25 tail loading pending cat-model integration; private-target emissions estimated
by sector intensity proxies carry PCAF DQ-score-4-level uncertainty and should be flagged in DD
output. Fallback: if asset register unavailable, cap SA_WD at sector-mean stranding % (IEA NZE) and
disclose as estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Discounted carbon liability with SCC anchoring and Scope 3 (analytics ladder: rung 1 → 2)

**What.** §7 itemises the gaps behind the guide's Climate-EV formula: the code
applies fixed linear haircut coefficients (0.05/0.06/0.04 and 0.08/0.10/0.12) rather
than modelled adjustments, computes an **undiscounted** Scope 1+2-only carbon cost
(Scope 3 is generated but never enters the liability), has no SCC anchor despite the
guide citing $185/t, and lacks the advertised TCFD checklist tab. Evolution A builds
the valuation machinery honestly: carbon liability as an NPV — annual emissions ×
NGFS scenario carbon-price *trajectory* (already in platform data), discounted at a
user WACC, with Scope 3 included at a documented inclusion factor (full Scope 3
double-counts across a value chain; the ACE/WBCSD framework the §5 list cites gives
the treatment) — plus stranded-asset writedowns keyed to IEA-NZE retirement years by
asset class rather than a flat sector percentage.

**How.** (1) `carbonLiabilityNPV(scopes, scenario, wacc, horizon)` replacing the flat
multiplication; scenario trajectories from the platform's NGFS data. (2) The two
inconsistent haircut paths (screening-table coefficient vs the second set) unified
into one documented model. (3) The 7-criterion deal scorecard kept (it's real
arithmetic) and the missing TCFD checklist either built as a structured assessment
tab or removed from the guide. (4) The 45 synthetic targets relabelled fixtures.

**Prerequisites.** NGFS price-path access; SCC vs market-price basis decision
documented (they answer different questions and the module must say which it prices).
**Acceptance:** carbon liability responds to WACC and horizon (discounting proven);
Scope 3 visibly enters with its inclusion factor displayed; the two haircut paths
agree; the mismatch flag clears.

### 9.2 Evolution B — Deal-team diligence analyst (LLM tier 2)

**What.** An assistant for M&A climate workstreams: "run the climate adjustment on
this target — €2B EV, utilities, 4.2 Mt Scope 1+2, coal assets retiring 2035 under
NZE" as tool calls into the Evolution A valuation functions, returning the adjusted
EV with a decomposition (carbon NPV, stranding, physical) suitable for an IC memo;
plus checklist interrogation ("what diligence items remain open on governance?") once
the TCFD tab exists. Drafting the climate section of the IC memo from computed
outputs is the natural deliverable — through the report-studio render layer.

**How.** Client-side or backend tool schemas over the valuation functions (the module
currently has no API routes — Evolution A may add them); the validator on every EV,
NPV, and haircut figure; scenario assumptions stated in-draft (which NGFS path, which
WACC) because an IC will ask; human review before memo export.

**Prerequisites (hard).** Evolution A first — the current flat coefficients would
give an LLM false precision to amplify; deal data confidentiality handling (RBAC,
no cross-deal leakage in context). **Acceptance:** a memo's climate-EV figures
reproduce via the valuation functions with stated assumptions; changed WACC changes
the draft's numbers coherently; refusal on synergy and pricing questions outside the
climate scope.