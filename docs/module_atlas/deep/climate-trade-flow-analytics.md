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
