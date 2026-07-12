# Api::Epc_Retrofit
**Module ID:** `api::epc_retrofit` · **Route:** `/api/v1/epc-retrofit` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/epc-retrofit/transition-risk` | `assess_transition_risk` | api/v1/routes/epc_retrofit.py |
| POST | `/api/v1/epc-retrofit/retrofit-plan` | `generate_retrofit_plan` | api/v1/routes/epc_retrofit.py |
| GET | `/api/v1/epc-retrofit/measure-catalogue` | `get_measure_catalogue` | api/v1/routes/epc_retrofit.py |
| GET | `/api/v1/epc-retrofit/meps-timelines` | `get_meps_timelines` | api/v1/routes/epc_retrofit.py |
| GET | `/api/v1/epc-retrofit/energy-prices` | `get_energy_prices` | api/v1/routes/epc_retrofit.py |

### 2.3 Engine `epc_transition_engine` (services/epc_transition_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EPCTransitionEngine.assess_property` | prop | Assess a single property's EPC transition risk. |
| `EPCTransitionEngine.assess_portfolio` | properties | Assess EPC transition risk across a portfolio. |
| `EPCTransitionEngine._calculate_composite_score` | deadlines, certainty | Weighted composite risk score 0-100. |

**Engine `epc_transition_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SCORE_WEIGHTS` | `{'gap_severity': 0.35, 'time_urgency': 0.3, 'penalty_exposure': 0.2, 'regulatory_certainty': 0.15}` |
| `REGULATORY_CERTAINTY` | `{'NL': 0.95, 'GB': 0.85, 'FR': 0.9, 'DE': 0.8, 'EU': 0.7}` |

### 2.3 Engine `retrofit_planner` (services/retrofit_planner.py)
| Function | Args | Purpose |
|---|---|---|
| `RetrofitPlanner.plan_property` | prop | Generate retrofit plan for a single property. |
| `RetrofitPlanner.plan_portfolio` | properties | Generate retrofit plan across a portfolio. |
| `RetrofitPlanner._npv` | capex, annual_cf, years, rate | Simple NPV: -capex + sum(annual_cf / (1+r)^t) for t=1..years. |
| `RetrofitPlanner._irr_approx` | capex, annual_cf, years | Approximate IRR using bisection for uniform cashflows. |
| `RetrofitPlanner._select_measures_to_target` | measures, current_rank, target_rank | Greedy selection of measures by ROI until target EPC is reached. If target is already met, return top 3 positive-NPV measures for optimisation. |

**Engine `retrofit_planner` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `DEFAULT_CARBON_PRICE` | `90.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/epc-retrofit/energy-prices** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['energy_prices_eur_kwh', 'grid_emission_factors_kgco2_kwh'], 'n_keys': 2}`

**GET /api/v1/epc-retrofit/measure-catalogue** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['measures', 'total_measures'], 'n_keys': 2}`

**GET /api/v1/epc-retrofit/meps-timelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['timelines', 'countries'], 'n_keys': 2}`

**POST /api/v1/epc-retrofit/retrofit-plan** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/epc-retrofit/transition-risk** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `epc_transition_engine` — extracted transformation lines:**
```python
gap = max(0, current_rank - required_rank)
annual_penalty = float(prop.floor_area_m2) * penalty if not is_compliant else 0.0
time_factor = max(0, 1.0 - years_remaining / 15.0)
gap_factor = min(1.0, gap / 5.0)
strand_prob = round(min(1.0, (time_factor * 0.4 + gap_factor * 0.4 + cert * 0.2)), 3)
avg_score = round(sum(r.composite_risk_score for r in results) / n, 1)
compliant_now_pct=round(compliant_now / n * 100, 1),
at_risk_2030_pct=round(at_risk_2030 / n * 100, 1),
at_risk_2033_pct=round(at_risk_2033 / n * 100, 1),
worst = max(non_compliant, key=lambda d: d.gap_steps * (1 / max(d.years_remaining, 1)))
gap_score = min(100.0, worst.gap_steps * 16.67)
time_score = max(0.0, 100.0 - worst.years_remaining * 10.0)
penalty_score = min(100.0, worst.penalty_eur_m2 / 50.0 * 100.0)
cert_score = certainty * 100.0
```

**Engine `retrofit_planner` — extracted transformation lines:**
```python
capex = m.capex_eur_m2 * prop.floor_area_m2
annual_kwh_saved = m.energy_saving_kwh_m2 * prop.floor_area_m2
annual_energy_eur = annual_kwh_saved * energy_price
annual_carbon_t = annual_kwh_saved * grid_factor / 1000.0
annual_carbon_eur = annual_carbon_t * prop.carbon_price_eur_t
total_annual = annual_energy_eur + annual_carbon_eur
payback = capex / total_annual if total_annual > 0 else 999.0
roi = (npv / capex * 100) if capex > 0 else 0.0
energy_pct = (m.energy_saving_kwh_m2 / prop.current_energy_intensity_kwh_m2 * 100
total_payback = total_capex / total_annual if total_annual > 0 else 999.0
projected_rank = max(1, current_rank - steps_gained)
green_uplift_pct = min(25.0, steps_gained * 3.5)
green_uplift_eur = prop.market_value * green_uplift_pct / 100.0
payback = total_capex / total_savings if total_savings > 0 else 999.0
avg_energy = sum(p.energy_reduction_pct for p in plans) / n
avg_carbon = sum(p.carbon_reduction_pct for p in plans) / n
key=lambda p: (p.aggregate_npv / p.total_capex) if p.total_capex > 0 else 0,
pv = sum(annual_cf / (1 + rate) ** t for t in range(1, years + 1))
mid = (lo + hi) / 2
gap = current_rank - target_rank
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Points-based EPC modelling, measure interactions, and calibrated penalties (analytics ladder: rung 2 → 3)

**What.** Two paired real-estate engines: an EPC Transition Risk scorer (composite risk vs country MEPS
timelines, stranding probability) and a Retrofit CapEx Planner (NPV/payback over an 8-measure catalogue,
greedy ROI selection to a target EPC) — pure calculators, no PRNG, already rung 2 (country-scenario
MEPS timelines). §7.5 names the deepening targets: **EPC steps are treated as additive and fungible**
across measures (real EPC/SAP scoring is points-based per building physics, so "2 steps from a heat
pump" is a stylisation); **measure interactions are ignored** (insulation reducing heat-pump savings —
savings sum linearly); energy vs carbon reduction metrics are **not reconciled** (kWh basis vs catalogue
%); and penalties/certainty/uplift are synthetic calibrations (real MEES fines are per-property caps,
not per-m²). Evolution A implements points-based EPC modelling with measure interactions and calibrates
the penalties.

**How.** The retrofit planner models EPC via a points/SAP-style building-physics calculation (measure
effects on the actual rating, not fixed additive steps) with interaction terms (insulation before heat
pump); energy and carbon reductions are reconciled from one kWh-saved basis; penalties are re-based to
the real regime structure (per-property caps for MEES, per-m² where actually applicable). Rung 3:
calibrate the green-premium uplift (3.5%/step) against RICS/JLL hedonic studies and the certainty
weights against enacted-vs-proposed policy status; wire live energy/grid factors from the ENTSO-E/EIA
ingesters (currently static per-country constants).

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /transition-risk` **failed** and
`/retrofit-plan` **skipped**; the FR DPE letters/years differ slightly from the actual Loi Climat
(§7.6) — reconcile. Preserve the honest "synthetic calibration" labelling on penalties/uplift.
**Acceptance:** the §7.4 GB office worked example (heat pump NPV +€670,081, projected EPC B, composite
57.3 High) reproduces at legacy calibrations; adding insulation before a heat pump reduces the heat
pump's marginal savings (interaction); energy and carbon reductions reconcile; the failing endpoints
pass the harness.

### 9.2 Evolution B — Real-estate retrofit-advisory copilot (LLM tier 2)

**What.** A tool-calling analyst for real-estate/lending teams: "what's this office's EPC transition
risk under UK MEES?" (`/transition-risk` → composite score, stranding probability, penalty exposure,
worst deadline), and "plan a retrofit to reach EPC B with the best ROI" (`/retrofit-plan` → ROI-ranked
measure selection, NPV/payback, projected EPC, green value uplift) — narrating the engines' real
outputs and the MACC-style measure ordering.

**How.** Tool schemas over the 2 POST + 3 GET operations; the reference endpoints (measure catalogue,
MEPS timelines, energy prices/grid factors) are ideal RAG grounding for "what's the UK MEES 2030
requirement?" or "what's the CapEx for a heat pump?" questions. The no-fabrication validator checks
every €, NPV, EPC step and stranding probability against tool output; the copilot must flag that
penalties, certainty weights and the green-premium uplift are synthetic calibrations until Evolution A.
Composable with the physical-risk and CRREM stranded-asset modules in a real-estate desk.

**Prerequisites.** Evolution A's harness fixes and points-based EPC model (so narrated projected-EPC and
NPV are physically credible); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every
figure cited traces to an engine tool call; the retrofit plan's projected EPC and NPV match
`/retrofit-plan`; the copilot names the worst MEPS deadline driving the transition-risk score and flags
the synthetic penalty/uplift calibrations.