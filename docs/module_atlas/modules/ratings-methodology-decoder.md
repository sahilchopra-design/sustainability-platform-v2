# Ratings Methodology Decoder
**Module ID:** `ratings-methodology-decoder` · **Route:** `/ratings-methodology-decoder` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG ratings transparency tool decomposing provider scores by pillar, weight, and indicator to enable cross-provider comparison and divergence analysis.

> **Business value:** Demystifies opaque ESG rating methodologies, enabling informed provider selection, score challenge, and robust multi-provider integration.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `DATA_SOURCES`, `DS_CATS`, `E_ISSUES`, `GICS_SECTORS`, `G_ISSUES`, `PROVIDERS`, `S_ISSUES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `G_ISSUES` | `['Board Composition & Independence','Executive Compensation Alignment','Shareholder Rights & Engagement','Business Ethics & Anti-Corruption','Audit & ` |
| `gKPIs` | `['Board Independence Ratio (%)','CEO-Median Pay Ratio','Say-on-Pay Approval Rate','Anti-Corruption Training (%)','Board Gender Diversity (%)','Board M` |
| `covered` | `PROVIDERS.map((_p,pi)=>sr(seed+i*7+pi*13)>0.3);` |
| `weight` | `PROVIDERS.map((_p,pi)=>Math.round(sr(seed+i*11+pi*17)*5+1));` |
| `total` | `eSlider+sSlider+gSlider;` |
| `providerScores` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `eAdj` | `c.baseE+sr(pi*31+selCompany*13)*10-5;` |
| `sAdj` | `c.baseS+sr(pi*37+selCompany*17)*10-5;` |
| `gAdj` | `c.baseG+sr(pi*43+selCompany*19)*10-5;` |
| `coverageScores` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `scores` | `PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*31+pi*17+matYearView*100)*8+2));` |
| `avg` | `scores.reduce((a,b)=>a+b,0)/scores.length;` |
| `disagreement` | `Math.round(Math.sqrt(scores.reduce((a,s)=>a+(s-avg)**2,0)/scores.length)*100)/100;` |
| `matDrift` | `useMemo(()=>GICS_SECTORS.map((sector,si)=>{` |
| `drift` | `y0.reduce((a,v,i)=>a+Math.abs(v-y2[i]),0)/y0.length;` |
| `usage` | `PROVIDERS.map((_,pi)=>sr(origIdx*13+pi*19)>0.35);` |
| `freshness` | `PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*17+pi*23)*24+1));` |
| `quality` | `PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*29+pi*31)*4+1));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DATA_SOURCES`, `E_ISSUES`, `GICS_SECTORS`, `G_ISSUES`, `PROVIDERS`, `S_ISSUES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Provider Coverage | — | Platform Registry | Number of ESG rating providers with decoded methodology in platform. |
| Score Divergence (σ) | — | Cross-Provider Analysis | Standard deviation of provider ESG scores for same company, illustrating methodology-driven divergence. |
| Weight Transparency (%) | — | Provider Disclosures | Average proportion of provider methodology weights that are publicly disclosed. |
- **Provider score feeds + methodology weights + indicator data** → Score decomposition; pillar attribution; cross-provider divergence analysis → **Score transparency report and provider comparison matrix**

## 5 · Intermediate Transformation Logic
**Methodology:** Score Reconstruction
**Headline formula:** `ESĜ = Σ(w_pillarᵢ × Σ(w_indicator_j × score_j))`
**Standards:** ['MSCI ESG Ratings Methodology', 'Sustainalytics ESG Risk Rating Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).