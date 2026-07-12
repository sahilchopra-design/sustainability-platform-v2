# Green Steel LCOP Engine
**Module ID:** `green-steel-lcop-engine` · **Route:** `/green-steel-lcop-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-EG1 · **Sprint:** EG

## 1 · Overview
Levelised Cost of Production analysis for 6 steel production routes: BF-BOF, DRI-EAF-NG, DRI-EAF-H₂, EAF-Scrap, Molten Oxide Electrolysis, and HIsarna+CCS. Models CBAM certificate exposure, H₂ break-even price calculator, and carbon price sensitivity across 22 projects.

> **Business value:** Used by steel producers evaluating decarbonisation investment cases, buyers assessing green premium affordability, investors analysing CAPEX requirements, and policy teams modelling CBAM impacts.

**How an analyst works this module:**
- Review LCOP overview for 6 production routes benchmarked side-by-side
- Use CBAM calculator for certificate exposure by route and carbon price
- Run H₂ break-even calculator to identify green hydrogen threshold for competitiveness
- Examine learning curves for LCOP convergence timeline 2024–2035

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `ROUTES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ROUTES` | 7 | `name`, `type`, `lcop`, `capex`, `ci`, `h2_t`, `elec_mwh`, `coal_t`, `maturity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['LCOP Overview', 'DRI-EAF vs BF-BOF', 'Capital Model', 'H₂ Steel Economics', 'Carbon Price Impact', 'Project Pipeline'];` |
| `route` | `ROUTES[Math.floor(sr(i * 7 + 1) * ROUTES.length)];` |
| `capMt` | `parseFloat((0.5 + sr(i * 11 + 2) * 4.5).toFixed(1));` |
| `country` | `['Germany', 'Sweden', 'USA', 'Japan', 'South Korea', 'India', 'Brazil', 'Australia'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Announced', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `lcop` | `parseFloat((route.lcop * (0.88 + sr(i * 19 + 5) * 0.28)).toFixed(0));` |
| `greenPremium` | `route.type === 'Green' \|\| route.type === 'Low-carbon' ? Math.round(50 + sr(i * 23 + 6) * 150) : 0;` |
| `filtered` | `useMemo(() => PROJECTS.filter(p => selType === 'ALL' \|\| p.type === selType), [selType]); const avgLcop = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcop, 0) / filtered.length) : 0, [filtered]);` |
| `avgCi` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.ci, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `greenCount` | `useMemo(() => PROJECTS.filter(p => p.type === 'Green' \|\| p.type === 'Low-carbon').length, []);` |
| `routeWithCarbon` | `useMemo(() => ROUTES.map(r => ({` |
| `sensitivityH2` | `[1, 2, 3, 4, 5, 6, 7, 8].map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ROUTES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DRI-EAF H₂ break-even H₂ price ($/kg) | `LCOP_DRI-H2 = LCOP_BF-BOF when H2 < break-even` | IEA Hydrogen for Industry 2023 | At carbon price $100/tCO2: green H2 <$2.0/kg makes DRI-EAF-H2 competitive with BF-BOF. IEA projects $1–2/kg H2 by 2030. |
| CBAM certificate price (€/tCO₂) | `EU ETS spot price applicable to embedded carbon` | EU ETS current price + CBAM Regulation | CBAM fully phased in 2034; steel at 1.85 tCO2/t BF-BOF faces €92–148/t certificate cost per ton at €50–80 ETS. |
| BF-BOF carbon intensity (tCO₂/t steel) | `World average; varies 1.4–2.5` | worldsteel 2023 CO₂ Data Collection | DRI-EAF-H2 achieves 0.05–0.08 tCO2/t with green H2; EAF-Scrap 0.06–0.3 tCO2/t (grid-dependent). |
- **IEA LCOP benchmarks + CBAM regulation + worldsteel emissions data** → 6-route LCOP model + CBAM calculator + H2 break-even engine + carbon sensitivity → **Steel producers, offtakers, infrastructure investors, and policy teams evaluating decarbonisation pathways**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Steel LCOP ($/t)
**Headline formula:** `LCOP = (CAPEX×CRF + OPEX + Feedstock + Energy) / Annual_Output + CBAM_exposure − Green_premium`

BF-BOF baseline ~$500/t; DRI-EAF-H₂ ~$650–950/t (2024) declining to ~$500–700/t by 2030 with H₂ cost reduction; EAF-Scrap ~$400/t where scrap available.

**Standards:** ['IEA Iron and Steel Technology Roadmap 2020', 'BNEF Green Steel Market Outlook 2024', 'worldsteel CO₂ Emission Data']
**Reference documents:** IEA (2020) – Iron and Steel Technology Roadmap; BNEF (2024) – Green Steel Market Outlook; worldsteel (2023) – CO₂ Emission Data for Steel Production

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-EG1) states LCOP =
> `(CAPEX×CRF + OPEX + Feedstock + Energy)/Output + CBAM − Green_premium`. The page does **not** build
> LCOP bottom-up from CRF; instead each route carries a *pre-set* base LCOP ($/t) and the live engine
> adds carbon, H₂ and electricity cost overlays on top. So the "capital model" and CRF decomposition
> the guide describes are display/reference, while the interactive LCOP is an additive cost-stack.

### 7.1 What the module computes

The single live formula (`routeWithCarbon`) recomputes total LCOP per route as the base cost plus
three price-driven overlays:

```js
totalLcop  = round( lcop + ci×carbonPrice + h2_t×h2Price + elec_mwh×elecPrice×0.1 )
carbonCost = round( ci × carbonPrice )        // $/t = tCO₂/t × $/tCO₂
h2Cost     = round( h2_t × h2Price )          // h2_t in kg/t × $/kg
```

Companion curves:
```js
learningCurve[i]: BF_BOF = 420×(1+i×0.015)          // rises 1.5%/yr (carbon drag)
                  DRI_EAF_H2 = 680×0.93^i           // 7%/yr learning decline
                  EAF_Scrap  = 390×(1−i×0.005)      // slow 0.5%/yr decline
sensitivityH2[p]: dri_eaf_h2 = 680 + (p−4.5)×15     // $15/t per $1/kg H₂
                  bf_bof      = 420 + carbonPrice×1.85
```

### 7.2 Route parameterisation (`ROUTES`, 6 rows)

Provenance: IEA Iron & Steel Roadmap / worldsteel CO₂ data (per guide); values are illustrative
route economics.

| Route | Type | Base LCOP $/t | CAPEX $/t-cap | CI tCO₂/t | H₂ kg/t | Elec MWh/t | Coal t/t |
|---|---|---|---|---|---|---|---|
| BF-BOF | Conventional | 420 | 1200 | 1.85 | 0 | 0.5 | 0.78 |
| DRI-EAF-NG | Transition | 480 | 850 | 1.10 | 0 | 1.1 | 0 |
| DRI-EAF-H₂ | Green | 680 | 950 | 0.05 | 55 | 1.3 | 0 |
| EAF-Scrap | Low-carbon | 390 | 320 | 0.60 | 0 | 0.55 | 0 |
| Molten-Oxide | Emerging | 750 | 1400 | 0.02 | 0 | 3.2 | 0 |
| HIsarna+CCS | Transition+CCS | 520 | 1150 | 0.30 | 0 | 0.4 | 0.55 |

The 1.85 tCO₂/t BF-BOF and 0.05 tCO₂/t DRI-H₂ intensities match worldsteel/IEA. Sliders: carbon
$20–200/t, H₂ $1–10/kg, electricity $20–150/MWh.

### 7.3 Calculation walkthrough

The 22-project pipeline (`PROJECTS`) is generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`:
route, capacity (0.5–5.0 Mt), country, status, and LCOP as `route.lcop × (0.88 + sr()×0.28)` (±14%
scatter around the route base). Filtered KPIs (`avgLcop`, `avgCi`, `greenCount`) aggregate the pipeline.
The interactive LCOP bar chart and H₂/carbon sensitivity charts use the deterministic route formula.

### 7.4 Worked example (DRI-EAF-H₂ vs BF-BOF at carbon $80/t, H₂ $4.5/kg, elec $60/MWh)

| Route | base | + ci×carbon | + h2_t×h2 | + elec×0.1 | total |
|---|---|---|---|---|---|
| DRI-EAF-H₂ | 680 | 0.05×80 = 4 | 55×4.5 = 247.5 | 1.3×60×0.1 = 7.8 | **$939/t** |
| BF-BOF | 420 | 1.85×80 = 148 | 0 | 0.5×60×0.1 = 3 | **$571/t** |

At $80/t carbon and $4.5/kg H₂, green DRI is still ~$368/t more expensive — the H₂ feedstock cost
(55 kg/t × $4.5) dominates. The H₂ sensitivity chart shows DRI-H₂ = 680 + (p−4.5)×15: at H₂ = $2.0/kg
the route falls to ~$643/t while BF-BOF at $80 carbon is 420+148 = $568 — parity requires both cheaper
H₂ *and* higher carbon, consistent with the guide's ~$1.5–2.5/kg H₂ break-even at $100/t carbon.

### 7.5 Data provenance & limitations

- **Pipeline is synthetic** — all 22 projects, their LCOP scatter, capacity, country and status come
  from the `sr()` PRNG; only the 6 route archetypes carry externally anchored parameters.
- The interactive LCOP is an **additive overlay**, not a full levelised cash-flow: it does not apply
  a capital recovery factor to CAPEX, discount over plant life, or model utilisation. The `elec×0.1`
  term is a rough scaling, not a per-MWh energy cost line.
- CBAM certificate exposure (guide) is represented only as the `ci×carbonPrice` term — no import-share
  or free-allocation phase-out schedule.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page adds cost overlays to a fixed base
LCOP; it does not compute levelised cost from capital and operating fundamentals).

**8.1 Purpose & scope.** A true levelised-cost-of-steel model comparing 6 production routes on an
annualised $/t basis including capital recovery, energy, feedstock, and CBAM, for FID and offtake
decisions.

**8.2 Conceptual approach.** Discounted-cash-flow LCOP mirroring IEA ETP / BNEF green-steel cost
curves and Agora/Wood Mackenzie levelised-cost frameworks: annualise CAPEX via CRF, layer OPEX,
energy and feedstock at scenario prices, add CBAM net of free allocation.

**8.3 Mathematical specification.**
```
CRF = r(1+r)^n / ((1+r)^n − 1)
LCOP = (CAPEX × CRF) / (Capacity × Utilisation)
       + OPEX_fixed/output + Σ (input_k × price_k)          // coal, NG, H₂, electricity, scrap
       + CI_scope1 × CBAM_price × (1 − free_alloc_share)
       − green_premium_realised
Break-even H₂ price: solve LCOP_DRI-H₂(pH₂) = LCOP_BF-BOF(carbon)
```

| Parameter | Value / source |
|---|---|
| r (WACC) | 7–9% (industrial, BNEF) |
| n (plant life) | 20–25 yr (IEA) |
| CI by route | worldsteel CO₂ Data 2023 |
| H₂ consumption | ~51–55 kg/t (IEA H₂ for Industry) |
| CBAM price | EU ETS spot; free-alloc phase-out 2026–2034 |
| Electricity/H₂/scrap prices | IEA WEO / regional forwards |

**8.4 Data requirements.** Route CAPEX/OPEX, input intensities, WACC, utilisation, ETS/CBAM price path,
regional energy forwards. Route archetype parameters already exist on the page.

**8.5 Validation.** Reconcile route LCOP against IEA ETP and BNEF published curves (BF-BOF ~$500/t,
DRI-H₂ $650–950/t 2024); sensitivity on H₂ price, carbon price, WACC; check break-even H₂ against
IEA's $1.5–2.5/kg figure.

**8.6 Limitations & model risk.** Utilisation and WACC assumptions drive CAPEX recovery; CBAM
free-allocation schedule is policy-dependent; H₂ price is the swing variable. Conservative fallback:
report cost ranges per route rather than point estimates.

**Framework alignment:** IEA Iron & Steel Technology Roadmap — route pathways and CI benchmarks;
worldsteel CO₂ Data — carbon intensities; CBAM Regulation (EU) 2023/956 — border carbon cost;
BNEF Green Steel Outlook — LCOP curve benchmarking; SBTi Steel Sector guidance — decarbonisation
alignment target for green routes.

## 9 · Future Evolution

### 9.1 Evolution A — Compute LCOP from capital and operating fundamentals (analytics ladder: rung 1 → 2)

**What.** §7 documents that the module's single live formula (`routeWithCarbon`) adds three price-driven overlays (carbon, energy, green-premium) to a fixed base LCOP per route rather than computing levelised cost from fundamentals — the guide's `LCOP = (CAPEX×CRF + OPEX + Feedstock + Energy)/Annual_Output + CBAM_exposure − Green_premium` is only partially realised, and the 22-project pipeline (LCOP scatter, capacity, country, status) is entirely `sr()`-seeded; only the 6 route archetypes (BF-BOF, DRI-EAF-NG, DRI-EAF-H₂, EAF-Scrap, Molten Oxide Electrolysis, HIsarna+CCS) carry externally-anchored parameters (§8 marked "not yet implemented"). Evolution A builds the true LCOP model: compute levelised cost per route from capex × CRF, opex, feedstock (iron ore/scrap/DRI pellets), and energy (electricity/H₂/NG) fundamentals, so the H₂ break-even price and carbon-price sensitivity emerge from real cost structure rather than overlays on a fixed base.

**How.** (1) A route-level LCOP built from capex/CRF + opex + feedstock + energy per the §5 formula, with CBAM certificate exposure from the route's carbon intensity × carbon price. (2) The H₂ break-even calculator solves the H₂ price where DRI-EAF-H₂ LCOP equals BF-BOF (a computed crossover). (3) The 22-project pipeline sourced from a real green-steel project database, replacing the seeded scatter.

**Prerequisites.** Per-route capex/opex/feedstock/energy-intensity parameters (the 6 archetypes are already anchored — extend to full cost build-up); a project database; the seeded pipeline replaced. **Acceptance:** LCOP recomputes from fundamentals reproducing §5 (not overlays on a fixed base); the H₂ break-even is a solved crossover; CBAM exposure derives from route carbon intensity; no `sr()` project feeds the scatter.

### 9.2 Evolution B — Green-steel cost-competitiveness copilot (LLM tier 1 → 2)

**What.** A copilot for steel-sector investors and offtakers: "at $3/kg green H₂ and €90/t CBAM, which route has the lowest LCOP, and what H₂ price makes DRI-EAF-H₂ beat BF-BOF?" narrates the 6-route comparison from the atlas corpus, with tier-2 computing LCOP, CBAM exposure, and H₂ break-even via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the 6 route archetypes with anchored parameters, CBAM exposure, H₂ break-even, carbon-price sensitivity). Because the route parameters are externally anchored, an explainer over rendered comparisons ships early; the tier-2 upgrade computes fundamentals-based LCOP and the H₂ break-even goal-seek. Guardrail: the 22-project pipeline is seeded, so it must refuse project-specific claims. Every $/t figure validated against tool output.

**Prerequisites.** Evolution A for fundamentals-based LCOP; corpus embedding. **Acceptance:** post-Evolution-A, every LCOP and break-even figure traces to a tool call reproducing the fundamentals; the H₂ break-even solves the crossover; project-pipeline questions are declined until sourced.