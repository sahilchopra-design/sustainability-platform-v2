## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry's headline formula —
> `SCRI = Σ(CRM_weight × HHI_country × price_vol × substitutability_score)` — is **not computed
> anywhere in code**. HHI values are *stored as curated constants* per mineral (0.18–0.52), never
> derived from production shares, and no composite supply-chain risk index exists. What the code
> *does* implement beyond the guide: a recycling-economics calculator with a metal-price
> multiplier, a system cost-stack decomposition, and a chemistry radar. Also note the code's
> "Wright curve" declares a learning exponent `b = 0.13` and then **never uses it** — the cost
> trajectory is curated points plus `2040 = 0.75 × cost2035`.

### 7.1 What the module computes

EP-DT4 (Sprint DT) spans 10 tabs over four curated datasets (6 minerals, 5 cell chemistries,
8 gigafactories, 4 recycling routes). The genuinely computed pieces:

```js
// Recycling economics ($/tonne of feedstock), per route r, with price multiplier p
recoveredValue = (li_rec/100)×0.012×14,500×p + (ni_rec/100)×0.04×16,800×p + (co_rec/100)×0.01×32,000×p
netMargin      = recoveredValue − cost_usd_kg × 1000

// Pack cost stack (per kWh), from the selected chemistry's cell cost
modulePack = cell×0.28;  bms = cell×0.08;  thermal = cell×0.06;  integration = cell×0.04
// → system cost = 1.46 × cell cost

// Chemistry radar (0–100 axes)
EnergyDensity = min(100, ed_wh_kg/280×100);  CostInv = min(100, 90/cost2025×100)
CobaltFree = co==0 ? 100 : max(0, 100 − co_kg_kwh×40);  Maturity = share>20 ? 95 : share>10 ? 75 : 45
```

Mineral price forward paths are seeded-random drifts off the 2025 price
(`price2030 = price2025 × (0.85 + sr(·)×0.3)`, widening bands to 2040) — synthetic, not futures
curves.

### 7.2 Parameterisation — curated reference tables

| Mineral | 2025→2040 demand (kt) | Top producer | HHI | EW risk | 2025 price $/t |
|---|---|---|---|---|---|
| Lithium (LCE) | 820 → 5,100 | Australia 47% | 0.31 | 8.2 | 14,500 |
| Cobalt | 180 → 160 (peaks 2030) | DRC 70% | 0.52 | 9.1 | 32,000 |
| Nickel (Class 1) | 420 → 2,400 | Indonesia 42% | 0.21 | 6.8 | 16,800 |
| Manganese (battery) | 160 → 1,700 | South Africa 35% | 0.18 | 5.9 | 4,200 |
| Natural graphite | 1,100 → 7,000 | China 65% | 0.45 | 8.7 | 8,500 |
| Phosphate (LFP) | 240 → 3,400 | China 45% | 0.28 | 6.1 | 1,100 |

Production shares and the cobalt/graphite concentration story match USGS/IEA figures cited in the
guide; the HHI numbers are consistent with those shares (e.g. cobalt 0.70² ≈ 0.49 ≈ 0.52 stored)
but are hand-entered, expressed as 0–1 fractions rather than the guide's ×10,000 convention.
Recycling recovery rates (hydromet Li 95%/Ni 99%/Co 99% at $1.8/kg; pyromet Li 0%; direct
recycling −85% CO₂ vs virgin) are curated route benchmarks. Implied metal content in the
recycling calc: **12 kg Li, 40 kg Ni, 10 kg Co per tonne of feedstock** (the 0.012/0.04/0.01
factors) — hard-coded, roughly NMC-pack black-mass magnitudes. Investment-landscape scatter uses
20 real producer names with seeded coordinates; `costPerGwh = 70 $M/GWh` (inline comment) prices
gigafactory capex per GWh.

### 7.3 Calculation walkthrough

1. **Cell Cost Trajectory** — per-chemistry curated cost points 2025/2027/2030/2035 with an
   extrapolated 2040 = 0.75×2035 (LFP 68→52→38→28→21 $/kWh).
2. **Critical Minerals / Supply Concentration / Geopolitical Risk** — demand bars + seeded price
   paths; curated HHI/EW-risk bars; a 6-country geo-risk list (China 8.4 "processing dominance,
   72% share"; DRC 9.1 "cobalt 70%"; Indonesia 6.2; Chile 4.8; …).
3. **Cost Stack Breakdown** — the 1.46× system multiplier over the declining cell cost (so system
   cost falls proportionally).
4. **Recycling Economics** — §7.1 formulas per route, with the metal-price slider (`priceMult`)
   and a recycled-content share slider.
5. **Cell Chemistry Compare** — radar per chemistry; note "Cycle Life (inv. cost)" axis is
   actually `80 − cobalt×10` — a cobalt proxy mislabeled as cycle life.
6. **Investment Landscape** — seeded bubble chart (x = 20–100, y = 5–40, size = $0.2–3B) over
   real company names; decorative.
7. An `EnergyAdvancedAnalytics` shared wrapper (EU Taxonomy/SBTi overlay from the
   Sprint-Energy-advanced uplift) is imported for the advanced tab.

### 7.4 Worked example — recycling route economics at priceMult = 1.0

Hydrometallurgy (Li 95%, Ni 99%, Co 99%, cost $1.8/kg):

| Term | Computation | $/t feedstock |
|---|---|---|
| Li value | 0.95 × 0.012 × 14,500 | 165.3 |
| Ni value | 0.99 × 0.040 × 16,800 | 665.3 |
| Co value | 0.99 × 0.010 × 32,000 | 316.8 |
| Recovered value | Σ | **1,147.4** |
| Processing cost | 1.8 × 1000 | 1,800 |
| Net margin | 1,147 − 1,800 | **−$652.6/t** |

At default prices *every* route is loss-making (direct recycling comes closest at −$78/t);
hydromet breaks even at `priceMult ≈ 1.57` (i.e. Li ≈ $22.8k, Ni ≈ $26.4k, Co ≈ $50.2k) — the
slider makes the price-dependence of recycling economics the tab's central lesson. (Real-world
caveat: the model omits revenue from graphite/copper/aluminium and manganese, and prices recovery
on black-mass-like intensities.)

### 7.5 Data provenance & limitations

- Mineral/cell/gigafactory/recycling tables are **curated editorial data** (magnitudes align with
  IEA Critical Minerals 2023, BNEF and USGS as the guide cites, but no vintages in code); price
  forecasts and the investment scatter are **seeded-random** (`sr(seed) = frac(sin(seed+1)×10⁴)`).
- No SCRI composite, no computed HHI, no price-volatility statistics (the guide's CoV formula is
  absent); "Supply Concentration" charts static fields.
- The unused learning exponent (`b = 0.13`) means cost curves are not Wright's-law consistent —
  they are drawn through curated points.
- Radar axis mislabel (§7.3.5); cycle-life data exists nowhere in `CELLS`.
- Recycling calc double-counts nothing but ignores route-specific feedstock (pyromet Li=0 is
  correctly captured via the 0% recovery).

### 7.6 Framework alignment

- **Herfindahl–Hirschman Index** — HHI = Σ share²; DOJ convention scales ×10,000 with > 2,500 =
  highly concentrated. The stored cobalt value 0.52 (= 5,200 scaled) correctly signals extreme
  concentration; the module presents but does not compute it.
- **EU Critical Raw Materials Act (2023)** — sets 2030 benchmarks (≤ 65% of any strategic raw
  material from a single third country; ≥ 10% domestic extraction, ≥ 40% processing, ≥ 25%
  recycling). The module's China/DRC share data is the factual basis for such screening, though no
  CRM Act test is coded.
- **IEA Critical Minerals Report / BNEF EV Outlook (guide references)** — demand trajectories and
  chemistry-share narratives are consistent with these publications' base cases.
- **EU Battery Regulation 2023/1542** — recycling-content rules (Co/Li/Ni recycled-content minima
  from 2031) are the regulatory hook for the Recycling Economics tab; not explicitly cited in
  code.
