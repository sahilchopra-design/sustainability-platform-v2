## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's formula is
> `LCOF = (CAPEX x CRF + OPEX) / AnnualProduction + FeedstockCost - IRA_S40B_Credit` — a genuine
> bottom-up levelised-cost build. **The code does not run this calculation.** Each of the 6
> `PATHWAYS` carries a **hard-coded `lcof` value** (e.g. HEFA-UCO $1.85/gal, PtL-DAC $6.80/gal);
> the cost-component waterfall chart (feedstock/capex/opex/other) is a **fixed percentage split of
> that hard-coded number** (52%/28%/12%/8%), not four independently computed cost lines that sum to
> the total. No CRF (capital recovery factor), discount rate, or feedstock-price-to-LCOF linkage
> exists in the code.

### 7.1 What the module computes

```
lcof_project = pathway.lcof x (0.88 + sr(i x 13 + 3) x 0.28)     // +/-12%/+16% spread per project
learningCurve[tech][year] = base_lcof x decayRate^(year - 2024)  // annual geometric decay, per tech
sensitivity: base = $3.50/gal +/- feedstock/capex/carbon-price sliders (independent additive terms)
netLcof = max(0, gross_lcof - iraCredit x 0.264)                 // IRA S40B credit per pathway
```

### 7.2 Parameterisation

| Pathway | `lcof` ($/gal) | `capex` ($M/Mt/yr) | `ci` (gCO2eq/MJ) | Maturity |
|---|---|---|---|---|
| HEFA-UCO | 1.85 | 320 | 28 | Commercial |
| HEFA-Tallow | 2.10 | 340 | 35 | Commercial |
| AtJ-Cellulosic | 3.20 | 580 | 12 | Early Commercial |
| FT-MSW | 3.80 | 720 | 5 | Demo/Scale |
| FT-Agricultural | 4.10 | 780 | 8 | Demo |
| PtL-DAC | 6.80 | 1,400 | -70 | Pilot |

All six are **hand-set constants**. HEFA-UCO's $1.85/gal sits *below* the guide's own cited
$2.5-4.0/gal HEFA LCOF range — an internal inconsistency between the atlas guide text and the code's
seed value. Capex figures ($320-1,400M per Mt/yr nameplate) and maturity labels are qualitatively
consistent with published SAF techno-economic literature (NREL/IEA cost curves place PtL 3-4x HEFA
capex intensity, matching the 1,400/320≈4.4x ratio here) even though not derived from a live model.

| Learning-curve decay rate (annual) | HEFA 3% | AtJ 8% | FT 10% | PtL 15% |
|---|---|---|---|---|
Applied as `lcof_2024 x rate^n` for year `2024+n` — a simple annual geometric decay, **not**
Wright's Law in its proper form (`cost = cost_0 x (cumulative_production / production_0)^-b`,
which indexes against production doublings, not calendar years). The decay-rate ordering
(PtL fastest, HEFA slowest) is directionally consistent with the guide's "15-20% per doubling"
claim for immature technologies learning faster, but the per-year rates are not derived from an
assumed production-growth trajectory that would translate a doubling-based learning rate into an
annual one.

### 7.3 Calculation walkthrough

1. `PROJECTS` (24 rows) sample a `PATHWAYS` entry and perturb its hard-coded `lcof` by a synthetic
   +/-12-16% band via `sr()`, plus independently seeded `capMt`, `irr` (7-21%), and `corsia`
   eligibility (~50/50 coin flip).
2. `avgLcof`/`avgIrr`/`corsiaShare` are simple means/proportions over the filtered project set.
3. `learningCurve` projects each of the 4 pathway families (HEFA/AtJ/FT/PtL) 10 years forward via
   the fixed annual decay rate.
4. Cost-waterfall chart: `feed = lcof x 0.52`, `cap = lcof x 0.28`, `op = lcof x 0.12`,
   `other = lcof x 0.08` for every pathway — an **identical percentage split applied uniformly
   across all 6 pathways**, despite pathways having very different feedstock-to-capex cost ratios
   in reality (e.g. PtL is capex/electricity-dominated, HEFA is feedstock-dominated).
5. IRA §40B calculator: `netLcof = max(0, grossLcof - iraCredit x 0.264)` — converts a $/gal credit
   to $/L via the 0.264 gal/L conversion factor (correct unit conversion), then nets it off the
   hard-coded gross LCOF.

### 7.4 Worked example

HEFA-UCO learning curve at year 2029 (`n=5`): `lcof = 1.85 x 0.97^5 = 1.85 x 0.8587 = $1.588/gal`.
PtL-DAC at year 2029: `lcof = 6.80 x 0.85^5 = 6.80 x 0.4437 = $3.017/gal` — a much steeper decline
(56% cost reduction by 2029 vs HEFA's 14%), consistent with the guide's claim that PtL falls from
$8-15/gal toward $3-5/gal by 2035, though the code's PtL base ($6.80) already starts below the
guide's own cited $8-15/gal 2024 range.

### 7.5 Data provenance & limitations

- All `lcof`/`capex` figures are hard-coded constants, not computed from a CRF/OPEX/feedstock
  bottom-up build as the guide's formula implies — changing a feedstock price slider elsewhere on
  the platform would not flow through to this page's LCOF figures.
- The cost-component waterfall applies one fixed percentage split to every pathway, which is not
  defensible given real SAF pathways have materially different feedstock vs capex cost structures.
- The annual-decay learning curve is a reasonable *illustrative* proxy for Wright's Law but is not
  indexed to a cumulative-production trajectory, so it cannot be validated against an assumed
  market-growth scenario.
- Internal inconsistency: HEFA-UCO's hard-coded $1.85/gal undercuts the guide's own $2.5-4.0/gal
  citation for the same pathway family.

**Framework alignment:** NREL SAF Techno-Economic Analysis and IEA SAF Report 2024 (cited as the
LCOF/capex benchmark source; code's constants are directionally consistent but not derived from a
live NREL TEA model) · ICAO CORSIA default LCA values (via the `ci` field, cross-consistent with
the companion `saf-carbon-credits` module's `ciByPathway` table) · IRS Notice 2023-06 §40B credit
(unit conversion correct, credit-scaling-by-CI-reduction formula from the companion
`saf-policy-mandate` module not reused here).
