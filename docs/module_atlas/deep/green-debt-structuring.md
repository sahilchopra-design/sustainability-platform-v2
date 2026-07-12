## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-DD2) describes green-debt structuring: greenium, net-benefit vs SPO/reporting
cost, and SLL margin-ratchet mechanics. The code implements the **coupon step-up/step-down ratchet**
faithfully from seeded KPI target/actual pairs, and displays greenium/oversubscription/impact analytics —
but the greenium and all instrument fields are **seeded**, and the guide's "net benefit = greenium savings
− SPO cost − reporting cost" is not computed as a P&L in code. Sections below document the ratchet (the
real calculation) and flag the seeded pricing; §8 specifies the net-benefit pricing model.

### 7.1 What the module computes

Instruments seed notional, greenium, coupon, oversubscription, and a KPI target/actual pair. The live
ratchet logic:
```js
miss     = max(0, kpiTarget − kpiActual) / max(0.1, kpiTarget) · 100     // % shortfall
stepUp   = miss > 0 ? +(miss · carbonStepUp/100).toFixed(2) : 0           // coupon step-up (bps-scaled)
stepDown = kpiActual > kpiTarget                                          // outperformance reward
           ? +(((kpiActual − kpiTarget)/max(0.1,kpiTarget))·100·0.3).toFixed(2) : 0
kpiOnTrack = count(kpiActual ≥ kpiTarget · kpiMiss/100)                   // # meeting threshold
```
Portfolio KPIs: `totalNotional`, AUM… `avgGreenium = mean(greenium)`, `avgOverSub`, `totalImpact`.
`spoScore = 60 + sr(id·11)·35` proxies second-party-opinion quality.

### 7.2 Parameterisation / provenance

| Field | Generator | Provenance |
|---|---|---|
| `type` | 7 labels (Green/SLB/Transition/Blue/SDG/Social/Sustainability) | ICMA label set |
| `notional` | `0.2 + sr·4.8` ($B) | synthetic |
| `greenium` | `−(2 + sr·20)` bps | synthetic (−2 to −22 bps; consistent with ICMA ranges) |
| `kpiTarget` | `20 + sr·60` | synthetic SPT |
| `kpiActual` | `kpiTarget·(0.6 + sr·0.7)` | synthetic realised (60–130% of target) |
| `coupon` | `1.5 + sr·4` % | synthetic |
| `oversubRatio` | `1.2 + sr·4.8` | synthetic order-book cover |
| `carbonStepUp` slider | user | ratchet sensitivity |
| step-down factor | 0.3 | code constant — outperformance reward is 30% of the miss-scaling |

The ratchet **is** the model here: symmetric-ish (asymmetric 0.3× on the downside) coupon adjustment tied
to KPI achievement — the mechanic ICMA's SLB Principles require.

### 7.3 Calculation walkthrough

Seed instruments → filter (type/sector) → aggregate greenium/oversubscription/impact. The ratchet view
(`kpiStepCalc`, first 12 instruments): compute `miss` = shortfall vs target; if missing, apply a step-up
proportional to `carbonStepUp`; if outperforming, a smaller step-down (0.3×). `kpiOnTrack` counts
instruments meeting a `kpiMiss`-scaled threshold. `demandCurve` and `reportingMetrics` are illustrative.

### 7.4 Worked example

SLB with `kpiTarget = 50`, `kpiActual = 42`, slider `carbonStepUp = 25`:
`miss = max(0, 50−42)/max(0.1,50)·100 = 8/50·100 = 16%`;
`stepUp = 16·25/100 = 4.00` → a **+4.00 bps** coupon step-up for missing the SPT.
If instead `kpiActual = 58`: `stepUp = 0`; `stepDown = ((58−50)/50)·100·0.3 = 16·0.3 = 4.80` → a
**−4.80 bps** reward. So the structure penalises a 16% miss with +4 bps and rewards a 16% beat with −4.8 bps
— the asymmetry from the 0.3× factor makes outperformance rewards larger per unit here, which is a design
choice (real SLBs typically feature step-ups only, or symmetric ±bps).

### 7.5 Data provenance & limitations

- All instruments are **synthetic**, seeded by `sr(seed)=frac(sin(seed+1)·10⁴)`; greenium is a random
  draw, not a spread differential.
- The guide's net-benefit P&L (greenium saving − SPO − reporting cost) is **not computed**; SPO cost and
  reporting cost do not appear as cash items.
- The ratchet scales KPI shortfall by a slider, not by a documented bps ladder tied to verified KPIs.

**Framework alignment:** ICMA Green Bond Principles 2021 (four components; label set) and Sustainability-
Linked Bond Principles (the KPI/SPT/step-up mechanic implemented here — real SLBs define a *coupon step-up*
that triggers if verified KPIs miss the SPT at the observation date); LMA/APLMA/LSTA Green Loan Principles;
CBI Certification Standard v4.0. The greenium concept traces to Bloomberg BVAL / ICMA market surveys. §8
adds the net-benefit pricing the guide claims.

## 8 · Model Specification — Green-Debt Net-Benefit & Greenium Pricing Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Decide whether a green/SLB structure is financially net-beneficial to the issuer: does the greenium (and
demand premium) outweigh the incremental cost of an SPO, verification, and post-issuance reporting over the
bond's life? Coverage: primary issuance structuring for corporate treasurers.

### 8.2 Conceptual approach
A break-even present-value model benchmarked against **ICMA/CBI issuance-cost surveys** and Bloomberg-BVAL
greenium estimates: value the coupon saving from the greenium against the fixed and recurring costs of the
green label, plus the SLB coupon-step contingent cash flow, discounted over the term.

### 8.3 Mathematical specification
```
GreeniumSaving (PV) = Σ_t (Greenium_bps/1e4 · Notional) / (1+r)^t                (coupon saving)
GreenCost (PV)      = SPO_cost + Σ_t ReportingCost_t/(1+r)^t + VerifCost_t/(1+r)^t
NetBenefit          = GreeniumSaving − GreenCost
SLB expected step (PV) = Σ_obs P(miss_obs)·StepUp_bps/1e4·Notional/(1+r)^{t_obs}
                       − Σ_obs P(beat_obs)·StepDown_bps/1e4·Notional/(1+r)^{t_obs}
Greenium (market)   = Yield_conventional_matched − Yield_green   (from green-bond-portfolio-analytics §8)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `Greenium_bps` | new-issue concession | Bloomberg BVAL / ICMA surveys |
| `SPO_cost` | second-party opinion fee | ICMA/CBI cost survey ($50–150k) |
| `ReportingCost_t` | annual reporting burden | CBI survey ($30–80k) |
| `StepUp/Down_bps` | ratchet size | term sheet / LMA SLL survey (±5–10 bps) |
| `P(miss/beat)` | KPI achievement probability | issuer KPI trajectory model |
| `r` | issuer funding rate | curve |

### 8.4 Data requirements
Deal: notional, tenor, coupon, greenium estimate, SPO/reporting cost quotes, KPI/SPT schedule and
achievement odds. Sources: ICMA/CBI cost surveys, BVAL greenium, issuer sustainability plan. The module
seeds greenium, KPI target/actual and step sizes — replace with deal data and a real greenium engine.

### 8.5 Validation & benchmarking plan
Reconcile net-benefit break-even size against ICMA's "covers costs for bonds > €200M" rule of thumb;
validate greenium against BVAL; back-test KPI-achievement probabilities against realised SLB step events;
sensitivity to greenium and reporting cost.

### 8.6 Limitations & model risk
Greenium is small, noisy and regime-dependent; net benefit can flip sign with a few bps. SLB step
probabilities are hard to estimate and subject to KPI gaming. Conservative fallback: present net benefit as
a range across greenium scenarios and exclude the contingent SLB step from the base case (report it as a
sensitivity).
