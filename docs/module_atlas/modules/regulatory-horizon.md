# Regulatory Horizon Scanner
**Module ID:** `regulatory-horizon` · **Route:** `/regulatory-horizon` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Forward-looking regulatory pipeline for ESG and sustainability regulation globally. Covers consultations, proposed rules, upcoming effective dates, and impact assessment for 20+ jurisdictions.

> **Business value:** Staying ahead of regulatory change is critical — implementing changes at the last minute creates operational risk. This module provides the regulatory intelligence needed to plan compliance projects with adequate lead time across all applicable jurisdictions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `Badge`, `COMPANIES`, `JURISDICTIONS`, `Kpi`, `PIE_C`, `REGS`, `Row`, `STATUSES`, `STATUS_C`, `TABS`, `TOPICS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOPICS` | `['Reporting','Disclosure','Climate','Taxonomy','Governance','Human Rights','Technology','Biodiversity','Due Diligence','Anti-Greenwashing'];` |
| `names` | `['CSRD Wave 3 SMEs','SFDR Level 3 RTS','EU AI Act FinSvcs','CSDDD Implementation','EU Taxonomy Delegated Act 3','UK SDR Anti-Greenwash','FCA Sustainab` |
| `compGapMatrix` | `COMPANIES.map((c,ci)=>({company:c,gaps:REGS.slice(0,20).map((r,ri)=>({reg:r.name,status:['Compliant','Partial','Gap','N/A'][Math.floor(sr(ci*100+ri*7)` |
| `exportCSV` | `(rows,filename)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(',` |
| `byJurisdiction` | `useMemo(()=>JURISDICTIONS.map(j=>({name:j,count:REGS.filter(r=>r.jurisdiction===j).length,avgImpact:Math.round(REGS.filter(r=>r.jurisdiction===j).redu` |
| `byTopic` | `useMemo(()=>TOPICS.map(t=>({name:t,value:REGS.filter(r=>r.topic===t).length})),[]);` |
| `byStatus` | `useMemo(()=>STATUSES.map(s=>({name:s,value:REGS.filter(r=>r.status===s).length})),[]);` |
| `timelineData` | `useMemo(()=>['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'].map((q,i)=>({quarter:q,starting:Math.round(3+sr(i*71)*8)` |
| `weighted` | `filtered.map(r=>({...r,weightedScore:Math.round((r.complianceCost/10*impactWeights.cost/100)+(r.impactScore*impactWeights.complexity/100)+(r.gapCount*` |
| `topChart` | `weighted.slice(0,20).map(r=>({name:r.name.slice(0,25),score:r.weightedScore,impact:r.impactScore,cost:Math.round(r.complianceCost/10)}));` |
| `gapCounts` | `{Compliant:0,Partial:0,Gap:0,'N/A':0};co.gaps.forEach(g=>gapCounts[g.status]++);` |
| `gapPie` | `Object.entries(gapCounts).filter(([_,v])=>v>0).map(([k,v])=>({name:k,value:v}));` |
| `gapColors` | `{Compliant:T.green,Partial:T.amber,Gap:T.red,'N/A':T.textMut};` |
| `jurAlertCount` | `JURISDICTIONS.slice(0,8).map(j=>({name:j,alerts:ALERTS.filter(a=>a.jurisdiction===j).length,high:ALERTS.filter(a=>a.jurisdiction===j&&a.severity==='Hi` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-horizon/scan` | `scan` | api/v1/routes/regulatory_horizon.py |
| POST | `/api/v1/regulatory-horizon/readiness` | `readiness` | api/v1/routes/regulatory_horizon.py |
| POST | `/api/v1/regulatory-horizon/regulatory-burden` | `regulatory_burden` | api/v1/routes/regulatory_horizon.py |
| POST | `/api/v1/regulatory-horizon/synergies` | `synergies` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/regulation-pipeline` | `ref_regulation_pipeline` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/entity-applicability` | `ref_entity_applicability` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/cost-benchmarks` | `ref_cost_benchmarks` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/interconnection-map` | `ref_interconnection_map` | api/v1/routes/regulatory_horizon.py |

### 2.3 Engine `regulatory_horizon_engine` (services/regulatory_horizon_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_build_applicability_matrix` |  |  |
| `RegulatoryHorizonEngine.scan_horizon` | entity_type, jurisdiction, sectors, time_horizon_years | Identify applicable regulations, sort by deadline + impact, estimate compliance cost, |
| `RegulatoryHorizonEngine.assess_implementation_readiness` | entity_type, current_capabilities, target_regulation | Gap analysis for a specific regulation. |
| `RegulatoryHorizonEngine.calculate_regulatory_burden` | entity_type, aum_usd_bn, jurisdiction | Estimate total compliance cost across all applicable regulations. |
| `RegulatoryHorizonEngine.identify_synergies` | regulation_list | Identify shared data requirements, process overlaps, implementation savings, |
| `RegulatoryHorizonEngine.ref_regulation_pipeline` |  |  |
| `RegulatoryHorizonEngine.ref_entity_applicability` |  |  |
| `RegulatoryHorizonEngine.ref_cost_benchmarks` |  |  |
| `RegulatoryHorizonEngine.ref_interconnection_map` |  |  |
| `_estimate_effort` | requirement, cost_cat |  |
| `_aggregate_by` | cost_breakdown, regulations, field |  |
| `_topological_sort` | regulation_ids | Simple dependency-aware sort — regulations with more dependents come last. |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `other`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALERTS`, `COMPANIES`, `JURISDICTIONS`, `PIE_C`, `STATUSES`, `TABS`, `TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Developments | — | Tracker | Regulatory changes in pipeline globally |
| Jurisdictions | — | Coverage | EU, UK, US, Singapore, HK, Australia, Japan, India, Brazil |
- **Regulatory sources** → Change classification → **Impact assessment**
- **Upcoming deadlines** → Alert generation → **Compliance calendar**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-horizon/ref/cost-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/regulatory-horizon/ref/entity-applicability** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/regulatory-horizon/ref/interconnection-map** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/regulatory-horizon/ref/regulation-pipeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**POST /api/v1/regulatory-horizon/readiness** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory pipeline tracking
**Headline formula:** `Impact = Scope × Magnitude × Urgency per regulatory development`
**Standards:** ['EC DG FISMA', 'FCA', 'SEC', 'IOSCO']

**Engine `regulatory_horizon_engine` — extracted transformation lines:**
```python
cutoff_year = today.year + time_horizon_years
change_velocity = round(min(10.0, max_per_yr * 1.5), 1)
readiness_pct = round(met_count / max(len(required), 1) * 100, 1)
external_advisor_usd = round((total_one_time + total_annual) * ext_advisor_pct, 0)
tech_investment_usd = round(total_one_time * 0.50, 0)
combined_savings_pct = min(45.0, total_shared * savings_pct_per_shared * 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).