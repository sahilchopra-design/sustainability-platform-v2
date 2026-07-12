## 7 · Methodology Deep Dive

The guide describes an *ESRS XBRL Taxonomy Tagging* engine with `Tag_coverage = Matched_datapoints /
Total_quantitative_datapoints × 100%` and a three-layer semantic matching process. The code implements
the **coverage arithmetic and a real cross-framework mapping table** (ESRS↔GRI↔ISSB↔EU Taxonomy↔BRSR
per indicator), and a real emissions-intensity calculation — but the tag *matching* itself is not a
semantic engine; `mapped/total` counts per ESRS standard are hard-coded, and `factCount` is a linear
proxy of how many manual fields the user filled. Partial mismatch: the mapping and coverage display are
genuine; the "auto-tagger" is illustrative.

### 7.1 What the module computes

```js
factCount   = round(1111 · (filledCount / 5))                 // iXBRL facts ∝ manual fields filled
totalGHG    = emissions.s1 + emissions.s2 + emissions.s3
intensity   = revenue>0 ? (totalGHG / (revenue/1e6)).toFixed(1) : '—'   // tCO2e per $M revenue
coverageBar = ESRS_STANDARDS.map(e => ({..., pct: e.mapped/e.total·100}))
```
The cross-framework comparison (`compareAll`) maps each of ~8 core indicators to its ESRS DR, GRI
disclosure, IFRS S2 paragraph, EU Taxonomy annex and BRSR principle — a genuine, correct
interoperability crosswalk.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| ESRS_STANDARDS mapped/total | ESRS 1 78/82, ESRS 2 112/116, E1 185/198, S1 132/148, … | hard-coded demo (plausible tag counts) |
| BASE_COVERAGE | ESRS 89 / GRI 74 / ISSB 68 / EU_TAX 61 / BRSR 55 | hard-coded demo |
| MULTI_FW crosswalk | GHG S1 → ESRS E1-6 / GRI 305-1 / IFRS S2-22a / Annex I / P6 C1 | **real** — standards interoperability |
| Fact count | `round(1111·(filled/5))` | proxy (1111 = full-report fact target) |
| Intensity | `totalGHG / (revenue/1e6)` tCO₂e/$M | **real** — standard GHG intensity |
| MANUAL_FIELDS | company/year/framework + S1/S2/S3/energy/water/revenue | curated input schema |

The interoperability crosswalk is the module's real asset — the tag-count numbers are illustrative
targets, not the output of a matching algorithm.

### 7.3 Calculation walkthrough

User fills MANUAL_FIELDS (or pulls linked CINs from `TestDataContext`) → `filledCount` drives
`factCount` (a linear proxy) and `totalGHG`/`intensity` (real arithmetic on entered scopes). The
coverage bar renders `mapped/total` per ESRS standard from static counts. The multi-framework tab shows
the crosswalk; `compareAll` computes per-framework coverage from `BASE_COVERAGE`. A `POST` can generate
the iXBRL output server-side.

### 7.4 Worked example (intensity + fact count)

User enters S1 = 20,000, S2 = 15,000, S3 = 200,000 tCO₂e, revenue = $5,000M, and fills 4 of 5 fields:
```
totalGHG  = 20000 + 15000 + 200000 = 235,000 tCO2e
intensity = 235000 / (5000e6/1e6) = 235000/5000 = 47.0 tCO2e/$M revenue
factCount = round(1111·(4/5)) = round(888.8) = 889 iXBRL facts
```
The GHG intensity is a correct, standard metric; `factCount` is a plausible-looking proxy, not an
actual count of generated XBRL facts.

### 7.5 Data provenance & limitations

- **Cross-framework crosswalk (ESRS/GRI/ISSB/EU Taxonomy/BRSR) is real and correct** — genuinely useful.
- **Tag counts (`mapped/total`, `BASE_COVERAGE`) are hard-coded demo values**; `factCount` is a linear
  proxy, not a tagging-engine output.
- No actual semantic matching, schema validation, or iXBRL generation happens client-side; those are
  described but delegated to a backend generate call.

**Framework alignment:** EFRAG ESRS XBRL Taxonomy 2023 (tagging target) · ESEF Reg (EU) 2019/815 (iXBRL
format) · ESAP Reg (EU) 2023/2859 (submission portal) · cross-mapped to GRI, IFRS S2 (ISSB), EU
Taxonomy annexes, and India BRSR. The interoperability layer is faithful; the auto-tagger and coverage
counts are illustrative.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Tag matching and fact counting are proxies; no
real taxonomy-matching or iXBRL validation engine exists client-side.

**8.1 Purpose & scope.** Auto-tag CSRD narrative + quantitative disclosures to the ESRS XBRL taxonomy,
validate against the EFRAG schema, and emit an ESAP-ready iXBRL file with a measured coverage score.

**8.2 Conceptual approach.** A **three-layer matcher** (exact datapoint-ID → embedding-based semantic
similarity → extension taxonomy) plus **XBRL schema validation**, the approach used by Workiva and
Parseport iXBRL tools. Coverage is measured, not assumed.

**8.3 Mathematical specification.**
```
Match(dp) = { exact if dp_id ∈ taxonomy;
              semantic if cos(embed(dp_text), embed(element)) > τ;
              extension otherwise }
TagCoverage = |{dp : Match(dp) ∈ {exact, semantic}}| / |quantitative dp|
ValidationErrors = schema-conformance failures (period/unit/context/mandatory-metadata)
FactCount = |tagged facts emitted|                                   # actual count, not proxy
```

| Parameter | Source |
|---|---|
| ESRS taxonomy elements | EFRAG ESRS XBRL Taxonomy 2023 |
| Embeddings / τ | sentence-transformer + tuned threshold |
| Schema rules | ESEF Reg / XBRL Inline 1.1 |
| Crosswalk (real) | module's MULTI_FW table |

**8.4 Data requirements.** ESRS taxonomy schema; disclosure text + quantitative datapoints with units/
periods; extension-taxonomy registry. Sources: EFRAG taxonomy, csrd-esrs modules for datapoints. The
crosswalk and input schema already exist.

**8.5 Validation & benchmarking.** Validate emitted iXBRL against the EFRAG/ESAP validator (target 0
schema errors); benchmark tag coverage vs commercial taggers on a shared report; spot-check semantic
matches against analyst tagging.

**8.6 Limitations & model risk.** Semantic matching mis-tags narrative disclosures; extension taxonomy
needs governance to avoid non-comparability. Fallback: route sub-threshold matches to mandatory human
review (the guide's "Manual Review" tab) before emission.
