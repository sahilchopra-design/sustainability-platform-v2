# Impact Attribution
**Module ID:** `impact-attribution` · **Route:** `/impact-attribution` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `IMPACT_CATEGORIES`, `IRIS_METRICS`, `QUARTERS`, `REPORT_SECTIONS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IRIS_METRICS` | `['PI4060 - Jobs Created','PI2822 - Patients Served','OI1120 - GHG Reduced','OI8839 - Energy Generated','OI4389 - Water Conserved','PI6330 - Students Educated','PI3468 - Housing Units','OI5765 - Waste Diverted','PI9382 - ` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `outstanding` | `Math.round((sr(i*31+17)*80+5)*10)/10;` |
| `evic` | `Math.round((sr(i*47+19)*500+100)*10)/10;` |
| `attrFactor` | `Math.round((outstanding/evic)*1000)/1000;` |
| `jobs` | `Math.round(sr(i*67+21)*5000+100);` |
| `lives` | `Math.round(sr(i*29+23)*20000+500);` |
| `co2` | `Math.round(sr(i*53+25)*50000+1000);` |
| `energy` | `Math.round(sr(i*37+27)*100000+5000);` |
| `water` | `Math.round(sr(i*43+29)*5000+100);` |
| `attrJobs` | `Math.round(jobs*attrFactor);` |
| `attrLives` | `Math.round(lives*attrFactor);` |
| `attrCo2` | `Math.round(co2*attrFactor);` |
| `attrEnergy` | `Math.round(energy*attrFactor);` |
| `attrWater` | `Math.round(water*attrFactor);` |
| `investedM` | `Math.round((sr(i*61+31)*50+2)*10)/10;` |
| `impactPerM` | `Math.round((attrJobs+attrCo2*0.01+attrLives*0.1)/investedM*10)/10;` |
| `base` | `sr(i*12+q*17+500);` |
| `REPORT_SECTIONS` | `['Executive Summary','Portfolio Impact Overview','Environmental Impact','Social Impact','SDG Alignment','Impact Attribution Methodology','Holding-Level Detail','Appendix: IRIS+ Metrics'];` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `aggKPIs` | `useMemo(()=>{ const totJobs=holdings.reduce((a,h)=>a+h.attrJobs,0);` |
| `totLives` | `holdings.reduce((a,h)=>a+h.attrLives,0);` |
| `totCo2` | `holdings.reduce((a,h)=>a+h.attrCo2,0);` |
| `totEnergy` | `holdings.reduce((a,h)=>a+h.attrEnergy,0);` |
| `totWater` | `holdings.reduce((a,h)=>a+h.attrWater,0);` |
| `totInvested` | `holdings.reduce((a,h)=>a+h.investedM,0);` |
| `trendData` | `useMemo(()=>{ return QUARTERS.map((q,qi)=>{ const qData={quarter:q};` |
| `scatterData` | `holdings.map(h=>({name:h.name,x:h.investedM,y:h.impactPerM,sector:h.sector,rating:h.impactRating}));` |
| `topEfficient` | `[...holdings].sort((a,b)=>b.impactPerM-a.impactPerM).slice(0,20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `IMPACT_CATEGORIES`, `IRIS_METRICS`, `QUARTERS`, `REPORT_SECTIONS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this route — sections below document the code directly.)*

The module attributes portfolio impact to investor capital using the **PCAF-style attribution factor**
(outstanding amount ÷ EVIC), then scales each holding's gross impact metrics by that factor. The
attribution arithmetic is methodologically correct; the underlying company data (100 synthetic holdings)
is entirely PRNG-generated.

### 7.1 What the module computes

For 100 generated holdings (`genHoldings(100)`), the attribution factor and attributed impacts:

```js
outstanding = round((sr(i*31+17)*80+5)*10)/10        // $5–85M position
evic        = round((sr(i*47+19)*500+100)*10)/10      // $100–600M enterprise value incl. cash
attrFactor  = round((outstanding/evic)*1000)/1000     // PCAF attribution factor
attrJobs    = round(jobs   × attrFactor)
attrLives   = round(lives  × attrFactor)
attrCo2     = round(co2    × attrFactor)
attrEnergy  = round(energy × attrFactor)
attrWater   = round(water  × attrFactor)
```

**Impact efficiency** — a composite $-normalised impact score:

```js
impactPerM = round((attrJobs + attrCo2·0.01 + attrLives·0.1) / investedM × 10)/10
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Range | Provenance |
|---|---|---|
| `attrFactor` | outstanding ÷ EVIC | **PCAF Standard** attribution formula (correct) |
| gross `jobs` | 100–5 100 | Synthetic (`sr`) |
| gross `co2` (tCO₂e) | 1 000–51 000 | Synthetic |
| gross `lives` | 500–20 500 | Synthetic |
| `impactPerM` weights | jobs×1, co2×0.01, lives×0.1 | Ad-hoc composite weights — no external basis |
| `irisMetrics` | 3–7 of 10 IRIS+ codes | Real IRIS+ code labels (PI4060, OI1120…), synthetic values |
| `impactRating` | A+…C | Random pick from 8-grade scale |
| `methodology` tag | PCAF-Impact / GIIN IRIS+ / IMP 5D / Custom | Random label |

### 7.3 Calculation walkthrough

`genHoldings` builds each holding: name (prefix+suffix from PRNG indices), sector, `outstanding`, `evic`,
`attrFactor`, five gross impact metrics, their attributed counterparts, `investedM`, `impactPerM`, a
12-quarter trend (each metric × `(0.7 + base·0.6)/12`) and an IRIS+ metric list. `aggKPIs` sums
attributed jobs/lives/co2/energy/water and invested capital across holdings. `trendData` sums the
quarterly series portfolio-wide; `scatterData` plots invested (x) vs impactPerM (y); `topEfficient`
ranks the top-20 by `impactPerM`.

### 7.4 Worked example (one holding)

Take `outstanding = $30M`, `evic = $400M`, gross `jobs = 2 000`, `co2 = 40 000`, `lives = 10 000`,
`investedM = $30M`:

| Step | Computation | Result |
|---|---|---|
| attrFactor | 30 / 400 | **0.075** |
| attrJobs | 2 000 × 0.075 | **150** |
| attrCo2 | 40 000 × 0.075 | **3 000** tCO₂e |
| attrLives | 10 000 × 0.075 | **750** |
| impactPerM | (150 + 3 000·0.01 + 750·0.1) / 30 | (150+30+75)/30 = **8.5** |

The attribution factor (7.5%) is the load-bearing correct step; the `impactPerM` composite is a
bespoke weighting with no standard behind it.

### 7.5 Data provenance & limitations

- **All 100 holdings are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`. IRIS+ metric
  *codes* are real but their *values* are random.
- The **attribution factor is correct PCAF methodology** — this is the one genuinely-grounded formula.
- `impactPerM` mixes jobs, CO₂ (×0.01) and lives (×0.1) into a single number with arbitrary weights —
  not a recognised impact-efficiency metric; it should not be read as monetised impact.
- No real EVIC or outstanding-amount ingestion; no additionality, no attribution to *investor*
  contribution vs enterprise baseline.

**Framework alignment:** **PCAF** *Global GHG Accounting & Reporting Standard* — attribution factor =
outstanding ÷ EVIC is exactly how PCAF allocates a company's emissions (and here, impacts) to a
financier's share of enterprise value · **GIIN IRIS+** — metric taxonomy (PI/OI codes) is used for
labelling. The module applies PCAF attribution to impact metrics rather than emissions, an
extension that is directionally sound but here fed entirely synthetic inputs.

## 9 · Future Evolution

### 9.1 Evolution A — Real-holdings attribution on the platform portfolio spine (analytics ladder: rung 1 → 2)

**What.** The one load-bearing formula here is correct — `attrFactor = outstanding / EVIC` is exact PCAF attribution — but everything it multiplies is fabricated: 100 `genHoldings(100)` synthetic companies with PRNG outstanding, EVIC, jobs, CO₂, lives; real IRIS+ codes carrying random values; and an `impactPerM` composite whose weights (jobs×1, co2×0.01, lives×0.1) §7.5 correctly calls "not a recognised impact-efficiency metric". Evolution A rebuilds on real data: holdings from `portfolios_pg` (the populated portfolio table), EVIC/outstanding from the company master and refdata fundamentals, gross impact metrics from user-supplied or reported company data with honest nulls — and the bespoke composite retired in favour of per-metric attributed intensities (attributed tCO₂e/$M, attributed jobs/$M) reported separately, which is what PCAF-style attribution actually supports.

**How.** (1) A first backend vertical `POST /impact-attribution/attribute` taking a portfolio id, joining holdings to EVIC, returning per-holding attribution factors and attributed metrics with PCAF data-quality tiers. (2) An impact-data intake table (holding × IRIS+ code × period × value × source) so IRIS+ values become entered evidence, not draws. (3) The 12-quarter trend derives from stored periods rather than `sr(i*12+q*17+500)` noise. (4) The scatter/top-20 views re-point to per-metric intensities.

**Prerequisites.** The `genHoldings` PRNG generation removed (this page currently fabricates entire companies, names included); impact-data intake UX or import. Note there is no MODULE_GUIDES entry for this route — writing one is part of the work. **Acceptance:** attribution factors reproducible from stored outstanding/EVIC pairs; holdings without reported impact data show nulls, not numbers.

### 9.2 Evolution B — LP-report drafting copilot with attribution provenance (LLM tier 2)

**What.** The page already sketches its own LLM use case: `REPORT_SECTIONS` lists an 8-section impact report (Executive Summary → IRIS+ Appendix) with a CSV export. Evolution B drafts that report conversationally: "summarise attributed impact for Q4-25", "explain the attribution methodology section for a non-PCAF audience", "which holdings drive attributed CO₂ per dollar?" — every figure pulled from the Evolution A endpoint, every methodology sentence grounded in this Atlas page's §7.1 formulas.

**How.** Tier 2: tool schema over `/impact-attribution/attribute`; the report skeleton follows `REPORT_SECTIONS` with each section's numerics validated against tool output by the no-fabrication checker — impact reporting is precisely the domain where LLM-invented numbers would be greenwashing, so the validator is load-bearing, not decorative. The methodology section must state attribution shares (outstanding/EVIC) and data-quality tiers per holding; the copilot refuses to monetise impact ("total impact value in dollars") because no such model exists in the module. Rendered output composes into the report-studio layer per the roadmap's tier-3 pattern.

**Prerequisites (hard).** Evolution A first — drafting LP reports from the current synthetic holdings would put fabricated impact numbers into investor communications. **Acceptance:** a generated report contains zero numerics absent from logged tool responses; the methodology section correctly describes PCAF attribution and its limits (no additionality claim).