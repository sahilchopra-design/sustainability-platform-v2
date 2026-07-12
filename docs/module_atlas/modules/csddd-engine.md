# CSDDD Engine
**Module ID:** `csddd-engine` · **Route:** `/csddd-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates the CSDDD due diligence workflow with supplier risk assessment, impact screening questionnaires, prevention and mitigation action tracking, and grievance case management. Integrates supplier onboarding with automated risk-flagging and escalation workflows.

> **Business value:** Enables compliance and procurement teams to operate a scalable, defensible CSDDD due diligence programme, automating repetitive risk triage and questionnaire workflows while maintaining full audit trails for regulatory inspection.

**How an analyst works this module:**
- Onboard supplier registry with Tier 1 and known indirect suppliers
- Risk Triage tab automatically scores and classifies suppliers by country × sector risk
- Questionnaire Engine sends CSDDD impact screening questionnaires and tracks responses
- Impact Screening results auto-populate the adverse impact register for prioritisation
- Action Plan Tracker assigns prevention/mitigation actions with owners and deadlines
- Grievance Manager logs and tracks cases through intake, investigation, and resolution stages

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `APPLY_DATES`, `AdverseImpactAssessment`, `CHAIN_TIERS`, `COMPANIES`, `ClimateTransitionPlan`, `IMPACT_CATS`, `SCOPE_GROUPS`, `SECTORS`, `ScopeTimeline`, `ValueChainMapping`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SCOPE_GROUPS` | `['Group 1 (EU, >5000 emp, >€1.5bn)','Group 2 (EU, >3000 emp, >€900m)','Group 3 (EU, >1000 emp, >€450m)','Non-EU Group 1 (>€1.5bn EU rev)','Non-EU Group 2 (>€900m EU rev)','Non-EU Group 3 (>€450m EU rev)'];` |
| `IMPACT_CATS` | `['HR-01 Forced Labour','HR-02 Child Labour','HR-03 Safe Conditions','HR-04 Living Wage','HR-05 Freedom of Assoc.','HR-06 Non-Discrimination','HR-07 Privacy Rights','ENV-01 Climate Change','ENV-02 Air Pollution','ENV-03 W` |
| `CHAIN_TIERS` | `['Tier 1 — Direct Suppliers','Tier 2 — Tier 1 Suppliers','Tier 3+ — Upstream Chain','Own Operations'];` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `employees` | `Math.floor(s2*45000+1000);` |
| `turnover` | `+(s3*14+0.5).toFixed(1);` |
| `ddScore` | `Math.floor(sr(i*31+7)*60+35);` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `impacts` | `IMPACT_CATS.map((cat,ci)=>{` |
| `totalIdentified` | `impacts.reduce((a,i)=>a+i.identified,0);` |
| `totalRemediated` | `impacts.reduce((a,i)=>a+i.remediated,0);` |
| `remRate` | `Math.round(totalRemediated/totalIdentified*100);` |
| `chainBreakdown` | `CHAIN_TIERS.map((tier,ti)=>({tier:tier.split('—')[0].trim(),actual:Math.floor(sr(ti*61+7)*200+50),potential:Math.floor(sr(ti*67+11)*150+30)}));` |
| `remPct` | `Math.round(imp.remediated/imp.identified*100);` |
| `estabRelTypes` | `['Direct Suppliers','Franchisees','Joint Venture Partners','Sub-contractors','Licensed Producers','Distributors'];` |
| `relData` | `estabRelTypes.map((rt,i)=>({type:rt,count:Math.floor(sr(i*31+7)*500+50),mapped:Math.floor(sr(i*37+11)*80+15)}));` |
| `sectorRisk` | `SECTORS.map((sec,i)=>({sector:sec,riskScore:Math.floor(sr(i*41+5)*70+20),impactDensity:+(sr(i*43+9)*3+0.5).toFixed(1),suppliers:Math.floor(sr(i*47+3)*200+20)}));` |
| `pathwayData` | `roadmapYears.map((yr,i)=>({year:String(yr),baseline:100,target:Math.round(100*(1-Math.pow((yr-2024)/26,0.7))),company:Math.round(100*(1-sr(selCompany.id*31+i*7)*Math.pow((yr-2024)/26,0.6)))}));` |

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
| `CSDDDEngine.identify_adverse_impacts` | entity_name, nace_codes, countries_of_operation, supplier_countries, forced_labour_risk, child_labour_risk, deforestation_exposure, conflict_minerals_exposure | Identify actual and potential adverse human rights & environmental impacts. |
| `CSDDDEngine.assess_dd_compliance` | entity_name, scope_group, dd_policy_integrated, impact_identification_score, prevention_mitigation_score, remediation_score, remediation_provided, stakeholder_engagement_score | Full due diligence compliance assessment under CSDDD. |
| `CSDDDEngine.assess_value_chain_mapping` | entity_name, upstream_supplier_count, upstream_countries, downstream_partner_count, downstream_countries, tier1_mapped, tier2_mapped, tier3_plus_mapped | Assess value chain mapping completeness for CSDDD compliance. |
| `CSDDDEngine._generate_recommendations` | overall, gaps, ctp_gaps, gm_status, director_duty, eudr_overlap |  |
| `CSDDDEngine.get_scope_thresholds` |  |  |
| `CSDDDEngine.get_adverse_impact_categories` |  |  |
| `CSDDDEngine.get_dd_obligations` |  |  |
| `CSDDDEngine.get_climate_transition_plan_requirements` |  |  |
| `CSDDDEngine.get_penalty_framework` |  |  |
| `CSDDDEngine.get_cross_framework_map` |  |  |
| `CSDDDEngine.get_high_risk_sectors` |  |  |

**Engine `csddd_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SCOPE_THRESHOLDS` | `{'group_1': {'applies_from': '2027-07-26', 'employees_min': 5000, 'turnover_min_eur': 1500000000, 'description': 'Large EU companies (>5000 employees AND >EUR 1.5bn turnover)'}, 'group_2': {'applies_from': '2028-07-26', 'employees_min': 3000, 'turnover_min_eur': 900000000, 'description': 'Medium-lar` |
| `ADVERSE_IMPACT_CATEGORIES` | `{'HR-01': {'category': 'human_rights', 'title': 'Forced / compulsory labour', 'instruments': ['ILO C29', 'ILO C105'], 'severity_weight': 1.0}, 'HR-02': {'category': 'human_rights', 'title': 'Child labour', 'instruments': ['ILO C138', 'ILO C182', 'UNCRC Art 32'], 'severity_weight': 1.0}, 'HR-03': {'c` |
| `CLIMATE_TRANSITION_PLAN_REQUIREMENTS` | `[{'id': 'CTP-01', 'requirement': 'Paris-aligned GHG reduction targets (1.5C pathway)', 'article': 'Art 22(1)'}, {'id': 'CTP-02', 'requirement': 'Time-bound implementation actions', 'article': 'Art 22(1)'}, {'id': 'CTP-03', 'requirement': 'Description of decarbonisation levers', 'article': 'Art 22(1)` |
| `DD_OBLIGATION_CATEGORIES` | `[{'id': 'DD-01', 'obligation': 'Integrate due diligence into company policies', 'article': 'Art 5', 'weight': 0.1}, {'id': 'DD-02', 'obligation': 'Identify actual & potential adverse impacts', 'article': 'Art 6', 'weight': 0.2}, {'id': 'DD-03', 'obligation': 'Prevent & mitigate potential adverse imp` |
| `PENALTY_FRAMEWORK` | `{'max_turnover_pct': 5.0, 'description': 'Up to 5% of worldwide net turnover', 'injunctive_relief': True, 'naming_and_shaming': True, 'interim_measures': True, 'civil_liability': {'article': 'Art 29', 'description': 'Civil liability for failure to prevent / bring to end adverse impacts', 'limitation` |
| `CSDDD_CROSS_FRAMEWORK_MAP` | `[{'csddd_article': 'Art 6 (Impact identification)', 'csrd_esrs': 'ESRS S1 (Own Workforce), S2 (Value Chain Workers), S3 (Affected Communities)', 'ungp': 'Pillar II — Human Rights Due Diligence', 'oecd': 'Chapter IV — Human Rights'}, {'csddd_article': 'Art 7-8 (Prevention & remediation)', 'csrd_esrs'` |
| `HIGH_RISK_SECTORS` | `{'textiles': {'nace': ['C13', 'C14', 'C15'], 'risk_areas': ['HR-01', 'HR-02', 'HR-05', 'HR-06']}, 'agriculture_food': {'nace': ['A01', 'A02', 'C10', 'C11'], 'risk_areas': ['HR-01', 'HR-02', 'HR-07', 'ENV-02']}, 'extractives': {'nace': ['B05', 'B06', 'B07', 'B08', 'B09'], 'risk_areas': ['HR-07', 'HR-` |

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

Country risk combines WBI governance scores, ITUC Global Rights Index, and INFORM risk index for humanitarian crisis exposure. Sector risk maps to OECD sector-specific due diligence guidance (minerals, garments, agriculture, finance). Spend materiality ensures proportionate focus on high-value relationships. Audit history adjusts risk down for SMETA-audited or SA8000-certified suppliers.

**Standards:** ['CSDDD Directive Art. 7-8', 'OECD Guidance on Sector-Specific Due Diligence', 'Sedex SMETA Audit Standards']
**Reference documents:** EU CSDDD Directive (EU) 2024/1760 â€” Articles 7–11; OECD Sector-Specific Due Diligence Guidance (Minerals, Garments, Finance); Sedex SMETA 4-Pillar Audit Standard; SA8000 Social Accountability Standard

**Engine `csddd_engine` — extracted transformation lines:**
```python
risk_score = min(100.0, round(weighted / len(unique_impacts) * 100, 1))
ctp_score = sum(100 / len(ctp_checks) for _, met, _ in ctp_checks if met)
all_countries = list(set(upstream_countries + downstream_countries))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes an *Automated Supplier Risk Triage* — `SupplierRisk = f(Country × Sector × Spend ×
Audit)` weighting ITUC/WBI/INFORM indices. **The React page does not implement that.**
`CsdddEnginePage.jsx` generates 60 synthetic companies via `sr(s)=frac(sin(s+1)×10⁴)` and presents four
tabs. The one genuinely correct piece is the **Scope & Timeline classifier** (real CSDDD Art 2
thresholds and application dates); adverse-impact, value-chain and transition-plan metrics are seeded.
A backend `csddd_engine.py` exists but the page does not call it for its default view. Flag mismatch.

### 7.1 What the module computes

`genCompanies(60)` builds each company `i` from three seed draws:
```js
sector   = SECTORS[floor(sr(i·7+3)·10)]
employees= floor(sr(i·13+7)·45000 + 1000)          // 1,000–46,000
turnover = (sr(i·19+11)·14 + 0.5)                   // €0.5–14.5 bn
grp      = emp≥5000 & to≥1.5 ? 0 : emp≥3000 & to≥0.9 ? 1 : 2   // real CSDDD groups
ddScore  = floor(sr(i·31+7)·60 + 35)                // 35–95 due-diligence score
```
The **Scope & Timeline** tab is a real, non-seeded classifier keyed on user-entered employees/EU
revenue:
```js
EU:     emp≥5000 & rev≥1.5 → Group 1, 26 Jul 2027, Art 2(1)(a)
        emp≥3000 & rev≥0.9 → Group 2, 26 Jul 2028, Art 2(1)(b)
        emp≥1000 & rev≥0.45→ Group 3, 26 Jul 2029, Art 2(1)(c)
Non-EU: euRev≥1.5/0.9/0.45 → Non-EU Group 1/2/3 (Art 2(2))
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Scope groups & dates | Art 2(1)(a-c) / 2(2)(a-c); 2027/2028/2029; transposition 26 Jul 2026 | **real** — CSDDD 2024/1760 |
| 15 impact categories | HR-01…07, ENV-01…06, GOV-01…02 | curated (CSDDD Annex-aligned) |
| 4 value-chain tiers | Tier 1/2/3+/Own Operations | curated |
| Company employees/turnover | `sr()·range` | synthetic seeded |
| Due-diligence score | `sr(i·31+7)·60+35` | synthetic seeded |
| Impacts identified/remediated | `sr()·12+1` / `sr()·8` | synthetic seeded |
| Grievances | `sr()·20` | synthetic seeded |
| SBTi status | `['Committed','Target Set','No Commitment'][floor(sr·3)]` | synthetic seeded |
| Transition pathway | `100·(1 − ((yr−2024)/26)^0.7)` baseline vs seeded company curve | curve shape modelling choice |
| Sector risk / impact density | `sr()·70+20` / `sr()·3+0.5` | synthetic seeded |

### 7.3 Calculation walkthrough

60 companies generated once. **Scope & Timeline** classifies a live user-entered company (real logic).
**Adverse Impact** aggregates seeded per-category identified/remediated counts → `remRate =
round(remediated/identified·100)` and a chain-tier breakdown (`sr()` actual vs potential impacts).
**Value Chain Mapping** shows seeded relationship counts and sector-risk scores. **Climate Transition
Plan** plots a decarbonisation baseline (`(yr−2024)/26` power curve) vs a seeded company path.

### 7.4 Worked example (Scope classifier, real logic)

User enters `emp = 6,000`, `rev = €2.0bn`, EU:
```
emp≥5000 (6000✓) & rev≥1.5 (2.0✓) → Group 1, applies 26 Jul 2027, Art 2(1)(a)
```
Change to `emp = 3,500`, `rev = €1.0bn`: fails Group 1 (emp<5000 or rev<1.5), passes
`emp≥3000 & rev≥0.9` → Group 2, 26 Jul 2028. The thresholds and dates exactly match the Directive.
For a seeded company, e.g. `remRate`: identified=`floor(sr(i·43+3)·12+1)`, remediated=`floor(sr(i·47+7)·8)`
→ `round(remediated/identified·100)`.

### 7.5 Data provenance & limitations

- **Scope & Timeline is real and correct** (Art 2 thresholds, application dates, article citations).
- **All 60 companies and their impact/grievance/SBTi/transition metrics are seeded** via `sr()`.
- The guide's supplier-risk-triage formula (ITUC/WBI/INFORM × spend × audit) and the backend
  `csddd_engine.py` are **not wired** into the default page.

**Framework alignment:** CSDDD Directive (EU) 2024/1760 — Art 2 scope/phasing (implemented), Art 6–11
due-diligence cycle, Art 15 Paris transition plan (illustrated). OECD sector DDG, Sedex SMETA, SA8000,
INFORM referenced in guide but not computed on the page.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Supplier-risk triage and the impact metrics
are seeded; only the scope classifier is production-ready.

**8.1 Purpose & scope.** Automate supplier risk triage across Tier 1–3 so due-diligence effort
concentrates on high-risk relationships, and track the CSDDD due-diligence cycle to auditable evidence.

**8.2 Conceptual approach.** A **multiplicative country×sector×spend×audit risk score**, the design
used by Sedex Radar, EcoVadis IQ and RepRisk supplier screening; country risk blends ITUC labour-rights,
WBI governance and INFORM crisis exposure; sector maps to OECD sector-specific DDG base rates.

**8.3 Mathematical specification.**
```
CountryRisk_c = 0.4·(1−WBI_c) + 0.4·ITUC_c + 0.2·INFORM_c            # 0–1
SectorRisk_s  = OECD sector base rate (minerals, garments, agri, …)  # 0–1
SpendWeight_i = Spend_i / Σ Spend                                    # materiality
AuditAdj_i    = SMETA/SA8000 verified ? 0.7 : 1.0                    # de-risking
SupplierRisk_i= CountryRisk_c · SectorRisk_s · (0.5+0.5·SpendWeight_i) · AuditAdj_i
Flag_i        = SupplierRisk_i > θ_high  → enhanced due diligence
```

| Parameter | Source |
|---|---|
| `WBI_c` | World Bank Worldwide Governance Indicators |
| `ITUC_c` | ITUC Global Rights Index (1–5+) |
| `INFORM_c` | EC INFORM Risk Index |
| `SectorRisk_s` | OECD sector DDG |
| Audit status | Sedex SMETA / SA8000 certificates |

**8.4 Data requirements.** Supplier registry (tier, country, sector, spend), audit certificates,
ITUC/WBI/INFORM indices. Vendors: Sedex, EcoVadis, RepRisk; free: World Bank, ITUC, EC INFORM. Scope
classifier and impact taxonomy already exist.

**8.5 Validation & benchmarking.** Reconcile flagged-supplier rate to the guide's 5–25% expectation;
verify audit adjustment lowers scores correctly; benchmark ordering against EcoVadis/Sedex ratings on
overlapping suppliers.

**8.6 Limitations & model risk.** Spend materiality can under-weight small but high-risk raw-material
origins; country indices are slow-moving; audit certificates vary in rigour. Fallback: risk *bands*
plus mandatory enhanced review for any Tier-3 conflict-mineral origin regardless of score.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its backend; build the supplier-triage formula (analytics ladder: rung 1 → 2)

**What.** §7's flag has two parts: the page's 60 companies and all their
impact/grievance/SBTi/transition metrics are `sr()`-seeded, and the backend
`csddd_engine.py` behind 11 routes is "not wired into the default page". The one
real piece — the Scope & Timeline classifier with correct Art. 2 thresholds, groups,
and application dates (2027/28/29, transposition 26 Jul 2026) — proves the module
can do regulatory logic properly. The guide's triage formula
`SupplierRisk = f(Country × Sector × Spend × Audit)` exists nowhere. Evolution A
wires and builds.

**How.** (1) Wiring: the adverse-impact and value-chain tabs consume
`POST /csddd/adverse-impacts` and `/value-chain-mapping`, with the six ref GETs
(`/ref/adverse-impacts`, `/ref/high-risk-sectors`, `/ref/dd-obligations`…) as the
reference layer — deleting the seeded 60-company generator. (2) Triage engine: the
guide's four-factor product implemented server-side — country risk from ITUC/WGI
curated tables (shared with `csddd-compliance`'s Evolution A — build the country-
risk refdata once), sector risk from the module's own `/ref/high-risk-sectors`
endpoint, spend materiality from entered supplier spend, audit adjustment for
SMETA/SA8000 certification flags — producing the risk-tiered supplier queue the
overview promises. (3) Supplier registry persistence (a `csddd_suppliers` table)
with the questionnaire workflow tracking response states — the module's operational
identity. (4) Harness fixtures for the four POSTs.

**Prerequisites (hard).** PRNG purge; the shared country-risk refdata; supplier
data entry/import path. **Acceptance:** the Scope classifier still reproduces its
Art. 2 outputs (regression); a DRC-cobalt supplier outranks a German-services one
via the documented factor product; every displayed metric traces to an endpoint or
an entered record.

### 9.2 Evolution B — Questionnaire and grievance triage analyst (LLM tier 2)

**What.** The module's promised workflow — screening questionnaires, impact
register population, grievance case management — is textual work at scale.
Evolution B staffs it: questionnaire responses get first-pass analysis (flag
contradictions, map answers to CSDDD Annex impact categories, propose register
entries with quoted response passages); grievance intake gets structured triage
(category, severity indicators, escalation recommendation per the documented
rules) — every proposal queued for human confirmation, preserving the audit trail
that is this module's entire regulatory value.

**How.** Tier-2 with gated writes: read tools over the supplier registry and
`/ref/adverse-impacts` category definitions; proposals persist as drafts pending
confirmation. Classification prompts ground on the 15 curated impact categories and
the OECD sector-guidance texts; a response that evidences no impact yields "no
adverse impact indicated", never a manufactured finding. Grievance summaries cite
the case record verbatim.

**Prerequisites (hard).** Evolution A's registry and questionnaire persistence
(there is nothing real to triage today); category definitions and OECD texts
embedded; RBAC on the confirmation workflow. **Acceptance:** register-entry
proposals carry quoted questionnaire evidence; classification precision ≥90% on a
hand-labelled response set before auto-queueing; no proposal enters the register
without a named human confirmer in the audit log.