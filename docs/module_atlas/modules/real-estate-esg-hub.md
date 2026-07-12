# Real Estate ESG Hub
**Module ID:** `real-estate-esg-hub` · **Route:** `/real-estate-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive real estate ESG management. Covers GRESB, CRREM, EPC ratings, green certifications (BREEAM/LEED/DGNB), tenant engagement, and embodied carbon (whole-life carbon).

> **Business value:** Real estate is both a major source of emissions (40% of EU energy) and a target of net-zero investment strategies. Institutional investors use GRESB for manager assessment and CRREM for stranding risk. This hub provides the complete ESG data infrastructure for real estate fund managers and corporate occupiers.

**How an analyst works this module:**
- Portfolio Overview shows assets with EPC, certification, and GRESB status
- CRREM Dashboard shows stranding risk across portfolio
- Whole-Life Carbon shows operational + embodied breakdown
- Tenant Engagement tracks green lease adoption and data sharing
- Green Certification Manager tracks BREEAM/LEED scores

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `EPC_COLORS`, `EPC_RATINGS`, `SEVERITY_COLORS`, `SUB_MODULES`, `TABS`, `TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUB_MODULES` | 6 | `id`, `name`, `icon`, `color`, `desc`, `status`, `kpi` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*6)];const city=CITIES[Math.floor(s2*CITIES.length)];` |
| `epcIdx` | `Math.floor(s3*7);const epc=EPC_RATINGS[epcIdx];` |
| `area` | `Math.floor(500+s4*49500);const yearBuilt=Math.floor(1950+s5*73);` |
| `value` | `Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:type==='Industrial'?1800:type==='Logistics'?2100:3800)*(0.8+s3*0.4));` |
| `intensity` | `Math.floor(({'Office':180,'Retail':220,'Residential':120,'Industrial':280,'Logistics':150,'Mixed-Use':200}[type])*(0.5+s*0.8));` |
| `certified` | `s6>0.38;const certScheme=certified?['LEED','BREEAM','WELL','NABERS','DGNB'][Math.floor(s*5)]:'None';` |
| `certLevel` | `certified?['Gold','Silver','Platinum','Excellent'][Math.floor(s2*4)]:'None';` |
| `embodiedCarbon` | `Math.floor(200+s*200);const resilience=Math.floor(30+s2*60);` |
| `riskScore` | `Math.floor(20+s3*70);const greenLease=s4>0.35;` |
| `tenantCount` | `Math.floor(1+s5*15);const occupancy=Math.floor(70+s6*30);` |
| `retrofitCost` | `Math.floor(area*(25+s*75));const retrofitStatus=['Not Started','Planned','In Progress','Completed'][Math.floor(s6*4)];` |
| `gresbScore` | `Math.floor(40+s*50);const co2=Math.floor(intensity*area*0.21/1000);` |
| `insurancePrem` | `Math.floor(value*0.003*(1+riskScore/100));` |
| `gresbTrend` | `Array.from({length:6},(_,i)=>({year:2020+i,score:Math.floor(52+i*4.5+sr(i*13)*3),benchmark:Math.floor(55+i*2.5),peer:Math.floor(50+i*3)}));` |
| `crremTrend` | `Array.from({length:6},(_,i)=>({year:2020+i,aligned:Math.floor(20+i*8+sr(i*17)*5),intensity:Math.floor(180-i*7)}));` |
| `certTrend` | `Array.from({length:6},(_,i)=>({year:2020+i,leed:Math.floor(10+i*4),breeam:Math.floor(8+i*5),well:Math.floor(2+i*3),total:Math.floor(20+i*12)}));` |
| `filteredAlerts` | `useMemo(()=>alertSeverity==='All'?alerts:alerts.filter(a=>a.severity===alertSeverity),[alertSeverity]);  const epcDist=useMemo(()=>EPC_RATINGS.map(r=>({rating:r,count:filtered.filter(b=>b.epc===r).length})),[filtered]);` |
| `typeDist` | `useMemo(()=>TYPES.map(t=>({type:t,count:filtered.filter(b=>b.type===t).length})),[filtered]);` |
| `portfolioRadar` | `useMemo(()=>[ {metric:'Energy',score:Math.floor(100-buildings.reduce((s,b)=>s+b.intensity,0)/buildings.length/3)}, {metric:'Certification',score:Math.floor(buildings.filter(b=>b.certified).length/buildings.length*100)}, {metric:'Resilience',score:Math.floor(buildings.reduce((s,b)=>s+b.resilience,0)/Math.max(1,buildings.length))}, {metric:` |
| `boardSections` | `useMemo(()=>[ {title:'Portfolio Summary',content:`${buildings.length} buildings, £${(buildings.reduce((s,b)=>s+b.value,0)/1e9).toFixed(1)}B value, ${CITIES.filter(c=>buildings.some(b=>b.city===c)).length} cities`}, {title:'Energy & Carbon',content:`Avg intensity ${Math.floor(buildings.reduce((s,b)=>s+b.intensity,0)/Math.max(1,buildings.le` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `EPC_RATINGS`, `SUB_MODULES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Operational Carbon | — | Typical split | Energy use in use phase — reduced by retrofitting |
| Embodied Carbon | — | Materials | Carbon in construction materials — set at design stage |
| Green Certifications | — | Building level | Third-party verification of building sustainability |
- **Building energy data** → Operational carbon calculation → **EUI and carbon per m²**
- **Construction data** → Embodied carbon LCA → **Whole-life carbon profile**
- **Portfolio data** → GRESB assessment → **ESG rating and investor reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** Whole-life carbon accounting
**Headline formula:** `WLC = OperationalCarbon + EmbodiedCarbon; Embodied = A1-A5 + B1-B7 + C1-C4 + D`

Operational: energy use in use phase. Embodied: construction materials, transport, waste, demolition. Whole-life carbon increasingly required for planning consents and institutional investor reporting.

**Standards:** ['RICS Whole Life Carbon Assessment', 'EN 15978', 'CRREM', 'GRESB']
**Reference documents:** RICS Whole Life Carbon Assessment Standard; CRREM v2; GRESB Real Estate Assessment; EU EPBD recast (2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

150 synthetic buildings across 6 types and 15 cities each carry independent operational,
embodied-carbon, certification, resilience and tenant-engagement attributes. Unlike the guide's
formula `WLC = OperationalCarbon + EmbodiedCarbon`, **the code never sums the two into a
whole-life-carbon figure** — `intensity` (operational, kWh/m²) and `embodiedCarbon` (kgCO₂e/m²)
remain separate fields reported independently on the dashboard; no `wholeLifeCarbon` variable
exists anywhere in the file. This is a partial guide↔code gap (methodology headline present, the
literal combination step absent) rather than a full mismatch — the underlying operational and
embodied figures genuinely exist and are independently meaningful.

```js
value      = area × sectorPricePerM2 × (0.8 + s3×0.4)
intensity  = sectorBaseIntensity × (0.5 + s×0.8)                    // kWh/m²/yr, operational
crremAligned = intensity < 100                                       // flat threshold, all sectors
strandingYear = crremAligned ? 2045+floor(s4×5) : 2026+floor(s2×12)
embodiedCarbon = 200 + s×200                                         // kgCO2e/m² — separate metric
gresbScore = 40 + s×50
co2        = intensity × area × 0.21 / 1000                          // tCO2/yr, UK grid-ish factor
insurancePrem = value × 0.003 × (1 + riskScore/100)
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Sector price/m² | Office £4,500, Retail £3,200, Residential £5,500, Industrial £1,800, Logistics £2,100, Mixed-Use £3,800 | Synthetic demo values, directionally plausible UK ranking (residential > office > mixed-use > retail > logistics > industrial) |
| Sector base intensity (kWh/m²) | Office 180, Retail 220, Residential 120, Industrial 280, Logistics 150, Mixed-Use 200 | Synthetic — same ranking direction as CIBSE/BEIS benchmark tables but not the actual published values |
| CRREM-aligned threshold | `intensity < 100 kWh/m²` (flat, all sectors) | Synthetic simplification — a genuine CRREM check needs a **sector-specific** pathway budget (as correctly implemented in the sibling `real-estate-carbon-analytics` module's `CRREM` table); this module collapses all 6 sectors to one cutoff |
| `co2` grid factor | `0.21` (implicit kgCO2/kWh) | Roughly UK grid average c.2022 (DESNZ/DEFRA conversion factors ≈0.19–0.23 kgCO2e/kWh over recent years) — plausible but unattributed in code |
| Insurance premium rate | `0.3%` of value, loaded by `(1+riskScore/100)` | Synthetic — up to 2× base premium at `riskScore=100` |
| GRESB score | `40 + s×50` (40–90) | Synthetic — GRESB's real scale is 0–100 with published percentile bands; range plausible, unsourced |

### 7.3 Calculation walkthrough

1. **Per-building seed** (150 rows, 6 independent `sr()` draws each): type, city, EPC grade,
   area, year built, value, operational intensity, CRREM-flat-alignment flag + stranding year,
   certification scheme/level, embodied carbon, resilience score, physical risk score, green
   lease flag, tenant count, occupancy, retrofit cost/status, GRESB score, CO2, insurance premium.
2. **Portfolio KPIs** (`kpis`, computed once at module scope — not filtered/interactive): 12 cards
   — value sum, avg EPC (index-averaged then mapped back to a letter, see caveat below), % CRREM
   aligned, % certified, avg resilience, % green lease, total CO2, avg GRESB, avg intensity, avg
   embodied carbon, retrofit pipeline £ (sum of `retrofitCost` where status ≠ Completed), building
   count.
3. **20 hard-coded alerts** (`alerts` array): fixed narrative strings by severity (critical/high/
   medium/low) tagged to one of 5 sub-modules (AS1–AS5) — descriptive content, not derived from
   the 150-building dataset (e.g. "12 buildings stranding by 2028" is a fixed string, not
   `buildings.filter(...).length`).
4. **Trend series** (`gresbTrend`, `crremTrend`, `certTrend`, all 6-year 2020–2025 arrays):
   independently seeded synthetic time series, not backward-computed from the current 150-building
   snapshot.
5. **Distributions**: `epcDist`, `typeDist` — counts of `buildings` by category; `portfolioRadar`
   — 4–5 dimension scores (Energy = `100 − avgIntensity/3`, Certification = `%certified`,
   Resilience = `avgResilience`, plus others) mixing genuinely-normalised and ad-hoc-scaled metrics
   on one 0–100 radar.
6. **Board report** (`boardSections`): auto-generated narrative strings built from the same
   aggregate figures (portfolio value, avg intensity, etc.) — a templated executive summary, not
   an independent calculation.

### 7.4 Worked example

Building `i=0`: `s=sr(3)`, `s2=sr(5)`, `s3=sr(7)`, `s4=sr(11)`, `s5=sr(13)`, `s6=sr(17)`.

| Step | Value (illustrative from `sr()` outputs) |
|---|---|
| `s3=sr(7)≈0.9906` | `type=TYPES[floor(0.988×6)]` → near end of list, e.g. **Mixed-Use** |
| `area` | `floor(500+s4×49,500)` → e.g. **32,000 m²** |
| `value` | `32,000 × 3,800 × (0.8+0.9906×0.4)` ≈ `32,000×3,800×1.196` ≈ **£145.6M** |
| `intensity` | `200 × (0.5+s×0.8)`, `s=sr(3)` | ≈ **150–280 kWh/m²** range depending on draw |
| `crremAligned` | `intensity < 100` | **false** for any Mixed-Use draw above 100 (base alone is 200) |
| `strandingYear` | not aligned → `2026+floor(s2×12)` | **2026–2037** |
| `embodiedCarbon` | `200+s×200` | ≈ **200–400 kgCO2e/m²** |
| `co2` | `intensity×area×0.21/1000` | at intensity=200: `200×32,000×0.21/1000` = **1,344 tCO2/yr** |
| `insurancePrem` | `value×0.003×(1+riskScore/100)` | at riskScore=60: `145.6M×0.003×1.6` ≈ **£698k/yr** |

### 7.5 Portfolio-level rubric

| Metric | Rule |
|---|---|
| CRREM aligned | flat `intensity < 100 kWh/m²` — **not** sector-differentiated (contrast: sibling module uses per-sector budgets 35–60 kgCO₂/m²) |
| Certified | `s6 > 0.38` (≈62% of the seed population) |
| Green lease | `s4 > 0.35` (≈65%) |

### 7.6 Companion analytics

Executive Dashboard (12 KPIs + trend charts + radar), Portfolio Overview (filterable building
table with EPC colour coding), Engagement & Capex Pipeline (retrofit status funnel, tenant
engagement), Board Report (auto-narrative). Five documented "sub-modules" (AS1–AS5) are UI
navigation cards only — they do not correspond to separate calculation engines within this file.

### 7.7 Data provenance & limitations

- **All 150 buildings are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; names are
  templated (`{city} {type} {n}`), not real assets.
- The flat 100 kWh/m² CRREM threshold ignores sector-specific decarbonisation budgets — a
  logistics building and an office are judged against the same bar despite materially different
  real CRREM pathways (the platform's own `real-estate-carbon-analytics` module gets this right).
- `WLC = Operational + Embodied` (the guide's own formula) is never actually summed in code —
  operational (`intensity`, kWh/m²) and embodied (`embodiedCarbon`, kgCO2e/m²) are also in
  different units (energy vs carbon) and would need the same EPC→carbon-factor conversion used
  elsewhere before they could be combined.
- The 20 alert strings and Board Report narrative are static/templated text, not computed
  triggers off the live 150-building dataset — e.g. counts quoted in alert text will not track
  actual filtered totals.
- 6-year trend series (GRESB, CRREM alignment, certifications) are independently seeded, not a
  time-evolution of the current snapshot — portfolio composition implicitly "improves" over the
  trend regardless of the underlying 150-building draw.

**Framework alignment:** RICS Whole-Life Carbon Assessment / EN 15978 — named but the operational+
embodied summation step is not executed · CRREM — used as a binary flag, not the multi-sector
pathway model CRREM actually publishes (10-year budget decline curves per property type/region) ·
GRESB — portfolio score modelled as a single synthetic 40–90 figure, not GRESB's actual weighted
aspect-score methodology (Management, Performance, Development components) · EU EPBD recast /
MEES — referenced only in the static alert text, not computed against the building set's own EPC
distribution.

## 9 · Future Evolution

### 9.1 Evolution A — One RE asset register feeding sector-correct analytics (analytics ladder: rung 1 → 2)

**What.** §7.7 catalogs the defects: 150 templated synthetic buildings, a flat 100 kWh/m² CRREM threshold that judges logistics and offices against the same bar (the atlas notes the sibling `real-estate-carbon-analytics` gets sector pathways right), the guide's `WLC = Operational + Embodied` never summed — and un-summable as coded, since the operands are in different units (kWh/m² vs kgCO₂e/m²) — alert text whose counts don't track the live dataset, and trend series seeded independently of the snapshot they claim to trend. Evolution A makes this hub what its name implies: a front door over one shared RE asset register and the platform's existing RE engines, not a fourth parallel implementation.

**How.** (1) Adopt the shared portfolio register the RE sibling modules are converging on (`re-portfolio-dashboard`'s property model), rendering this hub's six sub-module views from it. (2) CRREM alignment via the `REPortfolioEngine` sector/country pathway interpolation, retiring the flat threshold. (3) Fix the WLC identity: convert operational energy intensity to carbon via the grid-factor conversion `real-estate-carbon-analytics` already uses, then sum with embodied — same units, honest total. (4) Alerts become computed triggers (EPC below MEPS minimum for its country/year, CRREM breach within 5 years, certification expiry) evaluated against the live register; trend series become stored snapshots accumulated over time, not synthetic curves.

**Prerequisites.** Register convergence agreed across the four RE modules (the real work is organizational); grid factors per country available in refdata. **Acceptance:** an alert's quoted count equals the filtered register count; WLC for a bench property equals hand-converted operational + embodied in kgCO₂e/m²; logistics and office assets face different CRREM bars.

### 9.2 Evolution B — Board-report generator over live triggers (LLM tier 2)

**What.** The hub already gestures at a Board Report — §7.7 notes it's static templated text. Evolution B replaces it with an LLM-composed report grounded in computed state: "generate the quarterly RE ESG board pack — EPC distribution vs MEPS deadlines, CRREM alignment trajectory, certification pipeline, top-5 computed alerts with recommended actions" — every figure from register aggregations, every alert from the trigger engine, rendered via the report-studio layer.

**How.** Tier-2 tool schemas over the Evolution-A register/alert/CRREM endpoints; the report template's numeric slots are filled exclusively from tool outputs with the no-fabrication validator as the gate. Recommended actions are constrained to the module's own action vocabulary (retrofit statuses, certification schemes, green-lease adoption) with cost figures only where the register carries them. Interactive follow-ups ("expand on the Berlin office cluster") drill into register queries. The copilot also fields tenant-engagement questions from the green-lease fields, a genuinely narrative domain where tier-1 explanation suffices.

**Prerequisites (hard).** Evolution A — generating board reports from today's seeded book with mismatched alert counts would automate misinformation. **Acceptance:** every number in a generated pack reproduces from a register query; alerts in the pack match the trigger engine's current output exactly.