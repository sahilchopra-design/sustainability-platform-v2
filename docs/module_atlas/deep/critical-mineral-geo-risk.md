## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (formula not implemented).** The guide (EP-CV3) states the engine computes
> `GeoRisk = SupplyConcentration × ProcessingConcentration × GeopoliticalInstability`. **No such composite
> is calculated in the code.** The page *displays* curated per-mineral mining shares, China processing
> percentages, OECD friendshoring shares, and price volatility — all as stored constants — and renders
> curated export-control scenarios, but it never multiplies concentration × processing × instability into a
> `GeoRisk` score. So the underlying data is real and well-chosen, but the headline formula is aspirational.
> The sibling module `critical-mineral-geopolitics` *does* compute the concentration half (HHI) — see §7.5.
> §8 specifies the composite geo-risk score this module's guide promises.

### 7.1 What the module computes

Almost nothing is derived — the module is a curated-data display with a few pass-through transforms:

```js
PROCESSING_CONC = MINERALS.map(m ⇒ ({ china: m.processing_china, other: 100 − m.processing_china }))
FRIENDSHORING   = MINERALS.map(m ⇒ ({ oecd: m.oecd_share, nonOecd: 100 − m.oecd_share }))
sel = MINERALS.find(m ⇒ m.name == selectedMineral)     // selected mineral's stored fields
```

There is no HHI, no instability weighting, and no `GeoRisk` product. Every displayed number is a stored
constant; only the `100 − x` complements are computed.

### 7.2 Parameterisation / scoring rubric

**Curated mineral geo-data (not seeded):**

| Mineral | Top miners | China processing | OECD share | Price vol |
|---|---|---|---|---|
| Lithium | Australia 47%, Chile 30% | 62% | 52% | 38% |
| Cobalt | DRC 73%, Indonesia 5% | 74% | 12% | 42% |
| Rare Earths | China 60%, Myanmar 12% | 90% | 14% | 55% |
| Graphite | China 65%, Mozambique 12% | 93% | 8% | 28% |
| PGMs | South Africa 72%, Russia 12% | 18% | 15% | 32% |

`PRICE_TREND` is a curated 2020–2025 index (lithium spike to 520 in 2022, back to 160 in 2025 — real).
`SCENARIOS` (5) are curated export-control events with probability bands and price-spike ranges (e.g.
"China REE export ban → 200–400% spike"). `PORTFOLIO_IMPACT` maps 8 real companies (Tesla, Glencore,
Umicore…) to exposure levels and mitigation strategies — all editorial.

### 7.3 Calculation walkthrough

1. `MINERALS`, `SCENARIOS`, `PRICE_TREND`, `PORTFOLIO_IMPACT` are module-level curated constants.
2. `PROCESSING_CONC` and `FRIENDSHORING` derive the "other/non-OECD" complements for stacked bars.
3. Six tabs render: supply-chain map (mining shares), processing concentration, friendshoring index,
   export-control scenarios, price volatility (the trend), portfolio impact. The mineral selector and
   scenario index only choose which stored record to display.

### 7.4 Worked example

Rare Earths: `processing_china = 90` → `PROCESSING_CONC = {china: 90, other: 10}`; `oecd_share = 14` →
`FRIENDSHORING = {oecd: 14, nonOecd: 86}`. These are the *displayed* values. A genuine `GeoRisk` per the
guide would combine them: mining HHI (China 60² + Myanmar 12² + … ≈ 3,900+), processing concentration
(90%), and a governance/instability weight for the dominant supplier — but the code produces no such
number. The "China REE export ban" scenario (medium probability, 200–400% spike, 12–18mo EV delay) is a
curated card, not a modelled shock.

### 7.5 Companion analytics on the page

Supply-chain map, processing-concentration bars, friendshoring (OECD vs non-OECD) stacks, export-control
scenario cards, price-volatility trend, and portfolio-impact table. No backend engine or route. The
concentration mathematics the guide implies (HHI) is implemented in the sibling `critical-mineral-
geopolitics` module (`HHI = Σ share²` over mining/processing shares), which this module could reuse.

### 7.6 Data provenance & limitations

- **Curated real data, not seeded** — mining shares, processing dominance, OECD shares, and the price
  trend track IEA/USGS figures. `sr()` is not used.
- **The guide's `GeoRisk` composite is not computed** — the page shows the *inputs* to such a score
  (concentration, processing, price volatility) but never multiplies them into a risk index, and there is
  no governance/instability weight in code.
- Scenarios and portfolio impacts are static editorial cards, not probabilistic model outputs.

**Framework alignment:** *IEA Critical Minerals* — the mining/processing concentration and friendshoring
framing follow IEA's supply-security analysis. *USGS* underpins the country shares. The friendshoring index
(OECD vs non-OECD supply) reflects the *de-risking* policy lens (US IRA, EU CRMA). The concentration and
governance-weighted composite the guide describes is specified below.

---

## 8 · Model Specification — Composite Mineral Geopolitical Risk Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute a per-mineral (and portfolio-weighted) geopolitical supply-risk score combining production/
processing concentration with supplier governance and trade dependence, to rank chokepoints and stress
portfolio exposure. Coverage: the 8 minerals here (extendable to the 15 in the sibling module).

### 8.2 Conceptual approach
Implement the guide's product form using a **Herfindahl-Hirschman Index** for concentration and **World
Bank WGI** for governance risk — the same construction the sibling `critical-mineral-geopolitics` module
uses for HHI, plus the governance and trade legs. This mirrors the **EU Critical Raw Materials Act** supply-
risk methodology and the **IEA supply-risk** scoring.

### 8.3 Mathematical specification
```
HHI_mining_m     = Σ_c share_mining(c)²                  (0–10,000)
HHI_processing_m = Σ_c share_processing(c)²
Governance_m     = Σ_c share(c) · (1 − WGI_norm(c))      (share-weighted supplier governance risk)
TradeConc_m      = max_c share_processing(c) / 100        (single-processor reliance)
GeoRisk_m = w1·HHI_processing_m/10000 + w2·HHI_mining_m/10000 + w3·Governance_m + w4·TradeConc_m
Bands: HHI > 2500 concentrated · > 4000 critical chokepoint
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Country shares | `share_mining/processing` | USGS / IEA (already curated here) |
| Governance | `WGI_norm(c)` | World Bank WGI (rule of law, political stability) |
| Trade concentration | `TradeConc_m` | Processing single-country share |
| Weights | `w1..w4` | Calibrate to historical disruption impact |

### 8.4 Data requirements
Per-mineral country shares for mining and processing (present as `mining_top`/`processing_china`; would
need full country vectors as in the sibling module), and WGI scores per supplier country (free, World
Bank). Portfolio exposure by mineral (present in `PORTFOLIO_IMPACT`).

### 8.5 Validation & benchmarking plan
Reconcile HHI/GeoRisk rankings against EU CRMA supply-risk lists and IEA supply-security assessments;
backtest whether high GeoRisk minerals experienced the largest 2020–2024 price spikes (the `PRICE_TREND`
data). Sensitivity on weights and WGI normalisation.

### 8.6 Limitations & model risk
HHI ignores stockpiles, recyclability, and substitution (add as mitigants); governance weights are slow-
moving and can miss sudden export controls (overlay the scenario cards). Trade concentration double-counts
with HHI — orthogonalise. Conservative fallback: report HHI and China-processing share directly (as now)
alongside the composite so the drivers are transparent.
