# Data Reconciliation
**Module ID:** `data-reconciliation` · **Route:** `/data-reconciliation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Cross-source ESG data reconciliation that identifies conflicts between providers, applies configurable resolution rules, and produces a single golden record for each entity and metric. Reconciliation lineage is preserved for full audit traceability. Supports automated and manual override workflows.

> **Business value:** Produces a single, auditable golden record per entity and metric, eliminating disclosure errors caused by provider disagreement. Enables compliance teams to demonstrate data lineage and conflict resolution rationale to regulators and auditors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DEFAULT_SOURCES`, `LS_CONFIG`, `LS_OVERRIDES`, `LS_PORTFOLIO`, `LS_RESOLUTIONS`, `RECONCILE_FIELDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `sortedSources` | `[...sourceConfig].sort((a, b) => a.priority - b.priority);` |
| `companyResult` | `{ company: company.name, ticker: company.ticker, exchange: company._displayExchange \|\| 'N/A', sector: company.sector, fields: {} };` |
| `values` | `sortedSources.map(src => {` |
| `maxV` | `Math.max(...numericValues.map(v => v.value));` |
| `minV` | `Math.min(...numericValues.map(v => v.value));` |
| `cnt` | `RECONCILE_FIELDS.reduce((acc, fDef) => acc + (r.fields[fDef.key]?.sourceCount \|\| 0 > 1 ? 1 : 0), 0);` |
| `bucket` | `cnt >= 4 ? '4+' : String(cnt);` |
| `srcIds` | `sourceConfig.map(s => s.id);` |
| `counts` | `{ '0': 0, '1': 0, '2': 0, '3': 0, '4+': 0 };` |
| `maxSrc` | `Math.max(...RECONCILE_FIELDS.map(fDef => r.fields[fDef.key]?.sourceCount \|\| 0));` |
| `bucket` | `maxSrc >= 4 ? '4+' : String(maxSrc);` |
| `sourceReliabilityData` | `useMemo(() => sourceConfig.map(s => ({ name: s.name.split(' ')[0], reliability: s.reliability, coverage: parseInt(s.coverage.match(/\d+/) \|\| [0]) \|\| 0` |
| `fieldConflictData` | `useMemo(() => Object.entries(stats.fieldConflicts).map(([k, v]) => ({ name: RECONCILE_FIELDS.find(f => f.key === k)?.label \|\| k, conflicts: v })).sort` |
| `next` | `prev.map(s => s.id === sourceId ? { ...s, priority: Math.max(0, Math.min(5, s.priority + delta)) } : s);` |
| `best` | `[...c.allValues].sort((a, b) => a.priority - b.priority)[0];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DEFAULT_SOURCES`, `RECONCILE_FIELDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Open Conflicts | — | Conflict detection engine | Count of entity-metric pairs with material disagreement between two or more providers |
| Auto-Resolved Rate | — | Resolution rule engine | Share of conflicts resolved automatically by priority and reliability rules |
| Golden Record Coverage | — | Entity master | Share of entities with at least one fully reconciled golden record |
| Avg Provider Deviation | — | Cross-provider comparison | Mean absolute percentage difference across conflicting provider pairs |
- **Multiple ESG data providers (Bloomberg, MSCI, Refinitiv, proprietary)** → Field-level conflict detection using threshold-based deviation analysis → **Conflict inventory with provider attribution**
- **Provider reliability weights (configured in Data Source Manager)** → Weighted priority resolution algorithm → **Golden record with source lineage per field**
- **Manual override audit trail** → Reviewer sign-off and justification capture → **Immutable lineage log for regulatory audit**

## 5 · Intermediate Transformation Logic
**Methodology:** Conflict Resolution Score
**Headline formula:** `CRS = Σ |vᵢ − v̅| / v̅ × wᵢ`
**Standards:** ['PCAF Golden Record Guidance', 'EFRAG ESRS 2 BP-2', 'GRI 2-4']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).