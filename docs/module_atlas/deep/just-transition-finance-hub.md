## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The guide describes this as an *instrument tracker* with the coverage
> formula `Coverage = Σ(instrument_allocations) / Estimated_JT_need`. The page is indeed a tracker —
> but it computes **no coverage ratio and no `Estimated_JT_need`**. The only derived quantity in the
> entire page is `totalFinance = Σ amountBn`. Everything else is a hard-coded reference table
> rendered as bars/pies. The eight `/api/v1/just-transition/*` trace endpoints (and the backend
> `JustTransitionEngine`) are not called. This is a curated data-display module, not a calculation
> engine.

### 7.1 What the module computes

A single aggregation:

```js
totalFinance = INSTRUMENTS.reduce((s, i) => s + i.amountBn, 0)
             = 17.5 + 8.5 + 20.0 + 15.5 + 2.5 + 1.2 + 14.0 + 2.8  =  82.0  ($ bn)
```

All other panels are direct renders of five hard-coded tables:

- `INSTRUMENTS` (8 rows) — name, type, amountBn, region, status, disbursedPct
- `BONDS` (5 rows) — sovereign/MDB JT bonds: issuer, amount, coupon, tenor, framework, rating, year
- `MDB_PROGRAMMES` (5 rows) — MDB, programme, amountBn, countries, jobsTarget, status
- `IMPACT_DATA` (4 rows) — year, jobsTransitioned, emissionsAvoided (MtCO₂), wellbeingIndex
- `FLOW_DATA` (5 rows) — capital-source split summing to 100 (Public 42, MDB 28, Private 18,
  Philanthropic 8, Sovereign Bonds 4)

### 7.2 Parameterisation / reference data provenance

| Table | Key values | Provenance |
|---|---|---|
| JETP deals | South Africa $8.5bn, Indonesia $20bn, Vietnam $15.5bn, Senegal $2.5bn | Real, publicly announced JETP headline figures (JETP Secretariats) |
| EU JTF | €/$17.5bn | Real EU Just Transition Fund envelope (EC Cohesion) |
| Germany coal regions | $14.0bn | Real *Strukturstärkungsgesetz Kohleregionen* order of magnitude |
| Sovereign JT bonds | Chile $2.0bn @4.25% 10y, EIB $3.0bn @2.85% 15y AAA, S.Africa SOE @8.50% BB | Plausible/illustrative — coupons and ratings not sourced in code |
| `IMPACT_DATA` | jobsTransitioned 12k→85k (2022–25), emissions 8.5→72 Mt, wellbeing 62→70 | **Synthetic demo trajectory** (smooth upward, no PRNG, no source) |
| `disbursedPct` | 0–65% per instrument | Hard-coded, illustrative |

No `sr()` PRNG is used anywhere — the numbers are curated constants rather than random, but the
impact series and disbursement percentages are still unsourced demo values.

### 7.3 Calculation walkthrough

Inputs → outputs is trivial: the six tabs (Finance Overview, JTF Instruments, Sovereign JT Bonds,
JETP Tracker, MDB JT Programmes, Impact Measurement) each render one or two of the constant tables
with a Recharts bar/line/pie. `totalFinance` (82.0) is the only cross-row computation and feeds the
Finance Overview KPI card.

### 7.4 Worked example (Finance Overview headline)

`totalFinance` = 17.5 + 8.5 + 20.0 + 15.5 + 2.5 + 1.2 + 14.0 + 2.8 = **$82.0 bn tracked**. The guide
claims "JETP total $43.5bn across 3 country partnerships"; summing the three named JETP rows in code
(SA 8.5 + Indonesia 20.0 + Vietnam 15.5) = **44.0**, and including Senegal 2.5 = 46.5 — the guide's
43.5 figure predates the Senegal row and is not recomputed on the page.

### 7.5 Companion analytics

- **Capital flow pie** (`FLOW_DATA`) — source split; the closest thing to an analytical decomposition.
- **Impact Measurement** — 4-year jobs/emissions/wellbeing lines from `IMPACT_DATA`.
- **Disbursement bars** — `disbursedPct` per instrument, a delivery-progress view.

### 7.6 Data provenance & limitations

- JETP / EU-JTF / Germany headline envelopes are **real public figures**; bond coupons, ratings,
  `disbursedPct`, and the entire `IMPACT_DATA` series are **synthetic/illustrative demo values**
  with no citation in code.
- No coverage ratio, no financing-gap denominator (`Estimated_JT_need`), so the guide's headline
  formula is not evaluated — the module cannot answer "what % of need is covered".
- The backend engine's ILO/EU-JTF/CIF scoring is unused; this hub is display-only.

**Framework alignment:** EU JTF Regulation (EU) 2021/1056 — envelope figure only, no eligibility
scoring (that lives in the engine's `EU_JTF_ELIGIBILITY_CRITERIA`). Glasgow Climate Pact JETPs —
tracked as headline deal sizes. ICMA/CBI just-transition bond frameworks — referenced as a `framework`
string label on each bond, not assessed.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page tracks headline figures but never
computes the guide's coverage ratio or any credibility/gap metric.)

### 8.1 Purpose & scope
Turn the static tracker into a **JT finance gap-and-adequacy model**: for each region/country, compare
committed just-transition capital against modelled transition need, and flag under/over-funding for
allocators and JETP secretariats. Coverage: JETP countries, EU JTF regions, MDB programme geographies.

### 8.2 Conceptual approach
Bottom-up need estimation + top-down commitment tracking:
1. **Transition-need model** — worker reskilling + income support + community diversification +
   stranded-asset write-down, per affected region. Mirrors the platform engine's
   `model_workforce_transition` cost build-up and World Bank JT Framework (2022) cost taxonomy.
2. **Coverage & adequacy** — `Coverage = committed / need`; adequacy-adjusted for disbursement pace.
   Benchmarks: CPI *Global Landscape of Climate Finance* need-vs-flow methodology and IEA transition
   investment gap analysis.

### 8.3 Mathematical specification

```
Need_region = Reskill + Income_support + Community_div + Stranded_write_down
  Reskill        = workers · reskill_cost_per_worker
  Income_support = workers · avg_wage · (support_months/12)
  Community_div  = f(gdp_fossil_dependency) · regional_GDP
  Stranded       = Σ_asset (book_value · impairment_pct)

Coverage_region = Σ committed_instrument_region / Need_region
Disbursement_adj_coverage = Coverage · (Σ disbursed / Σ committed)
Gap_region = max(0, Need_region − committed_region)
Global_gap = Σ_region Gap_region
```

| Parameter | Calibration source |
|---|---|
| `reskill_cost_per_worker`, `support_months` | Engine `model_workforce_transition` defaults; ILO |
| `impairment_pct` (stranded coal) | IEA WEO/NZE coal phase-out pathways; Carbon Tracker |
| `gdp_fossil_dependency` | Engine `COAL_COMMUNITY_PROFILES.alternative_sector_score` |
| Committed / disbursed | This page's `INSTRUMENTS` table (real headline figures) |

### 8.4 Data requirements
- Affected-worker counts + wages per region — engine `COAL_COMMUNITY_PROFILES` / ILO labour data.
- Fossil-asset book values + retirement schedules — company disclosure / GEM Global Coal Plant Tracker.
- Committed & disbursed capital — the `INSTRUMENTS`/`BONDS`/`MDB_PROGRAMMES` tables here.
- Fiscal capacity for community diversification — IMF WEO.

### 8.5 Validation & benchmarking plan
- Reconcile `Global_gap` against CPI/OECD published just-transition finance-gap estimates.
- Backtest coverage forecasts vs realised disbursement for EU JTF regions (public monitoring data).
- Sensitivity on `impairment_pct` and `support_months`; stress with delayed disbursement.

### 8.6 Limitations & model risk
- Need estimation is highly sensitive to stranded-asset assumptions — conservative fallback uses IEA
  central retirement dates, not issuer optimism.
- Double-counting risk across overlapping instruments (JETP + MDB + bond) — require instrument-level
  de-duplication before summing committed capital.
- Political-economy delivery risk (pledged ≠ disbursed) is captured only via the disbursement adjuster.
