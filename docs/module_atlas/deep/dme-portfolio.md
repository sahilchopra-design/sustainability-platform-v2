## 7 · Methodology Deep Dive

The DME Portfolio module aggregates entity-level DME signals to the portfolio: a weight-weighted DMI,
Herfindahl concentration, a weighted regime, **Brinson-style attribution** (selection/allocation/
interaction), and **PCAF financed emissions** via an attribution factor. Holdings come from LocalStorage
(user portfolio) enriched against `GLOBAL_COMPANY_MASTER`, with `sr()` fallbacks. No guide record was
supplied, so no mismatch flag — the caveat is on synthetic fallback data.

### 7.1 What the module computes

```js
// Weighted portfolio DMI (weights normalised to their own sum)
portfolioDMI = Σ (wᵢ/Σw)·dmiᵢ
// Concentration (Herfindahl on % weights)
HHI = Σ ((wᵢ/Σw)·100)²
// Weighted regime (Normal=1…Extreme=4) → banded
weighted = Σ (wᵢ/Σw)·regimeScoreᵢ ;  ≥3.5 Extreme | ≥2.5 Critical | ≥1.5 Elevated | else Normal
// Brinson attribution vs benchmark
selection   = (dmiᵢ − benchDMI)·wᵢ
allocation  = (wᵢ − benchWᵢ)·(benchDMI − portfolioDMI)
interaction = (wᵢ − benchWᵢ)·(dmiᵢ − benchDMI)
total = selection + allocation + interaction
// PCAF financed emissions
attributionFactor = outstanding / EVIC          (0 if EVIC≤0)
financedEmissions = AF·(scope1 + scope2 + scope3)
```

### 7.2 Parameterisation / scoring rubric

| Object / constant | Value | Provenance |
|---|---|---|
| Regime scores | Normal 1 / Elevated 2 / Critical 3 / Extreme 4 | ordinal encoding |
| Regime bands | ≥1.5 / ≥2.5 / ≥3.5 | midpoint thresholds |
| DMI→regime (holding) | >80 Extreme, >60 Critical, >35 Elevated | `enrichHoldings` |
| Velocity classification | vel>3 DECLINER, <−3 IMPROVER, else STABLE | heuristic |
| NGFS scenarios | 6 (NZ2050 1.5°C … Current Policies 3.0°C) | NGFS Phase IV labels + temps |

Fallback enrichment (only when the master lacks the field), via `sRand(seed)=frac(sin(seed+1)×10⁴)`:
`dmi 40–90`, `velocity −10…+10`, `scope1 5k–505k`, `scope2 2k–202k`, `scope3 10k–2.01M tCO₂e`,
`EVIC = marketCap or (50–5050)·$1M`, `weight = allocation or equal-weight`.

### 7.3 Calculation walkthrough

1. Load the user's holdings from `ra_portfolio_v1` (LocalStorage); if empty, a demo set is used.
2. `enrichHoldings` matches each holding to `GLOBAL_COMPANY_MASTER` by name/ticker, filling DMI, regime,
   emissions and EVIC (real where present, seeded otherwise).
3. Portfolio KPIs: weighted DMI, HHI, weighted regime, total financed emissions (Σ AF·emissions),
   weighted-average carbon intensity.
4. Attribution tab decomposes portfolio-vs-benchmark DMI into selection/allocation/interaction.
5. NGFS tab applies scenario overlays to portfolio risk.

### 7.4 Worked example (2-holding portfolio)

Holdings: A (weight 60, DMI 70, regime Critical=3), B (weight 40, DMI 45, regime Elevated=2). Σw=100.
```
portfolioDMI = 0.6·70 + 0.4·45 = 42 + 18 = 60.0
HHI = (60)² + (40)² = 3600 + 1600 = 5200            // moderately concentrated (2-name)
weighted regime = 0.6·3 + 0.4·2 = 1.8 + 0.8 = 2.6 → Critical (≥2.5)
```
PCAF for A: outstanding $600M, EVIC $3000M → AF = 0.20; emissions (S1+S2+S3)=500 000 tCO₂e →
financedEmissions = 0.20·500 000 = **100 000 tCO₂e**.
Brinson (A) vs bench (benchW 50, benchDMI 55): selection=(70−55)·0.6=9.0; allocation=(0.6−0.5)·(55−60)=−0.5;
interaction=(0.6−0.5)·(70−55)=1.5; total = **10.0**.

### 7.5 Data provenance & limitations

- Holdings can be **real** (user-entered, matched to master) but any missing DMI/emissions/EVIC field is
  **synthetic** via `sRand`. Emissions fallbacks span wide ranges, so unmatched names produce arbitrary
  financed-emissions figures.
- HHI uses percentage weights, so it ranges 0–10 000 (not the 0–1 normalised form) — read against the
  10 000 = single-name maximum.
- Regime ordinal averaging treats the 4 regimes as equally spaced, which understates tail (Extreme)
  concentration.
- The attribution is a single-period Brinson-Fachler analogue on DMI, not returns.

**Framework alignment:** **PCAF** financed-emissions (attribution factor = outstanding/EVIC, then
AF×(S1+S2+S3)) — PCAF's Global GHG Accounting Standard for listed equity/corporate debt; **Brinson-Fachler
attribution** (selection + allocation + interaction) applied to an ESG score rather than return;
**Herfindahl-Hirschman** concentration; **NGFS Phase IV** scenario set for portfolio transition overlays.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (fallback data + PCAF DQ).**

### 8.1 Purpose & scope
Portfolio-level climate & materiality analytics: weighted DMI, concentration, financed emissions with
PCAF data-quality scoring, and scenario-conditioned portfolio loss — for the user's actual book.

### 8.2 Conceptual approach
Replace `sr()` fallbacks with a **PCAF-compliant financed-emissions engine** (attribution by EVIC/total
equity+debt, DQ-scored 1–5) and a **scenario-repricing overlay** per NGFS pathway. Benchmarks: PCAF
Global GHG Accounting Standard, MSCI/Trucost portfolio carbon, NGFS Phase IV, TCFD portfolio alignment.

### 8.3 Mathematical specification
```
Attribution: AF = outstandingᵢ / EVICᵢ  (listed equity/corporate debt asset class)
Financed emissions = Σᵢ AFᵢ · (S1ᵢ+S2ᵢ+S3ᵢ) ; WACI = Σᵢ wᵢ·(emissionsᵢ/revenueᵢ)
Data-quality score DQ_i ∈ {1..5} by data source (reported→estimated); portfolio DQ = Σ wᵢ·DQᵢ
Scenario loss = Σᵢ wᵢ · Valueᵢ · repricingFactor_s(sectorᵢ)   (NGFS transition path)
Portfolio DMI, HHI, Brinson as in §7 but on validated inputs
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| EVIC / outstanding | — | issuer financials, position data |
| Emissions S1–S3 | — | CDP, company reports (DQ-scored) |
| PCAF DQ scores | 1–5 | PCAF standard |
| Repricing factors | — | NGFS Phase IV sector paths |

### 8.4 Data requirements
Position-level holdings (already from LocalStorage), issuer EVIC and Scope 1–3 emissions with source
provenance, revenue for WACI, sector mapping. Free: CDP, SBTi; platform holds `GLOBAL_COMPANY_MASTER`
and NGFS labels.

### 8.5 Validation & benchmarking plan
Reconcile financed emissions against a PCAF-audited calculation; check WACI vs a vendor portfolio-carbon
report; verify HHI and Brinson decomposition sum-to-total; scenario loss sensitivity to NGFS notch.

### 8.6 Limitations & model risk
Scope 3 emissions are highly uncertain and double-count across the value chain; EVIC volatility distorts
attribution factors intra-year. Conservative fallback: assign worst-case DQ (5) and flag unmatched
holdings rather than seeding plausible emissions.
