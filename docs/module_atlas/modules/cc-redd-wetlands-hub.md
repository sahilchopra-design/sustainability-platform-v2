# REDD+ & Wetlands Carbon Hub
**Module ID:** `cc-redd-wetlands-hub` · **Route:** `/cc-redd-wetlands-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub for REDD+ avoided deforestation and wetland carbon (blue carbon) projects. Covers Verra VCS JNR jurisdiction-level REDD+, ART TREES crediting, and VM0033 tidal wetland restoration with methane co-assessment.

> **Business value:** REDD+ ER = (reference level – project emissions) × (1–uncertainty) – leakage. Wetland projects add soil C accumulation minus CH₄ penalty. Combined nature-based projects often achieve 5–15 tCO₂e/ha/yr.

**How an analyst works this module:**
- Select project type: Project-level REDD+, Jurisdictional REDD+, or Tidal Wetland
- Reference Level tab models historical deforestation baseline
- Remote Sensing tab inputs activity data and uncertainty
- Wetland C tab quantifies soil accumulation and CH₄ penalty
- Credit Schedule shows annual issuance with leakage deductions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLUE_CARBON`, `Badge`, `Card`, `DualInput`, `GWP_AR5`, `GWP_AR6`, `HUB_PROJECTS`, `Kpi`, `PIE_COLORS`, `RISK_FACTORS`, `Section`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BLUE_CARBON` | 5 | `name`, `sequestration`, `sediment_rate`, `co2_avoided`, `ch4_rate`, `color`, `area_global_ha` |
| `RISK_FACTORS` | 6 | `desc`, `weight`, `levels`, `scores` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `bdr` | `bdr_pct / 100;` |
| `deforested` | `remaining * bdr;` |
| `baseline_emissions` | `deforested * (cs_forest - cs_post) * (44/12);` |
| `leak_act` | `Math.round(gross * leakage_act_pct / 100); // Activity-shifting leakage` |
| `leak_mkt` | `Math.round(gross * leakage_mkt_pct / 100); // Market leakage (timber substitution)` |
| `leak` | `leak_act + leak_mkt;` |
| `buf` | `Math.round((gross - leak) * buffer_pct / 100);` |
| `unc` | `Math.round((gross - leak - buf) * uncertainty_pct / 100);` |
| `net` | `Math.max(0, gross - leak - buf - unc);` |
| `cum` | `(years.length > 0 ? years[years.length-1].cumulative : 0) + net;` |
| `bl_co2` | `co2_rate * area_ha * gwp.CO2;` |
| `bl_ch4` | `ch4_rate * area_ha * gwp.CH4;` |
| `bl_n2o` | `n2o_rate * area_ha * gwp.N2O;` |
| `bl_total` | `bl_co2 + bl_ch4 + bl_n2o;` |
| `pj_co2` | `project_co2_rate * area_ha * gwp.CO2;` |
| `pj_ch4` | `project_ch4_rate * area_ha * gwp.CH4;` |
| `pj_n2o` | `project_n2o_rate * area_ha * gwp.N2O;` |
| `pj_total` | `pj_co2 + pj_ch4 + pj_n2o;` |
| `gross` | `Math.max(0, Math.round(bl_total - pj_total));` |
| `types` | `['REDD+','REDD+','REDD+','Wetlands','Wetlands','Blue Carbon','Blue Carbon','REDD+','REDD+','Wetlands','Blue Carbon','REDD+','REDD+','Wetlands','Blue Carbon','REDD+','REDD+','Wetlands','Blue Carbon','REDD+'];` |
| `TABS` | `['REDD+ Calculator','Wetlands Multi-Gas','Blue Carbon','Risk & Buffer Pool','Cross-Methodology','Hub Dashboard'];` |
| `reddResult` | `useMemo(()=>calcREDD(reddP),[reddP]);  useEffect(() => { if (reddResult && reddResult.total > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'VM0007', family: 'nature',` |
| `wetResult` | `useMemo(()=>calcWetlands(wetP),[wetP]);  /* Risk state */ const [riskLevels, setRiskLevels] = useState([1,1,0,0,1]); // 0=Low,1=Med,2=High const bufferRate = useMemo(()=>{ const base = 20;` |
| `riskPremium` | `RISK_FACTORS.reduce((s,rf,i)=>s+rf.scores[riskLevels[i]]*rf.weight,0);` |
| `totalCredits` | `HUB_PROJECTS.reduce((s,p)=>s+p.credits,0);` |
| `byType` | `['REDD+','Wetlands','Blue Carbon'].map(t=>({name:t,value:HUB_PROJECTS.filter(p=>p.type===t).reduce((s,p)=>s+p.credits,0)}));` |
| `vol` | `HUB_PROJECTS.filter(p=>p.registry===reg).reduce((s,p)=>s+p.credits,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLUE_CARBON`, `PIE_COLORS`, `RISK_FACTORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Reference Level | `10-yr historical deforestation × CF` | National forest monitoring | Baseline deforestation rate against which project is measured |
| Activity Data Uncertainty | `Remote sensing classification error` | Hansen GFC / PRODES | Uncertainty in deforestation area detection used for discount |
| Wetland Soil C Accumulation | `Peat accretion × carbon density` | VM0033 guidance | Soil carbon sequestration rate in restored tidal wetland |
| Methane Penalty (VM0033) | `CH₄ flux × GWP` | Eddy covariance | Methane emission penalty applied in non-tidal or impermanently flooded zones |
- **Hansen GFC / PRODES** → Annual forest loss maps → activity data → **Deforestation area tCO₂e**
- **VM0033 soil surveys** → Peat accretion rate → C accumulation → **Wetland credit yield**

## 5 · Intermediate Transformation Logic
**Methodology:** JNR jurisdictional REDD+ reference level and ART TREES accounting
**Headline formula:** `ER_REDD = (RefLevel – ProjectEmissions) × (1–Uncertainty) – Leakage`

Reference level (RL) derived from 10-year historical deforestation rate adjusted for national forest cover trend. Project emissions = remote sensing–verified residual deforestation within project boundary. Uncertainty deduction 10–15% based on activity data and emission factor uncertainty. Leakage: within-country leakage belt monitoring via PRODES/Hansen GFC. Wetland: VM0033 soil carbon accumulation minus CH₄ penalty for non-tidal areas.

**Standards:** ['Verra JNR v3', 'ART TREES v2.0', 'Verra VM0033 v2', 'IPCC LULUCF GPG']
**Reference documents:** Verra VCS JNR Jurisdictional REDD+ v3.0; ART TREES Jurisdictional Crediting Standard v2.0; Verra VM0033 v2.0 Tidal Wetland Restoration; IPCC 2013 Wetlands Supplement

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is broadly faithful: the code implements a REDD+ avoided-deforestation
calculator (VM0007-style), a wetland multi-gas calculator (VM0033-style), a blue-carbon reference
table, and a risk-weighted buffer-pool tool. One nuance vs the guide: the guide emphasises
*jurisdictional* JNR/ART TREES reference-level accounting; the code implements a **project-level**
avoided-deforestation baseline with an exponential-decay forest stock, not a jurisdictional RL. It is
labelled `methodology:'VM0007'`, consistent with the code.

### 7.1 What the module computes

**REDD+** (`calcREDD`), project-level baseline with declining forest stock:
```
deforested(t) = remaining · BDR;   remaining −= deforested        // BDR = baseline deforestation rate
baseline_emissions = deforested · (CS_forest − CS_post) · (44/12) // C→CO2
gross = baseline_emissions
leak  = gross·(leakage_act% + leakage_mkt%)/100                   // activity-shift + market leakage
buf   = (gross − leak)·buffer%/100
unc   = (gross − leak − buf)·uncertainty%/100
net(t)= max(0, gross − leak − buf − unc)
```

**Wetlands multi-gas** (`calcWetlands`) — full 3-gas baseline vs project:
```
bl_total = area·(CO2_rate·1 + CH4_rate·GWP_CH4 + N2O_rate·GWP_N2O)
pj_total = area·(pj_CO2·1 + pj_CH4·GWP_CH4 + pj_N2O·GWP_N2O)
gross = max(0, bl_total − pj_total);   net = (gross − leak)·(1−buffer%)
```
GWP set is selectable: `GWP_AR5={CH4:28,N2O:265}` or `GWP_AR6={CH4:27.2,N2O:273}`.

**Risk-weighted buffer** (`riskPremium`): `Σ RISK_FACTORS[i].scores[level_i] · weight_i` over 5 risk
categories, added to a base buffer of 20% — the Verra AFOLU Non-Permanence Risk Tool logic.

### 7.2 Parameterisation / scoring rubric

| Parameter | Default / value | Provenance |
|---|---|---|
| BDR (baseline deforestation) | 1.2%/yr | UI-set; typical tropical frontier rate |
| CS_forest / CS_post | 350 / 50 tC/ha | UI-set; intact tropical forest vs post-clearing |
| Carbon→CO₂ | 44/12 | Exact molar ratio |
| Leakage act / mkt | 8% / 4% (=12%) | Code comment: VM0007 activity-shift + market split |
| Buffer / uncertainty | 25% / 10% | UI-set; Verra NPR + activity-data uncertainty |
| GWP AR5/AR6 | CH₄ 28/27.2, N₂O 265/273 | IPCC AR5 Table 8.7 / AR6 Table 7.SM.7 |
| Blue-carbon sequestration | Mangrove 8.4, Seagrass 4.2, Salt Marsh 6.5, Peatland 2.8 tCO₂/ha/yr | `BLUE_CARBON` — literature-consistent, uncited |
| Risk weights | Political 0.25, Fire 0.25, Community 0.20, Technical 0.15, Financial 0.15 | `RISK_FACTORS` — Verra NPR risk categories |

The 20 `HUB_PROJECTS` (area, credits, price, registry) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

REDD+ iterates crediting years, drawing down the forest stock by BDR each year (so annual baseline
emissions decline as the at-risk stock shrinks), applying four sequential deductions (leakage →
buffer → uncertainty), and accumulating net credits. Result pushes to `CarbonCreditContext` as
`VM0007`. Wetlands computes a per-year 3-gas baseline-minus-project difference under the chosen GWP
set. The risk tab maps 5 selected risk levels to a buffer premium via the weighted-score table.

### 7.4 Worked example (REDD+, year 1)

Defaults: BDR=1.2%, forest=100,000 ha, CS_forest=350, CS_post=50, leak_act=8%, leak_mkt=4%,
buffer=25%, uncertainty=10%.

| Step | Computation | Result |
|---|---|---|
| Deforested (yr 1) | 100,000·0.012 | 1,200 ha |
| Baseline emissions | 1,200·(350−50)·(44/12) | 1,200·300·3.667 = **1,320,000 tCO₂e** |
| Leakage (12%) | 1,320,000·0.12 | 158,400 |
| Buffer (25% of net-of-leak) | (1,320,000−158,400)·0.25 | 290,400 |
| Uncertainty (10%) | (1,161,600−290,400)·0.10 | 87,120 |
| **Net (yr 1)** | 1,320,000 − 158,400 − 290,400 − 87,120 | **≈ 784,080 tCO₂e** |

That is a 59% delivery ratio (net/gross) — squarely in the range REDD+ buyers expect once leakage,
buffer and uncertainty haircuts are stacked. Year 2 baseline is slightly lower as `remaining` shrank.

### 7.5 Data provenance & limitations
- Hub portfolio rows are **synthetic seeded demo data** (`sr()`); calculator inputs are user-set;
  blue-carbon sequestration rates and risk-scores are hard-coded literature-style values.
- Project-level BDR baseline, **not** a jurisdictional (JNR/ART) reference level — no nested
  accounting, no national forest-cover trend adjustment, no remote-sensing activity data ingestion.
- Constant BDR (no deforestation-front dynamics), flat percentage leakage (no leakage-belt monitoring),
  and buffer/uncertainty as static percentages rather than data-driven.

**Framework alignment:** **Verra VM0007** (REDD+ methodology framework) — the baseline×carbon-stock
difference with leakage/buffer/uncertainty deductions is VM0007's structure. **VM0033** (tidal
wetland restoration) — the multi-gas baseline-minus-project difference under IPCC GWP. **Verra AFOLU
Non-Permanence Risk Tool** — the weighted risk-category buffer. **ART TREES / JNR** are named in the
guide as the jurisdictional analogues but are not implemented; ART TREES derives crediting from a
jurisdiction's historical + adjusted reference level with a crediting-level discount, which this
project-level tool approximates only at the parcel scale.

## 9 · Future Evolution

### 9.1 Evolution A — Jurisdictional reference levels from real deforestation data (analytics ladder: rung 1 → 3)

**What.** §7 notes the one substantive guide↔code nuance: the guide emphasises
jurisdictional JNR/ART TREES reference-level accounting, but `calcREDD` implements a
project-level exponential-decay baseline (correctly labelled VM0007). Evolution A adds
the jurisdictional layer the guide promises, grounded in public activity data: Hansen
Global Forest Change loss rasters (already named in §5 as the leakage-belt monitoring
source) aggregated to jurisdiction polygons to compute the 10-year historical
deforestation rate that defines an ART TREES crediting level, replacing the
user-typed BDR with a data-derived one.

**How.** (1) `ref_jurisdiction_deforestation(jurisdiction, year, forest_ha, loss_ha,
source)` table ingested from Hansen GFC country/subnational summaries (public CSV
tiles). (2) Reference level per TREES v2.0: mean annual emissions over the 10-year
period, with the uncertainty deduction computed from activity-data variance rather
than the flat 10–15% input. (3) The wetlands engine (`calcWetlands`, a real 3-gas
VM0033-style model) gains AR5/AR6 GWP switching — the page already ships both
`GWP_AR5` and `GWP_AR6` constants but §7 shows only one path in use.

**Prerequisites.** Hansen aggregation done offline into the ref table (no raster
processing in-request); jurisdiction boundaries from the platform's existing PostGIS
layer. **Acceptance:** selecting a Brazilian state pulls a cited 10-year loss series
and produces a TREES-style crediting level; the project-level VM0007 path still
produces identical numbers to today (regression-pinned).

### 9.2 Evolution B — Nature-based methodology copilot (LLM tier 1 → 2)

**What.** A copilot spanning the hub's three real engines: "walk me through the
deduction stack from gross to net" (leakage → buffer → uncertainty, §7 order), "why
does the mangrove case add a CH₄ penalty?" (VM0033 multi-gas logic), "what does the
risk-weighted buffer tool imply for a fire-prone project?" (the 6-factor
`RISK_FACTORS` rubric). Tier-2 what-ifs re-invoke `calcREDD`/`calcWetlands` client-side
with LLM-proposed parameters — no backend routes exist.

**How.** Tier 1: atlas §5/§7 as corpus, live inputs/results as context; the copilot
must distinguish project-level vs jurisdictional accounting explicitly, since §7 shows
that distinction is the guide's known nuance. Tier 2: tool schemas over the two
calculators plus the buffer-rating rubric; validator ties every tCO₂e to an invocation.

**Prerequisites.** None hard — the engines are real; Evolution A upgrades what-if
realism for jurisdictional questions. **Acceptance:** deduction-stack narration
reconciles to on-screen figures line by line; asked for a jurisdictional RL before
Evolution A, the copilot states the module computes project-level baselines only.