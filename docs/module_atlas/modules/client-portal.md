# Client Sustainability Portal
**Module ID:** `client-portal` · **Route:** `/client-portal` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Secure self-service portal for institutional clients to access portfolio sustainability analytics, ESG reports, and regulatory disclosure packages. Provides real-time portfolio carbon footprint, temperature score, and regulatory filing status dashboards.

> **Business value:** Client portal aggregates portfolio analytics behind entitlement controls. WACI and temperature score are primary headline metrics. Regulatory filing tracker covers SFDR, CSRD, and TCFD obligations.

**How an analyst works this module:**
- Login to client portal with institutional credentials
- Dashboard shows portfolio carbon footprint and temperature score
- Regulatory tab lists filing deadlines and submission status
- Reports tab downloads pre-formatted SFDR/CSRD/TCFD packages
- Settings tab manages notification preferences and data access

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_FRAMEWORKS`, `Badge`, `Btn`, `CLIENT_TYPES`, `Card`, `ClientForm`, `DEFAULT_CLIENTS`, `FREQ_OPTIONS`, `Input`, `JURISDICTIONS`, `KANBAN_COLS`, `KPI`, `LS_CLIENTS`, `LS_DELIVERY`, `LS_NOTES`, `LS_PORT`, `SEED_DELIVERY`, `STATUS_COLORS`, `SortHeader`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_CLIENTS` | 9 | `name`, `type`, `aum_bn`, `contact`, `email`, `jurisdiction`, `frameworks`, `sfdr_article`, `reporting_frequency`, `last_report`, `next_due`, `status`, `portfolios`, `satisfaction`, `reports_delivered`, `sla_days`, `fee_bps` |
| `SEED_DELIVERY` | 9 | `report`, `date`, `format`, `sla_met`, `satisfaction` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `fmtD` | `d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';` |
| `daysBetween` | `(a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);` |
| `CLIENT_TYPES` | `['Pension','Public Pension','Insurance','Mutual Fund','Asset Manager','Family Office','SWF','VC/PE','Endowment','Foundation'];` |
| `FREQ_OPTIONS` | `['Weekly','Monthly','Quarterly','Semi-Annual','Annual'];` |
| `body` | `rows.map(r => cols.map(c => `"${String(c.get(r)\|\|'').replace(/"/g,'""')}"`).join(',')).join('\n');` |
| `activeClients` | `useMemo(() => clients.filter(c => c.status === 'Active'), [clients]); const totalAUM = useMemo(() => clients.reduce((s, c) => s + (c.aum_bn \|\| 0), 0), [clients]);` |
| `totalReportsYTD` | `useMemo(() => clients.reduce((s, c) => s + (c.reports_delivered \|\| 0), 0), [clients]);` |
| `avgSatisfaction` | `useMemo(() => { const sc = clients.filter(c => c.satisfaction); return sc.length ? Math.round(sc.reduce((s, c) => s + c.satisfaction, 0) / sc.length) : 0; }, [clients]);` |
| `frameworkSet` | `useMemo(() => new Set(clients.flatMap(c => c.frameworks \|\| [])), [clients]); const typeSet = useMemo(() => new Set(clients.map(c => c.type)), [clients]);` |
| `onboarding` | `useMemo(() => clients.filter(c => c.status === 'Onboarding').length, [clients]); const estRevenue = useMemo(() => clients.reduce((s, c) => s + ((c.aum_bn \|\| 0) * (c.fee_bps \|\| 3) * 10000), 0), [clients]);` |
| `satisfactionTrend` | `useMemo(() => { const quarters = ['Q1-2024','Q2-2024','Q3-2024','Q4-2024','Q1-2025'];` |
| `sortedDelivery` | `useMemo(() => { const mapped = deliveryLog.map(d => ({ ...d, clientName: (clients.find(c => c.id === d.client_id) \|\| {}).name \|\| d.client_id }));` |
| `fwMatrix` | `useMemo(() => ALL_FRAMEWORKS.map(fw => {` |
| `revenueData` | `useMemo(() => clients.filter(c => c.status === 'Active').map(c => ({` |
| `pct` | `Math.min(100, Math.max(0, ((c.sla_days - days) / c.sla_days) * 100));` |
| `rev` | `(c.aum_bn \|\| 0) * (c.fee_bps \|\| 3) * 10000;` |
| `rpy` | `c.reporting_frequency === 'Quarterly' ? 4 : c.reporting_frequency === 'Semi-Annual' ? 2 : c.reporting_frequency === 'Monthly' ? 12 : 1;` |

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

Client entitlement matrix controls which portfolios and modules are visible per client account. Carbon footprint per GHG Protocol Scope 2 MB method for financed emissions; WACI = portfolio-weighted average carbon intensity (tCO₂e/$M revenue). Temperature score follows TCFD-aligned weighted ITR methodology. Regulatory filing status tracks submission deadlines for SFDR PAI, CSRD ESG, and TCFD reports.

**Standards:** ['PCAF Standard v2', 'SFDR Annex I', 'TCFD Recommendations', 'ISO 14064-3']
**Reference documents:** PCAF Global GHG Accounting Standard v2; SFDR Annex I PAI Disclosures; TCFD Final Recommendations 2017; ISO 14064-3 Verification

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *client-facing portfolio
> analytics portal* — "portfolio carbon footprint per PCAF Scope 2 MB method", "WACI = portfolio-
> weighted average carbon intensity", "TCFD-aligned weighted ITR temperature score", entitlement
> filtering `ClientView = PortfolioData ∩ ClientEntitlements`. **None of that logic exists in this
> module's code.** What the page actually implements is a **client-relationship-management (CRM)
> console**: a `localStorage`-backed client roster with CRUD, an SLA / delivery tracker, a
> reporting-framework coverage matrix, a fee-based revenue estimator, and a satisfaction trend. No
> carbon, WACI, EVIC, or temperature-score arithmetic is present. There is no PCAF calculation, no
> ITR, and no entitlement-filtered portfolio view. The sections below document the code as it
> behaves.

### 7.1 What the module computes

State is loaded from and persisted to `localStorage` (`ra_clients_v1`, `ra_client_notes_v1`,
`ra_portfolio_v1`, `ra_delivery_log_v1`), seeded by `DEFAULT_CLIENTS` (8 accounts) and
`SEED_DELIVERY` (8 report deliveries). The book-of-business KPIs:

```
totalAUM        = Σ aum_bn                                   ($Bn under advisory)
totalReportsYTD = Σ reports_delivered
avgSatisfaction = round( Σ satisfaction / count(has satisfaction) )
estRevenue      = Σ ( aum_bn × fee_bps × 10000 )            (annual $ fee)
slaCompliance   = round( count(sla_met) / count(delivery) × 100 )
onboarding      = count(status == 'Onboarding')
```

The `fee_bps × 10000` term converts basis points on `aum_bn` ($Bn) to dollars:
`aum_bn ($Bn) × fee_bps (bps) × 10000 = aum × fee_bps × 1e4`, i.e. bps × $1e9 / 1e4 × ... —
functionally `revenue_$ = aum_bn × fee_bps × 10⁴` per the code.

### 7.2 Parameterisation / seed data

| Field | Meaning | Provenance |
|---|---|---|
| `DEFAULT_CLIENTS[].aum_bn` | AUM in $Bn | Hard-coded demo roster (Nordic Pension, CalPERS, Swiss Re…) |
| `fee_bps` | advisory fee, 1.5–6.0 bps | Hard-coded per client; default `3` where absent |
| `satisfaction` | 0–100 CSAT | Hard-coded; `null` for prospects |
| `sla_days` | contractual SLA window | Hard-coded 15–60 days |
| `frameworks[]` | reporting obligations | Hard-coded list drawn from `ALL_FRAMEWORKS` (14 frameworks) |
| `SEED_DELIVERY[].sla_met` | boolean | Hard-coded; drives `slaCompliance` |

`ALL_FRAMEWORKS` = SFDR, TCFD, EU Taxonomy, PRI, SEC, PCAF, TNFD, BRSR, SEBI ESG, GRI, CBI, ISSB,
EDCI, CSRD — a coverage taxonomy, not a computation input.

### 7.3 Calculation walkthrough

1. Client list filtered by search / status / type / satisfaction slider, then sorted (`filtered`).
2. `fwMatrix` builds a framework × client 0/1 adoption grid: `row[c.id] = frameworks.includes(fw) ? 1 : 0`.
3. `revenueData` computes per-active-client `revenue = aum_bn × fee_bps × 10⁴`, sorted descending.
4. `satisfactionTrend` fabricates a 5-quarter CSAT time series by jittering each client's base
   satisfaction: `clamp(60,100, base + (sr(hashStr(id), qi) − 0.5)×15)` — a **seeded synthetic
   trend**, not observed history.
5. `upcomingDeadlines` sorts clients whose `next_due > now`; `slaCompliance` from the delivery log.

### 7.4 Worked example — one client's revenue & SLA

Client **C001 Nordic Pension Fund**: `aum_bn = 85`, `fee_bps = 3.2`, `sla_days = 15`.

| Step | Computation | Result |
|---|---|---|
| Annual revenue | 85 × 3.2 × 10,000 | **$2,720,000** |
| Contributes to `estRevenue` | summed with all clients | portfolio fee line |
| Delivery SLA | 2 of 2 C001 deliveries `sla_met=true` | contributes to 7/8 = **88 %** book-wide SLA |
| Satisfaction Q1-2025 | clamp(60,100, 92 + (sr(hashStr('C001'),4)−0.5)×15) | ≈ 85–99 (seed-dependent) |

### 7.5 Companion views on the page

- **Framework Matrix** — 14 frameworks × N clients coverage grid (green tick / dash).
- **Delivery / SLA** — sortable report-delivery log; SLA-met rate KPI.
- **Calendar / Onboarding** — deadline calendar and a Prospect→Onboarding→Active→Renewal kanban.
- **Communication** — free-text notes appended per client (persisted to `localStorage`).
- **Revenue** — bar chart + table of `aum_bn × fee_bps` fee estimates.

### 7.6 Data provenance & limitations

- **All data is synthetic demo data held in `localStorage`.** The satisfaction trend uses the
  seeded PRNG `sr(seed) = frac(sin(seed+1)×10⁴)` (with a `hashStr` id hash), so it is stable but
  fabricated. `hashStr` uses `Math.imul(31,a)` — a standard 32-bit string hash.
- No portfolio data, carbon metrics, or entitlement enforcement exist despite the guide's claims;
  the imported `GLOBAL_COMPANY_MASTER` and `ra_portfolio_v1` are read but not used for any carbon
  calculation on this page.
- Revenue is a flat `AUM × bps` estimate — no tiering, minimums, or accrual logic.

**Framework alignment:** The frameworks named (SFDR PAI, TCFD, CSRD ESRS, PCAF, BRSR, ISSB) appear
only as **coverage tags** in the client roster and framework matrix — the portal tracks *which
disclosure obligations each client carries*, it does not compute any of them. The PCAF/WACI/ITR
methodology the guide attributes here actually lives in `pcaf-financed-emissions`,
`paris-alignment`, and `portfolio-temperature-score`.

## 8 · Model Specification — Entitlement-Filtered Portfolio Carbon View

**Status: specification — not yet implemented in code.** The guide promises a client-entitled
portfolio carbon/WACI/ITR view; this section specifies it so the portal could deliver the analytics
it advertises.

### 8.1 Purpose & scope
Give each institutional client a read-only, entitlement-scoped view of *their* mandated portfolios'
financed emissions, WACI and temperature score, with regulatory filing status — the "self-service
disclosure" the guide describes.

### 8.2 Conceptual approach
Standard **PCAF financed-emissions attribution** (Global GHG Accounting Standard v2) plus a **SBTi
portfolio-temperature (ITR)** rollup, wrapped in a row-level entitlement filter
(`ClientView = Holdings ⋈ Entitlements`). Benchmarks: PCAF Part A (listed equity/bonds, EVIC
attribution) and the SBTi Temperature Scoring / CDP-WWF portfolio-temperature method.

### 8.3 Mathematical specification
```
attribution_i   = OutstandingAmount_i / EVIC_i
FinancedEmis_i  = attribution_i × (Scope1_i + Scope2_i [+ Scope3_i])
PortfolioFE     = Σ_i FinancedEmis_i
WACI            = Σ_i ( value_i / Σ value ) × (Scope1_i + Scope2_i) / Revenue_i
Temperature     = Σ_i w_i × ITR_i     (SBTi target-based, w_i = value weight)
DQ_score        = Σ_i w_i × DataQuality_i        (PCAF 1–5)
```
| Parameter | Source |
|---|---|
| EVIC, revenue, market value | Vendor fundamentals (Bloomberg / Refinitiv); platform `GLOBAL_COMPANY_MASTER` |
| Scope 1/2/3 | CDP disclosures, PCAF estimation tiers |
| ITR_i | SBTi target database + sector decarbonisation pathways |
| Entitlement map | Platform RBAC (`clients`, `portfolios` join) |

### 8.4 Data requirements
Client→portfolio→holding join with per-holding EVIC, revenue, Scope 1/2/3, DQ tier and ITR; already
partially present via `GLOBAL_COMPANY_MASTER` and the `pcaf-financed-emissions` engine — the portal
would consume those rather than recompute them.

### 8.5 Validation & benchmarking plan
Reconcile PortfolioFE and WACI against the platform's `pcaf-financed-emissions` module for the same
mandate; reconcile Temperature against `portfolio-temperature-score`; audit entitlement filter with
negative tests (client cannot see unmandated portfolios).

### 8.6 Limitations & model risk
Scope 3 double-counting across holdings; EVIC volatility inflates attribution swings; ITR coverage
gaps for non-SBTi issuers require default temperature assignment (SBTi default 3.2 °C). Conservative
fallback: show FE/WACI only where DQ ≤ 3 and flag ITR coverage below 70 %.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side client book with real portfolio bindings (analytics ladder: rung 1 → 2)

**What.** §7 reclassifies this module honestly: despite the guide's talk of PCAF
carbon footprints, WACI, ITR, and entitlement filtering, the code is a
`localStorage`-backed **CRM console** — client roster CRUD, SLA/delivery tracker,
framework coverage matrix, fee revenue estimator — with zero carbon arithmetic.
Evolution A does two things in order: (1) promotes the CRM to a backend vertical
(`client_accounts`, `client_deliveries` tables + router) so the book of business
survives browsers and respects RBAC; (2) implements the *binding* the guide promises —
each client account links to one or more `portfolios_pg` portfolios, and the dashboard
surfaces that portfolio's WACI/footprint/ITR **by calling the platform's existing
portfolio-analytics endpoints**, not by reimplementing PCAF math in this page.

**How.** (1) Standard CRUD router with the existing seed clients as fixtures; the
delivery tracker's SLA analytics (`avgImpl`-style lead times) recomputed over DB rows.
(2) `client_portfolio_links(client_id, portfolio_id)` join table; the entitlement
formula the guide cites (`ClientView = PortfolioData ∩ Entitlements`) becomes this
join filtered by the caller's RBAC scope. (3) Guide rewritten to describe portal =
CRM + linked analytics, clearing the §7 flag.

**Prerequisites.** Portfolio-analytics endpoints must be healthy for the linked
metrics (the 2026-07-05 sweep fixed live 500s in that router — verify before binding);
REQUIRE_AUTH posture for the new mutating routes. **Acceptance:** a client's dashboard
WACI equals the portfolio-analytics module's value for the linked portfolio; a user
without entitlement to a portfolio cannot see its metrics through any portal route.

### 9.2 Evolution B — Relationship-desk assistant (LLM tier 2)

**What.** An assistant for the client-servicing workflow: "which clients have SFDR
deliverables due this month?", "summarise Nordfund's delivery history and open
items", "draft the quarterly touch-point note for a client whose portfolio WACI
improved 12%" — list/filter questions as tool calls over the Evolution A CRUD routes,
the drafting task grounded in delivery rows plus the linked portfolio metrics, with
every number validated against tool outputs.

**How.** Tool schemas from the new router (read-only first; delivery-status mutations
gated behind user confirmation); the framework matrix (`ALL_FRAMEWORKS` per
jurisdiction) forms the corpus for obligation questions; client-facing draft text goes
through a review-before-send flow — the assistant proposes, the relationship manager
approves.

**Prerequisites (hard).** Evolution A first: there are no endpoints today, and client
data in `localStorage` is invisible to any server-side assistant. Per-client data
isolation verified so the assistant can never mix two clients' books in one answer.
**Acceptance:** a deadline query reconciles to a SQL filter over deliveries; a drafted
note contains only metrics returned by the portfolio-analytics tool calls it cites.