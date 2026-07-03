# CSDDD Engine
**Module ID:** `csddd-engine` · **Route:** `/csddd-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates the CSDDD due diligence workflow with supplier risk assessment, impact screening questionnaires, prevention and mitigation action tracking, and grievance case management. Integrates supplier onboarding with automated risk-flagging and escalation workflows.

> **Business value:** Enables compliance and procurement teams to operate a scalable, defensible CSDDD due diligence programme, automating repetitive risk triage and questionnaire workflows while maintaining full audit trails for regulatory inspection.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `APPLY_DATES`, `AdverseImpactAssessment`, `CHAIN_TIERS`, `COMPANIES`, `ClimateTransitionPlan`, `IMPACT_CATS`, `SCOPE_GROUPS`, `SECTORS`, `ScopeTimeline`, `ValueChainMapping`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SCOPE_GROUPS` | `['Group 1 (EU, >5000 emp, >€1.5bn)','Group 2 (EU, >3000 emp, >€900m)','Group 3 (EU, >1000 emp, >€450m)','Non-EU Group 1 (>€1.5bn EU rev)','Non-EU Grou` |
| `IMPACT_CATS` | `['HR-01 Forced Labour','HR-02 Child Labour','HR-03 Safe Conditions','HR-04 Living Wage','HR-05 Freedom of Assoc.','HR-06 Non-Discrimination','HR-07 Pr` |
| `CHAIN_TIERS` | `['Tier 1 — Direct Suppliers','Tier 2 — Tier 1 Suppliers','Tier 3+ — Upstream Chain','Own Operations'];` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `employees` | `Math.floor(s2*45000+1000);` |
| `turnover` | `+(s3*14+0.5).toFixed(1);` |
| `ddScore` | `Math.floor(sr(i*31+7)*60+35);` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `impacts` | `IMPACT_CATS.map((cat,ci)=>{` |
| `totalIdentified` | `impacts.reduce((a,i)=>a+i.identified,0);` |
| `totalRemediated` | `impacts.reduce((a,i)=>a+i.remediated,0);` |
| `remRate` | `Math.round(totalRemediated/totalIdentified*100);` |
| `chainBreakdown` | `CHAIN_TIERS.map((tier,ti)=>({tier:tier.split('—')[0].trim(),actual:Math.floor(sr(ti*61+7)*200+50),potential:Math.floor(sr(ti*67+11)*150+30)}));` |
| `remPct` | `Math.round(imp.remediated/imp.identified*100);` |
| `estabRelTypes` | `['Direct Suppliers','Franchisees','Joint Venture Partners','Sub-contractors','Licensed Producers','Distributors'];` |
| `relData` | `estabRelTypes.map((rt,i)=>({type:rt,count:Math.floor(sr(i*31+7)*500+50),mapped:Math.floor(sr(i*37+11)*80+15)}));` |
| `sectorRisk` | `SECTORS.map((sec,i)=>({sector:sec,riskScore:Math.floor(sr(i*41+5)*70+20),impactDensity:+(sr(i*43+9)*3+0.5).toFixed(1),suppliers:Math.floor(sr(i*47+3)*` |
| `pathwayData` | `roadmapYears.map((yr,i)=>({year:String(yr),baseline:100,target:Math.round(100*(1-Math.pow((yr-2024)/26,0.7))),company:Math.round(100*(1-sr(selCompany.` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/csddd/scope-assessment` | `assess_scope` | api/v1/routes/csddd.py |
| POST | `/api/v1/csddd/adverse-impacts` | `identify_adverse_impacts` | api/v1/routes/csddd.py |
| POST | `/api/v1/csddd/dd-compliance` | `assess_dd_compliance` | api/v1/routes/csddd.py |
| POST | `/api/v1/csddd/value-chain-mapping` | `assess_value_chain` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/scope-thresholds` | `ref_scope_thresholds` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/adverse-impacts` | `ref_adverse_impacts` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/dd-obligations` | `ref_dd_obligations` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/climate-plan` | `ref_climate_plan` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/penalties` | `ref_penalties` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/csddd.py |
| GET | `/api/v1/csddd/ref/high-risk-sectors` | `ref_high_risk_sectors` | api/v1/routes/csddd.py |

### 2.3 Engine `csddd_engine` (services/csddd_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CSDDDEngine.assess_scope` | entity_name, is_eu_company, employees, net_turnover_eur, eu_generated_turnover_eur, nace_codes | Determine whether the entity falls within CSDDD scope. |
| `CSDDDEngine.identify_adverse_impacts` | entity_name, nace_codes, countries_of_operation, supplier_countries, forced_labour_risk, child_labour_risk | Identify actual and potential adverse human rights & environmental impacts. |
| `CSDDDEngine.assess_dd_compliance` | entity_name, scope_group, dd_policy_integrated, impact_identification_score, prevention_mitigation_score, remediation_score | Full due diligence compliance assessment under CSDDD. |
| `CSDDDEngine.assess_value_chain_mapping` | entity_name, upstream_supplier_count, upstream_countries, downstream_partner_count, downstream_countries, tier1_mapped | Assess value chain mapping completeness for CSDDD compliance. |
| `CSDDDEngine._generate_recommendations` | overall, gaps, ctp_gaps, gm_status, director_duty, eudr_overlap |  |
| `CSDDDEngine.get_scope_thresholds` |  |  |
| `CSDDDEngine.get_adverse_impact_categories` |  |  |
| `CSDDDEngine.get_dd_obligations` |  |  |
| `CSDDDEngine.get_climate_transition_plan_requirements` |  |  |
| `CSDDDEngine.get_penalty_framework` |  |  |
| `CSDDDEngine.get_cross_framework_map` |  |  |
| `CSDDDEngine.get_high_risk_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `APPLY_DATES`, `CHAIN_TIERS`, `IMPACT_CATS`, `SCOPE_GROUPS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Suppliers Assessed | — | Supplier registry | Number of suppliers in scope for CSDDD due diligence process at each tier |
| High-Risk Supplier Flag Rate | — | Risk triage model | Proportion of assessed suppliers classified as high-risk requiring enhanced due diligence |
| Questionnaire Response Rate | — | Platform tracking | Percentage of suppliers completing CSDDD due diligence questionnaire within deadline |
| Open Grievance Cases | — | Grievance case log | Number of active grievance cases lodged through accessible mechanisms per CSDDD Article 14 |
| Average Remediation Time | — | Case management system | Average days from impact identification to closure of remediation action |
- **Supplier registry and spend data** → Classify by tier, country, sector; compute spend materiality weights → **Supplier risk triage scores**
- **ITUC/WBI/INFORM country risk indices** → Weight by spend, compute composite country-sector risk → **Automated supplier risk flags**
- **Questionnaire responses and audit certificates** → Parse responses, adjust risk scores for verified certifications → **Enhanced due diligence trigger list**

## 5 · Intermediate Transformation Logic
**Methodology:** Automated Supplier Risk Triage
**Headline formula:** `SupplierRisk = f(Country_risk × Sector_risk × Spend_materiality × Audit_history)`
**Standards:** ['CSDDD Directive Art. 7-8', 'OECD Guidance on Sector-Specific Due Diligence', 'Sedex SMETA Audit Standards']

**Engine `csddd_engine` — extracted transformation lines:**
```python
risk_score = min(100.0, round(weighted / len(unique_impacts) * 100, 1))
ctp_score = sum(100 / len(ctp_checks) for _, met, _ in ctp_checks if met)
all_countries = list(set(upstream_countries + downstream_countries))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).