# SBTi Target Setter
**Module ID:** `sbti-target-setter` · **Route:** `/sbti-target-setter` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Science Based Targets initiative target-setting tool covering near-term (2030) and net-zero (2050) targets. Includes SDA sector pathways, FLAG methodology, and portfolio coverage target for financial institutions.

> **Business value:** SBTi validation is the gold standard for credible corporate climate targets. Enables companies to set, validate, and track science-aligned targets, and supports financial institutions in setting portfolio engagement targets required by net-zero alliances.

**How an analyst works this module:**
- Target Builder sets near-term and net-zero targets using SDA
- Sector Pathway shows required trajectory vs baseline
- Abatement Identification maps levers to close the gap
- FLAG Calculator adds forest/land targets where applicable
- Submission Checklist prepares SBTi submission package

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CARBON_BUDGETS`, `COMPANIES`, `FLAG_COMMODITIES`, `KPI`, `METHODS`, `PAGE_SIZE`, `PIECLRS`, `SECTOR_PATHS`, `SectionHead`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `METHODS` | 5 | `id`, `name`, `desc`, `ambition`, `minRate`, `scope`, `formula`, `pros`, `cons` |
| `SECTOR_PATHS` | 61 | `sector`, `unit`, `base2020`, `target2030`, `target2050`, `pathway`, `convergenceYear`, `method`, `milestones`, `year`, `val` |
| `FLAG_COMMODITIES` | 9 | `commodity`, `unit`, `base`, `target2030`, `flagRate`, `deforestationTarget`, `landUse`, `scope` |
| `CARBON_BUDGETS` | 6 | `pathway`, `remainingGt`, `usedGt`, `totalGt`, `yearExhausted`, `annualBudgetGt`, `perCapitaT`, `source` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `statusBadge` | `(s)=>{const m={'Net-Zero Validated':{bg:'rgba(5,150,105,0.12)',c:ACCENT},'Targets Validated':{bg:'rgba(22,163,74,0.12)',c:T.green},'Targets Set':{bg:'rgba(90,138,106,0.12)',c:T.sage},'Committed':{bg:'rgba(197,169,106,0.1` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `status` | `statuses[Math.floor(sr(base)*5.5)]; // bias toward validated` |
| `method` | `methods[Math.floor(sr(base+1)*4)];` |
| `baseYear` | `2018+Math.floor(sr(base+3)*4);` |
| `scope1` | `Math.round(50000+sr(base+5)*9950000);` |
| `scope2` | `Math.round(20000+sr(base+7)*2000000);` |
| `scope3` | `Math.round(scope1*2+sr(base+9)*scope1*5);` |
| `nearTermS12` | `Math.round(25+sr(base+11)*30); // 25-55% by 2030` |
| `nearTermS3` | `Math.round(10+sr(base+13)*30);` |
| `longTermS3` | `Math.round(60+sr(base+15)*10); // 67% per NZ Standard` |
| `tempScore` | `+(1.3+sr(base+17)*2.0).toFixed(1);` |
| `annualRate` | `+(nearTermS12/(2030-baseYear)).toFixed(1);` |
| `currentReduction` | `Math.round(nearTermS12*0.4+sr(base+19)*nearTermS12*0.3); // 40-70% of target` |
| `onTrack` | `currentReduction>=(nearTermS12*(2026-baseYear)/(2030-baseYear))*0.85;` |
| `commitDate` | ``20${20+Math.floor(sr(base+21)*4)}-${String(1+Math.floor(sr(base+23)*12)).padStart(2,'0')}-${String(1+Math.floor(sr(base+25)*28)).padStart(2,'0')}`;` |
| `validationDeadline` | ``20${22+Math.floor(sr(base+27)*3)}-${String(1+Math.floor(sr(base+29)*12)).padStart(2,'0')}`;` |
| `sectors` | `['All',...new Set(COMPANIES.map(c=>c.sector))].sort();` |
| `allStatuses` | `['All','Net-Zero Validated','Targets Validated','Targets Set','Committed','Removed','Under Review'];` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `nzValidated` | `COMPANIES.filter(c=>c.status==='Net-Zero Validated');` |
| `avgTemp` | `+(COMPANIES.reduce((s,c)=>s+c.tempScore,0)/ Math.max(1, COMPANIES.length)).toFixed(1);` |
| `redPct` | `Math.round((1-s.target2030/s.base2020)*100);` |
| `validatedPct` | `Math.round(validated.length/ Math.max(1, COMPANIES.length)*100);` |
| `nzPct` | `Math.round(nzValidated.length/ Math.max(1, COMPANIES.length)*100);` |
| `statusDist` | `{};COMPANIES.forEach(c=>{statusDist[c.status]=(statusDist[c.status]\|\|0)+1;});` |
| `sectorTempData` | `Object.values(sectorTemp).map(s=>({...s,avg:+(s.sum/s.n).toFixed(1)})).sort((a,b)=>a.avg-b.avg);` |
| `totalPortEmissions` | `COMPANIES.reduce((s,c)=>s+c.totalEmissions,0);` |
| `globalEmissions` | `40e9; // ~40 GtCO2e/yr` |
| `portfolioShare` | `totalPortEmissions/globalEmissions;` |
| `portfolioBudget` | `Math.round(cb.remainingGt*1e9*portfolioShare);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_BUDGETS`, `FLAG_COMMODITIES`, `METHODS`, `PIECLRS`, `SECTOR_PATHS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Near-term Target | `Sector SDA pathway` | SBTi | Required Scope 1+2+3 reduction by 2030 vs base year |
| Net-Zero Target | — | SBTi Net-Zero Standard | Science-based net-zero requiring near-complete decarbonisation |
| Residual Emissions | — | SBTi | Remaining emissions that must be neutralised with removals |
| Portfolio Coverage Target | — | SBTi FI | FIs must engage 67% of financed emissions companies |
- **Company base year emissions** → SDA pathway calculation → **Near-term target (tCO2e)**
- **Sector production data** → Budget allocation → **Company-specific reduction %**
- **Residual emissions estimate** → Removal requirement → **Neutralisation target**

## 5 · Intermediate Transformation Logic
**Methodology:** SBTi Sectoral Decarbonisation Approach
**Headline formula:** `Target = Sector_budget_2030 × CompanyShare_production`

SDA calculates company-specific reduction targets based on sector production share. Net-zero = ~90% absolute reduction vs base year + 5-10% removals. Engagement target for FIs: 67% of portfolio companies by emissions have SBTi by 2030.

**Standards:** ['SBTi Corporate Net-Zero Standard v1.2', 'SBTi SDA', 'GHG Protocol']
**Reference documents:** SBTi Corporate Net-Zero Standard v1.2; SBTi Sectoral Decarbonisation Approach; SBTi Financial Institutions Net-Zero Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The module correctly documents 4 real SBTi target-setting
> methodologies (`METHODS`, with accurate formulas — Absolute Contraction's 4.2%/yr minimum linear
> rate for 1.5C, the SDA convergence formula, Temperature Rating, Portfolio Coverage) and ships
> genuinely well-sourced reference data (`SECTOR_PATHS` — 10 sectors' real IEA NZE/MPP/GCCA/ICAO
> LTAG/IMO/CRREM/IAI/CEPI pathway intensities; `CARBON_BUDGETS` — real IPCC AR6 WG1 remaining
> carbon budget figures). **But no company's individual near-term/long-term target is actually
> computed via any of the 4 documented methods.** Every company's `nearTermS12`, `nearTermS3`,
> `longTermS3`, `scope1/2/3`, and `tempScore` are independent `sr()`-seeded random draws — the SDA
> convergence formula and Absolute Contraction linear-rate formula shown in the `METHODS` table are
> never applied to derive them.

### 7.1 What the module computes

**Company-level (synthetic, despite real company names via `SECURITY_UNIVERSE`):**
```
scope1  = 50,000 + sr(base+5) x 9,950,000
scope2  = 20,000 + sr(base+7) x 2,000,000
scope3  = scope1 x 2 + sr(base+9) x scope1 x 5
nearTermS12 = 25 + sr(base+11) x 30           // 25-55% by 2030 -- NOT derived from SECTOR_PATHS
nearTermS3  = 10 + sr(base+13) x 30
longTermS3  = 60 + sr(base+15) x 10           // ~67% per NZ Standard, hard-coded band
tempScore   = 1.3 + sr(base+17) x 2.0          // implied temperature, 1.3-3.3C
onTrack     = currentReduction >= (nearTermS12 x (2026-baseYear)/(2030-baseYear)) x 0.85
```
**Portfolio fair-share carbon budget (real, genuinely computed):**
```
totalPortEmissions = Sum(COMPANIES[i].totalEmissions)
globalEmissions     = 40e9 tCO2e/yr                          // hard-coded global annual estimate
portfolioShare       = totalPortEmissions / globalEmissions
portfolioBudget      = remainingGt x 1e9 x portfolioShare     // company/portfolio's "fair share" of the remaining global budget
```

### 7.2 Parameterisation

| Reference table | Content | Provenance |
|---|---|---|
| `CARBON_BUDGETS` (6 rows) | 1.5C@50%: 400Gt remaining, 1.5C@67%: 300Gt, 2C@50%: 1,150Gt, 2C@67%: 900Gt, 2.5C@50%: 2,300Gt — all cited `source: 'IPCC AR6 WG1'` | **Real, correctly cited IPCC AR6 WG1** remaining carbon budget figures (broadly matching AR6 Table SPM.2, which reports ~500Gt for 1.5C/50% and ~1,150Gt for 2C/50% from Jan 2020 — the module's figures are close approximations of the actual published table) |
| `SECTOR_PATHS` (10 sectors, 61 rows incl. milestones) | Power Generation 450→138 gCO2/kWh by 2030 (IEA NZE), Steel 1.85→1.18 tCO2/t (IEA NZE+MPP), Cement 0.61→0.42 (IEA NZE+GCCA), Aviation 90→72 gCO2/RPK (IEA NZE+ICAO LTAG), Shipping (IMO GHG Strategy), Buildings (IEA NZE+CRREM), Aluminium (IAI Roadmap), Pulp & Paper (CEPI Roadmap) | **Real, well-sourced sector decarbonisation pathway intensities**, correctly attributed to the actual industry-body roadmaps (IEA Net Zero Emissions scenario, Mission Possible Partnership, Global Cement and Concrete Association, ICAO Long-Term Aspirational Goal, IMO GHG Strategy, CRREM) |
| `METHODS` (4 rows) | Absolute Contraction (4.2%/yr min for 1.5C), SDA (`Target Intensity = Current + (Benchmark-Current) x (t/T)`), Temperature Rating, Portfolio Coverage | **Correct, real SBTi Criteria v5.1 formulas** — genuinely accurate methodology documentation |
| `COMPANIES` roster | 80 real equities filtered from `SECURITY_UNIVERSE` | Real company universe (not `sr()`-generated names), but each company's emissions/target fields are synthetic as shown in §7.1 |
| `globalEmissions` | 40 GtCO2e/yr | Reasonable order-of-magnitude approximation (real global GHG emissions ~53-57 GtCO2e/yr including all gases and LULUCF; 40Gt is closer to CO2-only, so this likely understates the true denominator by ~25-30%) |

### 7.3 Calculation walkthrough

1. **Sector pathways tab** correctly plots each sector's real IEA/MPP/GCCA/ICAO/IMO/CRREM/IAI/CEPI
   intensity trajectory from 2020 base to 2030/2050 targets — genuine reference data, no PRNG.
2. **Target-setting tab**: for each of the 80 real companies, `nearTermS12`/`nearTermS3` are drawn
   independently per §7.1 — **the SDA formula shown in `METHODS` is never invoked here**, so a
   Power-sector company's near-term target bears no relationship to the Power Generation sector's
   real 450→138 gCO2/kWh convergence pathway shown two tabs over.
3. **FLAG tab** (`FLAG_COMMODITIES`, 9 rows: commodity base/target2030/flagRate/deforestation
   target/land-use scope) follows the same pattern — plausible commodity-level reference structure,
   individual company FLAG exposure flagged via `sr()`.
4. **Carbon budget tab**: `portfolioBudget` (§7.1) is a genuinely computed **fair-share allocation**
   — the one place in the module where a company/portfolio-level number is derived through a real
   formula (global-budget-times-emissions-share) rather than fabricated outright, though the
   allocation is flat/global rather than sector-weighted as a rigorous SDA-style budget would
   require.

### 7.4 Worked example

Portfolio with `totalPortEmissions = 850,000,000 tCO2e` (aggregated Scope 1+2+3 across the 80
companies), evaluating the 1.5C/50%-probability budget (`remainingGt=400`):
```
portfolioShare  = 850,000,000 / 40,000,000,000 = 0.02125   (2.125% of global emissions)
portfolioBudget = 400 x 1e9 x 0.02125 = 8,500,000,000 tCO2e   (8.5 GtCO2e "fair share")
```
This tells the portfolio manager: at the current portfolio-wide emissions run-rate, the portfolio's
1.5C-consistent fair share of the remaining global carbon budget would be exhausted in
`8.5Gt / 0.85Gt/yr ≈ 10 years` from Jan 2020 (i.e. around 2030) — a genuinely useful, correctly
derived headline figure.

### 7.5 Data provenance & limitations

- `CARBON_BUDGETS`, `SECTOR_PATHS`, and `METHODS` are the module's strongest content: real,
  correctly-cited IPCC AR6 / IEA NZE / sector-body roadmap data and formulas.
- Individual company target/emissions fields are synthetic and **do not apply** the documented SDA
  or Absolute Contraction formulas — a company's displayed "near-term target %" cannot be traced
  back to its sector's real convergence pathway.
- `globalEmissions=40Gt` likely understates real total GHG emissions (~53-57Gt including all gases/
  LULUCF), which would overstate `portfolioShare` and thus overstate `portfolioBudget` allocations
  if global emissions figures are corrected to the fuller scope.
- FLAG (Forest, Land, Agriculture) commodity exposure is flagged per company via PRNG, not from
  actual sector/commodity-exposure classification data.

**Framework alignment:** SBTi Corporate Net-Zero Standard v1.2 and Criteria v5.1 (methodology
formulas correctly documented) · SBTi Sectoral Decarbonisation Approach (correctly documented
formula, not applied at the company level) · IPCC AR6 WG1 carbon budgets (correctly cited and used
in the fair-share calculation) · IEA Net Zero Emissions scenario / MPP / GCCA / ICAO LTAG / IMO GHG
Strategy / CRREM / IAI / CEPI sector roadmaps (correctly reproduced as reference pathways, not
linked to individual company targets) · SBTi FLAG Guidance (commodity structure correct, exposure
assignment synthetic).

## 9 · Future Evolution

### 9.1 Evolution A — Apply the documented methods to actual target derivation (analytics ladder: rung 1 → 2)

**What.** §7's split verdict: the reference layer is excellent — four real SBTi methods with accurate formulas (Absolute Contraction's 4.2%/yr 1.5°C minimum, SDA convergence, Temperature Rating, Portfolio Coverage), real IEA NZE/MPP/CRREM/ICAO sector pathway intensities, real IPCC AR6 carbon budgets — but no company's displayed target is computed by any of them; `nearTermS12`, `tempScore` etc. are independent `sr()` draws, and `globalEmissions = 40Gt` understates the full-scope ~53–57Gt, which would overstate portfolio budget allocations (§7.5). Evolution A turns the reference layer into a working calculator: user inputs in, method-derived targets out.

**How.** (1) `POST /api/v1/sbti-targets/derive`: given base-year emissions, sector, and target year, apply the selected method — Absolute Contraction as the linear-rate formula, SDA as convergence toward the sector's real `SECTOR_PATHS` intensity at the target year — returning the required reduction % with the formula's intermediate terms exposed (auditable target math, which is the whole point of "science-based"). (2) Fix the global-emissions constant to a cited full-scope figure with a scope note, correcting the portfolio-budget overstatement. (3) FLAG targets included where sector data supports them, or explicitly scoped out. (4) The seeded company registry replaced by the SBTi public dashboard export (shared ingest with `sbti-credibility-scorer`), so displayed statuses are real; derived-target calculations run on user-entered company data.

**Prerequisites.** Method formulas unit-tested against SBTi's published worked examples (the criteria documents include them); dashboard ingest. **Acceptance:** an Absolute Contraction 1.5°C target for 2030 from a 2024 base reproduces 4.2%/yr × 6 years; an SDA cement target converges to the GCCA pathway intensity; the portfolio-budget example recomputes under the corrected global figure.

### 9.2 Evolution B — Target-setting wizard copilot (LLM tier 2)

**What.** SBTi target setting is a methodology maze (near-term vs net-zero, SDA vs ACA eligibility, FLAG thresholds, FI portfolio-coverage rules). The copilot guides it: "we're a mid-cap cement producer with 2.1 MtCO₂e Scope 1+2 — which method applies, what does a validated 1.5°C near-term target require, and compute it", combining criteria navigation (tier-1 RAG over SBTi criteria documents) with derivation tool calls (`POST /derive`).

**How.** Method-eligibility answers cite SBTi criteria clauses (public documents, chunked); computed targets come exclusively from the derivation endpoint with intermediate terms shown, so the copilot can walk through the convergence math step by step — pedagogy grounded in real arithmetic. Boundary questions (FLAG threshold at 20% of emissions, Scope 3 requirement at 40%) evaluate the user's entered numbers against the cited rule. Guardrails: the copilot prepares target submissions but always states that validation is SBTi's determination; criteria versions are cited (SBTi revises criteria — vintage matters); no company-specific status claims beyond the ingested dashboard.

**Prerequisites.** Evolution A's derivation engine and tested formulas; criteria corpus with version metadata. **Acceptance:** computed targets in copilot answers match the endpoint's derivation exactly; every eligibility claim cites a criteria clause and version; validation-outcome promises are refused.