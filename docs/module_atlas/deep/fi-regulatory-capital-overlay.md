## 7 · Methodology Deep Dive

The FI Regulatory Capital Climate Overlay (EP-CT4) is a **descriptive regulatory-capital dashboard**:
it lays out a Basel III/IV capital stack, a per-asset-class RWA climate add-on, an NGFS stress→SCB
table and an ECB-vs-BoE alignment scorecard. The guide's headline formula
(`RWA_climate = RWA_base + ClimateAddon; CET1_ratio = CET1 / RWA_climate`) is only *partially*
present: the module builds `RWA_base + ClimateAddon` per asset class, but it never computes an actual
CET1 ratio — the "80 bps Climate P2R" and the per-class adjustment percentages are **hard-coded
supervisory heuristics**, not derived from any capital or PD model. This is the trigger for §8.

### 7.1 What the module computes

Everything is arithmetic over three hand-authored tables.

```js
TOTAL_RWA = Σ ASSET_CLASSES[i].rwa                    // 45,000 ($M)  → $45.0B
TOTAL_ADJ = Σ ASSET_CLASSES[i].climateAdj             //  4,830 ($M)  → $4.83B
Adj % of RWA = TOTAL_ADJ / TOTAL_RWA × 100            // 10.7 %
```

The **capital stack** (Basel III minima + buffers + Pillar 2 + climate add-on) is expressed as a
fixed set of percentages of `TOTAL_RWA`:

```js
value = round(TOTAL_RWA × pct)      // per stack component
Total requirement % = Σ pct         // 4.5+2.5+0.5+1.5+2.0+0.8 = 11.8 %
Total requirement $ = Σ value       // ≈ $5,310M
```

The **climate add-on per asset class** is *stored, not computed*: each row carries `climateAdj` and
`adjPct` directly. Severity badge is a pure threshold on `adjPct` (§7.5). The NGFS stress table and
the ECB/BoE scorecard are likewise static.

### 7.2 Parameterisation / scoring rubric

**Capital stack (percentages of RWA)** — Basel III fixed pillars with an estimated climate top-up:

| Component | pct of RWA | Provenance |
|---|---|---|
| CET1 Minimum | 4.5 % | Basel III Pillar 1 CET1 minimum |
| Capital Conservation Buffer | 2.5 % | Basel III CCB |
| Countercyclical (CCyB) | 0.5 % | Illustrative CCyB setting (0–2.5% range) |
| G-SIB Buffer | 1.5 % | Illustrative G-SIB bucket (1.0–3.5%) |
| Pillar 2 Requirement (P2R) | 2.0 % | Illustrative SREP P2R |
| Climate Add-on (est.) | 0.8 % | **Synthetic heuristic** ("80 bps") — no model behind it |

**Asset-class RWA & climate adjustment** (all `$M`, hand-authored):

| Asset class | Base RWA | Climate adj | adj % | Basel weight |
|---|---|---|---|---|
| Corporate | 18,200 | 1,820 | 10 % | 100 |
| Sovereign | 4,200 | 210 | 5 % | 0 |
| Retail | 8,400 | 420 | 5 % | 75 |
| Real Estate | 6,800 | 1,360 | 20 % | 35 |
| Infrastructure | 3,200 | 480 | 15 % | 50 |
| Equity | 2,400 | 360 | 15 % | 250 |
| Securitisation | 1,800 | 180 | 10 % | 20 |

The `adjPct` values encode a qualitative ordering (real estate physical/EPC risk highest at 20%;
sovereign/retail lowest at 5%) but are not tied to exposures, EPC ratings or scenario sensitivities.

**NGFS stress → SCB** (`rwaImpact %`, `capitalRatio Δ`, `scb bps`), 6 scenarios, static: Delayed
Transition is worst (RWA +9.4%, −2.2pp CET1, 125bps SCB), Current Policies mildest (+2.1%) — this
correctly mirrors the NGFS finding that *disorderly* transitions are hardest on bank capital.

### 7.3 Calculation walkthrough

1. Sum `rwa` and `climateAdj` across the 7 classes → headline `$45.0B` RWA, `$4.83B` adjustment.
2. `Adj % = 4,830 / 45,000 = 10.7%` (KPI card).
3. Capital-stack chart: each `pct × TOTAL_RWA` → bar `$M`; footer sums pct (11.8%) and $ (~$5.31B).
4. Pillar-2 tab: render the stored `adjPct` with a HIGH/MEDIUM/LOW badge.
5. SCB tab: plot `rwaImpact` and `scb` bars directly from `NGFS_STRESS`.
6. Alignment tab: plot `ecbScore`/`boeScore` and the text table.

No user input feeds the maths (the `selectedScenario` state is declared but the scenario tab renders
all six regardless).

### 7.4 Worked example (Real Estate class)

`rwa = 6,800`, `climateAdj = 1,360`, so `adjPct = 1,360/6,800 = 20%` → badge `HIGH` (≥15%).
Its share of the portfolio add-on is `1,360 / 4,830 = 28.2%` — real estate alone drives over a
quarter of the total climate RWA uplift despite being 15% of base RWA (`6,800/45,000`), reflecting
the 20% class heuristic. Feeding into the stack, the climate add-on line is `0.8% × 45,000 = $360M`
of capital — deliberately *smaller* than the $4,830M RWA add-on, because the 80bps is a capital
top-up on total RWA, not a 1:1 pass-through of the RWA adjustment.

### 7.5 Severity & status rubrics

| Rubric | Rule | Basis |
|---|---|---|
| Asset-class severity | adjPct ≥15 → HIGH · ≥10 → MEDIUM · else LOW | UI heuristic |
| Timeline status | ACTIVE (2025) · UPCOMING (2026) · PLANNED (2027–28) | Basel IV / CRR3 phase-in calendar |

The **timeline** (2025–2028) tracks real regulatory milestones: Basel IV output-floor phase-in
(50%→72.5%), ECB SREP climate integration and mandatory P2R, and BoE SS3/19 + transition-plan
requirements — these dates are genuine public regulatory reference points, not synthetic.

### 7.6 Data provenance & limitations

- **No PRNG in this module** — `sr()` is defined but unused. Instead the risk quantities are
  **hand-authored demo constants**: the climate adjustments, the 80bps P2R, the NGFS RWA impacts and
  the ECB/BoE scores are illustrative, not computed from any exposure or scenario model.
- The guide's `CET1_ratio = CET1 / RWA_climate` is **not implemented** — the module never divides
  capital by RWA; it only presents the stack as % of RWA.
- The Basel IV **output floor** (IRB RWA ≥ 72.5% of SA RWA) named in the guide brief is described in
  the timeline text but not calculated.
- No obligor-level data, no scenario re-run — this is a presentation layer over a would-be model.

**Framework alignment:** Basel III/IV Pillar 1 minima + buffers (CET1 4.5%, CCB 2.5%, CCyB, G-SIB) ·
CRR3 output floor (phase-in 50%→72.5%, 2025–2030) · ECB *Guide on climate-related and environmental
risks* + SREP Pillar 2 (P2R/P2G) · BoE SS3/19 and CBES climate stress exercise · NGFS Phase IV
scenario set for the stress→SCB mapping. The module *narrates* these frameworks faithfully but does
not run their quantitative machinery.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The dashboard displays a "Climate P2R
(80 bps)", per-class RWA add-ons and an NGFS→SCB mapping with no model behind any of them. Below is
the production model an FI would need to defend these numbers to the ECB/PRA.

### 8.1 Purpose & scope
Quantify the **incremental regulatory capital** a bank must hold for climate-related credit and
market risk: (i) a scenario-conditioned RWA uplift per Basel asset class, (ii) a Pillar-2
Requirement (P2R) climate add-on in basis points, and (iii) a stress capital buffer (SCB) sized to
peak CET1 depletion under NGFS scenarios. Coverage: banking-book credit exposures (corporate,
retail, real estate, infrastructure, sovereign) plus material trading-book climate factors.

### 8.2 Conceptual approach
Two-block design mirroring supervisory practice:
- **RWA repricing block** — climate-conditioned PD/LGD feeding the IRB risk-weight function
  (BCBS Basel II §272 formula), benchmarked against the **ECB 2022 economy-wide climate stress test**
  and **Aladdin Climate** transition-risk repricing.
- **Capital-adequacy block** — project CET1 ratio path under NGFS scenarios, set SCB = max peak-to-
  trough CET1 depletion, benchmarked against **BoE CBES** and **EBA one-off Fit-for-55** exercises.
Chosen because IRB is the regulatory-sanctioned RWA engine and CET1-depletion sizing is exactly how
the SCB/P2G is set in the Fed CCAR and ECB SREP.

### 8.3 Mathematical specification
Per obligor *i*, scenario *s*:
```
PD_s(i)  = Φ( Φ⁻¹(PD₀) + β_T·CI_i·Δcp_s + β_P·Phys_i·Δh_s )      climate-shifted PD
LGD_s(i) = min(1, LGD₀·(1 + γ·collateralClimateHaircut_s))
K(i)     = LGD·[ Φ( (Φ⁻¹(PD) + √R·Φ⁻¹(0.999)) / √(1−R) ) − PD ]·MA   (Basel IRB, R=asset corr)
RWA_s(i) = K(i)·12.5·EAD_i
ClimateAddon = Σ_i RWA_s(i) − Σ_i RWA_base(i)
P2R_climate (bps) = 10000 · (RequiredCapital_s − RequiredCapital_base) / RWA_base
SCB (bps)  = 10000 · max_t ( CET1_base,t − CET1_s,t ) / RWA
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| β_T | PD sensitivity to carbon-price×intensity | ECB 2022 stress-test transition elasticities |
| β_P | PD sensitivity to physical hazard | NGFS Phase IV chronic/acute damage functions |
| Δcp_s | carbon-price shock ($/tCO₂e) | NGFS Phase IV / IEA WEO scenario carbon prices |
| Δh_s | hazard-frequency multiplier | EM-DAT + Swiss Re sigma catastrophe trends |
| R | IRB asset correlation | BCBS Basel II IRB formula (0.12–0.24) |
| MA | maturity adjustment | BCBS IRB `b(PD)` function |
| collateral haircut | LGD uplift for stranded collateral | CRREM stranding + EPC value loss studies |

### 8.4 Data requirements
Per exposure: EAD, base PD, base LGD, maturity, Basel asset class, NACE/sector, carbon intensity
(tCO₂e/$M rev), physical hazard score, collateral type & EPC. Sources: internal IRB parameter store;
carbon intensity from **PCAF financed-emissions engine** (already on platform); hazard scores from
the platform's physical-risk layer; scenario carbon prices from **NGFS Phase IV** (public);
CRREM stranding pathways (public). CET1 and buffer settings from the bank's COREP returns.

### 8.5 Validation & benchmarking plan
Backtest scenario RWA uplift against the bank's realised NGFS stress-test submission; reconcile P2R
add-on against the ECB SREP letter (bps); sensitivity-test β_T/β_P (±50%) and R; benchmark the CET1
depletion path against **EBA/ECB** published aggregate results and **BoE CBES** peer ranges. Stress
the output floor (IRB RWA vs 72.5% of SA RWA) to confirm which classes are floor-bound.

### 8.6 Limitations & model risk
IRB linearisation of climate shocks understates tail non-linearity; carbon-price elasticities are
scenario-averaged, not path-dependent; physical damage functions are region-coarse. Conservative
fallback: apply the maximum class-level add-on across scenarios and floor the SCB at the ECB pilot
range (25–125 bps) rather than the point estimate.
