## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. There is also no separate engine file — the entire methodology lives in the route module `api/v1/routes/irena_five_pillars.py`, which self-describes as "simplified from IRENA ETAF".)*

### 7.1 What the module computes

A **weighted five-pillar energy-transition readiness score** for a country, organisation or project, based on the IRENA World Energy Transitions Outlook 2023 / Energy Transition Readiness Assessment framing. Two endpoints:

- `GET /framework` — returns the full rubric (`PILLARS`: pillar weights, 25 criteria, max scores).
- `POST /assess` — takes caller-supplied criterion scores (0–10 each) and returns per-pillar results, an overall percentage/rating, a readiness label, gap analysis, recommendations, and country benchmark indices pulled live from the database.

Core formulas:

```
criterion_pct   = clamp(score, 0, max) / max × 100
pillar_pct      = Σ scores / Σ maxes × 100        (per pillar; 5 criteria × max 10 = 50)
weighted_score  = pillar_pct × pillar_weight
overall_pct     = Σ weighted / Σ (100 × weight) × 100     (weights sum to 1.0 → = Σ weighted)
```

### 7.2 Scoring rubric

| Pillar | Weight | Criteria (each scored 0–10) |
|---|---|---|
| Physical Infrastructure | 0.25 | grid capacity/reliability, storage deployment, interconnectors, EV charging, smart grid |
| Policy & Regulation | 0.25 | RE target (NDC), carbon pricing, fossil-subsidy reform, permitting/grid access, auction framework |
| Financing & Investment | 0.20 | RE investment volume, green-bond market, blended finance, risk-mitigation instruments, private-sector participation |
| Human Capital & Institutional Capacity | 0.15 | workforce/skills, R&D spending, institutional capacity, just-transition planning, gender & inclusion |
| Technology & Innovation | 0.15 | RE share in generation, efficiency progress, green-hydrogen readiness, electrification rate, innovation ecosystem |

Weights sum to 1.00. **Provenance:** the pillar names track IRENA's five enablers; the specific weights (0.25/0.25/0.20/0.15/0.15), the 5-criteria-per-pillar decomposition and the 0–10 scale are the platform's own simplification — IRENA's ETAF is a qualitative maturity assessment, not a published weighted index.

**Rating bands** (`_rating` / `_readiness`, applied to any pct):

| Pct | Rating | Transition readiness |
|---|---|---|
| ≥ 80 | Advanced | Transition-Ready |
| 60–79 | Progressing | On Track |
| 40–59 | Emerging | Needs Acceleration |
| < 40 | Early Stage | Significant Gaps |

Gap rule: any criterion below 50% is flagged with `gap_to_50pct = max×0.5 − score`; gaps sort ascending by pct (worst first). Missing criteria default to score 0 (they silently drag the pillar down rather than being excluded).

### 7.3 Calculation walkthrough

1. Inputs arrive as `pillar_scores: [{pillar_id, scores: {criterion_id: 0–10}}]`; each score is clamped to `[0, max]`.
2. Per pillar: raw sum, pct, weighted score, rating band.
3. Overall: since weights sum to 1, `overall_pct = Σ(pillar_pct × weight)`; `overall_score` is the raw sum (max 250) reported alongside.
4. **Recommendations:** the two weakest pillars below 60% get "Priority: Strengthen …" lines; the three worst criterion gaps get "Address gap: …" lines; overall ≥ 60% adds a "maintain momentum" line.
5. **Country benchmarks:** a live SQL join against `dh_country_risk_indices` (via `country_iso2 → country_iso3`) returns the latest score/rank per index — the route comment names CPI (Corruption Perceptions), FSI (Fragile States) and Freedom House. Failures are swallowed (`except: pass`), so benchmarks may be empty.

### 7.4 Worked example

Germany-style input: infrastructure scores {8,6,7,7,8} = 36/50; policy {9,8,5,6,8} = 36/50; financing {8,9,7,7,8} = 39/50; human capital {7,8,7,6,6} = 34/50; technology {6,7,6,5,7} = 31/50.

| Pillar | pct | × weight | Rating |
|---|---|---|---|
| Infrastructure | 72.0 | 18.00 | Progressing |
| Policy | 72.0 | 18.00 | Progressing |
| Financing | 78.0 | 15.60 | Progressing |
| Human capital | 68.0 | 10.20 | Progressing |
| Technology | 62.0 | 9.30 | Progressing |
| **Overall** | **71.1** | Σ = 71.10 | **Progressing / On Track** |

Gap analysis flags exactly one criterion: fossil-subsidy reform 5/10 = 50%… actually 50% is *not* < 50, so no gap is flagged; the electrification score 5/10 likewise sits at the boundary and is excluded — the strict `< 50` comparison means boundary scores never appear as gaps. No pillar is below 60%, so recommendations contain only the "maintain momentum" line.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic seeds** — all criterion scores are caller-supplied; the module fabricates nothing. However, it applies no evidence validation: a self-assessed 10/10 is accepted as-is, and **unsupplied criteria are scored 0**, conflating "not assessed" with "worst possible" (contrast with the insufficient-data-as-None convention in e.g. the infrastructure-finance engine).
- Country benchmarks are real ingested data (`dh_country_risk_indices`) but are contextual only — they do not enter the score.
- No persistence: assessments are computed and returned, not stored (no history endpoint).
- Weights, bands and the < 50% gap threshold are unattributed platform conventions.

### 7.6 Framework alignment

- **IRENA World Energy Transitions Outlook 2023:** provides the five-pillar/enabler framing (infrastructure, policy, finance, human capital, technology) that names the rubric; WETO itself is a scenario outlook (1.5 °C pathway investment needs), not a country scoring index — the module operationalises its enabler taxonomy as a scorecard.
- **IRENA Energy Transition Readiness Assessment:** IRENA's country readiness assessments are structured qualitative reviews conducted with member countries; the module approximates them with a self-scored 0–10 questionnaire and fixed weights.
- **NDCs / carbon pricing / auctions:** individual criteria reference real policy instruments (Paris Agreement NDC targets, carbon-pricing mechanisms, RE auction design) as scoring dimensions, assessed judgementally by the caller.
- **Transparency International CPI, Fragile States Index, Freedom House:** surfaced as country-context benchmarks from ingested reference data, aligning the readiness score with governance-risk context in the response payload.
