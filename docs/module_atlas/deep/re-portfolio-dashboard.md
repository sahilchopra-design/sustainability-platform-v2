## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — architectural, not numerical.** A genuine, rigorous
> **CRREM stranding-year engine** exists in the backend
> (`backend/services/re_portfolio_engine.py`, 1,133 lines: `Decimal`-precision NAV roll-up,
> country/property-type CRREM pathway tables with linear interpolation, MEPS regulatory timelines
> for NL/GB/FR/DE/EU, EPC distribution, sector/geographic HHI concentration) with a full route
> layer (`backend/api/v1/routes/re_portfolio.py`, 7 endpoints incl. `/crrem`, `/epc`, `/nav`,
> `/carbon`, `/concentration`). **The frontend never calls it** — `REPortfolioDashboardPage.jsx`
> has no `fetch`/`axios` call to any `re-portfolio` endpoint. Instead, each of the 20 properties
> carries a **pre-baked, hand-authored `stranding_year` and `crrem_aligned` literal** in the
> frontend's own seed data, and the page's own JS re-derives NAV/carbon/GRESB aggregates
> independently. The backend engine's exact `Strand = min{t : EUI(t) > CRREM_pathway(t)}`
> algorithm — which is genuinely implemented — is simply unused by the page that would consume it.

### 7.1 What the module computes

**Frontend** (`REPortfolioDashboardPage.jsx`): 20 hand-curated real-world-style properties (One
Vanderbilt, The Shard, Marina Bay Financial Centre, Hudson Yards Tower D, …) each with ~40 literal
fields (GAV, NOI, cap rate, occupancy, energy/carbon intensity, `crrem_aligned` boolean,
`stranding_year`, GRESB score + 7-aspect breakdown, EPC rating, 6-hazard physical risk scores,
certification). All portfolio KPIs are `reduce()`/`filter()` aggregates over this static array —
correct arithmetic, but the CRREM stranding determination itself is **not** computed by the
frontend; it is read as a literal per property.

```js
totalGFA   = Σ gfa_m2                    totalGAV = Σ gav_usd_mn
avgEnergy  = Σ energy_intensity_kwh / n  avgCarbon = Σ carbon_intensity_kgco2 / n
crremPct   = count(crrem_aligned=true) / n × 100          // reads the pre-set boolean, doesn't derive it
avgGresb   = Σ gresb_score / n
strandingBands = bucket count of `stranding_year` into <2030/2030-34/…/2050+   // buckets a literal field
```

**Backend** (`REPortfolioEngine.calculate_portfolio_nav`, unused by this frontend page): computes
the same concepts from first principles.

### 7.2 Parameterisation

| Quantity | Frontend | Backend | Reconciliation |
|---|---|---|---|
| NAV | `Σ nav_usd_mn` (literal field) | `NAV = Σ market_value − Σ outstanding_debt` (`Decimal`, computed) | Backend derives NAV from GAV−debt; frontend stores NAV as its own pre-set literal per property (not derived from a stored debt figure) |
| Carbon intensity | `Σ carbon_intensity_kgco2 / n` (unweighted mean of a literal field) | `intensity_kg = Σ(carbon_kgco2_m2 × floor_area) / Σ floor_area`, with a **fallback derivation** from `energy_intensity × GRID_CARBON_FACTORS[country]` when direct carbon data is absent | Backend is area-weighted and has a real fallback path via country grid factors; frontend is a simple per-property average of a literal, and has no fallback logic since carbon is always pre-populated in the seed |
| Stranding year | Literal per property (e.g. One Vanderbilt: `2042`) | `min{t : EUI(t) > CRREM_pathway_{1.5C}(t)}`, using `CRREM_PATHWAYS[property_type][country][scenario]` with **linear interpolation** between the pathway's 5-year knot points (2020, 2025, …, 2050) | Backend's algorithm exactly matches the CRREM methodology named in the guide; frontend's literal values are plausible but not verifiably produced by that algorithm |
| GRESB score | `Σ gresb_score / n` + 7-aspect radar vs a flat `peer=72` benchmark ±jittered by `sr()` | *(not present in backend engine — GRESB is frontend-only)* | Backend has no GRESB logic at all; this is the frontend's own domain |
| MEPS compliance | `regulation[]` string array per property, matched against 5 hardcoded regulation names in a `regulations` KPI | `MEPS_TIMELINES` dict with year/minimum-EPC/scope per country (NL/GB/FR/DE/EU), `_calculate_meps_compliance()` checks each property's EPC against the applicable year's threshold | Backend implements the actual regulatory threshold logic; frontend just counts string-matches against a `regulation` label list |

### 7.3 Calculation walkthrough (backend engine, as it would apply if wired up)

```
1. current_threshold = interpolate(CRREM_PATHWAYS[type][country][scenario], current_year)
2. if EUI > current_threshold: already stranded, stranding_year = current_year
3. else: scan years current_year+1..2050, find first year where
         interpolate(pathway, year) < EUI  →  that's the stranding year
4. gap_pct = (EUI − current_threshold) / current_threshold × 100
5. annual_reduction_required = 1 − (target_2050/EUI)^(1/years_remaining), compounded annual rate
   needed to hit the 2050 pathway point from today's EUI
6. carbon_cost_annual = carbon_intensity_kgco2_m2 × floor_area_m2 / 1000 × carbon_price_per_tonne
```
This is precisely the exemplar-referenced CRREM methodology (`property-physical-risk.md` §8 in
this same batch flags CRREM as *entirely absent* from the sibling physical-risk module — this
backend engine is where it actually lives, just disconnected from any frontend consumer).

### 7.4 Worked example

**One Vanderbilt** (`type='Office'`, `country='US'`, `energy_intensity_kwh=185`, seed field
`stranding_year=2042`). Using the backend's actual US office 1.5°C pathway
(`{2020:250, 2025:220, 2030:180, 2035:140, 2040:105, 2045:80, 2050:60}`), interpolating linearly:
```
at 2025: threshold=220 → EUI(185) < 220, not yet stranded
at 2030: threshold=180 → EUI(185) > 180  → STRANDED between 2025 and 2030
Linear interpolation for the exact crossing year:
  threshold(y) = 220 + (180−220)/(2030−2025)×(y−2025) = 220 − 8×(y−2025)
  set 220 − 8×(y−2025) = 185  →  8×(y−2025) = 35  →  y−2025 = 4.375  →  y ≈ 2029.4 → year 2030
```
The backend algorithm would compute a **stranding year of ~2030** for this property's stated
185 kWh/m² intensity — materially earlier than the frontend's stored literal of **2042**. This
12-year gap is exactly the kind of discrepancy that arises when a real algorithmic engine exists
alongside independently hand-authored "plausible" demo values: the two are never cross-checked.

### 7.5 Companion analytics on the page

- **Cross-asset carbon comparison** (`crossAsset`) — blends this RE portfolio's carbon intensity
  against an equity portfolio's WACI (read from a separate `localStorage['ra_portfolio_v1']`) and
  an infrastructure portfolio (`ra_infra_portfolio_v1`) for a cross-asset-class carbon view — a
  genuine cross-module data bus, though again computed independently of the backend engine.
- **Regulatory exposure count** (`regulations`) — tallies properties tagged with each of 5
  regulation labels (MEES, EPBD, Local Law 97, NABERS mandatory, EPC minimum) — string membership
  check against the property's own `regulation[]` array, not the backend's date/threshold-aware
  `MEPS_TIMELINES` logic.
- **Sector/geographic concentration** — backend has `_calculate_sector_concentration` /
  `_calculate_geographic_concentration` (implying an HHI-style calculation); frontend's
  `typeDistrib` is a simple GFA-sum-by-type breakdown without a concentration index.

### 7.6 Data provenance & limitations

- The 20-property book is **hand-curated with real building names and plausible real-world
  figures** (unlike most `sr()`-seeded modules in this batch) — a strength for narrative realism,
  but the CRREM stranding years, GRESB scores, and carbon intensities are **not verifiably
  consistent with each other** or with any computed pathway, since no algorithm derives them.
- The backend `REPortfolioEngine` is materially more rigorous (Decimal precision, real CRREM
  pathway interpolation, real MEPS timelines by country) than anything the frontend page uses —
  this is a wiring gap, not a modelling gap. Wiring the frontend to `POST /api/v1/re-portfolio/crrem`
  would immediately upgrade this module from "plausible demo" to "algorithmically verifiable."
- `avgCarbon`/`avgEnergy` are unweighted per-property means; the backend's GAV/area-weighted
  versions would be more representative for portfolio-level reporting.

### 7.7 Framework alignment

**CRREM Global Pathways v2** — genuinely implemented in the backend with country- and property-
type-specific 5-year knot points and linear interpolation; **not** used by this frontend page.
**GRESB Real Estate Assessment** — frontend-only, hand-set scores with a plausible 7-aspect
breakdown, no GRESB scoring formula (see the guide's `GRESB = 0.3×Mgmt + 0.7×Perf` — not
implemented on either side). **EU MEPS Directive (recast EPBD 2024)**, **UK MEES** — backend has
accurate country-specific minimum-EPC-by-year timelines; frontend only string-matches a label.
**INREV NAV Guidelines** / **RICS Red Book** — cited in the backend engine's docstring as the
valuation-methodology basis for the NAV roll-up; the frontend's NAV figures are literals, not
derived from RICS-basis property valuations.
