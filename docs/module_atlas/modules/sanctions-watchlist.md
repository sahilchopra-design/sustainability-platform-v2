# Sanctions Watchlist
**Module ID:** `sanctions-watchlist` · **Route:** `/sanctions-watchlist` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-focused sanctions watchlist management tracking sanctioned entities with ESG controversy flags, enabling dual compliance and sustainability screening.

> **Business value:** Combines sanctions compliance with ESG controversy screening to flag entities of dual regulatory and reputational concern.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITY_TYPES`, `LISTS`, `MONTHLY_ADDS`, `NATIONALITIES`, `PROG_TYPES`, `RISK_COLOR`, `SCREENING_HITS`, `SDN_ENTRIES`, `STATUS_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `riskScore` | `70 + Math.floor(sr(i * 3) * 30);` |
| `matchTypes` | `['Exact Name','Fuzzy Name (87%)','Alias Match','LEI Cross-ref','ISIN Cross-ref'];` |
| `actions` | `['Block Transaction','Enhanced DD Required','Flag for Review','Auto-cleared','Escalate to Compliance'];` |
| `progBreakdown` | `useMemo(() => PROG_TYPES.map(p => ({` |
| `natBreakdown` | `useMemo(() => NATIONALITIES.map(n => ({` |
| `totalCriticalEntries` | `criticalLists.reduce((s,l)=>s+l.entries,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_TYPES`, `LISTS`, `NATIONALITIES`, `NAT_COLORS`, `PROG_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Watchlist Entities | — | Consolidated lists | Total entities on active watchlist combining sanctions, PEP and ESG controversy flags. |
| High Severity Flags | — | RepRisk/MSCI | Entities with both active sanctions exposure and high-severity ESG controversies. |
| Daily Alert Rate | — | Live feed | Average new watchlist additions per business day across all source lists. |
- **Sanctions lists, ESG controversy feeds, portfolio entity register** → Fuzzy matching, LEI resolution, dual-dimension scoring → **Watchlist alerts, portfolio exposure reports, escalation logs**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Controversy Overlap Score
**Headline formula:** `Sanctioned Entity ESG Controversy Count ÷ Max Controversy Count × 100`
**Standards:** ['RepRisk', 'MSCI ESG', 'OFAC SDN']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).