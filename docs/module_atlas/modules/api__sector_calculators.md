# Api::Sector_Calculators
**Module ID:** `api::sector_calculators` · **Route:** `/api/v1/sector-calculators` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sector-calculators/shipping/calculate` | `calculate_shipping` | api/v1/routes/sector_calculators.py |
| POST | `/api/v1/sector-calculators/steel/calculate` | `calculate_steel` | api/v1/routes/sector_calculators.py |
| GET | `/api/v1/sector-calculators/shipping/vessel-types` | `list_vessel_types` | api/v1/routes/sector_calculators.py |
| GET | `/api/v1/sector-calculators/shipping/fuel-types` | `list_fuel_types` | api/v1/routes/sector_calculators.py |
| GET | `/api/v1/sector-calculators/steel/iea-glidepath` | `get_steel_glidepath` | api/v1/routes/sector_calculators.py |

### 2.3 Engine `shipping_calculator` (services/shipping_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `ShippingCalculator.calculate` | inp |  |
| `ShippingCalculator._run` | inp |  |
| `ShippingCalculator._compute_rating` | aer, cii_ref, factors |  |
| `ShippingCalculator._estimate_stranding` | aer, cii_ref, vtype | Estimate year when vessel will be D/E if no improvements made. |
| `ShippingCalculator._improvement_pathway` | inp, aer, cii_ref, factors | What fuel switch or efficiency improvement achieves CII Rating A? |
| `ShippingCalculator._build_narrative` | name, rating, aer, imo_2030, pct_vs_2030, fuel_switch |  |

**Engine `shipping_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `IMO_REQUIRED_REDUCTIONS` | `{2023: 0.11, 2025: 0.2, 2030: 0.4, 2035: 0.55, 2040: 0.7, 2045: 0.85, 2050: 1.0}` |

### 2.3 Engine `steel_calculator` (services/steel_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `SteelCalculator.calculate` | inp |  |
| `SteelCalculator._run` | inp |  |
| `SteelCalculator._build_glidepath` | current_intensity, inp |  |
| `SteelCalculator._build_pathway` | inp, current, target, eaf_intensity |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sector-calculators/shipping/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fuel_types'], 'n_keys': 1}`

**GET /api/v1/sector-calculators/shipping/vessel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['vessel_types'], 'n_keys': 1}`

**GET /api/v1/sector-calculators/steel/iea-glidepath** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['title', 'metric', 'glidepath'], 'n_keys': 3}`

**POST /api/v1/sector-calculators/shipping/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sector-calculators/steel/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `shipping_calculator` — extracted transformation lines:**
```python
aer = (annual_co2 * 1_000_000 / (capacity * inp.annual_distance_nm)).quantize(
cii_ref = Decimal(str(a)) * (capacity ** Decimal(str(-c)))
factor = 1.0 + max(0, (year - 2026) * 0.02)
effective_ref = float(cii_ref) / factor
```

**Engine `steel_calculator` — extracted transformation lines:**
```python
contribution = weight * intensity
dev = (actual - iea) / iea * 100
gap = current - target
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sector-calculators` hosts two hard-sector decarbonisation calculators:

**Shipping** (`shipping_calculator.py` — IMO CII / EEXI / AER):

```
annual_CO2 (t) = annual_fuel_tonnes × EF(fuel)                    tCO2/t fuel, IMO MARPOL factors
AER (gCO2/dwt-nm) = annual_CO2 × 10⁶ / (capacity × distance_nm)   capacity = DWT or GT per ship type
CII_ref = a × capacity^(−c)                                        IMO MEPC.338(76) Table 1
rating  = band of (AER / CII_ref) against per-type A–D factors
EEXI ≈ AER × 0.95                                                  explicit approximation
```

**Steel** (`steel_calculator.py` — route-mix intensity vs IEA NZE glidepath):

```
EAF_grid_intensity = 550 kWh/t × grid_kgCO2_per_kWh / 1000        tCO2/t steel
weighted_intensity = Σ route_share × route_intensity
annual_CO2 (Mt)    = weighted_intensity × production_Mt
RAG_2030: GREEN ≤ 1.20; AMBER ≤ 1.32 (×1.10); else RED
```

### 7.2 Parameterisation

**Shipping emission factors** (tCO₂/t fuel; header cites IMO MARPOL Annex VI): HFO 3.114,
VLSFO 3.151, MDO 3.206, LNG 2.750, LPG 3.00–3.03, methanol 1.375 ("bio-methanol at 50 % bio
share"), ammonia 0.000, hydrogen 0.000 (green, combustion-only). Calorific values are stored but
unused in the calculation.

**CII reference-line parameters** (a, c, capacity metric — source comment: IMO MEPC.338(76)
Table 1): bulker (961.79, 0.477, DWT), tanker (1218.80, 0.488, DWT), container (1984.60, 0.489,
GT), LNG carrier (144.13, 0.183, DWT), ro-ro (1967.68, 0.482, GT), cruise (930.44, 0.383, GT),
general cargo (107.48, 0.216, DWT). Rating boundaries (attained/required ratio), e.g. tanker
A ≤ 0.82, B ≤ 0.93, C ≤ 1.08, D ≤ 1.28, else E — the real MEPC.339(76) dd-vector structure.

**IMO strategy targets**: required AER reductions vs 2008 baseline {2023: 11 %, 2025: 20 %,
2030: 40 %, 2035: 55 %, 2040: 70 %, 2045: 85 %, 2050: 100 %} — the 2030 value reflects the 2023
IMO GHG Strategy checkpoint; 2008 AER baselines per type (bulker 5.3, tanker 6.1, container 16.1,
cruise 250 gCO₂/dwt-nm…) are approximations ("approx" in comment). Stranding scan: reference line
tightens 2 %/yr after 2026 (comment: "under IMO plans"); vessel strands the first year
AER > D-boundary of the tightened line.

**Steel route intensities** (tCO₂/t steel; comment: "worldsteel 2023 LCA data"): BF-BOF 1.90,
BF-BOF+CCUS 0.55 (70 % capture), EAF grid 0.65, EAF renewable 0.05, DRI-EAF gas 1.15,
DRI-EAF H₂ 0.10, scrap-EAF 0.40. Glidepaths: IEA NZE {2020: 1.85 → 2030: 1.20 → 2050: 0.05} and
"ResponsibleSteel / SBTi" {2020: 1.75 → 2030: 1.00 → 2050: 0.02}. EAF electricity 550 kWh/t.

### 7.3 Calculation walkthrough

- **Shipping:** unknown vessel types silently fall back to `bulker`; unknown fuels to VLSFO. The
  attained CII **is** the AER (correct for the IMO operational metric). The improvement pathway
  computes the efficiency cut needed to reach band A (`(AER − A·CII_ref)/AER`), then tests fuel
  switches by rescaling AER with the emission-factor ratio: LNG first, then bio-methanol, else
  "Green ammonia or H₂ required". A narrative string summarises rating, gap to the 2030 target
  (`baseline × (1−0.40)`), and the switch advice.
- **Steel:** the route API validates the five mix shares sum to 1.0. The EAF term uses the
  caller's grid intensity rather than the static 0.65 constant. The glidepath series marks the
  plant's current intensity only at `reference_year` (default 2024 — note this year is absent from
  the 7-node series, so `weighted_intensity` is typically null at every plotted year) and
  RAG-codes deviation (GREEN ≤ 0 %, AMBER ≤ 10 %, RED above). Scenario outputs: 100 % renewable-EAF
  (0.05) and a 50 % H₂-DRI blend `0.5×0.10 + 0.5×current`. Pathway text triggers: BF-BOF share
  > 30 %, grid intensity > 0.3 kg/kWh, H₂-DRI share < 10 %.
- Both calculators catch all exceptions and return a `data_available=False` result instead of
  raising (shipping defaults the rating to "C" in that error path).

### 7.4 Worked example — Aframax tanker on VLSFO

Inputs: tanker, DWT 110,000, fuel VLSFO, 18,000 t fuel/yr, 60,000 nm/yr.

| Step | Computation | Result |
|---|---|---|
| Annual CO₂ | 18,000 × 3.151 | **56,718.0 t** |
| AER | 56,718 × 10⁶ / (110,000 × 60,000) | **8.593 gCO₂/dwt-nm** |
| CII reference | 1218.80 × 110,000^(−0.488) | 1218.80 / 289.1 ≈ **4.215** |
| Ratio | 8.593 / 4.215 | 2.04 → > D-factor 1.28 → **Rating E** |
| IMO 2030 target | 6.1 × (1 − 0.40) | **3.660** |
| % vs 2030 | (8.593 − 3.660)/3.660 | **+134.8 %** |
| Stranding | ratio already > 1.28 in 2024 | **2024** |
| Pathway | efficiency cut to A (0.82×4.215=3.456): (8.593−3.456)/8.593 | **59.8 %**; LNG ratio 8.593×2.750/3.151 = 7.50 > 3.456; methanol 3.75 > 3.456 → "Green ammonia or H₂ required" |

### 7.5 Data provenance & limitations

- **No synthetic PRNG.** Deterministic engineering formulas over caller inputs. Constants carry
  named citations (IMO MEPC.337/338(76), worldsteel 2023, IEA NZE) — the strongest-provenance
  domain in the platform — though rating-boundary and baseline values should be re-verified
  against the source tables before regulatory use.
- Shipping simplifications: EEXI is a flat ×0.95 proxy (real EEXI needs installed power and SFOC
  per MEPC.333(76)); no CII correction factors or voyage exclusions (MEPC.355(78)); the 2 %/yr
  post-2026 tightening is an assumption — IMO has only adopted reduction factors through 2026;
  cruise AER should use GT (AER for cruise is per-GT), which the code honours via the capacity
  metric, but the 2008 baselines mix units.
- Steel simplifications: scrap-EAF route constant defined but not in the mix vector; no scope 3
  (mining, alloys); glidepath actual-vs-target comparison effectively only computed at the 2030
  headline, since reference_year rarely coincides with a series node.
- FuelEU/EU-ETS shipping costs are *not* computed here (see `api::shipping_maritime`).

### 7.6 Framework alignment

- **IMO CII (MEPC.337/338/339(76))** — the real regulation rates ships A–E annually by
  attained-vs-required CII, where required CII = reference line × (1 − Z%) reduction factor and
  bands come from ship-type dd-vectors; the module implements the reference line and dd-vector
  banding but omits the adopted Z-factors (5 % by 2026), substituting its own 2 %/yr tightening.
- **IMO EEXI (MEPC.333(76))** — a design-efficiency index (attained EEXI ≤ required EEXI);
  approximated here as 95 % of operational AER.
- **2023 IMO GHG Strategy** — net-zero "by or around 2050", indicative checkpoints −20/30 % by
  2030 and −70/80 % by 2040 vs 2008; the module's 40 % @ 2030 and 100 % @ 2050 encode the stricter
  striving values applied to per-vessel AER.
- **IEA NZE steel glidepath / SBTi steel & ResponsibleSteel** — sectoral tCO₂/t-steel intensity
  convergence pathways; SBTi's steel tool similarly benchmarks fixed-boundary intensity against a
  sector decarbonisation curve. The module reproduces both curves at 5-year nodes with RAG
  deviation coding.

## 9 · Future Evolution

### 9.1 Evolution A — Fleet/plant-level analytics and repaired calculators (analytics ladder: rung 2 → 3)

**What.** Two hard-sector decarbonisation calculators with well-cited constants: shipping
(IMO CII/EEXI/AER — `AER = annual_CO2×10⁶/(capacity×distance)`, `CII_ref = a×capacity^(−c)` per
MEPC.338(76), MARPOL fuel factors, A–E rating with a 2%/yr reduction factor from 2026) and steel
(route-mix intensity vs the IEA NZE glidepath, `weighted_intensity = Σ share×intensity`, RAG at the
1.20 tCO2/t 2030 line). Two honest caveats: `EEXI ≈ AER × 0.95` is an explicit approximation, and —
more urgently — both `POST /calculate` endpoints trace **failed** in §4.2, so the computational core
isn't passing the harness. Evolution A repairs and deepens both.

**How.** (1) Fix the two failing calculate endpoints (payload/validation under the harness) so the
domain's only computations work end-to-end. (2) Extend from single-vessel/single-plant to fleet and
portfolio level: batch inputs with fleet-weighted CII trajectory to 2030 (the rating reference
tightens 2%/yr — project when each vessel falls to D/E) and steel-fleet gap-to-NZE aggregation. (3)
Replace the EEXI approximation with the actual EEXI technical formula or clearly scope it out. (4)
Bench-pin AER/CII rating bands and the steel weighted intensity against IMO/IEA worked examples.

**Prerequisites.** The two `/calculate` endpoints repaired; IEA NZE steel pathway data (shared with
`glidepath`). **Acceptance:** both calculators return `passed`; a fleet input returns per-vessel
ratings plus a projected year-of-downgrade; steel RAG matches the IEA glidepath source; bench pins
reproduce a MEPC.338(76) reference calculation.

### 9.2 Evolution B — Hard-sector financing copilot (LLM tier 2)

**What.** A copilot for shipping/steel financing desks: "rate this vessel's CII and tell me when it
drops to D under the tightening reference line" (calling `/shipping/calculate` and citing the AER vs
CII_ref band), and "how far is this steel producer's route mix from the IEA 2030 line?" (calling
`/steel/calculate`) — each figure tool-sourced.

**How.** Two POST calculators plus three reference GETs (vessel-types, fuel-types, steel
iea-glidepath) that ground every constant — the copilot cites MARPOL emission factors and the
MEPC.338(76) reference-line parameters from the module's own registries, never from memory. What-ifs
("switch to LNG", "raise EAF share to 60%") re-run statelessly and produce fuel/route-transition
narratives. Feeds the Poseidon-Principles-style shipping-finance and steel-transition conversations,
cross-linking to `shipping_maritime` and the glidepath copilots.

**Prerequisites.** Evolution A's endpoint fix is mandatory — both computational tools currently fail,
so a copilot would have nothing real to narrate. **Acceptance:** every AER, rating, and intensity
figure traces to a calculate response; fuel/route what-ifs reflect fresh engine calls; the copilot
labels EEXI as approximate while that remains true and refuses to assert regulatory CII compliance
(a flag-state determination).