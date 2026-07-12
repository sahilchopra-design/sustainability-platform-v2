## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/eiopa-stress` wraps the **EIOPA ORSA Climate Stress Test Engine** ("E7",
`backend/services/eiopa_stress_engine.py`), a Solvency II Art. 45a climate stress tester for
(re)insurers. For each of four canonical scenarios it computes asset-side losses, liability-side
underwriting shocks, a post-stress SCR/MCR solvency position, a 12-point ORSA Art. 45a checklist,
and a resilience verdict. Core mechanics quoted from code:

```
Asset loss:   Σ_class  invested × class_pct × |shock_pct|          (equity/RE/infra/alternatives)
Bond loss:    invested × class_pct × Duration × Δspread            (ΔP ≈ −D·Δs; D = 7/5/4 yrs sov/IG/HY)
UW shock:     NatCat_EL × (amplifier − 1) + TP × reserve_shock%
            + TP × lapse_sensitive% × lapse_shock%
            + SumAssured × mortality_bps/10⁴ + Premium × morbidity_bps/10⁴
Own funds:    OF_post = OF − 0.80 × total_loss                     (20% tax offset)
SCR_post:     re-aggregated via BSCR = √(ΣΣ Corr_ij·SCR_i·SCR_j) + Op   (see §7.3)
Solvency:     ratio = OF_post / SCR_post × 100;  SCR breach if OF_post < SCR_post
```

### 7.2 Scenario parameterisation

`EIOPA_SCENARIOS` (in-code source note: "EIOPA 2022 Stress Test, EIOPA 2023 Insurance ST, NGFS
Phase IV"; the specific numbers are platform calibrations in the spirit of those exercises):

| Parameter | sudden_transition | orderly_transition | hot_house_world | below_2c |
|---|---|---|---|---|
| NGFS equivalent | Divergent Net Zero | Net Zero 2050 | Current Policies | Below 2 °C |
| Horizon / temp | 3y / 1.8 °C | 10y / 1.5 °C | 30y / 3.0 °C | 10y / 1.9 °C |
| Listed equity | −35% | −15% | −20% | −25% |
| Fossil-fuel equity | −55% | −30% | −10% ("fossil benefits short-term") | −40% |
| Commercial / resid. RE | −30 / −20% | −12 / −8% | −45 / −35% | −22 / −15% |
| Sov / IG / HY spreads (bp) | 120 / 250 / 550 | 40 / 80 / 200 | 200 / 180 / 400 | 80 / 160 / 380 |
| NatCat amplifier | 1.25 | 1.10 | 2.00 | 1.50 |
| Reserve / lapse shock | 5% / 8% | 2% / 3% | 15% / 12% | 8% / 6% |
| Mortality / longevity / morbidity (bp) | 30 / −10 / 40 | 15 / 5 / 20 | 80 / −30 / 100 | 45 / −5 / 60 |

Other constants: SCR module weights (market 45%, non-life UW 25%, life UW 20%, counterparty 5%,
operational 5% — an approximate decomposition, not regulatory); the **Solvency II standard-formula
correlation matrix** for BSCR (code cites Delegated Regulation (EU) 2015/35 Annex IV: mkt–cpty
0.25, mkt–life 0.25, mkt–nonlife 0.25, cpty–life 0.25, cpty–nonlife 0.50, life–nonlife 0.00);
management-action capacity by insurer type (life 30%, composite 28%, non-life 25%, reinsurer 20%,
captive 15% of stressed loss); 20% tax offset on losses; invested assets = assets − TP (fallback
85% of assets).

### 7.3 Calculation walkthrough

`POST /assess` runs all four scenarios (or a subset; `POST /assess/scenario` runs one,
`POST /assess/batch` many insurers). Per scenario:

1. **Asset shock** — equity is split into fossil subset (harsher shock) and non-fossil remainder;
   bonds use duration × spread; everything sums to `total_asset_loss_eur`.
2. **Underwriting shock** — five components per the formula block above.
3. **Capital impact** — a documented remediation is embedded here: the code decomposes the reported
   SCR into module charges via the weights, multiplies the market module by
   `1 + asset_loss%` and the non-life module by the NatCat amplifier, re-aggregates pre- and
   post-stress vectors through the correlation square-root formula (operational added outside the
   root), then **rescales so the pre-stress aggregation reproduces the firm's reported SCR**. The
   long in-code comment explains this replaced a linear weighted sum that "ignored diversification
   AND malformed the NatCat term… so a stress scenario could actually LOWER the SCR".
4. **Verdicts** — severity: MCR breach → extreme; SCR breach or loss > 30% of own funds → severe;
   > 15% → moderate; else mild. Recovery feasible if `OF_post + mgmt_capacity ≥ SCR_post`. Key
   drivers = top-3 loss components ≥ 5% of total. Resilience: MCR breach → critical, SCR breach →
   at_risk, worst ratio < 130% → vulnerable, else resilient.
5. **ORSA checklist** — 12 Art. 45a items scored from boolean input flags (two auto-met: risk
   identification, and life adjustment for non-life insurers; two inferred from data presence:
   portfolio quantification if assets > 0, SCR quantification if SCR > 0). Completeness % feeds
   gap thresholds at < 50% ("regulatory non-compliance") and < 80%.

Reference endpoints: `GET /ref/scenarios`, `/ref/insurer-types` (5 archetype profiles),
`/ref/orsa-checklist`, `/ref/frameworks`.

### 7.4 Worked example (hot_house_world, composite insurer)

Assets €10bn, TP €7bn → invested €3bn. Portfolio at input defaults (equity 15% incl. 3% fossil,
RE 8+4%, sov 35%, IG 25%, HY 5%, infra 3%, alt 2%). OF €1.2bn, SCR €0.8bn, MCR €0.36bn,
NatCat EL €50M, lapse-sensitive 20% of TP, sum assured €2bn, premium €400M.

| Component | Computation | Loss |
|---|---|---|
| Equity | 3bn×(0.12×0.20 + 0.03×0.10) | €81M |
| Real estate | 3bn×(0.08×0.45 + 0.04×0.35) | €150M |
| Sov bonds | 3bn×0.35×7×0.0200 | €147M |
| IG bonds | 3bn×0.25×5×0.0180 | €67.5M |
| HY bonds | 3bn×0.05×4×0.0400 | €24M |
| Infra + alt | 3bn×(0.03×0.35 + 0.02×0.30) | €49.5M |
| **Asset total** | (17.3% of invested) | **€519M** |
| NatCat | 50M×(2.00−1) | €50M |
| Reserves | 7bn×0.15 | €1,050M |
| Lapse | 7bn×0.20×0.12 | €168M |
| Mortality + morbidity | 2bn×0.008 + 400M×0.010 | €20M |
| **UW total** | | **€1,288M** |

Total loss €1,807M (150.6% of OF → severity at least severe). OF_post = 1.2bn − 0.8×1.807bn =
**−€245.6M** → SCR and MCR both breached → severity **extreme**, resilience **critical**;
shortfall = SCR_post + 245.6M. (SCR_post rises via market ×1.173 and non-life ×2.0 through the
correlation aggregation.)

### 7.5 Data provenance & limitations

- **Pure calculator; no PRNG/seeded data** — balance-sheet inputs are caller-supplied. Scenario
  shock magnitudes are **synthetic calibrations** inspired by EIOPA 2022/2023 stress-test design;
  they are not the published EIOPA shock tables.
- The SCR decomposition weights (45/25/20/5/5) are an assumed module mix applied to every insurer
  regardless of type; a life insurer's true market share of SCR would differ. The correlation
  matrix itself is regulation-accurate.
- Reserve deterioration applies a flat % of total TP — a large lever (dominates the worked example)
  with no line-of-business granularity; lapse/mortality/morbidity shocks are single-factor.
- 20% tax offset and management-action capacity rates are heuristics; no tiering of own funds,
  no risk margin recalculation, no transitional measures.
- Two auto-met ORSA checklist items mean completeness never reads below ~17% even with all
  flags false.

### 7.6 Framework alignment

- **Solvency II Art. 45a (as amended):** requires climate scenario analysis in the ORSA with at
  least two long-term scenarios (≤ 2 °C and > 2 °C); implemented via the 12-item checklist and the
  four-scenario run (orderly + disorderly satisfy Art45a-3).
- **Solvency II SCR/MCR (Art. 101/129, DR 2015/35):** SCR = 99.5% 1-yr VaR aggregated via the
  Annex IV correlation matrix — the engine reuses that exact matrix for BSCR re-aggregation;
  MCR breach as the regulatory-intervention floor.
- **EIOPA 2022 Insurance Stress Test / 2023 exercise:** sudden-transition design ("Scenario A")
  and NatCat amplification modules are mirrored in scenario structure.
- **NGFS Phase IV:** each scenario carries an explicit NGFS mapping (Divergent Net Zero, Net Zero
  2050, Current Policies, Below 2 °C) with temperature outcomes.
- **EIOPA Opinion EIOPA-BoS-21/127:** cited per checklist row as the supervisory source for
  governance, risk identification, horizons and data-quality disclosure expectations.
- **TCFD for insurers / ISSB S2:** double-materiality checklist item (Art45a-12) cross-references
  ISSB S2 integration.
