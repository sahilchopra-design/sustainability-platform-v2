# Data Governance Hub
**Module ID:** `data-governance` · **Route:** `/data-governance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages ESG data governance policies, stewardship workflows, data quality controls, and metadata standards across the sustainability data platform. Tracks data ownership, access controls, quality KPIs, and policy compliance to ensure reliable, auditable sustainability disclosures.

> **Business value:** Enables data stewards and sustainability teams to maintain the data quality standards needed for defensible regulatory disclosures, providing auditors and regulators with evidence that sustainability data is managed with appropriate governance and controls.

**How an analyst works this module:**
- Review platform DQ scorecard on the Overview dashboard by data domain
- Policy Manager tab defines and publishes data governance policies by data category
- Stewardship Workflows tab assigns ownership and escalation rules per data domain
- Quality Issue Tracker shows all open DQ flags with assigned steward and resolution deadline
- Access Control tab manages user permissions and data classification (public/restricted/confidential)
- Governance Audit Report generates compliance evidence for external assurance and regulator review

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DATA_FIELDS_CLASSIFICATION`, `DATA_OWNERS`, `DEFAULT_MATURITY`, `DEFAULT_VENDORS`, `GOVERNANCE_POLICIES`, `LS_EXCEPTIONS`, `LS_KEY`, `LS_MATURITY`, `LS_PORTFOLIO`, `LS_VENDOR`, `MATURITY_DIMS`, `QUANT_MODELS`, `REG_ALIGNMENT`, `TREND_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GOVERNANCE_POLICIES` | 16 | `category`, `policy`, `owner`, `enforcement`, `status`, `last_reviewed`, `review_cycle` |
| `DATA_OWNERS` | 9 | `owner`, `steward`, `sources`, `quality_target` |
| `QUANT_MODELS` | 6 | `name`, `lastValidation`, `nextDue`, `findings`, `status`, `methodology`, `coverage` |
| `DEFAULT_VENDORS` | 7 | `name`, `type`, `quality`, `coverage`, `reliability`, `cost`, `compliance`, `contract_end`, `notes` |
| `DATA_FIELDS_CLASSIFICATION` | 13 | `domain`, `classification`, `sensitivity` |
| `REG_ALIGNMENT` | 7 | `policies`, `coverage`, `notes` |
| `TREND_DATA` | 10 | `compliance`, `target`, `policies`, `exceptions` |
| `TABS` | 11 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `DEFAULT_MATURITY` | `MATURITY_DIMS.map(d => ({ dimension: d, score: 3 }));` |
| `portfolio` | `useMemo(() => loadLS(LS_PORTFOLIO) \|\| [], []);  /* ── Persisted state ──────────────────────────────────────────────────── */ const [activeTab, setActiveTab] = useState('policies');` |
| `cmp` | `typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));` |
| `categories` | `useMemo(() => ['All', ...new Set(GOVERNANCE_POLICIES.map(p => p.category))], []);` |
| `cycleMonths` | `p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;` |
| `nextDue` | `new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);` |
| `modelValidationsDue` | `useMemo(() => QUANT_MODELS.filter(m => new Date(m.nextDue) <= new Date(today.getTime() + 90*86400000)).length, []); const openExceptions = exceptions.filter(e => e.status === 'active').length;` |
| `auditFindings` | `QUANT_MODELS.reduce((s, m) => s + m.findings, 0);` |
| `policyCompliance` | `useMemo(() => GOVERNANCE_POLICIES.map(p => {` |
| `catDist` | `useMemo(() => { const m = {}; GOVERNANCE_POLICIES.forEach(p => { m[p.category] = (m[p.category] \|\| 0) + 1; });` |
| `radarData` | `useMemo(() => maturity.map(m => ({ dimension: m.dimension, score: m.score, fullMark: 5 })), [maturity]);` |
| `maturityAvg` | `useMemo(() => maturity.reduce((s, m) => s + m.score, 0) / maturity.length, [maturity]);` |
| `blob` | `new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });` |
| `actual` | `d.quality_target - Math.floor(sRand(seed(d.domain)) * 8);` |
| `avg` | `Math.round((v.quality + v.coverage + v.reliability + v.cost + v.compliance) / 5);` |
| `daysUntil` | `Math.round((new Date(ev.date) - today) / 86400000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DATA_FIELDS_CLASSIFICATION`, `DATA_OWNERS`, `DEFAULT_VENDORS`, `GOVERNANCE_POLICIES`, `MATURITY_DIMS`, `QUANT_MODELS`, `REG_ALIGNMENT`, `TABS`, `TREND_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Platform DQ Score | — | Internal DQ engine | Overall ESG data quality score across all data categories and sources |
| Data Completeness | — | Internal tracking | Proportion of required ESG data fields populated with non-null values across reporting period |
| Policy Compliance Rate | — | Governance audit | Percentage of data handling workflows compliant with platform governance policies |
| Open Data Quality Issues | — | Issue tracker | Number of unresolved DQ flags requiring steward resolution before disclosure |
| Data Lineage Coverage | — | Lineage tracker | Proportion of disclosed metrics with documented end-to-end data lineage from source to output |
- **All platform data sources and ESG databases** → Apply DQ rules per dimension (completeness, accuracy, timeliness, consistency) → **Data quality score per domain and metric**
- **Governance policy database** → Check workflows against policy requirements, flag violations → **Policy compliance rate and exception log**
- **User access log and permission registry** → Audit access patterns against data classification, flag anomalies → **Access control compliance report**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Data Quality Score
**Headline formula:** `DQ_score = 0.30×Completeness + 0.25×Accuracy + 0.25×Timeliness + 0.20×Consistency`

Completeness: proportion of required fields populated. Accuracy: deviation from source verification checks and plausibility bounds. Timeliness: data age relative to reporting period (penalty for >6 months lag). Consistency: cross-system agreement for same metric (e.g., Scope 1 in ERP vs sustainability system). Scores below 70 trigger mandatory data steward review before disclosure sign-off.

**Standards:** ['DAMA DMBOK2', 'EFRAG ESRS Data Quality Tiers', 'ISO 8000 Data Quality']
**Reference documents:** DAMA International Data Management Body of Knowledge (DMBOK2); EFRAG ESRS Data Quality and Estimation Guidance; ISO 8000-8 Data Quality Concepts and Measuring; EU Data Governance Act (EU) 2022/868

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the DQ score from platform telemetry (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch: the module's genuinely computed logic is
operational scheduling — real `nextDue` date arithmetic for the 16-policy register
and the 6-model MRM validation calendar — while the guide's headline
`DQ = 0.30·Completeness + 0.25·Accuracy + 0.25·Timeliness + 0.20·Consistency` is
peripheral: data-owner quality "actuals" are `target − sRand·8`, vendor scorecards
and the trend series are static. The irony is that the platform generates exactly
the telemetry the formula needs. Evolution A computes DQ from it.

**How.** (1) Completeness from the `data-capture-hub` coverage computations and the
CSRD collection ledger (both real); Timeliness from record timestamps vs reporting
period (the >6-month penalty the guide specifies is date arithmetic this module
already does well); Consistency from `comprehensive-reporting`'s 20 cross-framework
consistency rules (real engine, real deviation statistics); Accuracy from
validation pass rates in the capture layer. (2) The weighted DQ score per data
domain then drives the steward workflow: scores below the documented 70 threshold
open quality issues assigned per the owner matrix — connecting the module's real
scheduling machinery to real quality signals. (3) De-seed the owner "actuals";
vendor scorecards become entered assessments or leave. (4) The MRM register gains
platform teeth: link each registered model to its actual engine (the Atlas engine
inventory) and its bench status from `bench_quant` — validation due-dates then
track real artifacts.

**Prerequisites (hard).** The upstream telemetry sources' own Evolutions A
(capture persistence, collection ledger); seed purge on owner actuals.
**Acceptance:** a domain's DQ score decomposes into four sub-scores each traceable
to a telemetry query; a stale record moves Timeliness; the MRM register's
next-due list names real platform engines.

### 9.2 Evolution B — Governance-audit evidence assembler (LLM tier 1 → 2)

**What.** The module's last promise — "Governance Audit Report generates compliance
evidence for external assurance" — is an evidence-assembly task over the module's
own registers. Evolution B drafts it: policy-compliance status from the real
scheduling logic (which policies are overdue and why), model-validation posture
from the MRM register (validations due, findings open), DQ scores with their
telemetry decomposition (post-Evolution A), and the classification register's
access-control posture — organized against DAMA DMBOK2/ISO 8000 structure the
module cites, every claim referencing a register row or computed score.

**How.** Tier 1 over register state plus this Atlas record; tier 2 if registers
move server-side, with the drafter versioning reports against register snapshots
so year-over-year governance improvement is demonstrable — the thing assurers
actually ask for. The honesty rule: overdue policies and open findings must appear
prominently; a governance report that hides its own reds is worse than none.

**Prerequisites.** Evolution A's computed DQ (an audit report quoting seeded
quality actuals would undermine the module's entire purpose); register
persistence. **Acceptance:** every status in a draft matches the live register;
overdue items are listed with their computed `nextDue` dates; DQ figures decompose
on demand to their telemetry sources.