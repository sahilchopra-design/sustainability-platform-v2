## 7 · Methodology Deep Dive

### 7.1 What the module computes

100 synthetic transport/logistics companies across 6 modes (Road Freight, Rail, Maritime, Aviation,
Last-Mile, Multimodal) and 20 countries, generated once via the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`. The module's one genuinely computed cross-cutting metric is a
GLEC-Framework compliance composite:

```
Portfolio GLEC Score = Σ (criterion.portfolioScore × criterion.weight) / 100     // weights sum to 100
```

Everything else (per-company emissions, fleet composition, modal-shift savings, mitigation-lever
waterfall) is either a direct PRNG draw or a simple aggregation over the 100-company synthetic
population.

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `MODE_INTENSITY` (gCO2e/tkm) | Road Freight 62, Rail 22, Maritime 8, Aviation 602, Last-Mile 180, Multimodal 35 | **Genuinely well-calibrated real-world figures** — closely matches published freight carbon-intensity benchmarks (rail and maritime lowest per tonne-km, air cargo roughly an order of magnitude higher than road, consistent with ICCT/GLEC reference data) |
| `GLEC_CRITERIA` | 7 real GLEC Framework criteria (Scope Definition WTW, GLEC-approved Emission Factors, Distance Calculation, Allocation Method, Hub Operations, Data Quality, Verification), weights 20/20/15/15/10/10/10 (sum=100), each with a hardcoded `portfolioScore` | Genuine GLEC (Global Logistics Emissions Council) Framework criteria; weights and portfolio scores are platform-authored, not derived from the 100-company population |
| Per-company `intensity` | `MODE_INTENSITY[mode] × (0.6+sr()×0.8)` | 60–140% of the mode baseline — synthetic dispersion around a real anchor value |
| Per-company `glecScore` | `40+sr(i×43)×55` | 40–95%, synthetic, **not** derived from the `GLEC_CRITERIA` weighted-score formula |
| `EMISSION_FACTORS` (imported) | Platform reference-data table | **Imported but never referenced anywhere in the file** — a dead import |
| `LEVERS` (9 decarbonisation levers) | id, name, applicable modes, adoption %, 2030 potential, investment, cost, reduction, maturity, scalability, timeframe | Hand-curated, e.g. likely covers electrification, biofuels, hydrogen, route optimisation — real decarbonisation-lever taxonomy for freight/logistics |
| `REGULATIONS` (9 rows) | Name, status, deadline, impact, sector, region | Real regulatory references (IMO GHG Strategy, EU FuelEU Maritime, CORSIA, UK ZEV mandate per the guide) |

### 7.3 Calculation walkthrough

1. **GLEC composite** (the one genuine weighted formula): `Σ portfolioScore×weight/100` over the 7
   criteria — correctly implemented, weights properly sum to 100 so no renormalisation is needed.
2. **Company generation**: mode assigned round-robin (`i%6`), country round-robin (`i%20`),
   intensity/fleet/emissions/decarb-trajectory/Scope 1-2-3 split all independent PRNG draws (Scope 3
   is a residual: `100 − scope1 − scope2`, guaranteeing the three always sum to 100%).
3. **Cross-modal emissions tab**: `modeSummary` aggregates total emissions, average intensity, and
   total fleet per mode across the 100 companies; `portfolioTotals` sums across all modes.
4. **Modal Shift Analyzer**: compares baseline route emissions/cost (`ROUTES.currentEmissions`/
   `currentCost`) against an "optimal" reassignment (`ROUTES.optimalCost`), computing aggregate
   savings — a genuine before/after comparison, though the underlying `ROUTES` dataset itself is
   presumably hand-authored or synthetic (not confirmed in this review's read window).
5. **Decarbonisation Levers waterfall**: converts each lever's `investment` string (e.g. "$1.2T") to
   a numeric via string parsing (`parseFloat(...replace('$','').replace('T',''))×100`), then chains
   levers into a waterfall showing cumulative reduction potential.
6. **Logistics Finance tab**: 5 green-finance instrument types (Green Bond, SLL, Green Loan,
   Transition Bond, Climate Bond) as reference categories for financing the transition levers.

### 7.4 Worked example (GLEC portfolio composite)

| Criterion | Weight | Portfolio score | Weight × score |
|---|---|---|---|
| Scope Definition | 20 | 78 | 1,560 |
| Emission Factors | 20 | 82 | 1,640 |
| Distance Calculation | 15 | 91 | 1,365 |
| Allocation Method | 15 | 74 | 1,110 |
| Hub Operations | 10 | 65 | 650 |
| Data Quality | 10 | 58 | 580 |
| Verification | 10 | 45 | 450 |
| **Total / 100** | | | **73.55% → 73.6% Portfolio GLEC Score** |

Note that "Verification" (third-party assurance) carries the lowest portfolio score (45%) despite
only a 10% weight — a realistic reflection of the real-world GLEC/logistics industry challenge that
third-party assurance of freight-emissions calculations lags other GLEC criteria in adoption.

### 7.5 Companion analytics

- **Country transport profiles** — 20 countries with synthetic mode-share and electrification %
  splits, policy classified as Progressive/Moderate.
- **Quarterly intensity trend** per company — 12-quarter series showing a mild autonomous
  improvement (`intensity×(1−q×0.015+noise)`), i.e. ~1.5%/quarter intensity decline baked in by
  construction, not derived from any actual reported trajectory.
- **Fleet composition** (diesel/LNG/electric/hydrogen %) per company — 4 independent PRNG draws, not
  constrained to sum to 100% (unlike the Scope 1/2/3 split, which is a residual by construction).

### 7.6 Data provenance & limitations

- **The GLEC composite is the only genuinely aggregated cross-portfolio metric**, and it is well
  implemented (correct weighted-average arithmetic over weights that sum to 100).
- **100% synthetic company-level data** — all 100 companies, their fleet/emissions/intensity/GLEC
  score/engagement fields are `sr()`-seeded, no real freight-carrier disclosures are ingested.
- **`EMISSION_FACTORS` reference table is imported but unused** — the platform's real emission-
  factor reference data exists but this module does not draw on it for any calculation, despite
  intensity figures being exactly the kind of value that table would be expected to inform.
- **Fleet composition percentages are not constrained to sum to 100%**, unlike Scope 1/2/3 — a
  company could show `diesel:75, lng:15, electric:20, hydrogen:8` (128% total), which would be
  physically inconsistent for a real fleet mix; a production version should renormalise or use a
  Dirichlet-style allocation.

### 7.7 Framework alignment

- **GLEC Framework** (Global Logistics Emissions Council, part of Smart Freight Centre): the 7
  criteria (Scope Definition WTW, Emission Factors, Distance Calculation, Allocation Method, Hub
  Operations, Data Quality, Verification) and their relative weighting are a faithful representation
  of the real GLEC methodology's structure for logistics-emissions calculation quality assessment.
- **IMO GHG Strategy (2023 Enhanced Strategy)** and **ICAO CORSIA**: cited as governing standards
  for maritime and aviation decarbonisation targets respectively; correctly contextualised as the
  hardest-to-abate modes given their intensity figures (Maritime 8 gCO2e/tkm is low per-tonne-km but
  reflects bulk cargo; Aviation 602 gCO2e/tkm reflects genuinely high per-tonne-km intensity for
  air freight).
- **UK ZEV Mandate** and **EU FuelEU Maritime**: correctly cited real regulatory instruments driving
  road and maritime fleet transition respectively.
