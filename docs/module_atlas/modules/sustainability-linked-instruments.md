# Sustainability-Linked Instruments Analytics
**Module ID:** `sustainability-linked-instruments` · **Route:** `/sustainability-linked-instruments` · **Tier:** A (backend vertical) · **EP code:** EP-DW6 · **Sprint:** DW

## 1 · Overview
Analytics platform for Sustainability-Linked Loans, Bonds, Derivatives and Insurance covering SPT calibration, KPI universe, margin ratchet modelling, second-party opinion scoring and ICMA/LMA/ISDA framework compliance.

> **Business value:** Sustainability-linked instruments have grown to >$1.5 trillion outstanding (2023) and require rigorous SPT calibration at sector top-quartile or science-based trajectory level; margin ratchets of 25-50bps on SLBs and 10-25bps on SLLs are market standard, with ICMA 2023 Principles tightening SPT ambition requirements to reduce greenwashing risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ISSUER_SECTORS`, `KPI_TEMPLATES`, `KpiCard`, `SLB_MARKET`, `SLL_MARKET`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `expectedStepUp` | `ratchetBps * stepUpProb / 100;` |
| `expectedStepDown` | `ratchetBps * (1 - stepUpProb / 100);` |
| `annCoupon` | `notionalM * (baseSpread + expectedStepUp - expectedStepDown) / 10000;` |
| `ratchetBySize` | `useMemo(() => [2.5, 5, 7.5, 10, 12.5, 15, 20].map(r => ({` |
| `arrangementFee` | `notional * 0.0035;` |
| `annualAdmin` | `notional * 0.0008;` |
| `kpiMonitoring` | `numKpis * 25000 / 1e3;` |
| `verificationFee` | `numKpis * 35000 / 1e3;` |
| `totalLifetime` | `arrangementFee + (annualAdmin + kpiMonitoring + verificationFee) * maturity;` |

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
**Frontend seed datasets:** `ISSUER_SECTORS`, `KPI_TEMPLATES`, `SLB_MARKET`, `SLL_MARKET`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SPT Ambition Score | `Score = f(sector_benchmark_percentile, SBTi_alignment, baseline_year)` | ICMA SPO Framework 2023 | Ambitious SPTs benchmarked at top 15-25% of sector peers; SBTi alignment adds 1 score point; 2030 interim targ |
| Margin Ratchet | `Rate_adj = ±ratchet_bps if KPI_outcome vs SPT target` | LMA 2023 | SLL margin step-up 5-25bps on SPT miss; SLB coupon step-up 25-50bps; asymmetric ratchets (penalty>reward) gain |
| Second-Party Opinion Score | `SPO_score = Σ(KPI_relevance + SPT_ambition + reporting + verification)` | Sustainalytics / ISS-ESG / Vigeo | SPO score >75/100 typically required for ESG index inclusion; ISS and Sustainalytics account for 60%+ of globa |
- **ICMA KPI registry** → → SPT selection → **500+ metrics by sector and ESG pillar**
- **Peer SPT database** → → ambition benchmarking → **Target levels and timelines by sector**

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
**Methodology:** SPT Calibration Methodology
**Headline formula:** `SPT_ambition = (Baseline_KPI - Target_KPI) / Baseline_KPI × 100%; benchmark against sector leaders and science-based trajectories`
**Standards:** ['ICMA SLB Principles 2023', 'LMA Sustainability Linked Loan Principles 2023', 'ISDA SL Derivatives Definitions 2022']

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
| `sustainability-linked-finance` | engine:sustainability_calculator, table:JLL, table:datetime, table:decimal, table:research, table:schemas |
| `stranded-assets` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-stress-test-drilldown` | table:datetime, table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-suite` | table:datetime, table:decimal, table:schemas, table:uuid |