# Climate Solution Taxonomy
**Module ID:** `climate-solution-taxonomy` · **Route:** `/climate-solution-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a structured IEA Net Zero-aligned taxonomy of climate technology and nature-based solutions, classifying investments by mitigation potential, technology readiness, and financial characteristics.

> **Business value:** Enables climate investors, green bond issuers, and taxonomy compliance teams to systematically identify, classify, and evaluate climate solutions against internationally recognised frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `CAT_MAP`, `COMPANIES`, `CustomTooltip`, `Kpi`, `PIE_COLORS`, `TABS`, `TAXONOMY_NAMES`, `TabAlignmentMatrix`, `TabCategoryExplorer`, `TabClassifier`, `TabPortfolioScreening`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CAT_MAP` | `Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));` |
| `name` | `prefixes[Math.floor(s1*prefixes.length)] + ' ' + suffixes[Math.floor(s2*suffixes.length)];` |
| `sector` | `sectors[Math.floor(sr(i*17+1)*sectors.length)];` |
| `mktCap` | `Math.round(500 + sr(i*19+2)*99500);` |
| `numCats` | `1 + Math.floor(sr(i*23+4)*4);` |
| `euAlign` | `Math.round(sr(i*41+3)*100);` |
| `cbiClass` | `['Aligned','Partially Aligned','Not Aligned','Under Review'][Math.floor(sr(i*43+5)*4)];` |
| `ftseGreen` | `Math.round(sr(i*47+7)*100);` |
| `propScore` | `Math.round(20+sr(i*53+9)*80);` |
| `trl` | `1+Math.floor(sr(i*59+11)*9);` |
| `greenRevPct` | `Math.round(catIds.reduce((sum,cid)=>sum+(revBreakdown[cid]\|\|0),0) * (sr(i*61+1)*0.5+0.3));` |
| `revenue` | `Math.round(50 + sr(i*63+13)*9950);` |
| `founded` | `1980 + Math.floor(sr(i*67+15)*43);` |
| `base` | `CATEGORIES[catIdx].marketSize * 0.4;` |
| `growth` | `CATEGORIES[catIdx].growth/100;` |
| `val` | `Math.round(base * Math.pow(1+growth, y-2020) + sr(catIdx*100+y)*50);` |
| `badge` | `(bg,fg)=>({ display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:fg\|\|T.text, marginRight:6, m` |
| `greenPct` | `wizRevStreams.filter(r=>greenCats.includes(r.cat)).reduce((s,r)=>s+r.pct,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `PIE_COLORS`, `TABS`, `TAXONOMY_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Technologies Mapped | — | IEA NZE 2021 | Number of distinct climate solutions categorised in the taxonomy spanning energy, transport, buildings, indust |
| Required Clean Energy Investment (2030) | — | IEA NZE 2023 Update | Annual clean energy investment needed globally by 2030 to remain on a 1.5°C trajectory. |
- **IEA technology briefs, IPCC abatement cost data, EU Taxonomy technical annexes** → Taxonomy structuring, TRL assignment, abatement potential normalisation → **Searchable taxonomy browser, deal sourcing filters, mitigation potential rankings**

## 5 · Intermediate Transformation Logic
**Methodology:** Mitigation Potential Score
**Headline formula:** `MPS = AnnualAbatement(GtCO₂e) × TRL Weight × CostCurve Position`
**Standards:** ['IEA Net Zero by 2050 2021', 'IPCC AR6 WG3 Chapter 12']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).