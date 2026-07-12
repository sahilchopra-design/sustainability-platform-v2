# Api::Esma_Fund_Names
**Module ID:** `api::esma_fund_names` · **Route:** `/api/v1/esma-fund-names` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esma-fund-names/assess` | `assess_fund_name` | api/v1/routes/esma_fund_names.py |
| POST | `/api/v1/esma-fund-names/assess/batch` | `assess_batch` | api/v1/routes/esma_fund_names.py |
| POST | `/api/v1/esma-fund-names/detect-terms` | `detect_terms` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/term-categories` | `ref_term_categories` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/pab-exclusions` | `ref_pab_exclusions` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/sfdr-requirements` | `ref_sfdr_requirements` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/timeline` | `ref_timeline` | api/v1/routes/esma_fund_names.py |

### 2.3 Engine `esma_fund_names_engine` (services/esma_fund_names_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `FundNameResult.dict` |  |  |
| `ESMAFundNamesEngine.detect_terms` | fund_name | Detect ESG terms in a fund name and derive applicable requirements. |
| `ESMAFundNamesEngine.assess_fund_name` | inp | Full ESMA fund name compliance assessment. |
| `ESMAFundNamesEngine.batch_assess` | funds | Assess a list of fund name inputs. |
| `ESMAFundNamesEngine.get_term_categories` |  |  |
| `ESMAFundNamesEngine.get_pab_exclusions` |  |  |
| `ESMAFundNamesEngine.get_sfdr_requirements` |  |  |
| `ESMAFundNamesEngine.get_cross_framework` |  |  |
| `ESMAFundNamesEngine.get_timeline` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Final`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esma-fund-names/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_art8_art9', 'eu_taxonomy', 'mifid_spt', 'priips_kid', 'paris_aligned_benchmark'], 'n_keys': 5}`

**GET /api/v1/esma-fund-names/ref/pab-exclusions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['controversial_weapons', 'ungc_violations', 'tobacco_production', 'fossil_fuel_exploration', 'high_ghg_intensity'], 'n_keys': 5}`

**GET /api/v1/esma-fund-names/ref/sfdr-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['art_8', 'art_9'], 'n_keys': 2}`

**GET /api/v1/esma-fund-names/ref/term-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['environmental', 'social', 'governance', 'impact', 'transition', 'sustainable_focus'], 'n_keys': 6}`

**GET /api/v1/esma-fund-names/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['date', 'event', 'article']}`

**POST /api/v1/esma-fund-names/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esma-fund-names/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esma-fund-names/detect-terms** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/esma-fund-names` wraps the **ESMA Fund Names ESG Guidelines Engine** ("E16",
`backend/services/esma_fund_names_engine.py`), which tests UCITS/AIF fund names against
**ESMA/2024/249** (Guidelines on funds' names using ESG or sustainability-related terms). The
pipeline: (1) detect ESG terms in the name across 6 category groups, (2) derive the applicable
requirements (80% threshold, PAB exclusions, DNSH, Paris-Aligned Benchmark tracking, real-world
impact evidence), (3) test caller-supplied fund attributes against them, (4) emit a compliance
score, blocking/non-blocking gaps, SFDR alignment note and remediation recommendations. Scoring
quoted from code:

```
threshold_met     = esg_investment_pct ≥ required_threshold (80%)     (auto-true if no terms)
compliance_score  = 40·[threshold] + 25·[PAB exclusions] + 15·[DNSH]
                  + 10·[Paris benchmark] + 10·[impact]                (0–100)
overall_compliant = AND of all five checks
```

### 7.2 Parameterisation

**Term categories** (`ESG_TERM_CATEGORIES`, `GET /ref/term-categories`) — all carry the 80%
threshold and PAB-exclusion requirement; category-specific add-ons per the guidelines:

| Category | Example terms | Extra requirement |
|---|---|---|
| environmental | environmental, climate, green, ESG, sustainable, net-zero, Paris-aligned, GHG… (18 terms) | — |
| social | social, diversity, inclusion, human rights, gender… (11) | — |
| governance | governance, board, stewardship… (6) | — |
| impact | impact, additionality… (4) | real-world impact evidence |
| transition | transition, transforming, improving… (5) | Paris-Aligned Benchmark tracking |
| sustainable_focus | sustainable, sustainability focus (3) | DNSH assessment |

**PAB exclusions** (`GET /ref/pab-exclusions`, with per-item article citations to the Benchmark
Delegated Regulation): controversial weapons (Art 12(1)(a)), UNGC/OECD-MNE violators (b), tobacco
≥ 5% revenue (c), fossil fuels — coal ≥ 1%, oil ≥ 10%, gas ≥ 50% revenue (d), high GHG intensity
(e). These revenue thresholds match Commission Delegated Regulation (EU) 2020/1818 Art. 12.

**Timeline** (`GET /ref/timeline`): Final Report 2024-05-14; in force 2024-08-21; applies to new
funds 2024-11-21; existing funds 2025-05-21 — the real ESMA/2024/249 dates. **Cross-framework
map** (`GET /ref/cross-framework`): SFDR Art 8/9 ("SFDR classification does NOT automatically
satisfy name guidelines"), EU Taxonomy Art 8 DA, MiFID II product categorisation, PRIIPs KID
consistency, EU Benchmark Regulation 2016/1011. **SFDR minimums** (`GET /ref/sfdr-requirements`):
Art 8 → 80% + PAI exclusions; Art 9 → 80% + DNSH additionally.

The 40/25/15/10/10 score weights and the blocking/non-blocking split (threshold and PAB
exclusions block; DNSH, PAB tracking and impact evidence are non-blocking) are **platform design
choices**, not ESMA text.

### 7.3 Calculation walkthrough

- **`POST /detect-terms`** — case-insensitive substring matching of every term in each category
  against the fund name; matched categories accumulate the union of requirement flags; the
  category driving the (single, 80%) threshold is reported as `highest_requirement_category`.
- **`POST /assess`** — requirement flags gate each check: a requirement not triggered by the name
  is automatically compliant (e.g. no DNSH check unless a "sustainable" term appears). Gaps carry
  guideline paragraph citations (§27 threshold, §28–30 exclusions, §33 impact).
  `applicable_exclusions` lists all five PAB screens when environmental or transition terms are
  detected. Recommendations mirror gaps, including the canonical alternative: "…or rename the
  fund to remove ESG terms."
- **`POST /assess/batch`** — maps the single assessment over a fund range.

### 7.4 Worked example

Fund: **"Alpha Global Climate Transition Impact Fund"**, SFDR Art 8, ESG investment 74%, PAI
exclusions ✓, no DNSH, no PAB tracking, no impact evidence.

| Step | Result |
|---|---|
| Detected terms | "climate", "transition" (environmental), "transition" etc. (transition), "impact" (impact) |
| Requirements | threshold 80%, PAB exclusions, Paris benchmark (transition), impact evidence (impact); DNSH not required (no "sustainable" term) |
| Threshold | 74% < 80% → **fail (blocking)** |
| Checks | PAI ✓ (25), DNSH auto-✓ (15), PAB ✗ (0), impact ✗ (0) |
| Compliance score | 0 + 25 + 15 + 0 + 0 | **40.0** |
| Overall | false; blocking gaps = [gap_threshold] |
| Applicable exclusions | all 5 PAB screens (environmental+transition detected) |
| Recommendations | raise allocation to ≥ 80% or rename; track a PAB; document additionality/measurability |

### 7.5 Data provenance & limitations

- **No PRNG/seeded data** — a pure rules engine over caller-supplied fund attributes. Reference
  tables faithfully reproduce ESMA/2024/249 structure, dates and the PAB Art 12 exclusion
  thresholds.
- Term detection is naive substring matching: "ESG" inside another word, multilingual names, and
  word-boundary cases can mis-fire; the real guidelines also distinguish term *combinations*
  (e.g. transition terms combined with environmental terms allow CTB rather than PAB exclusions)
  — the engine applies the stricter union instead.
- ESMA's actual regime distinguishes **PAB exclusions** (environmental/impact/sustainability
  terms) from **CTB exclusions** (transition/social/governance terms — Climate Transition
  Benchmark, which permits some fossil exposure); the engine applies the PAB set to every
  category, a conservative simplification.
- Compliance inputs are self-declared booleans (has_pai_exclusions etc.) — no portfolio
  look-through verification; the "meaningfully invest in sustainable investments" expectation for
  "sustainable" terms is proxied by the DNSH flag alone.
- The compliance score is presentational; ESMA compliance is binary per check, which
  `overall_compliant` captures correctly.

### 7.6 Framework alignment

- **ESMA/2024/249 Guidelines:** the 80% minimum proportion of investments used to meet the E/S
  characteristics or sustainable objectives, term-group taxonomy (environmental, social,
  governance, impact, transition, sustainability), impact/measurability expectations and the
  Nov-2024/May-2025 application dates are all implemented as stated in the Final Report.
- **EU Benchmark Regulation 2016/1011 + Delegated Regulation 2020/1818 Art. 12:** the PAB
  exclusion list with exact revenue thresholds (1% coal / 10% oil / 50% gas / 5% tobacco); PAB
  derives these as activity-revenue screens applied to benchmark constituents — reproduced
  verbatim in the reference data.
- **SFDR (2019/2088):** Art 8 (E/S characteristics) vs Art 9 (sustainable objective) minimums;
  DNSH per Art 2(17) sustainable-investment definition (do-no-significant-harm assessed via PAI
  indicators) is required for Art 9 and "sustainable"-named funds.
- **EU Taxonomy Art 8 DA / MiFID II / PRIIPs:** consistency obligations surfaced as advisory
  cross-framework notes rather than computed checks.

## 9 · Future Evolution

### 9.1 Evolution A — Word-boundary term detection, PAB-vs-CTB distinction, and portfolio look-through (analytics ladder: rung 1 → 3)

**What.** The ESMA Fund Names ESG Guidelines Engine (E16) — tests fund names against ESMA/2024/249:
detect ESG terms across 6 categories, derive requirements (80% threshold, PAB exclusions, DNSH, PAB
tracking, impact evidence), test caller attributes, emit a compliance score and blocking/non-blocking
gaps. Pure rules engine, no PRNG, with faithfully-reproduced ESMA dates and PAB Art. 12 revenue
thresholds. §7.5 names the deepening targets: term detection is **naive substring matching** ("ESG"
inside another word, multilingual names mis-fire); the engine applies the **stricter PAB exclusion set
to every category** whereas ESMA distinguishes PAB exclusions (environmental/impact/sustainability
terms) from the looser **CTB exclusions** for transition/social/governance terms (which permit some
fossil exposure); and compliance inputs are **self-declared booleans** with no portfolio look-through.
Evolution A adds word-boundary/multilingual detection, the PAB-vs-CTB distinction, and portfolio
verification.

**How.** `detect_terms` uses tokenised word-boundary matching (with a multilingual term list) instead of
substring; the requirement derivation applies CTB exclusions for transition/social/governance-only
names and PAB exclusions for environmental/impact/sustainability names (the actual ESMA regime), rather
than the conservative union; the assessment verifies `esg_investment_pct` and PAB/CTB exclusions against
the fund's actual holdings (via the platform's portfolio and entity-resolution layers) instead of trusting
self-declared booleans. Rung 3: the 80% threshold check validates against look-through holdings data.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /assess` and `/assess/batch`
**failed** and `/detect-terms` **skipped**; the PAB-vs-CTB conservatism is a documented over-strictness
to correct. **Acceptance:** the §7.4 worked example ("Alpha Global Climate Transition Impact Fund",
score 40.0, non-compliant) reproduces under the legacy PAB-union rule, then a transition-only fund gets
CTB (not PAB) exclusions; "ESG" inside another word no longer mis-fires; the 80% check can verify
against real holdings; the failing endpoints pass the harness.

### 9.2 Evolution B — Fund-naming compliance copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for fund-compliance/product teams: "is this fund name ESMA-compliant?" (`/assess` →
compliance score, blocking/non-blocking gaps with guideline paragraph citations, SFDR note,
recommendations), "what ESG terms does this name trigger and what requirements follow?" (`/detect-terms`),
and "screen our whole fund range" (`/assess/batch`) — narrating the engine's real rule output including
the canonical remediation ("raise to ≥80% or rename").

**How.** Tool schemas over the 3 POST + 4 GET operations; the reference endpoints (term categories, PAB
exclusions, SFDR requirements, timeline, cross-framework) are exceptional RAG grounding for "what does
ESMA/2024/249 §27 require?" or "what are the PAB fossil-fuel thresholds?" questions — a tier-1 explainer
over a tier-2 operator. The no-fabrication validator checks every score, threshold and gap against tool
output; the copilot cites the guideline paragraph for each gap and distinguishes blocking (threshold,
PAB) from non-blocking gaps. Composable with `eu_gbs`, `eu_taxonomy_gar` and `cdp_scoring` in a
regulatory-disclosure desk.

**Prerequisites.** Evolution A's harness fixes and PAB-vs-CTB correction (so narrated exclusions are
regime-faithful); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure/citation
traces to an engine tool call; the compliance verdict matches `/assess`; a gap is reported with its
ESMA paragraph; the copilot correctly applies CTB (not PAB) exclusions to a transition-only fund name
post-Evolution A.