## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry cites a *CE Revenue Model NPV*
> methodology — `CE_Revenue = ServiceFee × (1 − ChurnRate) + MaterialResidualValue +
> WarrantyExtension`, a `Circular_IRR` that "solves NPV=0", and `Material_Saving = VirginCost −
> RecoveredCost`. **None of these are implemented.** There is no NPV, IRR, churn, or cost
> calculation anywhere in `CircularEconomyInvestmentPage.jsx`. The page is a curated CE
> business-model catalogue plus a synthetic 22-company pipeline whose valuation/CAGR/savings
> metrics are seeded-PRNG draws. The tier-A backend (`circular_economy_engine.py`) provides real
> MCI/CTI/EPR/LCA math for this domain, but this page makes no API calls. The sections below
> document what the code actually does.

### 7.1 What the module computes

Three data blocks drive six tabs (Overview · CE Business Models · Investment Pipeline · Market
Sizing · ROI Analysis · Ellen MacArthur Framework):

1. **`CE_MODELS`** — 6 hand-curated business-model rows (the record's `seed_schemas` counts 7
   rows including the header pattern; the array has 6):

| Model | Margin uplift | Resource saving | Scalability | Example |
|---|---|---|---|---|
| Product-as-a-Service | +15% | 40% | 75 | Philips Circular Lighting |
| Take-Back / Remanufacturing | +22% | 60% | 65 | Caterpillar Reman; Renault Re-Factory |
| Industrial Symbiosis | +8% | 55% | 50 | Kalundborg Symbiosis |
| Materials Marketplace | +5% | 45% | 90 | Excess Materials Exchange |
| Repair & Refurbish Platform | +18% | 35% | 80 | Back Market; iFixit |
| Closed-Loop Packaging | +6% | 70% | 85 | Loop (TerraCycle) |

   These constants carry no inline citations — treat as synthetic demo values loosely
   consistent with EMF case-study literature (guide's "18–28% higher asset utilisation" claim
   is not reproduced anywhere in code).

2. **`INVESTMENTS`** — 22 pipeline companies with real-world names (Carbios, Novamont,
   Circulor, Greyparrot, Closed Loop Partners…) but **synthetic financials**:

```js
valuation      = Math.round(10 + sr(i·13) × 490)   // $10–500M
revCagr        = Math.round(25 + sr(i·19) × 75)    // 25–100 %
materialSaving = Math.round(20 + sr(i·23) × 55)    // 20–75 %
co2Saving      = Math.round(15 + sr(i·29) × 60)    // 15–75 kt
```

   Model, sector, stage and lead investor cycle deterministically via `i % 6`.

3. **`MARKET_SIZE`** — linear ramps, not forecasts: `ceMarket = 1200 + i·380` ($Bn, 2024–2031,
   i.e. $1.2Tn → $3.86Tn), `recyclingTech = 250 + i·110`, `productService = 180 + i·95`.
   The $4.5Tn headline KPI is a hard-coded string (EMF 2015/2023 "value at stake" figure).

### 7.2 Parameterisation / scoring rubric

There is no scoring rubric. The only derived quantities are the four filtered-pipeline KPIs:

```js
avgValuation      = Σ valuation / n
avgRevCagr        = Σ revCagr / n
avgMaterialSaving = Σ materialSaving / n
totalCo2          = Σ co2Saving / 1000        // kt → "ktpa" display (unit mislabel, see §7.5)
```

with `n = filtered.length || 1` guarding empty filters. The "ROI Analysis" tab is a CAGR
histogram (buckets <30 / 30–50 / 50–75 / >75 %) plus a bar chart of `resourceSaving` by model —
no ROI is computed.

### 7.3 Calculation walkthrough

`modelFilter` (All + 6 model names) → `filtered` subset of `INVESTMENTS` → KPI means →
pipeline table. `CE_MODELS` feeds the margin-uplift bar chart and the scalability-vs-resource-
saving scatter unfiltered. Tab 5 renders 6 static Ellen MacArthur principle cards (eliminate
waste, circulate products, regenerate nature, design for longevity, business-model innovation,
systemic thinking) with suggested metrics — descriptive text only.

### 7.4 Worked example — pipeline company i = 0 (Loop Industries)

`sr(s) = frac(sin(s+1)·10⁴)`. For i = 0 every seed is `sr(0) = frac(sin(1)·10⁴) =
frac(8414.71) ≈ 0.7098`: valuation = `round(10 + 0.7098·490)` = **$358M**; revCagr =
`round(25 + 0.7098·75)` = **78%**; materialSaving = `round(20 + 0.7098·55)` = **59%**;
co2Saving = `round(15 + 0.7098·60)` = **58 kt**. (Identical percentile across all four metrics
because i·13 = i·19 = 0 — a seed-collision artefact at index 0.) With filter = All, this row
contributes to `avgValuation = Σ/22` etc.

### 7.5 Data provenance & limitations

- **Pipeline financials are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`), attached to real
  company names — a presentation risk: readers may mistake fabricated valuations/CAGRs for
  actual market data. Real Carbios/Novamont valuations are public and differ.
- Market-size series are linear interpolations with no source; the $4.5Tn KPI is the only
  externally attributable number (Ellen MacArthur Foundation / Accenture 2015 estimate).
- KPI label "CO₂ Saving (ktpa)" divides the kt sum by 1,000, so the displayed number is
  actually MtCO₂ (or the division is spurious) — unit inconsistency in code.
- No NPV/IRR machinery despite tab names; no backend integration despite the domain's live
  `/api/v1/circular-economy/*` endpoints (MCI, EPR, LCA, ESRS E5).

### 7.6 Framework alignment

- **Ellen MacArthur Foundation** — tab 5 paraphrases EMF's three core principles (expanded to
  six cards); EMF's quantitative tool for company measurement is Circulytics / MCI, neither of
  which this page computes (the backend engine does implement MCI v1.3).
- **EU CEAP 2020 / BS 8001:2017** — named in the guide; present only as context, no compliance
  logic in code.
- **ESRS E5** — the natural disclosure hook for pipeline companies' circularity claims; served
  by the backend engine (`assess_esrs_e5` completeness grading A–D) but unwired here.

## 8 · Model Specification — CE Venture Screening & Circular NPV Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Give the pipeline table a defensible economic core: (i) a circular-vs-linear NPV/IRR engine for
CE business models, and (ii) a venture screening score for the 22-company pipeline. Users:
impact-fund deal teams screening Series A–pre-IPO circular-economy companies.

### 8.2 Conceptual approach

Circular NPV follows the **EMF/McKinsey "Growth Within" (2015)** value-driver decomposition and
**WBCSD CTI "CTI Revenue"** metric; the screening score mirrors venture-grading practice in
**BloombergNEF climate-tech scoring** and PitchBook/Preqin impact-fund frameworks (market ×
traction × impact). Both benchmarks value circularity as avoided virgin-material cost plus
retained residual value — exactly the guide's stated (unimplemented) formula.

### 8.3 Mathematical specification

Circular business-model NPV (per model m, horizon T = 10y):

```
CF_t = ServiceFee_t·(1−churn)^t + Resale_t + MatRecovery_t·(P_virgin − P_recovered)
       − RevLog_t − Reman_t − Capex_t
NPV_circular = Σ_t CF_t/(1+r)^t ;  IRR solves NPV = 0  (Newton iteration, guard f'≈0)
Δ_vs_linear = NPV_circular − NPV_linear   (same product sold, no take-back)
Screen_i = 0.30·z(RevCAGR_i) + 0.25·z(GrossMargin_i) + 0.25·Impact_i + 0.20·Scalability_m
Impact_i = min(100, 50·tCO₂e_avoided/$M_rev / sector_median)
```

| Parameter | Calibration source |
|---|---|
| `churn` (PaaS) | 5–12%/yr — EMF Philips/Michelin case studies; SaaS-analogue retention data |
| `P_virgin − P_recovered` | LME scrap spreads; ICIS recycled-polymer vs virgin PET/PE spreads (public monthly indices) |
| `r` discount rate | Stage-dependent venture hurdle: 25% Seed, 20% A/B, 15% Growth (Cambridge Associates VC benchmarks) |
| Reman cost ratio | 40–60% of new-build cost — Caterpillar Reman / Renault Re-Factory disclosures, EEA remanufacturing report |
| `tCO₂e_avoided` | Product LCA deltas from ecoinvent v3.10 factors (already patterned in engine `LCA_GATE_FACTORS`) |
| Sector medians | Circle Economy Circularity Gap Report sector tables |

### 8.4 Data requirements

Deal-level: revenue, growth, gross margin, unit economics (from CIMs/data rooms); market:
recycled-vs-virgin price series (ICIS/Fastmarkets, some free aggregates); impact: product LCA
or engine `perform_lca` with entity-supplied benefit %. Platform reuse: backend
`circular_economy_engine` (MCI/LCA/EPR), `reference_data` ingestion layer for price series.

### 8.5 Validation & benchmarking plan

Backtest screen scores against realised outcomes of 2018–2022 CE venture cohort (up-round /
flat / down) — target rank correlation ρ ≥ 0.3; reconcile NPV components against published EMF
case studies (Philips lighting, Renault Choisy-le-Roi ±20%); IRR solver unit tests vs closed-form
two-cash-flow cases; sensitivity: churn ±50%, material spread ±30%, discount rate ±5pp.

### 8.6 Limitations & model risk

Venture financials are private and self-reported — score inputs carry survivorship and
selection bias; recycled-material spreads can invert (recycled PET traded above virgin in
2021–22), flipping `MatRecovery` sign; churn assumptions from case studies may not transfer
across sectors. Conservative fallback: cap Impact at 100, floor NPV inputs at contracted (not
projected) service revenue, and disclose the linear-counterfactual assumption explicitly.
