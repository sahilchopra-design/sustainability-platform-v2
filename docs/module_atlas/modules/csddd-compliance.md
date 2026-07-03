# CSDDD Compliance
**Module ID:** `csddd-compliance` · **Route:** `/csddd-compliance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses corporate compliance with the EU Corporate Sustainability Due Diligence Directive, covering adverse impact identification, prioritisation, prevention, and remediation across direct and indirect supply chain tiers. Tracks remediation plan completion and generates CSDDD annual report content.

> **Business value:** Enables legal and sustainability teams at large EU companies to build and maintain a CSDDD-compliant due diligence system, produce mandatory annual disclosures, and demonstrate active prevention and remediation of adverse impacts across global supply chains.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLES`, `Badge`, `Btn`, `CATEGORIES`, `CSDDD_PHASES`, `CSDDD_REQUIREMENTS`, `Card`, `KpiCard`, `PIE_COLORS`, `STATUS_COLORS`, `STATUS_OPTIONS`, `SUPPLY_CHAIN_TIERS`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `[...new Set(CSDDD_REQUIREMENTS.map(r => r.category))];` |
| `ARTICLES` | `[...new Set(CSDDD_REQUIREMENTS.map(r => r.article))];` |
| `STATUS_OPTIONS` | `['Compliant', 'Partial', 'Gap', 'N/A'];` |
| `STATUS_COLORS` | `{ Compliant: T.green, Partial: T.amber, Gap: T.red, 'N/A': T.textMut };` |
| `SUPPLY_CHAIN_TIERS` | `['Tier 1 — Direct suppliers', 'Tier 2 — Sub-suppliers', 'Tier 3 — Raw material origins'];` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `applicable` | `total - na;` |
| `compliancePct` | `applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;` |
| `partialPct` | `applicable > 0 ? Math.round((partial / applicable) * 100) : 0;` |
| `employees` | `c.employees \|\| Math.round(seed(c.id?.charCodeAt?.(0) \|\| 1) * 15000 + 500);` |
| `turnover` | `c.revenue_usd_mn \|\| Math.round(seed((c.id?.charCodeAt?.(1) \|\| 2) + 10) * 3000 + 100);` |
| `hasSBTi` | `seed((c.id?.charCodeAt?.(2) \|\| 3) + 5) > 0.55;` |
| `hasNZTarget` | `seed((c.id?.charCodeAt?.(3) \|\| 4) + 7) > 0.45;` |
| `transitionScore` | `Math.round(seed((c.id?.charCodeAt?.(0) \|\| 1) + 20) * 40 + 30);` |
| `gapFraction` | `metrics.applicable > 0 ? metrics.gaps / metrics.applicable : 0;` |
| `totalRevenue` | `phasedCompanies.reduce((s, c) => s + (c.turnover \|\| 0), 0);` |
| `maxPenalty` | `totalRevenue * 0.05;` |
| `estimatedPenalty` | `maxPenalty * gapFraction;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ARTICLES`, `CATEGORIES`, `CSDDD_PHASES`, `CSDDD_REQUIREMENTS`, `PIE_COLORS`, `STATUS_OPTIONS`, `SUPPLY_CHAIN_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| In-Scope Companies (EU) | — | EC Impact Assessment | Companies subject to CSDDD: EU companies with >1,000 employees and €450M global turnover |
| Supply Chain Tier Coverage | — | CSDDD Art. 3 | Due diligence coverage spans direct (Tier 1) and indirect suppliers to the extent feasible |
| Adverse Impact Categories | — | CSDDD Annex | CSDDD covers environmental impacts (Annex Part II) and human rights impacts (Annex Part I) |
| Remediation Plan Completion | — | Internal tracking | Percentage of identified adverse impacts with completed or on-track remediation plans |
| Grievance Mechanism Coverage | — | CSDDD Art. 14 | Whether accessible grievance mechanisms exist for affected workers and communities |
- **Supplier registry and Tier 1–3 mapping** → Classify by geography and sector, apply ITUC/WBI risk scores → **Supplier risk profile per tier**
- **CSDDD Annex adverse impact list** → Screen operations and supply chain against each impact category → **Adverse impact identification register**
- **Remediation plan records** → Track action completion dates, evidence uploads, outcome assessments → **Remediation progress dashboard per impact**

## 5 · Intermediate Transformation Logic
**Methodology:** CSDDD Adverse Impact Prioritisation
**Headline formula:** `Priority_score = Severity × Likelihood × Breadth / RemediationCapacity`
**Standards:** ['CSDDD Directive (EU) 2024/1760', 'UN Guiding Principles on Business and Human Rights', 'OECD Due Diligence Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).