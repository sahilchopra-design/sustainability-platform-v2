## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies
> `ClimateRWA_i = RWA_i × (1 + α×PhysicalRisk_i + β×TransitionRisk_i)` with α/β calibrated to ECB
> stress-test haircuts and NGFS transition cost curves, and a buffer `max(0, ClimateRWA − RWA)`.
> **The code implements a different mechanic:** the institution engine (`computeCapital`) applies a
> *Pillar-2 capital deduction* proportional to climate-RWA share (not an RWA multiplier), and the
> physical/transition risk scores never enter the CET1 calculation — `physicalRiskScore` feeds only
> a side "stress buffer" figure and `transitionRiskScore` is generated but **never used**. A
> separate tab ("Climate RWA Engine") does apply per-asset-class climate multipliers, but with
> hard-coded constants, not ECB/NGFS calibrations. All institutions are synthetic. §8 specifies the
> supervisory-grade model the guide describes.

### 7.1 What the module computes

**(a) Institution capital engine** — for 100 named institutions (real bank names, synthetic
balance sheets), per selected scenario:

```js
pillar2AddOn = climatRWAPct × totalRWA × (scenario.pillar2AddPct/100) × rule.pillarMult
garBonus     = greenLoanPct > 0.30 ? pillar2AddOn × scenario.greenBonus : 0
netPillar2   = max(0, pillar2AddOn − garBonus)
cet1Impact   = (tier1Capital × totalRWA − netPillar2) / totalRWA      // a ratio
shortfall    = max(0, rule.minCET1/100 − cet1Impact)
stressBuffer = physicalRiskScore × 0.001 × totalRWA × scenario.natcatMult
at1Trigger   = max(0, cet1Capital×100 − 5.125)                        // headroom to AT1 conversion
```

**(b) Climate RWA engine (tab 4)** — for 12 asset classes with SA/IRB base weights:

```js
carbonAdj      = strandedHaircut × (carbonPrice / 200)
climateMult'   = 1 + (climateMult − 1) × (carbonPrice / 100)
adjustedWeight = min(2.5, baseWeight × climateMult' + carbonAdj)
```

**(c) Capital optimizer (tab 6)** — a stylised single-bank what-if:
`adjCET1 = 12% − (CP/100)×fossil%×0.015 − P2G% + garBonus − pillar2AddPct×0.003`.

**(d) DFAST overlay (tab 7)** — `stressed = baseline − LLP×(adverse?1.5:0.8) − (adverse?0.2:0.05)`
over a 9-quarter seeded path; regulatory minimum switches by regulator (Fed 9.5 / PRA 11.0 / ECB 10.5).

### 7.2 Parameterisation

**Jurisdiction rule table (`JURIS_RULES`)** — 10 jurisdictions; illustrative values loosely shaped
on real regimes (all synthetic demo values, no citation in code):

| Juris | Framework label | minCET1 | pillarMult | greenBonus | G-SIB | CCyB | P2R avg | climateCapBuf |
|---|---|---|---|---|---|---|---|---|
| EU | CRR2 + EBA GL | 10.5 | 1.20 | 0.12 | 1.5 | 0.5 | 2.0 | 0.25 |
| UK | PRA SS3/19 | 11.0 | 1.15 | 0.10 | 1.0 | 1.0 | 2.5 | 0.30 |
| US | FRB Climate Pilot | 9.5 | 1.00 | 0.05 | 2.0 | 0.0 | 1.5 | 0.10 |
| CH | FINMA Circ 2017/7 | 12.0 | 1.25 | 0.10 | 2.5 | 0.5 | 3.0 | 0.35 |
| … | (Canada B-15, APRA CPG 229, JFSA, MAS, CBUAE, BCB) | 8.5–10.25 | 0.95–1.10 | 0.04–0.08 | 0–0.5 | 0–0.25 | 1.2–2.0 | 0.08–0.20 |

**Scenario table (`SCENARIOS`)** — 8 scenarios labelled "NGFS" in one chart caption but only
partially NGFS-shaped (Bifurcated, Policy Shock, Tech Revolution are not NGFS scenarios):
Baseline (add-on 0), Orderly 1.5 °C (0.8%, natcat ×1.2), Disorderly 2 °C (1.5%, ×1.5),
Hot House 3 °C (2.8%, ×2.2), Tail 4 °C+ (4.5%, ×3.5), Bifurcated (2.0%), Policy Shock (3.2%),
Tech Revolution (0.5%, greenBonus 0.15). All synthetic demo values.

**Asset-class table** — e.g. Fossil Fuel Exposure: SA weight 150%, IRB 110%, climateMult 1.65,
stranded haircut 45%; Green Bonds: SA 20%, climateMult 0.85, haircut 2%. The SA weights broadly
echo Basel III standardised risk weights (residential mortgage 35%, corporate 100%, equity 150%);
climate multipliers and haircuts are synthetic.

### 7.3 Calculation walkthrough

Scenario selector → `computeCapital` re-runs for all 100 institutions (`enriched`) → filters
(type/jurisdiction/carbon-intensive/search) → portfolio KPIs: mean `cet1Impact`, breach count
(`shortfall > 0`), total shortfall `Σ shortfall × totalRWA` (rendered as $Bn via CurrencyToggle),
mean leverage and TLAC. The stress matrix (tab 5) re-runs `computeCapital` under two user-chosen
scenarios side by side; the sensitivity tab draws `12.0 + impact × x × 0.5 + noise` around a
hard-coded 12% CET1 base using a 12-driver elasticity table (e.g. "Physical Risk Score +10pts" →
−6.2bp, "Green Loan Pct +10%" → +2.2bp; all synthetic).

### 7.4 Worked example (institution i = 0, "Barclays Global", Disorderly 2 °C)

At i = 0 every seed `i×k = 0`, so all draws collapse to `sr(0) = 0.7098` (a seed-collision quirk):
jurisdiction = Switzerland (idx ⌊0.7098×10⌋ = 7), totalRWA = 50 + 0.7098×950 = **$724.4Bn**,
tier1Capital = 0.08 + 0.7098×0.10 = **15.10%**, cet1Capital = 15.10% − 2.77% − 0.35% = **11.97%**,
climatRWAPct = 0.05 + 0.7098×0.30 = **26.3%**, greenLoanPct = 0.7098×0.45 = **31.9%** (> 30% → GAR
bonus eligible), physicalRiskScore = **66.8**.

| Step | Computation | Result |
|---|---|---|
| pillar2AddOn | 0.263 × 724.4 × (1.5/100) × 1.25 (CH pillarMult) | **$3.57Bn** |
| garBonus | 3.57 × 0.05 (scenario greenBonus) | **$0.18Bn** |
| netPillar2 | 3.57 − 0.18 | **$3.39Bn** |
| cet1Impact | (0.1510×724.4 − 3.39) / 724.4 | **14.63%** |
| shortfall | max(0, 12.0% − 14.63%) | **0 → PASS** |
| stressBuffer | 66.8 × 0.001 × 724.4 × 1.5 | **$72.6Bn** |
| at1Trigger headroom | 11.97 − 5.125 | **6.85 pp** |

### 7.5 Data provenance & limitations

- **All institution balance sheets are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`) attached
  to real bank names — RWA, capital ratios, emissions and risk scores are not real filings. An
  India-mode adapter (`adaptForCapitalAdequacy`) can swap in an alternative dataset.
- **Methodological bug:** `cet1Impact` divides *Tier-1* capital (CET1 + AT1) by RWA but compares
  it to the *CET1* minimum — overstating headroom by the AT1 ratio (~1–3.5pp).
- `transitionRiskScore` is generated but unused; physical risk affects only the side buffer, so
  the headline CET1 result is insensitive to both risk scores — contradicting the guide's α/β story.
- Scenario add-ons (`pillar2AddPct`) are flat percentages of climate-RWA share, not derived from
  any loss model; the 5.125% AT1 trigger is the only Basel constant used exactly.
- Real regime constants are approximated: e.g. minimums bundle P1+CCB+typical P2R rather than
  citing actual SREP outcomes; "FRB Pilot" and "FSA Climate" impose no climate capital in reality.

**Framework alignment:** *Basel III/IV (BCBS)* — the 4.5% CET1 minimum, 2.5% CCB, G-SIB surcharge,
CCyB, leverage (3%) and TLAC (18%) stack in the waterfall follows the Basel composition; SA risk
weights in the asset table track CRE20. *BCBS d532 Principles (2022)* — motivates the
scenario-based capital overlay; d532 itself mandates risk management, not capital add-ons.
*ECB/SSM climate expectations & EBA GL* — the "Pillar 2 add-on" framing mirrors how ECB embeds
climate in SREP P2R/P2G qualitatively; the ECB has not published multiplier tables like these.
*EU GAR (Green Asset Ratio, CRR Art. 449a)* — the >30% green-loan bonus gate is a stylised GAR
incentive; no such capital discount exists in regulation. *DFAST/CCAR (Fed SR 15-18)* — 9-quarter
horizon and PPNR/LLP decomposition follow the CCAR template shape.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Estimate climate-adjusted RWA, CET1 trajectories and Pillar-2 capital guidance for a bank loan
book under NGFS scenarios — the ICAAP/SREP decision the guide promises. Coverage: banking-book
credit exposures by sector × geography × asset class; 3–10y horizon.

### 8.2 Conceptual approach

Translate scenario paths into PD/LGD shifts and re-derive RWA through the **Basel IRB risk-weight
function**, rather than scaling RWA directly — the approach used in the ECB 2022 economy-wide
climate stress test and EBA Fit-for-55 exercise, and commercially in **BlackRock Aladdin Climate**
(scenario-conditioned credit repricing) and **Moody's climate-adjusted EDF**. Physical risk enters
via collateral damage → LGD; transition risk via sector carbon-cost → EBITDA → PD migration.

### 8.3 Mathematical specification

```
Transition channel: ΔEBITDA_s(t) = −CP(t) × EI_s × (1 − pass_s)          (carbon cost)
                    PD_i(t)      = Φ( Φ⁻¹(PD_i⁰) + γ_s · ΔEBITDA_s/σ_s )  (Merton-style shift)
Physical channel:   LGD_i(t)     = LGD_i⁰ + δ · Damage_h(t) × collateral_share_i
IRB weight:         K_i = LGD·Φ( (Φ⁻¹(PD) + √R·Φ⁻¹(0.999)) / √(1−R) ) − PD·LGD ;  RWA = 12.5·K·EAD
                    R = 0.12(1−e⁻⁵⁰ᴾᴰ)/(1−e⁻⁵⁰) + 0.24[1−(1−e⁻⁵⁰ᴾᴰ)/(1−e⁻⁵⁰)]   (BCBS CRE31)
Buffer:             ClimateP2G(t) = max(0, [RWA_climate(t) − RWA_base] × CET1_target ) / RWA_base
CET1 path:          CET1(t) = CET1(0) + retained earnings − ΔECL − ΔRWA effect
```

| Parameter | Calibration source |
|---|---|
| CP(t) carbon price paths | NGFS Phase IV/V scenario database (REMIND/GCAM/MESSAGE marker models) |
| EI_s sector emission intensity | EPA EEIO / Eurostat air-emissions accounts; platform OWID CO₂ reference data |
| pass_s cost pass-through | ECB 2022 CST sectoral elasticities (0.3–0.8) |
| γ_s EBITDA→PD sensitivity | Moody's EDF sector betas; EBA FF55 PD migration matrices |
| Damage_h hazard damage | EM-DAT + Swiss Re sigma loss ratios by peril; JRC damage functions |
| δ LGD uplift slope | ECB CST collateral haircut tables (RRE/CRE flood: 5–30%) |
| CET1_target | Institution SREP requirement (public Pillar-3 disclosures) |

### 8.4 Data requirements

Exposure-level: EAD, PD, LGD, sector (NACE), collateral geography & type, maturity. Sources:
internal loan tape (vendor: none needed); NGFS scenario CSVs (free), EM-DAT (free), Pillar-3
reports (free). Platform fit: NGFS scenario tables and hazard layers already exist in the
climate-scenario and physical-risk modules; `reference_data` holds OWID/World Bank series; the
12-asset-class taxonomy here maps to CRE20 exposure classes.

### 8.5 Validation & benchmarking plan

- Reconcile system-wide CET1 depletion against published ECB 2022 CST results (median ~−60bp
  orderly / −180bp disorderly over 3y) and EBA FF55 (2025).
- Benchmark PD shifts against Moody's climate-adjusted EDF sector deltas.
- Sensitivity: carbon-price ±50%, pass-through ±0.2, damage-function swap (JRC vs sigma).
- Backtest physical LGD uplift on realised post-flood recovery data where available.

### 8.6 Limitations & model risk

Sector-level transmission misses obligor heterogeneity (mitigant: obligor carbon data where
disclosed); IRB formula assumes ASRF single-factor correlation — climate is plausibly systematic
beyond R (mitigant: stressed R sensitivity); NGFS paths are not probability-weighted forecasts.
Conservative fallback: floor climate P2G at the jurisdiction's announced climate-buffer guidance
where the model output is lower.
