## 7 · Methodology Deep Dive

This module implements its guide well: a **marginal-abatement-cost (MAC) roadmap** over a curated,
largely **real** dataset — 60 named corporates with genuine baselines/targets/investments and a 30-row
abatement-lever library with real per-lever cost ($/tCO₂) and abatement potentials. The MAC formula
`MAC = ΔCost / ΔEmissions` is represented by the levers' `costPerTon` field, and the SBTi 4.2 %/yr
reference and multi-pathway trend are present. The synthetic content is confined to a small
noise term on the pathway trend line. No ⚠️ mismatch on methodology.

### 7.1 What the module computes

```js
kpis: avgCarbonPrice = Σ c.carbonPrice / n
      totalInvest    = Σ c.investMn / 1000            // $Bn
      onTrack        = count(status ∈ {On Track, Ahead})
scenarioAbatement (what-if on a chosen lever):
      base    = lever.abatementBy2030
      factor  = (carbonPriceWif/100) × (adoptionWif/50)
      scenario = base × factor
INVESTMENT_DATA: roi = opexSavings / max(1,capexBn) × 100      // % ROI per sector
reductionPct (per corporate) = curated (baseline→current progress)
```

The corporate tracker filters/sorts 60 firms; the abatement tab ranks the 30 levers by `costPerTon`
(negative = net-saving) to form the MAC stack; the carbon-pricing tab plots 9-year ETS trajectories;
the scenario planner scales a lever's 2030 abatement by a carbon-price × adoption factor.

### 7.2 Parameterisation / data provenance

| Dataset | rows | key fields | provenance |
|---|---|---|---|
| `CORPORATES` | 60 | baseline, target2030/50, current, netZeroYear, sbti, carbonPrice, investMn, reductionPct | **real** company disclosures (Shell 1620→810 MtCO₂e 2030, Ørsted 10.5→0.84, Apple 25→10 …) |
| `ABATEMENT_LEVERS` | 30 | costPerTon (−35…420), potentialMtY, maturity, abatement 2030/2050 | industry MAC estimates (Solar+Storage −$35/t, DACCS +$420/t, SAF +$280/t) |
| `SECTOR_PROFILES` | 12 | co2Mt, targetMt, trlReadiness, capexBn, opexSavings, carbonPrice, decarb2030/50 | sector-level estimates |
| `CARBON_PRICE_SCENARIOS` | 9 | EU_ETS, UK_ETS, CA_CnT, RGGI, SBTi_Internal, NZ_Required | **real** ETS prints (EU ETS 2022 €78, 2023 €85…) + NZ-required glide |
| `MILESTONES` | 14 | Fit-for-55, CBAM, CSDDD, IMO GHG, CORSIA, ICE-ban 2035 | **real** policy calendar |

Lever `costPerTon` signs are economically correct: mature renewables and efficiency carry **negative**
MAC (net savings), while H₂-DRI (+120), CCUS (+65–80), SAF (+280), green ammonia (+220) and DACCS
(+420) are strongly positive — mirroring published McKinsey/IEA MAC curves.

### 7.3 Calculation walkthrough

Corporate KPIs aggregate the filtered set. The MAC stack sorts levers ascending by `costPerTon` and
accumulates `potentialMtY` to build the classic left-to-right abatement waterfall (cheapest first).
The pathway-analysis tab overlays five trajectories (Committed / Current Pace / 1.5 °C / 2 °C / Best
Practice) all indexed to 54,000 MtCO₂e and declining at scenario-specific slopes. `INVESTMENT_DATA`
computes ROI = OpEx savings ÷ CapEx per sector. The scenario planner reprices a single lever's 2030
abatement by the what-if carbon-price/adoption factor.

### 7.4 Worked example

**MAC stack**: sorting levers by `costPerTon` puts Solar+Storage (−$35), Onshore Wind (−$28), Waste
Methane (−$25), Corporate PPAs (−$20)… at the front (all net-saving), pushing SAF (+$280) and DACCS
(+$420) to the far right. Cumulative abatement after the first four = `8.4 + 7.2 + 1.2 + 1.2 = 18.0
MtCO₂/yr` at *negative* net cost — the "no-regret" wedge.

**Scenario planner**: lever = "Green Hydrogen DRI" (`abatementBy2030 = 0.2`), carbon-price what-if
150, adoption what-if 75:
`factor = (150/100) × (75/50) = 1.5 × 1.5 = 2.25`; `scenario = 0.2 × 2.25 = 0.45 MtCO₂/yr` — i.e. a
higher carbon price and adoption more than doubles the deployable 2030 abatement of H₂-DRI, capturing
the economic-signal → deployment link.

**Sector ROI**: Energy `opexSavings 3400 / capexBn 8200 × 100 = 41.5%`; Chemicals `1200/3800 = 31.6%`.

### 7.5 Data provenance & limitations

- Corporate baselines/targets, ETS prices, and the policy milestone calendar are **real**; the only
  synthetic touch is a small `sr()` noise term (`+ sr(i·7)·400`) on three of the pathway-trend series.
- The scenario-planner `factor` is a linear price×adoption scalar, not a supply-curve or elasticity
  model — a real deployment model would use a technology-specific price-response elasticity and a
  capacity-constraint ceiling.
- Lever MAC values are static point estimates (no learning-curve time dependence), and `potentialMtY`
  is portfolio-agnostic (not derived from the 60 corporates' specific abatement needs).

**Framework alignment:** McKinsey/IEA **MAC curve** methodology — the lever library is a direct
implementation: levers ranked by €/tCO₂, abatement volume on the x-axis. **SBTi** Corporate Net-Zero
Standard — the 1.5 °C-required pathway and per-company sbti status/targets reference SBTi's absolute-
contraction approach (1.5 °C ⇒ ≥4.2 %/yr linear reduction). **IEA NZE 2050** informs the sector
CapEx/decarb profiles and the "no new oil/gas fields" milestone; **IPCC AR6 WG3 Ch.12** underpins the
technology cost/potential estimates. **EU ETS / CBAM / Fit-for-55** drive the carbon-price and policy
calendars.
