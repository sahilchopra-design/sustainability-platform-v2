# Human Rights Risk
**Module ID:** `human-rights-risk` · **Route:** `/human-rights-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses supply chain human rights risk using UN Guiding Principles on Business and Human Rights (UNGP) and EU Corporate Sustainability Due Diligence Directive (CS3D) frameworks, identifying salient human rights issues and high-risk supplier relationships. Provides sector-specific risk scoring for child labour, forced labour, gender-based violence, and freedom of association.

> **Business value:** Enables companies and investors to meet CS3D human rights due diligence obligations, identify and prioritise salient human rights risks in supply chains, and demonstrate respect for human rights under the UNGP framework. Supports ESRS S2 (Workers in the Value Chain) and GRI 409/410/411 disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COS`, `ISSUES`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `names` | `['Apple','Samsung','Nike','H&M','Nestle','Unilever','Shell','BHP','Glencore','Rio Tinto','Coca-Cola','PepsiCo','Amazon','Walmart','Tesla','Meta','Alph` |
| `riskScore` | `Math.round(sr(i*7)*70+20);const ungpScore=Math.round(sr(i*11)*60+30);const dueDiligence=Math.round(sr(i*13)*50+40);` |
| `salient` | `ISSUES.filter((_,j)=>sr(i*100+j*7)>0.5).slice(0,Math.round(sr(i*17)*5+2));` |
| `incidents` | `Math.round(sr(i*19)*15);const grievances=Math.round(sr(i*23)*30);const remediations=Math.round(grievances*(sr(i*29)*0.6+0.2));` |
| `supplyTiers` | `Math.round(sr(i*31)*4+1);const countriesOp=Math.round(sr(i*37)*40+5);const highRiskCountries=Math.round(countriesOp*(sr(i*41)*0.4));` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,risk:Math.round(riskScore+5-y*2+sr(i*100+y)*8),ungp:Math.round(ungpScore-3+y*2+sr(i*100+y*3)*5),incidents:M` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRisk:Math.round(filtered.reduce((s,r)=>s+r.riskScore,0)/filtered.length\|\|0),critical:filtered.filter(r=>r.sever` |
| `sectorRisk` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,risk:0,ungp:0,n:0};m[c.sector].risk+=c.riskScore;m[c.sector].ungp+=c.u` |
| `issueDist` | `useMemo(()=>{const m={};COS.forEach(c=>c.salientIssues.forEach(i=>{m[i]=(m[i]\|\|0)+1;}));return Object.entries(m).map(([k,v])=>({issue:k,count:v})).sor` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ISSUES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Salient Risk Score (top issue) | — | UNGP / CS3D assessment | Score for the highest-priority salient human rights issue; scores above 70 require documented action plan unde |
| High-Risk Supplier Ratio (%) | — | KnowTheChain / Sedex data | Proportion of Tier 1 suppliers in high-risk geographies or sectors for forced labour, child labour, or unsafe  |
| Remediation Case Resolution Rate (%) | — | Internal grievance mechanism data | Percentage of reported human rights grievances resolved or in active remediation; UNGP Principle 29 requires e |
| Supply Chain Audit Coverage (%) | — | Internal procurement data | Share of Tier 1 spend covered by third-party social audits; insufficient coverage risks CS3D non-compliance. |
- **Supplier database (Tier 1 and Tier 2)** → Map to geographic and sectoral human rights risk indices (KnowTheChain/Verisk) → **Supplier human rights risk scores**
- **Social audit reports (Sedex/SMETA)** → Extract non-conformances by human rights issue category → **Audit finding heatmap by supplier**
- **Grievance mechanism records** → Classify by human rights issue, track resolution status → **Remediation tracking dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Salient Human Rights Risk Score
**Headline formula:** `SHRRS = Σ_k P(harm_k) × Severity_k × Breadth_k × Remediability_k`
**Standards:** ['UN Guiding Principles on Business and Human Rights (2011)', 'EU CS3D Directive (2024)', 'ILO Core Labour Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).