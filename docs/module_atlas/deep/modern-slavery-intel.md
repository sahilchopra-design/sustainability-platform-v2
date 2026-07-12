## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes the frontend as running the formula
> `FLRS = SectorRisk + CountryRisk + AdverseMediaScore + RegulatoryListHit`, backed by an AI
> adverse-media screening pipeline and 5 live API endpoints (`/assess`, `/msa-statement`,
> `/supply-chain-screen`, `/uflpa-exposure`, plus 4 reference-data GETs). **The frontend page never
> calls any of them.** `ModernSlaveryIntelPage.jsx` is 100% client-side, generating all 60 companies'
> scores via the seeded PRNG `sr()`. The backend (`backend/services/modern_slavery_engine.py`, 1,889
> lines) genuinely implements a well-built ILO/UK MSA/EU FLR/UFLPA weighted-risk engine — but it is
> orphaned from the UI. Sections below document (a) what the page renders, and (b) the real backend
> methodology that should be wired to it.

### 7.1 What the frontend page computes

60 named real companies (Nike, Walmart, Foxconn, Rio Tinto, JBS, G4S, etc.) across 8 sectors, each
seeded independently:

```js
msaScore    = round(sr(i*7)*60 + 30)                          // 30–90
ukMSA       = sr(i*11) > 0.3 ? 'Filed' : 'N/A'                // ~70% filed
ausMSA      = sr(i*13) > 0.5 ? 'Filed' : 'N/A'                // ~50% filed
indicators  = INDICATORS.filter((_,j) => sr(i*100+j*7) > 0.6).slice(0, round(sr(i*17)*4+1))
supplyTiers = round(sr(i*19)*5+1); audits = round(sr(i*23)*50+5); violations = round(sr(i*29)*10)
remediated  = round(violations * (sr(i*31)*0.5+0.3))           // 30–80% of violations remediated
remediationRate = violations>0 ? round(remediated/violations*100) : 100   // real ratio over synthetic inputs
riskLevel   = msaScore>70?'Low':msaScore>50?'Medium':msaScore>30?'High':'Critical'
```

Sector aggregates (`sectorRisk`) and indicator frequency (`indDist`) are real `reduce`/`groupBy`
operations over the 60 synthetic rows — genuine aggregation, synthetic inputs.

### 7.2 The real backend methodology (`modern_slavery_engine.py`, not called by this page)

```python
# ILO composite score (11 indicators, weighted)
for each ILO indicator: raw_score = risk_map[sector_prevalence]   # very_high .9/high .7/medium .45/low .2/very_low .05
    if known_cahra_links: raw_score = min(1.0, raw_score * 1.3)
    if known_xinjiang_links and indicator in {movement, isolation, conditions}: raw_score *= 1.5
    weighted_score += indicator.weight * raw_score
ilo_composite = weighted_score / total_weight * 100

# UK MSA baseline: no statement=10, has statement=45 (+10 if audited, +5 if EU FLR programme)
# EU FLR readiness: +40 (has programme) +20 (has MSA stmt) +min(30, audit_schemes*10) −5 (unmapped Tier-1 suppliers)
# UFLPA exposure: +70 (Xinjiang links) + min(20, china_supplier_count*5) + min(10, uflpa_commodity_match*5) +10 (no compliance programme)

overall_aggregate = ilo_score*0.4 + uflpa_score*0.25 + child_labour_risk_val*5 + debt_bondage_risk_val*5 + cahra_flag_count*10
overall_tier = aggregate>=60 or any(cahra_flags) ? 'critical' : aggregate>=40 ? 'high' : aggregate>=20 ? 'medium' : 'low'
```

### 7.3 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Frontend `msaScore` range | 30–90 | Arbitrary PRNG stretch; no linkage to the real backend's 0–100 composite |
| Backend `risk_map` | very_high 0.9 / high 0.7 / medium 0.45 / low 0.2 / very_low 0.05 | Hand-calibrated ILO prevalence-to-score mapping — reasonable ordinal scale, not empirically fit |
| Backend CAHRA multiplier | ×1.3 | Applied when entity has Conflict-Affected/High-Risk-Area links — a defensible escalation factor, magnitude not independently sourced |
| Backend Xinjiang multiplier | ×1.5 on 3 specific ILO indicators (movement, isolation, conditions) | Targets the indicators most associated with documented Uyghur forced-labour patterns per US/UK government reporting — a reasonable, specific design choice |
| Backend overall-tier weights | ILO 40%, UFLPA 25%, child-labour 5×ordinal, debt-bondage 5×ordinal, CAHRA +10/flag | Hand-calibrated composite; ILO/UFLPA given the largest weight as the two frameworks with the richest underlying indicator sets |

### 7.4 Calculation walkthrough (frontend)

1. **MSA Dashboard tab** — sortable/searchable/paginated table over the 60 rows; KPI strip
   (`avgScore`, `critical` count, `ukFiled`/`ausFiled` counts, `totalViolations`, `avgRemediation`)
   computed via `reduce`/`filter` over the currently filtered subset.
2. **Statement Analysis tab** — pie of `statementQuality` distribution (`Comprehensive/Adequate/
   Basic/Minimal`, PRNG-selected); bar of board-signoff rate by sector.
3. **Forced Labour Indicators tab** — `indDist` bar chart of the 12 `INDICATORS` by cross-company
   frequency; sector violations bar chart.
4. **Supply Chain Risk tab** — top-15 supply-chain-mapping-% bar chart; audits-vs-violations scatter.
5. **Detail panel** — per-company drill-down showing all fields plus a 5-year synthetic trend
   (`yearly` array, `score = msaScore−5+y×3+jitter`, a simple upward-drift illustration).

### 7.5 Worked example

Backend `_score_ilo_indicators` for a hypothetical apparel-sector entity with a CAHRA link and one
ILO indicator ("restriction_of_movement") flagged `high` prevalence for that sector, weight 0.12 (of
total weight ≈1.0 across 11 indicators):

```
raw_score = risk_map['high'] = 0.70
CAHRA adjustment: raw_score = min(1.0, 0.70 × 1.3) = 0.91
contribution to weighted_score: 0.12 × 0.91 = 0.1092
```

Summed across all 11 indicators and divided by `total_weight`, this produces the `ilo_composite_score`
(0–100). If this entity's `uflpa_score` (from the separate UFLPA baseline function) were, say, 45, and
it had one CAHRA flag: `aggregate = ilo×0.4 + 45×0.25 + child_val×5 + debt_val×5 + 1×10` — with
`ilo≈60` this gives `24 + 11.25 + (say 2×5=10) + (2×5=10) + 10 = 65.25`, which exceeds the 60 threshold
→ **overall_risk_tier = 'critical'** (also triggered independently by the CAHRA flag itself, since
the rule is `aggregate ≥ 60 OR any CAHRA flag`).

### 7.6 Data provenance & limitations

- **Frontend and backend are entirely disconnected.** The frontend's synthetic 60-company dataset has
  no relationship to the backend's real, weighted ILO/UK-MSA/EU-FLR/UFLPA scoring engine — a user
  interacting with this Tier-A module sees plausible-looking real company names with fabricated risk
  scores, not the output of the sophisticated engine that exists in the same codebase.
- The backend engine's `_uk_msa_baseline`/`_eu_flr_readiness`/`_uflpa_baseline` functions are
  deterministic (`"No DB calls — deterministic scoring from reference data"` per the class docstring)
  and reference real regulatory thresholds — genuinely production-adjacent code, unlike most modules
  in this deep-dive batch.
- `remediationRate` on the frontend is a real ratio computation, but over PRNG-generated `violations`/
  `remediated` counts that bear no relationship to the named companies' actual audit histories.

**Framework alignment:** ILO Indicators of Forced Labour 2012 (correctly implemented as an 11-indicator
weighted score in the **backend**, absent from the **frontend**) · UK Modern Slavery Act 2015 §54
(backend tiering genuinely reflects Home Office quality-tier bands) · EU Forced Labour Regulation
2024/3015 (backend readiness score genuinely reflects programme/statement/audit-scheme components) ·
US UFLPA (backend Xinjiang-link and CAHRA-commodity scoring genuinely reflects DHS enforcement
priorities) · CAHRA (Conflict-Affected and High-Risk Areas) — implemented in backend only.

## 8 · Model Specification

**Status: specification — not yet implemented in code (wiring, not new methodology, is what's needed).**

### 8.1 Purpose & scope
This is the rare case where §8 is a **wiring specification**, not a from-scratch model design: connect
the existing, well-built `ModernSlaveryEngine` backend to `ModernSlaveryIntelPage.jsx` so the 60
displayed companies show real ILO/UK-MSA/EU-FLR/UFLPA scores instead of PRNG output, for supply-chain
compliance teams performing UK/Australian MSA and UFLPA due diligence.

### 8.2 Conceptual approach
Standard frontend-to-backend integration: replace the client-side `COS` generator with a `fetch` call
to `POST /api/v1/modern-slavery/assess` (already implemented, per `trace_labels`) for each tracked
entity, batched or paginated as needed; retain the existing UI/chart structure since it is already
well-designed for the real response shape (`uk_msa_score`, `eu_flr_readiness_score`,
`uflpa_exposure_score`, `ilo_composite_score`, `overall_risk_tier`, `cahra_flags` map directly onto the
current `msaScore`/`ukMSA`/`riskLevel`/etc. fields).

### 8.3 Mathematical specification
No new mathematics — reuse the backend's existing, already-correct formulas from §7.2 verbatim. The
only new logic needed is a batch/portfolio aggregation layer:

```
PortfolioFLRS = weighted_mean(entity.overall_aggregate, weight = entity.revenue_exposure_or_equal_weight)
SectorRisk_s  = mean(entity.ilo_composite_score for entity in sector s)
```

### 8.4 Data requirements
Per-company `AssessForcedLabourRequest` payloads (sector, supply-chain countries, commodities,
Xinjiang/CAHRA link flags, existing audit schemes, MSA/EU-FLR programme status) for each of the 60
tracked companies — this is a data-entry/onboarding task, not a new data-source integration, since the
scoring logic already exists.

### 8.5 Validation & benchmarking plan
Spot-check a handful of well-documented real cases (e.g. a company with a publicly reported UFLPA
Withhold Release Order) against the backend's computed `uflpa_risk_level` to confirm the engine
produces sensible outputs before wiring to the full 60-company UI.

### 8.6 Limitations & model risk
The backend engine is deterministic and reference-data-driven, not ML-based — it will not surface
forced-labour risk not captured by its sector/country/CAHRA reference tables (e.g. company-specific
adverse media the guide's original description promised but the backend does not actually implement
as an "AI-powered adverse media screening" pipeline — that capability remains unbuilt even in the
backend and would need genuine NLP/news-ingestion infrastructure).
