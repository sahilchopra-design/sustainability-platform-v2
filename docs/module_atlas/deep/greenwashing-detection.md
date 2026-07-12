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
