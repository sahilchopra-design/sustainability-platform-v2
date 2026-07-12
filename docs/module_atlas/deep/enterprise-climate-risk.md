## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's headline is the **Enterprise Climate Risk Score**
> `ECRS = Σ(w_d × (PhysRisk_d + TransRisk_d)) / Σw_d` — a division-weighted composite of standardised
> physical and transition sub-scores. **The ECRS is never computed.** `physRisk` and `transRisk` exist
> as per-exposure random draws (10–90) but are not aggregated into a division-weighted enterprise
> score. What the module *does* compute is a **portfolio climate-VaR aggregation with a diversification
> proxy**, NGFS scenario multipliers, hedge coverage, and a real TCFD-completeness score. Critically,
> the per-exposure `climateVaR95` is itself a **random draw** (`exposure × (0.02 + sr·0.18)`), not a
> modelled loss percentile. §8 specifies both the ECRS and the climate-VaR model.

### 7.1 What the module computes

**300 synthetic exposures** — every risk attribute is an independent `sr()` draw:
```js
exposureMN   = 50 + sr(i·23)·2950         physRisk  = 10 + sr(i·29)·80
transRisk    = 10 + sr(i·31)·80           climateVaR95 = exposureMN × (0.02 + sr(i·37)·0.18)
pdClimate    = 0.001 + sr(i·79)·0.079     lgdClimate   = 0.2 + sr(i·83)·0.6
rwaClimate   = exposureMN × (0.3 + sr(i·89)·0.9)   capitalCharge = exposureMN × (0.08 + sr·0.07)
```
(An India-mode branch swaps in real market-cap-scaled exposures from `adaptForPCAF()`, but risk scores
remain `sr()`-random.)

**Portfolio aggregations** (the genuine computations):
```js
standaloneSum   = Σ climateVaR95 × scenMult                    // undiversified
portfolioCVaR   = sqrt( Σ (climateVaR95 × scenMult)² ) × 0.75  // diversified proxy
diversBenefit   = standaloneSum − portfolioCVaR
pctHedged       = Σ hedgeRatio × exposure / Σ exposure × 100   // exposure-weighted
tcfdScore       = Σ TCFD_item.score / (n_items × 3) × 100      // completeness %
entity physVaR  = Σ climateVaR95 × (physRisk/100) × scenMult   // per legal entity
```

### 7.2 Parameterisation / scoring rubric

| Object | Value | Provenance |
|---|---|---|
| `LEGAL_ENTITIES` | 12 (HoldCo, BankCo UK/EU/…, Asset Mgmt, Insurance…) | Group structure |
| `NGFS3` / `NGFS3_MULTS` | Orderly 1.0, Disorderly 1.4, Hot House 2.1 | Scenario loss multipliers |
| `climateVaR95` | exposure × (2–20%) | **synthetic — not a percentile** |
| Diversification factor | ×0.75 on √(ΣVaR²) | ad-hoc correlation proxy |
| `pdClimate` / `lgdClimate` | 0.1–8% / 20–80% | synthetic credit primitives |
| RAROC hurdle | 8% | `passes = raroc ≥ 0.08` |
| TCFD scoring | item score / 3 | 0–3 maturity per TCFD item |

The NGFS 3-scenario multipliers (Orderly<Disorderly<Hot House) follow the correct risk ordering; the
0.75 diversification factor is a fixed heuristic, not a computed portfolio correlation.

### 7.3 Calculation walkthrough

Generate 300 exposures → filter by entity/asset-class/geography/sector → the KPIs compute total
exposure, portfolio climate-VaR (with diversification benefit), % hedged, and TCFD score → the
scenario toggle applies `scenMult` (1.0/1.4/2.1) to all VaR figures → per-entity bars split VaR into
physical vs transition components (weighting each exposure's VaR by its physRisk/transRisk share) → a
RAG (red/amber/green) status per legal entity → RAROC and hedge tables.

### 7.4 Worked example

Suppose the filtered set sums to `standaloneSum = $8,400M` of climate-VaR (Orderly, scenMult = 1) and
`Σ VaR² = 5.6×10⁷`:
```
portfolioCVaR = √(5.6×10⁷) × 0.75 = 7,483 × 0.75 = $5,612M
diversBenefit = 8,400 − 5,612 = $2,788M
```
So the module claims a $2.79B diversification benefit — but this arises purely from the
`√(ΣVaR²)·0.75` construction, which assumes a fixed sub-additivity factor regardless of actual
exposure correlation. Under **Hot House** (scenMult = 2.1), every VaR scales ×2.1, so `standaloneSum =
$17,640M` and `portfolioCVaR = $11,785M` — the scenario multiplier is the only real driver of the
stress. The per-exposure VaR feeding this (e.g. a $1,000M exposure → `1000×(0.02+sr·0.18)` ≈ $110M) is
a random 2–20% haircut, not a computed 95th-percentile loss.

### 7.5 Companion analytics

- **Entity VaR decomposition:** physical vs transition VaR per legal entity (weighting VaR by the
  exposure's phys/trans score share) — the closest the module gets to the guide's phys+trans split.
- **RAG dashboard:** per-entity climate-VaR-to-exposure ratio bucketed red/amber/green.
- **TCFD completeness:** `TCFD_ITEMS_EXTENDED` scored 0–3 per item, normalised to a 0–100% disclosure
  maturity — a genuine (if self-assessed) completeness metric.
- **RAROC / hedge tables:** per-entity risk-adjusted return vs 8% hurdle; hedge coverage and cost.

### 7.6 Data provenance & limitations

- **All 300 exposures are synthetic** (`sr()` draws); the India branch scales exposure by real market
  cap but keeps risk scores random.
- **`climateVaR95` is a random haircut, not a modelled percentile**; PD/LGD/RWA are likewise drawn,
  not derived. The diversification benefit is a fixed-factor artefact.
- **The ECRS composite the guide headlines is not implemented** — physRisk/transRisk are never
  division-weighted into an enterprise score.
- The TCFD score is genuine but based on self-assessed 0–3 item maturities.

**Framework alignment:** **TCFD (2017/2021)** — the physical/transition risk taxonomy and the
disclosure-item completeness score; **IFRS S2 (2023)** — the enterprise-wide climate-risk register and
cross-division aggregation the guide targets; **TNFD v1.0** — named for nature-risk extension; **NGFS**
— the Orderly/Disorderly/Hot-House scenario multipliers. The module presents the TCFD/ISSB *structure*
but computes VaR from random inputs rather than a risk model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce (a) a division-weighted Enterprise Climate Risk Score and (b) a genuine portfolio climate-VaR
with a real diversification structure, for a board-level TCFD/IFRS S2 climate-risk register across all
legal entities, asset classes, and geographies.

### 8.2 Conceptual approach
Two linked models: an **ECRS composite** (standardised phys+trans sub-scores aggregated by division
exposure weight, per **TCFD/IFRS S2** register practice) and a **climate-VaR** built from
scenario-conditioned loss distributions with a correlation-based portfolio aggregation. Benchmarks:
**MSCI Climate VaR**, **BlackRock Aladdin Climate**, **NGFS scenario stress**, **UNEP-FI TCFD banking
pilot**.

### 8.3 Mathematical specification
```
Standardise:  P_d, T_d ∈ [0,100]  (min-max across divisions)
ECRS = Σ_d w_d·(P_d + T_d) / Σ_d w_d,   w_d = Exposure_d / Σ Exposure

Climate-VaR (per exposure i, scenario s):
  Loss_i(s) = EAD_i · [ PD_climate_i(s)·LGD_climate_i  (credit)  ⊕  MtM_shock_i(s) (market) ]
  VaR_95(s) = Quantile_{0.95}( Σ_i Loss_i(s) )        // via MC or analytic
Portfolio aggregation (real diversification):
  VaR_portfolio = √( vᵀ Σ_corr v ),  v = vector of standalone VaRs, Σ_corr = correlation matrix
  DiversBenefit = Σ v_i − VaR_portfolio
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Division exposure weights | `w_d` | internal exposure data |
| Physical/transition sub-scores | `P_d,T_d` | hazard models (WRI/ND-GAIN) + NGFS transition |
| Climate PD/LGD | `PD_climate,LGD` | Merton/IFRS9 climate-conditioned (see climate-credit-integration) |
| Scenario multipliers | `s` | NGFS Phase IV GDP/carbon-price paths |
| Correlation matrix | `Σ_corr` | historical asset-class/sector correlations |

### 8.4 Data requirements
Per exposure: EAD, sector, geography, asset class, PD/LGD, physical-hazard exposure, transition-risk
drivers, and an asset-class/sector correlation matrix. Sources: internal exposure tape, NGFS scenarios,
WRI Aqueduct/ND-GAIN (platform reference data), historical correlations. Reuse the platform's
`climate-credit-integration` PD/LGD conditioning and hazard matrices.

### 8.5 Validation & benchmarking plan
Reconcile portfolio VaR against MSCI Climate VaR / Aladdin for a pilot book; validate the correlation
aggregation reduces to Σv only at ρ=1 and to √Σv² at ρ=0. Backtest scenario losses against NGFS
reference outputs. Sensitivity: correlation ±0.2 (replaces the fixed 0.75 factor), scenario multiplier.

### 8.6 Limitations & model risk
Climate-VaR tail estimation is data-sparse; correlation matrices are unstable under stress (correlations
→1 in crises, eroding diversification). The fixed 0.75 factor in the current code understates tail
co-movement. Conservative fallback: floor the aggregation correlation upward under Hot-House (stress
correlations toward 1), so diversification benefit shrinks — never assume independence in the tail.
