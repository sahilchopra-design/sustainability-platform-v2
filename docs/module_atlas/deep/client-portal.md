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
