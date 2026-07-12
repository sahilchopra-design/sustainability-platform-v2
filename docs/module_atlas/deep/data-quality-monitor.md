## 7 · Methodology Deep Dive

The guide matches the code well: a **DQ composite score** `DQS = w₁·Completeness + w₂·Accuracy +
w₃·Consistency + w₄·Timeliness` over ESG data. The code goes further with 6 weighted dimensions and —
crucially — computes **completeness and accuracy from real company records** (`GLOBAL_COMPANY_MASTER`)
via genuine field-presence and rule-violation checks. Only timeliness/uniqueness are static and
consistency is partly seeded. This is a real DQ engine, not a mock. Minor deviation: the guide states
weights 0.30/0.30/0.25/0.15; the code uses 0.25/0.20/0.20/0.15/0.10/0.10 across 6 dimensions.

### 7.1 What the module computes

`computeCompanyDQ(company)` — per real company:
```js
present      = DQ_FIELDS.filter(f => company[f] not null and ≠ 0).length      // real
completeness = present / DQ_FIELDS.length · 100                               // real
violations   = QUALITY_RULES.filter(r => !r.check(company[r.field]))          // real rule engine
accuracy     = violations==0 ? 100 : max(0, 100 − violations·15)              // real
validity     = violations==0 ? 100 : max(50, 100 − violations·10)             // real
timeliness   = 85                                                            // static
uniqueness   = 98                                                            // static
consistency  = 80 + (exchange==='NSE/BSE' ? 10 : sr()·10)                     // part-seeded
composite    = 0.25·comp + 0.20·acc + 0.20·time + 0.15·cons + 0.10·uniq + 0.10·valid
```

### 7.2 Parameterisation / scoring rubric

| Dimension | Weight | How computed | Provenance |
|---|---|---|---|
| Completeness | 0.25 | non-null non-zero fields / 10 | **real** (from company record) |
| Accuracy | 0.20 | `100 − 15·violations` | **real** (rule engine) |
| Timeliness | 0.20 | fixed 85 | static assumption |
| Consistency | 0.15 | `80 + 10` (India) or `80 + sr·10` | part-seeded |
| Uniqueness | 0.10 | fixed 98 | static assumption |
| Validity | 0.10 | `100 − 10·violations` | **real** (rule engine) |
| Quality rules | — | 9 rules: revenue>0, esg 0-100, scope≥0, targetYear 2020-2100… | **real** validation logic |
| PCAF tier | — | derived per company | maps to PCAF DQ scale 1–5 |

### 7.3 Calculation walkthrough

Portfolio companies loaded from `localStorage`/`GLOBAL_COMPANY_MASTER` → `computeCompanyDQ` per company
→ platform averages (`avgComposite`, `avgCompleteness`, `avgAccuracy`), critical/high violation counts,
histogram, dimension radar, per-field completeness, worst-20 table, and a per-exchange gap plan that
recommends a data source (e.g. NSE/BSE → Supabase BRSR; scope gaps → EODHD + manual). Trend series is a
seeded 12-month ramp.

### 7.4 Worked example (one company)

Company with 7 of 10 `DQ_FIELDS` populated, 1 rule violation (esg_score = 105, out of 0–100):
```
completeness = 7/10·100 = 70
accuracy     = 100 − 1·15 = 85
validity     = 100 − 1·10 = 90
timeliness   = 85 ; uniqueness = 98 ; consistency = 80 + sr·10 ≈ 85
composite    = 0.25·70 + 0.20·85 + 0.20·85 + 0.15·85 + 0.10·98 + 0.10·90
             = 17.5 + 17.0 + 17.0 + 12.75 + 9.8 + 9.0 = 83.05 → 83
```
Completeness, accuracy and validity are genuinely derived from the company's real fields and the rule
engine; only timeliness/uniqueness are assumed and consistency lightly seeded.

### 7.5 Data provenance & limitations

- **Completeness, accuracy, validity are computed from real company data** and a real 9-rule engine —
  the module's core is genuine.
- **Timeliness (85) and uniqueness (98) are static**; consistency is `80 + seeded/India-bonus`; the
  trend series is a seeded ramp.
- No cross-source consistency check actually compares providers (consistency is a placeholder despite
  the guide describing MSCI-vs-Sustainalytics divergence).

**Framework alignment:** PCAF Data Quality Score 1–5 (per-company tier) · ISO 8000 data-quality
dimensions · GRI 2-4 · DAMA DMBOK dimensions. The completeness/accuracy/validity computation is a
faithful rule-based DQ implementation; timeliness/uniqueness/consistency need real telemetry.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Timeliness, uniqueness and cross-source
consistency are static/seeded placeholders.

**8.1 Purpose & scope.** Continuous, provider-aware DQ scoring across completeness, accuracy,
timeliness, consistency, uniqueness and validity for every ESG data feed, with staleness alerting.

**8.2 Conceptual approach.** A **rule-based multi-dimensional DQ score** with real timestamp and
cross-provider telemetry — the DAMA DMBOK / ISO 8000 model as operationalised in Great Expectations /
Soda-style data-quality frameworks; PCAF tiering for GHG fields.

**8.3 Mathematical specification.**
```
Completeness = populated_required / required                        (real, exists)
Accuracy     = 1 − failed_range_checks / total_checks               (real, exists)
Timeliness   = clamp(0,1, 1 − age / SLA_max(field_type))            # from last_updated timestamp
Consistency  = 1 − mean_field |value_A − value_B| / tolerance       # cross-provider
Uniqueness   = 1 − duplicate_records / total                        # entity-resolution
DQS = Σ_d w_d·dim_d ;  PCAF_tier = f(measured vs proxy provenance)
```

| Parameter | Source |
|---|---|
| `last_updated` timestamps | ingestion metadata |
| Cross-provider values | multi-source hub (MSCI vs Sustainalytics) |
| Duplicate detection | LEI/ISIN entity resolution |
| SLA_max per field type | governance policy |

**8.4 Data requirements.** Per-field timestamps, provider-tagged values, entity IDs, rule library
(exists). Sources: ingestion layer, data-hub. Completeness/accuracy already real.

**8.5 Validation & benchmarking.** Backtest staleness alerts against known refresh gaps; verify
consistency against known provider divergences; benchmark composite against PCAF tier distribution.

**8.6 Limitations & model risk.** Static timeliness/uniqueness mask real degradation; single tolerance
for consistency is crude. Fallback: surface raw last-updated ages and provider deltas alongside scores.
