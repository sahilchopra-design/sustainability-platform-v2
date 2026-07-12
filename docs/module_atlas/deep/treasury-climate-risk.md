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
