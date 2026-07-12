# TNFD LEAP Assessment
**Module ID:** `tnfd-leap` · **Route:** `/tnfd-leap` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Full TNFD LEAP framework implementation: Locate (interface with nature), Evaluate (dependencies/impacts), Assess (material risks/opportunities), Prepare (strategy/targets/disclosure).

> **Business value:** TNFD is the emerging standard for nature risk disclosure, designed to drive capital flows toward nature-positive outcomes. Many jurisdictions (UK, EU, Australia) are moving toward mandatory nature disclosure. This module provides the complete LEAP workflow needed for TNFD Early Adopter and future regulatory compliance.

**How an analyst works this module:**
- LOCATE tab maps business activities to biomes using ENCORE
- EVALUATE tab scores ecosystem service dependencies and impacts
- ASSESS tab applies TNFD materiality criteria for financial impact
- PREPARE tab generates TNFD-aligned strategy and targets
- Disclosure Builder creates board report in TNFD recommended format

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_BII`, `ECOSYSTEM_SERVICES`, `KpiCard`, `NATURE_SCENARIOS`, `PIE_COLORS`, `SCENARIO_TREND`, `SECTOR_KEYS`, `SECTOR_NATURE_INTERFACES`, `Section`, `TNFD_DISCLOSURES_INIT`, `TnfdLeapPage`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TNFD_DISCLOSURES_INIT` | 15 | `pillar`, `recommendation`, `status` |
| `COUNTRY_BII` | 13 | `name`, `bii`, `biomes`, `holdings_exposed` |
| `NATURE_SCENARIOS` | 4 | `name`, `description`, `bii_2030`, `portfolio_loss_pct`, `nature_risk_delta` |
| `SCENARIO_TREND` | 8 | `bau`, `recovery`, `collapse` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_BIO_MAP_TNFD` | `Object.fromEntries(BIODIVERSITY_COUNTRY_DATA.map(d => [d.country, d]));` |
| `statusLabel` | `s => s === 'compliant' ? 'Compliant' : s === 'partial' ? 'Partial' : s === 'gap' ? 'Gap' : s === 'na' ? 'N/A' : 'Pending';` |
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : n;` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map(c => { const sd = getSectorData(c.gics_sector \|\| c.sector);` |
| `depScore` | `sd.dep_score + ((c.isin \|\| '').charCodeAt(3) % 15 - 7);` |
| `impScore` | `sd.impact_score + ((c.isin \|\| '').charCodeAt(4) % 12 - 6);` |
| `topRisk` | `(sd.risks[0] \|\| {}).risk \|\| 'N/A';` |
| `topOpp` | `(sd.opportunities[0] \|\| {}).type \|\| 'N/A';` |
| `avgDep` | `scoredHoldings.reduce((s, h) => s + h.dep_score, 0) / scoredHoldings.length;` |
| `avgImp` | `scoredHoldings.reduce((s, h) => s + h.impact_score, 0) / scoredHoldings.length;` |
| `encoreMatrix` | `useMemo(() => { return SECTOR_KEYS.map(sector => { const sd = SECTOR_NATURE_INTERFACES[sector];` |
| `rows` | `scoredHoldings.map(h => [h.company_name \|\| h.name, h.isin, h.gics_sector \|\| h.sector, h.dep_score, h.impact_score, h.biomes, h.topRisk, h.topOpp, h.natureStatus]);` |
| `csv` | `[headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tnfd_leap_report_${new Date().toISOString().slice(0, 10)}.csv`; a.click();` |
| `data` | `{ assessment_date: new Date().toISOString(), disclosures, holdings: scoredHoldings.map(h => ({ name: h.company_name \|\| h.name, isin: h.isin, sector: h.gics_sector \|\| h.sector, dep_score: h.dep_score, impact_score: h.impa` |
| `overall` | `Math.round((h.physRisk + h.transRisk + h.sysRisk + h.litRisk) / 4 * 25);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tnfd-leap/assess` | `run_leap_assessment` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/assessments/{entity_id}` | `list_assessments` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/assessment/{assessment_id}` | `get_assessment` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/biomes` | `get_biomes` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/impact-drivers` | `get_impact_drivers` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/sector-materiality` | `get_sector_materiality` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/cross-framework` | `get_cross_framework` | api/v1/routes/tnfd_leap.py |

### 2.3 Engine `tnfd_leap_engine` (services/tnfd_leap_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TNFDLEAPEngine._get_sector_profile` | sector |  |
| `TNFDLEAPEngine._score_to_magnitude` | score |  |
| `TNFDLEAPEngine._score_to_maturity` | score |  |
| `TNFDLEAPEngine._level_to_magnitude` | level | Map a caller-supplied qualitative level to an ordinal 0–100 magnitude. Returns None when the level is missing/unrecognised so the caller keeps an honest null rather than a fabricated number. |
| `TNFDLEAPEngine._num` | value | Coerce a supplied value to float, or None if not numeric. |
| `TNFDLEAPEngine.locate_assessment` | entity_id, sector, value_chain_scope, locations | Step L — Locate: identify interfaces with nature across value chain. ``locations`` (optional): caller-supplied list of observed priority locations. Each item may carry: location_id, location_name, country, biome, sensitivity, protected_area_overlap, key_biodiversity_area, proximity_km. Missing fields are passed through as None (never invented). ``value_chain_scope`` (optional): caller-supplied cov |
| `TNFDLEAPEngine.evaluate_assessment` | entity_id, sector, locate_result, dependencies, impacts | Step E — Evaluate: assess dependencies and impacts using ENCORE. ``dependencies`` (optional): caller-supplied observed dependencies. Each item may carry ecosystem_service, dependency_level, business_process, substitutability, encore_materiality. ``impacts`` (optional): caller-supplied observed impacts. Each item may carry impact_driver, magnitude (0–100) OR magnitude_label, scope, irreversibility, |
| `TNFDLEAPEngine.assess_material_risks` | entity_id, sector, evaluate_result, risks, opportunities | Step A — Assess: identify material nature-related risks and opportunities. ``risks`` (optional): caller-supplied observed nature-related risks. Each item may carry risk_id, description, risk_type, time_horizon, likelihood, magnitude (0–100) OR magnitude_label, financial_impact_mn, affected_assets. ``opportunities`` (optional): caller-supplied observed opportunities. Each item may carry opp_id, des |
| `TNFDLEAPEngine.prepare_response` | entity_id, assess_result, strategy_response, targets, disclosures_met | Step P — Prepare: strategy, targets, and disclosure completeness. ``strategy_response`` (optional): caller-supplied governance/strategy flags (nature_policy_adopted, board_oversight, nature_in_risk_register, nature_in_strategy, engagement_plan, nature_positive_commitment, third_party_verification). Missing flags pass through as None. ``targets`` (optional): caller-supplied nature targets. Each ite |
| `TNFDLEAPEngine._derive_improvement_areas` | strategy, targets, disclosure_pct | Deterministically flag improvement areas from observed gaps. Returns an empty list when no observed data is available to judge gaps. |
| `TNFDLEAPEngine.run_full_leap` | entity_id, sector, reporting_period | Run all 4 LEAP steps and return comprehensive assessment dict. Observed data is threaded through via keyword arguments (all optional): - value_chain_scope, locations -> Locate - dependencies, impacts -> Evaluate - risks, opportunities -> Assess - strategy_response, targets, disclosures_met -> Prepare - priority_actions -> Prepare/overall (pass-through) - entity_name -> metadata Any metric whose ob |
| `TNFDLEAPEngine.get_reference_data` |  | Return all reference constants for front-end consumption. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `SET` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `tnfd_leap_assessments`, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRY_BII`, `ECOSYSTEM_SERVICES`, `NATURE_SCENARIOS`, `PIE_COLORS`, `SCENARIO_TREND`, `TNFD_DISCLOSURES_INIT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TNFD Recommended Metrics | — | TNFD V1.0 | Including land use, water, pollution, biodiversity indicators |
| LEAP Phases | — | TNFD | Locate, Evaluate, Assess, Prepare |
| Sector Guidance Modules | — | TNFD | Agriculture, chemicals, financials, food, metals, O&G, pharma, RE, utilities |
- **Activity mapping** → ENCORE interface identification → **Nature interface locations**
- **Ecosystem dependencies** → TNFD materiality assessment → **Material nature risks**
- **Nature risk assessment** → Strategy and target setting → **TNFD-aligned disclosure**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tnfd-leap/assessment/{assessment_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/tnfd-leap/assessments/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/tnfd-leap/ref/biomes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['biomes', 'count'], 'n_keys': 2}`

**GET /api/v1/tnfd-leap/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework'], 'n_keys': 1}`

**GET /api/v1/tnfd-leap/ref/impact-drivers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['impact_drivers', 'count'], 'n_keys': 2}`

**GET /api/v1/tnfd-leap/ref/sector-materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_materiality'], 'n_keys': 1}`

**POST /api/v1/tnfd-leap/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['assessment_id', 'entity_id', 'entity_name', 'sector', 'reporting_period', 'assessment_date', 'locate_score', 'evaluate_score', 'assess_score', 'prepare_score', 'overall_leap_score', 'leap_maturity', 'num_priority_locations', 'num_dependencies', 'num_impacts', 'num_materi`

## 5 · Intermediate Transformation Logic
**Methodology:** TNFD LEAP four-phase process
**Headline formula:** `Locate → Evaluate → Assess → Prepare (iterative)`

LOCATE: map operations and value chain to biomes/ecosystems. EVALUATE: use ENCORE to assess dependencies and impacts per ecosystem service. ASSESS: determine financial materiality of nature risks/opportunities. PREPARE: disclose and set targets using TNFD recommended metrics.

**Standards:** ['TNFD V1.0 (2023)', 'GBF Kunming-Montreal', 'TNFD Sector Guidance']
**Reference documents:** TNFD V1.0 Recommendations and Guidance (2023); TNFD Sector Guidance (2024); GBF Kunming-Montreal Targets; ENCORE; IBAT

**Engine `tnfd_leap_engine` — extracted transformation lines:**
```python
mean_opp = sum(opp_values) / len(opp_values)
period = reporting_period or str(date.today().year - 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `esg-data-quality` | table:SET |

## 7 · Methodology Deep Dive

> ⚠️ **Frontend/backend disconnection.** A genuine, non-random LEAP scoring engine exists at
> `backend/services/tnfd_leap_engine.py` (completeness-weighted Locate/Evaluate/Assess/Prepare
> scores with explicit `None` handling when data is missing — see §7.6) and is exposed via
> `api/v1/routes/tnfd_leap.py`. **`TnfdLeapPage.jsx` never calls that API** (no `fetch`/`axios` call
> to any `tnfd-leap` endpoint exists in the file). The page instead computes its own, simpler
> sector-materiality scoring entirely client-side. The sections below document what the page
> actually renders; §7.6 also documents the unused backend engine for completeness since it is a
> materially more rigorous methodology than what ships to the user.

### 7.1 What the module computes

For the user's portfolio (loaded from `localStorage` or the first 25 rows of
`GLOBAL_COMPANY_MASTER`), each holding is mapped to one of 11 GICS-style sectors in
`SECTOR_NATURE_INTERFACES` (an ENCORE-styled qualitative lookup: biomes, dependencies, impacts,
risks, opportunities, plus a hand-set `dep_score`/`impact_score` 0–100 pair per sector) and then
individualised with a small deterministic offset derived from the holding's ISIN:

```js
depScore = sector.dep_score + (isin.charCodeAt(3) % 15 - 7)   // ±7 jitter
impScore = sector.impact_score + (isin.charCodeAt(4) % 12 - 6) // ±6 jitter
dep_score = clamp(depScore, 5, 100); impact_score = clamp(impScore, 5, 100)
natureStatus = dep_score > 70 ? 'High Risk' : dep_score > 40 ? 'Medium' : 'Low'
```

Four risk-category scores (Physical/Transition/Systemic/Litigation) are pulled from the sector's
first matching risk entry and mapped through a likelihood scale
`likI: Very High→5, High→4, Medium→3, Low→2, other→1`. A composite "overall" risk score is:

```
overall = round((physRisk + transRisk + sysRisk + litRisk) / 4 × 25)   // 0–100 scale
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `SECTOR_NATURE_INTERFACES` | 11 sectors × {biomes, dependencies, impacts, risks, opportunities, dep_score, impact_score} | ENCORE-methodology-styled but hand-authored; e.g. Materials `dep_score:82, impact_score:90` (highest), Information Technology `dep_score:28, impact_score:32` (lowest) — directionally consistent with known ENCORE sector materiality rankings |
| ISIN jitter (`charCodeAt(3)%15-7`, `charCodeAt(4)%12-6`) | ±7 / ±6 points | Deterministic pseudo-individualisation keyed off the ISIN string — not a random draw, but not a real company-specific assessment either; same ISIN always produces the same offset |
| `likI` severity scale | Very High=5 ... Low=2, default=1 | Standard 5-point likelihood scale, platform-defined mapping |
| `COUNTRY_BII` | 12 countries, real Biodiversity Intactness Index-style values (Brazil 0.73, Indonesia 0.62, Canada 0.88...) | Sourced from `data/biodiversityData.js` (`BIODIVERSITY_COUNTRY_DATA`), presented as anchoring reference data, not tied to individual holdings |
| `NATURE_SCENARIOS` | BAU / Nature Recovery (Kunming-Montreal) / Ecosystem Collapse, each with `bii_2030` and `portfolio_loss_pct` | Illustrative 3-scenario framework echoing NGFS-style scenario narratives applied to nature risk; loss percentages (4.2% / 1.1% / 12.8%) are scenario-level assumptions, not derived from the scored holdings |
| `ECOSYSTEM_SERVICES` | 8 services (Water provision, Climate regulation, Pollination...) | Standard ecosystem-service taxonomy used for the radar chart |

### 7.3 Calculation walkthrough

1. **Sector mapping** (`mapSector`) normalises each holding's raw sector string to one of the 11
   `SECTOR_KEYS`, defaulting to Financials if unmatched.
2. **Individualised scoring** applies the ISIN-jitter formula above to the sector's base
   `dep_score`/`impact_score`, clamped to [5,100].
3. **Portfolio KPIs**: `avgDep`/`avgImp` are simple means across scored holdings; `highRisk` counts
   holdings with `dep_score > 65`; `ecoservicesAtRisk` is the **union count** of ecosystem services
   rated High/Very High criticality across all sectors represented in the portfolio (a coverage
   metric, not a severity-weighted score); `disclosurePct = compliant / 14 × 100` against the
   15-row `TNFD_DISCLOSURES_INIT` seed checklist (persisted to `localStorage`).
4. **Sector aggregation** groups scored holdings by mapped sector and averages `dep_score`/
   `impact_score` per sector for the bar chart.
5. **ENCORE dependency matrix** and **radar chart** re-render the static sector-service lookup
   table (criticality labels; the radar sums `sev()` severity codes 1–4 across all holdings sharing
   a service, so it is a headcount-weighted, not materiality-weighted, aggregate).
6. **Country BII table** and **Nature scenarios** panel are presented as standalone reference data,
   not algebraically linked to the scored portfolio (no `portfolio_loss_pct` is computed from the
   user's actual holdings — the three numbers shown are the scenario's fixed assumption).

### 7.4 Worked example

Take a holding with ISIN `US0378331005` (Apple, sector mapped to Information Technology,
`dep_score:28, impact_score:32`):

| Step | Computation | Result |
|---|---|---|
| `charCodeAt(3)` | `'8'` → char code 56 | `56 % 15 − 7 = 1 − 7 = −6` |
| `depScore` | `28 + (−6)` | **22** |
| `charCodeAt(4)` | `'3'` → char code 51 | `51 % 12 − 6 = 3 − 6 = −3` |
| `impScore` | `32 + (−3)` | **29** |
| `natureStatus` | `22 ≤ 40` | **Low** |
| Physical risk likelihood | IT sector "Water scarcity for data center operations" = Medium → `likI=3` | **3** |
| Overall (physRisk only, illustrative if all 4 = Medium/3) | `(3+3+3+3)/4×25` | **75/100** |

Note the overall risk-category score (0–100) and the `dep_score`/`natureStatus` label are computed
from **different, unreconciled scales** — a holding can show "Low" nature-dependency status while
simultaneously carrying a high physical/transition/systemic/litigation composite score, because the
two come from different parts of the sector record (`dep_score` field vs. `risks[]` likelihoods)
with no cross-check.

### 7.5 Companion analytics

- **Biome exposure pie chart** — counts how many distinct sectors in the portfolio touch each biome
  (Marine, Terrestrial, Freshwater...), not area- or revenue-weighted exposure.
- **Opportunities bar chart** — counts High/Very-High-potential opportunity types per sector from
  the static lookup, independent of actual holdings.
- **TNFD disclosure tracker** — 15-row checklist (`TNFD_DISCLOSURES_INIT`) persisted client-side;
  `disclosurePct` is purely a self-reported completion percentage.
- **Country BII reference table** and **3-scenario nature-risk panel** — descriptive context, not
  wired into the scored-holdings calculations.

### 7.6 Data provenance & limitations

- **The page's live scoring is deterministic-but-arbitrary, not evidence-based**: `dep_score`/
  `impact_score` come from a hand-set sector table individualised only by a hash of the ISIN string
  — no company-specific ENCORE assessment, spatial biodiversity overlay, or dependency survey feeds
  the number shown to the user.
- **The rigorous backend engine is unused.** `backend/services/tnfd_leap_engine.py` implements a
  genuinely defensible completeness-based scoring approach: Locate score = coverage-weighted
  completeness of the location/value-chain register; Evaluate score = ENCORE coverage of the
  sector's known-material dependency/impact set; Assess score = share of material risks with an
  assigned magnitude; Prepare score = share of 7 governance/strategy flags satisfied; overall score
  = mean of whichever step scores are actually computable (explicitly `None`, not zero or a random
  fallback, when data is missing). None of this logic is exercised by the shipped page.
- Country BII values and nature-scenario BII/loss figures are static reference constants, not
  computed from the scored portfolio — they provide context but should not be read as portfolio
  outputs.
- No confidence interval, data-quality flag, or coverage disclosure accompanies the on-page
  dep_score/impact_score, despite the number materially driving the "High Risk" label shown to
  users.

### 7.7 Framework alignment

- **TNFD LEAP** (Locate, Evaluate, Assess, Prepare): the page organises its tabs around the 4 LEAP
  phases but only Evaluate (sector dependency/impact scoring) and Assess (risk categorisation) are
  meaningfully computed; Locate and Prepare are mostly static/reference content on the frontend
  (though the backend engine, unused, does compute real Locate/Prepare completeness scores).
- **ENCORE** (Natural Capital Finance Alliance/UNEP-WCMC): the sector×ecosystem-service dependency/
  impact structure mirrors ENCORE's sector-materiality methodology (which in the live tool derives
  materiality ratings from a peer-reviewed matrix of ~21 ecosystem services across ~150+ sub-industries);
  here it is compressed to 11 hand-curated sectors.
- **BII (Biodiversity Intactness Index)**: the `COUNTRY_BII` reference values are presented in the
  real BII 0–1 scale (fraction of original species abundance remaining), consistent with the
  Natural History Museum's global BII methodology, though sourced from a static platform dataset.
- **GBF/Kunming-Montreal**: the "Nature Recovery" scenario explicitly cites 30×30 targets and
  $200B/yr biodiversity finance — correct framing of the GBF's headline targets — but the resulting
  `bii_2030`/`portfolio_loss_pct` are scenario-level assumptions, not simulation outputs.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its rigorous, honest-null backend engine (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents a wiring disconnect with an unusually strong upside: a genuinely rigorous LEAP engine exists at `tnfd_leap_engine.py` — completeness-weighted Locate/Evaluate/Assess/Prepare scores that return explicit `None` (never zero or a fabricated fallback) when observed data is missing, exposed via `POST /tnfd-leap/assess` which traces **passing** — yet `TnfdLeapPage.jsx` never calls it. The page instead renders a simpler client-side score where `dep_score`/`impact_score` come from a hand-set sector table jittered by an ISIN hash (§7.1), producing the documented incoherence (§7.4): a holding can read "Low" nature-dependency while carrying a high composite risk score, because the two derive from unreconciled scales.

**How.** (1) Replace the client-side ISIN-jitter scoring with calls to `POST /tnfd-leap/assess`, threading portfolio holdings as the engine's caller-supplied `locations`/`dependencies`/`impacts`/`risks` — the engine already handles partial data with honest nulls, so coverage gaps surface as `None`, not false precision. (2) Fix the two failing traced GETs (`/assessments/{entity_id}`, `/assessment/{assessment_id}` — live failures, likely persistence/lookup against `tnfd_leap_assessments`) so saved assessments are retrievable. (3) Surface the engine's completeness scores as the LEAP-phase progress (today Locate/Prepare are static self-reported percentages; the engine computes real coverage-weighted completeness). (4) Compute `NATURE_SCENARIOS` portfolio-loss from scored holdings rather than showing the scenario's fixed 4.2%/1.1%/12.8% assumptions (§7.6).

**Prerequisites.** The two GET failures root-caused; ENCORE sector-materiality reference (the engine's `ref/sector-materiality` already traces passing) used consistently front and back. **Acceptance:** the page renders engine scores including `None` for uncovered items; dep-status and risk composite reconcile or are explicitly labelled different measures; scenario losses respond to the actual portfolio.

### 9.2 Evolution B — Nature-risk analyst over the LEAP engine (LLM tier 2)

**What.** TNFD assessment is inherently a data-gathering and narrative workflow — ideal for a tool-calling analyst. The copilot runs the four LEAP steps as tool calls ("assess this portfolio's nature dependencies for the food sector"), explains materiality from the engine's ENCORE coverage, and drafts the TNFD-recommended board disclosure — crucially inheriting the engine's honest-null discipline: where data is missing, the copilot reports a coverage gap, not an invented score.

**How.** Tier 2 is well-supported because the backend is real and mostly green: tool schemas auto-generate from the 7 routes (`/assess` plus 4 reference GETs that trace passing); grounding corpus is this Atlas record, the `cross-framework` crosswalk payload, and the engine's `sector-materiality`/`impact-drivers`/`biomes` reference data. The no-fabrication contract aligns naturally with the engine's design philosophy — the deep-dive explicitly praises its `None`-over-fabrication handling — so the copilot's provenance expander shows which LEAP inputs were observed vs. absent. The `COUNTRY_BII` and nature-scenario reference tables are citable context but must be labelled as assumptions, not portfolio outputs (§7.6).

**Prerequisites.** Evolution A's GET fixes so assessment history is tool-retrievable; the `POST /assess` already works. **Acceptance:** every score in an answer traces to an engine tool call and preserves its null-vs-value status; disclosure drafts cite the cross-framework clause mappings; asking for a company-specific ENCORE assessment the engine wasn't given data for yields a coverage-gap statement, not a number.