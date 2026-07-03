# Industrial Gas Destruction Credits
**Module ID:** `cc-industrial-gases` · **Route:** `/cc-industrial-gases` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
High-GWP industrial gas destruction credit quantification for HFC-23, N₂O, and SF₆ projects under CDM AM0001, AMS-III.L, and Verra VCS VM0024. Models destruction efficiency, baseline emission rates, and additionality for refrigerant and chemical plant applications.

> **Business value:** Industrial gas credits carry very high tCO₂e per unit due to GWP multipliers. HFC-23 destruction: 1 kg destroyed = 14.6 tCO₂e. Regulatory surplus test critical for additionality.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DESTRUCTION_TECHS`, `DualInput`, `GAS_TYPES`, `KIGALI_PHASES`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `baseline_quantity` | `quantity_t * (1 - policy_baseline_pct/100);` |
| `tco2e_baseline` | `baseline_quantity * gas.gwp;` |
| `tco2e_destroyed` | `quantity_t * destruction_eff * gas.gwp;` |
| `tco2e_project` | `quantity_t * (1 - destruction_eff) * gas.gwp;` |
| `net_credits` | `Math.max(0, tco2e_baseline - tco2e_project); // clamp: policy_baseline=100% makes baseline=0, which would produce negative credits` |
| `additionality_gap` | `tco2e_destroyed - tco2e_baseline;` |
| `totalAvoided` | `useMemo(() => PROJECTS.reduce((s,p)=>s+p.tco2e_avoided,0), []);` |
| `avgGWP` | `useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.gwp,0)/PROJECTS.length), []);` |
| `gasCompare` | `useMemo(() => GAS_TYPES.map(g=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DESTRUCTION_TECHS`, `GAS_TYPES`, `KIGALI_PHASES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| HFC-23 GWP100 | `IPCC AR6 Table 7.SM.7` | IPCC AR6 | 100-year global warming potential of HFC-23 trifluoromethane |
| SF₆ GWP100 | `IPCC AR6 Table 7.SM.7` | IPCC AR6 | 100-year global warming potential of sulfur hexafluoride |
| Destruction Efficiency | `Continuous emissions monitoring` | Plant monitoring | Fraction of high-GWP gas destroyed in thermal oxidation unit |
| Baseline EF | `Uncontrolled process factor` | CDM AM0001 | Emission factor for uncontrolled industrial gas venting |
- **Plant production records** → Output × baseline EF → baseline emissions → **tCO₂e baseline**
- **CEMS monitoring** → Destruction efficiency → project emissions → **Net ER in tCO₂e**

## 5 · Intermediate Transformation Logic
**Methodology:** High-GWP destruction credit = baseline emissions – project emissions
**Headline formula:** `ER = (BE_gas – PE_gas) × GWP_gas; BE = ProductionRate × EF_baseline`
**Standards:** ['CDM AM0001 v6', 'CDM AMS-III.L v3', 'Verra VM0024', 'IPCC AR6 GWP100']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).