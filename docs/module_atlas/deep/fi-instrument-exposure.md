## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CT2) states
> `ClimateVaR_instrument = Notional · SectorRisk · Maturity_factor`. **The code does not use sector risk
> or a maturity factor.** The actual climate VaR is a **seeded percentage of notional**
> (`notional·(0.02 + sr()·0.12)`, i.e. a random 2–14% haircut), and green/brown classification is a
> seeded coin flip. Notional, maturity, taxonomy alignment — all synthetic. The aggregation arithmetic is
> real. Documented below.

### 7.1 What the module computes

200 instruments across 8 types, all seeded:

```js
notional   = round(5 + sr(i·11)·195)                       // $5–200M
maturity   = 2025 + floor(sr(i·7)·11)                      // 2025–2035
isGreen    = sr(i·13) > 0.55
climateVaR = round(notional · (0.02 + sr(i·17)·0.12))      // 2–14% of notional (seeded, NOT sector×maturity)
taxonomyAlignment = round(isGreen ? 60 + sr()·40 : sr()·40)
```

Aggregates: `totalNotional = Σ notional`, `totalVaR = Σ climateVaR`, `greenCount`, and per-type
`assetClassMix` (notional/count/VaR). `varByType` and `hedgingData` reproject these for charts.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `INSTRUMENT_TYPES` | 8: Term Loan, Revolver, Bond, CDS, Equity Swap, Mortgage, Trade Finance, Guarantee | **Real** capital-markets/lending instrument set |
| Climate VaR factor | `0.02 + sr()·0.12` (2–14%) | **Synthetic** — no sector risk, no maturity factor (contradicts guide) |
| Green threshold | `sr() > 0.55` | Seeded coin flip |
| Taxonomy alignment | 60–100 (green) / 0–40 (brown) | Seeded, but correctly bimodal by green flag |
| Currency | USD/EUR/GBP/JPY by `i%4` | Modular assignment |
| Notional, maturity | seeded | **Synthetic** |

### 7.3 Calculation walkthrough

1. `INSTRUMENTS` seeded once; each gets type, notional, maturity, green flag, climate VaR.
2. `totalNotional`, `totalVaR`, `greenCount` aggregate.
3. `assetClassMix` groups by instrument type (notional, count, VaR).
4. Maturity-profile tab bins by maturity year; Green-vs-Brown tab splits by the green flag; Hedging tab
   projects hedge ratios per type.

### 7.4 Worked example (instrument i = 3 → CDS)

| Step | Computation | Result |
|---|---|---|
| notional | round(5 + sr(33)·195) | round(5 + 0.6·195) ≈ $122M |
| maturity | 2025 + floor(sr(21)·11) | ~2031 |
| climateVaR | round(122·(0.02 + sr(51)·0.12)) | round(122·0.08) ≈ $10M (≈8%) |
| isGreen | sr(39) > 0.55 | maybe false |

The climate VaR (~$10M, ~8% of notional) is a random haircut — it does not vary with the CDS's sector or
its 6-year maturity, so the guide's `SectorRisk × Maturity_factor` structure is not reflected. The
aggregation (`totalVaR`) is correct arithmetic on these synthetic per-instrument figures.

### 7.5 Data provenance & limitations

- **All instrument data is synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`).
- **Climate VaR is a seeded % of notional**, not the sector×maturity product the guide claims — no sector
  transition intensity, no tenor sensitivity.
- **Green classification is a coin flip**, not an EU Taxonomy / ICMA assessment.
- Aggregations are genuine; the inputs are not.

**Framework alignment:** The instrument taxonomy is real; the module *gestures* at **Basel IV** exposure
classes, **EU Taxonomy** green alignment, and **ICMA** green-instrument principles in the guide, but the
climate-VaR itself is a random haircut with no risk-factor model behind it.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's `Notional·SectorRisk·Maturity_factor`
climate VaR is absent; the code uses a random haircut. Below is the production instrument-level climate-VaR
model.

**8.1 Purpose & scope.** Compute instrument-level climate value-at-risk across lending and capital-markets
products, with tenor and sector sensitivity, plus a real EU-Taxonomy green classification.

**8.2 Conceptual approach.** A transition-repricing climate-VaR mirroring **MSCI Climate VaR** and the
platform's `climate-credit-integration` engine: instrument value is repriced under an NGFS scenario via a
sector transition-risk factor and a maturity-scaled discount-rate shock, then the loss percentile is the
climate VaR.

**8.3 Mathematical specification.**

```
SectorRisk_s = normalised transition-risk score for the instrument's counterparty sector (NGFS-derived)
MaturityFactor = duration-based sensitivity, e.g. modified duration D or (years-to-maturity)^0.5
ClimateVaR_i = Notional_i · SectorRisk_s · MaturityFactor_i · shock_p       (p = 95th percentile scenario)
For credit instruments: ΔECL_i = PD_climate·LGD·EAD − PD_base·LGD·EAD   (from climate-credit engine)
Green: taxonomy_aligned% from eu_taxonomy_engine; green ⇔ aligned% ≥ threshold
Portfolio climate VaR = √(wᵀ Σ w) if correlations modelled, else Σ ClimateVaR_i (conservative)
```

| Parameter | Source |
|---|---|
| SectorRisk_s | NGFS Phase IV sector transition intensity |
| MaturityFactor | Instrument duration / cashflow schedule |
| Scenario shock p | NGFS disorderly / hot-house percentile |
| Green alignment | `eu_taxonomy_engine` |

**8.4 Data requirements.** Instrument tape (type, notional, maturity, cashflows, counterparty sector),
NGFS sector factors, taxonomy alignment. Platform holds NGFS tables, the climate-credit engine, and the
taxonomy engine.

**8.5 Validation & benchmarking plan.** Reconcile instrument VaR against MSCI Climate VaR where issuers
overlap; check maturity monotonicity (longer tenor → higher VaR); benchmark green classification against
the taxonomy engine.

**8.6 Limitations & model risk.** Simple sum of instrument VaRs ignores diversification — flag as
conservative; add a correlation matrix for portfolio VaR. Conservative fallback: absent sector data, use
the highest-risk sector factor.
