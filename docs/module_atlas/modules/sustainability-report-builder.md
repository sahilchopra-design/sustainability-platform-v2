# Sustainability Report Builder
**Module ID:** `sustainability-report-builder` · **Route:** `/sustainability-report-builder` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Automated sustainability report assembly platform drawing from live platform data to generate TCFD reports, GRI Standards index tables, CSRD ESRS disclosure templates, CDP questionnaire auto-fills, and investor-grade performance narratives. Includes ISSB S1/S2 alignment checker and one-click SFDR pre-contractual disclosure automation.

> **Business value:** Used by sustainability reporting teams, investor relations, and compliance officers to dramatically reduce report production time while ensuring multi-standard completeness and regulatory compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_RECOMMENDATIONS`, `DENSITY_LEVELS`, `DIGITAL_REQS`, `FRAMEWORKS_CROSS`, `MILESTONES`, `REPORT_TYPES`, `SECTIONS`, `STAKEHOLDER_PACKAGES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS_CROSS` | `['CSRD/ESRS','ISSB/IFRS S1-S2','GRI Standards','TCFD 11 Recs','BRSR Core','SASB'];` |
| `jurisdictions` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r=>r.jurisdiction))], []);` |
| `base` | `parseInt(s.wordRange.split('-')[1], 10);` |
| `base` | `parseInt(s.pageRange.split('-')[1], 10);` |
| `sectionWordData` | `useMemo(() => SECTIONS.map((s,i) => ({` |
| `row` | `{ section: s.name.length > 25 ? s.name.slice(0,23)+'...' : s.name };` |
| `seed` | `si * 100 + fi * 7 + 5000;` |
| `coverage` | `Math.round(40 + sr(seed) * 60);` |
| `timelineData` | `useMemo(() => MILESTONES.map((m,i) => {` |
| `startWeek` | `parseInt(m.week.replace('W','').split('-')[0], 10);` |
| `endWeek` | `parseInt(m.week.replace('W','').split('-')[1], 10);` |
| `maxWords` | `Math.round(parseInt(s.wordRange.split('-')[1],10) * densityMultiplier);` |

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
**Frontend seed datasets:** `CHART_RECOMMENDATIONS`, `COLORS`, `DENSITY_LEVELS`, `DIGITAL_REQS`, `FRAMEWORKS_CROSS`, `MILESTONES`, `REPORT_TYPES`, `SECTIONS`, `STAKEHOLDER_PACKAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Report Auto-Fill Rate | `auto_populated_fields / total_template_fields × 100` | Field mapping configuration | Target >80% auto-fill reduces manual reporting time by 60-70%; remaining fields require qualitative narrative  |
| ISSB S1/S2 Alignment Score | `ISSB_requirements_met / ISSB_requirements_total × 100` | ISSB S1/S2 disclosure requirements checklist | Scores >85 indicate ISSB-compliant disclosure; required for IOSCO-member jurisdictions adopting IFRS S1/S2 fro |
| SFDR Pre-Contractual Completeness | `SFDR_fields_populated / SFDR_mandatory_fields × 100` | SFDR RTS Annex II/III templates | Must reach 100% before fund distribution in EU; incomplete templates trigger regulatory distribution restricti |
- **Platform canonical ESG data → field-mapping layer → report templates** → Auto-fill population → narrative generation → alignment checking → **Publication-ready sustainability reports for TCFD, ISSB, GRI, CDP, CSRD, SFDR**

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
**Methodology:** Template-Driven Report Assembly from Canonical Data
**Headline formula:** `report_completeness = populated_fields / required_fields_per_template × 100`
**Standards:** ['TCFD Final Recommendations 2017/2023', 'ISSB S1/S2 Standards 2023', 'GRI Universal Standards 2021']

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
| `sustainability-linked-instruments` | engine:sustainability_calculator, table:JLL, table:datetime, table:decimal, table:research, table:schemas |
| `sustainability-linked-finance` | engine:sustainability_calculator, table:JLL, table:datetime, table:decimal, table:research, table:schemas |
| `stranded-assets` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-stress-test-drilldown` | table:datetime, table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:datetime, table:decimal, table:schemas, table:uuid |
| `portfolio-suite` | table:datetime, table:decimal, table:schemas, table:uuid |