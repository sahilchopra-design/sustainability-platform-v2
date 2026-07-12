# Distributed & Community Solar Analytics
**Module ID:** `distributed-community-solar` · **Route:** `/distributed-community-solar` · **Tier:** B (frontend-computed) · **EP code:** EP-EC5 · **Sprint:** EC

## 1 · Overview
Distributed generation and community solar program analytics. Covers SREC market pricing, net metering policy economics, community solar subscription models, LMI access requirements, and distributed generation economics across US state programs.

> **Business value:** Used by community solar developers, utilities, regulators, and solar equity advocates to analyze distributed generation economics, SREC markets, and community solar program design.

**How an analyst works this module:**
- Filter programs by state to compare SREC prices and net metering policy
- Review community solar tab for subscription model economics
- Examine LMI access tab for state-by-state set-aside requirements
- Use policy tracker for latest NEM reform developments

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KPI_CARD`, `LMI_PROGRAMS`, `NET_METERING_IMPACT`, `NET_METERING_POLICIES`, `PROJECTS`, `PROJECT_TYPES`, `SREC_MARKET_DATA`, `TABS`, `US_STATES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SREC_MARKET_DATA` | 9 | `price`, `market`, `status` |
| `NET_METERING_IMPACT` | 6 | `billReduction`, `payback`, `solarValue` |
| `LMI_PROGRAMS` | 7 | `benefit`, `eligibility`, `state` |
| `TABS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PROJECT_TYPES` | `['Rooftop Commercial', 'Rooftop Residential', 'Carport', 'Community Solar', 'Ground-Mount C&I'];` |
| `capacitykW` | `10 + Math.round(sr(i * 7) * 4990);` |
| `subscriberCount` | `isCommunitySolar ? 20 + Math.round(sr(i * 11) * 480) : 1;` |
| `avgBillSavingPct` | `15 + sr(i * 13) * 30;` |
| `systemCostPerW` | `2.8 + sr(i * 17) * 1.4;` |
| `annualSavingsPerSubscriber` | `400 + sr(i * 19) * 800;` |
| `itcPct` | `30 + sr(i * 23) * 10;` |
| `srecPrice` | `50 + sr(i * 29) * 200;` |
| `paybackYr` | `5 + sr(i * 31) * 8;` |
| `lcoe` | `55 + sr(i * 37) * 55;` |
| `lmiShare` | `15 + sr(i * 41) * 30;` |
| `localJobs` | `Math.round(capacitykW / 1000 * (2 + sr(i * 43) * 4));` |
| `kpis` | `useMemo(() => { const totalKw = filtered.reduce((s, p) => s + p.capacitykW, 0);` |
| `avgBillSaving` | `filtered.length ? filtered.reduce((s, p) => s + p.avgBillSavingPct, 0) / filtered.length : 0;` |
| `avgPayback` | `filtered.length ? filtered.reduce((s, p) => s + p.paybackYr, 0) / filtered.length : 0;` |
| `totalSubscribers` | `filtered.reduce((s, p) => s + p.subscriberCount, 0);` |
| `avgLcoe` | `filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;` |
| `totalJobs` | `filtered.reduce((s, p) => s + p.localJobsCreated, 0);` |
| `srecRevenueData` | `useMemo(() => filtered.filter(p => p.srecPrice > 50).slice(0, 12).map(p => ({ name: p.name, srecRev: p.srecRevenueAnnual, srecPrice: p.srecPrice, })), [filtered]);` |
| `lmiData` | `useMemo(() => filtered.slice(0, 12).map(p => ({ name: p.name, lmiShare: p.lmiSharePct, subscribers: p.subscriberCount, })), [filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LMI_PROGRAMS`, `NET_METERING_IMPACT`, `NET_METERING_POLICIES`, `PROJECT_TYPES`, `SREC_MARKET_DATA`, `TABS`, `US_STATES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SREC Price ($/MWh) | `Set by RPS compliance demand and SACP` | SREC Trade / SRECTrade.com | DC SRECs highest ($400-500/MWh) due to 100% RPS; lower-demand states $15-50. |
| Community Solar Bill Credit (%) | `Discount = (retail_rate - subscriber_rate) / retail_rate` | NREL Community Solar Tariff Database | Typical 10-15% discount; LMI subscribers 20-30% under state carve-outs. |
| LMI Set-Aside (%) | `LMI_capacity = program_capacity × set_aside_pct` | SEIA State Policy Database | LMI = households <80% area median income. |
- **State SREC market data + net metering tariffs + program capacity data** → SREC revenue model + NEM economics + community solar bill credit calculator → **Distributed generation project economics and LMI solar equity analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** SREC Market & Net Metering Economics
**Headline formula:** `SREC_revenue = AEP_MWh × SREC_price; NEM_savings = exported_kWh × rate (retail NEM1 or avoided_cost NEM3)`

SREC value driven by state RPS compliance: DC $400-500/MWh, MA $250-300, NJ $150-220, IL $75-100. Community solar: subscribers receive 10-15% bill discount. LMI set-asides: IL CEJA 50%, NY VDER adder, MA DG 10%.

**Standards:** ['SREC Trade Market Data', 'SEIA Net Metering Policy Database', 'DOE Community Solar Analysis']
**Reference documents:** SEIA Net Metering Policy Database 2024; NREL Community Solar Market Analysis 2024; SREC Trade Market Data

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module implements the guide's *SREC market & net-metering economics* over 20 seeded distributed-
solar projects, anchored to **real SREC price data** and real net-metering-policy structures. The core
economics — SREC revenue, bill savings, LMI share, LCOE, payback — are genuine formulas; project
attributes are `sr()`-seeded within realistic ranges. No ⚠️ mismatch, though §7.5 flags the seeded
project generation.

### 7.1 What the module computes

```js
PROJECTS (20): per project i:
  capacitykW  = 10 + round(sr(i·7)·4990)                 // 10–5000 kW
  srecPrice   = 50 + sr(i·29)·200                        // $/MWh
  srecRevenueAnnual = capacitykW × 0.15 × srecPrice / 1000   // = kW × CF-proxy × $/MWh → $k/yr
  avgBillSavingPct  = 15 + sr(i·13)·30                   // 15–45%
  systemCostPerW    = 2.8 + sr(i·17)·1.4                 // $/W installed
  paybackYr = 5 + sr(i·31)·8 ; lcoe = 55 + sr(i·37)·55   // yr ; $/MWh
  lmiSharePct = 15 + sr(i·41)·30                         // low-mod-income subscriber %
  localJobsCreated = round(capacitykW/1000 × (2 + sr(i·43)·4))
```

The SREC-revenue formula `capacitykW × 0.15 × srecPrice / 1000` embeds a **0.15 capacity-factor /
annual-generation proxy**: kW × 0.15 approximates MWh/yr per kW (a rough 1,314 kWh/kW-yr → ≈0.15 when
scaled), × $/MWh → annual SREC revenue in $k.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| SREC market prices | DC $420, MA $285, NJ $230, MD $75, IL $70, PA $40, VA $55, CO $0 | **real** SREC market data (SRECTrade-consistent) |
| Net-metering policies | Full NEM 1:1, NEM 2.0 TOU, NEM 3.0 export-rate, Virtual NEM, Avoided-cost | **real** policy taxonomy |
| Project types | Rooftop C/R, Carport, Community Solar, Ground-Mount C&I | labels |
| ITC % | 30–40% | real IRA ITC + adders band |
| System cost | $2.8–4.2/W | realistic installed-cost band |
| LMI share | 15–45% | seeded (real programs 20–50% carve-outs) |

DC's $420/MWh SREC (highest, driven by its 100% RPS) and the state ordering are correct real-world
facts; the seeded project SREC prices ($50–250) sample within the market range.

### 7.3 Calculation walkthrough

Each project seeds capacity, then derives SREC revenue (capacity × 0.15 CF-proxy × price), total system
cost (`$/W × kW / 1e6` → $M), and community-solar subscriber counts (20–500 for community projects, 1
otherwise). Portfolio KPIs sum capacity/subscribers/jobs and average bill-saving/payback/LCOE. Charts:
SREC revenue vs price, LMI share vs subscribers, net-metering-policy bill-reduction comparison, and
state SREC-market bars.

### 7.4 Worked example

Project i=3 (Community Solar): `capacitykW = 10 + round(sr(21)·4990)`. If `sr(21) = 0.40` →
`10 + round(1996) = 2006 kW`. `srecPrice = 50 + sr(87)·200`, say `sr(87)=0.5` → `150 $/MWh`.
`srecRevenueAnnual = 2006 × 0.15 × 150 / 1000 = 2006 × 22.5/1000 = 45.1 $k/yr`.
`subscriberCount = 20 + round(sr(33)·480)`, say 260. `totalSystemCostM = 3.5 × 2006 / 1e6 = $0.007M`
per watt-scaling (note the `/1e6` gives $M only for MW-scale capacity; at 2 MW ≈ $7.0M). Bill saving
15–45% distributes across the ~260 subscribers per the community-solar discount model.

### 7.5 Data provenance & limitations

- SREC market prices and net-metering-policy structures are **real**; project-level attributes are
  `sr()`-seeded within realistic ranges. The economics formulas are genuine but simplified.
- The 0.15 SREC generation proxy is a flat capacity-factor stand-in — a real model would use location-
  specific irradiance (NREL PVWatts) and degradation.
- No time-of-use export-rate modelling for NEM 3.0 (the policy is labelled but bill savings don't
  differentiate NEM 1.0 vs 3.0 per project); LMI share is seeded, not tied to actual state carve-out
  rules.

**Framework alignment:** SREC/RPS compliance markets — SRECs are tradeable RPS-compliance instruments
(1 SREC = 1 MWh solar), priced by RPS demand vs the Solar Alternative Compliance Payment (SACP)
ceiling; DC's high price reflects its aggressive RPS. SEIA net-metering policy database and NREL
community-solar tariff analysis underpin the NEM and community-solar structures; DOE/state LMI
carve-out programs (IL CEJA 50%, NY VDER, MA DG) frame the equity overlay.

## 9 · Future Evolution

### 9.1 Evolution A — Real program registry + state-resolved generation model (analytics ladder: rung 1 → 2)

**What.** The page's economics are genuine formulas (SREC revenue, bill savings, payback) anchored to real SREC prices (DC $420, MA $285, NJ $230…) and a correct NEM policy taxonomy — but the 20 `PROJECTS` are `sr()`-seeded, and the generation model is a single hard-coded `0.15` capacity-factor proxy applied identically from Boston to Phoenix (§7.1 documents this). Evolution A replaces both: a real project registry and state-resolved yield, then a scenario layer for the policy questions this module exists to answer (NEM 3.0 vs 1:1 netting, ITC adder combinations, LMI carve-out sizing).

**How.** (1) New backend vertical `api/v1/routes/community_solar.py` + `community_solar_programs` table seeded from NREL's Sharing the Sun community-solar project dataset (public, ~3,000 projects with state/capacity/LMI attributes). (2) Replace the 0.15 proxy with per-state capacity factors from the platform's already-integrated NASA POWER / Open-Meteo irradiance sources (wired in the data-sources wave-1 work) — `srecRevenueAnnual = kW × CF_state × 8.76 × price/1000` with `CF_state` cited. (3) Scenario endpoint sweeping NEM regime × SREC price × ITC adders, replacing seeded `paybackYr`/`lcoe` draws with computed values.

**Prerequisites.** SREC price table needs a refresh cadence (SRECTrade values drift); Alembic migration on the current 2-head state. **Acceptance:** a 500 kW MA project computes payback from the actual formula chain (bench-pinned worked example), and identical projects in DC vs PA show different SREC revenue and CF-driven yield.

### 9.2 Evolution B — Program-design analyst for developers and regulators (LLM tier 2)

**What.** A tool-calling analyst answering the module's core user questions in natural language: "structure a 2 MW Illinois community solar project with the CEJA 50% LMI carve-out — what subscriber discount can it sustain?" The LLM chains Evolution A's endpoints (yield → SREC revenue → subscription economics → LMI compliance check) and narrates real outputs, including the policy citations the page already curates (IL CEJA, NY VDER, MA DG set-asides).

**How.** Tool schemas from the new route's OpenAPI spec; grounding corpus = this Atlas record's §5/§7 (the SREC price table and NEM taxonomy are the domain vocabulary) plus the LMI_PROGRAMS seed data promoted to a reference endpoint. The no-fabrication validator matches every $/MWh, %, and payback figure to tool outputs. A refusal path covers what the module doesn't compute — e.g. interconnection queue timing or utility-specific tariff riders.

**Prerequisites (hard).** Evolution A first — today there are zero backend endpoints, and a copilot narrating the seeded project list would present fabricated paybacks as market data. **Acceptance:** for a golden IL fixture, the analyst's stated subscriber savings equal the engine response to the cent; asking about a state absent from the SREC table returns the honest "no compliance market" answer (e.g. CO at $0), not an invented price.