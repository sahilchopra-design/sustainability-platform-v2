# Greenwashing Exposure Monitor
**Module ID:** `greenwashing-exposure-monitor` · **Route:** `/greenwashing-exposure-monitor` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors portfolio exposure to greenwashing risk across holdings by aggregating issuer-level greenwashing scores, tracking regulatory enforcement actions, and quantifying financial contagion risk from greenwashing allegations. Integrates news analytics and regulatory filing analysis to provide early warning of greenwashing-related reputational and financial risk.

> **Business value:** Protects investment portfolios from greenwashing-related regulatory and reputational risk by providing continuous monitoring of issuer greenwashing exposure, regulatory enforcement tracking, and portfolio-level VaR quantification enabling proactive divestment or engagement decisions.

**How an analyst works this module:**
- Review the portfolio exposure heatmap to identify concentration in high greenwashing risk issuers by sector and geography.
- Monitor the regulatory enforcement tracker for new actions against portfolio holdings.
- Analyse the news sentiment early warning dashboard for emerging greenwashing allegations.
- Run the portfolio greenwashing VaR calculation and compare against internal ESG risk limits.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLAIM_CATEGORIES`, `CLAIM_STRENGTHS`, `COUNTRIES`, `ENFORCEMENT_ACTIONS`, `ENTITIES`, `ENTITY_NAMES`, `KpiCard`, `REGULATORS`, `RiskBadge`, `SECTORS`, `TABS`, `TIME_TO_ACTIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATORS` | 6 | `name`, `jurisdiction`, `avgFineM`, `focusAreas`, `investigationsActive`, `enforcementHistory`, `fineRangeMin`, `fineRangeMax` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CLAIM_CATEGORIES` | `['Net-Zero Pledge', 'Carbon Neutral', 'Green Product', 'Sustainable Investment', 'Eco-Friendly', 'Climate Positive', 'Science-Based', 'Nature-Positive', 'Circular Economy', 'Zero Emission'];` |
| `TIME_TO_ACTIONS` | `['Imminent', 'Near-Term', 'Medium-Term', 'Low Risk'];` |
| `sectorIdx` | `Math.floor(sr(i * 7) * 10);` |
| `countryIdx` | `Math.floor(sr(i * 11) * 15);` |
| `claimCatIdx` | `Math.floor(sr(i * 13) * 10);` |
| `claimStrIdx` | `Math.floor(sr(i * 17) * 4);` |
| `claimStrengthNorm` | `claimStrIdx / 3;` |
| `greenRevClaimed` | `Math.min(1, sr(i * 19) * 0.8 + 0.1);` |
| `greenRevActual` | `Math.min(greenRevClaimed, Math.max(0, greenRevClaimed * (sr(i * 23) * 0.8)));` |
| `gapScore` | `Math.max(0, Math.min(100, Math.round((greenRevClaimed - greenRevActual) * 100)));` |
| `regId1` | `Math.floor(sr(i * 29) * 5);` |
| `regId2` | `(regId1 + 1 + Math.floor(sr(i * 31) * 4)) % 5;` |
| `enforcementProb` | `Math.min(1, Math.max(0, gapScore / 100 * 0.6 + claimStrengthNorm * 0.2 + sr(i * 37) * 0.2));` |
| `controversyCount` | `Math.floor(sr(i * 41) * 15);` |
| `controversyNorm` | `controversyCount / 15;` |
| `esgImpact` | `-(sr(i * 43) * 15 + 1);` |
| `marketingSpend` | `+(sr(i * 47) * 50 + 0.5).toFixed(1);` |
| `fineEstimate` | `Math.round(enforcementProb * REGULATORS[regId1].avgFineM * 1e6 * (0.5 + sr(i * 53)));` |
| `disclosureScore` | `Math.round(sr(i * 59) * 80 + 10);` |
| `gwRisk` | `Math.min(100, Math.round(gapScore * 0.4 + enforcementProb * 100 * 0.3 + claimStrengthNorm * 100 * 0.2 + controversyNorm * 100 * 0.1));` |
| `regIdx` | `Math.floor(sr(k * 61 + 2000) * 5);` |
| `claimIdx` | `Math.floor(sr(k * 67 + 2000) * 10);` |
| `fineM` | `+(sr(k * 73 + 2000) * 180 + 0.5).toFixed(1);` |
| `year` | `2018 + Math.floor(sr(k * 79 + 2000) * 6);` |
| `top20` | `useMemo(() => [...ENTITIES].sort((a, b) => b.greenwashingRiskScore - a.greenwashingRiskScore).slice(0, 20), []);` |
| `riskDist` | `useMemo(() => [ [0, 20], [20, 40], [40, 60], [60, 80], [80, 100] ].map(([lo, hi]) => ({ range: `${lo}-${hi}`,` |
| `claimCatDist` | `useMemo(() => CLAIM_CATEGORIES.map(cat => ({` |
| `claimStrDist` | `useMemo(() => CLAIM_STRENGTHS.map(s => ({` |
| `gapData` | `useMemo(() => claimCatDist.slice(0, 8).map(d => ({ ...d, maxGap: Math.max(...filtered.filter(e => e.claimCategory === d.cat).map(e => e.gapScore), 0) })), [claimCatDist, filtered]);` |
| `totalFine` | `filtered.reduce((s, e) => s + e.fineEstimateUSD, 0);` |
| `avgRisk` | `filtered.length ? (filtered.reduce((s, e) => s + e.greenwashingRiskScore, 0) / filtered.length).toFixed(1) : '0';` |
| `avgGap` | `filtered.length ? (filtered.reduce((s, e) => s + e.gapScore, 0) / filtered.length).toFixed(1) : '0';` |
| `avgR` | `ents.length ? Math.round(ents.reduce((a, e) => a + e.greenwashingRiskScore, 0) / ents.length) : 0;` |
| `fineExp` | `ents.reduce((a, e) => a + e.fineEstimateUSD, 0);` |
| `avgEnf` | `band.length ? (band.reduce((s, e) => s + e.enforcementProbability, 0) / band.length * 100).toFixed(1) : '0';` |
| `avgFine` | `band.length ? Math.round(band.reduce((s, e) => s + e.fineEstimateUSD, 0) / band.length / 1e6) : 0;` |
| `avgRsk` | `band.length ? Math.round(band.reduce((s, e) => s + e.greenwashingRiskScore, 0) / band.length) : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/greenwashing/assess` | `assess` | api/v1/routes/greenwashing.py |
| POST | `/api/v1/greenwashing/screen-claim` | `screen_claim` | api/v1/routes/greenwashing.py |
| POST | `/api/v1/greenwashing/verify-labels` | `verify_labels` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/misleading-terms` | `ref_misleading_terms` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/claim-types` | `ref_claim_types` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/eu-requirements` | `ref_eu_requirements` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/fca-requirements` | `ref_fca_requirements` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/label-rules` | `ref_label_rules` | api/v1/routes/greenwashing.py |

### 2.3 Engine `greenwashing_engine` (services/greenwashing_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GreenwashingEngine.get_instance` |  |  |
| `GreenwashingEngine.screen_claim` | claim_text, claim_type |  |
| `GreenwashingEngine.verify_labels` | entity_id, labels, sfdr_art, taxonomy_pct |  |
| `GreenwashingEngine.assess` | entity_id, entity_name, claims, product_labels, sfdr_classification, taxonomy_alignment_pct |  |
| `GreenwashingEngine.ref_misleading_terms` |  |  |
| `GreenwashingEngine.ref_claim_types` |  |  |
| `GreenwashingEngine.ref_eu_requirements` |  |  |
| `GreenwashingEngine.ref_fca_requirements` |  |  |
| `GreenwashingEngine.ref_label_rules` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLAIM_CATEGORIES`, `CLAIM_STRENGTHS`, `COUNTRIES`, `REGULATORS`, `SECTORS`, `TABS`, `TIME_TO_ACTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Greenwashing VaR (%) | — | Enforcement precedent analysis | Probability-weighted expected portfolio loss from greenwashing enforcement actions; calibrated to average 5% market cap impact and enforcement probability by greenwashing risk tier. |
| High-Risk Issuer AUM (%) | — | Internal greenwashing scores | Portfolio weight in issuers scoring above the high-risk threshold (GWS >65); concentration above 10% triggers portfolio review. |
| Regulatory Actions (YTD) | — | FCA/SEC/ESMA enforcement tracker | Number of regulatory enforcement actions, investigations, or fines for greenwashing issued by major financial regulators year-to-date. |
| News Sentiment Score | — | News NLP analytics | Sentiment of greenwashing-related news coverage across portfolio issuers; strongly negative scores precede enforcement actions in 68% of cases. |
- **Issuer greenwashing risk scores** → Weight by portfolio allocation, compute portfolio-level exposure distribution → **Portfolio greenwashing risk heatmap**
- **FCA/SEC/ESMA enforcement action database** → Match enforcement actions to portfolio ISINs, compute financial impact → **Enforcement contagion risk by holding**
- **News and social media sentiment analytics** → Score greenwashing sentiment by issuer, flag trending negative sentiment → **Early warning signals by issuer**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/greenwashing/ref/claim-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['quantitative', 'qualitative', 'label', 'comparative', 'forward_looking'], 'n_keys': 5}`

**GET /api/v1/greenwashing/ref/eu-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['id', 'article', 'requirement', 'description']}`

**GET /api/v1/greenwashing/ref/fca-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 6, 'item0_keys': ['id', 'source', 'requirement', 'description']}`

**GET /api/v1/greenwashing/ref/label-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_article_8', 'sfdr_article_9', 'sdr_focus', 'sdr_improvers', 'sdr_impact', 'sdr_mixed_goals', 'eu_taxonomy_aligned'], 'n_keys': 7}`

**GET /api/v1/greenwashing/ref/misleading-terms** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 40, 'item0_keys': ['term', 'risk_level', 'substantiation']}`

**POST /api/v1/greenwashing/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/greenwashing/screen-claim** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/greenwashing/verify-labels** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio Greenwashing VaR
**Headline formula:** `GW_VaR = Σ_i (w_i × P_enforcement_i × FinancialImpact_i)`

Estimates the portfolio-level financial risk from greenwashing enforcement by weighting each holding's enforcement probability by its estimated financial impact (fine + reputational loss = average 3â€“8% market cap impact based on enforcement precedents). The result provides a probability-weighted expected loss from greenwashing exposure.

**Standards:** ['ESMA Greenwashing Progress Report (2023)', 'FCA Enforcement Actions Database', 'EU Sustainable Finance Disclosure Regulation']
**Reference documents:** ESMA â€” Greenwashing Progress Report (2023); FCA â€” Sustainability Disclosure Requirements Policy Statement PS23/16 (2023); SEC â€” ESG and Climate Disclosure Enforcement Actions (2024); KPMG â€” Survey of Sustainability Reporting (2022)

**Engine `greenwashing_engine` — extracted transformation lines:**
```python
substantiation_score = max(0.0, 1.0 - (len(issues) * 0.12) - (len(missing_reqs) * 0.08))
avg_claim_risk = total_claim_risk / len(claims) if claims else 0.0
eu_compliance_score = round(max(0.0, 100.0 - len(eu_gaps) * 18 - avg_claim_risk * 20), 1)
fca_compliance_score = round(max(0.0, 100.0 - len(fca_gaps) * 20 - avg_claim_risk * 15), 1)
overall_score = round((avg_claim_risk * 0.5 + (1 - eu_compliance_score / 100) * 0.3 + (1 - fca_compliance_score / 100) * 0.2), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **9** other module(s).
**Shared engines (edits propagate!):** `greenwashing_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `greenwashing-detection` | engine:greenwashing_engine, table:dataclasses |
| `greenwashing-detector` | engine:greenwashing_engine, table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide frames a *portfolio greenwashing VaR*
> `GW_VaR = Σ wᵢ·P_enforcementᵢ·FinancialImpactᵢ`. The page computes the two building blocks
> (enforcement probability and a $ fine estimate per entity) and aggregates a portfolio fine total, but
> it never weights by portfolio holding `wᵢ` — there are no portfolio weights in the data. So it is an
> **issuer-level greenwashing risk + expected-fine monitor**, not a weighted portfolio VaR. All 150
> entities are synthetic (`sr()` PRNG). The regulator table and its fine ranges are the only externally
> anchored inputs; the backend `greenwashing_engine.py` is not called.

### 7.1 What the module computes

For each of 150 entities the core chain is a claim-vs-reality gap → enforcement probability →
expected fine → composite greenwashing-risk score:

```js
greenRevClaimed = min(1, sr(i×19)×0.8 + 0.1)                         // 0.1–0.9
greenRevActual  = min(claimed, max(0, claimed × sr(i×23)×0.8))       // ≤ claimed
gapScore        = clamp(0,100, round((claimed − actual)×100))         // overstatement, 0–100
enforcementProb = clamp(0,1, gapScore/100×0.6 + claimStrengthNorm×0.2 + sr(i×37)×0.2)
fineEstimate    = round( enforcementProb × REGULATORS[reg].avgFineM×1e6 × (0.5 + sr(i×53)) )
gwRisk          = min(100, round( gapScore×0.4 + enforcementProb×100×0.3
                                  + claimStrengthNorm×100×0.2 + controversyNorm×100×0.1 ))
timeToAction    = gwRisk≥70 Imminent | ≥50 Near-Term | ≥30 Medium-Term | else Low Risk
```

`claimStrengthNorm = claimStrIdx/3` maps {Vague,Specific,Quantified,Verified} → {0,⅓,⅔,1}, so
*stronger, more specific claims raise enforcement risk* (a specific false claim is more actionable than
vague puffery) — a defensible modelling choice.

### 7.2 Parameterisation / rubric

**Enforcement-probability weights:** gap 0.60 · claim strength 0.20 · random shock 0.20.
**gwRisk weights:** gap 0.40 · enforcement 0.30 · claim strength 0.20 · controversy 0.10.

**Regulators** (`REGULATORS`, real names, illustrative fine levels):

| Regulator | Jurisdiction | Avg fine $M | Fine range $M | Active investigations |
|---|---|---|---|---|
| FCA | UK | 45 | 1–200 | 23 |
| SEC | USA | 120 | 5–800 | 38 |
| ASIC | Australia | 28 | 0.5–100 | 15 |
| BaFin | Germany | 35 | 1–150 | 18 |
| ESMA | EU | 55 | 2–300 | 31 |

10 claim categories, 4 claim strengths, 30 seeded enforcement-action records (2018–2023).

### 7.3 Calculation walkthrough

Each entity draws sector, country, claim category/strength, and green-revenue claimed/actual, from
which `gapScore` is the overstatement. `enforcementProb` blends gap, claim specificity and a random
shock; `fineEstimate = enforcementProb × regulator avg fine × (0.5–1.5 dispersion)`. `gwRisk` is the
composite. Portfolio aggregates: `totalFine = Σ fineEstimateUSD`, `avgRisk`, `avgGap`; risk-band
distribution buckets entities into 5 score ranges; top-20 by `greenwashingRiskScore` drives the
watchlist.

### 7.4 Worked example (one entity, FCA)

`greenRevClaimed = 0.70`, `greenRevActual = 0.30`, claim strength = Quantified (norm ⅔),
controversy 6/15, random shock 0.5, regulator FCA (avg $45M):

| Step | Computation | Result |
|---|---|---|
| gapScore | (0.70 − 0.30)×100 | 40 |
| enforcementProb | 0.40×0.6 + 0.667×0.2 + 0.5×0.2 | 0.24+0.133+0.10 = **0.473** |
| fineEstimate | 0.473 × 45M × (0.5+0.5) | ≈ **$21.3M** |
| controversyNorm | 6/15 | 0.40 |
| gwRisk | 40×0.4 + 47.3×0.3 + 66.7×0.2 + 40×0.1 | 16+14.2+13.3+4 = **48** |
| timeToAction | 48 in [30,50) | **Medium-Term** |

The $21.3M expected fine = enforcement probability × the FCA's average fine — a clean
probability-weighted expected-loss, just at the *issuer* level, not portfolio-weighted.

### 7.5 Data provenance & limitations

- **All 150 entities are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); green-revenue claimed/actual,
  enforcement probability, fines and controversy counts are seeded. Only the 5 regulators' names,
  jurisdictions and fine ranges reflect reality.
- **No portfolio weights** — the guide's `Σ wᵢ·P·Impact` VaR cannot be computed; the page sums raw
  fine estimates (`totalFine`), which is an *aggregate expected fine*, not a probability-weighted
  portfolio loss %.
- Enforcement probability and fine dispersion carry a random shock term, so identical fundamentals can
  yield different fines — appropriate for a demo but not calibrated to real base rates.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the portfolio-VaR the guide names requires
holdings weights and calibrated enforcement base rates, neither of which exist here).

**8.1 Purpose & scope.** Estimate probability-weighted portfolio loss from greenwashing enforcement and
reputational contagion across held issuers, for ESG risk-limit monitoring.

**8.2 Conceptual approach.** A frequency-severity expected-loss model per issuer, aggregated by
portfolio weight, mirroring operational-risk LDA and RepRisk/ESG-controversy contagion studies:
`P_enforcement` from a logit on claim-gap and specificity; `Impact` = fine + market-cap reaction
calibrated to event studies (~3–8% cap loss on greenwashing allegations).

**8.3 Mathematical specification.**
```
P_enforce_i = logit⁻¹(β₀ + β₁·gap_i + β₂·claimStrength_i + β₃·controversy_i + β₄·regulator_intensity)
Impact_i = Fine_i + CapReaction_i,  CapReaction_i = MarketCap_i × drop%  (event-study calibrated)
Fine_i   = min(fineCap, avgFine_reg × severity_i)
GW_VaR = Σ_i  w_i × P_enforce_i × Impact_i        (w_i = portfolio weight)
Contagion overlay: news-sentiment early warning (negative sentiment precedes action in ~68% of cases)
```

| Parameter | Source |
|---|---|
| Logit coefficients β | fit to FCA/SEC/ESMA enforcement outcomes |
| CapReaction drop% | greenwashing event-study literature (3–8%) |
| Avg/range fines | regulator enforcement databases (page priors are plausible) |
| Sentiment feed | news NLP (early-warning) |

**8.4 Data requirements.** Portfolio holdings + weights, issuer claim data, enforcement history by
regulator, market cap, news sentiment. The page holds regulator priors and entity claim structure but
lacks holdings weights and a calibrated base rate.

**8.5 Validation.** Back-test P_enforce against realised actions; reconcile CapReaction against
event-study drops; check GW_VaR against internal ESG loss limits; sentiment lead-time test.

**8.6 Limitations & model risk.** Enforcement is rare → base-rate calibration is data-poor; market
reaction is heterogeneous; sentiment feeds are noisy. Conservative fallback: report top-N issuer
expected fines and gap scores (as the page does) rather than a portfolio VaR when weights/base rates
are missing.

**Framework alignment:** ESMA Greenwashing Progress Report (2023) — risk taxonomy; FCA SDR / Anti-
Greenwashing Rule (PS23/16) — enforcement basis; SEC ESG enforcement — US precedent; SFDR — the
sustainable-investment claims under scrutiny; operational-risk LDA — the frequency-severity structure
the §8 VaR adopts.

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-weighted greenwashing VaR with calibrated enforcement base rates (analytics ladder: rung 1 → 3)

**What.** §7 flags that the guide's `GW_VaR = Σ_i (w_i × P_enforcement_i × FinancialImpact_i)` cannot be computed as built — all 150 entities are `sr()`-seeded (green-revenue claimed/actual, enforcement probability, fines, controversies), there are no portfolio weights (the page sums raw figures rather than weighting), only the 5 regulators' names/jurisdictions/fine ranges are real, and the backend `greenwashing_engine.py` is not called (§8 marked "not yet implemented"). Evolution A builds the real VaR: portfolio holdings with weights, per-holding enforcement probability calibrated from actual enforcement base rates (regulator activity by jurisdiction/sector), and financial impact (fine + reputational loss, the cited 3–8% market-cap hit from precedents) — producing a genuine probability-weighted expected loss.

**How.** (1) Portfolio holdings with weights from `portfolios_pg`. (2) Enforcement probability per holding from the claim-vs-reality gap (via the shared greenwashing engine) scaled by calibrated jurisdiction/sector base rates from the real regulator table. (3) Financial impact from precedent-based fine ranges plus a reputational market-cap component. (4) `GW_VaR = Σ w_i·P_i·Impact_i` per §5, replacing the raw sum.

**Prerequisites.** Portfolio weights (shared portfolio store); enforcement base rates calibrated from regulator precedents; the shared engine wired; the 150 seeded entities replaced. **Acceptance:** GW_VaR computes as a weight × probability × impact sum reproducing §5; enforcement probabilities are calibrated to real base rates, not seeded; no `sr()` entity drives the VaR.

### 9.2 Evolution B — Greenwashing-exposure copilot (LLM tier 2)

**What.** A copilot for portfolio risk teams: "what's our portfolio greenwashing VaR, which holdings drive it, and how would divesting the top-3 change it?" tool-calls the Evolution A VaR endpoint, decomposes the expected loss by holding, and runs divestment what-ifs.

**How.** Tier-2 tool-calling over the GW-VaR endpoint (with holding overrides for what-ifs); the grounding corpus is §5/§7 (the portfolio-VaR formula, enforcement-precedent impact ranges, the real regulator table). The copilot's value is portfolio-level enforcement-risk quantification and mitigation. Guardrail, pre-Evolution-A: entities are synthetic and there are no portfolio weights, so it must refuse VaR figures and answer only on the real regulator/fine-range facts. Every VaR and contribution figure validated against tool output.

**Prerequisites.** Evolution A (no weighted VaR today); portfolio weights; calibrated base rates; corpus embedding. **Acceptance:** post-Evolution-A, every VaR and holding-contribution figure traces to a tool call reproducing the §5 sum; the divestment what-if recomputes the VaR; pre-Evolution-A the copilot declines VaR claims and cites only the real regulator data.