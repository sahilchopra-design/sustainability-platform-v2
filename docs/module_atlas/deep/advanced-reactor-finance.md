## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DU6) headlines a **TRL-adjusted
> NPV**: `TRL-NPV = Σ[P(success|TRL) × CF_t / (1+r)^t] − I₀`. **No probability-of-success
> weighting exists in the code.** The page's NPV is a plain deterministic DCF; TRL appears only
> descriptively (per-type TRL badges and a radar). Fusion (ITER/Commonwealth) is mentioned in
> one investor row, not modelled. The guide's ARDP grant sizing and capital-cost uncertainty
> bands are represented as static tables, not calculations. Sections below document the code.

### 7.1 What the module computes

Ten tabs on Generation-IV reactor finance. The quantitative core is an interactive **LCOE +
NPV + cash-flow model** driven by nine sliders (CAPEX $/kWe 3,000–12,000; WACC 4–15%; capacity
factor 70–95%; lifetime 30–80y; construction time 3–8y; fixed O&M; electricity price; heat
price; heat revenue share 0–100%):

```
LCOE:  w        = WACC/100
       capexAnn = capexKw·w / (1 − (1+w)^−lifetime)          // $/kW-yr capital annuity
       idc      = (1+w)^(constructYr/2)                       // interest during construction
       annMwh   = CF/100 × 8760                               // kWh per kW-yr
       LCOE     = (capexAnn·idc + opex) / annMwh × 1000       // $/MWh
```

```
NPV:   annMwh   = CF/100 × 8760 × capexPerKw/1000
       blendRev = annMwh × (elecPrice·(1−heatPct/100) + heatPrice·heatPct/100) / 1000
       capex    = capexPerKw × 1000
       PV       = Σ_{yr=1..lifetime} blendRev/(1+w)^yr
       decommPV = capex × 0.15 / (1+w)^lifetime               // 15% decommissioning provision
       NPV($M)  = (PV − capex − decommPV) / 10⁶
```

The blended-revenue term is the page's genuinely novel element: Gen-IV economics are modelled
as a **co-generation play** where a `heatPct` share of output is sold as industrial process
heat at a separate price.

### 7.2 Parameterisation — static reference tables

**GEN4_TYPES** (6 Gen IV Forum designs):

| Type | Temp °C | η | TRL | LCOE 2040E $/MWh | Vendors (first two) |
|---|---|---|---|---|---|
| MSR | 700 | 0.45 | 4 | 90 | Terrestrial Energy, Moltex |
| SFR | 550 | 0.40 | 6 | 95 | TerraPower Natrium, ARC-100 |
| HTGR | 950 | 0.50 | 7 | 85 | X-Energy Xe-100, USNC |
| GFR | 850 | 0.48 | 2 | 110 | Framatome Gen IV |
| LFR | 480 | 0.40 | 3 | 105 | Newcleo, ALFRED |
| VHTR | 1000 | 0.52 | 5 | 88 | GA-EMS, INL |

**ARDP_COMPANIES** — 6 real awards (TerraPower Natrium $2.0B, X-Energy $1.2B, Kairos $629M,
Oklo $5M, Terrestrial C$20M, Moltex C$50M) with status/location/power — consistent with public
DOE ARDP and Canadian announcements circa 2024. **LCOE_COMPARISON** — 11 benchmark rows with
named anchors ("Vogtle benchmark" 95, "Hinkley Point C" 110, NuScale NOAK 80, UK CfD offshore
wind 70, utility solar+BESS 65, CCGT at $3/MMBtu 60). **TRISO_DATA** — 8 fuel-property rows
(HALEU ≤19.75%, 4 coating layers, >1600°C failure temp, $8–15k/kgU cost est.).
**PROCESS_HEAT_APPS** — 6 heat markets with temperature requirement, market size (GW-thermal)
and reactor pairing.

### 7.3 Calculation walkthrough

1. Sliders → `calcLcoe` recomputes on every change; IDC uses half-construction-period
   compounding — the standard simple approximation for capitalised interest.
2. The same sliders drive `npv` and `cashFlows`; year-0 row is `−capex`, years 1..min(40,
   lifetime) accrue `annual = (blendRev − opexFixed)/1e3` into a cumulative payback line.
3. `trlRadar` normalises each design: TRL×10, temp/10 (cap 100), η×100, `130 − lcoe2040`
   (cost attractiveness), TRL×12 ("CostMaturity").
4. `timelineData` builds a 2025–2044 deployment fan: each technology starts at a staggered
   year (HTGR i≥3, SFR i≥4, MSR i≥6, LFR i≥7) and grows as `sr(i·k)·scale + slope·i` — a
   seeded random growth curve, not a diffusion model.

### 7.4 Worked example — default slider settings

CAPEX $5,000/kWe, WACC 8%, CF 90%, lifetime 60y, construction 4y, O&M 120, elec $90/MWh,
heat $40/MWh, heat share 30%:

| Step | Computation | Result |
|---|---|---|
| Capital annuity | 5000×0.08 / (1−1.08⁻⁶⁰) | $404.15/kW-yr |
| IDC factor | 1.08^(4/2) | 1.1664 |
| Annual output | 0.90 × 8760 | 7,884 kWh/kW-yr |
| **LCOE** | (404.15×1.1664 + 120)/7884 × 1000 | **≈ $75.0/MWh** |
| Blended price | 90×0.7 + 40×0.3 | $75/MWh |
| `annMwh` (NPV path) | 0.9×8760×5000/1000 | 39,420 MWh |
| `blendRev` | 39,420×75/1000 | 2,956.5 ($k/yr) |
| PV of revenue (60y @8%) | 2,956.5k × 12.376 | ≈ $36.6M |
| decommPV | 5.0M×0.15/1.08⁶⁰ | ≈ $7.4k |
| **NPV** | 36.6 − 5.0 − 0.007 | **≈ +$31.6M** |

Note the NPV branch omits O&M from the discounted stream (O&M only enters the undiscounted
cash-flow chart) and its revenue coincidentally scales with CAPEX-per-kW (see §7.5).

### 7.5 Data provenance & limitations

- Reference tables (GEN4_TYPES, ARDP awards, LCOE benchmarks, TRISO, process heat) are
  hand-authored from public sources named inline (DOE ARDP, vendor estimates, UK CfD); LCOE
  2040 estimates are explicitly labelled "E" — projections, not data.
- The deployment timeline uses the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` —
  **synthetic**, deterministic decoration.
- **Dimensional inconsistencies in the NPV/cash-flow branch:** plant capacity is implicitly
  `capexPerKw/1000` MW (so raising unit CAPEX *raises revenue*), the discounted PV excludes
  O&M, and `blendRev` ($k) is netted against `opexFixed` (a $/kW-yr slider) in the cash-flow
  chart. The LCOE branch is internally consistent; the NPV branch should be read as
  illustrative only.
- No TRL-conditional success probabilities, no CAPEX uncertainty simulation, no FOAK→NOAK
  learning curve — all named in the guide but absent from code.

### 7.6 Framework alignment

- **DOE Technology Readiness Assessment Guide** — TRL 1–9 scale used for classification; DOE
  practice attaches maturation plans and risk levels to TRL, which here surface only as badge
  colours (≥6 green, ≥4 amber, else red).
- **DOE ARDP** — real cost-share demonstration awards (50/50 for the two demos) are tabulated
  with actual award values; the module does not compute grant sizing.
- **LCOE convention (IEA/NEA Projected Costs of Generating Electricity)** — the annuity-based
  LCOE with an IDC multiplier is the standard simplified levelised-cost formula used in
  IEA/NEA and Lazard-style comparisons.
- **Gen IV International Forum** — the six-technology taxonomy (MSR/SFR/HTGR/GFR/LFR/VHTR)
  matches the GIF portfolio exactly, including representative coolant temperatures and
  efficiency ranges.
- **IAEA ARIS/SMR booklet** — vendor/design pairings and power ratings are consistent with
  IAEA's advanced-reactor listings as of ~2024.
