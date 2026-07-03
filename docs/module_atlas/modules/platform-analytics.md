# Platform Analytics
**Module ID:** `platform-analytics` · **Route:** `/platform-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks platform usage metrics, module engagement, user session patterns, and feature adoption across the ESG analytics suite.

> **Business value:** Equips product and data teams with behavioural analytics to prioritise development, measure feature adoption, and optimise platform UX.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API_ENDPOINTS`, `DOMAIN_PIE_COLORS`, `MODULE_USAGE`, `STATUS_COLOR`, `USAGE_90D`, `WEEKLY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `date` | `new Date('2026-04-01'); date.setDate(date.getDate() - (89 - i));` |
| `trend` | `i / 90 * 15;  // growing trend` |
| `slice` | `USAGE_90D.slice(w * 7, (w+1) * 7);` |
| `slicedUsage` | `useMemo(() => USAGE_90D.slice(90 - range), [range]);` |
| `totalDau` | `Math.round(slicedUsage.reduce((s,d)=>s+d.dau,0)/slicedUsage.length);` |
| `totalApi` | `slicedUsage.reduce((s,d)=>s+d.apiCalls,0);` |
| `totalErrors` | `slicedUsage.reduce((s,d)=>s+d.errors,0);` |
| `avgLatency` | `Math.round(slicedUsage.reduce((s,d)=>s+d.p95Latency,0)/slicedUsage.length);` |
| `errorRate` | `totalApi > 0 ? (totalErrors / totalApi * 100).toFixed(3) : '0.000';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `API_ENDPOINTS`, `DOMAIN_PIE_COLORS`, `MODULE_USAGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Daily Active Users | — | Auth Logs | Unique authenticated users active in last 24 hours. |
| Top Module (7d) | — | Event Tracking | Most visited module by unique page views over rolling 7-day window. |
| Avg Session Duration (min) | — | Session Analytics | Mean authenticated session length across all users. |
- **Browser event telemetry + server access logs** → Session stitching; event aggregation; cohort segmentation → **Module engagement dashboard and exportable usage reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Module Engagement Score
**Headline formula:** `E = (DAU × avg_session_depth) / total_modules`
**Standards:** ['Internal Analytics Telemetry']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).