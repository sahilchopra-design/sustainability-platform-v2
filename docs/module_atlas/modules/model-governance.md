# Model Governance Hub
**Module ID:** `model-governance` · **Route:** `/model-governance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised ESG model risk management platform covering model inventory, validation workflows, documentation standards, approval gating, and ongoing performance monitoring across all quantitative ESG and climate risk models. Implements SR 11-7, ECB, and PRA model risk management supervisory expectations with role-based access control, version management, and independent validation assignment. Supports both in-house and vendor model governance.

> **Business value:** Provides model risk officers and quantitative teams with a centralised, auditable governance hub that satisfies SR 11-7, ECB, and PRA supervisory expectations for ESG model risk management while reducing compliance burden through workflow automation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CHANGELOG_KEY`, `KpiCard`, `MODEL_DEPENDENCIES`, `MODEL_REGISTRY`, `REGULATORY_FRAMEWORKS`, `REVIEW_ITEMS`, `RISK_TIERS`, `Section`, `StatusBadge`, `TierBadge`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtDate` | `d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'N/A';` |
| `daysDiff` | `(a,b) => Math.floor((new Date(b)-new Date(a))/86400000);` |
| `monthsDiff` | `(a,b) => Math.round(daysDiff(a,b)/30.44);` |
| `ages` | `modelsWithStatus.filter(m=>m.validation_age!=null).map(m=>m.validation_age);` |
| `avgAge` | `ages.length ? (ages.reduce((a,b)=>a+b,0)/ages.length).toFixed(1) : 'N/A';` |
| `nextDue` | `modelsWithStatus.filter(m=>m.next_validation).sort((a,b)=>new Date(a.next_validation)-new Date(b.next_validation))[0];` |
| `categories` | `new Set(modelsWithStatus.map(m=>m.category));` |
| `entry` | `{ id:`CL-${Date.now()}`, modelId:clModelId, change:clChange, reason:clReason, timestamp:new Date().toISOString(), user:'Quant Team' };` |
| `rows` | `MODEL_REGISTRY.map(m=>[m.id,m.name,m.engine,m.category,m.risk_tier,m.validation_status,m.last_validated\|\|'',m.next_validation\|\|'',(m.regulatory_use\|\|[` |
| `csv` | `[headers.join(','),...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `pkg` | `{ exported:new Date().toISOString(), platform:'Risk Analytics v6.0', type:'Model Validation Report', models:MODEL_REGISTRY.map(m=>({...m,computed_stat` |
| `blob` | `new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'});` |
| `blob` | `new Blob([doc],{type:'text/plain'});` |
| `pct` | `Math.round(completed/REVIEW_ITEMS.length*100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODEL_DEPENDENCIES`, `MODEL_REGISTRY`, `REGULATORY_FRAMEWORKS`, `REVIEW_ITEMS`, `RISK_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Models in Inventory | — | Platform model registry | Total number of quantitative ESG and climate risk models registered and governed in the platform |
| Models Awaiting Validation (%) | — | Validation queue status | Proportion of registered models past their scheduled validation date without approved revalidation |
| Mean Validation Cycle Time (days) | — | Validation workflow logs | Average elapsed time from model validation initiation to independent validation committee approval |
| Critical Model (High MRR) Count | — | Model risk rating distribution | Number of models rated High MRR requiring annual full validation and senior sign-off |
- **Model intake forms and technical documentation** → Classify by model type, risk rating, and validation status; register in inventory → **Structured model registry with metadata, ownership, and governance status**
- **Validation workflow engine** → Route documents to assigned validators; track checklist completion and findings → **Validation report with finding severity classification and remediation requirements**
- **Performance monitoring data pipeline** → Compute PSI and outcome analysis metrics monthly; compare to risk appetite thresholds → **Ongoing monitoring dashboard with revalidation trigger alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Model Risk Rating
**Headline formula:** `MRR = Materiality × Complexity × (1 + Concentration)`
**Standards:** ['Federal Reserve SR 11-7 Supervisory Guidance on Model Risk Management', 'ECB Guide on Internal Models 2019', 'PRA SS1/23 Model Risk Management Principles 2023', 'ISO/IEC 42001 AI Management System 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).