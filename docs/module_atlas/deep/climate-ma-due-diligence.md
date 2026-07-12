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
