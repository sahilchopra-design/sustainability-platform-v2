# Api::Scope3_Categories
**Module ID:** `api::scope3_categories` · **Route:** `/api/v1/scope3-categories` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/scope3-categories/assess` | `assess` | api/v1/routes/scope3_categories.py |
| POST | `/api/v1/scope3-categories/materiality-screen` | `materiality_screen` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/categories` | `ref_categories` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/calculation-methods` | `ref_calculation_methods` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/sbti-coverage-rule` | `ref_sbti_coverage_rule` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/pcaf-c15` | `ref_pcaf_c15` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/flag-sectors` | `ref_flag_sectors` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/ghg-protocol-scope3` | `ref_ghg_protocol_scope3` | api/v1/routes/scope3_categories.py |

### 2.3 Engine `scope3_categories_engine` (services/scope3_categories_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Scope3CategoriesEngine.assess` | entity_id, entity_name, nace_code, revenue_bn, headcount, sector_type, portfolio_aum_bn, scope3_intensity_tco2e_per_eur_m |  |
| `Scope3CategoriesEngine.screen_materiality` | nace_code, revenue_bn, sector_shares | Quick materiality screen before full assessment. Uses the published GHG Protocol typical category shares (documented cross-sector benchmark) — deterministic, not a random draw. A caller may pass ``sector_shares`` (cat_id -> fractional share) to screen against sector-specific data instead of the generic benchmark. |
| `Scope3CategoriesEngine.ref_categories` |  |  |
| `Scope3CategoriesEngine.ref_calculation_methods` |  |  |
| `Scope3CategoriesEngine.ref_sbti_coverage_rule` |  |  |
| `get_engine` |  |  |

**Engine `scope3_categories_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SCOPE3_CATEGORIES` | `{'C1': {'name': 'Purchased goods & services', 'stream': 'upstream', 'typical_pct': 0.3}, 'C2': {'name': 'Capital goods', 'stream': 'upstream', 'typical_pct': 0.05}, 'C3': {'name': 'Fuel & energy-related activities', 'stream': 'upstream', 'typical_pct': 0.03}, 'C4': {'name': 'Upstream transportation'` |
| `CALCULATION_METHODS` | `{'spend_based': {'dqs': 4, 'description': 'EEIO spend-based using supplier spend'}, 'average_data': {'dqs': 3, 'description': 'Industry-average emission factors'}, 'supplier_specific': {'dqs': 1, 'description': 'Primary supplier-specific data'}, 'hybrid': {'dqs': 2, 'description': 'Hybrid approach —` |
| `SBTI_SECTORS_FLAG` | `['agriculture', 'forestry', 'land_use', 'food_beverage', 'consumer_goods_agri', 'paper', 'real_estate_agri']` |
| `COVERAGE_THRESHOLD` | `0.4` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scope3-categories/ref/calculation-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['spend_based', 'average_data', 'supplier_specific', 'hybrid', 'pcaf_standard'], 'n_keys': 5}`

**GET /api/v1/scope3-categories/ref/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15'], 'n_keys': 15}`

**GET /api/v1/scope3-categories/ref/flag-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['flag_sectors', 'note', 'coverage_rule'], 'n_keys': 3}`

**GET /api/v1/scope3-categories/ref/ghg-protocol-scope3** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'categories', 'upstream', 'downstream', 'mandatory_for_sbti'], 'n_keys': 5}`

**GET /api/v1/scope3-categories/ref/pcaf-c15** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['category', 'name', 'standard', 'asset_classes', 'attribution_formula', 'dqs_range'], 'n_keys': 6}`

**GET /api/v1/scope3-categories/ref/sbti-coverage-rule** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['threshold_pct', 'description', 'flag_note'], 'n_keys': 3}`

**POST /api/v1/scope3-categories/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'assessment'], 'n_keys': 2}`

**POST /api/v1/scope3-categories/materiality-screen** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15'], 'n_keys': 15}`

## 5 · Intermediate Transformation Logic

**Engine `scope3_categories_engine` — extracted transformation lines:**
```python
total = revenue_bn * 1_000 * float(scope3_intensity_tco2e_per_eur_m)
tco2e = round(total * fraction, 0) if total is not None else None
pct_of_total=round(fraction * 100, 1),
result.sbti_coverage_pct = round(material_tco2e / total * 100, 1)
result.meets_40pct_rule = result.sbti_coverage_pct >= (COVERAGE_THRESHOLD * 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/scope3-categories` (engine E21, `scope3_categories_engine.py`) implements a **GHG Protocol
Scope 3 category screening and SBTi-coverage assessment**. Given an entity (id, NACE code, revenue,
headcount, sector type, optional portfolio AUM), it produces a 15-category breakdown, a materiality
flag per category, an SBTi 40 %-coverage verdict, a weighted data-quality score (DQS), an optional
FLAG split, and an optional PCAF Category-15 portfolio block:

```
total_scope3 = total_scope3_tco2e                              (if supplied)
             = revenue_bn × 1000 × intensity (tCO2e/EUR M)     (if intensity supplied)
             = None                                            (otherwise — honest null)
tco2e(cat)   = total × share(cat)          share defaults to GHG Protocol typical share
is_material  = share > 0.05
coverage %   = Σ material tco2e / total × 100   (or Σ material shares when total is null)
meets_40pct  = coverage ≥ 40
weighted_DQS = Σ w·dqs / Σ w               w = tco2e (or published share when total null)
```

### 7.2 Parameterisation

**Category shares** (`SCOPE3_CATEGORIES.typical_pct`, engine comment: "published GHG Protocol
typical share (documented benchmark, NOT a random draw)"):

| Cat | Name | Stream | Typical share | Material (>5 %)? |
|---|---|---|---|---|
| C1 | Purchased goods & services | up | 30 % | yes |
| C11 | Use of sold products | down | 25 % | yes |
| C15 | Investments (PCAF) | down | 9 % | yes |
| C10 | Processing of sold products | down | 6 % | yes |
| C2 | Capital goods | up | 5 % | no (strict >) |
| C4, C9 | Up/downstream transport | — | 4 % each | no |
| C3, C12 | FERA / End-of-life | — | 3 % each | no |
| C6, C7, C8, C13, C14 | Travel, commuting, leased, franchises | — | 2 % each | no |
| C5 | Waste | up | 1 % | no |

**Calculation-method DQS ladder** (`CALCULATION_METHODS`, PCAF-style 1=best…5=worst scale):
supplier_specific = 1, hybrid = 2, pcaf_standard = 2, average_data = 3 (screening default),
spend_based = 4. Methods `spend_based`/`average_data` auto-append the data gap "No primary
supplier data — recommend supplier engagement programme".

**Other constants:** `COVERAGE_THRESHOLD = 0.40` (SBTi near-term Scope 3 coverage rule);
`SBTI_SECTORS_FLAG` = agriculture, forestry, land_use, food_beverage, consumer_goods_agri, paper,
real_estate_agri; materiality screen thresholds `>0.06` likely-material, `>0.15` high significance.

### 7.3 Calculation walkthrough

1. **Total.** The route's `AssessRequest` exposes only the basic fields, so via the API the
   optional intensity/total/shares parameters are never populated → `total = None` and the engine
   emits the warning "No entity Scope 3 total or intensity supplied — per-category tCO2e reported
   as null; percentages reflect GHG Protocol typical shares only". Programmatic callers can supply
   real data.
2. **Category loop.** Each of the 15 categories gets its share (override or typical), tCO₂e
   (null-safe), materiality flag, method and DQS.
3. **SBTi coverage.** With defaults, material categories are C1+C11+C10+C15 = 30+25+6+9 = 70 % →
   `meets_40pct_rule = True`.
4. **FLAG split** only computed when the sector is FLAG **and** both `total` and `flag_share` are
   supplied; otherwise a warning ("FLAG vs non-FLAG split not computed (insufficient_data)").
5. **C15 block** (`PortfolioScope3`) when `portfolio_aum_bn > 0`: attributed emissions
   `AUM_bn × 1000 × portfolio intensity` only if an intensity is supplied, else null + warning;
   PCAF DQS and portfolio temperature score are pass-through fields.
6. **Recommendations**: expand boundary if coverage < 40 %; supplier data collection if weighted
   DQS > 3.5; apply PCAF if C15 material but no portfolio block.

### 7.4 Worked example — default screening assessment

`POST /assess` with `revenue_bn = 2.0`, no intensity (typical API call):

| Output | Computation | Result |
|---|---|---|
| `total_scope3_tco2e` | no data supplied | **null** (+ warning) |
| Material categories | shares > 5 % | **C1, C10, C11, C15** |
| `sbti_coverage_pct` | 30 + 6 + 25 + 9 | **70.0 %** → meets 40 % rule |
| Weighted DQS | all methods default `average_data` (DQS 3), weights = shares | Σ(w×3)/Σw = **3.00** |
| Recommendation | C15 material, no portfolio | "apply PCAF standard attribution methodology" |

If instead a caller supplies `scope3_intensity = 350 tCO2e/EUR M`: total = 2.0 × 1000 × 350 =
**700,000 tCO₂e**; C1 = 700,000 × 0.30 = 210,000 tCO₂e; C11 = 175,000; coverage unchanged at 70 %.

### 7.5 Reference endpoints

`GET /ref/*` return static reference payloads: the category table; the method/DQS ladder; the SBTi
coverage rule; PCAF C15 metadata including the attribution formula string
`Financed Emissions = (Outstanding Amount / EVIC) x Company Emissions` and DQS range 1–5; the FLAG
sector list; and GHG Protocol metadata (upstream C1–C8, downstream C9–C15). Note the PCAF formula
is *documented* here but not *executed* — attribution maths lives in the PCAF modules.

### 7.6 Data provenance & limitations

- **No synthetic PRNG data.** This engine is notable for its "honest null" design: every derived
  tonnage is null unless the caller supplies real data, with explicit `insufficient_data`
  warnings (comments repeatedly state "no fabricated split", "no random intensity").
- The `typical_pct` shares are labelled a published GHG Protocol cross-sector benchmark; they are
  plausible but sector-invariant — a software company and a steelmaker get the same default
  profile. The GHG Protocol standard itself does not prescribe fixed percentages; treat these as
  the platform's benchmark encoding.
- Materiality uses a pure share threshold (>5 %); the GHG Protocol's materiality criteria
  (size, influence, risk, stakeholders, outsourcing, sector guidance) are collapsed to size only.
- `nace_code` and `headcount` are stored but never used in any computation.
- The HTTP layer cannot reach the richer optional parameters (intensity, shares, methods,
  FLAG share, portfolio intensity) — a production wiring gap.

### 7.7 Framework alignment

- **GHG Protocol Corporate Value Chain (Scope 3) Standard (2011)** — defines the 15 categories and
  requires screening all of them; the engine reproduces the taxonomy and upstream/downstream split
  exactly.
- **SBTi Corporate Near-Term Criteria** — where Scope 3 is ≥40 % of total emissions, targets must
  cover at least ⅔ of Scope 3 under current criteria; the engine encodes the older/simplified
  "cover ≥40 % of Scope 3" boundary rule as stated in its own ref endpoint.
- **SBTi FLAG Guidance** — FLAG-sector companies must set separate Forest, Land & Agriculture
  targets; the engine flags applicability and computes a FLAG/non-FLAG tonnage split when data
  permits.
- **PCAF Global GHG Accounting Standard (Part A/C)** — Category 15 financed emissions use the
  outstanding/EVIC attribution and a 1–5 data-quality score; here PCAF appears as metadata and a
  pass-through DQS, not a re-implementation.

## 9 · Future Evolution

### 9.1 Evolution A — Sector-calibrated category shares and supplier-data integration (analytics ladder: rung 2 → 3)

**What.** The E21 engine implements GHG Protocol Scope 3 category screening and SBTi-coverage
assessment: it produces a 15-category breakdown, materiality flags (`is_material = share > 0.05`),
an SBTi 40%-coverage verdict, a weighted DQS, and optional FLAG/PCAF-C15 blocks. Its honesty is a
strength — `total_scope3 = None` (not fabricated) when neither total nor intensity is supplied. But
the per-category `tco2e = total × share` uses *typical* GHG-Protocol shares as the default
distribution, so an entity's breakdown is generic unless it overrides every share. Evolution A makes
the distribution sector-specific and data-integrated.

**How.** (1) Replace the single "typical share" default with sector-specific category
distributions (a chemicals firm's C1 purchased-goods share differs sharply from a bank's) keyed on
the NACE code the engine already takes, sourced from published sector Scope-3 profiles. (2)
Integrate supplier-specific data where the platform holds it (the supply-chain modules) so C1/C4
categories move from spend-based to supplier-specific with an improved DQS. (3) Add a spend-based
estimation path using EEIO factors for entities with only financial data. (4) Bench-pin the
coverage % and 40%-rule verdict, preserving the honest-null behaviour.

**Prerequisites.** Sector Scope-3 profile data; supply-chain module linkage for supplier data; EEIO
factors. **Acceptance:** category breakdown varies by sector for identical revenue; supplier-backed
categories carry a better DQS with provenance; the honest-null total is retained; coverage bench-pinned.

### 9.2 Evolution B — Scope-3 screening copilot with SBTi-coverage guidance (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the result — "your material Scope 3 is
categories 1, 4, and 11, covering 68% of your footprint — you meet the SBTi 40% rule; your weighted
DQS is 3.8, dragged by spend-based C1 data" — each figure tool-sourced, with materiality screening.

**How.** Two POST endpoints (`/assess`, `/materiality-screen`) plus rich reference GETs (categories,
calculation-methods, SBTi-coverage-rule, PCAF-C15, FLAG-sectors, GHG-protocol) that ground every
definition. The 15-category decomposition lets the copilot explain which categories are material and
why; the SBTi-coverage endpoint grounds the 40%-rule verdict. What-ifs ("if we get supplier data for
C1?") re-run statelessly. Cross-links to `pcaf_asset_classes` (C15) and the supply-chain copilots.

**Prerequisites.** None hard — engine is honest and reference-rich; sector-specific answers need
Evolution A. **Acceptance:** every category tCO2e, coverage %, and DQS traces to a tool response;
the copilot reports the honest-null when total is unknown rather than estimating; it discloses when
a category uses the generic typical share vs a sector-calibrated one, and cites the SBTi rule from
the reference endpoint.