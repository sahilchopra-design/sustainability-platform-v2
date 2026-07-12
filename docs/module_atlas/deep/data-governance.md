## 7 · Methodology Deep Dive

The guide describes an *ESG Data Quality Score* `DQ = 0.30·Completeness + 0.25·Accuracy +
0.25·Timeliness + 0.20·Consistency`. The page is actually broader and mostly **operational governance
tracking**, not a DQ engine: it manages 16 governance policies, a 6-model MRM validation register, a
data-owner/steward matrix, vendor scorecards, and a data-classification register. The genuinely
*computed* logic is **date-based policy-compliance and model-validation scheduling** (real
`nextDue`-vs-`today` arithmetic); the DQ-vs-target and vendor numbers are static/seeded. Partial
mismatch: the guide's DQ formula is peripheral to what the module does.

### 7.1 What the module computes

```js
cycleMonths = review_cycle==='Quarterly'?3 : 'Semi-Annual'?6 : 12
nextDue     = last_reviewed + cycleMonths
isCompliant = override ?? (nextDue >= today)                         // real date logic
modelValidationsDue = QUANT_MODELS.filter(m => nextDue(m) <= today+90d).length
auditFindings = Σ QUANT_MODELS.findings
maturityAvg   = Σ maturity.score / maturity.length                  // 0–5 DMM radar
actual        = quality_target − floor(sRand(seed(domain))·8)        // seeded DQ actual
```
Policy compliance and model-validation due-dates are computed from real dates; the data-owner quality
"actual" is `target − seeded gap`.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Governance policies | 16 (category, owner, enforcement, review cycle) | curated realistic register |
| Review cycles → months | Quarterly 3 / Semi-Annual 6 / Annual 12 | **real** scheduling |
| Compliance | `nextDue ≥ today` (override-able) | **real** date logic |
| Quant model registry | 6 models (Climate VaR MC, ITR SDA, Gaussian Copula, Backtest, NGFS) with lastValidation/nextDue/findings | curated MRM register |
| Model validation due | within 90 days of `today` | **real** date logic |
| Maturity dimensions | DMM-style, scored 0–5 (radar) | user-set (default 3) |
| Data-owner quality actual | `target − sRand(seed)·8` | synthetic seeded |
| Vendor scorecard | 7 vendors × quality/coverage/reliability/cost/compliance | curated demo |
| Data classification | 13 fields × classification × sensitivity | curated register |

### 7.3 Calculation walkthrough

`GOVERNANCE_POLICIES` → per-policy `nextDue` from `last_reviewed + cycleMonths` → compliant if not
overdue → `policyCompliance` table + `catDist` pie. `QUANT_MODELS` → count due within 90 days + sum
findings (real MRM tracking). `maturity` radar averages user-set dimension scores. Data-owner quality
"actual" = target minus a seeded gap. Trend series is a static 10-point array.

### 7.4 Worked example (policy compliance)

Policy last reviewed `2024-11-01`, cycle `Quarterly` (3 months), `today = 2025-05-15`:
```
nextDue = 2024-11-01 + 3 months = 2025-02-01
isCompliant = (2025-02-01 ≥ 2025-05-15)? = false  → OVERDUE (non-compliant)
```
A model `QM03` (Copula) with `nextDue = 2025-11-10` vs `today+90d = 2025-08-13`: `2025-11-10 ≤
2025-08-13`? false → not counted as "due within 90 days". These are genuine calendar computations.

### 7.5 Data provenance & limitations

- **Policy-compliance and model-validation scheduling are real** date arithmetic; the MRM model
  registry and data-classification register are curated but realistic.
- **Data-owner quality "actuals" are seeded** (`target − sRand·8`); vendor scorecards and the trend
  series are static demo values.
- The guide's weighted DQ formula (0.30/0.25/0.25/0.20) is not the module's primary computation — DQ
  scoring lives in the data-quality-monitor/dashboard modules.

**Framework alignment:** DAMA DMBOK2 (governance, stewardship, maturity model) · ISO 8000 data quality ·
EFRAG ESRS data-quality tiers · Fed SR 11-7-style model-validation register (the 6-model MRM tracker
with validation due-dates and findings is a genuine model-risk-governance artefact). EU Data Governance
Act referenced. Scheduling logic is real; DQ/vendor scores are placeholders.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Data-quality actuals and vendor scores are
seeded/static; only scheduling is real.

**8.1 Purpose & scope.** Operate an auditable ESG data-governance programme: policy lifecycle, data
stewardship, model-validation (SR 11-7) tracking, vendor management and a live DQ scorecard.

**8.2 Conceptual approach.** A **governance-operations ledger** with a live DQ feed — the DAMA DMBOK2
operating model plus SR 11-7 / PRA SS1/23 model-risk governance; DQ pulled from the data-quality-monitor
rather than seeded.

**8.3 Mathematical specification.**
```
PolicyCompliant = nextDue(last_reviewed, cycle) ≥ today                    (real, exists)
ModelHealth = f(days_to_nextDue, open_findings, validation_status)         # SR 11-7 tiering
DQ_domain = 0.30·Comp + 0.25·Acc + 0.25·Time + 0.20·Cons                   # from DQ monitor
MaturityAvg = mean_d DMM_score_d                                           # 0–5 DAMA DMM
VendorScore = w·[quality, coverage, reliability, cost, compliance]         # weighted scorecard
```

| Parameter | Source |
|---|---|
| Review cycles / dates | policy register (real) |
| Model validation dates/findings | MRM register (real) |
| DQ_domain | data-quality-monitor module |
| DMM scores | steward self-assessment |
| Vendor metrics | procurement + SLA telemetry |

**8.4 Data requirements.** Policy metadata (exists), model-validation records (exists), live DQ feed,
DMM assessments, vendor SLA data. Sources: DQ monitor, procurement.

**8.5 Validation & benchmarking.** Verify compliance dates against calendars; reconcile model-due
counts; benchmark maturity against DAMA DMM peer bands; check DQ feed matches the monitor module.

**8.6 Limitations & model risk.** Governance data is entered, not sensed — stale entries mislead;
seeded DQ actuals must be replaced by the live feed. Fallback: timestamp every entry and grey out stale
records.
