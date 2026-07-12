## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two engines back the `/api/v1/re/...` routes:

- **`re_clvar_engine.py`** (`RECLVaREngine`, "CLVaR-Engine-v2.0.0") — Real-estate Climate
  Value-at-Risk: physical CLVaR (7 hazards via severity-banded value multipliers + depth-damage
  add-on), transition CLVaR (EPC gap → brown discount, retrofit capex, carbon-cost NPV), and a
  10,000-path Monte Carlo distribution. Serves `POST /re/clvar/calculate` and `/re/clvar/portfolio`.
- **`crrem_stranding_engine.py`** (`CRREMStrandingEngine`, "CRREM-Engine-v2.0.0") — CRREM v2.0
  stranding year, pathway-gap and retrofit-urgency analysis. Serves `GET /re/crrem/pathways/...`,
  `POST /re/crrem/stranding` and `/re/crrem/roadmap`.

Headline formulas (quoted from code):

```
physical  = −√( Σvᵢ² + 0.35·Σᵢ≠ⱼ vᵢvⱼ )       over negative amplified hazard impacts, floor −0.60
transition = −(bd·0.50) + (retrofit%MV·0.30) + (carbonNPV%MV·0.20)  [+ stranding penalty], floor −0.60
            (if EPC-compliant: transition = carbonNPV%MV × 0.4)
combined  = −√(p² + t² + 2·0.45·|p|·|t|) + green_premium              floor −0.80
stranding year (CRREM) = first year the pathway kWh/m² drops below the asset's intensity
annual reduction req.  = (1 − (pathway₂₀₅₀/EI_now)^(1/years-to-2050)) × 100
```

### 7.2 Parameterisation

**Hazard value multipliers** (`PHYSICAL_RISK_MULTIPLIERS`, 6 severity bands each; worst band):
flood −35%, heat −12%, wildfire −28%, sea-level rise −45%, subsidence −20%, drought −10%,
cyclone −30% (cyclone is hard-set to 0 in the deterministic path). Severity is banded from
inputs: flood zone A/B/C/X × depth; heat days ≥60/40/25/15/5; wildfire distance <5/10/15/25/40 km;
SLR by coastal km × projected rise; drought by WRI Aqueduct score ≥4.5/4.0/3.0/2.0/1.0.

**Transition tables:** `BROWN_DISCOUNT_TABLE` by EPC-grade gap {0:0, 1:3.5%, 2:7.5%, 3:12%,
4:18%, 5:25%, 6:32%} (cited "RICS/JLL/Knight Frank ESG Research 2024"); `GREEN_PREMIUM_BY_CERT`
(BREEAM Outstanding +10% … EPC A +2.5%; "CBRE/C&W Green Premium Study 2023");
`RETROFIT_CAPEX_PER_M2` by gap {1:£85 … 6:£750} scaled by feasibility {high 1.0, medium 1.20,
low 1.55, not_feasible 2.0} ("DEFRA Green Finance Taskforce 2024 / JLL Retrofit Report 2024").
Carbon-price trajectories per scenario (NZE 1.5C: $65→$900/t 2024–2050; Current Policies 3C:
$28→$130), linearly interpolated; SLR projections per scenario (NZE 0.28 m vs CP3C 0.62 m by
2050; validation cites IPCC AR6 WGI Ch. 9 / UKCP18); climate amplification by horizon band
(short ≤5y / medium ≤15y / long): NZE 1.05/1.12/1.20 up to CP3C 1.28/1.60/2.10. Carbon NPV uses
a 5% real discount rate and 2% p.a. intensity improvement (floored at 0.5).

**CRREM pathways** (`CRREM_PATHWAY_DATA`): kWh/m²/yr thresholds for 4 property types ×
4–5 countries (GB/DE/US/FR/+NL office) × {1.5C, 2C} at 5-year nodes 2020–2050, linearly
interpolated. The in-file note is explicit: "approximate CRREM Phase 2 values … replace with
exact CRREM v2.0 data from www.crrem.eu". Retrofit-depth costs: light £85, medium £220,
deep £420, full £680, not_feasible £950/m²; carbon cost uses a flat €75/tCO₂e (EU ETS
2024-25 average). Urgency: ≤0y immediate, ≤5y within_5yr, ≤10y within_10yr, else low.

### 7.3 Calculation walkthrough

`calculate_clvar` orchestrates: (1) physical — each hazard is severity-banded, flood gets a
depth-damage add-on `max(−(depth×0.15+0.05)×0.5, −0.10)` in zones A/B, SLR is time-scaled by
`SLR(horizon)/SLR(2050)`, all impacts are multiplied by the scenario amplification factor, then
aggregated with the ρ=0.35 covariance formula; (2) transition — the applicable MEES minimum is
the 2033 standard when the horizon year ≥2033, else the 2030 standard; the EPC gap indexes the
brown-discount and retrofit tables; stranding year is set for `not_feasible` (2030/2033) or
`low` feasibility (2033) with a penalty of −25%/−15%/−8% by years-to-stranding ≤2/≤5/>5;
(3) combination at ρ=0.45 net of any green premium; (4) Monte Carlo (numpy
`default_rng(seed=42)`): flood depth lognormal σ=0.20, carbon price lognormal σ=0.30, retrofit
cost normal ±25% clipped [0.5,2], EPC compliance uniform [0.85,1.15], heat days normal ±20%,
SLR lognormal σ=0.15, water stress normal σ=0.3; physical and transition combined per path at
ρ=0.50, path floor −0.80; reports p5/p25/p50/p75/p95, `var_95 = p5`, `var_99 = p1`. With
`run_mc=False`, percentiles are approximated analytically from `sd = |CLVaR|×0.30`.
CRREM `assess_stranding` compares current intensity (assumed flat — "no improvement,
conservative baseline") against the descending pathway to 2070; `compare_scenarios` derives
2.5C/3C rows by scaling the 2C result (+5y/+12y stranding delay, gap ×0.70/×0.45 etc.).

### 7.4 Worked example — transition CLVaR (GB office, NZE 1.5C, 10-year horizon)

Asset: EPC E, 10,000 m², MV £50M, carbon intensity 45 kgCO₂e/m², feasibility medium, MEES
minima C (2030) / B (2033). Horizon year 2036 ≥ 2033 → applicable minimum **B**.

| Step | Computation | Result |
|---|---|---|
| EPC gap | E(5) − B(2) | 3 grades |
| Brown discount | table[3] | 12.0% |
| Retrofit cost | £290/m² × 1.20 × 10,000 | £3.48M → −6.96% of MV |
| Annual emissions | 45 × 10,000 / 1000 | 450 tCO₂e |
| Carbon NPV | Σ₁¹⁰ 450·CP(yr)·0.98^t / 1.05^t (CP interp. $115→$356) | ≈ £0.674M → −1.35% of MV |
| Weighted transition | −(0.12×0.50) + (−0.0696×0.30) + (−0.0135×0.20) | **−8.36%** |
| Stranding penalty | feasibility medium → none | 0 |

If physical CLVaR were −6.0%, combined = −√(0.0836² + 0.06² + 2·0.45·0.0836·0.06) = **−12.4%**
(≈ −£6.2M on £50M) before any green premium.

### 7.5 CRREM staging rubric & scenario comparison

Retrofit depth from gap%: ≤10% (and not stranded) light; ≤25% medium; ≤50% deep; else full
(or not_feasible). The roadmap generator marks intervention years {2030, 2035, 2040, 2045, 2050,
planned refurb} and costs non-intervention years at £2/m² (compliant) or £8/m² (operational
measures). Note two code quirks: `compare_scenarios` populates the 2C row's
`years_to_stranding` from the result field named `years_to_stranding_1_5c` (the field is
scenario-generic in that call), and the 2.5C/3C rows are **heuristic rescalings** of the 2C
result, not real CRREM pathways.

### 7.6 Data provenance & limitations

- **No `sr()` PRNG** — the only randomness is the seeded numpy Monte Carlo (seed 42,
  reproducible). All asset inputs come from the caller.
- CRREM pathway numbers are self-declared **approximations** of CRREM v2.0 Phase 2; brown
  discounts, green premia and retrofit costs cite named 2023-24 industry studies but are
  transcribed constants (not verifiable from code alone).
- Fixed correlations (0.35 hazard-hazard, 0.45/0.50 physical-transition) are modelling
  assumptions; real CRREM/CLVaR practice would estimate them or run joint scenarios.
- Deterministic transition weighting (50/30/20) and the flat €75/t CRREM carbon price are
  simplifications; the CLVaR engine's own trajectory is used only inside the NPV term.
- CRREM analysis assumes zero energy-intensity improvement absent retrofit; MC does not sample
  wildfire/subsidence (held static per severity band).

### 7.7 Framework alignment

- **CRREM v2.0 Phase 2 (2023)** — the real CRREM tool publishes country × property-type energy
  and GHG intensity pathways derived from IEA/IPCC carbon budgets; stranding = the year an
  asset's intensity crosses the descending pathway. The engine reproduces this mechanic with
  interpolated approximate thresholds (energy intensity only; the GHG-intensity pathway is not
  implemented).
- **RICS VPS4 / Red Book & IVS 2024** — the `validation_summary` audit trail (methodology,
  inputs, assumptions, data quality 1–5, disclaimers incl. "requires review by a qualified RICS
  valuer") implements VPS4's requirement to treat climate risk as a material valuation
  consideration with documented basis.
- **UK MEES (Energy Act 2011 regime)** — EPC minimum C by 2030 / B by 2033 (proposed) drives
  the stranding/penalty logic; these dates are stated assumptions, still subject to legislation.
- **TCFD / EU Taxonomy 2020/852** — scenario-conditioned quantification and disclosure framing;
  the four scenarios map to SSP1-1.9/SSP1-2.6/SSP2-4.5/SSP5-8.5 (IPCC AR6) and IEA NZE/SDS/STEPS.
- **NGFS Phase 4 / IEA WEO** — cited as carbon-price sources for the scenario trajectories.
