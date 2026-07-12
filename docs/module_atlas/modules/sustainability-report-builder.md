# Sustainability Report Builder
**Module ID:** `sustainability-report-builder` · **Route:** `/sustainability-report-builder` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Automated sustainability report assembly platform drawing from live platform data to generate TCFD reports, GRI Standards index tables, CSRD ESRS disclosure templates, CDP questionnaire auto-fills, and investor-grade performance narratives. Includes ISSB S1/S2 alignment checker and one-click SFDR pre-contractual disclosure automation.

> **Business value:** Used by sustainability reporting teams, investor relations, and compliance officers to dramatically reduce report production time while ensuring multi-standard completeness and regulatory compliance.

**How an analyst works this module:**
- Select report standard and time period
- Review auto-populated fields and complete qualitative sections
- Run ISSB S1/S2 alignment check and CDP mapping review
- Publish and export final report in required format (PDF, XBRL, CSV)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_RECOMMENDATIONS`, `DENSITY_LEVELS`, `DIGITAL_REQS`, `FRAMEWORKS_CROSS`, `MILESTONES`, `REPORT_TYPES`, `SECTIONS`, `STAKEHOLDER_PACKAGES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REPORT_TYPES` | 32 | `framework`, `jurisdiction`, `required`, `audience`, `pages`, `complexity`, `sections`, `iXBRL` |
| `SECTIONS` | 10 | `name`, `who`, `what`, `when`, `where`, `why`, `pageRange`, `wordRange`, `dataPct`, `narrativePct`, `semiPct`, `visualPct`, `tone` |
| `STAKEHOLDER_PACKAGES` | 6 | `icon`, `priority`, `emphasis`, `format`, `length` |
| `CHART_RECOMMENDATIONS` | 10 | `charts`, `count` |
| `DIGITAL_REQS` | 9 | `mandatory`, `applies`, `detail` |
| `MILESTONES` | 9 | `week`, `tasks`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS_CROSS` | `['CSRD/ESRS','ISSB/IFRS S1-S2','GRI Standards','TCFD 11 Recs','BRSR Core','SASB'];` |
| `jurisdictions` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r=>r.jurisdiction))], []);` |
| `totalWords` | `useMemo(() => { return SECTIONS.reduce((sum, s) => { const base = parseInt(s.wordRange.split('-')[1], 10);` |
| `totalPages` | `useMemo(() => { return SECTIONS.reduce((sum, s) => { const base = parseInt(s.pageRange.split('-')[1], 10);` |
| `sectionWordData` | `useMemo(() => SECTIONS.map((s,i) => ({` |
| `frameworkMatrix` | `useMemo(() => { return SECTIONS.map((s,si) => { const row = { section: s.name.length > 25 ? s.name.slice(0,23)+'...' : s.name };` |
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
| `BREEAMCalculator._calculate_percentile` | score, regional_avg | Estimate percentile based on score. |
| `ValueImpactCalculator.calculate_value_impact` | request | Calculate value impact of certification. |
| `ValueImpactCalculator._get_cap_rate_compression` | cert_type, level | Get cap rate compression for certification. |
| `ValueImpactCalculator._get_source_studies` | cert_type | Get academic/industry source studies for premiums. |
| `PortfolioSustainabilityCalculator.analyze_portfolio` | request | Analyze portfolio sustainability metrics. |
| `PortfolioSustainabilityCalculator._generate_recommendations` | coverage, score, by_type, uncertified | Generate portfolio improvement recommendations. |
| `SustainabilityEngine.calculate_gresb` | request |  |
| `SustainabilityEngine.calculate_leed` | request |  |
| `SustainabilityEngine.calculate_breeam` | request |  |
| `SustainabilityEngine.calculate_value_impact` | request |  |
| `SustainabilityEngine.analyze_portfolio` | request |  |

**Engine `sustainability_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `RENT_PREMIUMS` | `{CertificationType.LEED: {LEEDLevel.CERTIFIED: {'low': Decimal('2.0'), 'mid': Decimal('4.0'), 'high': Decimal('6.0')}, LEEDLevel.SILVER: {'low': Decimal('4.0'), 'mid': Decimal('6.0'), 'high': Decimal('8.0')}, LEEDLevel.GOLD: {'low': Decimal('6.0'), 'mid': Decimal('9.0'), 'high': Decimal('12.0')}, LE` |
| `CAP_RATE_COMPRESSION` | `{CertificationType.LEED: {LEEDLevel.CERTIFIED: 15, LEEDLevel.SILVER: 25, LEEDLevel.GOLD: 40, LEEDLevel.PLATINUM: 60}, CertificationType.BREEAM: {BREEAMLevel.PASS: 10, BREEAMLevel.GOOD: 20, BREEAMLevel.VERY_GOOD: 35, BREEAMLevel.EXCELLENT: 50, BREEAMLevel.OUTSTANDING: 70}}` |
| `OPERATING_COST_SAVINGS` | `{CertificationType.LEED: Decimal('8.0'), CertificationType.BREEAM: Decimal('7.0'), CertificationType.ENERGY_STAR: Decimal('10.0'), CertificationType.WELL: Decimal('3.0')}` |
| `GRESB_BENCHMARKS` | `{Region.NORTH_AMERICA: {'peer_avg_score': Decimal('72'), 'top_quartile_threshold': Decimal('82'), 'bottom_quartile_threshold': Decimal('60'), 'num_peers': 450}, Region.EUROPE: {'peer_avg_score': Decimal('76'), 'top_quartile_threshold': Decimal('86'), 'bottom_quartile_threshold': Decimal('65'), 'num_` |
| `GRESB_RATING_THRESHOLDS` | `{GRESBRating.FIVE_STAR: 80, GRESBRating.FOUR_STAR: 60, GRESBRating.THREE_STAR: 40, GRESBRating.TWO_STAR: 20, GRESBRating.ONE_STAR: 0}` |
| `LEED_LEVEL_THRESHOLDS` | `{LEEDLevel.PLATINUM: 80, LEEDLevel.GOLD: 60, LEEDLevel.SILVER: 50, LEEDLevel.CERTIFIED: 40}` |
| `BREEAM_LEVEL_THRESHOLDS` | `{BREEAMLevel.OUTSTANDING: Decimal('85'), BREEAMLevel.EXCELLENT: Decimal('70'), BREEAMLevel.VERY_GOOD: Decimal('55'), BREEAMLevel.GOOD: Decimal('45'), BREEAMLevel.PASS: Decimal('30')}` |
| `REGIONAL_ADJUSTMENTS` | `{Region.NORTH_AMERICA: Decimal('1.0'), Region.EUROPE: Decimal('1.1'), Region.ASIA_PACIFIC: Decimal('0.9'), Region.MIDDLE_EAST: Decimal('0.85'), Region.LATIN_AMERICA: Decimal('0.75'), Region.AFRICA: Decimal('0.7')}` |
| `SECTOR_ADJUSTMENTS` | `{PropertySector.OFFICE: Decimal('1.0'), PropertySector.RETAIL: Decimal('0.85'), PropertySector.INDUSTRIAL: Decimal('0.7'), PropertySector.MULTIFAMILY: Decimal('0.9'), PropertySector.HOTEL: Decimal('0.8'), PropertySector.HEALTHCARE: Decimal('0.95'), PropertySector.DATA_CENTER: Decimal('0.6'), Propert` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `mock-sample`

**Database tables:** `JLL` *(shared)*, `datetime` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `research` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uncertified` *(shared)*, `uuid` *(shared)*
**Frontend seed datasets:** `CHART_RECOMMENDATIONS`, `COLORS`, `DENSITY_LEVELS`, `DIGITAL_REQS`, `FRAMEWORKS_CROSS`, `MILESTONES`, `REPORT_TYPES`, `SECTIONS`, `STAKEHOLDER_PACKAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Report Auto-Fill Rate | `auto_populated_fields / total_template_fields × 100` | Field mapping configuration | Target >80% auto-fill reduces manual reporting time by 60-70%; remaining fields require qualitative narrative input. |
| ISSB S1/S2 Alignment Score | `ISSB_requirements_met / ISSB_requirements_total × 100` | ISSB S1/S2 disclosure requirements checklist | Scores >85 indicate ISSB-compliant disclosure; required for IOSCO-member jurisdictions adopting IFRS S1/S2 from 2025. |
| SFDR Pre-Contractual Completeness | `SFDR_fields_populated / SFDR_mandatory_fields × 100` | SFDR RTS Annex II/III templates | Must reach 100% before fund distribution in EU; incomplete templates trigger regulatory distribution restrictions. |
- **Platform canonical ESG data → field-mapping layer → report templates** → Auto-fill population → narrative generation → alignment checking → **Publication-ready sustainability reports for TCFD, ISSB, GRI, CDP, CSRD, SFDR**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sustainability/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/sustainability/breeam/weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scheme', 'weights', 'rating_thresholds'], 'n_keys': 3}`

**GET /api/v1/sustainability/certifications** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

**GET /api/v1/sustainability/certifications/{certification_id}** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['certification_type', 'property_id', 'property_name', 'property_sector', 'region', 'certification_level', 'score', 'certification_date', 'expiration_date', 'version', 'gross_floor_area_m2', 'year_built', 'current_value', 'noi', 'id', 'value_premium_percent', 'rent_premium`

**GET /api/v1/sustainability/dashboard** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['total_certified_properties', 'total_uncertified_properties', 'certification_coverage_percent', 'by_certification_type', 'by_level', 'total_certified_value', 'avg_value_premium_captured', 'potential_value_uplift', 'avg_gresb_score', 'avg_leed_points', 'avg_breeam_score', `

**GET /api/v1/sustainability/enums** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['certification_types', 'leed_levels', 'breeam_levels', 'gresb_ratings', 'property_sectors', 'regions'], 'n_keys': 6}`

**GET /api/v1/sustainability/gresb/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks', 'total', 'year'], 'n_keys': 3}`

**GET /api/v1/sustainability/leed/thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['levels', 'max_points', 'categories'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Template-Driven Report Assembly from Canonical Data
**Headline formula:** `report_completeness = populated_fields / required_fields_per_template × 100`

Report assembly maps canonical ESG metric values to standard-specific disclosure templates using a field-mapping configuration layer. Narrative generation uses structured templates with metric-to-sentence substitution for quantitative sections; qualitative governance and strategy sections use AI-assisted drafting with human review. CDP questionnaire auto-fill uses sector-specific CDP mapping tables to route platform data to ~500 CDP question fields with evidence attachment support.

**Standards:** ['TCFD Final Recommendations 2017/2023', 'ISSB S1/S2 Standards 2023', 'GRI Universal Standards 2021']
**Reference documents:** ISSB S1 General Requirements for Sustainability-related Financial Disclosures (2023); ISSB S2 Climate-related Disclosures (2023); GRI Universal Standards 2021; SFDR RTS (EU) 2022/1288

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
rent_premium = rent_mid * regional_adj * sector_adj
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
annual_rent_increase = rent_premium_psf * request.gross_floor_area_sf
coverage = (len(certified_assets) / total_assets * 100) if total_assets > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **37** other module(s).
**Shared engines (edits propagate!):** `sustainability_calculator` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `sustainability-linked-finance` | engine:sustainability_calculator, table:JLL, table:decimal, table:research, table:schemas, table:uncertified |
| `sustainability-linked-instruments` | engine:sustainability_calculator, table:JLL, table:decimal, table:research, table:schemas, table:uncertified |
| `portfolio-stress-test-drilldown` | table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-pulse` | table:decimal, table:schemas, table:uuid |
| `portfolio-manager` | table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **automated report-assembly platform**
> that "draws from live platform data," auto-populates fields via a "field-mapping configuration
> layer," runs "AI-assisted drafting," computes an "ISSB S1/S2 Alignment Score" from a real
> requirements checklist, auto-fills ~500 CDP questionnaire fields, and automates SFDR
> pre-contractual disclosure completeness. **None of this is implemented.** The page ingests no
> canonical ESG data at all (no props, no API calls, no context imports) — it is a **static
> report-planning and methodology-blueprint tool**: 30 report-type reference rows, a 9-section
> disclosure blueprint with word/page ranges, a content-mix designer, a stakeholder-package guide,
> chart recommendations, and a project timeline. The one place a "framework alignment" figure
> appears (`frameworkMatrix`), it is **`sr()`-seeded random noise** (40–100 range), not a
> requirements-met/total calculation. Sections below document the planning tool as built.

### 7.1 What the module computes

10 tabs (`TABS`) covering: Report Type Selector (30 reference report types — CSRD/ESRS, ISSB, SEC
Reg S-K, BRSR, GRI, TCFD, CDP, plus 20 more jurisdiction-specific formats, each with a static
page-range, complexity, section-count, and iXBRL-required flag), Section Blueprint (9 disclosure
sections each with a 5W1H content-planning template — who/what/when/where/why plus page/word ranges
and a data/narrative/semi-narrative/visual content-mix percentage split), Component Mix Designer,
Content Density Planner, Stakeholder Package Builder (5 audience-tailored section-priority lists),
Drafting Workspace, Framework Alignment Checker, Visual Design Guide (recommended chart types per
section), Digital Publishing Planner (ESEF/iXBRL/PDF-A/accessibility requirements), and Timeline &
Milestones (8-phase, 26-week project plan).

### 7.2 The only two live calculations

```js
densityMultiplier = [0.6, 1.0, 1.4, 1.8][densityLevel]        // Light/Balanced/High/Maximum
totalWords = Σ_sections round(wordRange.max × densityMultiplier)
totalPages = Σ_sections round(pageRange.max × densityMultiplier)

frameworkMatrix[section][framework] = round(40 + sr(seed) × 60)     // seed = si×100 + fi×7 + 5000
```

`densityMultiplier` scales every section's **maximum** stated word/page count by a single factor
(0.6×–1.8×) selected from a 4-level slider — a report-length planning aid, not a content
recalculation. `frameworkMatrix`'s "coverage" cells are pure pseudo-random values in [40,100] keyed
by `section_index×100 + framework_index×7 + 5000` — structurally identical to every other synthetic
`sr()` field in this codebase, with no relationship to any actual CSRD/ISSB/GRI/TCFD/BRSR/SASB
requirement text.

### 7.3 Reference data structure

| Table | Rows | What it contains |
|---|---|---|
| `REPORT_TYPES` | 30 | Real-world report format names (CSRD/ESRS, ISSB S1/S2, SEC Reg S-K, BRSR, GRI, TCFD, CDP, IR, SFDR, EU Taxonomy, UK SDR, TNFD, SBTi, SASB, CBAM, CSDDD, EUDR, ASRS, SSBJ, SGX, HKEX, K-ESG, CVM, plus internal formats) with jurisdiction, required-flag, audience, page range, complexity tier, section count, iXBRL flag |
| `SECTIONS` | 9 | CEO Letter, Corporate Overview, Strategy/Governance/Risk, Materiality, Environmental (E1-E5), Social (S1-S4), Governance (G1), Benchmarking, Appendices/Assurance — each with a 5W1H template and a data/narrative/semi/visual % split summing to 100 |
| `STAKEHOLDER_PACKAGES` | 5/6 | Investor/Employee/Customer/Regulator/Community audience packages with section priority ordering |
| `CHART_RECOMMENDATIONS` | 9 | Recommended chart types and count range per section |
| `DIGITAL_REQS` | 8 | ESEF/iXBRL, SEC XBRL, PDF/A, interactive HTML, API feed, multi-language, WCAG, social-media summary — mandatory flags by jurisdiction |
| `MILESTONES` | 8 | Planning → Data Collection → Materiality → Drafting → Design → Assurance → Digital Prep → Publication, with week ranges |

All of the above are hand-authored, accurate reference content (the report-type list, section
page/word ranges, and content-mix percentages are realistic for real disclosure documents) but are
**static** — none of it is generated from, or written back to, actual company ESG data.

### 7.4 Calculation walkthrough

1. **Report Type Selector** — filters the 30-row `REPORT_TYPES` table by jurisdiction and
   required/optional status; purely a lookup/filter, no scoring.
2. **Section Blueprint** — `getMix`/`setMix` let a user override a section's data/narrative/semi/
   visual percentage split in local component state (`mixOverrides`); overrides are never persisted
   or exported to an actual report document.
3. **Content Density Planner** — `totalWords`/`totalPages` recompute at 4 density levels, purely
   arithmetic scaling of the static max-range figures.
4. **Framework Alignment Checker** — renders `frameworkMatrix`'s random 40–100 "coverage" per
   section × framework cell as if it were a computed cross-framework requirement-mapping score.
5. **Timeline & Milestones** — `timelineData` parses each phase's `"W5-W12"`-style week-range string
   into `{start, duration}` for a Gantt-style bar chart — correct string-parsing arithmetic, applied
   to static phase definitions.

### 7.5 Worked example

At `densityLevel=2` ("High", multiplier 1.4): section 5 ("Environmental Performance E1-E5",
`wordRange:'5000-15000'`) contributes `round(15000×1.4) = 21000` words to `totalWords`, and
(`pageRange:'15-40'`) contributes `round(40×1.4) = 56` pages to `totalPages`. Summing the max-word
figures across all 9 sections at this density (CEO 2500, Overview 4000, Strategy 8000, Materiality
5000, Environmental 15000, Social 10000, Governance 5000, Benchmarking 4000, Appendices 10000 = 63,500
base words) gives `totalWords ≈ round(63500×1.4) = 88,900` words — illustrating that at "High"
density a fully-detailed CSRD-grade report is modelled at ~89,000 words (~250+ pages at typical
disclosure-document word density), consistent with the `REPORT_TYPES` table's own CSRD/ESRS entry
(`pages:'80-200'`) once cross-checked, though the two figures are computed independently and not
reconciled against each other in code.

### 7.6 Data provenance & limitations

- **No live ESG data ingestion.** Despite the guide's claim of drawing from "canonical ESG data,"
  the component takes no props, calls no API, and imports no platform context — every figure is
  either a static reference constant or `sr()`-seeded noise.
- The "ISSB S1/S2 Alignment Score," "CDP question-field auto-fill," "SFDR pre-contractual
  completeness," and "report_completeness = populated_fields/required_fields" formula named in the
  guide have **zero code presence** — no field-population tracking, no template engine, no export to
  PDF/XBRL exists in this file.
- `frameworkMatrix` coverage values are decorative random numbers dressed as a requirements-coverage
  heatmap; presenting them as-is to a user risks being read as a real compliance score.
- Section content-mix percentages (data/narrative/semi/visual splits) are plausible editorial
  guidance but are not derived from any analysis of actual published reports.

**Framework alignment:** the `REPORT_TYPES` and `SECTIONS` reference tables correctly name and
describe real disclosure regimes (CSRD/ESRS double materiality in Materiality section, ESRS E1-E5/
S1-S4/G1 structure in Environmental/Social/Governance sections, TCFD's 4-pillar structure implicit in
Strategy/Governance/Risk). This is accurate **planning-stage reference content** for a report team,
not an automated disclosure-generation engine — the module is best understood as a project-planning
and structuring aid, and the guide description should be rewritten to match.

## 9 · Future Evolution

### 9.1 Evolution A — Real framework-coverage engine replacing the seeded-random alignment matrix (analytics ladder: rung 1 → 2)

**What.** The §7 deep-dive documents that this module is a static report-planning tool, not the automated assembly platform its guide claims: no API calls, no canonical-data ingestion, and a "Framework Alignment Checker" whose coverage heatmap is `sr()`-seeded noise in [40,100] (`frameworkMatrix`, seed `si×100 + fi×7 + 5000`). Evolution A builds the module's first honest computation: a real requirements-coverage score per section × framework, and a genuine `report_completeness = populated_fields / required_fields` calc.

**How.** (1) Author a requirements-mapping table (new `report_framework_requirements` rows: framework, requirement id, mapped section) for the 6 `FRAMEWORKS_CROSS` regimes — the ESRS/GRI catalogs already sit in the refdata layer, so CSRD and GRI rows can be generated rather than hand-written. (2) Replace `frameworkMatrix`'s random cells with `requirements_mapped / requirements_total` per section. (3) Wire the Drafting Workspace's `mixOverrides` and section state to a persisted report instance (new backend route; today the mapped `sustainability.py` endpoints are unrelated real-estate certification calculators), enabling a true completeness percentage. Density planning (`totalWords`/`totalPages`) stays as-is — it is correct arithmetic.

**Prerequisites.** The seeded-random `frameworkMatrix` must be removed, not layered over — it is the module's one documented fabrication risk (§7.6) and would fail `check_no_fabricated_random.py` conventions if ported to backend. **Acceptance:** identical section/framework pairs always score identically across reloads; each coverage cell drills down to the named requirement ids behind it.

### 9.2 Evolution B — Grounded drafting copilot for the section blueprint (LLM tier 1)

**What.** The module's genuine strength is its hand-authored reference corpus: 30 `REPORT_TYPES`, the 9-section 5W1H blueprint, `STAKEHOLDER_PACKAGES`, `DIGITAL_REQS`, and the 26-week `MILESTONES` plan. A tier-1 copilot turns this into an interactive report-planning assistant: "we're a EU-listed industrial filing CSRD and CDP — which sections overlap, what's my realistic page budget, what must be iXBRL-tagged?" answered strictly from these tables plus this Atlas page.

**How.** Embed the reference tables and §7 methodology text as the module's `llm_corpus_chunks` per the Tier-1 pattern (pgvector, per-module system prompt, prompt-cached). The copilot composes across tables — jurisdiction filter on `REPORT_TYPES`, section priorities from the matching stakeholder package, `DIGITAL_REQS` mandatory flags — and drafts 5W1H content-planning skeletons for a chosen section using the section's own data/narrative/semi/visual mix percentages as structure. It must not emit alignment scores while `frameworkMatrix` is still random (refusal path: "coverage scoring is not yet computed in this module"). Escalation to tier 2 (auto-drafting from live platform metrics) is explicitly out of scope until Evolution A's persistence layer and a real field-mapping engine exist — the §7 flag is precisely that this automation is currently claimed but absent.

**Prerequisites.** Guide text rewritten to match reality (per §7.6) so the copilot's grounding corpus doesn't teach it false capabilities. **Acceptance:** copilot answers cite specific reference-table rows; adversarial probe "what's my ISSB alignment score?" yields a refusal, not a number.