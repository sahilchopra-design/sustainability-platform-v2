# Modern Slavery Intelligence
**Module ID:** `modern-slavery-intel` · **Route:** `/modern-slavery-intel` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supply chain forced labour detection and modern slavery compliance platform supporting UK Modern Slavery Act (MSA), Australian Modern Slavery Act, and US UFLPA (Uyghur Forced Labor Prevention Act) due diligence obligations. Combines AI-powered adverse media screening, supplier risk scoring, and regulatory entity list screening to identify forced labour exposure across Tier 1–3 supply chains. Generates annual modern slavery statement data.

> **Business value:** Gives procurement, legal, and ESG teams the intelligence and workflow tools to manage modern slavery compliance obligations across complex supply chains, satisfying UK, Australian, and US regulatory due diligence requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COS`, `INDICATORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(0):v;` |
| `INDICATORS` | `['Debt Bondage','Excessive Overtime','Document Retention','Wage Withholding','Deceptive Recruitment','Restricted Movement','Isolation','Threats/Violen` |
| `msaScore` | `Math.round(sr(i*7)*60+30);const ukMSA=sr(i*11)>0.3;const ausMSA=sr(i*13)>0.5;const indicators=INDICATORS.filter((_,j)=>sr(i*100+j*7)>0.6).slice(0,Math` |
| `supplyTiers` | `Math.round(sr(i*19)*5+1);const audits=Math.round(sr(i*23)*50+5);const violations=Math.round(sr(i*29)*10);const remediated=Math.round(violations*(sr(i*` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,score:Math.round(msaScore-5+y*3+sr(i*100+y)*5),audits:Math.round(audits/5+sr(i*100+y*3)*3),violations:Math.` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgScore:Math.round(filtered.reduce((s,r)=>s+r.msaScore,0)/filtered.length\|\|0),critical:filtered.filter(r=>r.riskL` |
| `sectorRisk` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,score:0,viol:0,n:0};m[c.sector].score+=c.msaScore;m[c.sector].viol+=c.` |
| `indDist` | `useMemo(()=>{const m={};COS.forEach(c=>c.indicators.forEach(i=>{m[i]=(m[i]\|\|0)+1;}));return Object.entries(m).map(([k,v])=>({indicator:k,count:v})).so` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `modern_slavery_engine` (services/modern_slavery_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ModernSlaveryEngine.assess_forced_labour_risk` | entity_data |  |
| `ModernSlaveryEngine.screen_supply_chain` | request |  |
| `ModernSlaveryEngine.evaluate_msa_statement` | statement |  |
| `ModernSlaveryEngine.calculate_uflpa_exposure` | product |  |
| `ModernSlaveryEngine._score_ilo_indicators` | ed, sector_profile |  |
| `ModernSlaveryEngine._child_labour_risk` | sector_profile, countries |  |
| `ModernSlaveryEngine._debt_bondage_risk` | sector_profile, countries |  |
| `ModernSlaveryEngine._uk_msa_baseline` | ed |  |
| `ModernSlaveryEngine._eu_flr_readiness` | ed, sector_profile |  |
| `ModernSlaveryEngine._uflpa_baseline` | ed |  |
| `ModernSlaveryEngine._check_cahra` | countries |  |
| `ModernSlaveryEngine._overall_risk_tier` | ilo_score, uflpa_score, child_labour_risk, debt_bondage_risk, cahra_flags |  |
| `ModernSlaveryEngine._recommended_actions` | overall_tier, eu_flr_status, uflpa_level, uk_msa_tier, ed |  |
| `ModernSlaveryEngine._recommend_audit_schemes` | sector, countries, commodities |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `INDICATORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FLRS (0–100) | — | Composite risk model | Entity-level forced labour risk score; above 70 triggers enhanced due diligence |
| ILO Indicator Hits | — | ILO Indicators of Forced Labour 2012 | Number of ILO forced labour indicators detected in adverse media for the screened supplier |
| UFLPA Entity List Status | — | US DHS UFLPA Entity List | Whether the supplier appears on the US DHS UFLPA forced labour entity list |
| Modern Slavery Statement Coverage (%) | — | UK/Australian MSA reporting | Proportion of mandatory MSA statement sections addressed with substantive narrative |
- **Supplier entity list** → Match to sector and country risk tables; assign inherent risk scores → **Tier 1–3 supplier risk profile database**
- **Adverse media AI screening engine** → Parse news and NGO reports; classify against 11 ILO forced labour indicators; score severity → **Adverse media hit report with evidence snippets and ILO indicator mapping per supplier**
- **UFLPA entity list (DHS)** → Exact and fuzzy name matching; flag listed entities; log match confidence → **Regulatory list screening results with match confidence and entity list citation**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/modern-slavery/ref/audit-schemes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'effectiveness_scale', 'schemes'], 'n_keys': 3}`

**GET /api/v1/modern-slavery/ref/high-risk-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'note', 'sectors', 'cahra_countries'], 'n_keys': 4}`

**GET /api/v1/modern-slavery/ref/ilo-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'ilo_conventions', 'count', 'indicators'], 'n_keys': 4}`

**GET /api/v1/modern-slavery/ref/uflpa-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['legislation', 'enacted', 'enforcing_body', 'rebuttable_presumption', 'entity_categories', 'high_risk_commodities', 'approved_importer_criteria', 'cbp_enforcement_statistics', 'documentation_r`

**POST /api/v1/modern-slavery/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Forced Labour Risk Score
**Headline formula:** `FLRSᵢ = SectorRiskᵢ + CountryRiskᵢ + AdverseMediaScoreᵢ + RegulatoryListHitᵢ`
**Standards:** ['UK Modern Slavery Act 2015', 'Australian Modern Slavery Act 2018', 'US UFLPA Entity List 2022', 'ILO Indicators of Forced Labour 2012', 'Global Slavery Index â€” Walk Free Foundation 2023']

**Engine `modern_slavery_engine` — extracted transformation lines:**
```python
priority = min(100.0, base + (10 if uflpa_flag else 0) + (10 if cahra_flag else 0)
total_score = max(0.0, min(100.0, base_score + bonus))
xinjiang_exposure = max_exposure * (china_count / max(1, len(product.supplier_countries)))
raw_score = min(1.0, raw_score * 1.3)
raw_score = min(1.0, raw_score * 1.5)
composite = (weighted_score / total_weight) * 100
score = min(100.0, score + 10.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |