# Transition Scenario Modeller
**Module ID:** `transition-scenario-modeller` · **Route:** `/transition-scenario-modeller` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Corporate scenario analysis platform for transition risk modelling; applies NGFS, IEA and proprietary scenarios to company financial projections to quantify revenue, cost and asset value impacts.

> **Business value:** TCFD recommends at least three scenario pathways including a <2°C scenario; CSRD ESRS E1 requires quantitative scenario analysis for all large companies from 2024; modellers reduce analyst time by 70%.

**How an analyst works this module:**
- Select relevant transition scenarios from library
- Map carbon price, energy price and demand pathways to company financials
- Project revenue impact from demand shifts and product mix changes
- Model cost impact from energy transition and carbon compliance
- Stress-test financial covenants and communicate results to board

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `PRESETS`, `SECTORS`, `SECTOR_IMPACTS`, `TABS`, `TIMELINE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PRESETS` | 6 | `id`, `name`, `carbonPrice`, `renewPct`, `tempC`, `gdp`, `coalPhase`, `evShare`, `h2Scale`, `ccusGt` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PRESETS` | `[{id:1,name:'NGFS Net Zero 2050',carbonPrice:250,renewPct:90,tempC:1.5,gdp:-2,coalPhase:2040,evShare:85,h2Scale:'High',ccusGt:7},{id:2,name:'NGFS Delayed',carbonPrice:350,renewPct:75,tempC:1.8,gdp:-4.5,coalPhase:2050,evS` |
| `SECTOR_IMPACTS` | `PRESETS.map(p=>({scenario:p.name,...Object.fromEntries(SECTORS.map((s,i)=>[s,+((sr(p.id*100+i*7)-0.5)*Math.abs(p.gdp)*3).toFixed(1)]))}));` |
| `TIMELINE` | `Array.from({length:7},(_,y)=>({year:2025+y*5,nz:+(1.2+y*0.04).toFixed(1),delayed:+(1.2+y*0.1).toFixed(1),current:+(1.2+y*0.28).toFixed(1),carbon_nz:Math.round(250+y*0),carbon_del:Math.round(50+y*45),carbon_cur:Math.round` |
| `sectorImpact` | `useMemo(()=>{const si=SECTOR_IMPACTS.find(s=>s.scenario===curPreset.name);if(!si)return[];return SECTORS.map(s=>({sector:s,impact:si[s]\|\|0})).sort((a,b)=>a.impact-b.impact);},[curPreset]);` |
| `filteredPresets` | `useMemo(()=>{let d=[...PRESETS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sortCol,sortDir]); const doSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDi` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=UR` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PRESETS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EBITDA Impact (Orderly 1.5°C) | — | Scenario Engine | Projected EBITDA reduction under NGFS Orderly transition by 2030 vs baseline. |
| EBITDA Impact (Disorderly) | — | Scenario Engine | Projected EBITDA reduction under NGFS Disorderly transition; higher from abrupt carbon price shock. |
| Scenarios Available | — | NGFS Library | Number of scenarios available including NGFS Phase IV, IEA NZE/SDS/STEPS and proprietary variants. |
- **Company P&L, Carbon Price Curves, Energy Price Projections, NGFS Pathways** → Scenario mapping engine + financial impact modelling → **Scenario impact reports, TCFD Strategy section disclosures, board presentations**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario Impact on EBITDA
**Headline formula:** `ΔEBITDA = ΔRevenue(carbon price, demand) + ΔCost(energy, compliance) – ΔCapex(transition)`

Net EBITDA impact from scenario-driven revenue changes, operating cost changes and transition capex requirements under each pathway.

**Standards:** ['NGFS Phase IV 2023', 'TCFD Scenario Analysis Guidance 2022']
**Reference documents:** NGFS Phase IV Scenarios 2023; TCFD Scenario Analysis Guidance 2022; IEA World Energy Outlook 2023; SBTi Sectoral Decarbonisation Approach

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states
> `ΔEBITDA = ΔRevenue(carbon price, demand) + ΔCost(energy, compliance) − ΔCapex(transition)` as
> the module's methodology, and cites specific EBITDA-impact outputs ("−18% Orderly," "−34%
> Disorderly"). **No EBITDA, revenue, cost, or capex calculation exists anywhere in the code.**
> The module instead displays 6 hardcoded NGFS/IEA-style scenario presets and a **sector-impact
> heuristic** that is a scaled random number, not a financial-statement projection. The sections
> below document what the code actually computes.

### 7.1 What the module computes

6 hardcoded scenario presets (name, carbon price, renewables %, temperature outcome, GDP impact,
coal phase-out year, EV share, hydrogen scale, CCUS capacity) plus a per-sector "impact" heuristic
computed once at module load:

```js
sectorImpact(preset, sector_i) = (sr(preset.id×100 + i×7) − 0.5) × |preset.gdp| × 3
customGDPEstimate = −customCarbonPrice × 0.01 − customTemp × 1.5    // linear heuristic, live-recomputed
```

### 7.2 Parameterisation

| Preset | Carbon price | Renewables | Temp | GDP impact | Coal phase-out | EV share |
|---|---|---|---|---|---|---|
| NGFS Net Zero 2050 | $250/t | 90% | 1.5°C | −2% | 2040 | 85% |
| NGFS Delayed | $350/t | 75% | 1.8°C | −4.5% | 2050 | 65% |
| Current Policies | $50/t | 40% | 3.0°C | −8% | 2070 | 30% |
| IEA NZE | $280/t | 88% | 1.4°C | −1.5% | 2035 | 90% |
| Below 2°C | $180/t | 70% | 1.7°C | −3% | 2045 | 55% |
| Divergent NZ | $400/t | 85% | 1.5°C | −5% | 2040 | 80% |

All 6 rows are hand-set constants, directionally consistent with real NGFS/IEA scenario narratives
(Current Policies has the lowest carbon price and highest temperature/GDP-loss outcome; IEA NZE has
the lowest near-term GDP loss and most ambitious 2035 coal phase-out). The **GDP-impact figures are
not computed from the carbon price, coal phase-out, or EV share columns in the same row** — they
are independently hand-set alongside them (e.g. Current Policies has both the lowest carbon price
*and* the largest GDP loss, which is the disorderly-transition narrative, but the −8% figure is
asserted, not derived).

### 7.3 Calculation walkthrough

1. **Scenario Builder tab**: displays the selected preset's 7 KPI cards directly from the constant
   object; a sortable table of all 6 presets; a sector-impact bar chart and a 5-axis radar
   (Renewable %, EV %, CCUS×12, Carbon$/4, GDP-derived index) built from simple linear rescalings of
   the same preset fields (not independent metrics).
2. **Sector impact heuristic**: `(sr(seed) − 0.5) × |gdp| × 3` — centers a random draw around 0,
   scaled by the scenario's overall GDP-impact magnitude. This produces sector values that sum to
   roughly zero (some sectors "gain," some "lose") and scale with how severe the scenario's GDP hit
   is, but the specific sign/magnitude per sector is random, not derived from that sector's actual
   carbon exposure, revenue mix, or cost structure.
3. **Impact Analysis tab**: cross-scenario sector-impact bar chart (first 5 sectors × all 6
   scenarios), a Carbon Price vs GDP scatter (directly plotting the 6 presets' own fields — a
   genuine relationship since both come from the same row, though not derived from one another), and
   a temperature-outcome bar chart.
4. **Pathway Comparison tab**: 3 fixed 7-point timelines (2025–2055, every 5 years) for Net
   Zero/Delayed/Current temperature and carbon-price trajectories — static arrays, not derived from
   the 6 presets or any interpolation function (unlike `transition-risk-dcf`'s genuine NGFS tabular
   lookup).
5. **Custom Scenarios tab**: 3 sliders (carbon price, renewables, target temp) feed a **live linear
   heuristic** `GDP ≈ −0.01×carbonPrice − 1.5×targetTemp` and a sector-impact bar chart using the
   same random-heuristic pattern as the preset sector impact, scaled by `customCarbonPrice × 0.02`.

### 7.4 Worked example

**Preset sector impact** (NGFS Net Zero 2050, `id=1`, `gdp=−2`):

| Sector | `sr(100+i×7)` | Impact = `(sr−0.5)×2×3` |
|---|---|---|
| Energy (i=0) | `sr(100)=0.258` | **−1.5** |
| Utilities (i=1) | `sr(107)=0.183` | **−1.9** |
| Materials (i=2) | `sr(114)` | **−0.9** |

**Custom scenario GDP heuristic** (`customCarbon=$200/t`, `customTemp=2.0°C`):

```
GDP ≈ −200×0.01 − 2.0×1.5 = −2.0 − 3.0 = −5.0%
```

This heuristic implies every $100/t of carbon price costs 1 percentage point of GDP and every
1°C of residual warming costs 1.5 points — a simple, transparent, but empirically unvalidated
linear rule of thumb, not a general-equilibrium or IAM (Integrated Assessment Model) output.

### 7.5 Companion analytics

- **Scenario Radar** — 5-axis normalised view of a single preset's Renewable%, EV%, CCUS
  (×12 scaling to fit a 0–100 axis), Carbon$ (÷4), and a GDP-derived "100+gdp×5" index — a
  visualization convenience, not an independently computed composite score.
- **Custom vs Presets scatter** — plots the user's custom carbon-price/temperature pair alongside
  the 6 presets for visual context.
- **Export** — CSV export of all 6 presets.

### 7.6 Data provenance & limitations

- **No EBITDA/revenue/cost/capex financial model exists**, despite this being the guide's headline
  methodology claim — see the mismatch flag above. The module is a scenario-parameter browser with
  a decorative sector-impact random overlay, not a company-financial-impact modeller.
- The 6 presets' fields (carbon price, GDP impact, temp, etc.) are **internally hand-set together**,
  not derived from each other via any model — a user cannot trust that changing one field (e.g. via
  the custom scenario sliders) would correctly imply the others, because no such linkage is coded
  beyond the simple linear GDP heuristic.
- Sector-level impacts are randomly generated (zero-centered, GDP-magnitude-scaled) and carry no
  sector-specific carbon exposure or transition-cost information, despite sitting in a chart labelled
  "Sector Impact."
- The 3 timeline pathways (temperature and carbon price, 2025–2055) are static arrays disconnected
  from the 6 scenario presets shown elsewhere on the same page — e.g. the "current" pathway's 2050
  carbon price (`20+6×5=50`) matches the Current Policies preset's $50/t by coincidence of shared
  authorship, not by a shared formula.

### 7.7 Framework alignment

- **NGFS Phase IV scenarios** and **IEA World Energy Outlook / NZE**: preset names and rough
  parameter directions (Net Zero 2050 lowest GDP loss among ambitious scenarios, Current Policies
  worst long-run temperature outcome) are consistent with the real narrative structure of these
  scenario families, even though the specific numeric values are illustrative rather than sourced
  from the actual NGFS/IEA published datasets.
- **TCFD Scenario Analysis Guidance (2022)**: the module's basic requirement — presenting at least
  a <2°C scenario alongside a current-policies baseline — is satisfied structurally (6 presets span
  1.4°C to 3.0°C), though the guidance's expectation of quantified financial impact is not met given
  the absence of any EBITDA/cash-flow calculation.

## 9 · Future Evolution

### 9.1 Evolution A — Real ΔEBITDA scenario engine to close the guide↔code gap (analytics ladder: rung 1 → 2)

**What.** The module today is a scenario-parameter browser, not a modeller: 6 hardcoded
NGFS/IEA-style presets, a random sector-impact overlay (`(sr(seed)−0.5)×|gdp|×3`), and
3 static timelines disconnected from the presets. §7 flags the guide↔code mismatch
explicitly — the advertised `ΔEBITDA = ΔRevenue + ΔCost − ΔCapex` formula exists nowhere
in code. Evolution A builds that formula as this module's first backend vertical:
a `transition_scenario_engine` that takes a company P&L sketch (revenue, EBITDA margin,
scope 1/2 tCO2e, energy spend, sector) and computes ΔEBITDA per scenario from carbon
cost (`emissions × carbonPrice × pass-through`), energy-cost deltas, and sector demand
elasticities.

**How.** (1) New router `api/v1/routes/transition_scenario.py` with `POST /model` and
`GET /scenarios`; scenario pathways sourced from the real NGFS Phase IV tabular data
the platform already holds (the `transition-risk-dcf` module's genuine NGFS lookup is
the pattern to reuse — §7.3 cites it by name). (2) Replace the random `SECTOR_IMPACTS`
with sector carbon-intensity coefficients from the refdata emission-factor layer.
(3) Derive the 3 pathway timelines by interpolation from the same scenario objects,
eliminating the coincidental-consistency problem §7.6 documents.

**Prerequisites.** Acknowledge and remove the seeded-random sector overlay (a documented
fabrication instance); NGFS pathway table exposed as shared refdata. **Acceptance:**
the page's EBITDA-impact figures come from the engine response; two sectors with
different carbon intensities produce different impacts for the same scenario; the §7
mismatch flag can be deleted.

### 9.2 Evolution B — Board-pack scenario copilot (LLM tier 1)

**What.** A copilot on the modeller page that answers the exact questions boards ask —
"why is Delayed Transition worse for us than Net Zero 2050?", "what does a $350/t
carbon price assume about coal phase-out?" — grounded strictly in the module's Atlas
record and, once Evolution A lands, the engine's decomposed response (carbon-cost term,
energy term, demand term). It drafts the TCFD Strategy-section narrative paragraph from
the currently selected preset's parameters, since TCFD/ESRS E1 disclosure text is this
module's stated business output.

**How.** Standard tier-1 stack per the productization roadmap: embed this module's
`atlas.json` entry + `modules/transition-scenario-modeller.md` into `llm_corpus_chunks`;
`POST /api/v1/copilot/transition-scenario-modeller/ask` with a per-module system prompt
assembled from §5/§7. Critically, the prompt must encode the current honest state: until
Evolution A ships, the copilot must describe sector impacts as illustrative and refuse
to attribute them to a financial model — the refusal path is REQUIRED behavior here
because §7.6 documents that no EBITDA model exists.

**Prerequisites.** pgvector corpus tables (roadmap D3); the §7 deep-dive is already
written and is the grounding corpus. **Acceptance:** asked "what's our modelled EBITDA
impact?", the pre-Evolution-A copilot answers that the module does not compute one;
post-Evolution-A it cites the engine payload, with every numeric traceable to it.