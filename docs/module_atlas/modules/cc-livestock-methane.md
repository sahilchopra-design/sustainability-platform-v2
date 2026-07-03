# Livestock Methane Reduction Credits
**Module ID:** `cc-livestock-methane` · **Route:** `/cc-livestock-methane` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enteric fermentation and manure management methane reduction credit quantification under Verra VCS VM0041 and Gold Standard Animal Husbandry. Models Tier 2 IPCC enteric fermentation baselines, dietary additive interventions (3-NOP, seaweed), and anaerobic digestion co-benefits.

> **Business value:** Enteric ER = (baseline – project Ym) × GEI × headcount × GWP. 3-NOP typically yields 0.3–0.6 tCO₂e/cow/yr; seaweed up to 1.2 tCO₂e/cow/yr in optimal conditions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLIMATE_REGIONS`, `Card`, `DualInput`, `FEED_ADDITIVES`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `ch4_bl` | `gross_energy_mj * ym_bl * 365 * head_count / 55.65; // kg CH4/yr — IPCC 2006 GL & 2019 Refinement: 55.65 MJ/kg CH4` |
| `ch4_pj` | `gross_energy_mj * ym_pj * 365 * head_count / 55.65;` |
| `ch4_avoided_kg` | `ch4_bl - ch4_pj;` |
| `tco2e_bl` | `ch4_bl / 1000 * gwp;` |
| `tco2e_pj` | `ch4_pj / 1000 * gwp;` |
| `gross_credits` | `(ch4_avoided_kg / 1000) * gwp;` |
| `net_credits` | `gross_credits * (1 - buffer_pct/100);` |
| `ch4_bl` | `vs_kg * b0 * mcf * 0.67 * head_count * 365; // kg CH4/yr` |
| `ch4_pj` | `ch4_bl * (1 - reduction_pct/100);` |
| `ch4_avoided_kg` | `ch4_bl - ch4_pj;` |
| `tco2e_bl` | `ch4_bl / 1000 * gwp;` |
| `tco2e_pj` | `ch4_pj / 1000 * gwp;` |
| `gross_credits` | `(ch4_avoided_kg / 1000) * gwp;` |
| `net_credits` | `gross_credits * (1 - buffer_pct/100);` |
| `total` | `(entResult?.net_credits \|\| 0) + (manResult?.net_credits \|\| 0);` |
| `totalCH4Avoided` | `useMemo(() => PROJECTS.reduce((s,p)=>s+p.ch4_avoided_tco2e,0), []);` |
| `avgHerd` | `useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.herd_size,0)/PROJECTS.length), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIMATE_REGIONS`, `FEED_ADDITIVES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ym (Methane Conversion Factor) | `Species and diet dependent` | IPCC 2019 Table 10.2 | Fraction of gross energy intake converted to enteric methane |
| 3-NOP Reduction Efficacy | `Randomised controlled trial` | Published RCT literature | Enteric methane reduction from 3-nitrooxypropanol feed additive |
| VS (Volatile Solids) | `Species body weight × VS factor` | IPCC 2019 Table 10.19 | Organic matter excreted used for manure management calculation |
| Manure System MCF | `Storage type dependent` | IPCC 2019 Table 10.17 | Methane conversion factor for different manure management systems |
- **Farm head count records** → Species × Ym × GEI → baseline EF → **Baseline enteric tCO₂e**
- **Feed additive trial data** → Intervention efficacy → project EF → **ER in tCO₂e/head/yr**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC Tier 2 enteric fermentation + manure management
**Headline formula:** `ER_enteric = (EF_baseline – EF_project) × HeadCount × GWP_CH4; EF = GEI × Ym / 55.65`
**Standards:** ['Verra VM0041 v2', 'Gold Standard Animal Husbandry v1', 'IPCC 2019 Agriculture Ch.10', 'CDM AMS-III.D']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).