# DEI Analytics
**Module ID:** `diversity-equity-inclusion` · **Route:** `/diversity-equity-inclusion` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Workforce diversity metrics, pay gap analysis, and inclusion survey benchmarking across gender, ethnicity, disability, and seniority dimensions. Tracks progress against CSRD ESRS S1 workforce disclosure requirements and voluntary DEI targets. Peer benchmarking contextualises performance against sector comparators.

> **Business value:** Equips HR and sustainability leaders with the data needed to meet ESRS S1 workforce disclosure obligations and drive evidence-based DEI improvement. Pay gap analysis and inclusion benchmarking surface where intervention will have the greatest equity impact.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COMPANY_NAMES`, `SECTORS`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `companies` | `Array.from({length:80},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);` |
| `trendData` | `Array.from({length:24},(_,i)=>({month:`M${i+1}`,avgFemaleBoard:+(22+i*0.4+sr(i*3)*2).toFixed(1),avgPayGap:+(18-i*0.25+sr(i*5)*1.5).toFixed(1),avgDeiSc` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].joi` |
| `avgPayGap` | `+(companies.reduce((s,c)=>s+parseFloat(c.genderPayGap),0)/80).toFixed(1);` |
| `avgFemaleBoard` | `Math.round(companies.reduce((s,c)=>s+c.femaleBoard,0)/80);` |
| `avgDeiScore` | `Math.round(companies.reduce((s,c)=>s+c.deiScore,0)/80);` |
| `sectorDei` | `useMemo(()=>SECTORS.map(s=>{const cs=companies.filter(c=>c.sector===s);return {sector:s,avgDei:Math.round(cs.reduce((a,c)=>a+c.deiScore,0)/ Math.max(1` |

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
**Standards:** ['ESRS S1-16 Remuneration Metrics', 'UK Gender Pay Gap Reporting', 'EU Pay Transparency Directive 2023/970']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).