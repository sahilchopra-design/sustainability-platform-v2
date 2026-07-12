# Api::Mifid_Spt
**Module ID:** `api::mifid_spt` · **Route:** `/api/v1/mifid-spt` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/mifid-spt/assess/batch` | `assess_batch` | api/v1/routes/mifid_spt.py |
| GET | `/api/v1/mifid-spt/ref/product-esg-types` | `ref_product_esg_types` | api/v1/routes/mifid_spt.py |
| GET | `/api/v1/mifid-spt/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/mifid_spt.py |

### 2.3 Engine `mifid_spt_engine` (services/mifid_spt_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PreferenceMatchResult.to_dict` |  |  |
| `MiFIDSPTResult.to_dict` |  |  |
| `MiFIDSPTEngine.assess_client_preferences` | client, products | Run Art 25(2) suitability preference matching for a client against a product universe. Returns a MiFIDSPTResult with per-product match detail and portfolio-level statistics. |
| `MiFIDSPTEngine.generate_suitability_report_text` | result | Generate human-readable suitability report text blocks from a MiFIDSPTResult dict (as returned by MiFIDSPTResult.to_dict()). |
| `MiFIDSPTEngine.get_preference_categories` |  |  |
| `MiFIDSPTEngine.get_suitability_process` |  |  |
| `MiFIDSPTEngine.get_cross_framework` |  |  |
| `MiFIDSPTEngine.get_product_esg_types` |  |  |
| `MiFIDSPTEngine.get_timeline` |  |  |
| `MiFIDSPTEngine._build_suitability_notes` | client, matched_count, total, adjustment_recommended |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `result`, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mifid-spt/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_art_8_9', 'eu_taxonomy', 'pai_sfdr_rts', 'csrd_esrs_e1', 'eba_esg_risk'], 'n_keys': 5}`

**GET /api/v1/mifid-spt/ref/preference-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['category_a', 'category_b', 'category_c'], 'n_keys': 3}`

**GET /api/v1/mifid-spt/ref/product-esg-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['article_9', 'article_8_with_commitment', 'article_8_without_commitment', 'article_6'], 'n_keys': 4}`

**GET /api/v1/mifid-spt/ref/suitability-process** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['step', 'name', 'description', 'mandatory']}`

**GET /api/v1/mifid-spt/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['date', 'event', 'article']}`

**POST /api/v1/mifid-spt/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/mifid-spt/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/mifid-spt/suitability-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `mifid_spt_engine` — extracted transformation lines:**
```python
match_rate_pct = (matched_count / total * 100.0) if total > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring ("MiFID II Sustainability Preferences Engine (E12)") is the methodology narrative; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/mifid_spt_engine.py` (class `MiFIDSPTEngine`, registry slot **E12**) implements the **MiFID II sustainability-preferences suitability process** introduced by EC Delegated Regulation 2021/1253 (amending Delegated Reg 2017/565), Art 2(7) + Art 25(2). Given a `ClientPreferences` record and a product universe of `ProductProfile`s, it returns per-product match booleans across the three legal preference categories, a weighted 0–100 match score, portfolio match rate, suitability notes, an adjustment-procedure flag, and generated suitability-report text blocks. Exposed via `api/v1/routes/mifid_spt.py`: `POST /assess`, `POST /assess/batch`, `POST /suitability-report`, and `GET /ref/{preference-categories, product-esg-types, suitability-process, cross-framework, timeline}`.

### 7.2 Parameterisation

**The three preference categories** (`PREFERENCE_CATEGORIES`, with legal citations embedded):

| Category | Legal basis | Product metric tested |
|---|---|---|
| A — EU Taxonomy-Aligned | Art 2(7)(a) MiFID II + Reg (EU) 2020/852 | `taxonomy_alignment_pct ≥ client_min_A` |
| B — SFDR Sustainable Investments | Art 2(7)(b) MiFID II + Art 2(17) SFDR | `sfdr_sustainable_investment_pct ≥ client_min_B` |
| C — PAI Consideration | Art 2(7)(c) MiFID II + Art 4 SFDR (RTS Annex I) | `considers_pais == True` (binary) |

All effective 2022-08-02 (the real application date of DR 2021/1253).

**Match-score weights** (engine constants): `_WEIGHT_A = 0.40`, `_WEIGHT_B = 0.40`, `_WEIGHT_C = 0.20` — a platform convention; the regulation defines no scoring.

**Product ESG type map** (`PRODUCT_ESG_TYPES` — stylised expectations per SFDR article): Article 9 (min sustainable 100%, PAIs considered, typical taxonomy 15%), Article 8 with commitment (10% / PAIs yes / 5%), Article 8 without commitment and Article 6 (0% / no / 0%). The Art-9 "100% sustainable investments" reflects the ESMA/Commission Q&A position; "typical taxonomy" percentages are illustrative market observations.

**Process & timeline reference data:** the 5-step Art 25(2) suitability process (collect preferences → screen universe → financial suitability overlay → *optional* preference adjustment → documentation; step 4 flagged non-mandatory) and a 5-event regulatory timeline (2021-07-02 OJEU publication → 2022-08-02 application → 2023-06-30 ESMA Q&A → 2024-01-01 ESMA suitability guidelines → 2025-01-01 SFDR-review alignment) — the first four dates match the public record; the 2025 review entry is anticipatory.

### 7.3 Calculation walkthrough

For each product:

1. **Boolean matches** per category; each failed category appends a quantified `gap_note` (e.g. "Category A gap: product taxonomy_alignment_pct (5.0%) < required (20.0%)").
2. **Partial-credit component scores:** if a threshold category fails, `score = min(100, product_pct / max(client_min, 1e-9) × 100)` — proportional credit toward the client's threshold; Category C is all-or-nothing (100/0).
3. **Weighted score:** `match_score = 0.4·score_A + 0.4·score_B + 0.2·score_C`.
4. **Overall match:** all *actively required* preferences must pass (a category is required only if the client min > 0 / C = true); a client with no preferences matches everything — mirroring the regulation, where sustainability preferences only bind when expressed.
5. **Portfolio stats:** `match_rate_pct = matched/total × 100`; `adjustment_recommended = (matched == 0 AND any preference active)` — triggering the Art 25(2)/ESMA-Q&A adjustment procedure.
6. **Suitability notes** (rule-based): retail investor → Art 25(6) written-report note; Category C active → SFDR RTS Annex I note; Category A min > 50% → "above typical Art 9 taxonomy-alignment levels, universe may be severely constrained" warning; adjustment trigger note.
7. **Report generator** (`generate_suitability_report_text`): five fixed text blocks (client summary, preference summary, match summary, recommendation, Art 25(6) disclosure statement) plus a conditional `adjustment_text` that correctly states the adjustment "cannot be initiated by the investment firm" (ESMA Q&A position).

### 7.4 Worked example — one client, two products

Client: Category A min 20%, Category B min 30%, Category C required.

**Product P1** (Art 9): taxonomy 25%, sustainable 90%, PAIs yes → matches A, B, C; score = 0.4×100 + 0.4×100 + 0.2×100 = **100.0**; overall match ✔.

**Product P2** (Art 8 w/o commitment): taxonomy 5%, sustainable 12%, PAIs no:

| Component | Computation | Result |
|---|---|---|
| score_A | 5/20 × 100 | 25.0 |
| score_B | 12/30 × 100 | 40.0 |
| score_C | PAI fail | 0.0 |
| match_score | 0.4×25 + 0.4×40 + 0.2×0 | **26.0** |
| overall_match | A✗ B✗ C✗ | ✗ (3 gap notes) |

Portfolio: 1/2 matched → match rate 50%, `adjustment_recommended = False` (a match exists). Had the universe held only P2, the adjustment procedure would trigger and the report would emit the ESMA-compliant adjustment paragraph.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic entities, no DB** — the engine is a pure deterministic matcher over caller-supplied client and product data; product ESG metrics (taxonomy %, sustainable-investment %, PAI flag) are accepted as declared, with no verification against EET (European ESG Template) feeds or fund prospectuses.
- The 40/40/20 score weights and the proportional partial-credit formula are decision-support additions; regulatory matching is strictly the boolean layer (which the engine keeps separate, correctly using only booleans for `overall_match`).
- The financial-suitability overlay (knowledge, experience, capacity for loss — step 3) is referenced in notes and report text but **not computed**; the module handles the sustainability leg only.
- No persistence of assessments in the engine (the route layer handles any storage); `assessment_id` is a fresh UUID per run.
- Legal reference strings (article numbers, dates, ESMA Q&A) are accurate condensations, suitable for report boilerplate but not legal advice.

### 7.6 Framework alignment

- **MiFID II / Delegated Regulation (EU) 2021/1253:** the Art 2(7) three-category definition of "sustainability preferences" is implemented verbatim (taxonomy-aligned minimum %, SFDR sustainable-investment minimum %, PAI consideration), and the Art 25(2) sequencing — preferences collected *after* the standard suitability profile, products screened, adjustment only client-initiated with documentation — is encoded in the process steps and report text.
- **ESMA Guidelines on suitability (2023) & Q&A:** the adjustment-procedure language (inform client, document reasons, firm may not initiate) follows ESMA's published guidance.
- **SFDR (2019/2088):** Art 2(17) sustainable-investment definition feeds Category B; Art 4 PAI regime (RTS Annex I indicator set) feeds Category C; the Art 6/8/9 product typology drives the ESG type map.
- **EU Taxonomy Regulation (2020/852):** taxonomy-alignment % (turnover/CapEx-based in practice) is Category A's metric; the engine consumes it as a supplied number rather than computing alignment.
- **CSRD/ESRS E1 & EBA ESG risk guidelines:** referenced in the cross-framework map as evidence and complementary-categorisation linkages, not computed here.

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-construction under sustainability preferences (analytics ladder: rung 1 → 5)

**What.** The E12 `MiFIDSPTEngine` implements the MiFID II sustainability-preferences
suitability process (EC Delegated Reg 2021/1253): given a client's preferences across the
three legal categories (min Taxonomy %, min SFDR sustainable-investment %, PAI
consideration) and a product universe, it returns per-product match booleans, a weighted
0–100 match score, portfolio `match_rate_pct = matched/total×100`, and suitability-report
text. It is a deterministic matcher — it *screens* a given universe but does not
*construct* a compliant portfolio or handle the adjustment procedure quantitatively.
Evolution A adds construction and gap-closure.

**How.** (1) Add a portfolio-construction endpoint (rung 5 prescriptive): given the client
preferences and an investable universe, select weights maximising expected return subject
to the min-Taxonomy/min-SI/PAI constraints being met at portfolio level — scipy
constrained optimisation. (2) Quantify the adjustment procedure: when no product meets
stated preferences, compute the minimal preference relaxation that yields a suitable set,
rather than just flagging `adjustment_required`. (3) Wire product ESG metrics from the
platform's SFDR product-reporting and taxonomy modules so the match tests use computed,
not caller-asserted, alignment. (4) Bench-pin the match score and rate.

**Prerequisites.** Product ESG metrics sourced from the SFDR/taxonomy engines (they exist
on the platform); an investable-universe input with returns/risk. **Acceptance:** the
construction endpoint returns a preference-compliant weighted portfolio or a documented
minimal relaxation; product alignment traces to computed SFDR/taxonomy figures; bench pin
reproduces the match score.

### 9.2 Evolution B — Suitability-advisory copilot for sustainability preferences (LLM tier 2)

**What.** A copilot for advisers: "this client wants ≥30% Taxonomy-aligned and PAI
consideration — which of our products qualify, and what's the portfolio match rate?"
(calling `/assess/batch` and citing the per-category match booleans), then drafting the
MiFID suitability report via `/suitability-report`.

**How.** Batch assessment plus `/suitability-report` and five `/ref/*` endpoints
(preference-categories with legal citations, product-ESG-types, suitability-process,
cross-framework, timeline) that ground the regime. The cross-framework endpoint maps
preferences to SFDR Art 8/9, EU Taxonomy, and PAI RTS so the copilot explains *why* a
product qualifies. The generated report blocks become the tier-2 drafting action. Strong
node for a wealth/advisory desk.

**Prerequisites.** None hard — engine is honest and reference-complete; the
`/suitability-report` text generation exists today. **Acceptance:** every match boolean,
score, and report block traces to a tool response; the copilot cites the specific
Delegated Regulation article per preference category from the reference endpoint; it
refuses to state final suitability (an adviser judgement) and frames output as the
regulatory screening the engine computes.