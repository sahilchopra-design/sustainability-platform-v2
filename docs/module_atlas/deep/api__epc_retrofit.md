## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/epc-retrofit` pairs two engines for real-estate transition risk:

1. **EPC Transition Risk Engine** (`epc_transition_engine.py`) — scores properties against
   country-specific Minimum Energy Performance Standards (MEPS) timelines
   (`POST /transition-risk`): composite risk 0–100, years to non-compliance, EPC gap steps,
   penalty exposure and stranding probability per regulatory deadline.
2. **Retrofit CapEx Planner** (`retrofit_planner.py`) — NPV/payback analysis of an 8-measure
   retrofit catalogue and greedy ROI-ranked selection to reach a target EPC
   (`POST /retrofit-plan`).

Key formulas quoted from code (EPC ranks A+=1 … G=8; lower = better):

```
gap_steps        = max(0, rank(current) − rank(required))
strand_prob      = min(1, 0.4·(1 − yrs_left/15) + 0.4·min(1, gap/5) + 0.2·certainty)   (0 if compliant)
composite        = 0.35·gap_score + 0.30·time_score + 0.20·penalty_score + 0.15·cert_score
                   gap_score = min(100, gap×16.67); time_score = max(0, 100 − yrs_left×10)
                   penalty_score = penalty/50 €/m² ×100; worst deadline = argmax gap×1/max(yrs,1)
NPV              = −capex + Σ_{t=1..life} annual_saving/(1+r)^t          (r default 6%)
annual_saving    = kWh_saved×energy_price + (kWh_saved×grid_EF/1000)×carbon_price
green_uplift_pct = min(25, EPC_steps_gained × 3.5)                       ("RICS research" comment)
```

### 7.2 Parameterisation

**MEPS timelines** (`MEPS_TIMELINES`, `GET /meps-timelines`; header cites EPBD recast 2024, UK
MEES, France Loi Climat/DPE, Germany GEG 2024):

| Country | Milestones (year → min EPC, penalty €/m²) |
|---|---|
| NL | 2023→C (0), 2030→A (25), 2050→A+ (50) — offices/non-residential |
| GB | 2025→E (15), 2030→B (30) — commercial (MEES) |
| FR | 2025→E (10), 2028→D (20), 2034→C (35) — residential rental (DPE) |
| DE | 2027→E (10), 2030→D (20), 2033→C (35) |
| EU default | 2030→E (15), 2033→D (25) — non-residential |

Regulatory certainty (0–1, expert judgement documented in comments): NL 0.95 ("enforced since
2023"), FR 0.90, GB 0.85 ("2030 proposals still under consultation"), DE 0.80, EU 0.70. Penalty
€/m² values are **synthetic demo calibrations** — real MEES fines, for instance, are per-property
caps, not per-m² charges.

**Retrofit catalogue** (`MEASURE_CATALOGUE`, `GET /measure-catalogue`; comment: "based on UK GFI /
CRREM / industry benchmarks" — representative but synthetic):

| Measure | CapEx €/m² | Saving kWh/m²/yr | Carbon % | Life (yr) | EPC steps |
|---|---|---|---|---|---|
| LED lighting | 8 | 12 | 5 | 15 | 0 |
| BMS controls | 15 | 18 | 8 | 12 | 0 |
| HVAC replacement | 45 | 35 | 15 | 20 | 1 |
| Wall insulation | 65 | 40 | 18 | 30 | 1 |
| Roof insulation | 30 | 20 | 8 | 30 | 1 |
| Glazing | 80 | 25 | 10 | 25 | 1 |
| Rooftop solar PV | 55 | 30 | 12 | 25 | 1 |
| Air-source heat pump | 70 | 50 | 25 | 20 | 2 |

Energy prices €/kWh (`GET /energy-prices`): NL 0.18, GB 0.22, FR 0.14, DE 0.20, US 0.12, EU 0.16.
Grid factors kgCO₂e/kWh: NL 0.38, GB 0.21, FR 0.06, DE 0.35, US 0.40, EU 0.25 — magnitudes
consistent with national grid intensities (France's nuclear-heavy 0.06 vs US 0.40). Carbon price
default €90/t ("EU ETS ~90 EUR/t" comment). Current year hardcoded 2025.

### 7.3 Calculation walkthrough

**Transition risk**: each property is tested against every milestone of its country timeline
(EU fallback). Non-compliance yields annual penalty = floor area × €/m² and a stranding
probability; the composite score is computed from the *worst* non-compliant deadline (highest
gap-per-year-remaining) and banded Low < 25 ≤ Medium < 50 ≤ High < 75 ≤ Critical. Portfolio
summary: compliant-now %, at-risk 2030/2033 counts, GAV at risk 2030 (€ and %), risk-band
distribution, worst-5 list, average score.

**Retrofit plan**: applicable measures (property-type match, not already installed) are costed
and NPV'd (bisection IRR on uniform cashflows, bounds −50%…200%), sorted by ROI (= NPV/capex),
then **greedily selected until cumulative EPC steps close the gap to target** (default target B);
if already at target, the top-3 positive-NPV measures are returned as optimisation candidates.
Plan totals: capex, annual savings, aggregate payback/NPV, energy-reduction % (kWh basis, capped
100%), carbon-reduction % (sum of measure percentages, capped 100%), green value uplift, and
projected post-retrofit EPC (`rank − Σ steps`, floored at A+). Portfolio roll-up adds capex by
category and top-5 ROI properties.

### 7.4 Worked example (GB office, EPC E → target B)

10,000 m², EUI 180 kWh/m²/yr, value €40M, GB (price 0.22, grid 0.21), carbon €90/t, r = 6%.
Heat pump (top ROI here): capex = 70×10,000 = €700k; kWh saved = 50×10,000 = 500,000;
energy saving = €110,000; carbon = 500,000×0.21/1000 = 105 tCO₂e → €9,450; total €119,450/yr.

| Metric | Computation | Result |
|---|---|---|
| Payback | 700,000 / 119,450 | 5.9 yr |
| NPV (20 yr @6%) | 119,450 × 11.4699 − 700,000 | **+€670,081** |
| ROI | 670,081/700,000 | 95.7% |
| Gap to target | rank E(6) − rank B(3) = 3 steps | select by ROI until ≥ 3 steps |
| Projected EPC | 6 − 3 = 3 | **B** |
| Green uplift | min(25, 3×3.5) = 10.5% × €40M | **€4.2M** |

Transition-risk side (same property today): 2025 milestone E → compliant; 2030 milestone B →
gap 3, years left 5, penalty €30/m²: strand_prob = 0.4×(1−5/15) + 0.4×(3/5) + 0.2×0.85 = 0.677;
composite = 0.35×50 + 0.30×50 + 0.20×60 + 0.15×85 = **57.3 → High**.

### 7.5 Data provenance & limitations

- **No PRNG/seeded data** — pure calculators over caller-supplied properties. Regulatory years
  and rating thresholds track real MEPS policy (NL Label-C obligation, UK MEES trajectory, French
  DPE rental bans, GEG); penalties, certainty weights, score weights, catalogue costs/savings and
  the 3.5%-per-step uplift are **synthetic calibrations** (the uplift cites "RICS research"
  directionally).
- EPC steps are treated as additive and fungible across measures — real EPC/SAP scoring is
  points-based per building physics, so "2 steps from a heat pump" is a stylisation.
- Carbon savings % uses catalogue percentages while energy savings use kWh — the two reduction
  metrics are not reconciled; measure interactions (insulation reducing heat-pump savings) are
  ignored (savings sum linearly).
- Single flat energy price and grid factor per country; no degradation, maintenance opex, or
  price escalation in NPV; IRR assumes uniform cashflows.
- Composite risk uses only the worst deadline; multiple simultaneous breaches are not additive.

### 7.6 Framework alignment

- **EPBD recast (EU/2024/1275):** the MEPS concept — minimum energy performance standards with
  dated milestones for non-residential stock — is the engine's organising frame; country rows
  approximate national transpositions (NL office Label-C 2023 is real and enforced).
- **UK MEES (Energy Efficiency Regulations 2015):** EPC E floor for let commercial property and
  the consulted EPC B 2030 trajectory are mirrored in the GB timeline.
- **France Loi Climat et Résilience:** DPE-based rental prohibitions (G 2025, F 2028, E 2034 in
  the actual law) inspire the FR rows, though the module's letters/years differ slightly —
  a calibration nuance to note.
- **CRREM:** the "stranding" vocabulary and retrofit-pathway framing follow CRREM's 1.5 °C
  decarbonisation-pathway methodology (CRREM strands on carbon intensity vs pathway; this module
  strands on EPC vs regulation — complementary lenses).
- **RICS / green-premium literature:** the 3–5% value uplift per EPC step reflects published
  hedonic studies (e.g. RICS/JLL green-premium research), implemented as 3.5%/step capped at 25%.
- **EU ETS:** €90/t default carbon price for monetising avoided emissions.
