# Green Chemistry Finance Analytics
**Module ID:** `green-chemistry-finance` · **Route:** `/green-chemistry-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DL6 · **Sprint:** DL

## 1 · Overview
Evaluates investment in green chemistry and bio-based materials — replacing petrochemical feedstocks with renewable inputs. Models bio-based product market size, cost competitiveness curves, REACH chemical regulation compliance costs, and transition economics for chemical industry investors.

> **Business value:** Essential for specialty chemicals investors, bio-economy venture funds, and industrial companies seeking sustainable chemistry R&D direction. PFAS restriction creates near-term commercial urgency — quantifies biobased alternative market opportunity and cost trajectory to parity.

**How an analyst works this module:**
- Browse green chemistry categories and feedstocks
- Model biobased vs petrochemical cost competitiveness
- Assess REACH/PFAS regulatory compliance advantage
- Calculate carbon reduction and LCA impact
- Generate EU Chemical Strategy for Sustainability-aligned investment thesis

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `GREEN_TIERS`, `KpiCard`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Specialty','Commodity','Bio-based','Green Ammonia','Green Methanol','Polymer'];` |
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `greenChemistryPct` | `Math.round(5 + sr(i * 5) * 80);` |
| `TABS` | `['Company Overview','Green Chemistry Score','Hazardous Reduction','Bio-based Transition','Renewable Feedstock','Compliance Risk','Transition Capex','Innovation Leaders'];` |
| `avgGreenPct` | `(filtered.reduce((s, c) => s + c.greenChemistryPct, 0) / n).toFixed(1);` |
| `totalTransCapex` | `filtered.reduce((s, c) => s + c.transitionCapex, 0);` |
| `avgSaferScore` | `(filtered.reduce((s, c) => s + c.saferChemicalsScore, 0) / n).toFixed(1);` |
| `pctReach` | `((filtered.filter(c => c.reachCompliance).length / n) * 100).toFixed(0);` |
| `carbonCost` | `((filtered.reduce((s, c) => s + c.scope1, 0) * 1e6 * carbonPrice) / 1e9).toFixed(1);` |
| `bioRevenue` | `((filtered.reduce((s, c) => s + c.greenChemistryRevenue, 0) * (1 + biobasedPremium / 100))).toFixed(0);` |
| `typeGreenData` | `TYPES.map(t => {` |
| `hazardousWorst` | `[...filtered].sort((a, b) => b.hazardousChemicals - a.hazardousChemicals).slice(0, 15);` |
| `countryBioData` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.transitionCapex, y: c.greenChemistryPct, name: c.name }));` |
| `innovationLeaders` | `[...filtered].sort((a, b) => b.processInnovationScore - a.processInnovationScore).slice(0, 15);` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `GREEN_TIERS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Bio-based Chemicals Market | — | MarketsAndMarkets Bio-based Chemicals 2024 | Bio-based chemicals market $98Bn in 2023 — projected $185Bn by 2030 at 9.5% CAGR |
| PFAS Restriction Impact | — | ECHA PFAS Restriction 2023 | EU ECHA PFAS restriction affects 10,000+ products — creates huge demand for green chemistry alternatives |
| Carbon Intensity Reduction | — | USDA BioPreferred Program LCA 2023 | Bio-based materials typically reduce carbon intensity 40–80% vs petrochemical equivalents using life cycle assessment |
- **Chemical product LCA databases (ecoinvent, GaBi)** → Carbon intensity comparison → **Bio-based vs petrochemical GHG intensity per kg product**
- **Biobased feedstock cost curves (sugars, oils, cellulose)** → Cost competitiveness modelling → **Biobased cost parity year by product category**
- **ECHA/EPA restricted substances lists** → Regulatory compliance value → **Revenue opportunity from replacing restricted petrochemicals**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Chemistry Investment Score
**Headline formula:** `GreenChemScore = (BiobContentRatio × 0.3) + (CostParity × 0.3) + (RegCompliance × 0.2) + (MarketGrowth × 0.2); BiobasedCostParity = BiobbasedCost / FossilBasedCost`

Cost parity ratio measures biobased competitiveness — below 1.2× generally commercially viable; regulatory compliance adds value for REACH/PFAS restricted chemicals where biobased is automatic compliance

**Standards:** ['EU Green Deal Chemicals Strategy for Sustainability 2020', 'US DOE Bioenergy Technologies Office Green Chemistry', 'ICCA Green Chemistry Principles', 'Ellen MacArthur Foundation New Plastics Economy']
**Reference documents:** EU Chemicals Strategy for Sustainability — Towards a Toxic-Free Environment (2020); ECHA Universal PFAS Restriction Proposal (2023); US DOE Bioenergy Technologies Office — Green Chemistry Portfolio; ICCA Green Chemistry and Engineering Initiative

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the weighted GreenChemScore and cost-parity curves (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's weighted `GreenChemScore = 0.3·BiobContentRatio + 0.3·CostParity + 0.2·RegCompliance + 0.2·MarketGrowth` is not computed — the page shows its ingredients separately over `sr()`-seeded company data, and the §8 spec is marked "not yet implemented." Evolution A builds the composite for real over sourced inputs: each company's bio-based content ratio, cost-parity ratio (`BiobasedCost/FossilBasedCost`, below 1.2× commercially viable), REACH/PFAS regulatory-compliance advantage, and market growth combined into the weighted score — with cost-parity computed from real bio-based vs petrochemical feedstock prices rather than seeded fields.

**How.** (1) A backend route computing `GreenChemScore` from the four weighted components per §5. (2) Cost-parity from bio-based and fossil feedstock prices (sourced or user-entered), so the <1.2× viability threshold is a computed classification. (3) The REACH-compliance term reflects actual restricted-substance status (PFAS restrictions make bio-based automatically compliant — a real value driver). (4) Company data sourced or user-supplied, replacing the seeded panel.

**Prerequisites.** Bio-based/fossil feedstock price data; REACH restricted-substance reference; the seeded company panel replaced (§7-flagged). **Acceptance:** `GreenChemScore` computes as the weighted composite reproducing §5; cost-parity derives from real prices and drives the viability flag; no `sr()` company field feeds the score.

### 9.2 Evolution B — Green-chemistry investment copilot (LLM tier 1 → 2)

**What.** A copilot for chemical-sector investors: "which bio-based materials are at cost parity with their petrochemical equivalents, and where does REACH/PFAS give bio-based an automatic compliance edge?" narrates the market-size and cost-competitiveness framing from the atlas corpus, with tier-2 computing GreenChemScore and cost-parity via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (bio-based market sizing, cost-parity curves, REACH compliance economics). The copilot's value is spotting cost-parity crossovers and regulatory tailwinds (PFAS restrictions). Guardrail, pre-Evolution-A: the composite is unbuilt and data seeded, so it must refuse GreenChemScore and cost-parity figures. Tier 2 tool-calls the score/parity endpoint. Every figure validated against tool output.

**Prerequisites.** Evolution A (no composite today); feedstock price data; corpus embedding. **Acceptance:** post-Evolution-A, every score and cost-parity figure traces to a tool call reproducing the weighted formula; pre-Evolution-A the copilot answers only on regulatory/market facts and declines quantitative scores.