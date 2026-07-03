# Data Quality Monitor
**Module ID:** `data-quality-monitor` · **Route:** `/data-quality-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Continuous monitoring of ESG data quality across completeness, accuracy, consistency, and timeliness dimensions. Automated scoring surfaces data gaps and anomalies before they propagate into disclosures or analytics. Threshold-based alerting notifies data stewards of quality degradation in real time.

> **Business value:** Enables data stewards and risk officers to maintain disclosure-grade ESG data quality across all platform inputs. Identifies root-cause providers and fields driving quality degradation, supporting audit readiness and regulatory defensibility.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DQ_DIMENSIONS`, `DQ_FIELDS`, `EXCHANGE_COLORS`, `KPICard`, `LS_PORT`, `PIE_COLORS`, `QUALITY_RULES`, `SEVERITY_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `completeness` | `(present / DQ_FIELDS.length) * 100;` |
| `accuracy` | `violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 15);` |
| `consistency` | `80 + (company._displayExchange === 'NSE/BSE' ? 10 : sr(_sc++) * 10);` |
| `validity` | `violations.length === 0 ? 100 : Math.max(50, 100 - violations.length * 10);` |
| `dqData` | `useMemo(() => companies.map(c => computeCompanyDQ(c)), [companies]);` |
| `avgComposite` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.composite, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `avgCompleteness` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.completeness, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `avgAccuracy` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.accuracy, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `avgTimeliness` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.timeliness, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `criticalViolations` | `dqData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'critical').length, 0);` |
| `highViolations` | `dqData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'high').length, 0);` |
| `exchanges` | `useMemo(() => [...new Set(dqData.map(d => d.exchange).filter(Boolean))].sort(), [dqData]);` |
| `sectors` | `useMemo(() => [...new Set(dqData.map(d => d.sector).filter(Boolean))].sort(), [dqData]);` |
| `radarData` | `useMemo(() => DQ_DIMENSIONS.map(dim => ({` |
| `row` | `{ field: field.replace(/_/g, ' ') };` |
| `worst20` | `useMemo(() => [...dqData].sort((a, b) => a.composite - b.composite).slice(0, 20), [dqData]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DQ_DIMENSIONS`, `DQ_FIELDS`, `EXCHANGE_COLORS`, `PIE_COLORS`, `QUALITY_RULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Platform DQ Score | — | Internal rule engine | Overall weighted composite; scores below 0.75 trigger amber alert |
| Completeness Rate | — | Field presence audit | Share of mandatory fields populated across all active data feeds |
| Accuracy Violations | — | Range & logic checks | Count of values failing validation rules in the current reporting period |
| Stale Records (>30d) | — | Timestamp audit | Records whose last-updated timestamp exceeds the staleness threshold |
- **ESG data providers (API / SFTP)** → Field-level rule evaluation against type, range, and cross-field logic → **Per-field and per-record DQ scores**
- **Internal emissions database** → Completeness audit against mandatory disclosure field list → **Completeness rate and gap inventory**
- **Timestamp metadata** → Comparison of last-updated vs. staleness threshold → **Stale record count and ageing histogram**

## 5 · Intermediate Transformation Logic
**Methodology:** DQ Composite Score
**Headline formula:** `DQS = w₁×Completeness + w₂×Accuracy + w₃×Consistency + w₄×Timeliness`
**Standards:** ['PCAF Data Quality Score', 'ISO 8000', 'GRI 2-4']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).