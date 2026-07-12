# Transport Decarbonisation
**Module ID:** `transport-decarbonisation` · **Route:** `/transport-decarbonisation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Road, rail, aviation and shipping GHG reduction analytics platform modelling decarbonisation pathways, technology transition costs and policy compliance for transport operators and investors.

> **Business value:** Transport accounts for 21% of global CO2 emissions; road transport electrification is cost-competitive in most markets; maritime and aviation represent the hardest decarbonisation challenges requiring green fuels.

**How an analyst works this module:**
- Inventory transport assets by mode and fuel type
- Apply sector-specific decarbonisation pathways (electrification, hydrogen, SAF)
- Compute marginal abatement costs by technology option
- Model fleet transition capex and operating cost trajectories
- Report against IMO GHG Strategy, CORSIA and national zero-emission vehicle mandates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `COUNTRY_CODES`, `COUNTRY_EMISSION_MIX`, `COUNTRY_PROFILES`, `DESTS`, `FINANCE`, `GLEC_CRITERIA`, `INSTRUMENTS`, `ISSUERS`, `LEVERS`, `MODES`, `MODE_COLORS`, `MODE_EMISSIONS_STACK`, `MODE_ICONS`, `MODE_INTENSITY`, `ORIGINS`, `PREFIXES`, `QUARTERLY_MODE_INTENSITY`, `REGULATIONS`, `ROUTES`, `SUFFIXES`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LEVERS` | 9 | `id`, `name`, `desc`, `modes`, `adoption`, `potential2030`, `investment`, `cost`, `reduction`, `maturity`, `scalability`, `timeframe`, `infrastructure`, `color` |
| `REGULATIONS` | 9 | `name`, `status`, `deadline`, `impact`, `desc`, `sector`, `region` |
| `GLEC_CRITERIA` | 8 | `criterion`, `desc`, `weight`, `portfolioScore` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `v=>`${v>=0?'+':''}${v.toFixed(1)}%`;` |
| `MODES` | `['Road Freight','Rail','Maritime','Aviation','Last-Mile','Multimodal'];` |
| `MODE_INTENSITY` | `[62,22,8,602,180,35]; // gCO2e/tkm baseline` |
| `COUNTRY_PROFILES` | `COUNTRIES.map((c,i)=>({` |
| `intensity` | `parseFloat((baseInt*(0.6+sr(i*13)*0.8)).toFixed(1));` |
| `fleet` | `Math.round(50+sr(i*7)*2000);` |
| `annualEmissions` | `Math.round(fleet*intensity*0.4+sr(i*11)*50000);` |
| `decarb2030` | `parseFloat((15+sr(i*19)*45).toFixed(1));` |
| `scope1` | `parseFloat((30+sr(i*23)*30).toFixed(1));` |
| `scope2` | `parseFloat((10+sr(i*29)*20).toFixed(1));` |
| `scope3` | `parseFloat((100-scope1-scope2).toFixed(1));` |
| `revenue` | `Math.round(50+sr(i*31)*2000);` |
| `avgAge` | `parseFloat((3+sr(i*37)*12).toFixed(1));` |
| `utilisation` | `parseFloat((55+sr(i*41)*35).toFixed(0));` |
| `YEARS` | `Array.from({length:16},(_,i)=>2020+i);` |
| `base` | `100+sr(mi*83)*200;` |
| `trend` | `m==='Aviation'?1.02:m==='Road Freight'?0.97:m==='Rail'?0.95:m==='Maritime'?0.98:m==='Last-Mile'?1.01:0.96;` |
| `obj` | `{quarter:`Q${(q%4)+1} ${2022+Math.floor(q/4)}`};` |
| `dist` | `Math.round(500+sr(i*101)*14000);` |
| `cModeIdx` | `Math.floor(sr(i*103)*4);` |
| `oModeIdx` | `Math.floor(sr(i*107)*4);` |
| `vol` | `Math.round(1000+sr(i*109)*50000);` |
| `INSTRUMENTS` | `['Green Bond','Sustainability-Linked Loan','Green Loan','Transition Bond','Climate Bond'];` |
| `COUNTRY_EMISSION_MIX` | `COUNTRIES.map((c,i)=>({` |
| `TABS` | `['Cross-Modal Emissions','Modal Shift Analyzer','Decarbonisation Levers','Logistics Finance'];` |
| `badge` | `(color)=>({display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:color+'18',color,fontFamily:T.font});` |
| `pagedCompanies` | `filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `handleSort` | `useCallback(col=>{if(sortCol===col)setSortDir(d=>d*-1);else{setSortCol(col);setSortDir(-1);}},[sortCol]);` |
| `modeSummary` | `useMemo(()=>MODES.map((m,mi)=>{` |
| `totalEm` | `cos.reduce((s,c)=>s+c.annualEmissions,0);` |
| `avgInt` | `cos.length?cos.reduce((s,c)=>s+c.intensity,0)/cos.length:0;` |
| `totalFleet` | `cos.reduce((s,c)=>s+c.fleet,0);` |
| `portfolioTotals` | `useMemo(()=>{ const total=COMPANIES.reduce((s,c)=>s+c.annualEmissions,0);` |
| `shiftResult` | `useMemo(()=>{ const base=ROUTES.reduce((s,r)=>s+r.currentEmissions,0);` |
| `shifted` | `ROUTES.reduce((s,r)=>{` |
| `costBase` | `ROUTES.reduce((s,r)=>s+r.currentCost,0);` |
| `costShifted` | `ROUTES.reduce((s,r)=>s+r.optimalCost,0);` |
| `waterfall` | `useMemo(()=>roadmapLevers.map(l=>{` |
| `costNum` | `parseFloat(lever.investment.replace('$','').replace('T',''))*100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `COUNTRY_CODES`, `DESTS`, `GLEC_CRITERIA`, `INSTRUMENTS`, `ISSUERS`, `LEVERS`, `MODES`, `MODE_COLORS`, `MODE_ICONS`, `MODE_INTENSITY`, `ORIGINS`, `PREFIXES`, `REGULATIONS`, `SUFFIXES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fleet Average Emissions Intensity | — | Fleet Registry | Fleet-weighted average carbon intensity across all transport modes; benchmark vs regulatory targets. |
| EV Fleet Share | — | Fleet Registry | Proportion of road fleet electrified; target 100% for new sales by 2030–2035 under UK ZEV mandate. |
| SAF Blend Rate | — | Fuel Uplift | Sustainable aviation fuel proportion in aviation fuel uplift; EU ReFuelEU target 2% by 2025. |
- **Fleet Registry, Fuel Consumption Data, Technology Cost Curves** → MAC engine + pathway optimiser + regulatory compliance tracker → **Decarbonisation roadmaps, capex plans, CORSIA/IMO compliance reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Transport Abatement Cost
**Headline formula:** `MAC = ΔCost / ΔEmissions (tCO2e)`

Marginal abatement cost in £/tCO2e for each transport mode and technology; primary input for decarbonisation pathway optimisation.

**Standards:** ['ITF Transport Outlook 2023', 'ICAO CORSIA', 'IMO GHG Strategy']
**Reference documents:** ITF Transport Outlook 2023; IMO Initial GHG Strategy 2018 / Enhanced Strategy 2023; ICAO CORSIA Methodology; UK ZEV Mandate 2024; EU FuelEU Maritime Regulation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

100 synthetic transport/logistics companies across 6 modes (Road Freight, Rail, Maritime, Aviation,
Last-Mile, Multimodal) and 20 countries, generated once via the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`. The module's one genuinely computed cross-cutting metric is a
GLEC-Framework compliance composite:

```
Portfolio GLEC Score = Σ (criterion.portfolioScore × criterion.weight) / 100     // weights sum to 100
```

Everything else (per-company emissions, fleet composition, modal-shift savings, mitigation-lever
waterfall) is either a direct PRNG draw or a simple aggregation over the 100-company synthetic
population.

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `MODE_INTENSITY` (gCO2e/tkm) | Road Freight 62, Rail 22, Maritime 8, Aviation 602, Last-Mile 180, Multimodal 35 | **Genuinely well-calibrated real-world figures** — closely matches published freight carbon-intensity benchmarks (rail and maritime lowest per tonne-km, air cargo roughly an order of magnitude higher than road, consistent with ICCT/GLEC reference data) |
| `GLEC_CRITERIA` | 7 real GLEC Framework criteria (Scope Definition WTW, GLEC-approved Emission Factors, Distance Calculation, Allocation Method, Hub Operations, Data Quality, Verification), weights 20/20/15/15/10/10/10 (sum=100), each with a hardcoded `portfolioScore` | Genuine GLEC (Global Logistics Emissions Council) Framework criteria; weights and portfolio scores are platform-authored, not derived from the 100-company population |
| Per-company `intensity` | `MODE_INTENSITY[mode] × (0.6+sr()×0.8)` | 60–140% of the mode baseline — synthetic dispersion around a real anchor value |
| Per-company `glecScore` | `40+sr(i×43)×55` | 40–95%, synthetic, **not** derived from the `GLEC_CRITERIA` weighted-score formula |
| `EMISSION_FACTORS` (imported) | Platform reference-data table | **Imported but never referenced anywhere in the file** — a dead import |
| `LEVERS` (9 decarbonisation levers) | id, name, applicable modes, adoption %, 2030 potential, investment, cost, reduction, maturity, scalability, timeframe | Hand-curated, e.g. likely covers electrification, biofuels, hydrogen, route optimisation — real decarbonisation-lever taxonomy for freight/logistics |
| `REGULATIONS` (9 rows) | Name, status, deadline, impact, sector, region | Real regulatory references (IMO GHG Strategy, EU FuelEU Maritime, CORSIA, UK ZEV mandate per the guide) |

### 7.3 Calculation walkthrough

1. **GLEC composite** (the one genuine weighted formula): `Σ portfolioScore×weight/100` over the 7
   criteria — correctly implemented, weights properly sum to 100 so no renormalisation is needed.
2. **Company generation**: mode assigned round-robin (`i%6`), country round-robin (`i%20`),
   intensity/fleet/emissions/decarb-trajectory/Scope 1-2-3 split all independent PRNG draws (Scope 3
   is a residual: `100 − scope1 − scope2`, guaranteeing the three always sum to 100%).
3. **Cross-modal emissions tab**: `modeSummary` aggregates total emissions, average intensity, and
   total fleet per mode across the 100 companies; `portfolioTotals` sums across all modes.
4. **Modal Shift Analyzer**: compares baseline route emissions/cost (`ROUTES.currentEmissions`/
   `currentCost`) against an "optimal" reassignment (`ROUTES.optimalCost`), computing aggregate
   savings — a genuine before/after comparison, though the underlying `ROUTES` dataset itself is
   presumably hand-authored or synthetic (not confirmed in this review's read window).
5. **Decarbonisation Levers waterfall**: converts each lever's `investment` string (e.g. "$1.2T") to
   a numeric via string parsing (`parseFloat(...replace('$','').replace('T',''))×100`), then chains
   levers into a waterfall showing cumulative reduction potential.
6. **Logistics Finance tab**: 5 green-finance instrument types (Green Bond, SLL, Green Loan,
   Transition Bond, Climate Bond) as reference categories for financing the transition levers.

### 7.4 Worked example (GLEC portfolio composite)

| Criterion | Weight | Portfolio score | Weight × score |
|---|---|---|---|
| Scope Definition | 20 | 78 | 1,560 |
| Emission Factors | 20 | 82 | 1,640 |
| Distance Calculation | 15 | 91 | 1,365 |
| Allocation Method | 15 | 74 | 1,110 |
| Hub Operations | 10 | 65 | 650 |
| Data Quality | 10 | 58 | 580 |
| Verification | 10 | 45 | 450 |
| **Total / 100** | | | **73.55% → 73.6% Portfolio GLEC Score** |

Note that "Verification" (third-party assurance) carries the lowest portfolio score (45%) despite
only a 10% weight — a realistic reflection of the real-world GLEC/logistics industry challenge that
third-party assurance of freight-emissions calculations lags other GLEC criteria in adoption.

### 7.5 Companion analytics

- **Country transport profiles** — 20 countries with synthetic mode-share and electrification %
  splits, policy classified as Progressive/Moderate.
- **Quarterly intensity trend** per company — 12-quarter series showing a mild autonomous
  improvement (`intensity×(1−q×0.015+noise)`), i.e. ~1.5%/quarter intensity decline baked in by
  construction, not derived from any actual reported trajectory.
- **Fleet composition** (diesel/LNG/electric/hydrogen %) per company — 4 independent PRNG draws, not
  constrained to sum to 100% (unlike the Scope 1/2/3 split, which is a residual by construction).

### 7.6 Data provenance & limitations

- **The GLEC composite is the only genuinely aggregated cross-portfolio metric**, and it is well
  implemented (correct weighted-average arithmetic over weights that sum to 100).
- **100% synthetic company-level data** — all 100 companies, their fleet/emissions/intensity/GLEC
  score/engagement fields are `sr()`-seeded, no real freight-carrier disclosures are ingested.
- **`EMISSION_FACTORS` reference table is imported but unused** — the platform's real emission-
  factor reference data exists but this module does not draw on it for any calculation, despite
  intensity figures being exactly the kind of value that table would be expected to inform.
- **Fleet composition percentages are not constrained to sum to 100%**, unlike Scope 1/2/3 — a
  company could show `diesel:75, lng:15, electric:20, hydrogen:8` (128% total), which would be
  physically inconsistent for a real fleet mix; a production version should renormalise or use a
  Dirichlet-style allocation.

### 7.7 Framework alignment

- **GLEC Framework** (Global Logistics Emissions Council, part of Smart Freight Centre): the 7
  criteria (Scope Definition WTW, Emission Factors, Distance Calculation, Allocation Method, Hub
  Operations, Data Quality, Verification) and their relative weighting are a faithful representation
  of the real GLEC methodology's structure for logistics-emissions calculation quality assessment.
- **IMO GHG Strategy (2023 Enhanced Strategy)** and **ICAO CORSIA**: cited as governing standards
  for maritime and aviation decarbonisation targets respectively; correctly contextualised as the
  hardest-to-abate modes given their intensity figures (Maritime 8 gCO2e/tkm is low per-tonne-km but
  reflects bulk cargo; Aviation 602 gCO2e/tkm reflects genuinely high per-tonne-km intensity for
  air freight).
- **UK ZEV Mandate** and **EU FuelEU Maritime**: correctly cited real regulatory instruments driving
  road and maritime fleet transition respectively.

## 9 · Future Evolution

### 9.1 Evolution A — GLEC-grounded MAC engine on real emission factors (analytics ladder: rung 1 → 2)

**What.** Today the module's only genuine cross-portfolio computation is the GLEC
weighted composite (`Σ portfolioScore×weight/100`, correctly implemented); the 100
companies are fully `sr()`-seeded, the advertised MAC methodology
(`MAC = ΔCost/ΔEmissions`) is never computed, and §7.6 documents that the platform's
`EMISSION_FACTORS` refdata table is imported but never used. Evolution A makes the MAC
formula real: a backend `transport_mac_engine` computing marginal abatement cost per
mode×lever combination from the 9 hand-curated `LEVERS` (investment, reduction,
timeframe fields already exist) against the genuinely calibrated `MODE_INTENSITY`
baselines (62/22/8/602/180/35 gCO2e/tkm — §7.2 confirms these match ICCT/GLEC
benchmarks).

**How.** (1) New router `api/v1/routes/transport_decarb.py`: `POST /mac-curve` (fleet
inventory in → ranked MAC curve out) and `GET /levers`. (2) Wire the dead
`EMISSION_FACTORS` import into per-fuel intensity so diesel/LNG/electric/hydrogen
splits drive emissions, and renormalise fleet composition to 100% (the >100% mix bug
§7.6 flags). (3) Derive per-company GLEC scores from the 7-criterion formula instead
of the independent `40+sr()×55` draw, so the criterion table and company scores agree.

**Prerequisites.** Fleet-mix renormalisation fix; lever cost fields converted from
display strings ("$1.2T") to typed numerics at source. **Acceptance:** MAC curve output
is reproducible from lever inputs, `bench_quant`-style pin on one worked mode×lever
case, and fleet-mix percentages sum to 100 for every generated company.

### 9.2 Evolution B — Modal-shift analyst with tool-called route optimisation (LLM tier 2)

**What.** The Modal Shift Analyzer already performs a genuine before/after comparison
over `ROUTES` (baseline vs optimal emissions and cost). Evolution B puts a tool-calling
analyst on top: "shift our top 10 air-freight lanes to rail where transit time allows
+2 days — what's the CO2e and cost delta, and which FuelEU/CORSIA obligations change?"
The LLM calls the module's endpoints (post-Evolution-A `POST /mac-curve` plus a new
`POST /modal-shift` exposing the existing shift computation server-side) and narrates
real engine output, citing the 9-row `REGULATIONS` dataset (IMO GHG Strategy, FuelEU
Maritime, UK ZEV mandate) for the compliance dimension.

**How.** Tool schemas auto-generated from the module's OpenAPI operations per the
tier-2 pattern; the per-module system prompt carries §7.2's provenance table so the
copilot correctly distinguishes calibrated anchors (mode intensities, GLEC criteria)
from synthetic dispersion (company-level draws). The no-fabrication validator checks
every tCO2e and cost figure in answers against tool outputs.

**Prerequisites (hard).** Evolution A's backend must exist — there are currently zero
endpoints to call (Tier B, EP code None); the modal-shift math must move server-side.
**Acceptance:** every numeric in an answer traces to a tool call; asked for a
company-specific verified emissions figure, the analyst discloses the portfolio is
synthetic demo data and refuses to present it as reported actuals.