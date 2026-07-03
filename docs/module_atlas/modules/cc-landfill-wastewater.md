# Landfill & Wastewater Methane Credits
**Module ID:** `cc-landfill-wastewater` · **Route:** `/cc-landfill-wastewater` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Methane capture and destruction credit quantification for landfill gas (LFG) and wastewater treatment plants under CDM ACM0001, AMS-III.G, and EPA Landfill Methane Outreach Program. Models first-order decay, gas collection efficiency, and methane oxidation.

> **Business value:** Annual ER = collected CH₄ × (1–oxidation fraction) × GWP100. Collection efficiency and L₀ are primary uncertainty drivers; combined CV typically 15–25%.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`, `WASTE_FRACTIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `ch4_captured` | `ch4_gen * collection_eff;` |
| `ch4_destroyed` | `ch4_captured * destruction_eff;` |
| `tco2e` | `ch4_destroyed / 1000 * 27.2; // IPCC AR6 WGI Table 7.SM.7: CH4 GWP100 = 27.2 (fossil); AR5 value 28 retired` |
| `net` | `tco2e * (1 - buffer_pct/100);` |
| `ch4_bl` | `organic_load * b0 * mcf_bl * 365 / 1000; // tonnes CH4/yr` |
| `ch4_pj` | `organic_load * b0 * mcf_pj * (1 - capture_eff) * 365 / 1000;` |
| `ch4_avoided` | `ch4_bl - ch4_pj;` |
| `tco2e_bl` | `ch4_bl * 27.2; // IPCC AR6 CH4 GWP100 = 27.2 (fossil)` |
| `tco2e_pj` | `ch4_pj * 27.2;` |
| `gross` | `ch4_avoided * 27.2;` |
| `net` | `gross * (1 - buffer_pct/100);` |
| `total` | `Object.values(next).reduce((a,b)=>a+b,0);` |
| `fodTotal` | `useMemo(() => fodData.length > 0 ? fodData[fodData.length-1].cumulative : 0, [fodData]);` |
| `fodPeak` | `useMemo(() => fodData.reduce((mx,d)=>d.net>mx?d.net:mx, 0), [fodData]);` |
| `totalAvoided` | `useMemo(() => PROJECTS.reduce((s,p)=>s+p.ch4_avoided_tco2e,0), []);` |
| `area_per_well` | `Math.PI * (gc.well_spacing_m/2)**2;` |
| `wells_per_ha` | `10000 / area_per_well;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `WASTE_FRACTIONS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| L₀ (Methane Potential) | `DOC × DOCf × MCF × F` | IPCC 2019 Waste | Methane generation potential per tonne of waste in place |
| First-Order Decay k | `Climate-dependent rate constant` | IPCC / EPA AP-42 | Decay constant; higher in wet tropical climates |
| Collection Efficiency | `Gas flow measurement` | Plant monitoring | Fraction of generated LFG collected before surface emission |
| GWP100 CH₄ | `IPCC AR6 Table 7.SM.7` | IPCC AR6 | 100-year global warming potential of methane |
- **Waste acceptance records** → Waste-in-place + composition → L₀ → **Methane generation potential**
- **Gas flow meters** → Collected gas volume → ER calculation → **Annual tCO₂e credits**

## 5 · Intermediate Transformation Logic
**Methodology:** First-order decay landfill methane generation
**Headline formula:** `Q_CH4(t) = L₀ × R × exp(-k×t); ER = Q_captured × (1–OxFrac) × GWP_CH4 × (1–Unc)`
**Standards:** ['CDM ACM0001 v14', 'CDM AMS-III.G v8', 'EPA LMOP', 'IPCC 2019 Waste Volume']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).