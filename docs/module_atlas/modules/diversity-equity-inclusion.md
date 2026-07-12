# DEI Analytics
**Module ID:** `diversity-equity-inclusion` · **Route:** `/diversity-equity-inclusion` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Workforce diversity metrics, pay gap analysis, and inclusion survey benchmarking across gender, ethnicity, disability, and seniority dimensions. Tracks progress against CSRD ESRS S1 workforce disclosure requirements and voluntary DEI targets. Peer benchmarking contextualises performance against sector comparators.

> **Business value:** Equips HR and sustainability leaders with the data needed to meet ESRS S1 workforce disclosure obligations and drive evidence-based DEI improvement. Pay gap analysis and inclusion benchmarking surface where intervention will have the greatest equity impact.

**How an analyst works this module:**
- Connect the HR information system to import headcount, grade, and pay data by demographic
- Configure peer benchmark comparators by sector and geography
- Review the DEI scorecard and identify the largest gaps relative to targets and peers
- Generate the ESRS S1 workforce diversity disclosure data pack for the sustainability statement

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COMPANY_NAMES`, `SECTORS`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `companies` | `Array.from({length:80},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);` |
| `trendData` | `Array.from({length:24},(_,i)=>({month:`M${i+1}`,avgFemaleBoard:+(22+i*0.4+sr(i*3)*2).toFixed(1),avgPayGap:+(18-i*0.25+sr(i*5)*1.5).toFixed(1),avgDeiScore:+(42+i*0.6+sr(i*7)*3).toFixed(1)}));` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createOb` |
| `filtered` | `useMemo(()=>{let d=[...companies];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorFilter!=='All')d=d.filter(r=>r.sector===sectorFilter);d=d.filter(r=>r.deiScore>=minDeiScore);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorFilter,sortCo` |
| `payFiltered` | `useMemo(()=>{let d=[...companies];if(paySearch)d=d.filter(r=>r.name.toLowerCase().includes(paySearch.toLowerCase()));d.sort((a,b)=>paySortDir==='asc'?(a[paySort]>b[paySort]?1:-1):(a[paySort]<b[paySort]?1:-1));return d;},[paySearch,paySort,paySortDir]); ` |
| `regFiltered` | `useMemo(()=>{let d=[...companies];if(regFilter!=='All'){if(regFilter==='EU')d=d.filter(r=>r.euPayTransparency!=='Gap');if(regFilter==='Parker')d=d.filter(r=>r.parkerReview==='Met');if(regFilter==='Hampton')d=d.filter(r=>r.hamptonAlexander==='Met');}d.sort((a,b)=>regSortDir==='asc'?(a[regSort]>b[regSort]?1:-1):(a[regSort]<b[regSort]?1:-1))` |
| `avgPayGap` | `+(companies.reduce((s,c)=>s+parseFloat(c.genderPayGap),0)/80).toFixed(1);` |
| `avgFemaleBoard` | `Math.round(companies.reduce((s,c)=>s+c.femaleBoard,0)/80);` |
| `avgDeiScore` | `Math.round(companies.reduce((s,c)=>s+c.deiScore,0)/80);` |
| `sectorDei` | `useMemo(()=>SECTORS.map(s=>{const cs=companies.filter(c=>c.sector===s);return {sector:s,avgDei:Math.round(cs.reduce((a,c)=>a+c.deiScore,0)/ Math.max(1, cs.length)),avgFemale:Math.round(cs.reduce((a,c)=>a+c.femaleTotal,0)` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COMPANY_NAMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Gender Pay Gap (Unadjusted) | — | Payroll system | Raw median pay difference between male and female employees across all roles and grades |
| Women in Senior Leadership | — | HR information system | Share of senior leadership positions (VP and above) held by women |
| Ethnicity Pay Gap | — | Payroll + diversity self-declaration | Median pay gap between majority and minority ethnic groups (where disclosure is voluntary) |
| Inclusion Index | — | Annual inclusion survey | Composite inclusion survey score across belonging, fairness, voice, and growth dimensions |
- **HR information system (headcount, grade, pay, demographic self-declaration)** → Demographic segmentation and pay distribution calculation by group and seniority band → **Unadjusted and adjusted pay gap by gender and ethnicity**
- **Inclusion survey platform** → Composite score calculation across belonging, fairness, voice, and growth dimensions → **Inclusion Index with trend vs. prior year and sector benchmark**
- **Peer benchmarking database (sector DEI metrics)** → Z-score normalisation for cross-company comparison → **Percentile rank vs. sector peers on each DEI dimension**

## 5 · Intermediate Transformation Logic
**Methodology:** Adjusted Pay Gap
**Headline formula:** `APG = (Median Male Pay − Median Female Pay) / Median Male Pay × 100`

The adjusted pay gap controls for role, seniority, and tenure to isolate the residual unexplained difference attributable to gender. The unadjusted gap measures raw median pay difference; both are required under ESRS S1 and the EU Pay Transparency Directive.

**Standards:** ['ESRS S1-16 Remuneration Metrics', 'UK Gender Pay Gap Reporting', 'EU Pay Transparency Directive 2023/970']
**Reference documents:** ESRS S1 (2023) Own Workforce â€” S1-6 Characteristics, S1-16 Remuneration; EU Pay Transparency Directive 2023/970; UK Gender Pay Gap Reporting Regulations 2017; SASB Human Capital â€” Employee Inclusion metrics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an *Adjusted Pay Gap* `APG = (Median Male −
> Median Female)/Median Male × 100` that "controls for role, seniority, and tenure to isolate the
> residual unexplained difference." **No regression-adjusted gap is computed.** The page draws all 80
> companies' DEI metrics — pay gaps, female representation, board composition, regulatory status — from
> the seeded PRNG `sr()`. The displayed "gender pay gap" is an *unadjusted* seeded value, not a
> role/seniority-controlled residual. Sections below document the synthetic scorecard.

### 7.1 What the module computes

```js
companies (80): per firm, all metrics seeded from s=sr(i·7), s2=sr(i·13), s3=sr(i·19), s4=sr(i·23):
  femaleTotal   = round(25 + s·30)      // % 25–55
  femaleBoard   = round(10 + s3·40)     // % 10–50
  genderPayGap  = (5 + s·20)            // % 5–25  (UNADJUSTED — drawn, not computed)
  medianPayF    = round(45000 + s·55000) ; medianPayM = round(50000 + s2·60000)
  ceoPayRatio   = round(80 + s2·250) ; bonusGap = 8 + s3·25
  deiScore      = round(30 + s·60)
  euPayTransparency / parkerReview / hamptonAlexander = sr() threshold → Compliant|Partial|Gap etc.
KPIs: avgPayGap = Σ genderPayGap / 80 ; avgFemaleBoard ; avgDeiScore (all /80)
```

Note the internal inconsistency: `medianPayF`/`medianPayM` are seeded *independently* of
`genderPayGap`, so the displayed pay gap does **not** equal `(medianPayM − medianPayF)/medianPayM`.

### 7.2 Parameterisation

| Metric | Range | Provenance |
|---|---|---|
| Female total / senior / board | 25–55 / 15–45 / 10–50 % | synthetic (`sr()`) |
| Gender pay gap | 5–25 % | synthetic |
| CEO pay ratio | 80–330× | synthetic |
| Ethnic minority / LGBTQ / disability | 8–43 / 2–8 / 1–6 % | synthetic |
| Regulatory flags | EU Pay Transparency, Parker Review, Hampton-Alexander | **real** frameworks, seeded status |
| Company names | 80 real multinationals | labels |

Regulatory frameworks referenced are real: the **UK Parker Review** (ethnic diversity on FTSE boards),
**Hampton-Alexander Review** (33% women on FTSE 350 boards), and the **EU Pay Transparency Directive
2023/970** — but each company's compliance status is a seeded draw.

### 7.3 Calculation walkthrough

`companies` seeds 80 rows once. Four tabs filter/sort/search: DEI scorecard (deiScore, female metrics),
pay equity (genderPayGap, bonusGap, ceoPayRatio, median pay), board & leadership (board size, female/
ethnic/independent directors, tenure), regulatory compliance (EU/Parker/Hampton-Alexander flags).
KPIs average pay gap, female board %, and DEI score across all 80 (or filtered) firms. A 24-month
`trendData` line shows improving female-board/DEI and narrowing pay gap (seeded with a linear drift +
`sr()` noise). A per-sector DEI aggregate radar rounds out the scorecard.

### 7.4 Worked example

Company i=0 (Accenture): `s = sr(0) = frac(sin(1)·10⁴) = 0.7099`.
- `femaleTotal = round(25 + 0.7099·30) = round(46.3) = 46%`.
- `genderPayGap = (5 + 0.7099·20).toFixed(1) = 19.2%`.
- `medianPayF = round(45000 + 0.7099·55000) = $84,045`; `medianPayM = round(50000 + sr(13)·60000)`.
  Because F and M medians use *different* seeds, `(M−F)/M` will **not** reproduce the 19.2% gap — the
  gap is an independent draw, exposing that no real pay-distribution calculation occurs.
- `deiScore = round(30 + 0.7099·60) = 73`.

### 7.5 Data provenance & limitations

- **Every DEI metric is synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); only company names and the
  named regulatory frameworks are real.
- The pay gap is unadjusted and internally inconsistent with the median-pay fields — the guide's
  role/seniority/tenure-adjusted residual is not implemented (would require a regression on real
  payroll microdata).
- Board/representation figures are drawn, not sourced from proxy statements or ISS/Refinitiv data.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page shows a "gender pay gap" with no
underlying pay-distribution model. A production DEI analytics engine must compute both the unadjusted
gap and the **regression-adjusted (explained vs unexplained) gap** the guide and the EU Pay
Transparency Directive require — the discipline behind Mercer/Willis Towers Watson pay-equity audits
and Oaxaca-Blinder decomposition.

**8.1 Purpose & scope.** From payroll microdata, compute per-entity unadjusted and adjusted pay gaps by
gender/ethnicity, an explained/unexplained decomposition, and ESRS S1-16 disclosure figures.

**8.2 Conceptual approach.** **Oaxaca-Blinder decomposition** on a log-pay regression — the standard
labour-economics method separating the gap into an "explained" part (differences in role, seniority,
tenure, hours) and an "unexplained" residual (the discrimination-consistent component). Benchmarks:
(a) Oaxaca (1973)/Blinder decomposition; (b) UK GPG statutory methodology (median + mean); (c) EU Pay
Transparency Directive's ">5% unexplained gap ⇒ joint pay assessment" rule.

**8.3 Mathematical specification.**
```
Unadjusted:  G_raw = (median_M − median_F) / median_M · 100
Regression:  ln(pay_i) = α + Σ βₖ Xₖᵢ + γ·Female_i + εᵢ      # X = grade, tenure, hours, function, location
Adjusted gap = 100·(1 − e^γ)                                 # residual gender effect, controls held equal
Oaxaca-Blinder:  Ḡ = [X̄_M − X̄_F]·β_M   +   X̄_F·(β_M − β_F)
                     └ explained ┘         └ unexplained ┘
Trigger: unexplained > 5% ⇒ mandatory joint pay assessment (EU Directive Art. 10)
```

| Parameter | Source |
|---|---|
| Pay & covariates | HRIS payroll microdata (grade, tenure, FTE, function) |
| Grade structure | internal job architecture |
| 5% threshold | EU Pay Transparency Directive 2023/970 Art. 10 |

**8.4 Data requirements.** Employee-level: `pay, gender, ethnicity, grade, tenure_yrs, fte_pct,
function, location`. Sources: HRIS export (needed); no synthetic substitute is acceptable for a
compliance figure.

**8.5 Validation & benchmarking.** Reconcile the unadjusted gap against the entity's statutory UK GPG
filing; sanity-check regression R² and coefficient stability; compare adjusted gaps against sector
benchmarks (Mercer). Backtest that flagged >5% unexplained gaps align with subsequent remediation.

**8.6 Limitations & model risk.** Omitted-variable bias inflates the "unexplained" residual (missing
performance/negotiation covariates); small subgroup n makes ethnicity gaps unstable → suppress below a
privacy threshold. Conservative fallback: report the statutory unadjusted gap when microdata is
insufficient for a stable regression, and label the adjusted gap "indicative".

**Framework alignment:** ESRS S1-16 (remuneration — requires both gender pay gap and CEO pay ratio),
EU Pay Transparency Directive 2023/970 (adjusted gap + >5% joint-assessment trigger), UK Gender Pay Gap
Regulations 2017 (statutory median/mean), Parker Review & Hampton-Alexander (board ethnic/gender
targets) — all named in the module but only the framework *labels*, not the computations, are present.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the pay gap instead of drawing it (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents both a fabrication and an internal inconsistency: all 80 companies' DEI metrics are `sr()`-seeded, and the displayed `genderPayGap` is drawn *independently* of the seeded `medianPayF`/`medianPayM` fields, so `(M−F)/M` does not reproduce the shown gap — proof no pay-distribution calculation exists. The guide's adjusted pay gap (role/seniority/tenure-controlled residual, required under ESRS S1-16 and EU Pay Transparency Directive 2023/970) is unimplemented. Evolution A builds the first backend vertical: real gap computation from workforce microdata.

**How.** (1) New tables `dei_workforce_records` (org-scoped: grade, tenure, gender, ethnicity, pay band) and `dei_survey_scores`; CSV/HRIS upload endpoint. (2) `services/dei_engine.py` computes the unadjusted median gap directly from the distribution (fixing the inconsistency by construction) and the adjusted gap via OLS on log-pay with role/seniority/tenure controls (statsmodels is already in the environment; model card per Atlas §8 convention — regulators will ask). (3) Benchmarking: replace seeded peer values with the UK Gender Pay Gap public dataset (gov.uk, ~10k employers, free) so percentile ranks are calibrated to observed reporting, earning rung 3. (4) Regulatory flags (Parker, Hampton-Alexander, EU PTD) become rule evaluations over computed metrics, not `sr()` threshold draws.

**Prerequisites.** Org-scoped RBAC on pay microdata (most sensitive table in the platform — D2 multi-tenancy hardening applies); demo dataset synthesized *transparently* (labeled synthetic, not seeded real-company names). **Acceptance:** unadjusted gap equals the median arithmetic on a fixture payroll exactly; adjusted gap reproduces a published statsmodels reference case; the 80 real-company seeded scorecard is removed.

### 9.2 Evolution B — ESRS S1 data-pack drafter with computed-figures-only contract (LLM tier 2)

**What.** The workflow the overview promises ("generate the ESRS S1 workforce diversity disclosure data pack") is an LLM-native deliverable: a tool-calling assistant that pulls Evolution A's computed metrics (S1-6 headcount characteristics, S1-16 remuneration ratios, adjusted/unadjusted gaps) and drafts the sustainability-statement narrative around them, mapping each figure to its ESRS datapoint ID from the refdata catalog already in the DB.

**How.** Tool surface = the new DEI engine's read endpoints plus `/api/v1/refdata` ESRS datapoint lookups; the draft renders through the report-studio layer per the roadmap's tier-3 output pattern. The no-fabrication validator is strict here: every percentage in the draft must match a tool output — a fabricated pay-gap figure in a regulated filing is the worst-case failure mode for this platform. Uncomputed datapoints render as explicit gaps ("S1-9 not yet collected"), mirroring the honest-nulls convention.

**Prerequisites (hard).** Evolution A shipped — there is currently nothing real to draft from, and the seeded scorecard attributes fabricated compliance statuses to named multinationals. **Acceptance:** a golden fixture produces a data pack where every numeric cross-checks against engine responses; missing survey data yields a disclosed gap, never an estimated Inclusion Index.