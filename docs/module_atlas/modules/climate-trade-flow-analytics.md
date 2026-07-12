# Climate Trade Flow Analytics
**Module ID:** `climate-trade-flow-analytics` · **Route:** `/climate-trade-flow-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DN5 · **Sprint:** DN

## 1 · Overview
Analyses the impact of climate policies, carbon pricing, and physical climate risks on global trade flows. Models CBAM-driven trade pattern shifts, carbon leakage dynamics, supply chain reshoring economics, and emerging trade corridor opportunities in clean energy goods.

> **Business value:** Essential for multinational companies with CBAM-exposed import supply chains, trade finance banks, and export-oriented manufacturers in CBAM-affected industries. Provides CBAM cost modelling and clean energy trade opportunity sizing for supply chain strategy.

**How an analyst works this module:**
- Select import category and origin country for CBAM modelling
- Calculate CBAM cost uplift by carbon price scenario
- Model trade flow reallocation using price elasticities
- Analyse clean energy goods trade opportunity
- Generate WTO-compatible climate trade risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CBAM_SECTORS`, `COMMODITIES`, `CORRIDORS`, `KpiCard`, `REGIONS_FROM`, `REGIONS_TO`, `RISK_LEVELS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMMODITIES` | `['Steel', 'Aluminium', 'Cement', 'Chemicals', 'Fertilisers', 'Electricity', 'Hydrogen', 'Petroleum', 'Plastics', 'Paper/Pulp'];` |
| `totalTradeValue` | `useMemo(() => CORRIDORS.reduce((a, c) => a + c.tradValueBn, 0), []);` |
| `totalCbamCost` | `useMemo(() => CORRIDORS.filter(c => c.cbamExposure).reduce((a, c) => a + c.cbamCostMn, 0), []);` |
| `totalCarbonContent` | `useMemo(() => CORRIDORS.reduce((a, c) => a + c.carbonContentMtco2e, 0), []);` |
| `cbamCorridorCount` | `useMemo(() => CORRIDORS.filter(c => c.cbamExposure).length, []); const avgCarbonPrice = useMemo(() => CORRIDORS.reduce((a, c) => a + c.carbonPrice, 0) / Math.max(1, CORRIDORS.length), []);` |
| `highLeakageCount` | `useMemo(() => CORRIDORS.filter(c => c.leakageRisk > 7).length, []);  const commodityBreakdown = useMemo(() => COMMODITIES.map(com => { const cors = CORRIDORS.filter(c => c.commodity === com);` |
| `fromRegionBreakdown` | `useMemo(() => REGIONS_FROM.map(r => {` |
| `cost` | `cors.reduce((a, c) => a + c.cbamCostMn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_SECTORS`, `COMMODITIES`, `REGIONS_FROM`, `REGIONS_TO`, `RISK_LEVELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBAM Coverage | — | European Commission CBAM Assessment 2023 | CBAM covers €35Bn of annual EU imports across 5 sectors — expanding to all ETS sectors by 2034 |
| Clean Energy Trade Growth | — | IEA Renewable Supply Chain 2023 | Global trade in clean energy goods growing 30% annually — solar panels, EVs, batteries, heat pumps |
| Carbon Leakage Risk | — | IPCC AR6 WGIII Chapter 13 | Without CBAM, unilateral carbon pricing causes 5–20% carbon leakage to non-priced jurisdictions |
- **EU Customs trade data (COMEXT) by product and origin** → CBAM exposure calculation → **Import-level CBAM cost by sector and origin country**
- **IEA clean energy technology demand by sector** → Clean trade opportunity → **Export opportunity sizing for clean energy goods by country**
- **Carbon price data by jurisdiction (ICAP)** → CBAM net cost calculation → **Net CBAM cost after domestic carbon price credit by origin**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM Trade Flow Impact
**Headline formula:** `CBAMcost_import = Scope1_tCO2e × (EU_ETS_price - CarbonPricePaid_origin); TradePatternShift = f(CBAMcost, TradeElasticity, Alternatives)`

CBAM cost directly reduces competitiveness of high-carbon imports; trade elasticity determines reallocation to lower-carbon or domestic sources; clean energy goods trade modelled using IEA transition demand signals

**Standards:** ['EU CBAM Regulation 2023/956', 'WTO Climate Trade Nexus Report 2022', 'IMF World Economic Outlook — Trade and Climate 2023', 'UNCTAD Trade and Climate Change Report 2023']
**Reference documents:** EU Carbon Border Adjustment Mechanism — Regulation (EU) 2023/956; WTO — Trade and Climate Change (2022); UNCTAD Trade and Climate Change Report 2023; IMF World Economic Outlook Chapter — Climate Policies and Trade (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module (EP-DN5) models **CBAM cost and carbon-leakage** across trade corridors. The guide's
`CBAMcost = Scope1_tCO₂e × (EU_ETS_price − CarbonPricePaid_origin)` is the intended engine; the page works
off a curated `CORRIDORS` dataset (carbon content, CBAM cost, leakage risk pre-computed per corridor) and
aggregates it — it does not recompute CBAM per shipment from ETS price minus origin carbon price at runtime.

### 7.1 What the module computes

The page aggregates a corridor dataset:
```js
totalTradeValue    = Σ CORRIDORS.tradValueBn
totalCbamCost      = Σ (cbamExposure ? cbamCostMn : 0)
totalCarbonContent = Σ carbonContentMtco2e
cbamCorridorCount  = count(cbamExposure)
avgCarbonPrice     = Σ carbonPrice / max(1, CORRIDORS.length)
highLeakageCount   = count(leakageRisk > 7)
```
Breakdowns by commodity and origin region:
```js
commodityBreakdown : per COMMODITY → Σ tradeValue, Σ cbamCost, mean leakage
fromRegionBreakdown: per origin region → Σ cost = Σ cbamCostMn
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `CORRIDORS` (tradValueBn, cbamExposure, cbamCostMn, carbonContentMtco2e, carbonPrice, leakageRisk, commodity, origin) | dataset | curated demo (EU import corridors) |
| `COMMODITIES` (10: Steel…Paper/Pulp) | constant | CBAM-covered + adjacent goods |
| High-leakage threshold | `leakageRisk > 7` (of 10) | heuristic |
| CBAM cost | stored `cbamCostMn` | curated per corridor |

Guide anchors: CBAM covers ~€35B EU imports (5 sectors → all ETS by 2034); leakage 5–20% of abatement
(IPCC AR6 WGIII Ch.13); clean-energy goods trade +30% yr/yr (IEA).

### 7.3 Calculation walkthrough

`CORRIDORS` filtered by CBAM exposure → totals summed with a `max(1, length)` divide-guard on averages →
commodity and origin-region roll-ups → high-leakage corridors flagged. The user selects import category /
origin to focus the CBAM cost and clean-trade-opportunity views.

### 7.4 Worked example

A steel corridor: `carbonContent = 2.0 MtCO₂e`, EU-ETS €90/t, origin carbon price €10/t (implied in the
stored `cbamCostMn`):
```
CBAMcost = 2,000,000 t × (90 − 10) €/t = €160M
```
matching a stored `cbamCostMn ≈ 160`. If this corridor's `leakageRisk = 8 (>7)` it is counted in
`highLeakageCount`; its €160M flows into both the steel `commodityBreakdown` and the origin region's
`fromRegionBreakdown.cost`. Summed with peer corridors it drives `totalCbamCost`.

### 7.5 Data provenance & limitations

- The corridor dataset is **curated demo data**; CBAM cost and carbon content are stored, not recomputed
  from live ETS prices and shipment-level embedded emissions.
- No trade-elasticity reallocation is actually solved — the guide's `TradePatternShift = f(CBAMcost,
  elasticity, alternatives)` is descriptive; the page shows cost and leakage, not the equilibrium shift.
- Origin carbon-price credit is embedded in stored `cbamCostMn`, not applied via a live ICAP price table.

**Framework alignment:** EU CBAM Regulation (EU) 2023/956 (cost = embedded emissions × ETS-minus-origin
price) · WTO Trade & Climate Change / GATT Art. XX(b) compliance framing · IPCC AR6 WGIII Ch.13 (5–20%
leakage) · IEA renewable supply-chain (clean-trade growth) · ICAP carbon-price database (origin credit).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute shipment-level CBAM liability and model trade reallocation under carbon
pricing, for CBAM-exposed importers, trade-finance banks and exporters.

**8.2 Conceptual approach.** A **partial-equilibrium trade model** with embedded-emissions CBAM cost and CES
import substitution driven by price elasticities — the standard IMF/UNCTAD CBAM impact approach — combined
with an ICAP origin-carbon-price credit.

**8.3 Mathematical specification.**
```
CBAM_cost_ijk = EmbeddedEmissions_ijk · (P_ETS − P_origin_j)      (good k, origin j, importer i)
ΔPrice_ijk = CBAM_cost_ijk / Value_ijk
ImportShare_new = ImportShare_old · (1 + ΔPrice)^(−ε_k)  / Σ_j (…)   (CES reallocation, elasticity ε_k)
Leakage = Σ (production shifted to unpriced origins) / total abatement
```

| Parameter | Source |
|---|---|
| Embedded emissions | CBAM default values / installation reports; CEDA/Exiobase MRIO |
| P_ETS, P_origin | EU-ETS spot; ICAP carbon-price database |
| Trade elasticity ε_k | GTAP / CEPII trade elasticities |
| Trade flows | EU COMEXT customs data |

**8.4 Data requirements.** Import volume × value × origin × HS code; embedded-emission factors; ETS/origin
prices; elasticities. Free: COMEXT, ICAP, GTAP; platform: CBAM reference data (`reference_data`).

**8.5 Validation & benchmarking.** Reconcile CBAM liability against EC €35B coverage estimate; backtest
reallocation vs observed post-2023 trade shifts; leakage vs IPCC 5–20%.

**8.6 Limitations & model risk.** Embedded-emission data quality; static elasticities; general-equilibrium
feedbacks omitted. Fallback: default embedded-emission factors and zero-substitution (pure cost pass-through)
when elasticities are unavailable.

## 9 · Future Evolution

### 9.1 Evolution A — Live CBAM recomputation from Comtrade flows and ICAP prices (analytics ladder: rung 1 → 2)

**What.** EP-DN5 aggregates a curated `CORRIDORS` dataset in which CBAM cost, carbon
content, and leakage risk are *stored* per corridor — §7 notes the page "does not
recompute CBAM per shipment from ETS price minus origin carbon price at runtime", and
the guide's `TradePatternShift = f(CBAMcost, elasticity, alternatives)` is never
solved. Evolution A computes both: corridor CBAM cost from real trade values and a
live price spread, and a first-order elasticity reallocation showing where flows move.

**How.** (1) The platform already has UN Comtrade wired in (data-sources wave 1) — pull
bilateral flows for the 10 CBAM-adjacent `COMMODITIES` into a `trade_corridor_flows`
table, replacing stored `tradValueBn`. (2) Carbon content = flow tonnage × default
embedded intensities from EU Reg 2023/956 Annex values (the sibling
`climate-transition-risk` page already carries a `CBAM_META` intensity map — reuse the
constants, not the page). (3) Origin carbon-price credit from a curated ICAP price
table (small, public, versioned) so `CBAMcost = tCO₂e × (EU_ETS − origin_price)`
computes live; the free-allocation phase-in (2026–34) becomes a scenario slider.
(4) Reallocation: constant-elasticity substitution across alternative origins with
documented Armington elasticities per commodity — a scenario tool, honestly labelled,
not an equilibrium model.

**Prerequisites.** Comtrade rate limits respected via the ingestion framework; ICAP
table needs a refresh owner. **Acceptance:** the §7.4 steel example (2 MtCO₂e ×
€80 spread = €160M) reproduces from ingested inputs; toggling the phase-in year
changes corridor costs; every corridor shows its price-spread provenance.

### 9.2 Evolution B — CBAM exposure copilot for import books (LLM tier 1 → 2)

**What.** A copilot for the module's stated users — CBAM-exposed importers and trade
finance banks — that answers "what does CBAM cost my steel imports from origin X, and
where should I re-source?" grounded in the corridor data and EU Reg 2023/956 mechanics
(scope, phase-in, origin-credit rules) that §5 cites. After Evolution A, "what if the
ETS hits €120?" becomes a parameter change against the live recomputation rather than
a static table lookup.

**How.** Tier 1: RAG over this Atlas record plus the CBAM regulation reference text in
the corpus (the refdata layer already holds regulatory catalogs; add the CBAM Annex I
product scope). The copilot must disclose that leakage-risk scores are curated
assessments. Tier 2 requires Evolution A's endpoints — tool calls for corridor
recompute and elasticity what-ifs, with the fabrication validator checking every €M
figure against tool output. Report generation ("WTO-compatible climate trade risk
report", already promised in the workflow) renders through the report-studio layer.

**Prerequisites.** Evolution A for tier 2; regulation text ingestion for tier 1.
**Acceptance:** copilot correctly states which of a user's named commodities are in
CBAM scope (Annex I) with citation; declines to estimate shipment-level embedded
emissions it has no data for, offering the default-intensity path instead.