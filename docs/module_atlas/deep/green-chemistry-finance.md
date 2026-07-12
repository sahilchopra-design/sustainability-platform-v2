## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-DL6) names a **Green Chemistry Investment Score** —
`GreenChemScore = 0.3·BiobContentRatio + 0.3·CostParity + 0.2·RegCompliance + 0.2·MarketGrowth`. The
code carries the constituent per-company fields (green-chemistry %, safer-chemicals score, REACH
compliance, transition capex) and aggregates them, but the **weighted composite formula itself is not
assembled** — the page displays and averages the components rather than combining them into the guide's
score. Two sliders (`carbonPrice`, `biobasedPremium`) drive live cost/revenue transforms. §8 specifies
the composite scoring model.

### 7.1 What the module computes

Company records seed a green-chemistry share and derived fields; the page aggregates over `filtered`:
```js
avgGreenPct   = mean(greenChemistryPct)
avgSaferScore = mean(saferChemicalsScore)
pctReach      = count(reachCompliance) / N · 100
carbonCost    = (Σ scope1 · 1e6 · carbonPrice) / 1e9        // $B carbon cost at slider price
bioRevenue    = Σ greenChemistryRevenue · (1 + biobasedPremium/100)   // premium-adjusted revenue
```
Views: `typeGreenData` (green % by chemical type), `hazardousWorst` (top-15 by hazardous count),
`countryBioData`, `scatterData` (transition capex vs green %), `innovationLeaders` (top-15 by process-
innovation score).

### 7.2 Parameterisation / provenance

| Field | Generator | Provenance |
|---|---|---|
| `type` | `TYPES[⌊sr·6⌋]` (Specialty/Commodity/Bio-based/Green NH₃/Green MeOH/Polymer) | synthetic |
| `greenChemistryPct` | `⌊5 + sr(i·5)·80⌋` | 5–85%, synthetic |
| `saferChemicalsScore` | seeded | synthetic (EPA Safer Choice framing) |
| `reachCompliance` | boolean seed | synthetic |
| `scope1`, `transitionCapex`, `processInnovationScore` | seeded | synthetic |
| `carbonPrice` slider | user | applied to Σscope1 |
| `biobasedPremium` slider | user | applied to green revenue |

The guide's weighting (0.3/0.3/0.2/0.2) and the cost-parity threshold (<1.2× viable) are documentation;
the code uses simple means and the two slider transforms rather than the weighted score.

### 7.3 Calculation walkthrough

Seed companies → filter → aggregate. `carbonCost` scales total Scope-1 emissions (in Mt → t via ×1e6) by
the carbon-price slider and expresses in $B (÷1e9). `bioRevenue` inflates green-chemistry revenue by the
bio-based premium slider. The scatter and leaderboard views sort/plot the seeded per-company fields.

### 7.4 Worked example

Filtered set: `Σscope1 = 12 MtCO₂e`, `Σ greenChemistryRevenue = $8,000M`, sliders `carbonPrice = $75/t`,
`biobasedPremium = 15%`:
`carbonCost = (12·1e6·75)/1e9 = (900,000,000·... )` → `12e6 · 75 = 900e6`; `/1e9 = 0.9` → **$0.9B** carbon
cost. `bioRevenue = 8000·(1 + 15/100) = 8000·1.15 = $9,200M` premium-adjusted green revenue. Both are
one-line linear transforms of seeded aggregates.

### 7.5 Data provenance & limitations

- **All company data synthetic**, seeded by `sr(seed)=frac(sin(seed+1)·10⁴)`.
- The guide's weighted `GreenChemScore` is **not computed**; the page shows its ingredients separately, so
  there is no single investable ranking.
- `carbonCost` uses one flat carbon price on Scope-1 only; no Scope-2/3, no vintage.
- Cost-parity (biobased vs fossil) is discussed in the guide but not implemented as a ratio in code.

**Framework alignment:** EU Chemicals Strategy for Sustainability (2020) and ECHA REACH/PFAS restriction —
the regulatory driver behind `reachCompliance` and the PFAS-substitution thesis; EPA/US-DOE green-chemistry
principles (12 Principles of Green Chemistry underpin the "safer chemicals" score); Ellen MacArthur New
Plastics Economy; ISO 14040/44 LCA for the carbon-reduction claims. §8 assembles the weighted score.

## 8 · Model Specification — Green-Chemistry Investment Score & Cost-Parity Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a single investable score per chemical company/product ranking green-chemistry transition
progress, and a cost-parity year for biobased vs fossil routes — for specialty-chemicals investors and
bio-economy funds.

### 8.2 Conceptual approach
Weighted multi-factor score (the guide's formula) combined with an **experience-curve cost-parity model**
for biobased feedstocks, benchmarked against **MSCI/S&P ESG chemical-sector scoring** and **IEA/nova-Institute
bio-based cost curves**. Regulatory compliance is treated as an option value (avoided restriction cost).

### 8.3 Mathematical specification
```
GreenChemScore = 0.3·min(1, BioContentRatio) + 0.3·CostParityScore
               + 0.2·RegComplianceScore + 0.2·MarketGrowthScore                (0–1)
CostParityScore = clip( (1.2 − CostRatio)/0.2, 0, 1 ),  CostRatio = Cost_bio/Cost_fossil
Experience curve: Cost_bio(V) = Cost_bio(V0)·(V/V0)^(−b),  b = −log2(1−LR)     (LR = learning rate)
ParityYear = min{ y : Cost_bio(V(y)) ≤ Cost_fossil(y) }
RegComplianceValue = Σ_restricted Spend_i · P(restriction)·SwitchCost_avoided
CarbonReduction = Σ Spend_i · (EF_fossil,i − EF_bio,i)                          (tCO₂e)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `LR` | biobased learning rate | nova-Institute / IEA bioeconomy studies |
| `Cost_fossil` | petrochemical cost path | oil/gas price forecasts, IEA |
| `EF_fossil/bio` | emission factors | ecoinvent/GaBi LCA (guide-cited) |
| restriction probability | REACH/PFAS listing likelihood | ECHA restriction pipeline |
| factor weights | 0.3/0.3/0.2/0.2 | guide (analyst-set; re-calibrate) |

### 8.4 Data requirements
Per company/product: biobased content, production cost (bio & fossil), REACH/PFAS exposure, revenue by
product, Scope 1–3 EFs, R&D/innovation metrics. Sources: ecoinvent/GaBi (LCA), ECHA restriction lists,
nova-Institute cost curves, company disclosures. The module seeds all of these today.

### 8.5 Validation & benchmarking plan
Reconcile scores against MSCI/S&P chemical ESG ratings; validate parity years against nova-Institute
published crossover estimates; sensitivity to learning rate and fossil-price path; back-test regulatory-
value against realised PFAS-substitution spend.

### 8.6 Limitations & model risk
Learning rates are uncertain and product-specific; fossil-price volatility dominates parity timing.
Weighting is judgemental. LCA boundaries (cradle-to-gate vs -grave) change carbon-reduction claims.
Conservative fallback: report parity as a range across learning-rate/oil-price scenarios and treat
regulatory value as an upside option, not a base-case cash flow.
