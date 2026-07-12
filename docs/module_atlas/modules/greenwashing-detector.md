# Greenwashing Detector
**Module ID:** `greenwashing-detector` · **Route:** `/greenwashing-detector` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Uses NLP and machine learning to detect greenwashing patterns in sustainability disclosures, corporate reports, and marketing materials by comparing qualitative claims against quantitative evidence, forward guidance against historical performance, and disclosure specificity against regulatory standards.

> **Business value:** Enables compliance teams, ESG analysts, and regulators to systematically screen sustainability disclosures for greenwashing indicators, prioritise enhanced due diligence on high-risk issuers, and prepare evidence packages for regulatory engagement under the FCA SDR and EU Green Claims Directive.

**How an analyst works this module:**
- Upload the sustainability disclosure or marketing material for analysis and select the applicable regulatory jurisdiction.
- Review the claim extraction tab to see each sustainability claim identified by the NLP model and its evidence match status.
- Analyse the greenwashing risk score decomposition to identify which components (vagueness, selectivity, evidence gap) drive the overall risk.
- Export the detailed finding report with regulatory reference for legal and compliance review.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE`, `Badge`, `Btn`, `COMPANIES`, `COUNTRIES`, `Card`, `DISC_DIMS`, `DISC_DIM_SOURCES`, `FLAG_DESC`, `FLAG_REMEDIATION`, `FLAG_SEVERITY`, `FLAG_TYPES`, `REG_REQS`, `SBTI`, `SECTORS`, `Select`, `TIERS`, `TIER_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REG_REQS` | 19 | `phase`, `name`, `desc`, `deadline` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(s * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(s * 13) * COUNTRIES.length)];` |
| `selfScore` | `45 + Math.floor(sr(s * 3) * 50);` |
| `thirdParty` | `Math.max(15, selfScore - Math.floor(sr(s * 11) * 35) + 5);` |
| `gap` | `selfScore - thirdParty;` |
| `discQuality` | `30 + Math.floor(sr(s * 17) * 65);` |
| `integrity` | `Math.max(10, Math.min(99, Math.floor(` |
| `greenRev` | `Math.floor(sr(s * 19) * 80);` |
| `carbonInt` | `50 + Math.floor(sr(s * 23) * 450);` |
| `sbti` | `SBTI[Math.floor(sr(s * 29) * 3)];` |
| `assurance` | `ASSURANCE[Math.floor(sr(s * 31) * 3)];` |
| `eScore` | `20 + Math.floor(sr(s * 37) * 75);` |
| `sScore` | `20 + Math.floor(sr(s * 41) * 75);` |
| `gScore` | `20 + Math.floor(sr(s * 43) * 75);` |
| `flagCount` | `Math.floor(sr(s * 47) * 6);` |
| `discDims` | `DISC_DIMS.map((_, di) => 20 + Math.floor(sr(s * 59 + di * 11) * 75));` |
| `regStatus` | `REG_REQS.map((_, ri) => {` |
| `bestInClass` | `(dimIdx) => Math.max(...COMPANIES.map(c => c.discDims[dimIdx]));` |
| `stats` | `useMemo(() => { const avg = v => v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;` |
| `avgInt` | `avg(filtered.map(c => c.integrity));` |
| `avgGap` | `avg(filtered.map(c => Math.abs(c.gap)));` |
| `totalFlags` | `filtered.reduce((a, c) => a + c.flags.length, 0);` |
| `paged` | `filtered.slice(page * 20, (page + 1) * 20);` |
| `totalPages` | `Math.ceil(filtered.length / 20) \|\| 1;` |
| `diff` | `Math.ceil((new Date(d) - new Date('2026-03-28')) / (1000 * 60 * 60 * 24));` |
| `alpha` | `hasFlag ? Math.round(FLAG_SEVERITY[fi] * 25).toString(16).padStart(2, '0') : '08';` |
| `total` | `COMPANIES.length * reqs.length;` |
| `pct` | `total > 0 ? Math.round(compCount / total * 100) : 0;` |
| `nonComp` | `c.regStatus.reduce((a, s, i) => { if (s === 'Non-Compliant') a.push(REG_REQS[i].id); return a; }, []);` |
| `partial` | `c.regStatus.reduce((a, s, i) => { if (s === 'Partial') a.push(REG_REQS[i].id); return a; }, []);` |

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
**Frontend seed datasets:** `ASSURANCE`, `COUNTRIES`, `DISC_DIMS`, `DISC_DIM_SOURCES`, `FLAG_DESC`, `FLAG_REMEDIATION`, `FLAG_SEVERITY`, `FLAG_TYPES`, `REG_REQS`, `SBTI`, `SECTORS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenwashing Risk Score | — | NLP model output | Composite score; above 65 triggers enhanced due diligence; above 80 flags potential regulatory referral risk based on FCA/ESMA enforcement precedents. |
| Claim-Evidence Gap (%) | — | NLP claim extraction | Proportion of sustainability claims lacking supporting quantitative evidence in the same or prior-year disclosure; sector average is approximately 25%. |
| Vagueness Index | — | Text specificity analysis | Share of sustainability-related sentences containing only vague qualitative language (e.g. 'committed to', 'working towards') without measurable targets. |
| Regulatory Gap Score | — | ESMA/FCA requirements | Deviation of disclosure from minimum regulatory specificity requirements under FCA Sustainability Disclosure Requirements or ESMA greenwashing definition. |
- **Sustainability disclosures and reports (PDF/HTML)** → NLP claim extraction, evidence matching, vagueness scoring → **Per-claim greenwashing risk flags**
- **Regulatory minimum disclosure requirements (FCA/ESMA)** → Compare disclosure specificity against regulatory standard → **Regulatory gap score by requirement**
- **Historical performance data (ESG databases)** → Compare forward claims against historical metrics → **Claim-evidence gap quantification**

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
**Methodology:** Greenwashing Risk Score
**Headline formula:** `GWS = w_1 × ClaimEvidenceGap + w_2 × SelectivityIndex + w_3 × VaguenessScore + w_4 × RegulatoryGapScore`

Constructs a composite greenwashing risk score by weighting the claim-evidence gap (unsubstantiated quantitative assertions), selectivity index (cherry-picked metrics omitting negative performance), vagueness score (proportion of non-specific sustainability language), and gap to minimum regulatory disclosure standard.

**Standards:** ['EU Green Claims Directive (2024)', 'FCA Greenwashing Rule (2024)', 'ESMA Greenwashing Progress Report (2023)']
**Reference documents:** EU Green Claims Directive (2024); FCA Sustainability Disclosure Requirements and Investment Labels (2024); ESMA â€” Greenwashing Progress Report (2023); EU Commission â€” Study on Greenwashing (2021)

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
| `greenwashing-exposure-monitor` | engine:greenwashing_engine, table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note (no NLP/ML).** The guide advertises an NLP+ML greenwashing model with weighted
> composite `GWS = w₁·ClaimEvidenceGap + w₂·SelectivityIndex + w₃·VaguenessScore + w₄·RegulatoryGapScore`.
> The page implements **none** of that. It generates 30 synthetic companies via the `sr()` PRNG and
> derives an **Integrity** score (not the guide's GWS) from three seeded inputs: self-reported score,
> third-party score and disclosure quality. The backend `greenwashing_engine.py` (shared with the
> `greenwashing-detection` route) does real term-screening, but this page does not call it.

### 7.1 What the page computes

Company generation (`genCompanies`, 30 companies) seeds every field:

```js
selfScore  = 45 + floor(sr(s×3)×50)                      // 45–95 (self-reported)
thirdParty = max(15, selfScore − floor(sr(s×11)×35) + 5) // independent rating, usually ≤ self
gap        = selfScore − thirdParty                       // overstatement gap
discQuality= 30 + floor(sr(s×17)×65)                      // 30–95 disclosure quality
integrity  = clamp(10, 99, floor(
               thirdParty×0.4 + discQuality×0.3 + (100−|gap|)×0.3 ))
tier = integrity≥85 Platinum | ≥70 Gold | ≥55 Silver | ≥40 Bronze | else Flagged
```

The **integrity** score is the headline: it *rewards* a high independent rating and disclosure quality,
and *penalises* a large self-vs-third-party gap (via `100−|gap|`).

### 7.2 Parameterisation / rubric

| Component | Weight in integrity | Meaning |
|---|---|---|
| thirdParty | 0.40 | Independent ESG rating (anchor of credibility) |
| discQuality | 0.30 | Completeness of disclosure across 15 dimensions |
| 100 − \|gap\| | 0.30 | Penalty for self-reporting inflation |

12 `FLAG_TYPES` each carry a severity (`FLAG_SEVERITY = [9,7,6,8,7,8,6,5,6,7,9,8]`, 1–9) — highest for
"Score Gap >15pts" and "Transition Plan Absent" (9). 15 `DISC_DIMS` (GHG, Water, Biodiversity, Human
Rights, Transition Plan, Taxonomy Alignment…) each get a seeded 20–95 score with a real
`DISC_DIM_SOURCES` citation (CDP, TNFD LEAP, GHG Protocol, GRESB). `REG_REQS` (19 rows) get a seeded
Compliant / Partial / Non-Compliant status (`sr>0.6 / >0.3 / else`).

### 7.3 Calculation walkthrough

Each company also gets: green revenue % (`sr(s×19)×80`), carbon intensity (`50 + sr(s×23)×450`),
SBTi status, assurance level, E/S/G pillar scores (20–95), a flag set (0–5 unique flags drawn from
the 12 types), 15 disclosure-dimension scores and 19 regulatory statuses. Portfolio KPIs aggregate:
`avgInt`, `avgGap`, `totalFlags`, count below the 40 integrity threshold ("Flagged"). Sector box-plots
and the integrity-vs-disclosure scatter drive the visual analytics.

### 7.4 Worked example (one company)

Suppose `selfScore = 80`, `thirdParty = 62`, `discQuality = 70`:

| Step | Computation | Result |
|---|---|---|
| gap | 80 − 62 | 18 |
| integrity | 62×0.4 + 70×0.3 + (100−18)×0.3 | 24.8 + 21.0 + 24.6 = **70** |
| tier | 70 ≥ 70 | **Gold** |

A large 18-point self-vs-third-party gap costs `18×0.3 = 5.4` integrity points; had self and third
matched (gap 0) the score would be 70 + 5.4 ≈ 75. The gap penalty is the core greenwashing signal.

### 7.5 Data provenance & limitations

- **All 30 companies are synthetic** — names, ratings, disclosure scores, flags and regulatory statuses
  all come from `sr(seed)=frac(sin(seed+1)×10⁴)`. No document, rating feed or filing is used.
- The page computes **Integrity**, not the guide's four-component GWS; vagueness, selectivity and
  regulatory-gap indices named in the guide are not calculated (they survive only as flag labels).
- The real term-screening engine (`greenwashing_engine.py`, 40 misleading terms, substantiation
  scoring) is present in the backend but unused here.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Score issuer greenwashing risk by combining claim-evidence gap, selectivity,
vagueness and regulatory-gap components into the guide's GWS (0–100), for pre-DD screening.

**8.2 Conceptual approach.** NLP claim extraction + evidence matching (per ESMA greenwashing taxonomy)
combined with a self-vs-independent rating divergence signal, mirroring RepRisk controversy analytics
and MSCI ESG rating-gap methods. The divergence term the page already computes (`gap`) becomes one of
four weighted inputs.

**8.3 Mathematical specification.**
```
ClaimEvidenceGap = share of quantitative claims lacking matching reported data
SelectivityIndex = 1 − (negative_metrics_disclosed / expected_negative_metrics)
VaguenessScore   = share of sustainability sentences without a measurable target
RegulatoryGapScore = deviation from FCA SDR / ESMA minimum specificity
RatingDivergence = normalise(selfScore − thirdParty)              // the page's gap
GWS = 100 × (w₁·ClaimEvidenceGap + w₂·SelectivityIndex + w₃·VaguenessScore
              + w₄·RegulatoryGapScore + w₅·RatingDivergence),  Σwᵢ = 1
Flag if GWS > 65; referral risk if > 80
```

| Parameter | Value / source |
|---|---|
| Component weights w₁…₅ | calibrate to enforcement outcomes; start 0.3/0.2/0.2/0.15/0.15 |
| Misleading terms | engine `MISLEADING_TERMS` (40, EU GCD/ESMA/FCA) |
| Disclosure-dimension sources | CDP, TNFD LEAP, GHG Protocol (page `DISC_DIM_SOURCES`) |
| Referral thresholds | FCA/ESMA/SEC precedent |

**8.4 Data requirements.** Issuer disclosure text, reported ESG metrics, self-reported vs independent
ratings (MSCI/Sustainalytics), SFDR class, product labels. The page already holds the disclosure-
dimension taxonomy and flag/remediation library.

**8.5 Validation.** Precision/recall of GWS>65 flags vs realised enforcement; stability of component
weights across sectors; reconcile RatingDivergence against actual MSCI rating-gap data.

**8.6 Limitations & model risk.** NLP false positives; selectivity requires a defined "expected
negative metrics" set (sector-dependent); rating divergence conflates methodology differences with
greenwashing. Conservative fallback: surface component scores and matched terms, not a single number.

**Framework alignment:** EU Green Claims Directive (2024) — substantiation; FCA Greenwashing Rule
(2024) / SDR — clarity and labelling; ESMA Greenwashing Progress Report (2023) — the four-component
taxonomy; SBTi / EU Taxonomy — the verification anchors behind the flag-remediation guidance.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the four-component GWS via the shared engine (analytics ladder: rung 1 → 3)

**What.** §7 flags that the guide's composite `GWS = w1·ClaimEvidenceGap + w2·SelectivityIndex + w3·VaguenessScore + w4·RegulatoryGapScore` is not implemented — the page generates 30 `sr()`-seeded companies and derives an "Integrity" score (not GWS) from three seeded inputs (self-reported, third-party, disclosure quality), while the backend `greenwashing_engine.py` (shared with the `greenwashing-detection` route) does real term-screening but is not called (§8 marked "not yet implemented"). Evolution A builds the four-component GWS: claim-evidence gap from the engine's screening plus evidence matching, a selectivity index (cherry-picked metrics omitting negatives), a vagueness score (proportion of non-specific language), and a regulatory-gap score against minimum disclosure standards — weighted per §5, replacing the seeded Integrity heuristic.

**How.** (1) Call the shared `greenwashing_engine.py` for term-screening (vagueness, claim detection). (2) Compute the selectivity index from metric coverage (which negative KPIs are omitted) and the regulatory-gap score against a disclosure-requirement checklist. (3) Combine into the weighted GWS per §5, with the weights documented. Companies sourced from real filings, replacing the seeded panel.

**Prerequisites.** Real disclosure documents; the shared engine wired; the seeded 30-company panel replaced. This module should coordinate with the sibling `greenwashing-detection` (they share the engine) to avoid duplicated verticals. **Acceptance:** GWS computes as the four-component weighted composite reproducing §5; the engine is called for screening; vagueness/selectivity/regulatory-gap are real sub-scores, not seeded; Integrity is superseded by GWS.

### 9.2 Evolution B — Issuer greenwashing-risk copilot (LLM tier 2)

**What.** A copilot for ESG-integrity and credit analysts: "score this issuer's greenwashing risk, break down the four GWS components, and show which claims lack substantiation" tool-calls the Evolution A GWS endpoints and narrates the component decomposition with flagged claims.

**How.** Tier-2 tool-calling over the GWS and engine endpoints; the grounding corpus is §5/§7 (the four-component GWS, claim-evidence gap, selectivity, vagueness, regulatory gap). Like its sibling, the LLM's language classification is part of the analytical layer, grounded by the rule-based engine. Guardrail, pre-Evolution-A: companies and scores are synthetic and the page computes Integrity not GWS, so it must refuse issuer-specific greenwashing claims and disclose the mismatch. Every component score validated against tool output.

**Prerequisites.** Evolution A (GWS unbuilt today); document access; corpus embedding; coordination with `greenwashing-detection`. **Acceptance:** post-Evolution-A, every GWS component traces to a tool call and flagged claims cite source passages; pre-Evolution-A the copilot declines issuer-specific scoring and notes the page computes Integrity, not GWS.