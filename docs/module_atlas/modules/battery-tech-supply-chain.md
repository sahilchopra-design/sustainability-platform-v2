# Battery Supply Chain Risk Analytics
**Module ID:** `battery-tech-supply-chain` · **Route:** `/battery-tech-supply-chain` · **Tier:** B (frontend-computed) · **EP code:** EP-DT4 · **Sprint:** DT

## 1 · Overview
Critical mineral supply chain risk analytics for battery technologies covering lithium, cobalt, nickel, manganese and graphite, country concentration risk, price volatility and NMC vs LFP vs solid-state chemistry comparison.

> **Business value:** Battery supply chain risk is dominated by cobalt (DRC 70%) and natural graphite (China 65%) concentration; LFP chemistry eliminates cobalt risk and is now preferred for stationary storage at <$80/kWh cell cost, while solid-state batteries represent a 2027-2030 transformative shift per IEA CRM analysis.

**How an analyst works this module:**
- Map critical mineral supply chain by commodity: Li, Co, Ni, Mn, graphite, copper
- Calculate HHI concentration index by country for mining, processing and refining stages
- Model price volatility and supply disruption scenarios for each critical mineral
- Compare NMC 811, LFP and solid-state electrolyte chemistries on cost, energy density and supply risk

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CELLS`, `GIGA_FACTORIES`, `KpiCard`, `MINERALS`, `RECYCLING`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINERALS` | 7 | `unit`, `demand2025`, `demand2030`, `demand2035`, `demand2040`, `topProducers`, `hhi`, `ewRisk`, `price2025`, `chemistry` |
| `CELLS` | 6 | `cost2025`, `cost2027`, `cost2030`, `cost2035`, `ed_wh_kg`, `ed_wh_l`, `voltage`, `cobalt_kg_kwh`, `nickel_kg_kwh`, `li_kg_kwh`, `graphite_kg_kwh`, `region`, `share2025` |
| `GIGA_FACTORIES` | 9 | `country`, `cap_gwh`, `chemistry`, `opYear`, `capex_bn`, `jobs`, `vertical` |
| `RECYCLING` | 5 | `li_rec`, `ni_rec`, `co_rec`, `mn_rec`, `cost_usd_kg`, `matQuality`, `scale`, `co2_vs_virgin` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `wrightCurveCell` | `useMemo(() => { return CELLS.map(c => { const b = 0.13;` |
| `cellCost` | `[cell.cost2025, cell.cost2027, cell.cost2030, cell.cost2035, Math.round(cell.cost2035 * 0.75)][i];` |
| `modulePack` | `cellCost * 0.28;` |
| `bms` | `cellCost * 0.08;` |
| `thermal` | `cellCost * 0.06;` |
| `integration` | `cellCost * 0.04;` |
| `recyclingEconData` | `useMemo(() => { return RECYCLING.map(r => { const recoveredValue = (r.li_rec / 100) * 0.012 * 14500 * priceMult + (r.ni_rec / 100) * 0.04 * 16800 * priceMult + (r.co_rec / 100) * 0.01 * 32000 * priceMult;` |
| `netMargin` | `recoveredValue - r.cost_usd_kg * 1000;` |
| `geoRiskData` | `useMemo(() => [ { country: "China", score: 8.4, label: "Anode/cathode processing dominance", share: 72 }, { country: "DRC", score: 9.1, label: "Cobalt mining dominance", share: 70 }, { country: "Indonesia", score: 6.2, label: "Nickel ore processing", share: 42 }, { country: "Chile", score: 4.8, label: "Lithium brine extraction", share: 26` |
| `invLandscapeData` | `useMemo(() => { return Array.from({ length: 20 }, (_, i) => ({ x: 20 + sr(i * 13) * 80, y: 5 + sr(i * 17) * 35, z: 200 + sr(i * 7) * 2800, name: ["CATL", "BYD", "Panasonic", "LG Energy", "Samsung SDI", "SK On", "Northvolt", "FREYR", "ACC", "Envision AESC", "SVOLT", "Farasis", "Gotion", "EVE Energy", "Lishen", "Amperex", "REPT", "CALB", "S` |
| `costPerGwh` | `70; // $M/GWh` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CELLS`, `GIGA_FACTORIES`, `MINERALS`, `RECYCLING`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cobalt Country Concentration | `HHI = Σ(market_share_i²) × 10000` | USGS Mineral Commodity Summaries 2023 | HHI of ~5,000 indicates extreme concentration; DRC political risk rated B- by S&P; ESG concerns in artisanal mining. |
| Lithium Price Volatility | `CoV = StdDev(price)/Mean(price)` | BNEF Metal Price Index | LCO/LFP divergence: LFP eliminates cobalt; NMC reduces cobalt 50-80% vs NMC-111; solid-state eliminates liquid electrolyte. |
| Battery Chemistry Comparison | `Energy density (Wh/kg): LFP 120-180, NMC 200-300, SSB 400+` | BNEF 2023 | LFP dominates stationary storage (<$80/kWh cell); NMC dominates EV long-range; solid-state batteries TRL 5-7, commercial by 2027-2030. |
- **USGS mineral production data** → → HHI model → **Mine output by country and mineral**
- **Battery cell price history** → → chemistry comparison → **$/kWh by chemistry and year**

## 5 · Intermediate Transformation Logic
**Methodology:** Supply Chain Risk Index
**Headline formula:** `SCRI = Σ(CRM_weight × HHI_country × price_vol × substitutability_score)`

HHI concentration index applied to country production share; DRC produces 70% of cobalt (HHI ~5,000); lithium 50% Chile+Australia; supply risk highest for cobalt and natural graphite.

**Standards:** ['IEA Critical Minerals Report 2023', 'BNEF Electric Vehicle Outlook 2023', 'European Commission CRM Act']
**Reference documents:** IEA Critical Minerals Report 2023: Role in Clean Energy Transitions; BNEF Electric Vehicle Outlook 2023 — Battery Technology Chapter; European Commission Critical Raw Materials Act 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the SCRI it claims, from real production shares (analytics ladder: rung 1 → 3)

**What.** §7's partial mismatch: the guide's headline `SCRI = Σ(CRM_weight × HHI_country × price_vol × substitutability_score)` is never computed — HHI values are hand-entered constants (0.18–0.52) rather than derived from production shares, mineral price forwards are seeded-random drifts off 2025 prices, and the "Wright curve" declares a learning exponent `b = 0.13` it never uses. The genuinely computed pieces (recycling economics with a price multiplier, the 1.46× pack cost stack, the chemistry radar) are sound. Evolution A derives what is currently asserted.

**How.** (1) Ingest USGS Mineral Commodity Summaries production-by-country tables (public domain) into refdata; compute `HHI = Σ share_i²` per mineral and stage (mining/processing/refining — the concentration story differs by stage, which is the module's own point about China's processing dominance), replacing the curated constants and reconciling the ×10,000 vs 0–1 convention. (2) Implement the SCRI composite with documented weights and a substitutability score sourced from the EU CRM Act assessment criteria; publish the weight rationale per Atlas §8. (3) Replace seeded price paths with historical price series (LME/Fastmarkets where licensable, else clearly labelled scenario bands) and compute the guide's CoV volatility from actual history — rung 3: concentration and volatility measured, not typed. (4) Either use the Wright exponent against cumulative-GWh data or delete it.

**Prerequisites.** USGS ingestion (freely licensed; fits the existing 19-ingester scaffold); a licensing decision on metal price history; the seeded `invLandscapeData` scatter (real company names, random coordinates) must be retired or re-sourced. **Acceptance:** cobalt HHI recomputes from USGS shares to ≈0.49–0.52 (validating the curated value) with vintage displayed; SCRI ranks cobalt and graphite highest (the module's own thesis) via computation; price-volatility figures cite the underlying series.

### 9.2 Evolution B — Critical-minerals exposure analyst for battery portfolios (LLM tier 2)

**What.** The module's data answers a due-diligence question no single tab composes: "what is this battery investment's mineral-supply exposure?" Evolution B is a tool-calling analyst that chains the module's computed surfaces — chemistry selection → per-kWh mineral intensities (`co_kg_kwh`, `li_kg_kwh`… from `CELLS`) → SCRI per mineral → recycling-offset economics — to produce a per-investment exposure profile: "a 10 GWh NMC 811 plant embeds N kt of cobalt demand at HHI 0.52 concentration; switching to LFP eliminates the cobalt line but raises phosphate/graphite exposure."

**How.** Requires Evolution A's backend extraction (`GET /api/v1/battery-scri/{mineral}`, `POST /exposure` taking chemistry + GWh); tool schemas from those routes. Grounding corpus: this Atlas record — §7.1's radar/cost-stack formulas and §7.2's mineral table structure — plus the sibling-module boundary note (LCA questions route to `battery-ev-analytics`, market-intelligence to the same). The copilot's exposure arithmetic is all tool-computed; its contribution is the chemistry-substitution narrative, each trade-off claim anchored to the radar's computed axes. Until Evolution A, a tier-1 slice can explain the curated tables with their §7.2 provenance caveats.

**Prerequisites (hard for tier 2).** Evolution A's routes; without them the exposure math lives in React state and the copilot would re-derive it — a fabrication vector. **Acceptance:** every HHI, intensity, and tonnage in an exposure profile traces to a tool response; chemistry-switch comparisons state both sides' computed exposures; minerals without USGS coverage report as ungraded.