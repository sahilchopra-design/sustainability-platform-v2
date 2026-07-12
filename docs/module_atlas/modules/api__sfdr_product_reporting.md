# Api::Sfdr_Product_Reporting
**Module ID:** `api::sfdr_product_reporting` · **Route:** `/api/v1/sfdr-product-reporting` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sfdr-product-reporting/generate-report` | `generate_report` | api/v1/routes/sfdr_product_reporting.py |
| POST | `/api/v1/sfdr-product-reporting/verify-sustainable-investment` | `verify_sustainable_investment` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/pai-indicators` | `ref_pai_indicators` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/sfdr-articles` | `ref_sfdr_articles` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/sustainable-investment-criteria` | `ref_sustainable_investment_criteria` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/rts-sections/{article}` | `ref_rts_sections` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/reporting-timeline` | `ref_reporting_timeline` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/dnsh-objectives` | `ref_dnsh_objectives` | api/v1/routes/sfdr_product_reporting.py |

### 2.3 Engine `sfdr_product_reporting_engine` (services/sfdr_product_reporting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRProductReportingEngine.generate_report` | product_id, product_name, sfdr_article, reporting_period, sections_completed, benchmark_index, aum_mn, pai_data |  |
| `SFDRProductReportingEngine.verify_sustainable_investment` | product_id, holdings | Aggregate sustainable-investment qualification from real holdings. Each holding may carry: weight weighting for value-weighted aggregation (default 1.0) is_sustainable bool — holding qualifies as a sustainable investment dnsh_verified bool — passes Do-No-Significant-Harm on all 6 objectives social_good bool — makes a positive social/environmental contribution governance_screened bool — passes good |
| `SFDRProductReportingEngine.ref_pai_indicators` |  |  |
| `SFDRProductReportingEngine.ref_sfdr_articles` |  |  |
| `SFDRProductReportingEngine.ref_sustainable_investment_criteria` |  |  |
| `get_engine` |  |  |

**Engine `sfdr_product_reporting_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `PAI_MANDATORY_INDICATORS` | `{'PAI-1': {'name': 'GHG Emissions', 'unit': 'tCO2eq/EUR M invested', 'threshold': None}, 'PAI-2': {'name': 'Carbon Footprint', 'unit': 'tCO2eq/EUR M invested', 'threshold': None}, 'PAI-3': {'name': 'GHG Intensity of Investee Companies', 'unit': 'tCO2eq/EUR M revenue', 'threshold': None}, 'PAI-4': {'` |
| `SFDR_ARTICLES` | `{'8': {'name': 'Article 8 — Environmental/Social Characteristics', 'mandatory_sections': ['summary', 'no_significant_harm', 'environmental_social_characteristics', 'investment_strategy', 'proportion_investments', 'monitoring', 'due_diligence', 'engagement', 'designated_index', 'website_info'], 'pai_` |
| `SUSTAINABLE_INVESTMENT_CRITERIA` | `['dnsh_verified', 'social_good_contribution', 'governance_screening', 'additionality']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-product-reporting/ref/dnsh-objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['objectives', 'rule'], 'n_keys': 2}`

**GET /api/v1/sfdr-product-reporting/ref/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['PAI-1', 'PAI-2', 'PAI-3', 'PAI-4', 'PAI-5', 'PAI-6', 'PAI-7', 'PAI-8', 'PAI-9', 'PAI-10', 'PAI-11', 'PAI-12', 'PAI-13', 'PAI-14'], 'n_keys': 14}`

**GET /api/v1/sfdr-product-reporting/ref/reporting-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'applies_from', 'periodic_report_deadline', 'article_8_annex', 'article_9_annex', 'pai_statement_deadline', 'website_disclosure'], 'n_keys': 7}`

**GET /api/v1/sfdr-product-reporting/ref/rts-sections/{article}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/sfdr-product-reporting/ref/sfdr-articles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['8', '9'], 'n_keys': 2}`

**GET /api/v1/sfdr-product-reporting/ref/sustainable-investment-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['criteria'], 'n_keys': 1}`

**POST /api/v1/sfdr-product-reporting/generate-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-product-reporting/verify-sustainable-investment** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_product_reporting_engine` — extracted transformation lines:**
```python
delta = round(val - bench, 2) if (val is not None and bench is not None) else None
report.pai_coverage_pct = round(sum(covs) / len(covs), 1) if covs else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sfdr-product-reporting` (engine E22, `sfdr_product_reporting_engine.py`) produces
**product-level SFDR periodic reports** (RTS 2022/1288 Annex III for Art 8, Annex V for Art 9) and
a **sustainable-investment verification** aggregate. Its header carries an explicit data-integrity
covenant: *"Every returned metric is either a REAL computation from caller-supplied inputs … or an
HONEST NULL when the required input is absent. No metric is drawn at random."*

```
report_completeness_pct   = (mandatory − missing) / mandatory × 100     (null if sections unknown)
pai_coverage_pct          = mean of supplied per-indicator coverage_pct (null if none)
vs_benchmark_delta        = value − benchmark_value                     (only when both present)
verified_sustainable_pct  = min(dnsh %, social-good %, governance %)    over supplied components
weighted_share(flag)      = Σ w_h[flag true] / Σ w_h × 100              only over holdings reporting the flag
```

### 7.2 Parameterisation

**PAI registry** (`PAI_MANDATORY_INDICATORS`) — the 14 RTS Table-1 mandatory indicators with the
correct RTS numbering and units: PAI-1 GHG emissions (tCO₂e/€M invested), PAI-2 carbon footprint,
PAI-3 GHG intensity (tCO₂e/€M revenue), PAI-4 fossil-fuel exposure (%, threshold 0.0), PAI-5
non-renewable energy %, PAI-6 energy intensity (MWh/€M revenue), PAI-7 biodiversity-sensitive
areas (yes/no), PAI-8 emissions to water, PAI-9 hazardous waste, PAI-10 UNGC/OECD violations,
PAI-11 lack of UNGC/OECD processes, PAI-12 unadjusted gender pay gap, PAI-13 board gender
diversity, PAI-14 controversial weapons (yes/no, threshold 0.0).

**Article configs** (`SFDR_ARTICLES`): Art 8 has 10 mandatory report sections (summary, DNSH,
E/S characteristics, strategy, proportion, monitoring, due diligence, engagement, designated
index, website info); Art 9 swaps in sustainable-investment-objective and attainment-of-objective
sections and adds benchmark-sustainability extras.

**Verification criteria** (`SUSTAINABLE_INVESTMENT_CRITERIA`): dnsh_verified,
social_good_contribution, governance_screening, additionality (noted "optional under RTS").

**Thresholds:** DNSH gap flag when `dnsh_verified_pct < 0.80 × sustainable_pct`; PAI coverage
warning below 75 %; Art 9 recommendation when verified sustainable < 50 %. All three are platform
conventions, not statutory numbers.

### 7.3 Calculation walkthrough

1. **Completeness** — only computed when the caller states `sections_completed`; otherwise null
   plus the warning "Report completeness not assessed". Gaps list the missing mandatory sections.
2. **PAI table** — all 14 indicators always appear; each takes the caller's value (yes/no
   indicators coerced to 0/1 floats), coverage, and benchmark (benchmark used only if a
   `benchmark_index` is named). Aggregate coverage is the simple mean over indicators that
   reported coverage.
3. **Verification (in-report)** — echoes supplied DNSH/social/governance percentages;
   `verified_sustainable_pct` is the **minimum** of supplied components, encoding the RTS logic
   that a sustainable investment must clear *all three* tests simultaneously (a conservative
   lower bound, since the min assumes perfect overlap of failures).
4. **Verification (from holdings)** (`POST /verify-sustainable-investment`) — exposure-weighted
   share per boolean flag, aggregated **only over holdings that report the flag** but normalised
   by *total* portfolio weight — so unreported holdings implicitly count as "no". If no holdings
   or no flags: `data_status = "insufficient_data"`.
5. Taxonomy alignment and per-objective breakdown are pass-throughs from the taxonomy engine;
   website-disclosure completeness is tri-state (None = unknown).

### 7.4 Worked example — Art 9 fund verification

Holdings: A (w 40, is_sustainable ✓, dnsh ✓, social_good ✓, governance ✓), B (w 35, is_sustainable
✓, dnsh ✗, social_good ✓, governance ✓), C (w 25, flags absent).

| Metric | Computation | Result |
|---|---|---|
| total_w | 40+35+25 | 100 |
| sustainable_pct | (40+35)/100 | **75.0 %** |
| dnsh_verified_pct | 40/100 | **40.0 %** |
| social_good_pct | (40+35)/100 | 75.0 % |
| governance_screened_pct | 75.0 % | 75.0 % |
| verified_sustainable_pct | min(40, 75, 75) | **40.0 %** |

Feeding these into `generate_report` (Art 9, `sustainable_investment_pct = 75`):
`dnsh 40 < 0.80 × 75 = 60` → `fails_criteria = ["dnsh_gap"]`; verified 40 < 50 → recommendation
"Art 9 fund: verified sustainable investment % is low — review DNSH assessment process".

### 7.5 Interconnections

The engine is explicitly the aggregation tail of three upstream engines: entity-level PAI values
(`sfdr_pai_engine` family) feed `pai_data`; the EU-taxonomy engine feeds
`taxonomy_aligned_pct`/`taxonomy_by_objective`; DNSH/good-governance screens feed the verification
sub-metrics. `GET /ref/*` endpoints expose the registries (PAI indicators, articles, DNSH
objectives, RTS sections, reporting timeline, sustainable-investment criteria) as static
reference data for the frontend.

### 7.6 Data provenance & limitations

- **No PRNG, no fabrication** — this is one of the remediated "honest null" engines: every metric
  is caller-derived or null with `insufficient_data`/warning markers. The `aum_mn = 100.0` default
  parameter exists in the signature but is never used in any computation.
- `verified_sustainable_pct = min(components)` is a bound, not a measured joint qualification —
  real verification requires holding-level conjunction (which `verify_sustainable_investment`
  does correctly when flags are supplied per holding, via all-flag booleans, though it also
  reports each flag independently rather than their intersection).
- The holdings aggregator treats missing flags as failing (numerator omits them, denominator
  keeps their weight) — conservative but can understate compliance for data-gap reasons.
- No historical/YoY comparison in this engine (that lives in `sfdr_report_generator`); no iXBRL.

### 7.7 Framework alignment

- **SFDR RTS (EU) 2022/1288 Annex III/V** — periodic-report section lists mirror the RTS
  templates' question headings; PAI Table-1 numbering and units are faithful to the RTS.
- **SFDR Art 2(17) sustainable investment definition** — the three-part test (contribution to an
  E/S objective, DNSH, good governance) is exactly the verification triple; the engine's min-rule
  operationalises "must satisfy all three".
- **EU Taxonomy Regulation 2020/852** — DNSH across the six environmental objectives (CCM, CCA,
  water, circular economy, pollution, biodiversity) is referenced via `dnsh_verified` and the
  per-objective taxonomy breakdown.
- **SFDR Art 10** — website product-disclosure completeness is tracked as the tri-state
  `website_disclosure_complete` with a remediation recommendation when false.

## 9 · Future Evolution

### 9.1 Evolution A — Engine-fed PAI values and benchmark context (analytics ladder: rung 1 → 3)

**What.** The E22 engine produces product-level SFDR periodic reports (RTS 2022/1288 Annex III/V)
and a sustainable-investment verification, under an explicit data-integrity covenant in its header:
"Every returned metric is either a REAL computation from caller-supplied inputs … or an HONEST NULL
… No metric is drawn at random." Computations are deliberately thin: completeness %, mean PAI
coverage, `vs_benchmark_delta = value − benchmark` (only when both supplied), and
`verified_sustainable_pct = min(dnsh%, social%, governance%)`. The covenant is exemplary; the
limitation is that PAI values and benchmarks are all caller-typed. Evolution A feeds them from the
platform.

**How.** (1) Source the 14 RTS Table-1 PAI values from `pcaf_regulatory`/`pcaf_quality`/
`portfolio_reporting` (which compute them from holdings) so a report's indicators are engine-fed
with per-indicator provenance, honest-null preserved where the pipeline lacks data. (2) Populate
`benchmark_value` from the `peer_benchmark`/refdata layer so `vs_benchmark_delta` is computed
against a real cohort rather than left null. (3) Add year-over-year PAI tracking (the RTS periodic
report requires historical comparison) from stored prior reports. (4) Bench-pin the verification
min-rule and completeness scoring.

**Prerequisites.** PCAF/PAI engine linkage; a stored report history for YoY; a benchmark source.
**Acceptance:** PAI indicators auto-fill from platform engines with provenance and honest nulls;
benchmark deltas computed for covered indicators; YoY comparison from stored reports; the covenant
behaviour (no fabricated metric) regression-tested.

### 9.2 Evolution B — Product-disclosure copilot with verification narrative (LLM tier 2)

**What.** A copilot that generates and explains a product's SFDR periodic report — "your Art 9 fund
verifies at 62% sustainable investment (bound by the DNSH component); PAI coverage is 78%, with
PAI-7 and PAI-13 unpopulated" — each figure from `generate-report`/`verify-sustainable-investment`,
with the RTS section structure from the reference endpoints.

**How.** Two POST endpoints plus rich reference GETs (the 14 PAI indicators with RTS numbering and
units, SFDR articles, sustainable-investment criteria, per-article RTS sections, DNSH objectives,
reporting timeline) — a complete regulatory grounding corpus. The min-rule decomposition lets the
copilot explain which component binds the verified percentage. The engine's honest-null covenant is
the copilot's contract: unpopulated indicators are reported as gaps, never estimated. Pairs with
`sfdr_annex` (templates) and `pcaf_regulatory` (PAI computation).

**Prerequisites.** None hard — the engine's covenant makes it copilot-safe today; Evolution A makes
answers substantive rather than echoing caller input. **Acceptance:** every completeness, coverage,
and verification figure traces to a tool response; null indicators are narrated as gaps with the RTS
indicator name and unit from the reference registry; the copilot refuses to fill a missing PAI value
and refuses to assert RTS filing compliance.