# ESMS Platform
**Module ID:** `esms` · **Route:** `/esms` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Environmental and Social Management System platform supporting IFC Performance Standards compliance for project finance lenders, development finance institutions, and project sponsors. Provides a structured workflow for E&S policy development, impact screening, ESAP management, monitoring report intake, and grievance mechanism tracking. Aligns with IFC PS1â€“PS8, World Bank ESF, and ADB SPS requirements.

> **Business value:** Enables project finance lenders and sponsors to systematically manage IFC PS compliance obligations across project lifecycles, reduce disbursement risk from ESAP non-compliance, and demonstrate robust E&S governance to co-lenders, development finance partners, and ESG-mandated investors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRIES`, `Card`, `EP_SECTORS`, `ESMS_COMPONENTS`, `IFC_PS`, `Inp`, `KpiCard`, `MODULE_CODE`, `REGULATORY_FRAMEWORKS`, `REG_MATRIX`, `RISK_CATEGORIES`, `STATUS_OPTIONS`, `STATUS_SCORE`, `SectionTitle`, `Sel`, `TEMPLATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `initComponents` | `() => ESMS_COMPONENTS.map(c => ({ ...c, status: 'Not Started', notes: '' }));` |
| `scores` | `components.map(c => STATUS_SCORE[c.status]);` |
| `avg` | `scores.reduce((a, b) => a + b, 0) / scores.length;` |
| `radarData` | `categories.map(cat => {` |
| `catAvg` | `catComps.length > 0 ? catComps.reduce((a, c) => a + STATUS_SCORE[c.status], 0) / catComps.length : 0;` |
| `barData` | `components.map(c => ({` |
| `months` | `pri === 'Critical' ? '1-3 months' : pri === 'High' ? '3-6 months' : '6-12 months';` |
| `groupComps` | `g.ids.map(id => components.find(c => c.id === id)).filter(Boolean);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `EP_SECTORS`, `ESMS_COMPONENTS`, `ESMS_GROUPS`, `IFC_PS`, `REGULATORY_FRAMEWORKS`, `RISK_CATEGORIES`, `STATUS_OPTIONS`, `TABS`, `TEMPLATES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESCS Overall (%) | — | IFC PS Audit | Weighted compliance score across all applicable PS sub-requirements; EP Category A projects require 90%+ at fi |
| Major NC Count | — | ESIA/ESAP Audit | Number of unresolved Major Non-Conformances; any Major NC blocks disbursement per EP lender covenant. |
| Grievance Mechanism Response Rate (%) | — | IFC PS1 Â§28 | Proportion of community grievances receiving documented response within SLA (typically 30 days); IFC PS1 manda |
| ESAP Completion Rate (%) | — | Monitoring Report | Proportion of Environmental and Social Action Plan items completed vs. schedule; covenant trigger if <80% at m |
- **ESIA and ESAP documents** → Parse PS sub-requirements; classify compliance status from ESIA findings; auto-populate compliance matrix → **PS compliance matrix with Compliant/Minor/Major ratings and evidence references**
- **Independent monitoring reports (semi-annual)** → Ingest structured monitoring data; update ESAP closure status and PS compliance scores → **Updated ESCS, ESAP completion rate, and NC trend**
- **Grievance register (community complaints and company responses)** → Track grievance intake, categorisation, response, and resolution; compute SLA compliance rate → **Grievance resolution rate, average response time, and open grievance summary by PS category**

## 5 · Intermediate Transformation Logic
**Methodology:** E&S Compliance Score
**Headline formula:** `ESCS = (PS_Compliant + 0.5 × PS_Minor) / PS_Total × 100`
**Standards:** ['IFC Performance Standards 2012', 'World Bank ESF 2018', 'Equator Principles IV 2020']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).