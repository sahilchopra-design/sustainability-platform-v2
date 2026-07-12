# RE Portfolio Dashboard
**Module ID:** `re-portfolio-dashboard` · **Route:** `/re-portfolio-dashboard` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real estate portfolio ESG analytics dashboard integrating GRESB scores, energy benchmarking, carbon intensity pathways, and CRREM stranding analysis.

> **Business value:** Provides real estate investment managers with a consolidated GRESB-aligned ESG performance view, peer benchmarking, and CRREM stranding risk integration.

**How an analyst works this module:**
- Import GRESB submission data or asset energy certificates.
- Review GRESB score breakdown and peer benchmark position.
- Overlay CRREM pathway and identify stranding risk assets.
- Generate investor reporting pack aligned to GRESB standards.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `COUNTRIES_RE`, `COUNTRY_TO_ISO`, `CRREM_PATHWAY`, `CURRENCIES`, `Card`, `DEFAULT_RE_PORTFOLIO`, `EPC_RATINGS`, `EQUITY_KEY`, `GRESB_ASPECTS`, `HAZARD_LABELS`, `INFRA_KEY`, `KPI`, `PERIODS`, `PIE_COLORS`, `PROPTYPE_TO_API`, `PROP_TYPES`, `RE_KEY`, `RE_PORTFOLIO_API`, `SortIcon`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CRREM_PATHWAY` | 7 | `portfolio`, `target` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `RE_PORTFOLIO_API` | ``${API}/api/v1/re-portfolio`;` |
| `debt` | `Math.max(0, gav - nav);` |
| `ltv` | `gav > 0 ? Math.min(100, (debt / gav) * 100) : 0;` |
| `PROP_TYPES` | `['Office','Retail','Logistics','Residential','Data Center','Mixed-Use','Life Sciences','Hotel','Healthcare'];` |
| `fmt` | `(v, d = 1) => v != null ? v.toFixed(d) : '-';` |
| `fmtB` | `v => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`;` |
| `updated` | `{ ...reData, properties: reData.properties.map(p => p.id === propId ? { ...p, ...changes } : p) };` |
| `nextNum` | `reData.properties.length + 1;` |
| `final` | `{ ...prop, id: `RE-${String(nextNum).padStart(2, '0')}` };` |
| `news` | `samples.map(s => { const p = { ...s, id: `RE-${String(nextNum).padStart(2, '0')}` }; nextNum++; return p; });` |
| `types` | `useMemo(() => ['All', ...new Set(props.map(p => p.type))], [props]);` |
| `countries` | `useMemo(() => ['All', ...new Set(props.map(p => p.country))], [props]);` |
| `totalGFA` | `props.reduce((s, p) => s + p.gfa_m2, 0);` |
| `totalGAV` | `props.reduce((s, p) => s + p.gav_usd_mn, 0);` |
| `numCountries` | `new Set(props.map(p => p.country)).size;` |
| `avgEnergy` | `props.length ? props.reduce((s, p) => s + p.energy_intensity_kwh, 0) / props.length : 0;` |
| `avgCarbon` | `props.length ? props.reduce((s, p) => s + p.carbon_intensity_kgco2, 0) / props.length : 0;` |
| `crremPct` | `props.length ? (props.filter(p => p.crrem_aligned).length / props.length * 100) : 0;` |
| `avgGresb` | `props.length ? props.reduce((s, p) => s + p.gresb_score, 0) / props.length : 0;` |
| `certCoverage` | `props.length ? (props.filter(p => p.certification).length / props.length * 100) : 0;` |
| `avgPhysRisk` | `props.length ? props.reduce((s, p) => s + p.physical_risk_score, 0) / props.length : 0;` |
| `avgRenewable` | `props.length ? props.reduce((s, p) => s + (p.renewable_pct \|\| 0), 0) / props.length : 0;` |
| `infraInvest` | `infraAssets.reduce((s, a) => s + (a.total_investment_usd_mn \|\| 0), 0);` |
| `infraAvoided` | `infraAssets.reduce((s, a) => s + (a.avoided_emissions_tco2e \|\| 0), 0);` |
| `greenLeasePct` | `props.length ? props.reduce((s, p) => s + p.green_lease_pct, 0) / props.length : 0;` |
| `avgTenantSat` | `props.length ? props.reduce((s, p) => s + p.tenant_satisfaction, 0) / props.length : 0;` |
| `totalGAVLive` | `isLive ? navLive.gross_asset_value / 1e6 : totalGAV;` |
| `certDistrib` | `useMemo(() => { const m = {}; props.forEach(p => { const c = p.certification \|\| 'Uncertified'; m[c] = (m[c] \|\| 0) + p.gfa_m2; }); return Object.entries(m).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, ` |
| `physRiskData` | `useMemo(() => { const keys = ['flood_risk','heat_risk','wind_risk','wildfire_risk','sea_level_risk','drought_risk']; return HAZARD_LABELS.map((label, i) => ({ hazard: label, score: props.length ? Math.round(props.reduce(` |
| `gresbRadar` | `useMemo(() => { const peer = 72; return GRESB_ASPECTS.map((a, i) => ({ aspect: a, portfolio: Math.round(avgGresb * (0.85 + (sr(i * 13) * 2 - 1) * 0.15)), peer: Math.round(peer * (0.9 + (sr(i * 509) * 2 - 1) * 0.1)) })); ` |
| `typeDistrib` | `useMemo(() => { const m = {}; props.forEach(p => { m[p.type] = (m[p.type] \|\| 0) + p.gfa_m2; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [props]);` |
| `crossAsset` | `useMemo(() => { const eqH = equityData?.holdings \|\| []; const eqWACI = eqH.length > 0 ? eqH.reduce((s, h) => s + (h.carbon_intensity \|\| h.carbonIntensity \|\| 0) * (h.weight \|\| h.portfolioWeight \|\| 0.01), 0) : 142; const r` |
| `regulations` | `useMemo(() => ['MEES','EPBD','Local Law 97','NABERS mandatory','EPC minimum'].map(r => ({ regulation: r, count: props.filter(p => (p.regulation \|\| '').includes(r)).length, properties: props.filter(p => (p.regulation \|\| '` |
| `exportCSV` | `(rows, filename) => { if (!rows.length) return; const keys = Object.keys(rows[0]); const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` ` |
| `exportPortfolio` | `() => exportCSV(props.map(p => ({ ID: p.id, Name: p.name, Type: p.type, City: p.city, Country: p.country, 'GFA(m2)': p.gfa_m2, 'GAV($M)': p.gav_usd_mn, 'Energy(kWh/m2)': p.energy_intensity_kwh, 'Carbon(kgCO2/m2)': p.carb` |
| `exportRisk` | `() => exportCSV(props.map(p => ({ ID: p.id, Name: p.name, 'Phys Risk': p.physical_risk_score, Flood: p.flood_risk, Heat: p.heat_risk, Wind: p.wind_risk, Wildfire: p.wildfire_risk, 'Sea Level': p.sea_level_risk, Drought: ` |
| `progress` | `t.lower ? (target > 0 ? Math.min(100, (1 - (t.current - target) / Math.max(t.current, 1)) * 100) : 100) : (target > 0 ? Math.min(100, t.current / target * 100) : 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/re-portfolio/nav` | `calculate_portfolio_nav` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/crrem` | `crrem_analysis` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/epc` | `epc_analysis` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/concentration` | `concentration_analysis` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/carbon` | `carbon_metrics` | api/v1/routes/re_portfolio.py |
| GET | `/api/v1/re-portfolio/meps-timelines` | `get_meps_timelines` | api/v1/routes/re_portfolio.py |
| GET | `/api/v1/re-portfolio/crrem-pathways` | `get_crrem_pathways` | api/v1/routes/re_portfolio.py |

### 2.3 Engine `re_portfolio_engine` (services/re_portfolio_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `epc_meets_minimum` | rating, minimum | True if rating is at or above the minimum EPC threshold. |
| `REPortfolioEngine.calculate_portfolio_nav` | portfolio, crrem_scenario, carbon_price_eur_per_tco2 | Full portfolio NAV calculation with all sub-analyses. Args: portfolio: Portfolio definition with property list. crrem_scenario: CRREM scenario ("1.5C" or "2C"). carbon_price_eur_per_tco2: Carbon price for cost calculations. Returns: PortfolioNAVResult with complete analysis. |
| `REPortfolioEngine._calculate_nav_headline` | props |  |
| `REPortfolioEngine._calculate_yield_metrics` | props, gav |  |
| `REPortfolioEngine._calculate_esg_adjusted_nav` | props |  |
| `REPortfolioEngine._calculate_carbon_metrics` | props |  |
| `REPortfolioEngine._calculate_epc_distribution` | props |  |
| `REPortfolioEngine._calculate_green_brown_split` | props |  |
| `REPortfolioEngine._calculate_meps_compliance` | props |  |
| `REPortfolioEngine._get_meps_minimum` | country_iso, target_year | Get the applicable MEPS minimum EPC for a country at a target year. |
| `REPortfolioEngine._calculate_crrem_stranding` | props, scenario, carbon_price |  |
| `REPortfolioEngine._assess_single_property_crrem` | prop, scenario, carbon_price | Run CRREM stranding assessment on a single property. |
| `REPortfolioEngine._get_crrem_pathway` | property_type, country_iso, scenario | Get CRREM pathway for property type + country + scenario. |
| `REPortfolioEngine._interpolate_pathway` | pathway, year | Linear interpolation of CRREM pathway for a given year. |
| `REPortfolioEngine._calculate_sector_concentration` | props, gav |  |
| `REPortfolioEngine._calculate_geographic_concentration` | props, gav |  |
| `REPortfolioEngine._build_validation_summary` | portfolio, crrem_scenario, carbon_price |  |
| `REPortfolioEngine._empty_result` | portfolio |  |
| `_pct` | numerator, denominator |  |
| `_pct_decimal` | numerator, denominator |  |
| `_safe_avg` | values |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `decimal` *(shared)*, `enum`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES_RE`, `CRREM_PATHWAY`, `CURRENCIES`, `EPC_RATINGS`, `GRESB_ASPECTS`, `HAZARD_LABELS`, `PERIODS`, `PIE_COLORS`, `PROP_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio GRESB Score | — | GRESB Submission | Current GRESB total score for portfolio entity submission. |
| GRESB Star Rating | — | GRESB Benchmark | Relative performance tier based on score vs global GRESB peer group. |
| Carbon Intensity (kgCO₂e/m²) | — | Energy Data Aggregation | Portfolio weighted average GHG emissions per unit floor area. |
- **GRESB submissions + energy meter data + EPC certificates** → GRESB score computation; CRREM stranding overlay; peer benchmarking → **GRESB-aligned portfolio ESG report and investor disclosure pack**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/re-portfolio/crrem-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pathways'], 'n_keys': 1}`

**GET /api/v1/re-portfolio/meps-timelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['timelines'], 'n_keys': 1}`

**POST /api/v1/re-portfolio/carbon** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re-portfolio/concentration** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re-portfolio/crrem** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re-portfolio/epc** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re-portfolio/nav** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** GRESB Total Score
**Headline formula:** `GRESB = 0.3×Management + 0.7×Performance; Performance = 0.5×Energy + 0.3×GHG + 0.2×Water`

Weighted composite of GRESB management and performance components across energy, GHG, and water indicators.

**Standards:** ['GRESB Real Estate Assessment Reference Guide (2024)']
**Reference documents:** GRESB Real Estate Assessment Reference Guide (2024); CRREM Carbon Risk Real Estate Monitor Global Pathways v2

**Engine `re_portfolio_engine` — extracted transformation lines:**
```python
nav = gav - total_debt
w = p.market_value / gav
noi_yield = (total_noi / gav * 100).quantize(
esg_impact = ((esg_adj_gav - gav) / gav * 100).quantize(
climate_impact = ((climate_adj_gav - gav) / gav * 100).quantize(
prop_emissions = p.carbon_intensity_kgco2_m2 * p.floor_area_m2
prop_emissions = p.energy_intensity_kwh_m2 * p.floor_area_m2 * grid_ef
total_emissions_t = (total_emissions / 1000).quantize(
intensity = (total_emissions / total_area / 1000).quantize(
avg_years = Decimal(str(sum(years_list) / len(years_list))).quantize(
years_to_stranding = yr - self.current_year
gap = ei - current_threshold
gap_pct = Decimal(str(gap / current_threshold * 100)).quantize(
years_rem = 2050 - self.current_year
ratio = target_2050 / ei
annual_pct = (1 - ratio ** (1 / years_rem)) * 100
carbon_intensity = ei * grid_ef
annual_tonnes = Decimal(str(carbon_intensity)) * prop.floor_area_m2 / 1000
carbon_cost = (annual_tonnes * carbon_price).quantize(
t = (year - y1) / (y2 - y1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **15** other module(s).

| Connected module | Shared via |
|---|---|
| `portfolio-stress-test-drilldown` | table:decimal |
| `portfolio-transition-alignment` | table:decimal |
| `portfolio-climate-var` | table:decimal |
| `portfolio-dashboard` | table:decimal |
| `portfolio-climate-pulse` | table:decimal |
| `portfolio-manager` | table:decimal |
| `real-estate-valuation` | table:decimal |
| `sustainability-report-builder` | table:decimal |
| `portfolio-optimizer` | table:decimal |
| `portfolio-suite` | table:decimal |

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

## 9 · Future Evolution

### 9.1 Evolution A — Close the wiring gap: page numbers from the engine (analytics ladder: rung 2 → 3)

**What.** §7.6 identifies the platform's cleanest kind of fix: the backend `REPortfolioEngine` is genuinely rigorous (Decimal precision, real CRREM pathway interpolation with country/property-type knot points, accurate MEPS/MEES minimum-EPC timelines, INREV/RICS-cited NAV roll-up, seven live endpoints) while the frontend renders a hand-curated 20-property book whose CRREM stranding years, GRESB scores, and carbon intensities are mutually unverifiable — "a wiring gap, not a modelling gap." Evolution A wires the page to its own engine and fixes two aggregation defects: `avgCarbon`/`avgEnergy` are unweighted per-property means (the engine's GAV/area-weighted versions are correct for portfolio reporting), and the `gresbRadar` peer comparison is `sr()`-jittered rather than data-driven.

**How.** (1) On portfolio load/edit, call `POST /re-portfolio/nav`, `/crrem`, `/epc`, `/carbon`, `/concentration`; per-property stranding years and MEPS compliance render from responses, with the local book kept only as the editable input register. (2) Replace unweighted means with the engine's weighted metrics; delete the seeded radar jitter (peer values become nulls until a real GRESB benchmark import exists — honest-nulls convention). (3) Implement the missing GRESB composite (`0.3×Mgmt + 0.7×Perf` per the guide) in the engine so the score is derived from aspect inputs rather than hand-set. (4) bench_quant pins one property's CRREM stranding year against a hand-interpolated pathway.

**Prerequisites.** None architectural — endpoints exist; the localStorage↔API portfolio handshake with the CRREM/stress sibling modules kept consistent. **Acceptance:** editing a property's energy intensity changes its engine-computed stranding year on screen; portfolio carbon intensity is area-weighted and matches the engine payload exactly.

### 9.2 Evolution B — Investor-reporting copilot over engine output (LLM tier 2)

**What.** The module's last documented workflow step — "generate investor reporting pack aligned to GRESB standards" — has no generator. Evolution B builds it as a tool-calling copilot: "draft the quarterly ESG section: GRESB position, CRREM alignment %, MEPS non-compliance list with remediation deadlines by country" — each figure fetched from the module's endpoints, the MEPS deadlines quoted from the engine's own country timeline tables rather than model memory.

**How.** Tier-2 tool schemas over the seven existing operations (this module can skip tier 1 because its backend is already trustworthy once Evolution A wires it); narrative templates composed per the `3-outputs` report-studio pattern the roadmap designates as the render layer. System prompt grounded in §7.6/§7.7: the copilot must state that GRESB scores are portfolio-entered (not GRESB-verified) until a submission import exists, and route stranding-methodology questions to the CRREM pathway data (`GET /crrem-pathways`) it can actually cite. Every kgCO₂e/m², %, and year in a generated pack validated against tool outputs.

**Prerequisites.** Evolution A (a reporting pack narrating today's unverifiable hand-set numbers would launder them); report-studio integration for rendering. **Acceptance:** a generated pack's stranding table equals the `/crrem` response row-for-row, and the GRESB-provenance caveat appears whenever scores are quoted.