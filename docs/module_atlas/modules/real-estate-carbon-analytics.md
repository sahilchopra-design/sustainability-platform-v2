# Real Estate Carbon Analytics
**Module ID:** `real-estate-carbon-analytics` · **Route:** `/real-estate-carbon-analytics` · **Tier:** A (backend vertical) · **EP code:** EP-DE6 · **Sprint:** DE

## 1 · Overview
Calculates operational and embodied carbon footprints for real estate portfolios using PCAF Real Estate standard. Models Scope 1/2/3 emissions, science-based decarbonisation pathways, and carbon cost exposure under EU ETS and carbon pricing scenarios.

> **Business value:** Required for banks with real estate lending books (PCAF disclosure), REITs under GRESB reporting, and property asset managers under SFDR Article 8/9. Enables CRREM pathway alignment, GRESB carbon intensity benchmarking, and EU Taxonomy green asset ratio calculation for mortgage portfolios.

**How an analyst works this module:**
- Upload property portfolio with EPC ratings and floor areas
- Calculate operational carbon using PCAF Part C attribution
- Add embodied carbon from construction year and type
- Map to CRREM decarbonisation pathway
- Calculate carbon cost exposure under €50–150/tCO2 pricing scenarios

## 2 · Function Map

### 2.1 Frontend (3 files)
**Components/functions:** `CARBON_PRICES`, `CRREM`, `Card`, `EMBODY_BENCH`, `EPC_GRADES`, `EPC_OCI`, `FRAMEWORKS`, `KpiCard`, `PROPERTIES_SEED`, `REGIONS`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FRAMEWORKS` | 8 | `full`, `scope`, `metric`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];` |
| `epc` | `EPC_GRADES[Math.floor(sr(i * 13) * EPC_GRADES.length)];` |
| `gia` | `Math.round(500 + sr(i * 17) * 19500); // m² GIA` |
| `age` | `Math.round(1950 + sr(i * 23) * 73);   // construction year` |
| `ownershipPct` | `Math.round(5 + sr(i * 29) * 95); // %` |
| `a1a3` | `Math.round(bench.a1a3 * (0.85 + sr(i * 31) * 0.30)); // kgCO₂e/m²` |
| `a4a5` | `Math.round(bench.a4a5 * (0.80 + sr(i * 37) * 0.40));` |
| `bLifeMaint` | `Math.round(120 + sr(i * 41) * 180); // B2-B5 maintenance over 60yr life` |
| `cDemolit` | `Math.round(15 + sr(i * 43) * 40);   // C1-C4 end-of-life` |
| `d_reuse` | `-Math.round(10 + sr(i * 47) * 50);  // D credits` |
| `embodiedTotal` | `a1a3 + a4a5 + bLifeMaint + cDemolit + d_reuse;` |
| `oci` | `Math.round(ociBase * (0.88 + sr(i * 53) * 0.24));` |
| `opCarbonTotal` | `oci * gia * 60 / 1000; // t` |
| `embCarbonTotal` | `embodiedTotal * gia / 1000; // t` |
| `wholeLifeCarbon` | `opCarbonTotal + embCarbonTotal;` |
| `overshoot15` | `Math.max(0, oci - crrem.b15);` |
| `overshoot20` | `Math.max(0, oci - crrem.b20);` |
| `pcafAttr` | `wholeLifeCarbon * ownershipPct / 100;` |
| `pcafPerM2` | `pcafAttr * 1000 / gia; // kgCO₂e/m² attributable` |
| `valuePerM2` | `3000 + epcIdx * -200 + sr(i * 67) * 4000; // £/m²` |
| `assetValue` | `Math.round(gia * valuePerM2 / 1000); // £k` |
| `annualOpCarbon` | `oci * gia / 1000; // tCO₂e/yr` |
| `costAt50` | `annualOpCarbon * 50;` |
| `costAt100` | `annualOpCarbon * 100;` |
| `costAt150` | `annualOpCarbon * 150;` |
| `nzGap15` | `aligned15 ? 0 : Math.round(overshoot15 / oci * 100);` |
| `nzGap20` | `aligned20 ? 0 : Math.round(overshoot20 / oci * 100);` |
| `sectorRows` | `useMemo(() => SECTORS.map(s => {` |
| `epcOciData` | `useMemo(() => EPC_GRADES.map(g => {` |
| `crremPathway` | `useMemo(() => { const avgOci = filtered.reduce((s, p) => s + p.oci, 0) / (filtered.length \|\| 1);` |
| `avgBudget15` | `filtered.reduce((s, p) => s + p.crrem15, 0) / (filtered.length \|\| 1);` |
| `avgBudget20` | `filtered.reduce((s, p) => s + p.crrem20, 0) / (filtered.length \|\| 1);` |
| `decay` | `(i / 5) * 0.35; // assumed 35% improvement by 2050 with retrofit` |
| `costSensData` | `useMemo(() => CARBON_PRICES.map(px => ({` |
| `pcafBySector` | `useMemo(() => SECTORS.map(s => {` |
| `nzTimeline` | `useMemo(() => { return Array.from({ length: 6 }, (_, i) => { const yr = 2025 + i * 5;` |
| `improveFactor` | `1 - (i / 5) * 0.40;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/real-estate-carbon-analytics/properties` | `list_properties` | api/v1/routes/real_estate_carbon_analytics.py |
| GET | `/api/v1/real-estate-carbon-analytics/properties/{row_id}` | `get_one` | api/v1/routes/real_estate_carbon_analytics.py |
| POST | `/api/v1/real-estate-carbon-analytics/properties` | `create_row` | api/v1/routes/real_estate_carbon_analytics.py |
| PUT | `/api/v1/real-estate-carbon-analytics/properties/{row_id}` | `update_row` | api/v1/routes/real_estate_carbon_analytics.py |
| DELETE | `/api/v1/real-estate-carbon-analytics/properties/{row_id}` | `delete_row` | api/v1/routes/real_estate_carbon_analytics.py |
| GET | `/api/v1/real-estate-carbon-analytics/summary` | `summary` | api/v1/routes/real_estate_carbon_analytics.py |

### 2.3 Engine `real_estate_carbon_analytics_engine` (services/real_estate_carbon_analytics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RealEstateCarbonAnalyticsEngine.summarise` | rows |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CARBON_PRICES`, `EPC_GRADES`, `FRAMEWORKS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Real Estate Global Emissions Share | — | IEA Buildings 2023 | Buildings sector accounts for 38% of global energy-related CO2 emissions including construction |
| Embodied Carbon Share | — | UNEP Global Status Report 2022 | Construction and building materials account for 11% of global CO2 — growing as operational emissions fall |
| PCAF DQ Score Target | — | PCAF Standard Part C 2022 | Data quality score 1–5; target ≤2.5 for high-quality financed emissions disclosure |
- **Property EPC certificates + energy consumption data** → PCAF Part C operational carbon → **Attributed Scope 1+2 emissions per property**
- **Construction records + material quantities** → Embodied carbon LCA → **kgCO2e/m² embodied carbon by construction type**
- **CRREM pathway data + carbon price curves** → Stranding and carbon cost analysis → **Year of pathway breach and cumulative carbon cost to 2050**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/real-estate-carbon-analytics/properties** — status `passed`, provenance ['real-db'], source tables: `ep_recarb1_properties`
Output: `{'type': 'array', 'len': 80, 'item0_keys': ['id', 'ref', 'name', 'category', 'value', 'sector', 'region', 'epc', 'epcIdx', 'gia', 'age', 'ownershipPct', 'a1a3', 'a4a5', 'bLifeMaint']}`

**GET /api/v1/real-estate-carbon-analytics/properties/{row_id}** — status `passed`, provenance ['real-db'], source tables: `ep_recarb1_properties`
Output: `{'type': 'object', 'keys': ['id', 'ref', 'name', 'category', 'value', 'sector', 'region', 'epc', 'epcIdx', 'gia', 'age', 'ownershipPct', 'a1a3', 'a4a5', 'bLifeMaint', 'cDemolit', 'd_reuse', 'embodiedTotal', 'oci', 'opCarbonTotal', 'embCarbonTotal', 'wholeLifeCarbon', 'crrem15', 'crrem20', 'overshoot`

**GET /api/v1/real-estate-carbon-analytics/summary** — status `passed`, provenance ['real-db'], source tables: `ep_recarb1_properties`
Output: `{'type': 'object', 'keys': ['count', 'total_value', 'avg_value'], 'n_keys': 3}`

**POST /api/v1/real-estate-carbon-analytics/properties** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PUT /api/v1/real-estate-carbon-analytics/properties/{row_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/v1/real-estate-carbon-analytics/properties/{row_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF Real Estate Financed Emissions
**Headline formula:** `FE = Σ [Attribution_i × (OpCarbon_i + EmbodiedCarbon_i)]; Attribution_i = OutstandingLoan_i / PropertyValue_i`

Attribution factor assigns share of property emissions proportional to loan/equity share; operational carbon from energy bills; embodied carbon from construction material LCA data

**Standards:** ['PCAF Standard Part C — Real Estate 2022', 'CRREM Decarbonisation Pathways', 'GRESB Carbon Intensity Benchmarks', 'SBTi Buildings Sector Guidance']
**Reference documents:** PCAF Global GHG Accounting and Reporting Standard Part C — Real Estate 2022; CRREM Carbon Risk Real Estate Monitor v2.0; GRESB Real Estate Assessment — Carbon Intensity Benchmarks; SBTi Buildings Sector Science-Based Target Setting Guidance; IEA Buildings Sector Report 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **64** other module(s).

| Connected module | Shared via |
|---|---|
| `module-navigator` | table:api, table:sqlalchemy |
| `reference-data-explorer` | table:api, table:sqlalchemy |
| `credit-spread-climate-monitor` | table:api, table:sqlalchemy |
| `benchmark-analytics` | table:api, table:sqlalchemy |
| `portfolio-stress-test-drilldown` | table:api |
| `portfolio-transition-alignment` | table:api |
| `portfolio-climate-pulse` | table:api |
| `portfolio-climate-var` | table:api |
| `financial-modeling-studio` | table:api |
| `portfolio-dashboard` | table:api |
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`

## 7 · Methodology Deep Dive

### 7.1 What the module computes

For 80 synthetic properties across 6 sectors, the module builds a **whole-life carbon** profile
(operational + embodied) and derives CRREM alignment, PCAF-style attributed financed emissions,
and net-zero gap metrics — genuinely matching the guide's PCAF/CRREM/RICS framing, with one
material gap (§7.2).

```
WholeLifeCarbon = OperationalCarbonTotal + EmbodiedCarbonTotal
OperationalCarbonTotal = OCI × GIA × 60yr / 1000                       (t, 60-year assessment period)
EmbodiedCarbonTotal    = (A1A3 + A4A5 + B_maint + C_demolition + D_reuse) × GIA / 1000
PCAF_Attributed        = WholeLifeCarbon × OwnershipPct / 100
```

`OCI` = operational carbon intensity (kgCO₂/m²/yr), driven by EPC grade; `GIA` = gross internal
area (m²). The backend engine (`backend/services/real_estate_carbon_analytics_engine.py`) is a
17-line stub (`summarise()` — count/total/avg only, tagged `TODO(owner): add the module's real
scenario/what-if methods`); **all of the above logic lives client-side** in
`RealEstateCarbonAnalyticsPage.jsx`.

### 7.2 Parameterisation — constants and their provenance

| Constant | Values | Provenance |
|---|---|---|
| `EPC_OCI` (kgCO₂/m²/yr by grade) | A:18, B:32, C:55, D:82, E:115, F:155, G:200 | Synthetic demo scale — ordinally correct (worse EPC ⇒ higher OCI) but not sourced from a national EPC methodology (e.g. UK SAP) |
| `EMBODY_BENCH` (A1-A3 / A4-A5, kgCO₂e/m²) | Office 380/95, Retail 340/80, Industrial 260/65, Residential 420/105, Hotel 450/115, Mixed-Use 400/100 | Synthetic sector benchmarks; broadly consistent with published RICS WLC benchmark *ranges* but presented as point values |
| `CRREM` budgets (kgCO₂/m²/yr, 2025) | Office 35/45 (1.5°C/2°C), Retail 40/52, Industrial 60/78, Residential 25/33, Hotel 45/58, Mixed-Use 38/49 | Labelled "CRREM 1.5°C and 2°C pathways" but are synthetic placeholders, not the actual CRREM v2 published per-country/sector budget table |
| Carbon price sensitivity | £50/75/100/150/200 per tCO₂ | Matches guide's "€50–150/tCO₂ pricing scenarios" range (converted to £) |
| Assessment period | 60 years | RICS Whole Life Carbon Assessment standard convention |
| B-stage maintenance | `120 + sr()×180` kgCO₂e/m² | Synthetic — no maintenance-schedule model behind it |
| D-stage reuse credit | `−(10 + sr()×50)` kgCO₂e/m² | Synthetic negative (EN 15978 "Module D" benefit convention correctly applied as a credit) |

**Gap vs guide:** the guide's headline data point "PCAF DQ Score Target ≤2.5 (PCAF Standard Part C
2022)" is **not implemented anywhere in the code** — no `dqScore`/data-quality field exists on any
property record. The PCAF attribution formula itself is also simplified: the guide states
`Attribution_i = OutstandingLoan_i / PropertyValue_i` (a lender's loan-to-value share), but the
code instead uses a synthetic `ownershipPct` (5–100%, `round(5 + sr(i*29)*95)`) directly as the
attribution fraction — a reasonable equity-ownership proxy, but not the loan-based PCAF formula
the guide quotes. See §8 for a specification closing the DQ-score gap.

### 7.3 Calculation walkthrough

1. **Per-property build** (seed, 80 rows): sector/region/EPC/GIA/age/ownership drawn from `sr()`;
   embodied stages computed off sector benchmarks ± noise; OCI off EPC base ± noise (`0.88–1.12×`).
2. **CRREM overshoot**: `overshoot15 = max(0, OCI − budget15)`; `aligned15 = (overshoot15 === 0)`.
   Stranding year is a closed-form decay approximation: `strandYr15 = min(2045, 2025 + (budget15 /
   (overshoot15+1))×6 + noise)` when not aligned, else fixed at 2060 — an algebraic proxy for "how
   fast does the gap close," not an actual pathway-intersection solve.
3. **PCAF attribution**: `pcafAttr = wholeLifeCarbon × ownershipPct/100`; `pcafPerM2 = pcafAttr ×
   1000 / gia`.
4. **Valuation**: `valuePerM2 = 3000 + epcIdx×(−200) + sr()×4000` (£/m²) — EPC grade lowers
   value-per-m² linearly by £200/notch, consistent with the "green premium" literature direction
   though the £200/notch figure is a synthetic constant, not fitted to market data.
5. **Carbon cost**: `annualOpCarbon × {50,100,150}` (£) at three carbon-price points, plus a
   5-point sensitivity table (`costSensData`) at £50/75/100/150/200.
6. **Portfolio aggregation** (`totals`): simple means/sums over `filtered` (sector/region/EPC
   filters applied) — `pctAligned15/20`, `avgNzGap15`, `totalCarbonCost = totalAnnualOp × carbonPx`
   (carbonPx is a user-adjustable slider, default £100).
7. **CRREM pathway chart** (`crremPathway`): portfolio-average OCI decayed by an assumed **35%
   improvement by 2050** (`decay = (i/5)×0.35`) against budget lines that themselves decay
   geometrically (`budget15 × 0.965^(5i)`, `budget20 × 0.975^(5i)`) — two independently-decaying
   series whose crossover is illustrative, not solved from a real retrofit capex schedule.
8. **Net-zero timeline** (`nzTimeline`): `avgNzGap15 × (1 − (i/5)×0.40)` — an assumed **40% gap
   closure by 2050**, distinct from the pathway chart's 35% OCI improvement assumption (the two
   "improvement" figures are not reconciled with each other).

### 7.4 Worked example

Property with `sector=Office` (`EMBODY_BENCH` a1a3=380, a4a5=95), `epc=D` (`EPC_OCI[D]=82`),
`gia=5,000 m²`, `ownershipPct=60%`, synthetic noise draws all at their midpoint (~1.0×):

| Step | Formula | Result |
|---|---|---|
| A1-A3 | `380 × 1.0` | 380 kgCO₂e/m² |
| A4-A5 | `95 × 1.0` | 95 kgCO₂e/m² |
| B maintenance | `120 + 0.5×180` | 210 kgCO₂e/m² |
| C demolition | `15 + 0.5×40` | 35 kgCO₂e/m² |
| D reuse | `−(10 + 0.5×50)` | −35 kgCO₂e/m² |
| Embodied total | `380+95+210+35−35` | **685 kgCO₂e/m²** |
| OCI | `82 × 1.0` | 82 kgCO₂/m²/yr |
| Op. carbon (60yr) | `82 × 5,000 × 60 / 1000` | 24,600 t |
| Emb. carbon | `685 × 5,000 / 1000` | 3,425 t |
| **Whole-life carbon** | `24,600 + 3,425` | **28,025 t** |
| CRREM 1.5°C overshoot | `82 − 35` | 47 kgCO₂/m²/yr (not aligned) |
| PCAF attributed | `28,025 × 0.60` | **16,815 t** |
| Annual op. carbon | `82 × 5,000/1000` | 410 t/yr |
| Cost at £100/t | `410 × 100` | **£41,000/yr** |

### 7.5 CRREM alignment & net-zero gap rubric

| Metric | Rule |
|---|---|
| `aligned15` | `OCI ≤ budget15[sector]` |
| `nzGap15` | `round(overshoot15 / OCI × 100)` when not aligned, else 0 — i.e. the % of current intensity that must be cut |
| Stranding year (1.5°C) | closed-form proxy, capped 2025–2045 |

### 7.6 Companion analytics

Sector summary table, EPC-vs-OCI bar, embodied-carbon lifecycle stage breakdown (A1-A3/A4-A5/
B/C/D), carbon-price sensitivity, PCAF-by-sector bar, GIA-vs-whole-life-carbon scatter (first 50
filtered properties), and a **Regulatory** tab listing 7 real frameworks (TCFD, SFDR, CSRD, UK
SDR, GRESB, NABERS, UKGBC Net Zero Carbon Buildings) with status flags — descriptive, not wired
into any calculation.

### 7.7 Data provenance & limitations

- **All 80 property records are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`. The
  fallback dataset also seeds `backend/scripts/data/real_estate_carbon_analytics.json`; when the
  API is reachable the page renders DB rows instead of the inline `PROPERTIES_SEED`, but the DB
  seed itself was generated by the same PRNG.
- The backend "engine" does not implement the module's real calculations — everything (embodied
  carbon, CRREM alignment, PCAF attribution, carbon cost) is computed client-side, so there is no
  server-side, auditable, single source of truth for these numbers as the engine file's own
  docstring claims to provide.
- No PCAF Data Quality (1–5) score is computed despite being a named guide data point — see §8.
- CRREM budgets are illustrative constants, not the actual CRREM v2 pathway file values.
- Two independent "improvement by 2050" assumptions (35% OCI decay vs 40% gap closure) are not
  reconciled — a retrofit capex-linked single improvement trajectory would be more defensible.

**Framework alignment:** PCAF Standard Part C (Real Estate, 2022) — attribution concept present,
loan-based formula substituted with an ownership-percentage proxy · CRREM v2 — pathway concept and
1.5°C/2°C dual budgets present, values are placeholders · RICS Whole Life Carbon Assessment / EN
15978 — A1-A5/B/C/D staging correctly structured, including the Module D credit sign convention ·
SBTi Buildings sector guidance — referenced in guide, not separately computed (no SBTi target
pathway distinct from CRREM appears in code) · TCFD/CSRD/SFDR/UK SDR/GRESB/NABERS — listed as
regulatory context, not computationally wired in.

## 8 · Model Specification — PCAF Data Quality Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce the PCAF Data Quality (DQ) score (1 = best, 5 = worst) per property and portfolio-weighted,
so financed-emissions disclosures meet PCAF's own reporting requirement to disclose the quality of
underlying data — currently entirely absent despite being a named guide data point ("PCAF DQ Score
Target ≤2.5"). Scope: same 80-asset real estate book as the rest of the module.

### 8.2 Conceptual approach
Implement PCAF Part C's **5-tier data quality hierarchy** directly, mirroring how PCAF Financed
Emissions is already scored elsewhere on this platform (`pcaf-financed-emissions` module's `avgDqs`
pattern) — reuse that scoring convention here for consistency across PCAF-branded modules, and
benchmark against **CRREM's own data-confidence tiering** (measured vs estimated vs default-factor
energy data) which uses an analogous concept for building-level pathway inputs.

### 8.3 Mathematical specification

```
DQ_i = 1   if OCI from sub-metered energy bills + verified GIA + independently audited EPC
DQ_i = 2   if OCI from utility billing data + verified GIA
DQ_i = 3   if OCI from EPC estimate (asset rating, not actual consumption) + verified GIA   ← default for this module's synthetic EPC-derived OCI
DQ_i = 4   if OCI from sector-average/default factor + estimated GIA
DQ_i = 5   if OCI wholly modelled, no site data

Portfolio_DQ = Σ_i (PCAF_Attributed_i × DQ_i) / Σ_i PCAF_Attributed_i        (financed-emissions-weighted average)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| Tier definitions | 1–5 hierarchy of energy-data provenance | PCAF Global GHG Accounting Standard, Part C (2022), Table 3 |
| Weighting basis | attributed emissions, not floor area | PCAF Standard §3.4 (portfolio DQ score is emissions-weighted) |

### 8.4 Data requirements
- A `dataSource` field per property (`metered` / `billed` / `epc_estimate` / `sector_default` /
  `modelled`) — not currently in `PROPERTIES_SEED`; would need one categorical field added to the
  seed generator and the DB schema (`backend/scripts/data/real_estate_carbon_analytics.json`).
- No external data needed beyond the PCAF tier table itself (public, free).

### 8.5 Validation & benchmarking plan
- Confirm portfolio DQ score falls in PCAF's reportable range (1.0–5.0) and that the ≤2.5 target
  stated in the guide is achievable only when ≥50% of the book is on tier 1-2 (metered) data —
  cross-check against the platform's own `pcaf-financed-emissions` module DQ distribution for
  consistency of DQ tiering logic across modules.
- Sensitivity: show how Portfolio_DQ moves if EPC-estimate properties (tier 3, currently the
  module's implicit default) are progressively replaced by metered data.

### 8.6 Limitations & model risk
- Without real per-property metadata on how OCI was actually sourced, any DQ score assigned to
  synthetic demo data is itself illustrative — the honest interim step is to hard-code DQ=3 for
  every synthetic property (EPC-estimate tier, matching how `OCI` is actually derived in this
  module today) rather than presenting an unearned 1 or 2.
- Portfolio DQ should never be lower (better) than the tier of its lowest-quality material
  holding without disclosure — a single "average" figure can mask concentrated data-quality risk
  in the largest attributed-emissions properties.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side whole-life carbon engine on real CRREM/EPC data (analytics ladder: rung 2 → 3)

**What.** The calculation structure is genuinely good — EN 15978 A1-A5/B/C/D staging with the correct Module D credit sign, PCAF Part C attribution, carbon-cost scenarios at €50/100/150 — but §7.7 lists the honest gaps: everything is computed client-side despite a tier-A "backend vertical" label (the engine file's docstring claims a single source of truth it doesn't provide), CRREM budgets are illustrative constants rather than the v2 pathway file values, the PCAF Data Quality score is named in the guide but never computed, both the DB seed and inline `PROPERTIES_SEED` are the same PRNG output, and two unreconciled "improvement by 2050" assumptions (35% OCI decay vs 40% gap closure) coexist. Evolution A makes the backend real.

**How.** (1) Port the whole-life carbon chain to `services/re_carbon_engine.py` behind `POST /api/v1/re-carbon/portfolio` so the numbers are auditable and pinnable; the frontend renders responses. (2) Load actual CRREM v2 pathway values (licensed for use; alternatively the sibling `REPortfolioEngine` pathway tables already exist — reuse, don't re-key). (3) Implement the §8 PCAF DQ spec: score 1–5 per property from its data lineage (actual meter data → EPC-derived estimate → floor-area proxy), replacing the missing metric. (4) Collapse the two improvement assumptions into one retrofit-linked trajectory parameter. (5) UK EPC open data (already a wave-1 platform source) replaces seeded EPC grades for UK assets.

**Prerequisites.** CRREM licensing decision; EPC ingester coverage confirmed. **Acceptance:** bench_quant reproduces the §7.4 worked example server-side; every property reports a PCAF DQ tier; the same portfolio yields identical results from API and export.

### 9.2 Evolution B — Lender disclosure copilot with attribution drill-down (LLM tier 2)

**What.** The module's users are PCAF-reporting banks and GRESB/SFDR reporters. The copilot answers the questions attribution tables provoke: "why did this mortgage's attributed emissions double?" (ownership % change vs OCI change — decomposed from the engine payload), "draft our PCAF Part C disclosure paragraph with the DQ-score distribution", "which assets breach the 1.5°C budget before their loan maturity?" — the last being a genuinely new cross-cut of stranding year × loan term the engine can compute and the copilot can narrate.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; system prompt grounded in §7.2's constants-provenance table and §7.7's framework-alignment notes, so the copilot discloses the ownership-proxy attribution (PCAF's loan-based formula substituted, as documented) whenever quoting attributed tonnes. DQ-score language follows PCAF's own disclosure convention — every emissions figure quoted with its quality tier, which the tier-1 corpus enforces via the refusal path. Report drafts render through the report-studio layer.

**Prerequisites (hard).** Evolution A (client-side numbers cannot be validated by the no-fabrication checker); DQ implementation. **Acceptance:** a drafted disclosure's tonnes and DQ distribution match `/portfolio` output exactly, and the ownership-proxy caveat appears in any attribution answer.