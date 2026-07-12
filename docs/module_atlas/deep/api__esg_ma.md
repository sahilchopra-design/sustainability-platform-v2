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
