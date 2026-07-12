# Circular Economy Tracker
**Module ID:** `circular-economy-tracker` · **Route:** `/circular-economy-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Circularity performance measurement and reporting platform aligned with Ellen MacArthur Foundation Material Circularity Indicator (MCI). Tracks material flows, recycled content, waste diversion, and product lifetime extension across 5 supply chain tiers.

> **Business value:** MCI = 1 – LFI. LFI = (V + W) / (2F + 0.09). Fully circular products achieve MCI close to 1.0; industry average typically 0.2–0.4. EU Taxonomy encourages MCI targets above 0.6.

**How an analyst works this module:**
- Input material flows across 5 supply chain tiers
- MCI Calculator tab computes Linear Flow Index and MCI score
- Waste Flows tab tracks diversion by treatment type
- Product Lifetime tab adjusts utility factor for extended use
- Benchmark tab compares MCI against sector peers

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMPANIES`, `KPI`, `MATERIALS`, `PAGE_SIZE`, `PIECLRS`, `RATINGS`, `SECTORS`, `TABS`, `TREND`, `WASTE_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MATERIALS` | 10 | `name`, `recycled`, `virgin`, `flow` |
| `WASTE_TYPES` | 5 | `type`, `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `MATERIALS` | `[{name:'Plastics',recycled:32,virgin:68,flow:4200},{name:'Paper/Card',recycled:65,virgin:35,flow:3800},{name:'Glass',recycled:42,virgin:58,flow:1200},{name:'Metals',recycled:58,virgin:42,flow:2600},{name:'Textiles',recyc` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,circularity:Math.round(22+i*0.8+sr(i*7)*8),wasteDiv:Math.round(35+i*0.6+sr(i*11)*10),recycled:Math.round(18+i*0.7+sr(i*` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sector!=='All')d=d.filter(r=>r.sector===sector);if(ratingF!=='All')d=d.filter(r=>r.rating===ratingF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sector,ratingF,so` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return{avgCirc:avg('circularityScore'),avgDiv:avg('wasteDiv'),avgRecInput:avg('recycledInput'),leaders:COMPANIES.filter(c=>c.rati` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgCirc:0,avgDiv:0,n:0};m[c.sector].avgCirc+=c.circularityScore;m[c.sector].avgDiv+=c.wasteDiv;m[c.sector].n++;});return Object.v` |
| `ratingDist` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.rating]=(m[c.rating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const dims=['circularityScore','wasteDiv','recycledInput','recyclability','materialEfficiency','designCircularity'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return dims.m` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/circular-economy/esrs-e5` | `esrs_e5` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/mci` | `mci` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/wbcsd-cti` | `wbcsd_cti` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/epr-compliance` | `epr_compliance` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/crm-risk` | `crm_risk` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/lca` | `lca` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/material-flows` | `material_flows` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/overall-circularity` | `overall_circularity` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/crm-list` | `ref_crm_list` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/epr-rates` | `ref_epr_rates` | api/v1/routes/circular_economy.py |

### 2.3 Engine `circular_economy_engine` (services/circular_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CircularEconomyEngine.assess_esrs_e5` | entity_id, resource_inflows_t, recycled_inflows_pct, resource_outflows_t, waste_t, crm_identified, circular_targets_set, transition_plan | CSRD ESRS E5 — Resource use and circular economy disclosure scoring. The three qualitative disclosure components (CRM identification, circular targets, transition plan) are entity-reported facts. Supply them explicitly via ``crm_identified`` / ``circular_targets_set`` / ``transition_plan`` to include them in the disclosure-completeness score. When left as None they are recorded as unreported (``No |
| `CircularEconomyEngine.calculate_mci` | entity_id, recycled_input_fraction, waste_recovery_fraction, product_lifetime_multiplier, sector | Ellen MacArthur Foundation Material Circularity Indicator (0-1). Linear economy = 0; fully circular = 1. The MCI score itself is always a real computation from the caller's inputs. The peer benchmark requires a ``sector`` (EMF sector key); when supplied the benchmark/gap are looked up from ``MCI_BENCHMARKS``, otherwise they are returned as None (no random sector is assigned). |
| `CircularEconomyEngine.assess_wbcsd_cti` | entity_id, entity_name, sector, circular_product_design, waste_recovery, recycled_content, product_lifetime | WBCSD Circular Transition Indicators v4.0 — 4 dimensions, A-D tier. The four dimension scores (0-100) are entity-reported/assessed inputs. Supply them explicitly to compute the CTI composite via the WBCSD weighting (0.30/0.25/0.25/0.20). If a dimension is not provided its weight is dropped and the remaining weights are renormalised. If no dimensions are provided the composite/tier are returned as  |
| `CircularEconomyEngine.calculate_epr_compliance` | entity_id, packaging_tonnes, ewaste_tonnes, battery_tonnes, country, compliance_gaps | EU EPR cost calculation for packaging (DIR 94/62/EC), e-waste (WEEE DIR), and batteries (Regulation (EU) 2023/1542). Costs are a real computation: tonnes x published PRO reference rate (``EPR_COSTS``) for the country. Compliance-gap flags are caller-reported findings; pass ``compliance_gaps`` as {category: description} to record them. When not supplied, gaps are reported as unknown (empty) with a  |
| `CircularEconomyEngine.assess_crm_risk` | entity_id, materials_used, material_data | EU CRM Act 2023 dependency assessment for critical raw materials. Includes supply concentration, recycled content, and 2030 target gaps. Which inputs map to which materials are found is a real screen against ``EU_CRM_LIST`` / ``EU_STRATEGIC_RM``. Per-material quantitative metrics (supply-risk score, recycled-content %, HHI concentration, main supplier) are entity/market data; supply them via ``mat |
| `CircularEconomyEngine.perform_lca` | entity_id, product_name, annual_production, sector, circularity_benefit_pct | ISO 14044 Life Cycle Assessment: cradle-to-gate vs cradle-to-cradle. Circularity benefit quantifies CO2 savings from circular design. The cradle-to-gate intensity is a real reference factor (``LCA_GATE_FACTORS``) for the sector. The circularity benefit (% reduction achievable cradle-to-cradle) is a product-specific outcome: supply it via ``circularity_benefit_pct`` to compute cradle-to-cradle inte |
| `CircularEconomyEngine.analyse_material_flows` | entity_id, materials | Material flow analysis: for each material compute recycled content % and recovery rate. Flag CRM exposure. Recycled-input % and the portfolio aggregates are real computations from the supplied tonnages. ``recovery_rate_pct`` and ``risk_score`` are entity/market metrics read from each material dict when present (keys ``recovery_rate_pct`` / ``risk_score``); when absent they are returned as None rat |
| `CircularEconomyEngine.compute_overall_circularity` | entity_id, esrs_score, mci_score, cti_score, lca_benefit_pct, cost_per_score_point_usd | Aggregated circularity score combining ESRS E5, MCI, CTI, and LCA benefit. The overall score, gaps and priority actions are real deterministic computations. The investment needed to close the gap to the Low-risk threshold requires an entity-specific unit cost: supply ``cost_per_score_point_usd`` (USD per point of score improvement) and it is multiplied by the remaining gap. When not supplied the i |

**Engine `circular_economy_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EU_CRM_2030_TARGETS` | `{'extraction_pct': 10.0, 'processing_pct': 40.0, 'recycling_pct': 25.0, 'single_country_max_pct': 65.0}` |
| `ESRS_E5_GRADES` | `{(80, 100): 'A', (65, 80): 'B', (50, 65): 'C', (0, 50): 'D'}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `MATERIALS`, `PIECLRS`, `RATINGS`, `SECTORS`, `TABS`, `WASTE_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Material Circularity Indicator | `1 – LFI` | EMF MCI model | Circularity score; 1.0 = fully circular, 0.0 = fully linear |
| Virgin Material Input % | `V / TotalInput` | Supply chain data | Fraction of material inputs sourced as virgin (non-recycled) |
| Recycled Content % | `Recycled / TotalInput` | Material passports | Share of recycled or recovered material in product inputs |
| Waste Diversion Rate | `1 – (Landfill / TotalWaste)` | Waste management records | Fraction of production waste diverted from landfill via reuse, recycling, or composting |
- **Bill of materials** → Virgin vs recycled inputs → V calculation → **Material input composition**
- **Waste management records** → Disposal routes → W calculation → **Unrecoverable waste fraction**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/circular-economy/ref/crm-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_crm_count', 'critical_raw_materials', 'strategic_raw_materials', 'eu_2030_targets', 'regulation', 'review_cycle', 'strategic_stockpiling'], 'n_keys': 7}`

**GET /api/v1/circular-economy/ref/epr-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rates', 'categories', 'currency', 'unit', 'directives', 'note'], 'n_keys': 6}`

**POST /api/v1/circular-economy/crm-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/epr-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/esrs-e5** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/lca** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/material-flows** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/mci** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Ellen MacArthur Foundation Material Circularity Indicator
**Headline formula:** `MCI = 1 – LFI; LFI = (V + W) / (2F + 0.09); F = M – V – W`

Linear Flow Index (LFI) measures fraction of material following a linear path (extraction→disposal). V = virgin material input; W = unrecoverable waste; F = total material flow minus virgin input minus waste. MCI = 1 – LFI on a 0–1 scale (1 = fully circular, 0 = fully linear). Utility adjustment factor accounts for product use phase extension (lifetime multiplier).

**Standards:** ['EMF Material Circularity Indicator v1.3', 'ISO 14044 LCA', 'EU Circular Economy Action Plan', 'GRI 306 Waste']
**Reference documents:** Ellen MacArthur Foundation MCI Technical Specification v1.3; ISO 14044:2006 Life Cycle Assessment; EU Circular Economy Action Plan 2020; GRI 306 Waste Disclosures 2020

**Engine `circular_economy_engine` — extracted transformation lines:**
```python
utility_factor = round(1.0 / plm, 4)
raw_mci = (rif + wrf) / 2.0 * utility_factor
gap = round(benchmark - mci_score, 4)
sector_benchmark = round(MCI_BENCHMARKS[sector_l] * 100.0, 1)
pkg_cost = round(packaging_tonnes * pkg_rate, 0) if packaging_tonnes > 0 else 0.0
ew_cost = round(ewaste_tonnes * ew_rate, 0) if ewaste_tonnes > 0 else 0.0
bat_cost = round(battery_tonnes * bat_rate, 0) if battery_tonnes > 0 else 0.0
total_cost = round(pkg_cost + ew_cost + bat_cost, 0)
c2c = round(c2g * (1 - benefit_pct / 100.0), 2)
annual_co2_saving = round((c2g - c2c) * annual_production / 1000.0, 2)  # tCO2
total = primary + recycled + bio_based
rec_pct = round(recycled / total * 100.0 if total > 0 else 0.0, 2)
portfolio_recycled_pct = round(total_recycled / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
crm_exposure_pct = round(crm_inflow / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
gap = round(max(0.0, 70.0 - overall_score), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `circular_economy_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `circular-economy-finance` | engine:circular_economy_engine |
| `circular-economy-investment` | engine:circular_economy_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims the page implements the Ellen
> MacArthur Foundation **Material Circularity Indicator** — `MCI = 1 − LFI; LFI = (V + W)/(2F +
> 0.09); F = M − V − W` — with an "MCI Calculator tab", "Product Lifetime utility adjustment" and
> "5 supply chain tiers". **None of this exists in the code.** The actual tabs are Dashboard ·
> Company Screening · Material Flow · Waste Analytics; there is no MCI, LFI, utility factor, or
> supply-chain-tier logic anywhere in `CircularEconomyTrackerPage.jsx`. Every company score is a
> seeded-PRNG draw. Note the domain's backend (`circular_economy_engine.calculate_mci`) *does*
> implement a real (simplified) MCI, reachable at `POST /api/v1/circular-economy/mci` — but this
> page never calls it. The guide's LFI formula is also non-standard (EMF's published denominator
> is `2M + (W_F − W_C)/2`, not `2F + 0.09`). Sections below document the code as-is.

### 7.1 What the module computes

A 60-company circularity screener (real corporate names — Unilever, IKEA, Interface, Philips,
Apple, Veolia… — mapped to 10 sectors) with 18 synthetic metrics per company, all of the form
`lo + sr(i·k)·range` on the platform PRNG `sr(s)=frac(sin(s+1)·10⁴)`:

| Field | Formula | Range |
|---|---|---|
| `circularityScore` | `round(10 + sr(i·7)·80)` | 10–90 % |
| `wasteDiv` | `round(15 + sr(i·11)·80)` | 15–95 % |
| `recycledInput` | `round(5 + sr(i·13)·70)` | 5–75 % |
| `recyclability` | `round(20 + sr(i·17)·75)` | 20–95 % |
| `landfillPct` | `round(5 + sr(i·29)·50)` | 5–55 % |
| `eprCompliance` | `round(40 + sr(i·43)·55)` | 40–95 % |
| `totalWaste` / `diverted` | `100 + sr(i·61)·9900` / `50 + sr(i·67)·5000` | t |

Rating is a quantile rubric on the **same seed** as `circularityScore`
(`sr(i·7)`): `<0.15 Leader, <0.35 Advanced, <0.55 Progressing, <0.8 Developing, else Lagging` —
so rating and score are perfectly rank-correlated by construction (Leader ⇔ score < 22, since
low `sr(i·7)` gives a *low* score: the rating scale is **inverted** relative to the score —
"Leaders" are the *lowest*-scoring companies. A latent bug worth noting for refinement).

### 7.2 Static reference blocks

- **`MATERIALS`** (10 rows): recycled-vs-virgin split and flow (kt) per material — e.g.
  Plastics 32/68 (4,200 kt), Paper/Card 65/35, Textiles 12/88, Chemicals 8/92, Metals 58/42.
  Broadly consistent with published EU recycling rates but uncited; synthetic demo values.
- **`TREND`** (24 months, 2023-01…2024-12): drifting series with PRNG noise, e.g.
  `circularity = round(22 + i·0.8 + sr(i·7)·8)` — a deliberate upward drift (+0.8pp/month) with
  ±8pp noise; `landfill = 45 − i·0.5 + sr(i·17)·8` drifts down.
- **`WASTE_TYPES`**: Recycled 38 / Composted 12 / Energy Recovery 15 / Landfill 28 /
  Incinerated 7 (%; sums to 100).

### 7.3 Calculation walkthrough

1. **Dashboard KPIs** — full-universe means: `avg(k) = round(Σ COMPANIES[k]/60)` for
   circularity, diversion, recycled input, landfill; `leaders` counts rating ∈ {Leader, Advanced}.
2. **Sector chart** — group-by-sector means of circularity and diversion (accumulator map,
   divided by group count `n`).
3. **Radar** — universe means across 6 dimensions (circularityScore, wasteDiv, recycledInput,
   recyclability, materialEfficiency, designCircularity), fullMark 100.
4. **Screening table** — search/sector/rating filters, single-column sort on a **copied** array
   (`[...COMPANIES]`, no in-place mutation), 15-row pagination, expandable row with an 11-metric
   detail panel, per-company radar, and a waste-destination bar. CSV export via Blob download.
5. Colour badges use threshold triples, e.g. circularity `[25, 50, 70]` → red/amber/gold/green.

### 7.4 Worked example — company i = 0 (Unilever plc)

All seeds are `sr(0) ≈ 0.7098` where the multiplier is 0: `circularityScore = round(10 +
sr(0)·80) = round(10 + 56.8)` = **67%** (gold badge: 50 ≤ 67 < 70); rating uses the same draw
`sr(0)=0.7098` → falls in `[0.55, 0.8)` → **Developing** — despite the 67% score sitting in the
upper half, illustrating the inversion noted in §7.1. Dashboard KPI contribution: 67 enters the
60-company mean. If Unilever were the only "Consumer Goods" row, the sector bar would read 67.

### 7.5 Data provenance & limitations

- **All 60 company scorecards are synthetic** (`sr()` seeded) yet labelled with real corporate
  names; none reflect the companies' actual CDP/ESRS waste disclosures.
- The rating rubric contradicts the score (inverted mapping), and rating shares are fixed by
  the PRNG quantiles (~15% Leader, 20% Advanced, 20% Progressing, 25% Developing, 20% Lagging).
- `MATERIALS`, `WASTE_TYPES` are static snapshots; `TREND` is drift + noise, not history.
- No MCI/LFI despite the guide; no API call to the backend MCI endpoint; no supply-chain tiers.

### 7.6 Framework alignment

- **EMF MCI v1.3** — the guide's referenced framework. Actual EMF MCI:
  `MCI = max(0, 1 − LFI·F(X))` with `LFI = (V + W)/(2M + (W_F − W_C)/2)`, utility
  `F(X) = 0.9/X`, `X = (L/L_av)·(U/U_av)` — virgin feedstock V, unrecoverable waste W, mass M,
  lifetime/intensity ratios. Implemented (simplified) only in the backend engine.
- **GRI 306 (Waste 2020)** — the Waste Analytics tab's destination split (recycle/compost/
  recovery/landfill/incineration) matches GRI 306-4/306-5 categories conceptually.
- **EU CEAP 2020** — the 25% recycled-content ambition appears in the backend material-flow
  compliance check (`recycling_target_25pct`), not on this page.
- **ISO 14044** — cited in guide; LCA exists only backend-side (`perform_lca`).

## 8 · Model Specification — Entity MCI & Waste-Flow Measurement Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace synthetic company scorecards with measured circularity: product/entity MCI, waste
diversion, and recycled-content KPIs for the 60-name consumer/industrial universe, supporting
ESRS E5 benchmarking and engagement screening.

### 8.2 Conceptual approach

Adopt the **EMF MCI (Granta Design methodology v1.3)** at product level, aggregated to entity
level by mass or revenue weights, cross-checked against **WBCSD CTI v4.0 %-circular-inflow/
outflow** — the two dominant industry measurement frameworks. Waste destination series follow
**GRI 306** categories sourced from corporate filings, mirroring how S&P Trucost and CDP build
waste datasets.

### 8.3 Mathematical specification

```
V_p  = M_p·(1 − F_R − F_U − F_B)                 // virgin feedstock (mass M, recycled F_R,
W_0p = M_p·(1 − C_R − C_U − C_C − C_E)           //    reused F_U, biological F_B fractions)
W_Fp = M_p·(1 − E_F)·F_R ;  W_Cp = M_p·C_R·(1 − E_C)
LFI_p = (V_p + W_0p + (W_Fp + W_Cp)/2) / (2M_p + (W_Fp − W_Cp)/2)
X_p  = (L_p/L_av)·(U_p/U_av) ;  MCI_p = max(0, 1 − LFI_p·0.9/X_p)
MCI_entity = Σ_p w_p·MCI_p ,  w_p = mass or revenue share
Diversion = 1 − Landfill_t/TotalWaste_t          // GRI 306-5
```

| Parameter | Calibration source |
|---|---|
| Recycling process efficiencies `E_F, E_C` | EMF MCI methodology defaults (0.6–0.9 by material); Eurostat recycling-efficiency stats |
| Industry-average lifetime `L_av`, intensity `U_av` | EMF sector tables; Eurostat product-lifetime studies |
| Company fractions `F_R, C_R…` | CSRD ESRS E5-4/E5-5 datapoints; CDP water/waste modules; sustainability reports |
| Material recycled-content baselines | Eurostat `env_wasrt`, EPA Facts & Figures (free) — replaces static `MATERIALS` |
| Sector benchmarks | Circle Economy Circularity Gap Report; backend `MCI_BENCHMARKS` retained as fallback |

### 8.4 Data requirements

Entity: material inflow mass by feedstock type, waste by destination, product lifetimes —
extractable from ESRS E5 XBRL filings (2025+ wave) and CDP responses; vendor alternative: S&P
Trucost, Bloomberg ESG fields. Platform reuse: `calculate_mci` and `analyse_material_flows`
already accept exactly these inputs; only the ingestion + page wiring layer is missing.

### 8.5 Validation & benchmarking plan

Reconcile entity MCI against companies' self-published MCI/Circulytics scores (Interface,
Philips publish these; tolerance ±0.1); cross-validate diversion rates against GRI 306 tables in
annual reports for a 10-company sample; stability test: MCI must be monotone in F_R and C_R;
benchmark distribution against Circularity Gap Report's 7.2% global baseline.

### 8.6 Limitations & model risk

Corporate waste disclosure is inconsistent (boundary and unit differences); mass-based
aggregation is disclosure-limited, forcing revenue weights that distort material-heavy
segments; MCI ignores toxicity and downcycling quality. Fallbacks: PCAF-style data-quality
score (1–5) per entity, sector-median imputation flagged as estimated, and suppression of the
rating badge when >50% of inputs are imputed.

## 9 · Future Evolution

### 9.1 Evolution A — True EMF MCI v1.3 in the engine, wired to the page (analytics ladder: rung 1 → 3)

**What.** §7 exposes a three-layer problem: (1) the page's advertised MCI Calculator,
utility factor, and 5-tier flow logic don't exist — the actual tabs are a 60-company
screener whose 18 metrics per company are all `sr()` draws over real corporate names
(Unilever, IKEA, Apple…), which is the worst provenance shape on the platform: fabricated
numbers attached to real entities; (2) the backend's `calculate_mci` is real but
simplified (`raw_mci = (rif+wrf)/2 × utility_factor`); (3) the guide's own LFI formula
is non-standard — EMF's published denominator is `2M + (W_F−W_C)/2`, not `2F + 0.09`.
Evolution A fixes all three: implement the actual EMF MCI v1.3 specification in
`circular_economy_engine.py` (virgin feedstock V, unrecoverable waste W with the
recycling-process waste split, utility X = (L/L_av)·(U/U_av)), correct the guide, and
rebuild the page as a client of `POST /api/v1/circular-economy/mci`.

**How.** (1) Engine upgrade with the published worked examples from the EMF technical
specification as bench pins. (2) Sector benchmarks (`MCI_BENCHMARKS`) sourced and
cited rather than asserted. (3) The named-company screener deleted or rebuilt on
disclosed data (GRI 306 waste disclosures, recycled-content reporting) — real names
demand real numbers or removal.

**Prerequisites (hard).** The fabricated-metrics-on-real-companies pattern must go
first; formula correction coordinated with the guide rewrite so §7's flag clears.
**Acceptance:** EMF spec worked examples reproduce within rounding; the page's MCI
values match engine responses; no `sr()` call remains in the file.

### 9.2 Evolution B — Circularity measurement copilot (LLM tier 2)

**What.** An assistant for MCI methodology and measurement: "why did my MCI fall when
lifetime dropped?" (utility factor mechanics), "compute MCI for 30% recycled input,
80% collection, 1.5x lifetime" (tool call to `/mci`), "how do our material flows roll
up?" (`/material-flows`), "what does GRI 306 require for the waste tab?" (standards
corpus). The engine's eight POST routes make this tier-2-capable today at the API
level, even while the page rewiring lands.

**How.** Tool schemas filtered to this module's routes via the atlas endpoint map;
every MCI/LFI/flow figure validated against tool outputs; methodology explanations
grounded in the corrected §5 formula text — which is precisely why the formula fix is
sequenced first, since RAG over the current non-standard LFI would teach users wrong
math with a confident tone.

**Prerequisites (hard).** Evolution A's formula correction and guide rewrite before
corpus embedding; company-level questions blocked until the screener is rebuilt on
disclosed data. **Acceptance:** a step-change fixture (lifetime 1.0 → 1.5) produces
the utility-factor delta the EMF spec predicts, narrated with matching numbers; asked
for IKEA's circularity score, the copilot refuses pending real disclosure data.