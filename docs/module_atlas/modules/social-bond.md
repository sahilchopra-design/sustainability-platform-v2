# Social Bond Analytics
**Module ID:** `social-bond` · **Route:** `/social-bond` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Social bond impact reporting aligned to ICMA Social Bond Principles, tracking use-of-proceeds to eligible social project categories and quantifying beneficiary impact metrics.

> **Business value:** Tracks social bond use-of-proceeds and quantifies social outcome impacts in alignment with ICMA Social Bond Principles.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL`, `BONDS`, `CATEGORIES`, `IMPACT_CATS`, `ISSUERS`, `PAGE`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `REGIONS` | `['Europe','North America','Asia-Pacific','Latin America','Africa','Middle East','Global'];` |
| `cat` | `CATEGORIES[Math.floor(sr(i*3)*CATEGORIES.length)];` |
| `issuer` | `ISSUERS[Math.floor(sr(i*7)*ISSUERS.length)];` |
| `reg` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `IMPACT_CATS` | `CATEGORIES.map((c,i)=>({` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `total` | `filtered.reduce((s,b)=>s+b.amount,0);` |
| `avgCoup` | `filtered.length?filtered.reduce((s,b)=>s+parseFloat(b.coupon),0)/filtered.length:0;` |
| `avgTenor` | `filtered.length?filtered.reduce((s,b)=>s+b.tenor,0)/filtered.length:0;` |
| `catDist` | `useMemo(()=>{const m={};CATEGORIES.forEach(c=>m[c]=0);filtered.forEach(b=>m[b.category]++);return Object.entries(m).map(([name,value])=>({name:name.le` |
| `regDist` | `useMemo(()=>{const m={};REGIONS.forEach(r=>m[r]=0);filtered.forEach(b=>m[b.region]++);return Object.entries(m).map(([name,value])=>({name,value}));},[` |
| `ratingDist` | `useMemo(()=>{const m={};filtered.forEach(b=>{m[b.rating]=(m[b.rating]\|\|0)+1;});return Object.entries(m).sort().map(([name,value])=>({name,value}));},[` |
| `frameDist` | `[];const fMap={};filtered.forEach(b=>{fMap[b.framework]=(fMap[b.framework]\|\|0)+1;});Object.entries(fMap).forEach(([name,value])=>frameDist.push({name,` |
| `verDist` | `[];const vMap={};filtered.forEach(b=>{vMap[b.verifier]=(vMap[b.verifier]\|\|0)+1;});Object.entries(vMap).forEach(([name,value])=>verDist.push({name,valu` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/social-bond/icma-sbp-compliance` | `icma_sbp_compliance` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/use-of-proceeds` | `use_of_proceeds` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/target-population` | `target_population` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/social-kpis` | `social_kpis` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/sdg-alignment` | `sdg_alignment` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/full-assessment` | `full_assessment` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/project-categories` | `ref_project_categories` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/target-populations` | `ref_target_populations` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/kpi-library` | `ref_kpi_library` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/sdg-mapping` | `ref_sdg_mapping` | api/v1/routes/social_bond.py |

### 2.3 Engine `social_bond_engine` (services/social_bond_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SocialBondEngine.assess_icma_sbp_compliance` | bond_data | Score the four ICMA Social Bond Principles components. |
| `SocialBondEngine.assess_use_of_proceeds` | entity_id, bond_name, categories, total_issuance_m | Assess category eligibility, allocation, and excluded activities screen. |
| `SocialBondEngine.assess_target_population` | entity_id, bond_name, populations_data, additionality_evidence | Validate target population groups, beneficiary count methodology, |
| `SocialBondEngine.score_social_kpis` | entity_id, bond_name, project_category, kpis_list | Score KPI quality: quantified vs qualitative ratio, ICMA alignment, |
| `SocialBondEngine.map_sdg_alignment` | entity_id, bond_name, project_categories, kpis | Map project categories and KPIs to SDG goals and targets. |
| `SocialBondEngine.calculate_impact_score` | bond_data | Composite impact score: |
| `SocialBondEngine.run_full_assessment` | entity_id, bond_data | Orchestrate all social bond sub-assessments. |
| `assess_icma_sbp_compliance` | bond_data | Score all 4 SBP components, compute composite, identify gaps, |
| `map_use_of_proceeds` | bond_data | Categorise project activities to ICMA categories, compute eligible %, |
| `assess_target_population` | bond_data | Validate target population definition, estimate beneficiary reach, |
| `score_social_kpis` | bond_data | Check KPI completeness vs library (mandatory categories), quantification rate, |
| `compute_sdg_alignment` | bond_data | Map all project activities to SDGs, identify primary SDG, secondary SDGs, |
| `run_full_assessment` | bond_data | Orchestrate all E85 sub-methods and produce consolidated assessment. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `recognised`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CATEGORIES`, `ISSUERS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Social Bonds Tracked | — | Bond register | Total social bonds under active impact monitoring. |
| Proceeds Allocated | — | Issuer reports | Cumulative use-of-proceeds allocated to eligible social project categories. |
| Beneficiaries Reached | — | Impact reports | Total individuals benefiting from social bond-financed projects in reporting period. |
- **Issuer allocation reports, ICMA category taxonomy, impact metric data** → Proceeds mapping, impact metric aggregation, outcome scoring → **Social impact reports, beneficiary dashboards, ICMA compliance certificates**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/social-bond/ref/kpi-library** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'total_kpis', 'categories_covered', 'kpis_by_category', 'all_kpis', 'ref'], 'n_keys': 6}`

**GET /api/v1/social-bond/ref/project-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data', 'ref'], 'n_keys': 4}`

**GET /api/v1/social-bond/ref/sdg-mapping** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/social-bond/ref/target-populations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data', 'ref'], 'n_keys': 4}`

**POST /api/v1/social-bond/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Impact Score
**Headline formula:** `Σ (Project Allocation × Beneficiary Reach × Outcome Weight) ÷ Total Proceeds`
**Standards:** ['ICMA SBP', 'IFC Social Bond Guidance']

**Engine `social_bond_engine` — extracted transformation lines:**
```python
allocation_gap_m = total_issuance_m - allocated_m
allocation_pct = (allocated_m / total_issuance_m * 100) if total_issuance_m > 0 else 0
eligibility_pct = (eligible_count / max(1, len(categories))) * 100
quantification_rate = (quantified_count / max(1, len(validated_populations))) * 100
overall_kpi_quality = total_score / n
quantification_ratio = (quantified_count / n) * 100
alignment_ratio = (aligned_count / n) * 100
sdg_score = min(100, (sum(sdg_hits.values()) / max(1, len(project_categories) * 5)) * 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).