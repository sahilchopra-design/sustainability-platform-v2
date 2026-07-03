# Rice Cultivation Methane Credits
**Module ID:** `cc-rice-cultivation` · **Route:** `/cc-rice-cultivation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Methane emission reduction quantification for sustainable rice intensification (SRI) and alternate wetting and drying (AWD) projects under CDM AMS-III.AU and Verra VCS VM0042. Models IPCC Tier 2 paddy methane baselines and water management intervention effects.

> **Business value:** AWD reduces paddy methane EF by ~48% (SF_w = 0.52). Annual ER = season length × (EF_base – EF_AWD) × area × GWP100. Typical yield: 0.8–1.8 tCO₂e/ha/yr.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `Kpi`, `PROJECTS`, `REGIONAL_EF`, `Section`, `TIP`, `TabBar`, `WATER_REGIMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `ch4_bl` | `ef_baseline * area_ha * seasons * 1e-6 * gwp_ch4; // tCO2e` |
| `ch4_pj` | `ch4_bl * awd_scaling;` |
| `gross` | `ch4_bl - ch4_pj;` |
| `net` | `gross * (1 - buffer_pct/100);` |
| `TABS` | `['Methodology Overview','Rice CH4 Calculator','AWD Practice Model','Multi-Season Analysis','Regional Benchmarks'];` |
| `awdComparison` | `useMemo(() => WATER_REGIMES.map(w => {` |
| `net` | `(bl - pj) * (1 - msBuf/100);` |
| `total` | `seasons.reduce((s,x)=>s+x.net,0);` |
| `avgEF` | `useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.ef_baseline,0)/PROJECTS.length), []);` |
| `awdReduction` | `useMemo(() => `${Math.round((1-rp.awd_scaling)*100)}%`, [rp.awd_scaling]);` |
| `adjusted` | `Math.round(r.ef_mid * r.soil_correction * r.variety_factor);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONAL_EF`, `TABS`, `WATER_REGIMES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EF₀ (Base Emission Factor) | `IPCC 2019 Table 5.11` | IPCC 2019 Agriculture | Reference methane EF for continuously flooded paddy with no organic amendments |
| SF_w (Water Regime Factor) | `IPCC 2019 Table 5.12` | IPCC 2019 | Scaling factor for alternate wetting and drying vs continuous flooding |
| AWD Threshold | `Pore-water tube reading` | IRRI protocol | Soil water level at which re-flooding is triggered in AWD protocol |
| Annual ER | `(EF_base – EF_proj) × Area × GWP` | Model output | Emission reductions per hectare per growing season |
- **IPCC Tier 2 tables** → EF₀ × scaling factors → paddy EF → **Baseline and project EF**
- **Pore-water tube monitoring** → Soil water level readings → AWD compliance → **Project emission factor**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC Tier 2 rice paddy CH₄ with water regime scaling factors
**Headline formula:** `ER = (EF_baseline – EF_project) × Area × GWP_CH4; EF = EF₀ × SF_w × SF_s × SF_o × t_season`
**Standards:** ['CDM AMS-III.AU v4', 'Verra VM0042 v1', 'IPCC 2019 Agriculture Ch.5', 'IRRI AWD Guidelines']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).