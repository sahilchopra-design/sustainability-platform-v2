## 7 · Methodology Deep Dive

This tier-A module has a **genuinely rigorous backend engine** (`digital_product_passport_engine.py`)
implementing the guide's *Product Sustainability Score* concept for real: ESPR compliance scoping,
ISO 14067 lifecycle GHG, a weighted 5-dimension circularity index, EU Battery Regulation assessment,
and a 20-member-state EPR levy calculator — all anchored to real EU regulation articles. The
**frontend page**, by contrast, renders a synthetic product portfolio (`sr()`-seeded ESPR scores,
carbon footprints, field completeness). §7.1–7.3 document the real engine; §7.4 the frontend synthesis.

### 7.1 What the engine computes (backend, real)

```python
# Lifecycle GHG (ISO 14067 / EU PEF, cradle-to-grave):
stage_emissions = LCA_EMISSION_FACTORS[category] (override-able), material cats scaled by weight/1000
total_per_unit  = Σ stage_emissions
scope1 = manufacturing × 0.3
scope2 = manufacturing × 0.7 + use_phase × 0.8
scope3 = raw_materials + transport + use_phase × 0.2 + end_of_life
annual_total_tco2e = total_per_unit × annual_units / 1000

# Circularity index (0–100, 5 weighted dimensions):
score_dim = clamp(0,100, (raw − low)/(high − low) × 100)     # normalise to benchmark band
circularity_index = Σ score_dim × weight_dim
tier: ≥75 Circular Leader · ≥55 Transitioning · ≥35 Linear-with-Pockets · else Linear
```

The GHG scope allocation is a real GHG-Protocol/PEF split (manufacturing → 30% Scope 1 / 70% Scope 2;
upstream + downstream → Scope 3); circularity normalises each input against EU benchmark high/low bands
and weights them, flagging sub-50 dimensions with EU-target-referenced improvement actions.

### 7.2 Parameterisation (backend, real)

| Element | Detail | Provenance |
|---|---|---|
| ESPR categories | 15 (textiles 2026, electronics 2027, batteries 2026, furniture/toys 2028, vehicles, construction, tyres, detergents…) | **real** ESPR Delegated-Act mandate years |
| Regulation refs | EU 2024/1781 (ESPR), 2023/1542 (Battery), EN 15804, PEF CR | **real** article citations |
| LCA emission factors | per-category cradle-to-grave EFs, `_default` fallback | PEF database (industry-average, DQ Tier 2) |
| Circularity dims | recycled content, recyclability, durability, repairability, material efficiency | 5 weighted, EU benchmark bands |
| EPR levies | 20 EU member states | national EPR scheme rates |
| Battery reg | Art 7 (carbon footprint), 8 (recycled content), 52-54 (DD), 38-65 (passport) | EU Battery Reg 2023/1542 |

### 7.3 Calculation walkthrough (backend)

`assess_espr_compliance` scopes a product to its category, lists mandatory requirements, flags gaps.
`calculate_lifecycle_ghg` applies category EFs across five stages (material categories scaled by
weight, kg→tonne), sums to per-unit CF, allocates to Scopes 1/2/3, and scales by annual units.
`assess_circularity` normalises the five inputs to their benchmark bands, weight-sums to a 0–100 index,
assigns a tier, and emits improvement actions. `assess_battery_regulation` checks recycled-content
thresholds (Li/Co/Ni/Pb) and passport/DD flags. `calculate_epr_levy` applies member-state rates. A
full-assessment orchestrator combines these into a `dpp_readiness_score` + `espr_tier`.

### 7.4 Frontend synthesis (what the page shows)

The page generates products with `sr()`-seeded `espr_score = round(sr(i·17)·55 + 35)` (35–90),
`carbonFootprint`, `fieldFilled = sr(i·157+3) > 0.30` (per DPP field), category, and country. KPIs
average these seeded scores; `dppReadiness = min(100, round(fieldSlider/100 × 85 + 15))` is a slider-
driven synthetic readiness. The mandatory-year timeline and 36 DPP fields are real ESPR structure; the
per-product values are synthetic. Reference endpoints (`/ref/battery-targets`, `/ref/dpp-mandatory-
fields`, `/ref/epr-rates`) and POST routes exist to serve the real engine, but the displayed product
portfolio is client-side seeded.

### 7.4 Worked example (engine)

A laptop (electronics), `annual_units = 100,000`, default EFs (say raw 120, mfg 90, transport 8,
use 40, EoL 5 kgCO₂e/unit):
- `total_per_unit = 120 + 90 + 8 + 40 + 5 = 263 kgCO₂e`.
- `scope1 = 90 × 0.3 = 27`; `scope2 = 90 × 0.7 + 40 × 0.8 = 63 + 32 = 95`;
  `scope3 = 120 + 8 + 40 × 0.2 + 5 = 141 kgCO₂e`.
- `annual_total = 263 × 100,000 / 1000 = 26,300 tCO₂e`.
Circularity with recycled 40 (band 0–60), recyclability 70 (0–100), durability 6 (2–10),
repairability 65 (0–100), material-eff 80 (40–100), equal-ish weights: recycled `40/60·100 = 66.7`,
recyclability 70, durability `(6−2)/8·100 = 50`, repairability 65, mat-eff `(80−40)/60·100 = 66.7` →
weighted ≈ 63 → **Transitioning** tier.

### 7.5 Data provenance & limitations

- **Backend engine is real** — ESPR/Battery/EPR regulation references and article citations are
  accurate; LCA/circularity math is deterministic. LCA EFs are PEF industry-average (DQ Tier 2), not
  product-specific.
- **Frontend portfolio is synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`): ESPR scores, carbon
  footprints, and field-completeness flags are seeded; only the DPP field schema and mandate calendar
  are real.
- Scope allocation (30/70 mfg split, 0.8/0.2 use-phase split) is a simplifying convention, not a
  measured allocation; biogenic carbon excluded.

**Framework alignment:** EU **ESPR** Regulation 2024/1781 (Art 5/7/8/9 — DPP, ecodesign, carbon
footprint), **EU Battery Regulation** 2023/1542 (Art 7 CF, Art 8 recycled content, Art 38-65 passport),
**ISO 14067:2018 / ISO 14044:2006 / EU PEF** (product carbon footprint, cradle-to-grave), **EN
15804+A2** (construction EPD), and **EPR** under Directive 2008/98/EC — all implemented with correct
article-level references in the engine, making this one of the more standards-faithful modules in the
platform. The synthetic frontend should be wired to the engine's POST endpoints to surface real
computed passports.
