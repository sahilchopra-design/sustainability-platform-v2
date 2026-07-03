# Sustainability-Linked Finance Analytics
**Module ID:** `sustainability-linked-finance` · **Route:** `/sustainability-linked-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DW3 · **Sprint:** DW

## 1 · Overview
Sustainability-Linked Loan (SLL) and Bond (SLB) analytics covering SPT calibration methodology, KPI universe (carbon intensity, renewable energy %, water use, LTIFR), margin ratchet modelling, and LMA/ICMA Principles compliance.

> **Business value:** Provides rigorous SLL/SLB analytics integrating ICMA KPI materiality scoring, SPT ambition calibration against sector pathways, and margin ratchet NPV modelling to prevent greenwashing and optimise SLF structures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULTS`, `INSTRUMENTS`, `RATINGS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INSTRUMENTS` | `['Green Bond', 'Sustainability-Linked Bond', 'Sustainability-Linked Loan', 'Transition Bond', 'Blue Bond'];` |
| `span` | `k.spt - k.baseline;` |
| `moved` | `k.achieved - k.baseline;` |
| `totW` | `s.kpis.reduce((x, k) => x + k.weight, 0) \|\| 1;` |
| `annualIntBase` | `(s.notional * s.coupon) / 100;` |
| `greenium` | `(s.notional * s.greeniumBps / 10000) * s.tenor;` |
| `stepUpPenalty` | `onTrack ? 0 : (s.notional * s.stepUpBps / 10000) * Math.max(0, s.tenor - 2);` |
| `stepDownBenefit` | `s.twoWay && weighted >= 85 ? (s.notional * s.stepDownBps / 10000) * Math.max(0, s.tenor - 2) : 0;` |
| `netBenefit` | `greenium - stepUpPenalty + stepDownBenefit;` |
| `trancheRows` | `useMemo(() => s.tranches.map(tr => {` |
| `baseInt` | `(tr.notional * tr.couponPct) / 100;` |
| `trGreenium` | `(tr.notional * tr.greeniumBps / 10000) * tr.tenor;` |
| `trStepUp` | `onTrack ? 0 : (tr.notional * tr.stepUpBps / 10000) * Math.max(0, tr.tenor - 2);` |
| `trancheTotal` | `trancheRows.reduce((x, r) => x + r.trNet, 0);` |
| `totW` | `s.kpis.reduce((x, k) => x + k.weight, 0) \|\| 1;` |
| `forecast` | `s.kpis.reduce((x, k) => {` |
| `yearsToSpt` | `Math.max(1, k.year - new Date().getFullYear());` |
| `currentMoved` | `k.achieved - k.baseline;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sustainability/dashboard` | `get_dashboard_kpis` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/certifications` | `list_certifications` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/certifications/{certification_id}` | `get_certification` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/certifications` | `create_certification` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/gresb/assess` | `calculate_gresb_assessment` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/gresb/benchmarks` | `get_gresb_benchmarks` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/leed/assess` | `calculate_leed_assessment` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/leed/thresholds` | `get_leed_thresholds` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/breeam/assess` | `calculate_breeam_assessment` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/breeam/weights` | `get_breeam_weights` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/value-impact` | `calculate_value_impact` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/benchmarks` | `list_benchmarks` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/portfolio/analyze` | `analyze_portfolio_sustainability` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/compare` | `compare_certifications` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/enums` | `get_enum_values` | api/v1/routes/sustainability.py |

### 2.3 Engine `sustainability_calculator` (services/sustainability_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `GRESBCalculator.calculate_assessment` | request | Calculate GRESB score and value impact. |
| `GRESBCalculator._get_star_rating` | score | Determine GRESB star rating from score. |
| `GRESBCalculator._calculate_percentile` | score, benchmark | Estimate percentile rank based on benchmark data. |
| `GRESBCalculator._calculate_gresb_rent_premium` | rating, region | Calculate rent premium based on GRESB rating. |
| `GRESBCalculator._calculate_gresb_cap_compression` | rating | Calculate cap rate compression in basis points. |
| `GRESBCalculator._score_to_next_star` | current_score, current_rating | Calculate points needed for next star rating. |
| `GRESBCalculator._generate_gresb_recommendations` | scores, total | Generate improvement recommendations. |
| `GRESBCalculator._identify_priority_areas` | scores | Identify priority improvement areas with potential points. |
| `LEEDCalculator.calculate_assessment` | request | Calculate LEED points and value impact. |
| `LEEDCalculator._get_certification_level` | points | Determine LEED certification level from points. |
| `LEEDCalculator._points_to_next_level` | current, level | Calculate points needed for next certification level. |
| `LEEDCalculator._analyze_categories` | scores | Analyze category performance. |
| `LEEDCalculator._calculate_market_percentile` | points | Estimate market percentile based on points. |
| `BREEAMCalculator.calculate_assessment` | request | Calculate BREEAM score and value impact. |
| `BREEAMCalculator._get_rating` | score | Determine BREEAM rating from weighted score. |
| `BREEAMCalculator._points_to_next_level` | current, level | Calculate points to next BREEAM level. |
| `BREEAMCalculator._identify_highest_performing` | scores | Identify top performing categories. |
| `BREEAMCalculator._identify_improvements` | scores, weights | Identify improvement priorities with impact analysis. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `mock-sample`

**Database tables:** `JLL` *(shared)*, `datetime` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `research` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uncertified` *(shared)*, `uuid` *(shared)*
**Frontend seed datasets:** `INSTRUMENTS`, `RATINGS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SPT Ambition Score | `Assessed against sector decarbonisation pathway pace and historical peer performance` | ICMA/LMA SPT calibration guidance | Scores below 60 raise greenwashing concerns; ICMA requires SPTs to represent material improvement, not busines |
| Ratchet NPV (Borrower) | `Σ[P(Hit) × Step-Down bps × Notional / (1+r)^t] - Σ[P(Miss) × Step-Up bps × Notional / (1+r)^t]` | Monte Carlo SPT achievement probability model | Positive NPV indicates borrower expects to achieve SPTs; symmetric ratchets (±5 bps) typical per LMA market co |
| KPI Materiality Score | `Relevance of selected KPIs to core business model and sustainability strategy` | LMA ICMA KPI materiality assessment | Material KPIs specific to issuer sector; carbon intensity most common (35%); renewable energy share (28%); wat |
- **ICMA KPI Registry** → Universe of sector-appropriate KPIs with calibration guidance → KPI selection and materiality scoring → **KPI shortlist and materiality score**
- **Company historical ESG data (Bloomberg, Sustainalytics)** → Historical KPI performance trends → SPT baseline and ambition calibration → **SPT ambition score**
- **LMA/ICMA market survey data** → Market convention for ratchet size, KPI mix, verification agent standards → compliance benchmarking → **Principles compliance score and peer comparison**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sustainability/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/sustainability/breeam/weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scheme', 'weights', 'rating_thresholds'], 'n_keys': 3}`

**GET /api/v1/sustainability/certifications** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

**GET /api/v1/sustainability/certifications/{certification_id}** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['certification_type', 'property_id', 'property_name', 'property_sector', 'region', 'certification_level', 'score', 'certification_date', 'expiration_date', 'version', 'gross_floor_area_m2', 'y`

**GET /api/v1/sustainability/dashboard** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['total_certified_properties', 'total_uncertified_properties', 'certification_coverage_percent', 'by_certification_type', 'by_level', 'total_certified_value', 'avg_value_premium_captured', 'pot`

## 5 · Intermediate Transformation Logic
**Methodology:** SPT Calibration & Margin Ratchet Modelling
**Headline formula:** `SPT Ambition = (Base Year KPI - Target KPI) / Base Year KPI × 100; Ratchet NPV = Σ[(P(Miss) × Step-Up bps × Notional) / (1+r)^t]; Compliance Score = SPTs meeting LMA/ICMA calibration criteria / total SPTs`
**Standards:** ['LMA/APLMA/LSTA Sustainability-Linked Loan Principles 2023', 'ICMA Sustainability-Linked Bond Principles 2023', 'ICMA KPI Registry for Sustainability-Linked Finance']

**Engine `sustainability_calculator` — extracted transformation lines:**
```python
management_score = scores.management + scores.policy + scores.risk_management
performance_score = scores.stakeholder_engagement + scores.performance_indicators
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
yoy_change = total_score - request.prior_year_score
potential = max_val - current
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
rent_premium = rent_premium * regional_adj * sector_adj
value_premium = value_premium * regional_adj * sector_adj
percentages[cat] = (current / max_val) * 100 if max_val > 0 else 0
weakest = [cat for cat, pct in sorted_cats[-3:] if pct < 70]
remaining = max_val - current
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
rent_premium = rent_premium * regional_adj * sector_adj
value_premium = value_premium * regional_adj * sector_adj
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **55** other module(s).
**Shared engines (edits propagate!):** `sustainability_calculator` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `sustainability-report-builder` | engine:sustainability_calculator, table:JLL, table:datetime, table:decimal, table:research, table:schemas |
| `sustainability-linked-instruments` | engine:sustainability_calculator, table:JLL, table:datetime, table:decimal, table:research, table:schemas |
| `stranded-assets` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-stress-test-drilldown` | table:datetime, table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-suite` | table:datetime, table:decimal, table:schemas, table:uuid |
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`