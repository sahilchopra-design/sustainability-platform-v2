# Greenwashing Detection
**Module ID:** `greenwashing-detection` · **Route:** `/greenwashing-detection` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
NLP-powered greenwashing detection scanning sustainability claims against actual performance data. Covers marketing materials, annual reports, and ESG claims with substantiation scoring.

> **Business value:** Greenwashing regulatory risk is escalating globally — EU Green Claims Directive, FCA SDR, ESMA supervisory priorities, ASIC enforcement. This module provides systematic pre-publication claim review to prevent regulatory action, litigation, and reputational damage.

**How an analyst works this module:**
- Claim Scanner uploads marketing materials for NLP analysis
- Claim Database shows all detected claims with type classification
- Evidence Matcher links claims to performance data
- Risk Heatmap shows greenwashing risk by document and topic
- Remediation Guide recommends claim modification or deletion

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `CHECKLIST_ITEMS`, `COMPANIES`, `COMPANIES_RAW`, `ENFORCEMENT_ACTIONS`, `EVIDENCE_MAP`, `GW_API`, `REGULATIONS`, `REMEDIATION_ACTIONS`, `SECTORS`, `SIGNALS`, `SIGNAL_CLAIM_TYPE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SIGNALS` | 8 | `label`, `short`, `reg`, `threshold` |
| `COMPANIES_RAW` | 16 | `name`, `ticker`, `sector`, `esgRating` |
| `REGULATIONS` | 8 | `short`, `year`, `signals`, `article` |
| `ENFORCEMENT_ACTIONS` | 7 | `jurisdiction`, `year`, `action`, `fine`, `severity` |
| `REMEDIATION_ACTIONS` | 6 | `priority`, `problem`, `deadline`, `improvement`, `example` |
| `CHECKLIST_ITEMS` | 21 | `signals` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GW_API` | ``${API}/api/v1/greenwashing`;` |
| `seed` | `raw.id * 100;` |
| `composite` | `Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 7);` |
| `prevComposite` | `Math.round(composite + (sr(seed + 8) - 0.5) * 20);` |
| `COMPANIES` | `COMPANIES_RAW.map(buildCompanyData);` |
| `company` | `useMemo(() => COMPANIES[selectedCompany], [selectedCompany]);  // --- Live backend wiring (Greenwashing Risk & Substantiation engine) ------- // Full entity assessment: POST /api/v1/greenwashing/assess, screening one // representative evidence snippet per signal as a "claim" through the real // EU Green Claims Directive / FCA SDR screenin` |
| `claims` | `SIGNALS.map(s => ({` |
| `taxonomyAlignmentPct` | `Math.max(0, Math.min(100, Math.round(company.esgRating - company.composite * 0.3)));` |
| `radarData` | `useMemo(() => SIGNALS.map(s => ({` |
| `topSignals` | `useMemo(() => { return [...SIGNALS].sort((a, b) => company[b.key] - company[a.key]).slice(0, 3);` |
| `rankedCompanies` | `useMemo(() => [...COMPANIES].sort((a, b) => b.composite - a.composite), []);` |
| `sectorBoxData` | `useMemo(() => SECTORS.map(sector => {` |
| `scores` | `cos.map(c => c.composite).sort((a, b) => a - b);` |
| `min` | `scores[0], max = scores[scores.length - 1];` |
| `mid` | `scores[Math.floor(scores.length / 2)];` |
| `signalOverlayData` | `useMemo(() => SIGNALS.map(s => {` |
| `checklistStatus` | `useMemo(() => { return CHECKLIST_ITEMS.map((item, i) => { const sigScore = item.signals.reduce((a, sig) => a + company[sig], 0) / item.signals.length;` |
| `claimText` | `EVIDENCE_MAP[expandedSignal][0].snippet.replace(/^"\|"$/g, '');` |
| `riskScore` | `Math.round(reg.signals.reduce((a, sig) => a + c[sig], 0) / reg.signals.length);` |

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
**Frontend seed datasets:** `CHECKLIST_ITEMS`, `COMPANIES_RAW`, `ENFORCEMENT_ACTIONS`, `REGULATIONS`, `REMEDIATION_ACTIONS`, `SECTORS`, `SIGNALS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Claim Types | — | NLP model | Ambiguous, absolute, certified, aspirational |
| Evidence Score | — | Data matching | How well actual performance supports claims |
| Flag Rate | — | Typical scan | Percentage of claims with insufficient substantiation |
- **Marketing documents** → NLP claim extraction → **Claim inventory**
- **ESG performance data** → Claim substantiation check → **Evidence gap score**
- **Greenwash risk scores** → Remediation prioritisation → **Claim correction actions**

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
**Methodology:** Claim-evidence gap analysis
**Headline formula:** `GreenwashScore = ClaimStrength - EvidenceScore; Flag if gap > threshold`

NLP classifies claims as: ambiguous (vague language), absolute (specific target), certified (third-party verified), aspirational (future intention). Substantiation requires verifiable data matching claim. Highest risk: absolute claims with low evidence score.

**Standards:** ['EU Green Claims Directive (draft)', 'ESMA Greenwashing Report (2023)', 'FCA SDR']
**Reference documents:** EU Green Claims Directive (Proposal); ESMA Greenwashing Report (2023); FCA Sustainability Disclosure Requirements; ASIC Greenwashing Guidance

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
| `greenwashing-detector` | engine:greenwashing_engine, table:dataclasses |
| `greenwashing-exposure-monitor` | engine:greenwashing_engine, table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note (no NLP).** The guide markets "NLP-powered greenwashing detection scanning
> claims against performance data" with a `GreenwashScore = ClaimStrength − EvidenceScore`. The page
> does **no NLP**: it is a 7-signal scorecard where each signal per company is a `sr()` PRNG draw, and
> the composite is their equal-weight average. The genuine claim-screening logic (term matching,
> substantiation scoring, SFDR/label verification) lives in the backend `greenwashing_engine.py`, but
> the React page never calls it — the trace shows `POST /greenwashing/assess` endpoints exist, yet the
> page renders only local seeded companies plus a static `EVIDENCE_MAP` of illustrative snippets.

### 7.1 What the page computes

For each of 15 companies (`buildCompanyData`), seven greenwashing signals are seeded and averaged:

```js
seed = raw.id × 100
scores = {
  vagueness:    round(20 + sr(seed+1)×70),   // 20–90
  selective:    round(15 + sr(seed+2)×75),   // 15–90
  unverifiable: round(10 + sr(seed+3)×80),   // 10–90
  mismatch:     round(5  + sr(seed+4)×85),   // 5–90
  framing:      round(15 + sr(seed+5)×70),
  regulatory:   round(10 + sr(seed+6)×65),
  weakening:    round(5  + sr(seed+7)×60),
}
composite = round( mean(all 7 scores) )                 // equal weight, ÷7
prevComposite = round( composite + (sr(seed+8)−0.5)×20 ) // ±10 jitter for "trend"
tier = composite≥70 Critical | ≥55 High | ≥35 Medium | else Low
```

Per-signal regulatory flags fire when `score > SIGNALS[k].threshold` (thresholds 35–60).

### 7.2 Parameterisation / signal rubric

| Signal | Threshold | Regulatory anchor |
|---|---|---|
| Vagueness Index | 55 | EU Green Claims Dir. Art 3(1) |
| Selective Disclosure | 50 | ESMA ESG §4.2.1 |
| Unverifiable Claims | 60 | FCA SDR COBS 4.13.2 |
| Claim-Data Mismatch | 45 | EU Green Claims Dir. Art 5 |
| Positive Framing Diversion | 50 | ASA Green Claims Code §2.4 |
| Regulatory Breach Risk | 40 | ESMA ESG §5.1 / FCA SDR |
| Target Weakening Signal | 35 | ESMA ESG §4.3 / SBTi |

The 7 thresholds are the only externally-anchored numbers; every company score is synthetic. Static
reference sets: `EVIDENCE_MAP` (illustrative claim snippets per signal), `REGULATIONS` (7 regimes),
`ENFORCEMENT_ACTIONS` (7 real-flavoured cases: Deutsche Finance €4.2M, NordicOil £1.8M).

### 7.3 Calculation walkthrough

The 15 raw companies (name/ticker/sector/esgRating) pass through `buildCompanyData` → seven seeded
signals → composite → tier. The radar view plots one company's 7 signals; the checklist maps
21 `CHECKLIST_ITEMS` to averages of their constituent signals; the regulatory heatmap scores each
`REGULATION` as the mean of its mapped signals for a company. Sector box-plots take min/median/max
composite per sector.

### 7.4 Worked example (company id = 1, GreenFuture Energy)

`seed = 100`. Suppose the PRNG yields vagueness 60, selective 40, unverifiable 72, mismatch 25,
framing 55, regulatory 48, weakening 30:

| Step | Computation | Result |
|---|---|---|
| composite | (60+40+72+25+55+48+30)/7 | 47.1 → **47** |
| tier | 47 in [35,55) | **Medium** |
| flagged signals | unverifiable 72>60, framing 55>50, regulatory 48>40, vagueness 60>55 | 4 breaches |
| prevComposite | 47 + (sr(108)−0.5)×20 | 47 ± up to 10 |

The composite masks the two hot signals (unverifiable 72, framing 55) — the per-signal threshold
flags are the actionable output, not the average.

### 7.5 Backend engine (latent, not wired to this page)

`greenwashing_engine.py` implements real claim screening: `screen_claim` matches text against 40
`MISLEADING_TERMS` (each with a risk level low→very_high and a substantiation requirement), computes
`substantiation_score = max(0, 1 − issues×0.12 − missing_reqs×0.08)`, and tests it against a
per-claim-type minimum (quantitative 0.75, label 0.85, comparative 0.80). `verify_labels` checks SFDR
Art 8/9 consistency and taxonomy alignment. `assess` rolls up an overall risk from `avg_claim_risk×0.5
+ (1−EU_score/100)×0.3 + (1−FCA_score/100)×0.2`. This is the substantive model the page *should* call.

### 7.6 Data provenance & limitations

- **Every company signal is synthetic** (`sr()` PRNG); no document is parsed, no performance data is
  matched. The `EVIDENCE_MAP` snippets are hand-written examples, not extracted from filings.
- Composite is an unweighted mean of 7 equally-weighted signals — a company can breach 3 thresholds and
  still score "Medium" because low signals dilute the average (see §7.4).
- The real NLP/screening engine exists in Python but is not invoked by this page.

### 8 · Model Specification

**Status: specification — not yet implemented in this page** (the backend engine is a rule-based
screener; a production greenwashing detector needs the NLP claim-extraction layer the guide describes).

**8.1 Purpose & scope.** Pre-publication screening of sustainability disclosures and marketing to flag
unsubstantiated, vague, selective or contradictory green claims against actual performance data.

**8.2 Conceptual approach.** Two-stage: (1) NLP claim extraction + classification (ambiguous / absolute
/ certified / aspirational), mirroring ESMA's greenwashing taxonomy and RepRisk/Sustainalytics
controversy pipelines; (2) evidence matching that scores each claim's substantiation against the
company's own reported metrics — the claim-evidence gap the guide names.

**8.3 Mathematical specification.**
```
Per claim c:  ClaimStrength_c ∈ [0,1] (absolute > comparative > qualitative > aspirational)
              EvidenceScore_c = w_data·has_data + w_method·has_method + w_verify·third_party
              GreenwashGap_c = max(0, ClaimStrength_c − EvidenceScore_c)
Vagueness index = share of sustainability sentences with no measurable target
Selectivity = 1 − (disclosed_negative_metrics / expected_negative_metrics)
Company GWS = 100 × ( w_gap·mean(GreenwashGap) + w_vague·Vague + w_sel·Selectivity + w_reg·RegGap )
Flag if GWS > 65 (enhanced DD); referral risk if > 80
```

| Parameter | Source |
|---|---|
| Misleading-term list + risk levels | `MISLEADING_TERMS` (EU GCD / ESMA / FCA anchored) |
| Substantiation weights | claim-type minimums (0.60–0.85) from engine |
| Evidence metrics | company GHG/water/waste actuals (CDP, filings) |
| Referral thresholds | FCA/ESMA enforcement precedent |

**8.4 Data requirements.** Disclosure text (PDF/HTML), reported ESG metrics per issuer, SFDR
classification, product labels. Engine reference data (terms, claim types, EU/FCA requirements,
label rules) already exists; the missing piece is the NLP extraction and the metric feed.

**8.5 Validation.** Back-test flags against realised enforcement actions (the `ENFORCEMENT_ACTIONS`
set); precision/recall of the term/claim classifier vs analyst-labelled claims; reconcile GWS ordering
against RepRisk controversy scores.

**8.6 Limitations & model risk.** NLP false positives on boilerplate; evidence matching depends on
metric availability; term lists date quickly as regulation evolves. Conservative fallback: surface the
matched terms and missing substantiation elements (as the engine does) rather than a single opaque score.

**Framework alignment:** EU Green Claims Directive (COM/2023/166) — pre-contractual substantiation and
lifecycle coverage; ESMA Greenwashing Report (2023) / Naming Guidelines — the signal taxonomy; FCA
Anti-Greenwashing Rule + SDR (PS23/16) — clarity/fairness and labelling; ISO 14064-1 / SBTi — the
verification standards the term-substantiation table cites for carbon-neutral / net-zero claims.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the engine and add the NLP claim-extraction layer (analytics ladder: rung 1 → 3)

**What.** §7 documents that the page renders 15 `sr()`-seeded companies (seven greenwashing signals seeded and averaged, unweighted) plus a static hand-written `EVIDENCE_MAP`, while the real backend `greenwashing_engine.py` does rule-based term-screening but is not called by this page, and the guide's NLP claim classification (ambiguous/absolute/certified/aspirational, with substantiation against verifiable data) is unimplemented (§8 marked "not yet implemented in this page"). The headline `GreenwashScore = ClaimStrength − EvidenceScore` needs both a claim-strength classifier and an evidence-matching layer. Evolution A wires the page to the rule-based engine, then adds the NLP claim-extraction layer: classify each claim by strength/type and match it against the company's actual performance data, computing the claim-evidence gap per §5.

**How.** (1) Call `greenwashing_engine.py`'s term-screening for the base signal instead of rendering seeded companies. (2) Add an NLP claim classifier (claim type + strength) over real disclosure text, using the platform's LLM tier per the roadmap. (3) Evidence matching against performance data (emissions trajectory, target progress) so the gap is `ClaimStrength − EvidenceScore` on real inputs; weight the seven signals rather than averaging equally.

**Prerequisites.** Real disclosure documents to parse and performance data to match; the seeded companies and hand-written `EVIDENCE_MAP` replaced; the engine wired. **Acceptance:** the greenwash score derives from classified claims matched against real evidence reproducing §5; the engine is called (not seeded companies); signals are weighted, so a company breaching several thresholds scores appropriately.

### 9.2 Evolution B — Greenwashing-screening copilot (LLM tier 2)

**What.** A copilot for ESG-integrity analysts: "screen this company's sustainability report for unsubstantiated claims and flag the highest-risk absolute claims with weak evidence" tool-calls the Evolution A claim-classification and evidence-matching endpoints, narrating the claim-evidence gaps with the specific flagged passages.

**How.** This is a natural LLM-native module: tier-2 tool-calling over the claim-extraction and engine endpoints, where the LLM's classification of claim strength/type is itself the analytical layer (grounded by the rule-based engine and evidence matching, never free-form judgement presented as fact). The grounding corpus is §5/§7 (claim taxonomy, substantiation logic). Guardrail, pre-Evolution-A: companies and evidence are synthetic, so it must refuse company-specific greenwashing claims. Every flag validated against the engine and the source document passage.

**Prerequisites.** Evolution A (the NLP layer and engine wiring); document access; corpus embedding. **Acceptance:** post-Evolution-A, every flagged claim cites the source passage and its evidence gap from a tool call; pre-Evolution-A the copilot declines company-specific screening; claims about named companies always trace to parsed text, never seeded signals.