## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises a **Mitigation Potential Score**
> `MPS = AnnualAbatement(GtCO₂e) × TRL Weight × CostCurve Position`. **No MPS is computed anywhere in the
> code.** The page is a company/category *taxonomy browser*: it scores companies on EU-Taxonomy alignment,
> CBI classification, FTSE Green revenue, a proprietary score, TRL and green-revenue %, all `sr()`-seeded,
> and rolls them up by category. Abatement potential (GtCO₂e), MAC-curve position and TRL-weighted
> mitigation never appear. §8 specifies the MPS the guide names.

### 7.1 What the module computes

Per synthetic company, six alignment/readiness scores drive a radar and screening table:
```js
euAlign   = round(sr(i·41+3)·100)                     // EU Taxonomy alignment %
cbiClass  = ['Aligned','Partially Aligned','Not Aligned','Under Review'][floor(sr(i·43+5)·4)]
ftseGreen = round(sr(i·47+7)·100)                     // FTSE Green Revenues %
propScore = round(20 + sr(i·53+9)·80)                 // proprietary 20–100
trl       = 1 + floor(sr(i·59+11)·9)                  // TRL 1–9
greenRevPct = round( Σ_cat revBreakdown[cat] · (sr(i·61+1)·0.5+0.3) )
```
Category market projection (the only compound-growth calc):
```js
val = round( CATEGORIES[catIdx].marketSize·0.4 · (1+growth)^(year−2020) + sr(catIdx·100+year)·50 )
```
A wizard scores a hypothetical company's revenue streams: `greenPct = Σ green-category revenue %`, then
`ftse = min(greenPct·0.9 + sr·8, 100)`, `prop = min(greenPct·0.7 + 20 + sr·10, 100)`.

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| `CATEGORIES` (13: marketSize, growth, investReq, TRL, keyTech) | seed schema | curated (IEA/IPCC solution taxonomy) |
| `euAlign`, `ftseGreen`, `propScore`, `trl` | `sr()` seeded | synthetic demo value |
| Radar metrics | EU/CBI/FTSE/Prop/TRL/GreenRev | composite display |
| Category `val` projection | 40% of market × (1+growth)^t | heuristic growth extrapolation |
| Screening weights `w` | greenRev+euAlign+propScore+trl | user-set composite |

### 7.3 Calculation walkthrough

Seeds → company name/sector/mktCap/categories/scores → `radarMetrics` per company →
`catStats` aggregates market size, growth, company count and average green-rev per category →
`comparisonData`/`sorted` bar+sort views → CSV export. The market projection compounds a category's
`marketSize·0.4` at its stored growth rate from a 2020 base.

### 7.4 Worked example

Category "Solar & Storage" with `marketSize = $200B`, `growth = 18%`, projected to 2030:
```
val = 200·0.4 · (1.18)^(2030−2020) + noise
    = 80 · (1.18)^10 ≈ 80 · 5.234 ≈ $419B  (+ ~$0–50 noise)
```
A company in this category with `greenRevPct = 65`, `euAlign = 80`, `ftseGreen = 72`, `propScore = 70`,
`trl = 8` renders a radar with `Tech Readiness = round(8/9·100) = 89`; its screening composite (equal-weight
of greenRev/euAlign/propScore/trl-normalised) ≈ (65+80+70+89)/4 ≈ **76**, placing it in the top screening
band.

### 7.5 Data provenance & limitations

- Company scores are **synthetic** (`sr()` PRNG); only the 13 `CATEGORIES` market-size/growth constants are
  curated from IEA/IPCC-style figures.
- No abatement quantification (GtCO₂e), no marginal-abatement-cost-curve position, no TRL *weighting* of
  abatement — so the taxonomy classifies but does not rank by mitigation potential as the guide implies.
- EU-Taxonomy alignment is a random % not a technical-screening-criteria assessment; CBI class is a random
  pick, not a Climate Bonds Taxonomy determination.

**Framework alignment:** IEA *Net Zero by 2050* (solution set, $4T/yr 2030 investment cited) · IPCC AR6 WG3
Ch.12 (cross-sector abatement) · EU Taxonomy technical-screening criteria (alignment metric it approximates)
· Climate Bonds Initiative Taxonomy (CBI classification field) · FTSE Green Revenues classification.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Rank climate solutions and the companies delivering them by *mitigation potential*
— abatement scale × readiness × cost-competitiveness — for deal sourcing and capital-allocation triage.

**8.2 Conceptual approach.** The guide's MPS operationalised as a **marginal-abatement-cost-curve (MACC)
weighting** (McKinsey/IEA MACC) combined with a TRL-based deployment-probability weight (IEA ETP), so that
low-cost, high-readiness, high-abatement solutions rank highest — mirroring IEA Energy Technology
Perspectives clean-tech prioritisation and BNEF technology-cost curves.

**8.3 Mathematical specification.**
```
MPS_s = AnnualAbatement_s(GtCO₂e/yr) · w_TRL(TRL_s) · w_cost(MAC_s)
w_TRL(k)  = k/9                                   (deployment-readiness weight)
w_cost(m) = 1 / (1 + exp((m − m0)/κ))             (logistic: cheap abatement weighted ↑; m0 = $0/t threshold)
Company_MPS = Σ_s revShare_company,s · MPS_s      (portfolio-weighted solution exposure)
```

| Parameter | Source |
|---|---|
| AnnualAbatement_s | IEA NZE / IPCC AR6 sector abatement potentials |
| MAC_s | McKinsey MACC / IEA cost curves ($/tCO₂e) |
| m0, κ | calibrated to carbon-price and cost-curve slope |
| TRL_s | IEA ETP technology readiness assessment |

**8.4 Data requirements.** Per-solution abatement, MAC, TRL; company revenue-by-solution split; EU-Taxonomy
technical criteria. Free: IEA NZE tables, IPCC AR6; vendor: BNEF cost curves, FTSE Green Revenues.

**8.5 Validation & benchmarking.** Reconcile solution MPS ranking against IEA ETP priority technologies;
sensitivity on cost-curve slope; check company MPS correlates with realised green-revenue growth.

**8.6 Limitations & model risk.** Abatement potentials scenario-dependent; MAC curves volatile with input
prices; double-counting across overlapping solutions. Fallback: rank by abatement × TRL only when reliable
MAC data is missing.
