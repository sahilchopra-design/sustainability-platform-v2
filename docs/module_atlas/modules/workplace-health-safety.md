# Workplace Health & Safety
**Module ID:** `workplace-health-safety` · **Route:** `/workplace-health-safety` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
WHS incident analytics platform tracking LTIFR, TRIR, fatality rates and near-miss incidents with benchmarking against sector peers and GRI 403 regulatory reporting.

> **Business value:** Globally 2.3 million workers die annually from work-related causes (ILO); companies with mature safety cultures outperform peers financially by 3–5% on total shareholder return (MSCI Safety Study 2022).

**How an analyst works this module:**
- Collect incident data from operational safety management systems
- Compute LTIFR, TRIR and fatality rate against hours worked
- Benchmark against sector peers using ILO and IOGP data
- Identify high-risk sites and causal factors
- Report against GRI 403, ESRS S1 and national regulatory requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BENCHMARKS`, `COMPANIES`, `INCIDENT_TYPES`, `KPI`, `PAGE_SIZE`, `RATINGS`, `REGIONS`, `SECTORS`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `INCIDENT_TYPES` | 10 | `type`, `count`, `pct` |
| `BENCHMARKS` | 8 | `sector`, `ltir`, `trir`, `fatRate` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#ea580c';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;` |
| `INCIDENT_TYPES` | `[{type:'Slips/Falls',count:245,pct:22},{type:'Struck By Object',count:198,pct:18},{type:'Overexertion',count:165,pct:15},{type:'Equipment Contact',count:143,pct:13},{type:'Chemical Exposure',count:110,pct:10},{type:'Vehi` |
| `TREND` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgLtir:+(2.5-i*0.03+sr(i*7)*0.5).toFixed(2),avgTrir:+(4.5-i*0.05+sr(i*11)*0.8).toFixed(2),fatalities:Math.round(sr(i*1` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(secF!=='All')d=d.filter(r=>r.sector===secF);if(regF!=='All')d=d.filter(r=>r.region===regF);if(ratF!=='All')d=d.filter(r=>r.safetyRating===ratF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?` |
| `kpis` | `useMemo(()=>{const avgN=(k)=>+(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length)).toFixed(2);const totalFat=COMPANIES.reduce((s,c)=>s+c.fatalities,0);const avgScore=Math.round(COMPANIES.reduce((s,c)=>s+c.s` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgLtir:0,avgTrir:0,n:0};m[c.sector].avgLtir+=c.ltir;m[c.sector].avgTrir+=c.trir;m[c.sector].n++;});return Object.values(m).map(s` |
| `ratingDist` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.safetyRating]=(m[c.safetyRating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length));return[{dim:'Safety Score',value:avg('safetyScore')},{dim:'Training',value:avg('trainingHours')*2},{dim:'PPE Compli` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENCHMARKS`, `INCIDENT_TYPES`, `RATINGS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LTIFR | — | Incident Register | Lost time injury frequency rate per million hours worked; sector median 2.4 (manufacturing). |
| TRIR | — | Incident Register | Total recordable incident rate per million hours; includes injuries requiring medical treatment beyond first aid. |
| Fatalities (YTD) | — | Incident Register | Year-to-date workplace fatalities; zero is the universal target; any fatality triggers mandatory investigation. |
- **Safety Management System Incident Data, HR Hours Worked, Near-Miss Reports** → LTIFR/TRIR computation + benchmarking + root cause analytics → **Safety performance dashboard, GRI 403 disclosures, ESRS S1 reporting, regulatory filings**

## 5 · Intermediate Transformation Logic
**Methodology:** Lost Time Injury Frequency Rate
**Headline formula:** `LTIFR = (Lost Time Injuries × 1,000,000) / Hours Worked`

Industry-standard injury rate normalised per million hours worked; primary lagging indicator for workforce safety performance.

**Standards:** ['GRI 403: Occupational Health and Safety 2018', 'ILO R194 Safety and Health']
**Reference documents:** GRI 403: Occupational Health and Safety 2018; ILO R194 List of Occupational Diseases 2019; IOGP Safety Performance Indicators 2023; ESRS S1: Own Workforce

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula (`LTIFR = (Lost Time Injuries × 1,000,000) /
> Hours Worked`) is the industry-standard construction. **It is never computed.** `ltir` and `trir`
> are independent random fields per company — there is no `lostTimeInjuries` count or `hoursWorked`
> denominator anywhere in the file for the ratio to be derived from.

### 7.1 What the module computes

78 real, named industrial/extractives companies (BHP, Rio Tinto, ExxonMobil, Shell, ArcelorMittal,
Caterpillar, Bechtel, etc.) across sectors (secs[i]) and regions, each with independently-seeded:
`ltir` (0.2–4.7), `trir` (0.5–8.5), `fatalities` (0–5), `nearMisses`, `lostDays`, `employees`,
`safetySpend`, `trainingHours`, `inspections`, `violations`, `safetyScore` (20–95), `isoCompliance`
(bool), `mentalHealth`/`ergonomics`/`ppeCompliance` scores, `incidentTrend` (Improving/Stable/
Worsening), `safetyRating` (6-tier, from a *separate* draw of the same seed `sr(i·7)` used for
`ltir` — see §7.4), `severity`, `processEvents`, `contractorRate`.

```js
kpis.avgLtir = Σ ltir / n     // portfolio mean of the random ltir field
kpis.totalFat = Σ fatalities
kpis.avgScore = round(Σ safetyScore / n)
kpis.improving = count(incidentTrend === 'Improving')
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `ltir` | 0.2–4.7 | `sr(i·7)×4.5+0.2`, synthetic |
| `trir` | 0.5–8.5 | `sr(i·11)×8+0.5`, synthetic |
| `BENCHMARKS` (8 sectors) | Mining ltir 2.8/trir 5.2/fatRate 0.012 → Utilities ltir 1.0/trir 2.2/fatRate 0.002 | Static, plausible relative ordering (Mining highest, Utilities/Chemicals lowest) consistent with real IOGP/ILO sector safety-performance rankings, but not sourced to a specific published dataset row |
| `TREND` (36 months) | `avgLtir = 2.5 − month×0.03 + noise` | Synthetic gently-declining trend, illustrative of an improving-safety narrative rather than a real fleet trend |

### 7.3 Calculation walkthrough

1. `kpis`, `sectorChart` (per-sector mean `ltir`/`trir`), and `radarData` (6-axis average across
   safety/training/PPE/mental-health/ergonomics/ISO-certification-rate) all aggregate `COMPANIES`
   with simple, correctly-implemented means and counts — the *aggregation* logic is sound, only the
   underlying per-company `ltir`/`trir` inputs are unfounded.
2. **Company table** colour-codes `ltir` (`badge(r.ltir,[1,2,3.5])`) and `trir`
   (`badge(r.trir,[2,4,6])`) against fixed thresholds — a genuine, if arbitrarily-chosen, tiering
   rubric.
3. **Sector Benchmarks tab** renders the static `BENCHMARKS` table directly against `COMPANIES`'
   sector averages, letting a user visually compare a synthetic per-company figure against a
   plausible-but-uncited sector reference — a comparison that looks evidentiary but isn't, since
   both sides ultimately trace back to author judgement rather than a shared real dataset.

### 7.4 A data-quality note: `safetyRating` reuses the `ltir` seed

```js
ltir: +(sr(i*7)*4.5+0.2).toFixed(2)
...
safetyRating: sr(i*7)<0.1?'Critical': sr(i*7)<0.25?'Poor': ... :'Excellent'
```

Both `ltir` and `safetyRating` are derived from the **same** `sr(i·7)` draw. This means `safetyRating`
is **perfectly monotonically determined by `ltir`** — a company's letter-grade rating never needs the
`trir`, `fatalities`, or `violations` fields at all, despite those fields nominally contributing to
overall safety performance. This is a subtler design flaw than a fully independent random field: it
creates an illusion of a richer multi-factor rating while the rating is actually single-factor.

### 7.5 Data provenance & limitations

- **All 78 companies' `ltir`/`trir`/`fatalities`/etc. are synthetic**, though attached to real company
  names, which risks a reader mistaking a random number for that company's actual disclosed safety
  record.
- **No LTIFR/TRIR formula exists** — the guide's core methodology (injuries × 1,000,000 / hours
  worked) requires two inputs (`lostTimeInjuries`, `hoursWorked`) neither of which exists in the data
  model at all.
- **`safetyRating` is single-factor despite appearing multi-dimensional** (§7.4) — a genuine
  implementation defect worth fixing regardless of whether the underlying data becomes real.
- `BENCHMARKS`' 8-sector table, while plausible, is not cited to IOGP Safety Performance Indicators
  or any other specific named source, despite the guide citing IOGP directly.

**Framework alignment:** GRI 403 (Occupational Health and Safety, 2018) and ILO R194 (both named in
the guide) define the *concepts* (LTIFR, TRIR, fatality rate) correctly labelled in the UI, but the
actual GRI 403 calculation methodology (injury counts over exposure hours) is not implemented — the
displayed figures are not currently GRI 403-compliant metrics, just plausibly-ranged random numbers
with the right units and labels.

## 9 · Future Evolution

### 9.1 Evolution A — LTIFR/TRIR computed from incident counts and hours worked (analytics ladder: rung 1 → 2)

**What.** The guide's industry-standard formula (`LTIFR = injuries × 1,000,000 /
hours worked`) is never computed — §7 flags that no `lostTimeInjuries` or
`hoursWorked` field even exists, so `ltir`/`trir` are unfounded random draws attached
to 78 real company names (BHP, Shell, ArcelorMittal), which §7.5 warns readers could
mistake for actual disclosed safety records. §7.4 documents a subtler defect:
`safetyRating` reuses the same `sr(i·7)` seed as `ltir`, making the six-tier rating
perfectly single-factor while appearing multi-dimensional. Evolution A builds the data
model the formula needs: an incident register (`whs_incidents`: entity, date, type,
severity, lost days) and exposure-hours field per entity-period, from which LTIFR,
TRIR, and fatality rate are derived; a genuinely multi-factor `safetyRating` from
weighted LTIFR/TRIR/fatalities/violations; and the `BENCHMARKS` table cited to IOGP
Safety Performance Indicators (the guide names it; the constants should reference the
published table with a vintage).

**How.** Backend vertical (module is Tier B, no EP code): `POST /incidents`,
`GET /rates` in a new `whs` route with an Alembic migration; company records become
seeded fixtures with a demo-data banner replacing the real-name illusion, or names
are anonymised. The correctly implemented aggregation layer (§7.3 credits it) stays.

**Prerequisites.** The seed-reuse defect and the real-names-random-data risk both
acknowledged; incident-type taxonomy aligned with the existing 10-row
`INCIDENT_TYPES`. **Acceptance:** entering 3 lost-time injuries against 1.5M hours
yields LTIFR 2.0 on the page; safetyRating changes when fatalities change with LTIFR
held constant; every benchmark row cites its source.

### 9.2 Evolution B — GRI 403 reporting copilot with incident intake (LLM tier 2)

**What.** GRI 403 and ESRS S1 reporting is where this module's users end up, and the
inputs arrive as messy incident narratives. Evolution B has two halves. Intake: the
copilot parses free-text incident reports ("contractor slipped on scaffold, 4 days
lost") into the structured `whs_incidents` schema — type classification against the
10-category taxonomy, severity, lost days — with human confirmation before `POST
/incidents` runs (mutation gated per the tier-2 pattern). Reporting: "draft our GRI
403-9 disclosure for FY2026" calls `GET /rates`, benchmarks against the IOGP-cited
sector table, and produces the disclosure text with every rate traceable to the
register — including the mandatory methodology statement (per-million-hours basis)
the current page can't honestly make.

**How.** Tier-2 stack: tool schemas from Evolution A's routes; grounding corpus is
this Atlas page plus GRI 403 requirement definitions. Classification accuracy is
evaluated on a fixture set before intake ships; misclassified severity is the risk
that justifies the confirm step.

**Prerequisites (hard).** Evolution A's register and computed rates — drafting GRI
403 disclosures from random `ltir` fields would fabricate regulated safety metrics;
RBAC since incident data is sensitive personal-adjacent data. **Acceptance:** every
rate in a drafted disclosure recomputes from register rows; intake never writes
without user confirmation; asked for a company's real-world LTIFR, the copilot
distinguishes platform register data from public disclosures.