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
