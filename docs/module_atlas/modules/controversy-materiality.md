# Controversy Materiality
**Module ID:** `controversy-materiality` · **Route:** `/controversy-materiality` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses the financial materiality of ESG controversies on equity valuations and credit spreads using event study methodology, SASB materiality mapping, and sector-specific financial impact models. Quantifies the expected financial impact of controversy severity tiers on EV/EBITDA multiples and CDS spreads.

> **Business value:** Enables credit analysts and portfolio managers to price ESG controversy risk into valuations and credit assessments, supporting active ownership decisions and providing quantitative evidence for stewardship engagement with investee companies.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CHART_COLORS`, `CONTROVERSY_ESRS_MAP`, `CONTROVERSY_EVENTS`, `CustomTooltip`, `ENRICHED_EVENTS`, `ESRS_TOPICS`, `KpiCard`, `LS_PORT`, `LS_PREFS`, `SEV_COLOR`, `SEV_LABEL`, `Section`, `SortHeader`, `TOPIC_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `fmtM` | `v => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`;` |
| `ENRICHED_EVENTS` | `CONTROVERSY_EVENTS.map(e => ({` |
| `totalImpact` | `ENRICHED_EVENTS.reduce((s, e) => s + e.estImpactUsd, 0);` |
| `holdingTickers` | `new Set(holdings.map(h => h.ticker));` |
| `avgSeverity` | `(ENRICHED_EVENTS.reduce((s, e) => s + e.severity, 0) / ENRICHED_EVENTS.length).toFixed(1);` |
| `materialIds` | `new Set(materialTopics.map(t => t.id));` |
| `types` | `[...new Set(ENRICHED_EVENTS.map(e => e.type))];` |
| `controversyTypes` | `useMemo(() => [...new Set(ENRICHED_EVENTS.map(e => e.type))], []);` |
| `avgSev` | `total > 0 ? ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id)).reduce((s, e) => s + e.severity, 0) / total : 0;` |
| `status` | `isMaterial && total > 0 ? 'validated' : !isMaterial && total > 0 ? 'gap' : isMaterial && total === 0 ? 'untested' : 'non-material';` |
| `totalSeverity` | `events.reduce((s, e) => s + e.severity, 0);` |
| `maxSev` | `events.length > 0 ? Math.max(...events.map(e => e.severity)) : 0;` |
| `materialIds` | `new Set(ESRS_TOPICS.filter(t => t.materialScore >= 50).map(t => t.id));` |
| `holdingTickers` | `new Set(holdings.map(h => h.ticker));` |
| `holdingTickers` | `new Set(holdings.map(h => h.ticker));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `CONTROVERSY_EVENTS`, `ESRS_TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EV/EBITDA Compression (Sev.4) | — | Event study calibration | Multiple compression observed for severity-4 ESG controversies in GICS sector cross-section |
| CDS Spread Widening (Sev.5) | — | Barclays ESG Credit Research | Credit default swap spread widening observed following severe ESG controversies |
| Controversy Persistence Half-Life | — | RepRisk temporal analysis | Time for financial impact to decay by 50% post-controversy onset, sector-dependent |
| SASB Materiality Alignment | — | SASB Materiality Map | Proportion of controversies mapped to financially material SASB topics for that sector |
| Financial Impact Range | — | Event study estimates | Estimated range of equity value impact from ESG controversies by severity tier |
- **RepRisk / MSCI controversy database** → Classify severity, map to SASB industry, tag financial sector → **Controversy event register with severity and materiality flags**
- **Bloomberg/Refinitiv price and multiple data** → Run event study around controversy dates, estimate β by sector → **Calibrated controversy β coefficients per GICS sector**
- **CDS spread history** → Compute abnormal spread widening post-controversy, regress on severity → **Credit impact model per severity tier**

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy Financial Impact Model
**Headline formula:** `EV_impact = β_controversy × SeverityScore × PersistenceDecay(t)`
**Standards:** ['SASB Materiality Map', 'MSCI ESG Ratings Methodology', 'Friede et al. 2015 Meta-Analysis']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).