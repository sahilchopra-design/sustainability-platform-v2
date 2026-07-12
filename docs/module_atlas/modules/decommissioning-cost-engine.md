# Decommissioning Cost Engine
**Module ID:** `decommissioning-cost-engine` · **Route:** `/decommissioning-cost-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CK4 · **Sprint:** CK

## 1 · Overview
8 asset types with unit decommissioning costs, funding gap analysis, and regulatory bond requirements.

**How an analyst works this module:**
- Liability Overview shows total by asset type
- Funding Gap Analysis compares provisions vs estimates
- Regulatory Requirements shows jurisdiction-specific bond mandates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_TYPES`, `Badge`, `Card`, `JURISDICTIONS`, `KPI`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_TYPES` | 9 | `unit`, `low`, `mid`, `high`, `count`, `totalCapacity`, `provision`, `jurisdiction` |
| `JURISDICTIONS` | 6 | `regulator`, `requirement`, `deadline`, `strictness` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `costs` | `useMemo(()=>ASSET_TYPES.map(a=>({...a,estimated:calcCost(a,costScenario),inflated:Math.round(calcCost(a,costScenario)*Math.pow(1+inflationRate/100,planYear-2026)),gap:Math.max(0,calcCost(a,costScenario)-a.provision)})),[` |
| `totalEstimated` | `costs.reduce((s,c)=>s+c.estimated,0);` |
| `totalProvision` | `costs.reduce((s,c)=>s+c.provision,0);` |
| `totalGap` | `Math.max(0,totalEstimated-totalProvision);` |
| `totalInflated` | `costs.reduce((s,c)=>s+c.inflated,0);` |
| `timelineData` | `useMemo(()=>Array.from({length:20},(_, i)=>{ const yr=2026+i; return { year:yr, cumCost:Math.round(totalEstimated*(1-Math.exp(-0.15*(i+1)))*Math.pow(1+inflationRate/100,i)), provision:Math.round(totalProvision*(1+0.05*i)` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `JURISDICTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Liability | `Portfolio aggregate` | Model | Across all 8 asset types |
| Funding Gap | `Liability - Provision` | Model | 38% underfunded |

## 5 · Intermediate Transformation Logic
**Methodology:** Decommissioning liability estimation
**Headline formula:** `Liability = Units × CostPerUnit; Gap = Liability - CurrentProvision`

Costs: coal plant ($50-150/kW), nuclear ($500-1000/kW), oil platform ($10-50M), pipeline ($1-5M/km). Funding gap between current balance sheet provisions and estimated costs.

**Standards:** ['National regulations', 'IEA']
**Reference documents:** National Decommissioning Regulations; IEA Decommissioning Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module implements its guide faithfully — a **real deterministic ARO (asset-retirement-obligation)
cost model**: `Liability = Units × CostPerUnit`, `Gap = Liability − Provision`, plus inflation
compounding and a timeline decay curve. No PRNG drives the numbers; asset unit costs and provisions
are curated static inputs. No ⚠️ mismatch.

### 7.1 What the module computes

```js
calcCost(asset, scenario):
  unitCost = asset[scenario]            // low | mid | high $/unit
  if unit == '$/kW':  return round(unitCost × totalCapacity / 1000)   // kW→ capacity, /1000 → $M
  else:               return round(unitCost × totalCapacity)          // $M/km or $M/unit

estimated = calcCost(asset, scenario)
inflated  = round(estimated × (1 + inflation/100)^(planYear − 2026))  // real→nominal compounding
gap       = max(0, estimated − provision)
totalGap  = max(0, Σestimated − Σprovision)
```

### 7.2 Asset parameterisation

| Asset | unit | low / mid / high | count | capacity | provision ($M) | jurisdiction |
|---|---|---|---|---|---|---|
| Coal Plant | $/kW | 50 / 100 / 150 | 12 | 8,400 | 420 | Multi |
| Nuclear Plant | $/kW | 500 / 750 / 1000 | 4 | 4,200 | 2,100 | NRC/ONR |
| Oil Platform | $M/unit | 10 / 30 / 50 | 18 | 18 | 280 | BSEE/OPRED |
| Gas Pipeline | $M/km | 1 / 3 / 5 | 6 | 1,200 | 1,800 | PHMSA/HSE |
| Oil Refinery | $M/unit | 80 / 200 / 400 | 5 | 5 | 520 | EPA/EA |
| LNG Terminal | $M/unit | 50 / 120 / 250 | 3 | 3 | 180 | FERC |
| Gas Power Plant | $/kW | 20 / 40 / 70 | 15 | 12,000 | 240 | Multi |
| Cement Plant | $M/unit | 15 / 35 / 60 | 8 | 8 | 140 | EPA/EA |

Unit-cost ranges align with the guide's provenance: coal $50–150/kW, nuclear $500–1000/kW, oil
platform $10–50M, pipeline $1–5M/km — plausible industry decommissioning benchmarks. Jurisdiction
strictness scores (US 85, EU 92, UK 88, AU 78, CA 82) are curated in `JURISDICTIONS`.

### 7.3 Calculation walkthrough

For each asset, `calcCost` picks the scenario unit cost and multiplies by capacity (with `/1000` for
$/kW so the answer is $M). `inflated` compounds `estimated` forward `planYear − 2026` years at the
slider inflation rate. `gap` floors at 0. Portfolio KPIs sum across the 8 assets; the funding-gap %
is `100 × totalGap / totalEstimated`. The **timeline** curve models cumulative spend as
`totalEstimated × (1 − e^(−0.15(i+1))) × (1+inflation)^i` — an exponential-approach retirement
schedule (fastest early, asymptotes to full liability), against provisions growing linearly at 5%/yr.

### 7.4 Worked example

Coal Plant, mid scenario, 4% inflation, plan year 2030:
- `unitCost = 100 $/kW`, `capacity = 8400` → `estimated = round(100 × 8400 / 1000) = $840M`.
- `inflated = 840 × (1.04)^(2030−2026) = 840 × 1.04^4 = 840 × 1.1699 = $983M`.
- `gap = max(0, 840 − 420) = $420M` (50% unfunded).
Nuclear mid: `750 × 4200 / 1000 = $3,150M` estimated, provision 2,100 → gap $1,050M. Summing all 8
assets' estimated vs provision gives the portfolio funding gap the KPI reports (guide illustration:
~$8.2B liability, ~$3.1B gap ≈ 38% unfunded).

### 7.5 Data provenance & limitations

- Asset unit costs, counts, capacities and provisions are **curated static demo values** (no live
  balance-sheet feed); ranges are anchored to public decommissioning benchmarks but the specific
  portfolio is illustrative.
- Inflation is a single flat rate applied uniformly — real AROs use asset-specific escalation and a
  credit-adjusted risk-free discount rate (IFRS/US-GAAP ARO accounting discounts the liability to PV;
  this model compounds *forward* to nominal cost without discounting back).
- The 0.15 decay constant and 5%/yr provision growth in the timeline are illustrative shape
  parameters, not calibrated schedules.

**Framework alignment:** IAS 37 / ASC 410-20 (Asset Retirement Obligations) — the Liability = cost,
Gap = cost − provision framing mirrors ARO accounting, though a compliant model would recognise the
liability at present value using a credit-adjusted risk-free rate and accrete it over time. National
regimes (US EPA/NRC/BSEE financial-assurance bonds, UK OPRED decommissioning security agreements, EU
IED permit-surrender, OSPAR offshore obligations) drive the jurisdiction strictness overlay — these
determine the *bonding* requirement the funding gap must ultimately be secured against.

## 9 · Future Evolution

### 9.1 Evolution A — Asset-level liability register with discounting and cost escalation (analytics ladder: rung 1 → 2)

**What.** EP-CK4 is one of the thinnest pages in this slice: a tier-B display over
curated unit-cost ranges (coal $50–150/kW, nuclear $500–1000/kW, platforms
$10–50M, pipelines $1–5M/km) computing the two-line arithmetic
`Liability = Units × CostPerUnit; Gap = Liability − Provision`, plus a
jurisdiction table of regulatory bond mandates. No endpoints, no engine, zero
blast radius. The honest evolution is scoped small: make the arithmetic
asset-specific and time-aware rather than pretending toward a decommissioning
science the page doesn't attempt.

**How.** (1) Asset register: user-entered assets (type, capacity/length, retirement
year, current provision) persisted to a small vertical — the module's first real
data. (2) Time value: decommissioning liabilities are long-dated — present-value
the estimated cost from the retirement year at a user discount rate, with a
documented cost-escalation assumption (decommissioning inflation historically
outruns CPI; cite the range, let the user set it). This turns the gap analysis
into the ARO (asset-retirement-obligation) accounting shape practitioners
actually use. (3) Unit-cost provenance: attach citations to the curated ranges
(NEA for nuclear, BSEE/industry studies for platforms) and expose low/mid/high
cost cases rather than a point. (4) Funding trajectory: given a sinking-fund
contribution rate, does the provision reach the PV liability by retirement —
a closed-form check per asset, feeding the bond-requirement comparison per
jurisdiction.

**Prerequisites.** Cost-range citation pass; the small persistence schema. This
page's atlas record is thin — scope discipline matters more than ambition here.
**Acceptance:** a hand-computed PV case reproduces (units × unit cost, escalated
to retirement, discounted back); the gap flips sign when the discount rate
crosses the implied break-even; each cost range shows its source.

### 9.2 Evolution B — Jurisdiction-requirements explainer (LLM tier 1)

**What.** The module's most decision-relevant content is the jurisdiction table of
bond/financial-assurance mandates — regulatory text territory where users need
interpretation: "what financial assurance does my UK North Sea platform require,
and does my current provision structure qualify?" Evolution B answers from the
curated jurisdiction rows plus this Atlas record, comparing the (post-Evolution A)
computed PV liability and funding trajectory against the stated mandate — always
labelling the jurisdiction summaries as curated overviews requiring legal
confirmation, since decommissioning security regimes are negotiated
case-by-case.

**How.** Tier-1 RAG over the jurisdiction table and the module's computed asset
state; no endpoints exist, so tool-calling waits on the Evolution A vertical. The
disclaimer discipline is the design: this copilot summarizes and compares, it does
not render legal opinions — a stated scope boundary in the system prompt, mirrored
in every answer touching a mandate.

**Prerequisites.** Evolution A's register and PV computation (comparisons need a
computed liability); jurisdiction-table citation pass. **Acceptance:** answers
quote the jurisdiction row verbatim before interpreting; funding-adequacy claims
match the computed trajectory; every mandate answer carries the
legal-confirmation caveat.