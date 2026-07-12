# Green Cement & Concrete Finance
**Module ID:** `green-cement-concrete-finance` · **Route:** `/green-cement-concrete-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EG4 · **Sprint:** EG

## 1 · Overview
Financial and technology analysis for low-carbon cement and concrete: Conventional Portland, Oxyfuel+CCS, LC³, Post-Combustion CCS, Geopolymer, Electric Kiln, and LEILAC. LCA waterfall separating calcination and thermal CO₂, break-even carbon price, and abatement progress by technology.

> **Business value:** Used by cement producers evaluating decarbonisation investments, concrete buyers specifying environmental requirements, project finance teams structuring green cement deals, and policy teams assessing CBAM implications.

**How an analyst works this module:**
- Review technology overview for 7 cement decarbonisation pathways
- Examine LCA waterfall for calcination vs thermal CO₂ split by technology
- Use break-even carbon price analysis to identify CAPEX viability thresholds
- Analyse 18 projects across maturity and technology types

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `TABS`, `TECHNOLOGIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECHNOLOGIES` | 8 | `name`, `ci`, `lcop`, `capex`, `maturity`, `abatement` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `TECHNOLOGIES[Math.floor(sr(i * 7 + 1) * TECHNOLOGIES.length)];` |
| `capMt` | `parseFloat((0.5 + sr(i * 11 + 2) * 4.5).toFixed(1));` |
| `country` | `['Germany', 'France', 'USA', 'Japan', 'India', 'China', 'Brazil', 'UK', 'Spain'][Math.floor(sr(i * 13 + 3) * 9)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `lcop` | `parseFloat((tech.lcop * (0.9 + sr(i * 19 + 5) * 0.25)).toFixed(0));` |
| `irr` | `parseFloat((5 + sr(i * 23 + 6) * 10).toFixed(1));` |
| `filtered` | `useMemo(() => PROJECTS.filter(p => selTech === 'ALL' \|\| p.tech === selTech), [selTech]); const avgLcop = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcop, 0) / filtered.length) : 0, [filtered]);` |
| `avgCi` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.ci, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `lcaComparison` | `TECHNOLOGIES.map(t => ({` |
| `carbonValueChart` | `TECHNOLOGIES.map(t => ({` |
| `breakeven` | `t.lcop > 85 ? Math.round((t.lcop - 85) / (0.82 - t.ci)) : 0;` |
| `eff` | `base * (1 - (yr - 2025) * 0.008);` |
| `ccs` | `base * (yr >= 2030 ? (yr - 2025) * 0.018 : 0);` |
| `lc3` | `base * (yr >= 2026 ? (yr - 2025) * 0.012 : 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cement calcination CO₂ (tCO₂/t clinker) | `Chemical decomposition of CaCO3 → CaO + CO2` | IEA/GCCA Cement Roadmap | Irreducible without CCS or supplementary cementitious materials; LEILAC captures this stream directly. |
| LEILAC CAPEX premium (% vs conventional) | `Limestone Calcination Electrification pilot data` | LEILAC-2 Horizon 2020 Project | LEILAC separates process CO2 for low-cost capture; CAPEX 25–40% higher than conventional kiln; demonstrated at HeidelbergCement Lixhe. |
| LC³ cost saving vs OPC (%) | `Calcined clay + limestone replace 45% clinker` | IIT Delhi LC3 Technology Research | LC³ (Limestone Calcined Clay Cement) reduces clinker factor to 50% vs 95% OPC; cuts CO2 by 40% and cost by 5–15%. |
- **IEA cement roadmap + LEILAC pilot data + LC³ research + GCCA roadmap** → LCA waterfall + 7-tech LCOP model + break-even carbon price + 18 projects → **Cement producers evaluating low-carbon investments, investors assessing CAPEX, and buyers specifying green concrete**

## 5 · Intermediate Transformation Logic
**Methodology:** Cement LCOP Model ($/t)
**Headline formula:** `LCOP = Energy_cost + Raw_material + CAPEX_CRF + CO2_cost − Green_premium`

Calcination CO₂ (0.55 tCO2/t) is process-inherent; only CCS or alternative binders can address it. Thermal CO₂ (0.10 tCO2/t) addressable via fuel switching or electrification.

**Standards:** ['IEA Cement Technology Roadmap 2023', 'GCCA Innovation Fund', 'EU ETS embedded carbon data for cement']
**Reference documents:** IEA (2023) – Cement Technology Roadmap; GCCA (2023) – Concrete Future: Roadmap to Net Zero; LEILAC-2 (2023) – Horizon 2020 Final Technical Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-EG4) and the code broadly agree: this module models low-carbon cement
economics via a per-technology levelised cost of product (`lcop`, $/t), an LCA carbon split, and a
break-even carbon price. The guide's headline `LCOP = Energy + Raw_material + CAPEX·CRF + CO₂_cost −
Green_premium` is not assembled from components in code — instead each technology carries a **seeded
`lcop` anchor** perturbed per project — but the technology carbon intensities and the break-even logic are
real and coherent. No hard mismatch; §8 specifies the component-built LCOP the guide describes.

### 7.1 What the module computes

The `TECHNOLOGIES` table (8 pathways) carries carbon intensity `ci` (tCO₂/t), a levelised cost anchor
`lcop`, capex, maturity and abatement. Projects perturb the anchor and add returns:
```js
lcop     = tech.lcop · (0.9 + sr(i·19+5)·0.25)      // ±per-project cost variation
irr      = 5 + sr(i·23+6)·10                          // 5–15% equity IRR
avgLcop  = mean(lcop | filtered)
avgCi    = mean(ci | filtered)
breakeven = tech.lcop > 85 ? ⌊(tech.lcop − 85) / (0.82 − tech.ci)⌋ : 0   // $/tCO₂ break-even price
```
Abatement progress projects three levers to 2050:
```js
eff = base · (1 − (yr−2025)·0.008)                   // efficiency: −0.8%/yr
ccs = base · (yr≥2030 ? (yr−2025)·0.018 : 0)         // CCS ramps from 2030 at 1.8%/yr
lc3 = base · (yr≥2026 ? (yr−2025)·0.012 : 0)         // LC³ ramps from 2026 at 1.2%/yr
```

### 7.2 Parameterisation / provenance

| Element | Value/rule | Provenance |
|---|---|---|
| `TECHNOLOGIES.ci` | per-pathway tCO₂/t (e.g. OPC ~0.82, CCS/LEILAC/geopolymer far lower) | IEA/GCCA cement roadmap (guide-cited) |
| Conventional OPC intensity | ~0.82 tCO₂/t (baseline in `breakeven`) | GCCA Concrete Future |
| Calcination CO₂ | 0.55 tCO₂/t clinker (process-inherent) | IEA/GCCA — irreducible without CCS/SCM |
| Thermal CO₂ | ~0.10 tCO₂/t (fuel-addressable) | IEA cement roadmap |
| `lcop` anchor | per tech, ×`(0.9+sr·0.25)` per project | anchors plausible; project variation synthetic |
| `irr` | `5 + sr·10` | synthetic demo value |
| Break-even threshold | reference LCOP $85/t | code constant (conventional cement cost proxy) |
| Ramp rates (0.8/1.8/1.2 %/yr) | efficiency/CCS/LC³ | synthetic deployment assumptions |

### 7.3 Calculation walkthrough

`selTech` filter → `filtered` projects → `avgLcop`, `avgCi` KPIs. `lcaComparison` and `carbonValueChart`
map over `TECHNOLOGIES`. The **break-even carbon price** answers: at what $/tCO₂ does a low-carbon
technology's cost premium over the $85/t conventional cost equal the value of its avoided emissions?
`breakeven = (tech.lcop − 85) / (0.82 − tech.ci)` — numerator = cost premium ($/t product), denominator =
carbon abated per tonne (baseline 0.82 − tech `ci`), so the ratio is $/tCO₂.

### 7.4 Worked example

Technology with `lcop = $110/t`, `ci = 0.30 tCO₂/t`:
`breakeven = (110 − 85) / (0.82 − 0.30) = 25 / 0.52 = ⌊48⌋ = $48/tCO₂`. Interpretation: once a carbon
price exceeds ~$48/t, this pathway's higher production cost is offset by the value of the 0.52 tCO₂/t it
abates versus OPC — below EU ETS levels (~€80–90/t), so already viable there; above voluntary-market
prices. A technology with `lcop ≤ 85` returns `breakeven = 0` (already at or below conventional cost).

### 7.5 Data provenance & limitations

- Technology carbon intensities and the calcination/thermal split are **real and standard** (IEA/GCCA);
  the LCA waterfall is faithful to the process chemistry.
- Project-level `lcop` variation and `irr` are **synthetic** (seeded `sr()`).
- Break-even uses a single fixed conventional-cost reference ($85/t) and baseline intensity (0.82) for all
  technologies — no regional cost/fuel variation, no CAPEX-CRF decomposition.
- Abatement ramp rates are illustrative linear assumptions, not scenario-calibrated.

**Framework alignment:** IEA *Cement Technology Roadmap* and GCCA *Concrete Future: Roadmap to Net Zero*
(intensities, levers, calcination/thermal split); EU ETS embedded-carbon data and CBAM (the carbon-price
context the break-even speaks to); LEILAC-2 (Horizon 2020) and IIT-Delhi LC³ research (technology anchors).
The calcination CO₂ (0.55 tCO₂/t) as an irreducible-without-CCS stream is a correct, load-bearing fact.

## 8 · Model Specification — Component-Built Cement LCOP & Abatement-Cost Model

**Status: specification — not yet implemented in code.** The guide's decomposed LCOP is not assembled in
code; below is the production build.

### 8.1 Purpose & scope
Compute a fully-decomposed levelised cost of cement ($/t) and marginal abatement cost ($/tCO₂) for each
decarbonisation pathway, to rank technologies and size the carbon price / green premium needed for FID.

### 8.2 Conceptual approach
Bottom-up LCOP mirroring the **IEA cement roadmap cost model** and **GCCA** techno-economics, with a
CAPEX capital-recovery-factor term (as in energy LCOE/LCOH models) and an explicit CO₂-cost term keyed to
the calcination/thermal split. Marginal abatement cost then follows the McKinsey/IEA MAC-curve convention.

### 8.3 Mathematical specification
```
CRF = wacc·(1+wacc)^n / ((1+wacc)^n − 1)
LCOP = (Energy_cost + Raw_material + CAPEX·CRF/AnnualOutput + FixedOM)
       + CO₂_cost·(CI_calc + CI_thermal_residual) − GreenPremium
where CI_calc = 0.55·(1 − capture_rate), CI_thermal_residual = 0.10·(1 − fuel_switch − electrify)
Abatement cost:  MAC = (LCOP_tech − LCOP_OPC) / (CI_OPC − CI_tech)      ($/tCO₂)
Break-even carbon price = MAC (price at which tech LCOP = OPC LCOP incl. carbon cost)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `CI_calc, CI_thermal` | 0.55 / 0.10 tCO₂/t | IEA/GCCA roadmap |
| `capture_rate` | CCS/LEILAC efficiency | LEILAC-2, capture pilot data |
| CAPEX, `wacc`, `n` | plant cost, cost of capital, life | GCCA innovation fund / project data |
| Energy, raw-material cost | $/t | IEA / regional input prices |
| `GreenPremium` | low-carbon cement price uplift | green procurement / offtake surveys |

### 8.4 Data requirements
Per pathway: clinker factor, capture rate, fuel mix, CAPEX/OPEX, output, WACC. Carbon price (EU ETS/CBAM).
Green-premium offtake data. The module holds `ci`, `lcop`, `capex`, `abatement` anchors — expand into the
component structure and source input prices.

### 8.5 Validation & benchmarking plan
Reconcile LCOP against IEA roadmap and published plant techno-economics; validate MAC ordering against
GCCA/McKinsey cement MAC curves; sensitivity to carbon price, fuel cost and CAPEX; cross-check CBAM
exposure against EU ETS embedded-carbon benchmarks.

### 8.6 Limitations & model risk
LCOP is highly sensitive to energy price and CAPEX, which vary regionally and over time. Green premium is
market-dependent and thin. CCS assumes CO₂ transport/storage availability. Conservative fallback: report
break-even carbon price as a range across fuel/CAPEX scenarios.

## 9 · Future Evolution

### 9.1 Evolution A — Compute LCOP from components and add break-even carbon-price rigour (analytics ladder: rung 2 → 3)

**What.** §7 credits this with real, standard technology carbon intensities and a faithful calcination/thermal CO₂ split (0.55 process-inherent + 0.10 thermal tCO₂/t, IEA/GCCA-consistent) across 8 pathways (Portland, Oxyfuel+CCS, LC³, Post-Combustion CCS, Geopolymer, Electric Kiln, LEILAC), with an LCA waterfall faithful to the process chemistry. Its limitation is that each technology's levelised cost is a stored `lcop` anchor that projects merely perturb, rather than building LCOP from its components (`LCOP = Energy_cost + Raw_material + CAPEX_CRF + CO2_cost − Green_premium`). Evolution A computes LCOP bottom-up from energy price, raw-material cost, capex CRF, and a live carbon price per the §5 formula, so the break-even carbon price (where a low-carbon pathway beats Portland) is derived, not a stored anchor — and responds to energy and carbon markets.

**How.** (1) Build LCOP per technology from its cost components using the real carbon intensities already present, replacing the perturbed anchor. (2) Break-even carbon price solved as the carbon price where a pathway's LCOP equals conventional Portland's — a computed crossover. (3) Wire energy and carbon prices from the platform's market feeds so LCOP and break-even respond to conditions.

**Prerequisites.** Per-technology cost-component data (energy intensity, raw-material, capex — curated from IEA/GCCA acceptable, documented per §8); energy/carbon-price feeds. **Acceptance:** LCOP recomputes from components reproducing §5 (not a stored anchor); the break-even carbon price is solved per technology and moves with energy price; the calcination/thermal split remains correct.

### 9.2 Evolution B — Cement-decarbonisation pathway copilot (LLM tier 1 → 2)

**What.** A copilot for cement-sector investors and offtakers: "at €90/t carbon, which low-carbon cement pathway has the lowest LCOP, and how much of the abatement is process-inherent calcination that only CCS can address?" narrates the technology comparison and LCA waterfall from the atlas corpus, with tier-2 computing LCOP and break-even carbon price via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the calcination-vs-thermal chemistry, the 8-pathway comparison, IEA/GCCA intensities), and since the carbon-intensity data is real, an explainer ships early. Tier 2 tool-calls the LCOP/break-even endpoint so carbon-price and energy-price what-ifs are computed. The copilot's distinctive value is the calcination insight — that ~0.55 tCO₂/t is process-inherent and only CCS/alternative binders address it. Every $/t figure validated against tool output.

**Prerequisites.** Evolution A for computed LCOP/break-even; corpus embedding. **Acceptance:** every LCOP and break-even figure in a copilot answer traces to a tool call or the real intensity data; pre-Evolution-A the copilot flags LCOP as a stored anchor; the calcination/thermal split is cited from the real chemistry.