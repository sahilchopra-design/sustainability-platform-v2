## 7 · Methodology Deep Dive

The Maritime IMO Compliance module implements the real IMO operational carbon-intensity
framework — the CII reference-line formula of MEPC.339(76) and the A–E rating boundaries — over a
synthetic 150-vessel fleet, plus an IMO-2023 trajectory tracker, an alternative-fuel decision
matrix, and a Poseidon-Principles ship-finance tab. A companion FastAPI engine
(`maritime_engine.py`) computes CII, EEXI, EU-ETS, FuelEU and stranding assessments on
caller-supplied vessel data. The guide's four headline metrics (CII rating, EEXI gap, AER,
trajectory alignment) all map to code, so **no guide↔code mismatch flag is raised** — the only
caveat is that the *volumetric inputs* (annual emissions, distance) are seeded demo data while the
*conversion mathematics* are authentic.

### 7.1 What the module computes

Attained CII follows MEPC.338(76) exactly:

```
CII_attained = Annual CO₂ (g) / (DWT × Distance_nm)        // gCO₂ / (tonne·nm)
CII_ref      = a × DWT^(−c)                                  // MEPC.339(76) reference line
CII_required = CII_ref × (1 − reduction_factor[year])
CII_ratio    = CII_attained / CII_required
```

Annual CO₂ is derived from fuel mass × a fuel-specific carbon factor
(`FUEL_CO2_FACTOR = { HFO:3114, VLSFO:3151, MGO:3206, LNG:2750, Methanol:1375 }` gCO₂/kg — the
IMO MEPC.364(79) Cf values ×1000). In the frontend the annual emission tonnage is drawn from the
seeded PRNG rather than voyage fuel logs; the backend `assess_cii` instead computes it faithfully
as `annual_fuel_consumption_t × cf`.

### 7.2 Parameterisation / scoring rubric

**CII reference-line coefficients** (`CII_REF_PARAMS`, frontend) — these are the genuine
MEPC.339(76) Table-1 `a` and `c` values:

| Ship type | `a` | `c` | Provenance |
|---|---|---|---|
| Bulk Carrier | 4745 | 0.622 | MEPC.339(76) reference line |
| Container | 1984 | 0.489 | MEPC.339(76) |
| Tanker | 5247 | 0.610 | MEPC.339(76) |
| LNG Carrier | 144050 | 0.7345 | MEPC.339(76) (≥100k DWT branch) |
| Car Carrier | 5739 | 0.631 | MEPC.339(76) |
| Cruise | 930 | 0.383 | MEPC.339(76) (GT-based class) |
| RoRo | 10952 | 0.637 | MEPC.339(76) |
| Offshore | 3627 | 0.590 | approximation |

**Annual reduction factor** `CII_REDUCTION = {2023:0.05, 2024:0.07, 2025:0.09, 2026:0.11}` —
the MARPOL Annex VI Reg 28.6 Z% tightening path (5→11 %) off the 2019 baseline.

**Rating boundaries** — frontend uses `A<0.82, B<0.94, C<1.06, D<1.18, E≥1.18`; the backend uses
`A≤0.85, B≤0.95, C≤1.05, D≤1.15`. Both are *fixed-vector approximations* of MEPC.354(78), which
in reality publishes ship-type-and-size-specific `d1–d4` boundary vectors rather than a single set
of universal ratios. The frontend vector is closer to the average bulk-carrier boundary set.

**Fuel decision matrix** (`FUELS`, 10 rows) — cost/availability/emReduction/infraReady/safety/
scalability on 0–100 scales are **synthetic expert-judgement demo values**, not sourced tables.

### 7.3 Calculation walkthrough

Per vessel (`genVessels`, 150 rows): ship type, DWT (20k–200k), build year, flag and fuel are
seeded; `distance_nm` = `BASE_DISTANCE[type] × (0.7 + sr()·0.6)` (bulk 18k, container 58k nm/yr
base); `annualEmissions` is seeded 5k–55k tCO₂. Then `ciiValue → ciiRequired → ciiRatio → ciiGrade`
run through the real formulas above. Twelve quarters of history trend the ratio via
`hist_ratio = ciiRatio × (0.92 + qi·0.006 + sr()·0.12)`.

Fleet KPIs (`fleetStats`): average grade maps A→5…E→1 and averages; `acRate` = share graded A/B/C;
`eexiRate` = share EEXI-compliant; `totalEmissions` sums annual CO₂. Company league table
(`companyComparison`) averages the same 5→1 grade scale within each of 20 shipping lines.

### 7.4 Worked example (one bulk carrier, 2025)

Vessel: Bulk Carrier, `DWT = 100,000`, `annualEmissions = 30,000 tCO₂`, `distance_nm = 20,000`.

| Step | Computation | Result |
|---|---|---|
| CII attained | 30,000 ×10⁶ / (100,000 × 20,000) | **15.0 gCO₂/(t·nm)** |
| CII ref | 4745 × 100000^(−0.622) | 4745 / 1774 ≈ **2.675** |
| CII required (2025, ×0.91) | 2.675 × 0.91 | **2.435** |
| CII ratio | 15.0 / 2.435 | **6.16** |
| Grade | 6.16 ≥ 1.18 | **E** |

The unrealistically high ratio flows directly from the *seeded* emission tonnage being decoupled
from DWT/distance — an artefact of demo data, not the formula. With a realistic ~2.5 gCO₂/(t·nm)
attained value the ratio would sit near 1.0 (grade C). The reference-line arithmetic itself is
correct and reproducible.

### 7.5 Companion analytics on the page

- **IMO-2023 pathway tracker** — `IMO_PATHWAY` (2020–2050) draws three carbon-intensity index
  curves: `ambition` (net-zero-aligned, −20 % by 2030 then steepening), `wb2` (well-below-2 °C),
  and `bau`. Curves are piecewise-linear index constructions, not published IMO absolute numbers.
- **Alternative-fuel explorer** — radar over the 10-fuel matrix; a retrofit simulator scales each
  vessel's `retrofitCost` by `fuel.cost/60`, emission reduction by `fuel.emReduction/50`, and
  computes `payback = totalConvCost / annualSavings` where savings blend a fuel-price slider and a
  `carbonPrice × 100 × n` term. These scalings are heuristic demo calibrations.
- **Poseidon Principles & finance** — 20 synthetic ship-finance facilities (`LOANS`) with
  alignment scores, CII covenants, FuelEU compliance flags and 8-year alignment trajectories; a
  bank league table ranks lenders by portfolio alignment.

### 7.6 Backend engine (`maritime_engine.py`)

Five genuine assessors, each returning its regulatory basis string:
`assess_cii` (real Cf × fuel mass), `assess_eexi` (P·SFC·Cf / (GT·Vref) proxy vs `EEXI_REFERENCE`
table), `assess_eu_ets` (phase-in coverage 40/70/100 % × route share; **cost fields return `None`
when no EUA price is supplied — an explicit honesty guard against fabricating a price**),
`assess_fueleu` (WtW intensity vs the real `FUELEU_GHG_TARGETS` glide-path 89.34→1.89 gCO₂e/MJ,
€2400/GJ penalty per Art 23), and `assess_stranding` (CII-deterioration vs target-tightening race
to a D-rating year, deterministic USD 120/GT retrofit calibration). `assess_fleet` aggregates and
reports the *worst* CII rating as the fleet rating.

### 7.7 Data provenance & limitations

- **Fleet, company and loan data are synthetic**, generated by `sr(s)=frac(sin(s+1)×10⁴)`. Only
  the CII reference coefficients, Cf fuel factors, reduction path and FuelEU glide-path are real.
- Frontend annual emissions are decoupled from operational drivers, so *individual* ratios/grades
  are not physically calibrated; the *distributional shape* and the formula are correct.
- Rating boundaries use a single universal vector, not MEPC.354(78) ship-type/size-specific
  `d`-vectors. EEXI in the frontend is a boolean seed (`sr(i·41)>0.25`), not a computed index — the
  real EEXI computation lives only in the backend.

**Framework alignment:** IMO CII — MEPC.338(76) intensity formula + MEPC.339(76) reference lines +
MEPC.354(78) rating boundaries (approximated) · EEXI — MARPOL Annex VI Reg 25 (backend proxy) ·
EU-ETS Maritime — Reg (EU) 2023/957 phase-in · FuelEU Maritime — Reg (EU) 2023/1805 WtW targets ·
Poseidon Principles — AER-vs-trajectory alignment scoring (the Principles compute a portfolio
"climate alignment" as the AUM-weighted % deviation of each vessel's AER from its ship-class
decarbonisation trajectory; here approximated by the seeded alignment scores).
