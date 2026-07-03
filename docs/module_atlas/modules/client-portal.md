# Client Sustainability Portal
**Module ID:** `client-portal` · **Route:** `/client-portal` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Secure self-service portal for institutional clients to access portfolio sustainability analytics, ESG reports, and regulatory disclosure packages. Provides real-time portfolio carbon footprint, temperature score, and regulatory filing status dashboards.

> **Business value:** Client portal aggregates portfolio analytics behind entitlement controls. WACI and temperature score are primary headline metrics. Regulatory filing tracker covers SFDR, CSRD, and TCFD obligations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_FRAMEWORKS`, `Badge`, `Btn`, `CLIENT_TYPES`, `Card`, `ClientForm`, `DEFAULT_CLIENTS`, `FREQ_OPTIONS`, `Input`, `JURISDICTIONS`, `KANBAN_COLS`, `KPI`, `LS_CLIENTS`, `LS_DELIVERY`, `LS_NOTES`, `LS_PORT`, `SEED_DELIVERY`, `STATUS_COLORS`, `SortHeader`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `fmtD` | `d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';` |
| `daysBetween` | `(a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);` |
| `CLIENT_TYPES` | `['Pension','Public Pension','Insurance','Mutual Fund','Asset Manager','Family Office','SWF','VC/PE','Endowment','Foundation'];` |
| `FREQ_OPTIONS` | `['Weekly','Monthly','Quarterly','Semi-Annual','Annual'];` |
| `body` | `rows.map(r => cols.map(c => `"${String(c.get(r)\|\|'').replace(/"/g,'""')}"`).join(',')).join('\n');` |
| `totalAUM` | `useMemo(() => clients.reduce((s, c) => s + (c.aum_bn \|\| 0), 0), [clients]);` |
| `totalReportsYTD` | `useMemo(() => clients.reduce((s, c) => s + (c.reports_delivered \|\| 0), 0), [clients]);` |
| `avgSatisfaction` | `useMemo(() => { const sc = clients.filter(c => c.satisfaction); return sc.length ? Math.round(sc.reduce((s, c) => s + c.satisfaction, 0) / sc.length) ` |
| `typeSet` | `useMemo(() => new Set(clients.map(c => c.type)), [clients]);` |
| `estRevenue` | `useMemo(() => clients.reduce((s, c) => s + ((c.aum_bn \|\| 0) * (c.fee_bps \|\| 3) * 10000), 0), [clients]);` |
| `quarters` | `['Q1-2024','Q2-2024','Q3-2024','Q4-2024','Q1-2025'];` |
| `mapped` | `deliveryLog.map(d => ({ ...d, clientName: (clients.find(c => c.id === d.client_id) \|\| {}).name \|\| d.client_id }));` |
| `fwMatrix` | `useMemo(() => ALL_FRAMEWORKS.map(fw => {` |
| `revenueData` | `useMemo(() => clients.filter(c => c.status === 'Active').map(c => ({` |
| `pct` | `Math.min(100, Math.max(0, ((c.sla_days - days) / c.sla_days) * 100));` |
| `pct` | `c.sla_days ? Math.min(100, Math.max(0, (days / c.sla_days) * 100)) : 50;` |
| `rev` | `(c.aum_bn \|\| 0) * (c.fee_bps \|\| 3) * 10000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_FRAMEWORKS`, `CLIENT_TYPES`, `DEFAULT_CLIENTS`, `FREQ_OPTIONS`, `JURISDICTIONS`, `KANBAN_COLS`, `SEED_DELIVERY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Carbon Footprint | `PCAF Scope 1+2 financed emissions` | PCAF Standard v2 | Portfolio-weighted financed emissions per million dollars invested |
| WACI | `Σ(w_i × CI_i)` | GHG Protocol / TCFD | Weighted Average Carbon Intensity across portfolio holdings |
| Portfolio Temperature Score | `Weighted ITR by portfolio weight` | TCFD-aligned ITR | Portfolio-level implied temperature rise metric |
| Regulatory Filing Status | `Deadline tracking` | Platform | Submission status for each active regulatory disclosure obligation |
- **Portfolio management system** → Holdings → entitlement filter → client view → **Authorised portfolio data**
- **Carbon data providers** → Company EF data → PCAF calculation → **Portfolio carbon footprint**

## 5 · Intermediate Transformation Logic
**Methodology:** Client-facing portfolio aggregation with entitlement filtering
**Headline formula:** `ClientView = PortfolioData ∩ ClientEntitlements; CarbonFootprint = Σ(w_i × EVIC_i_scope12) × (1M / AUM)`
**Standards:** ['PCAF Standard v2', 'SFDR Annex I', 'TCFD Recommendations', 'ISO 14064-3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).