# Corporate Treasury Climate Risk Analytics
**Module ID:** `treasury-climate-risk` · **Route:** `/treasury-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DD5 · **Sprint:** DD

## 1 · Overview
Corporate treasury climate risk analytics covering FX exposure to climate-stressed economies, commodity price climate sensitivity, liquidity risk from physical events, climate VaR for treasury portfolio, and TCFD treasury disclosures.

> **Business value:** Provides integrated corporate treasury climate risk analytics augmenting conventional VaR with physical and transition risk multipliers, enabling TCFD-compliant climate treasury risk disclosure.

**How an analyst works this module:**
- Map treasury portfolio exposures (FX, commodity, interest rate, counterparty) to climate risk drivers
- Apply physical risk multipliers to FX positions in climate-exposed currencies (commodity-dependent, coastal economies)
- Model commodity price climate sensitivity under RCP 4.5 and 8.5 scenarios
- Calculate climate VaR uplift and liquidity buffer requirement; generate TCFD treasury risk disclosure

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMMODITIES`, `COUNTERPARTIES`, `CURRENCIES`, `NGFS_SCENARIOS`, `SUPPLY_CHAIN_NODES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CURRENCIES` | 9 | `country`, `climateVulnScore`, `hedgingCost` |
| `COMMODITIES` | 13 | `category`, `basePrice`, `climateSens`, `ngfs_nz`, `ngfs_cp`, `unit` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tier` | `Math.floor(i / 7.5) + 1;` |
| `climateRisk` | `20 + sr(i * 7) * 70;` |
| `climateRating` | `['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(sr(i * 7) * 5)];` |
| `pd1y` | `climateRating === 'AAA' ? 0.001 + sr(i * 11) * 0.002 : climateRating === 'AA' ? 0.002 + sr(i * 11) * 0.005 : climateRating === 'A' ? 0.005 + sr(i * 11) * 0.01 : climateRating === 'BBB' ? 0.01 + sr(i * 11) * 0.02 : 0.03 +` |
| `ead` | `1 + sr(i * 13) * 49;` |
| `totalEad` | `COUNTERPARTIES.reduce((s, c) => s + c.ead, 0);` |
| `totalClimateVaR` | `COUNTERPARTIES.reduce((s, c) => s + c.climateVaR, 0);` |
| `fxHedgingCost` | `+(selectedCurrency.hedgingCost * exposureAmount * scenarioMultiplier).toFixed(2);` |
| `avgPd` | `COUNTERPARTIES.length ? COUNTERPARTIES.reduce((s, c) => s + c.pd1y, 0) / COUNTERPARTIES.length : 0;` |
| `commodityPriceData` | `useMemo(() => COMMODITIES.map(c => {` |
| `pct` | `ngfsScenario === 'Net Zero 2050' ? c.ngfs_nz : ngfsScenario === 'Current Policies' ? c.ngfs_cp : (c.ngfs_nz + c.ngfs_cp) / 2;` |
| `cashFlowStress` | `useMemo(() => Array.from({ length: 8 }, (_, q) => { const yr = 2025 + Math.floor(q / 4);` |
| `qtr` | `(q % 4) + 1;` |
| `baseFlow` | `80 + sr(q * 7) * 40;` |
| `climateStress` | `baseFlow * (0.05 + sr(q * 11) * 0.15) * scenarioMultiplier;` |
| `hedgingData` | `useMemo(() => CURRENCIES.map(c => {` |
| `unhedgedVaR` | `c.climateVulnScore * exposureAmount * 0.002 * scenarioMultiplier;` |
| `hedgedVaR` | `unhedgedVaR * (0.1 + c.hedgingCost * 0.5);` |
| `hedgingCost` | `c.hedgingCost * exposureAmount * scenarioMultiplier;` |
| `netBenefit` | `unhedgedVaR - hedgedVaR - hedgingCost;` |
| `supplyChainByTier` | `useMemo(() => [1, 2, 3, 4].map(t => {` |
| `counterpartyRiskByRating` | `useMemo(() => ['AAA', 'AA', 'A', 'BBB', 'BB'].map(r => {` |
| `radarData` | `useMemo(() => [ { axis: 'FX Risk', score: +(selectedCurrency.climateVulnScore).toFixed(0) }, { axis: 'Commodity', score: +(COMMODITIES.slice(0, 3).reduce((s, c) => s + Math.abs(c.ngfs_nz), 0) / 3).toFixed(0) }, { axis: 'Supply Chain', score: +(SUPPLY_CHAIN_NODES.reduce((s, n) => s + n.climateRisk, 0) / Math.max(1, SUPPLY_CHAIN_NODES.lengt` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `CURRENCIES`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Adjusted Treasury VaR (95%) | `Conventional VaR × (1 + physical risk multiplier + transition risk multiplier)` | Internal treasury risk model + NGFS calibration | Climate multiplier adds 15-40% to conventional VaR for high-exposure corporate treasuries; discloses per TCFD recommendations |
| Commodity Climate Sensitivity | `Increase in commodity price volatility under RCP 4.5 physical risk scenario` | NGFS physical risk × commodity supply model | Agricultural and energy commodities most sensitive; metals relatively stable; hedging cost increases proportionally |
| Physical Event Liquidity Risk | `Estimated working capital disruption from 1-in-50yr physical climate event affecting key facilities` | RMS supply chain disruption model | Drives contingency liquidity requirement; increasingly relevant for climate-exposed supply chains and coastal assets |
- **Bloomberg FX and commodity data** → Historical and forward price data → conventional VaR baseline → **Standard treasury VaR**
- **NGFS climate scenarios and physical risk data** → Climate multipliers by exposure type and scenario → climate VaR adjustment → **Climate-adjusted VaR**
- **RMS supply chain disruption model** → Physical event probability × business interruption loss → liquidity gap analysis → **Contingency liquidity requirement**

## 5 · Intermediate Transformation Logic
**Methodology:** Treasury Climate VaR & Liquidity Risk
**Headline formula:** `Climate VaR = VaR_conventional × (1 + Climate Multiplier); Climate Multiplier = f(Physical Risk Score, Transition Risk Score, Concentration); Liquidity Risk = P(Physical Event) × Working Capital Disruption`

Augments conventional treasury VaR with climate multipliers derived from physical and transition risk scores, and models liquidity stress from physical climate events

**Standards:** ['TCFD Recommendations — Treasury Risk Management', 'IFRS S2 Climate-related Disclosures 2023', 'BIS Working Paper 627 (2017) — FX and Climate Risk']
**Reference documents:** TCFD (2021) Implementing TCFD Recommendations — Treasury and Risk Management Section; BIS (2020) Working Paper 899 — Climate Change and Financial Risk; Moody's (2023) Climate Risk in Corporate Treasury — Methodological Guidance; NGFS (2023) Climate Scenarios for Central Banks — Macro-Financial Models

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A corporate-treasury climate-risk dashboard spanning FX exposure, commodity price sensitivity,
supply-chain disruption, counterparty credit risk, and hedging analytics, all seeded once via
`sr(s)=frac(sin(s+1)×10⁴)` and re-scaled live by an NGFS scenario multiplier:

```
scenarioMultiplier = { 'Net Zero 2050': 1.8, 'Below 2°C': 1.4, 'NDC Scenario': 1.0, 'Current Policies': 0.5 }
fxHedgingCost      = currency.hedgingCost × exposureAmount × scenarioMultiplier
commodityAdj(t)    = basePrice × (1 + ngfsChangePct/100)
unhedgedVaR        = currency.climateVulnScore × exposureAmount × 0.002 × scenarioMultiplier
hedgedVaR          = unhedgedVaR × (0.1 + currency.hedgingCost × 0.5)
netBenefit         = unhedgedVaR − hedgedVaR − hedgingCost
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `CURRENCIES` (8) | `climateVulnScore` 15–95, `hedgingCost` 0.02–1.2 (i.e. ~2%–120% scale) | Synthetic, directionally sensible ordering: USD/EUR/GBP/JPY lowest vulnerability, ZAR/INR/BRL highest — matches real-world intuition about commodity-dependent, physically-exposed emerging-market currencies |
| `COMMODITIES` (12) | `ngfs_nz` / `ngfs_cp` price change % under Net Zero / Current Policies | **Genuinely well-calibrated real-world directionality**: fossil fuels collapse under Net Zero (Crude −35%, Gas −42%, Coal −60%) while transition-critical materials surge (Lithium +85%, Carbon Credits +210%, Copper +25%) — consistent with IEA Critical Minerals and NGFS transition-risk literature on stranded fossil assets vs. clean-tech input demand |
| `SUPPLY_CHAIN_NODES` (30, 4 tiers) | `climateRisk` 20–90, `disruptionProb` linked to `climateRisk×0.008 + noise` | Synthetic, but `disruptionProb` is a genuine (if simple) linear function of `climateRisk`, not fully independent |
| `COUNTERPARTIES` (25) | `climateRating` (AAA–BB) → `pd1y` bucketed by rating | **Realistically calibrated PD term structure**: AAA 0.1–0.3%, AA 0.2–0.7%, A 0.5–1.5%, BBB 1–3%, BB 3–8% — broadly consistent with real 1-year corporate default-probability bands by rating |
| Scenario multiplier | 1.8× / 1.4× / 1.0× / 0.5× for NZ2050/Below2°C/NDC/Current Policies | Platform-defined; NDC Scenario is the implicit 1.0× calibration anchor |

### 7.3 Calculation walkthrough

1. **Portfolio KPIs**: `totalEad`, `totalClimateVaR` summed across the 25 counterparties;
   `highRiskNodes` counts supply-chain nodes with `climateRisk > 60`; `avgPd` is the simple mean 1yr
   PD across counterparties.
2. **Commodity price scenario adjustment**: for Net Zero 2050 or Current Policies, uses that
   scenario's own `ngfs_nz`/`ngfs_cp` percentage directly; for the other two scenarios (Below 2°C,
   NDC), uses the **midpoint** of the two extreme scenarios' percentages — a simplification (not an
   independently calibrated Below-2°C or NDC price path, just an interpolation between the two
   endpoints already in the data).
3. **Cash flow stress**: 8-quarter series, `climateStress = baseFlow × (5–20% random) ×
   scenarioMultiplier`, subtracted from a random baseline cash flow.
4. **Hedging analytics — unit-consistency issue**: `unhedgedVaR` uses a `×0.002` scalar on
   `climateVulnScore×exposureAmount`, while `hedgingCost` uses `currency.hedgingCost` (itself already
   a 2%–120%-scale figure) directly on `exposureAmount` with no comparable scalar. This produces
   **hedging costs that can exceed the VaR they are meant to reduce** — see the worked example below,
   where `netBenefit` comes out strongly negative at default settings, implying hedging is never
   worthwhile, which is not a plausible real-world treasury conclusion and likely reflects an
   unreconciled scaling constant between the two formulas rather than a genuine "hedging isn't worth
   it" finding.

### 7.4 Worked example (EUR, `exposureAmount=$100M`, NDC Scenario, `multiplier=1.0`)

| Step | Computation | Result |
|---|---|---|
| `climateVulnScore` | `20 + sr(3)×25` | **44.4** |
| `hedgingCost` (rate) | `0.08 + sr(4)×0.35` | **0.345** (34.5%) |
| FX hedging cost (nominal) | `0.345 × 100 × 1.0` | **$34.5M** |
| Unhedged VaR | `44.4 × 100 × 0.002 × 1.0` | **$8.88M** |
| Hedged VaR | `8.88 × (0.1 + 0.345×0.5)` | **$2.42M** |
| VaR reduction | `8.88 − 2.42` | $6.46M |
| Net benefit | `6.46 − 34.5` | **−$28.0M** |

At these default parameters, the module concludes that hedging EUR climate exposure destroys $28M
of value for only $6.5M of VaR reduction — an artefact of `hedgingCost` being interpreted as a
percentage-of-exposure cost in one formula (`fxHedgingCost`) but a raw multiplicative rate in the
`unhedgedVaR`/`hedgedVaR` formulas without a shared scale, rather than a genuine finding that
climate FX hedging is not economical.

### 7.5 Companion analytics

- **Supply Chain Stress tab** — 30 nodes across 4 tiers with `disruptionProb`, `leadTime`, and a
  `singleSource` flag (>60% PRNG threshold) for concentration risk.
- **Counterparty Climate Risk tab** — 25 counterparties with climate-adjusted `climateVaR = EAD ×
  (5%–20% random)`, i.e. climate VaR here is a flat random haircut on exposure rather than a
  PD×LGD×EAD-style credit-risk decomposition (contrast with the `climate-credit-integration` module,
  which does implement a genuine PD/LGD climate-conditioning model).
- **Regulatory Compliance tab** — references TCFD treasury risk-management disclosure practice.

### 7.6 Data provenance & limitations

- **All portfolio data is synthetic**, generated once via `sr()` — no real FX, commodity, supply
  chain, or counterparty data is ingested.
- **The hedging cost-benefit formula appears to contain a unit-scale defect** (see §7.4) that
  produces implausibly negative net benefits at default parameters — this is the kind of arithmetic
  a bank treasury model-validation review would flag for restatement (the two formulas using
  `hedgingCost` need to share a consistent basis, e.g. both expressed in bps of exposure).
- **Counterparty `climateVaR` is a flat exposure haircut**, not a PD/LGD/EAD credit-risk
  decomposition — a materially simpler treatment than the platform's own more rigorous credit-risk
  modules.
- Commodity price paths for Below 2°C and NDC scenarios are linear interpolations of the two
  extreme scenarios rather than independently NGFS-sourced trajectories.

### 7.7 Framework alignment

- **TCFD Treasury Risk Management guidance** and **IFRS S2**: cited as the governing disclosure
  frameworks for treasury climate risk; the module's structure (FX, commodity, counterparty,
  liquidity risk sections) matches what these frameworks expect firms to assess.
- **NGFS scenario framework**: scenario names and relative severity ordering (Net Zero 2050 highest
  near-term stress multiplier) are consistent with genuine NGFS scenario design principles.
- **Corporate credit rating / PD term structure**: the AAA→BB rating-to-PD mapping is a realistic,
  broadly correct simplification of published rating-agency default-rate tables.
- **BIS Working Papers on climate financial risk**: cited as supporting literature; the specific
  hedging cost-benefit formula is a platform construction, not sourced from BIS methodology.

## 9 · Future Evolution

### 9.1 Evolution A — Reconciled hedging economics and PD×LGD counterparty climate VaR (analytics ladder: rung 2 → 3)

**What.** The module already has genuine scenario mechanics (the 1.8/1.4/1.0/0.5 NGFS
multiplier re-scales all analytics live, and the 12-commodity `ngfs_nz`/`ngfs_cp`
table is well calibrated per §7.2), but §7.4 documents a real arithmetic defect: the
hedging cost-benefit formula mixes scales, so at default parameters hedging EUR
exposure shows −$28M net benefit — an artefact, not a finding. Evolution A fixes the
unit basis (express both `hedgingCost` and VaR terms in bps of exposure), replaces the
counterparty flat-haircut `climateVaR = EAD × random%` with the PD×LGD×EAD
decomposition the platform's own `climate-credit-integration` module already
implements (§7.5 draws the contrast), and sources Below-2°C/NDC commodity paths from
actual NGFS vintage data instead of midpoint interpolation.

**How.** (1) Move the corrected formulas into a backend `treasury_climate_engine`
(currently Tier B, all frontend) with `POST /var` and `POST /hedging-analysis`.
(2) Reuse the rating→PD term structure already in the page (§7.2 confirms it matches
published default-rate bands) as the calibration anchor. (3) Pin the worked EUR/$100M
example in `bench_quant` so the hedging sign defect can never regress.

**Prerequisites.** The §7.4 scaling defect acknowledged and fixed first — calibrating
on top of it would freeze the bug. **Acceptance:** at default parameters, hedging
net-benefit is positive for high-vulnerability currencies and the bench pin reproduces
the corrected worked example to the cent.

### 9.2 Evolution B — Treasury what-if analyst over live scenario tools (LLM tier 2)

**What.** A tool-calling analyst for treasury teams: "what happens to our liquidity
buffer if we're in Net Zero 2050 and Brent falls 35%?", "rank our 25 counterparties by
climate-adjusted PD and tell me which cross the BBB threshold". It executes these as
calls against Evolution A's `POST /var` and `POST /hedging-analysis` endpoints plus a
`GET /commodities` reference route exposing the calibrated NGFS sensitivity table, and
narrates real outputs — including drafting the TCFD treasury-risk disclosure paragraph
(the module's stated IFRS S2/TCFD deliverable) from computed figures only.

**How.** Tier-2 pattern: tool schemas from the module's OpenAPI operations, read-only
first; per-module system prompt built from this Atlas page, with §7.2's provenance
table included so the analyst correctly labels the counterparty book as synthetic demo
data. The no-fabrication validator checks each numeric against tool outputs; the
"show work" expander lists scenario multiplier and formula version used.

**Prerequisites (hard).** Evolution A must land first — there is no backend today
(Tier B, EP-DD5 frontend-computed), and the copilot must never narrate the current
defective hedging numbers. **Acceptance:** every figure in an answer traces to a tool
call; asked about a scenario the engine doesn't model (e.g. RCP 8.5 commodity paths),
the analyst states the module's scenario set and refuses to extrapolate.