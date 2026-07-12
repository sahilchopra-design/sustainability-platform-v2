## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/tcfd_metrics_engine.py` (E13) scores an entity's disclosure against the full **TCFD framework: 4 pillars, 11 recommendations** (G1/G2, S1/S2/S3, RM1/RM2/RM3, MT1/MT2/MT3). The caller submits, per recommendation, `{disclosed: bool, disclosure_quality, elements_covered: [...]}`; the engine computes:

```
completeness_pct(rec) = |valid elements covered| / |defined disclosure elements| × 100
pillar_score          = Σ weight_r × completeness_r / Σ weight_r        (weight_r = 1.5 if blocking else 1.0)
overall_score         = 0.20·Gov + 0.30·Strategy + 0.25·RiskMgmt + 0.25·Metrics&Targets
maturity(level 1–5)   = highest level whose score_range floor ≤ overall_score
```

Endpoints: `POST /assess` (full 11-rec), `POST /assess/pillar` (single pillar), `POST /assess/batch`, and five `ref/*` endpoints returning the reference dictionaries (pillars, recommendations, sector supplements, maturity levels, cross-framework map).

### 7.2 Parameterisation

**Disclosure elements per recommendation** (`TCFD_RECOMMENDATIONS`): each rec defines 3–5 named elements — e.g. MT2 requires Scope 1 tCO₂e, Scope 2 market-based, Scope 3 material categories, and intensity metrics; MT3 requires absolute vs intensity targets, base year, target year, progress, SBT alignment. Only elements that exactly match the defined list count toward completeness (`valid_covered` filter).

**Blocking classification:** 9 of 11 recommendations are `blocking: true`; only **S3 (Scenario Resilience)** and **RM3 (ERM integration)** are non-blocking. This is an engine design choice (the TCFD itself does not rank recommendations); blocking recs get **1.5× weight** in pillar scores and any blocking rec below 80% completeness is emitted as a `blocking_gap` and feeds the top-3 `priority_actions` (sorted by lowest completeness).

**Pillar weights** (`_PILLAR_WEIGHTS`, engine-authored): Governance 0.20, Strategy 0.30, Risk Management 0.25, Metrics & Targets 0.25.

**Maturity ladder** (`TCFD_MATURITY_LEVELS`):

| Level | Name | Score range |
|---|---|---|
| 1 | Initial | 0–30 |
| 2 | Emerging | 30–55 |
| 3 | Defined | 55–75 |
| 4 | Advanced | 75–90 |
| 5 | Leading | 90–100 |

**Sector supplements** (`SECTOR_SUPPLEMENTS`): descriptive metric lists for 5 sectors from the TCFD 2021 Annex / 2020 financial-sector guidance (e.g. financial_institutions → financed emissions Scope 3 Cat 15, portfolio temperature alignment, climate VaR; buildings → kWh/m², EPC distribution, CRREM alignment). These are attached to the result verbatim, **not scored**.

### 7.3 Calculation walkthrough

1. **Consistency guards** in `_build_rec_assessment`: if `disclosed=false`, completeness is forced to 0 and all elements marked missing regardless of input; if disclosed but quality omitted, quality auto-labels from completeness (≥80% full, ≥30% partial).
2. **Pillar rollup** (`_build_pillar_result`): counts fully (≥80%), partially (30–80%), and not (<30%) disclosed recs; computes the blocking-weighted mean.
3. **Overall + maturity**: weighted pillar sum → `_resolve_maturity` scans levels 5→1 and returns the first whose floor is ≤ score.

### 7.4 Worked example

Entity disclosing: G1 full (3/3 elements), G2 partial (1/3), S1 full (4/4), S2 half (2/4), S3 not disclosed, RM1 full (3/3), RM2 2/3, RM3 not disclosed, MT1 2/4, MT2 full (4/4), MT3 3/5.

| Pillar | Per-rec completeness (weight) | Pillar score |
|---|---|---|
| Governance | G1 100 (1.5), G2 33.3 (1.5) | (150+50)/3 = **66.67** |
| Strategy | S1 100 (1.5), S2 50 (1.5), S3 0 (1.0) | (150+75+0)/4 = **56.25** |
| Risk Mgmt | RM1 100 (1.5), RM2 66.7 (1.5), RM3 0 (1.0) | (150+100)/4 = **62.5** |
| Metrics & Targets | MT1 50 (1.5), MT2 100 (1.5), MT3 60 (1.5) | (75+150+90)/4.5 = **70.0** |

Overall = 0.20×66.67 + 0.30×56.25 + 0.25×62.5 + 0.25×70.0 = 13.33 + 16.88 + 15.63 + 17.50 = **63.33** → maturity **Level 3 "Defined"** (55–75). Blocking gaps: G2 (33%), S2 (50%), RM2 (67%), MT1 (50%), MT3 (60%); priority actions list the three lowest — G2, then MT1/S2.

### 7.5 Data provenance & limitations

- **Fully deterministic, no PRNG, no seed data** — all numbers derive from caller-supplied element coverage. Scores measure *disclosure completeness*, not disclosure *quality* or truthfulness (a company disclosing all elements badly still scores 100).
- Blocking flags, 1.5× weight, pillar weights, and maturity band boundaries are engine calibration choices — the TCFD framework itself prescribes none of these numbers.
- Element checklists are condensed (3–5 items per rec) relative to the TCFD's full guidance text; sector-supplement metrics are informational only.
- Stateless; no persistence or year-over-year maturity tracking despite `disclosure_year` being captured.

### 7.6 Framework alignment

- **TCFD Final Recommendations (2017) + 2021 Annex** — the 4-pillar / 11-recommendation structure and per-rec disclosure elements are a direct transcription; sector supplements follow the 2021 Annex and the 2020 financial-sector guidance.
- **IFRS S2 (ISSB)** — cross-framework map notes S2 incorporates all 11 TCFD recommendations as its architectural foundation (which is factually how ISSB built S2).
- **CSRD ESRS E1** — mapped near 1:1 (S3 ↔ E1 scenario analysis); the map is descriptive metadata returned with each assessment, not a scored crosswalk.
- **CDP / GRI 305 / SEC Reg S-K Item 1500s** — descriptive mappings only (e.g. CDP C6 ↔ MT2 GHG; SEC 1502 ↔ S1/S2). Real CDP scoring uses its own leveled methodology (Disclosure→Awareness→Management→Leadership); this engine approximates the same idea with its 5-level maturity ladder over completeness percentages.
