## 7 · Methodology Deep Dive

Grounded in `backend/services/aviation_climate_engine.py` (pure computation, no DB calls) exposed
via `api/v1/routes/aviation_climate.py`. Seven sub-models cover the full aviation-decarbonisation
stack: CORSIA offsetting, ReFuelEU SAF blending, US IRA §45Z SAF credits, EU ETS aviation,
IATA Net Zero 2050 alignment, aircraft asset stranding, and a consolidated operator assessment.

### 7.1 What the domain computes

| Sub-model | Core formula (quoted from code) |
|---|---|
| CORSIA obligation | `growth = max(0, actual_tco2 − baseline_tco2)`; `obligation = growth × eligible_routes_pct/100 × offset_factor`; `cost = obligation × 8.5 $/t` |
| SAF compliance | `blend% = saf_t / max(fuel_t, 1) × 100`; `gap% = max(0, mandate% − blend%)`; `penalty = gap_t × (50 €/GJ × 44 GJ/t) × 1.10 €→$` |
| IRA 45Z credit | `reduction% = (89.16 − lifecycle_CI)/89.16 × 100`; tiered `credit_per_gge` × volume if reduction ≥ 50% |
| EU ETS aviation | `free_alloc = CO2 × free%`; `surrender_gap = max(0, CO2 − free_alloc)`; `cost = gap × EUA price` |
| IATA NZC alignment | `target = 95 × (1 − Σ pathway levers %/100)`; `score = clamp((1 − (current − target)/95) × 100, 0, 100)` |
| Aircraft stranding | straight-line residual value at type-specific stranding year, summed over fleet |
| Full assessment | weighted 4-pillar compliance score (§7.3) + total cost exposure |

### 7.2 Parameterisation

**CORSIA phases** (ICAO Annex 16 Vol IV SARPs, cited in module docstring):

| Phase | Years | Offset factor | Mandatory | Eligible units |
|---|---|---|---|---|
| phase_1 | 2021–2023 | 0.00 (voluntary pilot) | No | VCS, GS, ACR, CAR, CDM |
| phase_2 | 2024–2026 | 0.85 | Yes (G20+ states) | + REDD+, ARB, SOCIALCARBON |
| phase_3 | 2027–2035 | 1.00 | Yes (all ICAO, excl. exemptions) | + CDM_CER |

Baseline year 2019 for all phases. CORSIA credit price constant: **$8.5/tCO₂**; EUA aviation
reference price: **€65/t** (both module-level published-market reference constants; the ETS
endpoint accepts a caller-supplied `eua_price_eur` override).

**ReFuelEU SAF mandates** (Regulation (EU) 2023/2405): 2025 → 2.0%, 2030 → 6.0%, 2035 → 20.0%,
2040 → 34.0%, 2045 → 42.0%, 2050 → 70.0%. Lookup takes the first mandate year ≥ assessment year.
Non-EU jurisdictions get `mandate = 0` ("No universal global mandate yet").

**IRA 45Z tiers** (26 USC §45Z; baseline CI 89.16 gCO₂e/MJ):

| Tier | Max lifecycle CI (gCO₂e/MJ) | Credit ($/GGE) |
|---|---|---|
| 50% reduction | 44.58 | 1.25 |
| 60% reduction | 35.66 | 1.50 |
| 80% reduction | 17.83 | 1.75 |
| 100% reduction | 0.0 | 1.75 (capped) |

**EU ETS aviation free-allocation phase-out** (Dir. 2003/87/EC as amended by EU 2023/958):
2024–25 → 85%, 2026 → 75%, 2027 → 50%, 2028 → 25%, 2029+ → 0% (intra-EEA scope only).

**IATA NZ2050 pathway levers** (% of 2019-baseline abatement, per IATA roadmap):

| Year | Efficiency | SAF | Removals | Offsets | Σ |
|---|---|---|---|---|---|
| 2030 | 3% | 5% | 0% | 3% | 11% |
| 2040 | 6% | 28% | 2% | 4% | 40% |
| 2050 | 13% | 65% | 10% | 19% | 107% (target floored at 1 gCO₂/pkm) |

**Aircraft reference tables** (labelled "ICAO 2023" for intensity): CO₂ intensity 60 (A350) to
120 gCO₂/pkm (B747 classic); NZ2050 stranding years 2028 (B747 classic) to 2038 (old turboprop).
SAF pathway cost premiums ($/t over Jet A-1): co-processing 600 · HEFA 800 · AtJ 1,200 · DSHC
1,500 · Fischer-Tropsch 1,800 · PtL 2,500. Ref-data GET endpoints expose these tables verbatim.

### 7.3 Calculation walkthrough

- **CORSIA:** only *growth above the 2019 baseline* is offsettable — the sectoral-growth design of
  CORSIA. Per-scheme allocation is honest-null: with no operator `unit_sourcing_mix` the engine
  reports `unallocated_tco2` + `insufficient_data` note rather than fabricating a split; with a
  mix, tonnes are pro-rated across only the phase-approved schemes.
- **SAF penalty:** ReFuelEU Art. 12 fines are "at least twice" the SAF–kerosene price gap; the code
  simplifies to a flat 50 €/GJ × 44 GJ/t ≈ **€2,200 per tonne of SAF shortfall**, converted at 1.10.
- **IATA score:** the alignment score is linear in the intensity shortfall against the pathway
  target, normalised by the 95 gCO₂/pkm 2019 baseline. `overall_aligned = score ≥ 75`. Companion
  gaps: `saf_gap = pathway SAF% − actual SAF%`; `efficiency_gap = current − 95×(1−eff%)`;
  `offset_gap = max(0, delta − efficiency_gap − 0.5×saf_gap)` (residual heuristic).
- **Stranding:** `residual = value × (max(0, 25 − age) − years_to_stranding)/25 × count`, floored
  at 0 — i.e. book value the operator would still carry at the stranding date under a 25-year
  straight-line life, evaluated from a hard-coded 2025 "today". `high_emission_pct` counts types
  with intensity > 95 gCO₂/pkm.
- **Full assessment:** `overall_compliance_score = 0.25×(100 if CORSIA obligation = 0 else 60)
  + 0.25×(100 if SAF compliant else 40) + 0.25×IATA score + 0.25×(100 if ETS gap = 0 else 50)`.
  Total cost exposure = CORSIA cost + SAF penalty + ETS cost×1.10 (all USD). IRA 45Z runs only if
  the operator supplies a certified `lifecycle_ci` (honest-null otherwise); SAF tonnes convert to
  GGE at `t × 1000 / 2.84` kg/GGE.

### 7.4 Worked example (default full-assessment operator, 2025)

Defaults: baseline 500,000 t; actual 550,000 t; fuel 200,000 t; SAF 4,000 t; intra-EEA 120,000 t;
intensity 78 gCO₂/pkm.

| Step | Computation | Result |
|---|---|---|
| CORSIA growth | 550,000 − 500,000 | 50,000 t |
| Obligation (phase 2) | 50,000 × 1.00 × 0.85 | **42,500 t** |
| Offset cost | 42,500 × $8.5 | **$361,250** |
| SAF blend | 4,000/200,000 | 2.0% = 2025 mandate → **compliant**, penalty $0 |
| EU ETS free alloc (2025) | 120,000 × 85% | 102,000 EUA |
| Surrender gap | 120,000 − 102,000 | 18,000 EUA |
| ETS cost | 18,000 × €65 | **€1,170,000** |
| IATA target (2030) | 95 × (1 − 0.11) | 84.55 gCO₂/pkm |
| Alignment score | (1 − (78 − 84.55)/95) × 100, clamped | 106.9 → **100.0**, aligned |
| Compliance score | 0.25×60 + 0.25×100 + 0.25×100 + 0.25×50 | **77.5** |
| Total cost exposure | 361,250 + 0 + 1,170,000×1.10 | **$1,648,250** |

### 7.5 Data provenance & limitations

- **No synthetic PRNG data** — the engine is deterministic in caller inputs; the only embedded
  data are regulatory reference tables (offset factors, mandates, phase-out schedules) and two
  price constants which are point-in-time snapshots (EUA €65, CORSIA $8.5), not live feeds.
- CORSIA is simplified: real CORSIA uses a *sectoral* growth factor (share of global sector growth
  attributed to each operator, transitioning to individual growth) — here growth is purely
  operator-own vs 2019.
- ReFuelEU penalty is a flat 50 €/GJ heuristic; the regulation's Art. 12 formula (≥2× price gap,
  set by member states) is not reproduced. EUR→USD fixed at 1.10.
- IATA "gap" decomposition (esp. `offset_gap` with the 0.5×SAF haircut) is a heuristic residual,
  not from the IATA roadmap. 2050 lever sum >100% means the 2050 target floors at 1 gCO₂/pkm.
- Stranding years per type are scenario assumptions (no citation in code); valuation ignores
  discounting, part-out/freighter-conversion value, and uses fixed 2025 valuation date.
- Fleet-level defaults in `generate_full_assessment` are demo conveniences; production calls
  should supply full operator data.

### 7.6 Framework alignment

- **ICAO CORSIA (Annex 16 Vol IV)** — real CORSIA computes offsetting requirements as
  `operator emissions × growth factor` on international routes between participating states,
  phased voluntary→mandatory; the module implements the phase structure, 2019 baseline, and
  85%/100% factors, approximating the growth factor with operator-own growth.
- **ReFuelEU Aviation (EU) 2023/2405** — blending mandate trajectory reproduced exactly;
  penalty regime simplified.
- **US IRA §45Z (Clean Fuel Production Credit)** — real 45Z scales the credit by an emissions
  factor `(50 − CI×?)/50`-type formula with prevailing-wage multipliers; the module approximates
  with four discrete CI tiers capped at $1.75/gal.
- **EU ETS aviation chapter (2023/958)** — free-allocation phase-out to full auctioning by 2026
  in law is here stretched to 2029; scope correctly intra-EEA.
- **IATA Net Zero 2050 roadmap** — lever shares (efficiency/SAF/removals/offsets) mirror IATA's
  published waterfall; alignment scoring itself is a platform construct.
- **TCFD / ISSB transition-risk lens** — the stranding sub-model is a transition-scenario
  stranded-asset estimate consistent with TCFD's "stranded asset" metric concept, not a formal
  standard calculation.
