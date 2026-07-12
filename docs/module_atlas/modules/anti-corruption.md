# Anti-Corruption Analytics
**Module ID:** `anti-corruption` · **Route:** `/anti-corruption` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Bribery and corruption risk scoring for portfolio companies and sovereign counterparties using Transparency International CPI, World Bank CPIA governance indicators, and UNGC Principle 10 alignment. Tracks corruption-related controversies, enforcement actions, and FCPA/UK Bribery Act exposure. Scores companies on anti-bribery management system maturity against ISO 37001.

> **Business value:** Corruption risk is a material ESG concern for institutional investors due to legal liability under FCPA and UK Bribery Act, reputational contagion, and the correlation between high corruption environments and governance failures that precede value destruction. CRI scoring enables systematic portfolio screening and targeted engagement with high-risk holdings.

**How an analyst works this module:**
- Portfolio Corruption Risk tab ranks holdings by CRI composite score
- Country Risk Heatmap shows CPI scores for all operating jurisdictions
- Controversy Feed surfaces bribery and enforcement alerts with severity
- UNGC Principle 10 tab checks alignment of company anti-corruption policy
- ABMS Maturity tab scores ISO 37001 control implementation
- Scenario Analysis models portfolio CRI impact of entering new high-risk markets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMPANIES`, `COUNTRIES`, `ENFORCEMENT`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `REGIONS`, `RISK_LEVELS`, `SECTORS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `ENFORCEMENT` | `(()=>{const cases=[{company:'Airbus SE',law:'Sapin II / FCPA',jurisdiction:'France/US/UK',fine:4000,dpa:'DPA',year:2020,sector:'Aerospace'},{company:'Goldman Sachs',law:'FCPA / 1MDB',jurisdiction:'US/Malaysia',fine:2900,` |
| `TREND` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,actions:Math.round(12+sr(i*7)*25),fines:Math.round(100+sr(i*13)*900),investigations:Math.round(8+sr(i*17)*18),convictio` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sector!=='All')d=d.filter(r=>r.sector===sector);if(region!=='All')d=d.filter(r=>r.region===region);if(riskLvl!=='All')d=d.filter(r=>r.riskRating===riskLvl);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]` |
| `cFiltered` | `useMemo(()=>{let d=[...COUNTRIES];if(cSearch)d=d.filter(r=>r.country.toLowerCase().includes(cSearch.toLowerCase()));d.sort((a,b)=>cDir==='asc'?(a[cSort]>b[cSort]?1:-1):(a[cSort]<b[cSort]?1:-1));return d;},[cSearch,cSort,cDir]); ` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);` |
| `cPaged` | `cFiltered.slice((cPage-1)*PAGE_SIZE,cPage*PAGE_SIZE);` |
| `ePaged` | `eFiltered.slice((ePage-1)*PAGE_SIZE,ePage*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `cTotalPages` | `Math.ceil(cFiltered.length/PAGE_SIZE);` |
| `eTotalPages` | `Math.ceil(eFiltered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);const critical=COMPANIES.filter(c=>c.riskRating==='Critical'\|\|c.riskRating==='Very High').length;const totalFines=ENFORCEMENT.red` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,count:0,avgRisk:0};m[c.sector].count++;m[c.sector].avgRisk+=c.corruptionRisk;});return Object.values(m).map(s=>({...s,avgRisk:Mat` |
| `riskDist` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.riskRating]=(m[c.riskRating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `regionChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,count:0,avgRisk:0,avgFcpa:0};m[c.region].count++;m[c.region].avgRisk+=c.corruptionRisk;m[c.region].avgFcpa+=c.fcpaCompliance;});r` |
| `radarData` | `useMemo(()=>{const dims=['fcpaCompliance','ukBriberyAct','trainingRate','dueDialCoverage','controlEffectiveness','thirdPartyRisk'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return dims` |
| `fineByYear` | `useMemo(()=>{const m={};ENFORCEMENT.forEach(c=>{const y=c.year;if(!m[y])m[y]={year:y,total:0,count:0};m[y].total+=c.fine;m[y].count++;});return Object.values(m).sort((a,b)=>a.year-b.year);},[]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIECLRS`, `REGIONS`, `RISK_LEVELS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transparency International CPI | — | TI CPI 2024 | Perceived corruption score; 0=highly corrupt, 100=very clean. Below 50 = elevated risk |
| FCPA Enforcement Fine | — | DOJ/SEC enforcement database | Average FCPA settlement for portfolio sector; proxy for enforcement intensity |
| ABMS Maturity Score | `ISO 37001 readiness` | Company disclosure | Anti-bribery management system readiness across 10 ISO 37001 controls |
- **TI CPI and World Bank CPIA data** → Normalise and weight into CRI; map to portfolio country exposure → **Per-company CRI score with country and controversy decomposition**
- **DOJ/SEC enforcement database + news feeds** → NER extracts company enforcement actions; normalise by revenue → **Enforcement score component and live controversy alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** CPI-weighted corruption risk composite
**Headline formula:** `CRI = 0.40×(100–CPI_score) + 0.30×Controversy_score + 0.20×Enforcement_score + 0.10×ABMS_maturity`

Corruption Risk Index (CRI) inverts CPI (lower CPI = higher risk). Controversy score aggregates media and regulatory alerts on bribery incidents. Enforcement score captures FCPA/Bribery Act fines normalized by revenue. ABMS maturity scores anti-bribery management systems on 0–100 ISO 37001 readiness scale.

**Standards:** ['UNGC Principle 10', 'ISO 37001:2016 ABMS', 'FCPA/UK Bribery Act']
**Reference documents:** Transparency International CPI 2024; UNGC Principle 10 Anti-Corruption Guidance; ISO 37001:2016 Anti-Bribery Management Systems; DOJ FCPA Resource Guide

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a composite
> `CRI = 0.40×(100−CPI) + 0.30×Controversy + 0.20×Enforcement + 0.10×ABMS_maturity`. **No such
> composite exists in the code.** Company `corruptionRisk` is a direct PRNG draw, the country
> `cpi` field is random (not Transparency International data), there is no controversy feed, no
> ABMS/ISO 37001 maturity scoring, and enforcement fines are never normalised by revenue or folded
> into a score. The module is a *screening dashboard over three seeded/curated tables* — its one
> genuinely valuable dataset is a 30-case enforcement table of **real historical FCPA/UKBA
> settlements with accurate fines**. The sections below document the code as shipped.

### 7.1 What the module computes

Three module-level datasets, built once with `sr(s) = frac(sin(s+1)×10⁴)`:

- **`COMPANIES` (80 rows)** — real company names (Siemens, Glencore, Airbus, Petrobras …) with
  hand-assigned sector/region and 13 random metrics:
  `corruptionRisk = round(15 + sr(i·7)·75)` (15–90), `fcpaCompliance = round(40 + sr(i·11)·55)`,
  `ukBriberyAct`, `pepExposure`, `countryRisk`, `thirdPartyRisk`, `giftEntertainment`,
  `whistleblower`, `trainingRate`, `dueDialCoverage` (sic — due-diligence coverage),
  `fineHistory` (0–2000 $M), `enforcementActions` (0–7), `controlEffectiveness`. The
  `riskRating` label re-uses the *same* seed as `corruptionRisk`:
  `sr(i·7) < 0.15 → Critical, < 0.35 → Very High, < 0.55 → High, < 0.75 → Elevated, < 0.9 →
  Moderate, else Low` — so rating and score are consistent by construction.
- **`COUNTRIES` (50 rows)** — high-risk jurisdictions (Venezuela → Zimbabwe) with random
  `cpi = round(10 + sr(i·7)·55)` and 10 further governance scores (bribery, procurement, judicial
  independence, press freedom, rule of law, PEP risk, money laundering …); `rating` again derives
  from the `sr(i·7)` seed so it tracks the CPI draw.
- **`ENFORCEMENT` (30 rows, hand-curated, real)** — landmark cases with law, jurisdiction, fine
  ($M), disposition and year: Airbus (Sapin II/FCPA, $4,000M, 2020), BNP Paribas (Sanctions,
  $8,900M, 2014), Odebrecht (Lava Jato, $3,500M, 2016), Goldman/1MDB ($2,900M, 2020),
  HSBC AML ($1,900M, 2012), Siemens ($1,600M, 2008), Glencore ($1,500M, 2022), etc. These match
  public DOJ/SEC/SFO records. Random fields are appended per case (monitor duration 1–4 yrs,
  compliance-reform flag, recidivism, investigation length).
- **`TREND` (36 months)** — random monthly enforcement actions/fines/investigations/convictions.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Risk-rating cutpoints | 0.15/0.35/0.55/0.75/0.90 on the uniform seed | Synthetic — implies 15 % Critical, 20 % Very High, 20 % High, 20 % Elevated, 15 % Moderate, 10 % Low |
| Company score ranges | risk 15–90, FCPA compliance 40–95, training 40–98, control effectiveness 25–95 | Synthetic demo ranges |
| Country CPI range | 10–65 | Random; real TI CPI for these countries runs ≈ 13 (Venezuela/Syria) to ≈ 43 (South Africa) — the range is plausible, the values are not real |
| Enforcement fines | 30 hardcoded $M values | **Real public settlement amounts** (verifiable against DOJ/SEC releases) |
| Page size | 15 rows per table | UI constant |

### 7.3 Calculation walkthrough

1. **Dashboard KPIs** — `avgRisk`, `avgFcpa`, `avgTraining` are simple means over 80 companies;
   `critical` counts Critical + Very High ratings; `totalFines = Σ fine` over the 30 cases
   (= $34.9Bn+, displayed via `fmt(kpis.totalFines×1e6)`).
2. **Charts** — sector bar (mean risk + count per sector), risk-rating donut, region bar (mean
   risk & FCPA per region), a 6-dimension compliance radar (means of fcpaCompliance, ukBriberyAct,
   trainingRate, dueDialCoverage, controlEffectiveness, thirdPartyRisk), fines-by-year aggregation
   of the enforcement table, and the 36-month random trend.
3. **Company Screening tab** — search + sector/region/risk-level filters, sortable columns
   (spread-before-sort `[...COMPANIES]`, so no mutation), paginated 15/page, expandable rows.
4. **Country Risk tab** — searchable/sortable country table (default sort: CPI ascending = worst
   first).
5. **Enforcement Cases tab** — searchable by company or law, default sorted by fine descending;
   expandable case detail with the appended monitor/reform fields.
6. **CSV export** — generic serialiser for any of the three tables.

### 7.4 Worked example (company i = 0, GlobalBank Holdings)

| Step | Computation | Result |
|---|---|---|
| Seed | `sr(0) = frac(sin(1)·10⁴)` | 0.8415 |
| corruptionRisk | `round(15 + 0.8415·75)` | **78** |
| riskRating | 0.8415 ∈ [0.75, 0.90) | **Moderate** |
| fcpaCompliance | `round(40 + sr(0)·55)` (seed `0·11 = 0` collides) | **86** |
| Dashboard contribution | 78 enters `avgRisk`; "Moderate" not counted in `critical` | — |

Note the interpretive quirk: a 78/100 corruption risk draws the *Moderate* label because rating
follows the seed's uniform position, not published thresholds — at i = 0 every `i·k` seed
collapses to `sr(0)`, correlating all of this company's metrics.

### 7.5 Data provenance & limitations

- **Company and country scores are synthetic** (`sr()` draws on real names); no TI CPI, World Bank
  CPIA/WGI, or RepRisk data is loaded despite the guide citing them. Screening a real portfolio is
  therefore illustrative only.
- **The enforcement table is real, hand-curated public data** — the most defensible content in the
  module — though the appended monitor/recidivism fields are random.
- No composite CRI, no revenue normalisation of fines, no controversy ingestion, no ISO 37001
  control-level assessment; the radar shows means of random inputs.
- Country list covers only high-risk jurisdictions (no OECD baseline), so regional comparisons
  are one-sided.
- No backend; tables are frozen at module load.

### 7.6 Framework alignment

- **Transparency International CPI** — the real index aggregates 13 expert surveys into a 0–100
  perceived-corruption score (higher = cleaner), rescaled and averaged with standard-error
  bounds. The module's `cpi` mimics the scale only.
- **FCPA / UK Bribery Act** — the enforcement table correctly reflects the two regimes' landmark
  outcomes and disposition types (DPA, guilty plea, settlement); UKBA §7's "failure to prevent"
  corporate offence is why compliance-programme scores matter in practice.
- **ISO 37001:2016 (ABMS)** — the guide's maturity scoring concept (leadership, risk assessment,
  due diligence, controls, monitoring clauses 4–10) is unimplemented; `trainingRate`,
  `dueDialCoverage` and `controlEffectiveness` are the placeholder columns for it.
- **UNGC Principle 10** — "businesses should work against corruption in all its forms" — the
  module's screening framing aligns, without any policy-content checks.

## 9 · Future Evolution

### 9.1 Evolution A — Real CRI composite from TI CPI and enforcement data (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's composite
`CRI = 0.40×(100−CPI) + 0.30×Controversy + 0.20×Enforcement + 0.10×ABMS_maturity` **does not
exist**: company `corruptionRisk` is a direct PRNG draw, the country `cpi` field is random (not
Transparency International data), there is no controversy feed, no ISO 37001 maturity scoring, and
enforcement fines are never normalised by revenue. The module's one genuinely valuable asset is a
30-case enforcement table of **real, verifiable FCPA/UKBA settlements** (Airbus $4,000M, BNP
Paribas $8,900M, Odebrecht $3,500M — matching public DOJ/SEC/SFO records). Evolution A builds the
guide's real CRI: ingest actual TI CPI and World Bank WGI/CPIA scores by country, normalise
enforcement fines by revenue, and compute the four-component weighted composite with a genuine ISO
37001 ABMS maturity input.

**How.** A `corruption_risk_engine` with `POST /api/v1/anti-corruption/cri` (company + country
exposure + ABMS self-assessment → CRI, component decomposition) and `GET /ref/cpi` +
`/ref/enforcement` (the real enforcement table promoted to a cited reference dataset); TI CPI and
WGI seeded from their public annual releases. Rung 3: calibrate the enforcement-score normalisation
against the DOJ/SEC settlement distribution the table already contains.

**Prerequisites (hard).** Purge the `sr()` company/country draws per the no-fabricated-random
guardrail; fix the small-index seed collisions (GlobalBank's fields all reuse `sr(0)`, §7.4);
source real CPI values (the current 10–65 range is plausible but fabricated). **Acceptance:** a
company's CRI recomputes from its country CPI, controversy count, revenue-normalised fines and ABMS
maturity (not a single draw); the enforcement table's real fines feed the enforcement component;
raising a country's CPI lowers its contribution to CRI.

### 9.2 Evolution B — Bribery-risk screening copilot over the enforcement corpus (LLM tier 1 → 2)

**What.** A copilot answering "which holdings have the highest corruption risk and why?", "what
happened in the Airbus FCPA case?" (the real enforcement table is ideal RAG grounding), and "how
does entering this high-risk market change portfolio CRI?" — grounded in the page's screening tables
and the enforcement corpus. Since company/country scores are synthetic today, the tier-1 copilot
must state that CRI figures are demo draws and only the enforcement cases are real.

**How.** Tier-1 roadmap pattern: the 30-case enforcement table (real, hand-curated) plus §7.2
parameters and §7.6 framework alignment (TI CPI, FCPA/UKBA, ISO 37001, UNGC Principle 10) embedded
as the module corpus; page state (filtered companies, selected country) as context; served via
`POST /api/v1/copilot/anti-corruption/ask` with the standard refusal path. After Evolution A,
graduates to tier 2 by tool-calling `POST /cri` for real scenario analysis ("model CRI impact of a
Nigeria entry"), with the no-fabrication validator checking every score and fine.

**Prerequisites.** Atlas + enforcement corpus embedded (roadmap D3); grounding carries the §7
mismatch note so the copilot never presents random `corruptionRisk` as a computed CRI.
**Acceptance:** every enforcement fact cited matches the real case table; every CRI figure is
flagged synthetic until Evolution A; a request for a revenue-normalised enforcement score before
Evolution A returns a refusal naming the absent composite.