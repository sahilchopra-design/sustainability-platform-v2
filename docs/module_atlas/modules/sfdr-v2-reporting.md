# SFDR v2 Reporting
**Module ID:** `sfdr-v2-reporting` · **Route:** `/sfdr-v2-reporting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Updated SFDR Level 2 RTS reporting covering all 18 mandatory and additional PAI indicators, product-level Article 8/9 disclosure templates, and sustainable investment substantiation.

> **Business value:** Implements the full SFDR Level 2 RTS reporting cycle for Article 8/9 products including PAI statements and sustainable investment substantiation.

**How an analyst works this module:**
- Classify products as Article 6/8/9 and configure product-level disclosure templates.
- Collect and validate data for all 18 mandatory PAI indicators per Annex I.
- Calculate sustainable investment ratios and substantiate DNSH (Do No Significant Harm) assessments.
- Produce periodic and annual SFDR product disclosure documents and website statements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `FUNDS`, `PAI_INDICATORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['PAI Dashboard','Fund Screening','Pre-contractual','Periodic Reports'];const CLASSF=['All','Article 6','Article 8','Article 8+','Article 9'];const PAGE=12;const PERIODS=['H1 2024','H2 2023','H1 2023','FY 2023'];` |
| `PAI_INDICATORS` | `['GHG Emissions','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure','Non-Renewable Energy','Energy Intensity','Biodiversity Impact','Water Emissions','Hazardous Waste','UNGC/OECD Violations','Lack of Compliance Me` |
| `cls` | `['Article 6','Article 8','Article 8','Article 8+','Article 9','Article 9','Article 8+','Article 8','Article 8','Article 8+','Article 8','Article 9','Article 8+','Article 8','Article 9','Article 8','Article 8','Article 8+` |
| `aumBn` | `+(sr(i*7)*50+0.5).toFixed(1);const paiScore=Math.round(sr(i*11)*40+50);const taxAligned=Math.round(sr(i*13)*60+10);const sustInvest=Math.round(sr(i*17)*50+10);const dnsh=Math.round(sr(i*19)*30+60);` |
| `paiValues` | `PAI_INDICATORS.map(p=>({indicator:p,value:+(sr(i*100+PAI_INDICATORS.indexOf(p)*7)*100).toFixed(1),coverage:Math.round(sr(i*100+PAI_INDICATORS.indexOf(p)*11)*40+50)}));` |
| `filtered` | `useMemo(()=>{let d=[...FUNDS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(clsF!=='All')d=d.filter(r=>r.classification===clsF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,clsF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1` |
| `stats` | `useMemo(()=>({count:filtered.length,totalAUM:'€'+filtered.reduce((s,r)=>s+r.aumBn,0).toFixed(0)+'B',avgPAI:Math.round(filtered.reduce((s,r)=>s+r.paiScore,0)/filtered.length\|\|0),avgTaxonomy:Math.round(filtered.reduce((s,r` |
| `clsDist` | `useMemo(()=>CLASSF.slice(1).map(c=>({name:c,value:FUNDS.filter(f=>f.classification===c).length,aum:+FUNDS.filter(f=>f.classification===c).reduce((s,f)=>s+f.aumBn,0).toFixed(0)})),[]);` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='paiValues');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{t` |
| `submDate` | `f.reportStatus==='Published'?`${months[Math.floor(sr(f.id*53)*12)]} 2024`:null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PAI_INDICATORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Article 8 Products | — | Fund register | Funds promoting ESG characteristics under SFDR Article 8 with active Level 2 disclosures. |
| Article 9 Products | — | Fund register | Funds with sustainable investment as their objective under SFDR Article 9. |
| Avg SI Ratio (Art.9) | — | SFDR engine | Mean sustainable investment proportion across Article 9 products in current reporting period. |
- **Fund holdings, ESG data, PAI indicator values, taxonomy alignment data** → Article classification, SI substantiation, DNSH assessment, PAI aggregation → **Product disclosure templates, PAI statements, regulatory filings**

## 5 · Intermediate Transformation Logic
**Methodology:** Sustainable Investment Ratio
**Headline formula:** `Sustainable Investment AUM ÷ Total Fund AUM × 100`

Proportion of fund assets qualifying as sustainable investments per SFDR Article 2(17) definition, disclosed in product templates.

**Standards:** ['SFDR Art.2(17)', 'EU 2022/1288']
**Reference documents:** SFDR Regulation EU 2019/2088; SFDR Level 2 RTS EU 2022/1288; ESMA SFDR Q&A 2023/2024; Taxonomy Regulation EU 2020/852

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> **Note on prior audit findings — still open.** MEMORY.md's REM-38 backlog flagged two issues for this
> module: (1) a US-dollar `$` prefix on AUM figures in an EU SFDR context, and (2) only 14 PAI indicators
> tracked (PAI-15 through PAI-18 absent). **Both remain only partially/un-fixed**: the headline dashboard
> KPI (`stats.totalAUM`) correctly uses `'€'+...`, and the Fund Screening table (line 87) also uses `€`, but
> the **main fund table on the Dashboard tab** (`<td>${r.aumBn}B</td>`) and the **fund detail side panel**
> (`AUM: ${item.aumBn}B`) still render a `$` prefix — an inconsistent currency symbol within the same page.
> The **PAI_INDICATORS array still lists only 14 names**, confirmed absent of the sovereign (PAI-15/16) and
> real-estate (PAI-17/18) indicators that the sibling `sfdr-pai-dashboard` module correctly implements.

### 7.1 What the module computes

60 real-named funds (`FUNDS` — Amundi ESG Leaders, BlackRock Sustainable, Vanguard ESG, PIMCO Climate Bond,
etc.) each carry a hand-assigned SFDR classification (`cls` array, a fixed sequence of Article 6/8/8+/9
labels, not `sr()`-random) plus `sr()`-seeded quantitative fields:

```js
aumBn      = sr()×50 + 0.5                                    // €0.5–50.5bn
paiScore   = round(sr()×40 + 50)                               // 50–90/100
taxAligned = round(sr()×60 + 10)                               // 10–70%
sustInvest = round(sr()×50 + 10)                                // 10–60%
dnsh       = round(sr()×30 + 60)                                // 60–90/100
paiValues  = 14 indicators × { value: sr()×100, coverage: sr()×40+50 }   // only 14, not 18
```

Also integrates live-computed data from the platform's Carbon Credit context (`useCarbonCredit()` →
`adaptForRegulatory()`), surfacing `ccReg.pai_1_ghg_offset` and `ccReg.taxonomy_aligned_pct` as two
additional dashboard KPIs — a genuine cross-module data feed, not synthetic.

### 7.2 Parameterisation — 14 tracked indicators (of 18)

`PAI_INDICATORS = ['GHG Emissions','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure',
'Non-Renewable Energy','Energy Intensity','Biodiversity Impact','Water Emissions','Hazardous Waste',
'UNGC/OECD Violations','Gender Pay Gap','Board Gender Diversity','Controversial Weapons',
'Social Violations']` — this list covers PAI-1 through PAI-14 (the 14 mandatory Table 1 indicators for
company/investee assets) but **omits the 4 asset-class-specific indicators**: PAI-15 (Sovereign GHG
Intensity), PAI-16 (Fossil Fuel Sovereigns), PAI-17 (Fossil Fuel Real Estate), PAI-18 (Real Estate Energy
Efficiency). "Social Violations" (index 13) is a residual/renamed 14th entry that does not map cleanly to
a standard Table 1 label — closest real correspondence is likely a combination/relabelling, worth an SME
check.

| Classification distribution (60 funds, hand-assigned) | Count |
|---|---|
| Article 8 | ~29 (majority) |
| Article 9 | ~10 |
| Article 8+ | ~10 |
| Article 6 | ~7 |

(counts approximate from the fixed `cls` array pattern; the array is deterministic, not `sr()`-derived, so
these are exact counts reproducible from the source).

### 7.3 Calculation walkthrough

1. `filtered` applies search/classification filters over the 60 funds; `stats` computes guarded portfolio
   aggregates (`|| 0` fallback for empty-filter divide-by-zero on `avgPAI`/`avgTaxonomy`/`avgData`).
2. **Dashboard tab**: 9 KPI cards including two live cross-module figures from `ccReg` (Carbon Credit
   context) — `pai_1_ghg_offset` and `taxonomy_aligned_pct` — demonstrating genuine inter-module data
   exchange on the platform (Carbon Credit → SFDR reporting).
3. **Fund Screening tab**: taxonomy/sustainable-investment averages grouped by classification (`CLASSF`),
   plus a PAI-score-vs-carbon-footprint scatter across all filtered funds.
4. **Pre-contractual tab**: top-15 funds ranked by `sustainableInvest`% and bottom-15 by `dnshCompliance`,
   horizontal bar charts.
5. **Periodic Reports tab**: report-status inventory (`Published`/`Draft`/`Pending`, `sr()`-assigned) with a
   completion-rate KPI (`pStats.pub/FUNDS.length×100`) and a data-completeness histogram across 5 bands.

### 7.4 Worked example

`stats.totalAUM` for all 60 funds: `Σ aumBn` — with `aumBn = sr()×50+0.5` averaging ≈25.5bn per fund over
60 funds, an illustrative total ≈ €1,530bn (order-of-magnitude only, since exact figure depends on the
`sr()` sequence). The currency-symbol inconsistency (§ header note) means the *same* aggregate figure would
display as "€1,530B" in the KPI card but an individual fund row for, say, Amundi ESG Leaders with
`aumBn=42.3` would show "$42.3B" in the table — a visible, user-facing inconsistency within one page.

### 7.5 Companion analytics on the page

- **Carbon Credit cross-module integration** (`useCarbonCredit().adaptForRegulatory()`) is the one place
  this module goes beyond `sr()`-synthetic display — it pulls live computed state from the platform's
  shared Carbon Credit context bus, a genuine architectural integration point.
- **Report Status Inventory** — per-fund submission-date generation (`sr(f.id×53)` → month) only for
  `Published` funds, `null` otherwise — a reasonable conditional-field pattern.

### 7.6 Data provenance & limitations

- **60 fund names are real asset managers/product families; classification and quantitative metrics are
  synthetic** (`sr()`-seeded) except classification, which is a fixed hand-authored array (not random, so
  reproducible run-to-run).
- **Currency symbol inconsistency is unresolved**: dashboard KPI and Fund Screening table use `€`; the main
  Dashboard fund table and the fund detail side panel use `$` — both should read `€` for EU SFDR-context AUM
  figures.
- **PAI coverage gap is unresolved**: only 14 of 18 mandatory/asset-class-specific indicators are tracked;
  PAI-15 through PAI-18 (sovereign and real-estate specific) are absent, unlike the sibling
  `sfdr-pai-dashboard` module which correctly implements the full 18.
- "Social Violations" as PAI-14 does not map cleanly onto the real Table 1 indicator list once PAI-15/16/17/
  18 are properly accounted for — worth an SME relabel pass alongside adding the missing 4 indicators.

**Framework alignment:** SFDR RTS Annex I — 14 of 18 indicators correctly named and structured; the
remaining 4 asset-class-specific indicators should be added, referencing the sibling `sfdr-pai-dashboard`
module's already-correct implementation as the template · SFDR Article 6/8/8+/9 classification — correctly
represented across the 60-fund universe · the Carbon Credit context integration reflects the platform's
genuine PCAF/EU-Taxonomy data-sharing architecture between the carbon markets and regulatory reporting
domains.

## 9 · Future Evolution

### 9.1 Evolution A — Close the REM-38 residue and adopt the family's backend (analytics ladder: rung 1 → 2)

**What.** This tier-B page has two audit findings still open per §7: the main Dashboard fund table and detail side panel render `$` on AUM in an EU SFDR context (the KPI header and Fund Screening table were fixed to `€`), and `PAI_INDICATORS` still lists only 14 of 18 indicators — PAI-15/16 (sovereign) and PAI-17/18 (real estate) are absent, with §7.6 noting PAI-14's label also needs an SME pass. Meanwhile its sibling `sfdr-pai-dashboard` carries the correct 18-row taxonomy and the family's `sfdr_pai_engine` exposes 14 routes this page never calls. Evolution A is hygiene-then-adoption: fix the residue, then make this the product-level (Article 8/9 template) view over the shared engine rather than a third synthetic PAI implementation.

**How.** (1) One-line currency fixes at the two documented `$` sites. (2) Import the sibling's 18-indicator array (explicitly recommended by this page's own §7.6 as the template). (3) Replace the per-fund `paiValues` synthetic draws with `POST /api/v1/sfdr-pai/calculate-all` responses, keeping this page's differentiator — the product-level disclosure templates and the genuine `CarbonCreditContext` feed (`ccReg.pai_1_ghg_offset`, `taxonomy_aligned_pct`), which is real cross-module data worth preserving. (4) Sustainable-investment ratio substantiation becomes scenario-capable: vary the Article 2(17) qualifying screen and show the SI% band.

**Prerequisites.** None external — sibling taxonomy and engine already exist in-repo; the fixed hand-authored `cls` classification array should be retained (it is reproducible, unlike the `sr()` fields). **Acceptance:** zero `$` symbols render on any AUM figure; the indicator list length is 18; a fund's PAI values match a direct engine call.

### 9.2 Evolution B — Product-disclosure template copilot (LLM tier 1)

**What.** The module's purpose is the SFDR Level 2 reporting cycle: pre-contractual and periodic Article 8/9 templates plus website statements. Evolution B is a copilot that walks a user through template completion — "what goes in the 'minimum share of sustainable investments' field for an Article 8+ product?" — answering from the RTS structure the page encodes (`DISCLOSURE_SECTIONS`), the ESMA Q&A corpus, and the fund's computed figures, and drafting the boilerplate-with-numbers sections for review.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sfdr-v2-reporting/ask`, corpus = this Atlas record plus the disclosure-section catalogue; numeric slots fill only from page state (post-Evolution-A, engine-backed). Template drafts inherit the CarbonCreditContext figures with their provenance labels intact.

**Prerequisites (hard).** Evolution A's currency and indicator fixes first — a copilot drafting regulatory disclosures from a page displaying `$` AUM and a 14-indicator PAI set would compound documented defects into filed documents. **Acceptance:** generated template text never references an indicator absent from the fund's computed set; every figure traces to page state or an engine response.