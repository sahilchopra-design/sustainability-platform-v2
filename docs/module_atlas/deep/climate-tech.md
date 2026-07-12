## 7 · Methodology Deep Dive

The guide names a **Climate Tech Investment Growth Rate** (`CTIGR = (Inv_t − Inv_{t−1})/Inv_{t−1}·100`). The
page is a **climate-tech company/ecosystem explorer**: it seeds a company universe with funding, TRL, IRR,
impact and risk fields, then aggregates by sector/stage/TRL and offers a portfolio-construction tab. The
growth rate exists only as a stored `yearlyFunding` allocation vector, not an estimated series; all company
data is `sr()` seeded.

### 7.1 What the module computes

Per synthetic company, ~20 seeded attributes drive the dashboards:
```js
trl        = 1 + floor(sr(i·17)·9)                 // TRL 1–9
funding    = round(5 + sr(i·19)·995)               // $M
irr        = round(4 + sr(i·23)·36)                // 4–40%
co2AvoidedMtpa = round((0.01 + sr(i·29)·4.99)·100)/100
climateImpactScore = round(20 + sr(i·83)·79)
sbtiAligned = sr(i·79) > 0.45                       // ~55% aligned
```
Aggregations:
```js
avgTrl     = round(Σ trl / n · 10)/10
yearlyFunding = years.map((y,i) => totalFunding · [0.04,0.06,0.07,0.10,0.14,0.18,0.22,0.19][i])
portfolioValue = round( totalCO2·carbonPrice·1e6 / 1e9 )   // $B, CO2 monetised at slider price
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| `funding`, `irr`, `trl`, `revenue` | `sr()` seeded ranges | synthetic demo value |
| `co2AvoidedMtpa`, `waterSavedMn`, `jobsCreated`, `landHaMn` | `sr()` seeded | synthetic impact metrics |
| `sbtiAligned` threshold | `sr > 0.45` | heuristic (~55% aligned) |
| `yearlyFunding` shares | fixed `[0.04…0.19]` 2018–25 | curated growth curve (BNEF-shaped) |
| `MARKET_TAM` | per sector | curated TAM |
| Risk levels (tech/market/policy) | 3-level pick | synthetic |

Guide anchors: global climate-tech VC $63B (2023, BNEF); clean-energy patent +15% CAGR (EPO).

### 7.3 Calculation walkthrough

Seeds → company universe (name, sector, stage, geo, TRL, funding, IRR, impact, risk) → sector/stage/TRL
distributions → `topFunded`/`topImpact` rankings → `yearlyFunding` reconstructs a funding time series by
applying the fixed share vector to total funding → CTIGR is read off consecutive years. Portfolio tab filters
companies, monetises aggregate CO₂ avoided at a `carbonPrice` slider into `portfolioValue`, and plots a
risk matrix (`techRisk` × `marketRisk` with jitter).

### 7.4 Worked example

Suppose `totalFunding = $20,000M`. The stored yearly shares give:
```
2022 funding = 20,000·0.14 = $2,800M ;  2023 = 20,000·0.18 = $3,600M
CTIGR(2023) = (3,600 − 2,800)/2,800·100 = +28.6%
```
Portfolio of companies totalling `totalCO2 = 40 Mtpa` at `carbonPrice = $80/t`:
```
portfolioValue = 40·80·1e6 / 1e9 = $3.2B   (annual avoided-emissions value)
```
So a 40-Mtpa avoided-emissions portfolio is valued at $3.2B/yr of carbon benefit at $80/t — the impact-to-
value bridge the module illustrates.

### 7.5 Data provenance & limitations

- **All company data synthetic** (`sr()` PRNG); only the `yearlyFunding` share vector and `MARKET_TAM` are
  curated to BNEF-shaped magnitudes.
- CTIGR is not estimated from real deal flow — it is the ratio of stored shares; TRL/IRR/impact are
  independent random draws with no internal consistency (a TRL-3 seed can carry a high IRR).
- `portfolioValue` monetises CO₂ avoided but is not a financial NPV — no cost, no probability of success.

**Framework alignment:** Bloomberg NEF ClimateTech ($63B 2023) · PwC State of Climate Tech · EPO patent
index (+15% CAGR) · IEA Energy Technology Perspectives (TRL framework, 1–9). SBTi alignment flag references
Science-Based Targets validation. The four `/climate-tech` endpoints (CTVC taxonomy, IEA deployment, MAC
curves, VC market data) are wired in the backend but not the source of the on-page seeded universe.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Track real climate-tech capital deployment (CTIGR by sector/stage/geo), maturity
progression (TRL curves) and portfolio impact-adjusted value, for VC/PE allocation and policy monitoring.

**8.2 Conceptual approach.** Aggregate a **deal-level investment panel** (Crunchbase/Dealroom/BNEF) into
sector-stage cohorts, fit patent-activity leading indicators (EPO/USPTO) to TRL progression, and value
impact via an abatement-monetisation bridge — mirroring BNEF climate-tech tracking and PwC State of Climate
Tech taxonomy.

**8.3 Mathematical specification.**
```
CTIGR_{s,t} = (Inv_{s,t} − Inv_{s,t−1}) / Inv_{s,t−1} · 100         (from deal panel)
TRL_progression: P(TRL↑ | patents, funding) = logistic(θ0 + θ1·PatentGrowth + θ2·log Funding)
ImpactValue = Σ_c abatement_c(tCO₂e/yr) · SCC · P(success_c)         (risk-adjusted)
P(success | stage, TRL) from historical stage-transition survival rates
```

| Parameter | Source |
|---|---|
| Deal panel Inv_{s,t} | Crunchbase/Dealroom/BNEF |
| Patent growth | EPO/USPTO climate-tech classifications |
| SCC | EPA/IWG social cost of carbon |
| Stage-success rates | VC exit/survival databases (Pitchbook) |

**8.4 Data requirements.** Round-level funding by company/date/stage/geo; patent counts; abatement per
company; exit outcomes. Vendor: Crunchbase/Pitchbook/BNEF; free: EPO patent index, EPA SCC.

**8.5 Validation & benchmarking.** Reconcile total CTIGR against BNEF $63B and PwC figures; backtest
TRL-progression predictions; check impact-value against realised abatement disclosures.

**8.6 Limitations & model risk.** Private-deal data lags and gaps; self-reported impact optimism; success
probabilities regime-dependent. Fallback: report CTIGR and TRL distributions without impact-value when
abatement/success data is missing.
