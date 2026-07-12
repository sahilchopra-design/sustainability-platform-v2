# Api::Pcaf_Quality
**Module ID:** `api::pcaf_quality` · **Route:** `/api/v1/pcaf-quality` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-quality/score-holding` | `score_holding` | api/v1/routes/pcaf_quality.py |
| POST | `/api/v1/pcaf-quality/score-portfolio` | `score_portfolio` | api/v1/routes/pcaf_quality.py |
| POST | `/api/v1/pcaf-quality/assess-data-quality` | `assess_data_quality` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/asset-classes` | `ref_asset_classes` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/dqs-levels` | `ref_dqs_levels` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/quality-dimensions` | `ref_quality_dimensions` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/emission-factors` | `ref_emission_factors` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/attribution-methods` | `ref_attribution_methods` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/improvement-paths` | `ref_improvement_paths` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/benchmarks` | `ref_benchmarks` | api/v1/routes/pcaf_quality.py |

### 2.3 Engine `pcaf_quality_engine` (services/pcaf_quality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PCAFQualityEngine.score_holding` | holding | Score a single holding across all PCAF quality dimensions. Args: holding: Dict with keys: - holding_id (str): Unique identifier for the exposure. - entity_name (str): Borrower / investee legal name. - asset_class (str): One of the PCAF asset class IDs. - outstanding_amount_eur (float): Outstanding exposure in EUR. - reported_emissions (optional dict): Keys scope1, scope2, scope3 in tCO2e. None if  |
| `PCAFQualityEngine.score_portfolio` | portfolio | Score an entire portfolio and produce regulatory disclosures. Args: portfolio: Dict with keys: - portfolio_id (str) - portfolio_name (str) - reporting_year (int) - holdings (list[dict]): Each a holding dict per score_holding(). - total_aum_eur (optional float): Total AUM for PAI 2 calc. Returns: PCAFPortfolioQualityReport with exposure-weighted DQS, asset class breakdown, SFDR PAI indicators, impr |
| `PCAFQualityEngine.assess_data_quality` | entity_name, reporting_year, data_inventory | Assess data quality for an entity without full emissions calc. Args: entity_name: Legal name of the borrower / investee. reporting_year: Assessment year. data_inventory: Dict describing available data: - emissions_source (str): 'verified', 'reported', 'physical', 'economic', 'sector_proxy', or 'none'. - scopes_covered (list[str]): e.g. ['scope1', 'scope2']. - data_year (int): Year of data. - granu |
| `PCAFQualityEngine._score_emissions_quality` | reported, phys_data, revenue, verification | Score the emissions data quality dimension (1-5). |
| `PCAFQualityEngine._score_completeness` | reported | Score data completeness dimension (1-5). |
| `PCAFQualityEngine._score_timeliness` | data_year, reporting_year | Score data timeliness dimension (1-5). |
| `PCAFQualityEngine._score_granularity` | reported, phys_data, revenue | Score data granularity dimension (1-5). |
| `PCAFQualityEngine._score_methodology` | asset_class, verification, reported | Score methodology robustness dimension (1-5). |
| `PCAFQualityEngine._dqs_to_confidence` | weighted_dqs | Map weighted DQS (1-5) to confidence weight (1.0-0.2). |
| `PCAFQualityEngine._estimate_emissions` | reported, phys_data, revenue, nace, outstanding, asset_class | Estimate total entity emissions (tCO2e) using best available data. Priority: reported > physical activity > revenue-based > sector proxy. |
| `PCAFQualityEngine._compute_attribution` | holding, outstanding | Compute the PCAF attribution factor for a holding. Returns a factor in [0, 1] representing the investor's share of the investee's total emissions. |
| `PCAFQualityEngine._identify_gaps` | reported, phys_data, revenue, verification, data_year, reporting_year | Identify data gaps for a holding. |
| `PCAFQualityEngine._get_improvement_actions` | overall_dqs, gaps | Return prioritised improvement actions based on current DQS and gaps. |
| `PCAFQualityEngine._portfolio_uncertainty` | scored, total_outstanding | Compute exposure-weighted average uncertainty percentage. |
| `PCAFQualityEngine._build_improvement_roadmap` | scored, total_outstanding | Build a prioritised quality improvement roadmap. Priority = count_of_holdings_at_level x DQS_improvement_potential x outstanding_weight. |
| `PCAFQualityEngine._map_source_to_dqs` | emissions_source, verification | Map an emissions data source string to a DQS level. |
| `PCAFQualityEngine._score_scope_coverage` | scopes, verification | Score completeness based on scope coverage list. |
| `PCAFQualityEngine._edq_rationale` | emissions_source, verification | Generate rationale text for emissions data quality score. |
| `PCAFQualityEngine._completeness_rationale` | scopes | Generate rationale text for completeness score. |
| `PCAFQualityEngine._methodology_rationale` | pcaf_applied, verification | Generate rationale text for methodology robustness score. |
| `PCAFQualityEngine.get_asset_classes` |  | Return all 6 PCAF asset classes with attribution methods. |
| `PCAFQualityEngine.get_dqs_levels` |  | Return all 5 PCAF DQS levels (1=best, 5=worst). |
| `PCAFQualityEngine.get_quality_dimensions` |  | Return the 5 PCAF quality assessment dimensions with weights. |
| `PCAFQualityEngine.get_emission_factors` |  | Return NACE-sector emission factors for DQS 4-5 estimation. |
| `PCAFQualityEngine.get_attribution_methods` |  | Return the 4 PCAF attribution approaches. |
| `PCAFQualityEngine.get_improvement_paths` |  | Return DQS improvement pathways (5->4, 4->3, 3->2, 2->1). |
| `PCAFQualityEngine.get_cross_framework_map` |  | Return PCAF-to-regulatory cross-framework mappings (10 entries). |
| `PCAFQualityEngine.get_quality_benchmarks` |  | Return sector-median DQS benchmarks (10 sectors). |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DQS`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-quality/ref/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_classes'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/attribution-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['attribution_methods'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_map'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/dqs-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dqs_levels'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['emission_factors'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/improvement-paths** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['improvement_paths'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/quality-dimensions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['quality_dimensions'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `pcaf_quality_engine` — extracted transformation lines:**
```python
financed_emissions = round(estimated_emissions * attribution_factor, 4)
pai_2 = round(total_financed / (aum_for_pai / 1_000_000), 4) if aum_for_pai > 0 else 0.0
weight = s.outstanding_amount / total_outstanding if total_outstanding > 0 else 0.0
lag = reporting_year - data_year
rev_meur = revenue / 1_000_000
outs_meur = outstanding / 1_000_000
estimated_denom = outstanding / 0.3 if outstanding > 0 else 1.0
lag = reporting_year - data_year
weight = s.outstanding_amount / total_outstanding
improvement_potential = dqs_level - max(1, dqs_level - 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `pcaf_quality` domain (`/api/v1/pcaf-quality`) is a **PCAF Data Quality Score engine**
(`pcaf_quality_engine.py`) that scores holdings across five quality dimensions, aggregates
exposure-weighted portfolio DQS, computes SFDR PAI indicators, and maps PCAF outputs to eight
regulatory/voluntary frameworks. The route file exposes reference data (`/ref/*`); the engine
holds the scoring logic.

### 7.1 What the module computes

Per holding, a `weighted_dqs` (1 best … 5 worst) is the dimension-weighted mean of five
sub-scores, plus a confidence weight, estimated + financed emissions, data gaps and
improvement actions:

```
weighted_dqs = 0.35·emissions + 0.25·completeness + 0.15·timeliness
             + 0.15·granularity + 0.10·methodology
financed_emissions = estimated_emissions × attribution_factor
```

Portfolio-level: exposure-weighted DQS, DQS 1-5 distribution, per-asset-class breakdown,
carbon intensity, SFDR PAI 1/2/3, and a quality-improvement roadmap.

### 7.2 Parameterisation / scoring rubric

**Quality dimensions & weights** (`PCAF_QUALITY_DIMENSIONS`, sum = 1.0): emissions data
quality 0.35, completeness 0.25, timeliness 0.15, granularity 0.15, methodology 0.10.

**DQS levels** (`PCAF_DQS_LEVELS`) — confidence weight and typical uncertainty per level:

| DQS | Label | Confidence | Uncertainty |
|---|---|---|---|
| 1 | Audited emissions | 1.0 | 5% |
| 2 | Unaudited reported | 0.8 | 15% |
| 3 | Physical-activity estimate | 0.6 | 30% |
| 4 | Economic-activity estimate | 0.4 | 45% |
| 5 | Sector-average proxy | 0.2 | 60% |

**Emission factors** (`PCAF_EMISSION_FACTORS`, tCO₂e/€M revenue by NACE section, source PCAF
DB 2023 / Eurostat / EEA): D (electricity) S1 1450; B (mining) 680; A (agri) 520; K (finance)
8. **Attribution methods** (`PCAF_ATTRIBUTION_METHODS`): EVIC, balance-sheet (equity+debt),
project-level pro-rata, floor-area. **Sector-median DQS benchmarks**
(`PCAF_QUALITY_BENCHMARKS`, 2024): Real-estate 2.8, Asset-mgmt 3.2, Insurance 4.0,
Private-equity 4.1 — for peer comparison.

### 7.3 Calculation walkthrough

`score_holding` scores each dimension via `_score_emissions_quality` (verified→low DQS),
`_score_completeness` (Scope coverage), `_score_timeliness` (data lag vs reporting year),
`_score_granularity`, `_score_methodology`. The five combine by the weight vector →
`weighted_dqs`; `_dqs_to_confidence` inverts to a confidence weight; `_estimate_emissions`
uses reported data if present else `sector_ef × revenue` (or outstanding for DQS 5);
`_compute_attribution` builds the asset-class attribution factor; `financed = estimated ×
attribution`.

`score_portfolio` scores each holding, then computes **exposure-weighted** portfolio DQS
`Σ(dqs·outstanding)/Σ outstanding`, DQS distribution buckets (rounding each holding's
weighted_dqs to 1-5), carbon intensity `total_financed / (total_outstanding/1e6)`, and
per-asset-class averages. SFDR PAI 1 = total financed emissions, PAI 2 = total/AUM, PAI 3 =
weighted intensity.

### 7.4 Worked example

Holding: business loan, `outstanding = €10M`, unaudited reported Scope 1+2 = 5,000 tCO₂e
(no Scope 3), data year = reporting year, NACE C, balance-sheet total €200M.

- **Dimension DQS** (illustrative): emissions 2 (reported, unverified), completeness 3
  (Scope 3 missing), timeliness 1 (current), granularity 2, methodology 2.
- **Weighted DQS:** `0.35·2 + 0.25·3 + 0.15·1 + 0.15·2 + 0.10·2 = 0.70+0.75+0.15+0.30+0.20 =
  2.10`.
- **Confidence:** DQS≈2 → ~0.8.
- **Attribution (balance sheet):** `af = 10 / 200 = 0.05`.
- **Financed:** `5,000 · 0.05 = 250 tCO₂e`.
- **Carbon intensity:** `250 / (10) = 25 tCO₂e/€M outstanding`.

At the portfolio level, a book of this holding would show `portfolio_wdqs ≈ 2.10` — better
than the commercial-banking benchmark median of 3.8.

### 7.5 Cross-framework disclosure map

`PCAF_CROSS_FRAMEWORK_MAP` documents 10 data flows: PCAF total → **SFDR PAI 1**; footprint →
PAI 2; WACI → PAI 3; asset-class emissions → **CSRD ESRS E1-6** (Scope 3 Cat 15); → **TCFD**
Metrics & Targets; → **IFRS S2** para 29(a)(vi); → **GRI 305-3**; outstanding → **EU Taxonomy
GAR** denominator; DQS distribution → **CDP C-FS14**; baseline → **NZBA** sectoral targets.

### 7.6 Data provenance & limitations

- Emission factors and DQS benchmarks are **cited public reference tables** (PCAF DB 2023,
  Eurostat, EEA, CRREM) as constants; benchmark sample sizes (n = 12-50) are illustrative
  peer panels, not a live survey.
- **No `sr()` fabrication** — emissions are either reported or estimated by transparent
  sector-factor formulas.
- Dimension sub-scoring uses heuristic thresholds on data presence/recency, a simplification
  of a full PCAF quality audit.

**Framework alignment:** **PCAF Global GHG Accounting Standard v2.0 (Nov 2022)** — the DQS 1-5
hierarchy, five quality dimensions and attribution methods implement the standard directly.
**SFDR RTS Annex I** — PAI 1/2/3 are computed from the portfolio roll-up. **CSRD ESRS E1-6**,
**IFRS S2**, **GRI 305-3**, **TCFD**, **EU Taxonomy GAR** and **NZBA** consume PCAF outputs
per the documented cross-framework map.

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio uncertainty propagation and DQS-improvement optimisation (analytics ladder: rung 3 → 5)

**What.** A PCAF Data Quality Score engine that scores holdings across five weighted
dimensions (`weighted_dqs = 0.35·emissions + 0.25·completeness + 0.15·timeliness +
0.15·granularity + 0.10·methodology`), aggregates exposure-weighted portfolio DQS, computes
SFDR PAI 1/2/3, and maps to eight frameworks. It's solid rung-3 PCAF-standard work but the
improvement roadmap is a simple `improvement_potential = dqs_level - max(1, dqs_level-1)`
per-holding hint, not a portfolio-level optimisation. Evolution A adds uncertainty
propagation and prescriptive data-upgrade sequencing.

**How.** (1) Propagate DQS into a portfolio-level financed-emissions confidence interval
(Monte Carlo per the roadmap's QMC pattern), so the portfolio number carries a band, not just
an average DQS. (2) Turn the improvement roadmap into a prescriptive optimiser (rung 5): given
a data-acquisition cost per holding, sequence the upgrades that most reduce portfolio-level
emissions uncertainty per euro spent — the exact "which data upgrade matters most" question
banks face. (3) Cross-check the DQS methodology against the sibling `pcaf_asset_classes` auto-DQS
so the platform has one consistent scoring path. (4) Bench-pin the five-dimension weighting and
PAI aggregation.

**Prerequisites.** A DQS→variance mapping for propagation; a per-holding data-cost input for
the optimiser. **Acceptance:** portfolio DQS output includes a financed-emissions confidence
interval; the improvement roadmap returns a cost-ranked upgrade sequence maximising
uncertainty reduction; DQS matches the `pcaf_asset_classes` engine for shared holdings; bench
pins pass.

### 9.2 Evolution B — Data-quality assurance copilot (LLM tier 2)

**What.** A copilot that runs `/score-portfolio` and explains the quality verdict — "your
portfolio DQS is 3.4; the 25%-weighted completeness dimension drags it because 40% of holdings
lack Scope-3; here's the cheapest path to DQS 2.5" — each figure tool-sourced, with SFDR PAI
readiness.

**How.** Three POST endpoints (`/score-holding`, `/score-portfolio`, `/assess-data-quality`)
plus rich reference GETs (asset-classes, dqs-levels, quality-dimensions, emission-factors,
attribution-methods, benchmarks, cross-framework) that ground every PCAF constant. The
five-dimension decomposition lets the copilot attribute a poor DQS to specific gaps; the
cross-framework map answers "how does this feed my SFDR PAI disclosure?". What-ifs re-run
statelessly. Core node for a financial-institution disclosure desk alongside
`pcaf_asset_classes` and `pcaf_regulatory`.

**Prerequisites.** None hard — engine is PCAF-aligned and reference-complete; stronger with
Evolution A's confidence intervals. **Acceptance:** every DQS, dimension score, and PAI figure
traces to a tool response; the copilot cites the specific PCAF data-quality table from the
reference endpoint; it presents DQS as a data-confidence measure (not emissions accuracy) and
refuses precision claims the score doesn't support.