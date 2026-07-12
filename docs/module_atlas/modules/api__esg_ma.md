# Api::Esg_Ma
**Module ID:** `api::esg_ma` · **Route:** `/api/v1/esg-ma` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esg-ma/ungp-alignment` | `ungp_alignment_endpoint` | api/v1/routes/esg_ma.py |
| POST | `/api/v1/esg-ma/valuation-impact` | `valuation_impact_endpoint` | api/v1/routes/esg_ma.py |
| POST | `/api/v1/esg-ma/integration-plan` | `integration_plan_endpoint` | api/v1/routes/esg_ma.py |
| POST | `/api/v1/esg-ma/dd-report` | `dd_report_endpoint` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/dd-checklist` | `get_dd_checklist` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/ungp-principles` | `get_ungp_principles` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/valuation-ranges` | `get_valuation_ranges` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/deal-breakers` | `get_deal_breakers` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/csddd-scope` | `get_csddd_scope` | api/v1/routes/esg_ma.py |

### 2.3 Engine `esg_ma_engine` (services/esg_ma_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_resolve_checklist_status` | raw | Map a caller-supplied checklist finding to (status, risk_level, score). Accepts either an explicit status string ("satisfactory" / "requires_attention" / "material_gap" / "critical_finding"), a mapping containing a "status" key, or a numeric 0-1 completeness/quality score. Returns None when the input is absent or unrecognised so the item can be reported as an honest non-assessment. |
| `assess_esg_due_diligence` | entity_id, deal_name, target_sector, target_country, deal_value_usd, checklist_assessments | Assess ESG due diligence across the 85-item checklist. ``checklist_assessments`` maps a checklist item ``id`` (e.g. "DD-E01") to a caller-supplied finding — either a status string, a numeric 0-1 quality score, or a mapping with a "status"/"score" key (see ``_resolve_checklist_status``). Items without a supplied finding are reported as ``not_assessed`` and excluded from the E/S/G scoring so headlin |
| `score_ungp_alignment` | entity_id, target_company, sector, principle_scores_input, ilo_compliance_input, oecd_rbc_input | Score UNGP 31-principle alignment from caller-supplied evidence. ``principle_scores_input`` maps a UNGP id (e.g. "UNGP-11") to a 0-1 alignment score; ``ilo_compliance_input`` maps an ILO convention (e.g. "C29") to a compliance boolean; ``oecd_rbc_input`` maps an OECD RBC step key to a 0-1 score. Any principle/convention/step without supplied evidence is reported with a null score and excluded from |
| `_opt_num` | source, key | Return a numeric input from ``source`` or None (bool excluded). |
| `calculate_esg_valuation_impact` | entity_id, base_valuation_usd, esg_findings, quant_inputs | Quantify ESG purchase-price adjustments. ``esg_findings`` (already caller-supplied) drives the finding-level adjustments via the ESG_VALUATION_RANGES benchmark table — genuine core, preserved as-is. ``quant_inputs`` optionally supplies the entity-specific quant drivers: stranded_asset_pct, carbon_cost_usd, climate_litigation_usd, wage_gap_adj_pct, turnover_adj_pct, board_composition_score, ownersh |
| `plan_post_merger_integration` | entity_id, acquirer_profile, target_profile, close_date, integration_cost_usd | Build a 100-day post-merger ESG integration plan. The plan structure and its milestone dates are deterministic (genuine core). Cultural-gap and SBTi-trigger logic derive from the supplied acquirer/target profiles; when a profile omits ``esg_maturity`` / ``has_sbti`` / ``revenue_share`` the corresponding driver is treated as unknown (null) rather than fabricated. ``integration_cost_usd`` may be pas |
| `generate_dd_report` | entity_id, deal_name, target_sector, target_country, deal_value_usd, checklist_assessments, ungp_principle_scores, ungp_ilo_compliance | Compose an investment-committee ESG DD report from real sub-assessments. All entity-specific quantities are sourced from the optional inputs and default to honest nulls / empty sections when not supplied — no figures are fabricated. The DD checklist, UNGP, RAG, value-creation, deal-breaker and regulatory sections all flow from caller-supplied evidence via the same helpers used elsewhere here. |

**Engine `esg_ma_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `UNGP_PRINCIPLES` | `[{'id': 'UNGP-1', 'pillar': 'I', 'category': 'State_Protect', 'principle': 'States must protect against human rights abuse by business enterprises'}, {'id': 'UNGP-2', 'pillar': 'I', 'category': 'State_Protect', 'principle': 'States must set clear expectations for business HRs conduct in their territ` |
| `ESG_DD_CHECKLIST` | `[{'id': 'DD-E01', 'category': 'GHG_Climate', 'item': 'Scope 1/2/3 GHG inventory and verification status', 'weight': 3}, {'id': 'DD-E02', 'category': 'GHG_Climate', 'item': 'Science-based targets (SBTi) status and trajectory', 'weight': 3}, {'id': 'DD-E03', 'category': 'GHG_Climate', 'item': 'Climate` |
| `DEAL_BREAKER_CRITERIA` | `[{'id': 'DB-01', 'criterion': 'Active modern slavery / human trafficking in direct operations', 'category': 'Human_Rights'}, {'id': 'DB-02', 'criterion': 'Unmitigated child labour in Tier 1 supply chain (ILO C138/C182 breach)', 'category': 'Human_Rights'}, {'id': 'DB-03', 'criterion': 'Systematic in` |
| `CSDDD_SCOPE_THRESHOLDS` | `{'EU_group_1': {'employees': 5000, 'turnover_eur_m': 1500, 'phased_application': '2027'}, 'EU_group_2': {'employees': 3000, 'turnover_eur_m': 900, 'phased_application': '2028'}, 'EU_group_3': {'employees': 1000, 'turnover_eur_m': 450, 'phased_application': '2029'}, 'non_EU_group_1': {'eu_net_turnove` |
| `ESG_VALUATION_RANGES` | `{'climate_positive': {'range_pct': (2, 8), 'typical_pct': 4, 'driver': 'Low stranded asset risk, strong transition plan'}, 'climate_negative': {'range_pct': (-15, -5), 'typical_pct': -9, 'driver': 'High carbon liability, stranded assets, no transition'}, 'human_rights_positive': {'range_pct': (1, 4)` |
| `ILO_CORE_CONVENTIONS` | `[{'convention': 'C29', 'name': 'Forced Labour Convention 1930', 'subject': 'Elimination of forced or compulsory labour'}, {'convention': 'C87', 'name': 'Freedom of Association 1948', 'subject': 'Right to organise and form trade unions'}, {'convention': 'C98', 'name': 'Right to Organise and Collectiv` |
| `_STATUS_TO_SCORE` | `{'satisfactory': (1.0, 'low'), 'requires_attention': (0.65, 'medium'), 'material_gap': (0.3, 'high'), 'critical_finding': (0.0, 'critical')}` |
| `_OECD_RBC_STEP_KEYS` | `('step1_embed_rbc', 'step2_identify_impacts', 'step3_cease_prevent', 'step4_track_implementation', 'step5_communicate', 'step6_provide_remedy')` |
| `_VALUE_CREATION_LEVERS` | `[{'id': 'carbon_credit_monetisation', 'opportunity': 'Carbon credit monetisation from renewable energy assets'}, {'id': 'cbam_savings', 'opportunity': 'CBAM border adjustment savings from EU supply chain integration'}, {'id': 'green_bond_issuance', 'opportunity': 'Green bond issuance for EU Taxonomy` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DD`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esg-ma/ref/csddd-scope** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['directive', 'reference', 'published', 'transposition_deadline', 'scope_note', 'thresholds', 'value_chain_obligations', 'civil_liability'], 'n_keys': 8}`

**GET /api/v1/esg-ma/ref/dd-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_items', 'categories_count', 'categories', 'all_items'], 'n_keys': 4}`

**GET /api/v1/esg-ma/ref/deal-breakers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_criteria', 'category_breakdown', 'threshold', 'criteria'], 'n_keys': 4}`

**GET /api/v1/esg-ma/ref/ungp-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'endorsed', 'total_principles', 'pillar_I_count', 'pillar_II_count', 'pillar_III_count', 'pillars', 'ilo_core_conventions'], 'n_keys': 8}`

**GET /api/v1/esg-ma/ref/valuation-ranges** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodology', 'data_sources', 'adjustment_types_count', 'ranges'], 'n_keys': 4}`

**POST /api/v1/esg-ma/dd-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ma/due-diligence** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ma/integration-plan** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `esg_ma_engine` — extracted transformation lines:**
```python
e_score = e_score_sum / e_count if e_count else None
s_score = s_score_sum / s_count if s_count else None
g_score = g_score_sum / g_count if g_count else None
adj_pct = (overall_esg_score - 0.5) * 20  # -10% to +10% base
overall_ungp = round(sum(scored_pillars) / len(scored_pillars), 3) if scored_pillars else None
oecd_overall = round(sum(scored_steps) / len(scored_steps), 3) if scored_steps else None
adj_usd = base_valuation_usd * adj_pct / 100
stranded_asset_usd = base_valuation_usd * stranded_asset_pct if stranded_asset_pct is not None else None
g_adj_pct = (board_score - 0.5) * 6 - (ownership_conc - 0.3) * 4
adjusted_valuation = base_valuation_usd + total_adjustment_usd
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/esg-ma` wraps the **ESG M&A Due Diligence engine** ("E79",
`backend/services/esg_ma_engine.py`): a transaction-diligence toolkit combining (1) an 85-item
weighted ESG DD checklist producing E/S/G pillar scores and a deal-value adjustment, (2) UNGP
31-principle + ILO core-convention + OECD RBC 6-step human-rights scoring, (3) ESG valuation
impact (purchase-price adjustments, climate liabilities, W&I framing), (4) a 100-day post-merger
integration plan, and (5) an investment-committee DD report composing all of the above. A strong
post-remediation design theme runs through the code: every entity-specific quantity comes from
caller-supplied evidence or is reported as an **honest null** — "no figures are fabricated"
(function docstrings). Headline formulas quoted from code:

```
pillar score      = Σ score_i × weight_i / Σ weight_i         (assessed items only)
overall ESG       = (0.35·E + 0.35·S + 0.30·G) / Σ available weights
valuation adj %   = (overall − 0.5) × 20                       (−10% … +10% of deal value)
G adjustment %    = (board_score − 0.5)×6 − (ownership_conc − 0.3)×4
adjusted value    = base + Σ finding adj − climate liability + S adj + G adj
```

### 7.2 Parameterisation / scoring rubrics

**Checklist** (`ESG_DD_CHECKLIST`, `GET /ref/dd-checklist`): 85 items across 15 categories
(GHG & climate, biodiversity/EUDR, water, pollution/circular, supply-chain E, human rights,
labour, community/FPIC, product safety, board governance, anti-corruption, reporting, tax,
regulatory/legal, integration readiness), weights 1–3. Status ladder (`_STATUS_TO_SCORE`):
satisfactory 1.0/low, requires_attention 0.65/medium, material_gap 0.3/high, critical_finding
0.0/critical; numeric inputs bucket at ≥ 0.75 / ≥ 0.45 / ≥ 0.2. E = the five environment
categories, S = human rights/labour/community/product safety, G = the rest.

**Deal breakers** (`GET /ref/deal-breakers`): 12 criteria including active modern slavery, child
labour (ILO C138/C182), FPIC violations, > $50M undisclosed contamination, active FCPA/UKBA
prosecution, OFAC/EU SDN exposure, stranded assets > 30% without transition plan, GDPR breaches
€20M+, ESMA/FCA/SEC greenwashing investigations, post-Dec-2020 deforestation (EUDR cutoff),
prohibited weapons.

**CSDDD scope thresholds** (`GET /ref/csddd-scope`): EU groups at 5,000 empl/€1.5bn (2027),
3,000/€900M (2028), 1,000/€450M (2029) and non-EU turnover equivalents — matching the CSDDD's
phased application. In `assess_esg_due_diligence` the group is a **rough proxy from deal value**
(> $500M → group 2, else group 3), not from employee/turnover data.

**Valuation benchmark table** (`ESG_VALUATION_RANGES`, `GET /ref/valuation-ranges`) — synthetic
deal-premium/discount heuristics: climate positive +2…+8% (typical +4) vs climate negative
−15…−5% (−9); human-rights −12…−3% (−6); governance +2…+7% / −10…−3%; biodiversity −8…−2%;
reporting +1…+3%; labour −6…−2%. **UNGP register** (`GET /ref/ungp-principles`): all 31 principles
across the three pillars, verbatim summaries; ILO 8 core conventions (C29, C87, C98, C100, C105,
C111, C138, C182).

### 7.3 Calculation walkthrough

- **`POST /due-diligence`** — items without supplied findings become `not_assessed` /
  `insufficient_data` and are excluded from pillar sums. Red flags = material_gap or
  critical_finding items; `deal_breaker_check` = any critical severity; `ungp_dd_required` = any
  human-rights red flag; data_completeness ∈ {complete, partial, insufficient_data}.
- **UNGP scoring** (inside `/dd-report`) — per-principle 0–1 scores averaged per pillar
  (unscored principles excluded), overall = mean of scored pillar averages;
  `evidence_available` at ≥ 0.7, `gap_identified` at < 0.5; ILO compliance tri-state
  (true/false/not assessed) with violations listed; HRIA required if sector ∈ {mining,
  agriculture, garments, construction, electronics, fishing} or overall < 0.6;
  remedy adequate if Pillar III ≥ 0.65; OECD RBC steps averaged over supplied steps.
- **`POST /integration-plan`** — deterministic 100-day plan (governance alignment days 1–30,
  reporting harmonisation 31–60, policy/supply chain 61–100, systems months 6–12) with milestone
  dates from close date; cultural gap = |acquirer − target ESG maturity| → complexity high > 0.3,
  medium > 0.15, low otherwise; SBTi revision required when the acquirer has SBTi targets and the
  target adds > 10% revenue share (SBTi's recalculation trigger convention).
- **`POST /dd-report`** — composes DD + UNGP; category RAG (green ≥ 0.75, amber ≥ 0.5, red
  below) from caller scores; 5 value-creation levers (carbon credits, CBAM savings, green bonds,
  SFDR Art 9 relabelling, SLL repricing) valued only from caller estimates; deal-breaker items
  tri-state; recommendation ladder: any trigger → `escalate_to_board`, assessed without triggers
  → `proceed_with_conditions`, nothing assessed → `insufficient_data`; standing ESG reps &
  warranties list appended.

### 7.4 Worked example (due-diligence scoring)

Caller assesses 4 items: DD-E01 satisfactory (w3), DD-E03 material_gap (w3), DD-S04
critical_finding (w3), DD-G06 requires_attention (w3); deal value $800M.

| Step | Computation | Result |
|---|---|---|
| E score | (1.0×3 + 0.3×3)/(3+3) | 0.650 |
| S score | (0.0×3)/3 | 0.000 |
| G score | (0.65×3)/3 | 0.650 |
| Overall | (0.65×0.35 + 0×0.35 + 0.65×0.30)/1.00 | **0.4225** |
| Valuation adj | (0.4225 − 0.5)×20 | **−1.55% → −$12.4M** |
| Red flags | DD-E03 (high), DD-S04 (critical) | 2; deal_breaker_check = true |
| CSDDD proxy | $800M > $500M | EU_group_2 (2028 phase-in) |
| Completeness | 4/85 | "partial" |

### 7.5 Data provenance & limitations

- **No PRNG/seeded data.** Reference registers (UNGP text, ILO conventions, CSDDD thresholds,
  deal-breaker criteria) are faithful summaries of public frameworks; the valuation ranges and
  the ±10% score-to-price mapping are **synthetic transaction heuristics** without a cited
  empirical study.
- The CSDDD scope classification from deal value is a placeholder proxy — the directive scopes on
  employees and net turnover, which the API does not collect here.
- Pillar weights (0.35/0.35/0.30), status scores, RAG cut-offs, and the G-adjustment formula
  coefficients are design choices; the double-counting risk between the finding-level adjustments
  and the S/G/climate quantitative adjustments (all added to the same valuation) is left to the
  analyst.
- Unknown finding keys in `calculate_esg_valuation_impact` default to a (−5, +5)/0% range rather
  than erroring — silent pass-through worth knowing.
- Tri-state honesty means headline scores can rest on very few evidenced items (report
  `checklist_items_assessed` alongside any score).

### 7.6 Framework alignment

- **UN Guiding Principles on Business & Human Rights (2011):** all 31 principles encoded with
  pillar structure (State duty / corporate responsibility / access to remedy); UNGP 17–21 HRDD
  cycle and UNGP 31 effectiveness criteria drive the checklist items and remedy-adequacy test.
- **ILO Core Conventions (8):** forced labour (C29/C105), freedom of association (C87/C98),
  equal remuneration/non-discrimination (C100/C111), child labour (C138/C182) — compliance
  tri-state with violations surfaced as salient issues.
- **CSDDD (EU 2024/1760):** Art. 3 value-chain scope, phased thresholds (2027–2029), Art. 29
  civil-liability checklist item, supplier-cascade integration actions.
- **OECD Due Diligence Guidance for RBC:** the canonical 6-step cycle (embed → identify → cease/
  prevent → track → communicate → remediate) scored step-wise.
- **EUDR (2023/1115):** deforestation cutoff 31 Dec 2020 as a hard deal-breaker plus geolocation
  proof checklist items.
- **SBTi:** the > 10%-change recalculation trigger for combined-entity target re-validation.
- **CSRD/ESRS, TCFD, SFDR, EU Taxonomy, GRI 207, EU AI Act, GDPR, FCPA/UK Bribery Act:** appear
  as checklist dimensions and integration workstreams rather than computed assessments.

## 9 · Future Evolution

### 9.1 Evolution A — Empirical valuation ranges, CSDDD scope from real data, and double-count guard (analytics ladder: rung 1 → 3)

**What.** The ESG M&A Due Diligence engine (E79) — an 85-item weighted DD checklist, UNGP 31-principle
+ ILO + OECD RBC scoring, ESG valuation impact, a 100-day integration plan, and an IC report — a strong
honest-null design (every entity quantity is caller-supplied or reported null, "no figures are
fabricated"). §7.5 names the deepening targets: the valuation ranges and the ±10% score-to-price
mapping are **synthetic transaction heuristics without a cited empirical study**; the CSDDD scope is a
**rough proxy from deal value** (>$500M → group 2) rather than the directive's employee/turnover test;
there's a **documented double-counting risk** between finding-level adjustments and the S/G/climate
quantitative adjustments (all added to the same valuation, left to the analyst); and unknown finding
keys silently default to (−5,+5). Evolution A calibrates the valuation ranges against real ESG-in-M&A
deal data, scopes CSDDD from actual employee/turnover inputs, and guards the double-count.

**How.** `ESG_VALUATION_RANGES` calibrated against observed ESG deal premiums/discounts; the assessment
collects employee/turnover to classify CSDDD scope properly (not deal-value proxy); the valuation
aggregation reconciles finding-level and quantitative adjustments to prevent double-counting (or
documents the intended layering); unknown finding keys error rather than silently defaulting. Rung 3:
the pillar weights and score-to-price mapping get an empirical basis and sensitivity surfacing.

**Prerequisites (hard).** Fix the harness — §4.2 shows `POST /dd-report`, `/due-diligence`,
`/integration-plan` all **skipped** (need input payloads to trace); preserve the honest-null discipline
and always report `checklist_items_assessed` alongside scores (§7.5 — headline scores can rest on few
items). **Acceptance:** the §7.4 worked example (overall 0.4225, −1.55% valuation adj) reproduces at
legacy ranges; CSDDD scope derives from real employee/turnover; the double-count between adjustment
layers is resolved or explicitly documented; unknown finding keys are handled, not silently defaulted.

### 9.2 Evolution B — ESG deal-diligence copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for deal/IC teams: "assess ESG due diligence for this acquisition" (`/due-diligence`
→ E/S/G scores, red flags, deal-breaker check, CSDDD scope), "score UNGP alignment" (`/ungp-alignment`),
"quantify the ESG valuation impact" (`/valuation-impact`), "build the 100-day integration plan"
(`/integration-plan`), and "compose the IC report" (`/dd-report`) — narrating real outputs and the
honest nulls (unassessed checklist items excluded from scoring, not fabricated). The deal-breaker
criteria (modern slavery, EUDR post-2020 deforestation, active FCPA prosecution) directly answer "is
this a walk-away?"

**How.** Tool schemas over the 4 POST + 5 GET operations; the reference registers (85-item DD
checklist, UNGP principles, ILO conventions, CSDDD thresholds, deal-breaker criteria, valuation ranges)
are exceptional RAG grounding — faithful summaries of the real frameworks. The no-fabrication validator
checks every score, adjustment and threshold against tool output; the copilot always pairs a score with
its assessed-item count (per §7.5) so a thin-evidence score is never presented as complete, and cites
the guideline paragraph for each gap.

**Prerequisites.** Evolution A's harness fixes and double-count resolution (so narrated valuations are
sound); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an
engine tool call; a valuation adjustment matches `/valuation-impact`; every score is reported with its
assessed-item count; a deal-breaker finding escalates to board per the engine's recommendation ladder.