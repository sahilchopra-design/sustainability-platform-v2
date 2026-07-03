# Equitable Earth Methodologies
**Module ID:** `equitable-earth-methodologies` · **Route:** `/equitable-earth-methodologies` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements justice-based climate transition frameworks incorporating indigenous rights, community free prior informed consent, gender equity, and distributive justice principles into ESG and climate analytics. Aligns with the Equitable Earth principles, UNDRIP, and emerging just transition taxonomies from ILO, OECD, and the LSE Grantham Institute. Provides scoring, documentation, and narrative analytics for impact-first investors and development finance institutions.

> **Business value:** Enables impact investors, DFIs, and project developers to demonstrate and document genuine justice-based transition practices, satisfy emerging just transition bond frameworks, and build social licence that reduces project delay and reputational risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_KEYS`, `Badge`, `Card`, `DualInput`, `Kpi`, `PILLARS`, `PROJECTS`, `STANDARDS`, `Section`, `TIER_COLORS`, `TIME_SERIES`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `(n) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : fmt(n);` |
| `overall` | `PILLARS.reduce((s, p) => s + (scores[p.id] \|\| 0) * p.weight, 0);` |
| `netRate` | `Math.max(0, baselineRate - projectRate); // projects exceeding baseline yield 0 credits, not phantom positive credits` |
| `grossAnnual` | `netRate * area;` |
| `grossTotal` | `grossAnnual * creditingPeriod;` |
| `leakageDeduction` | `grossTotal * (leakagePct / 100);` |
| `afterLeakage` | `grossTotal - leakageDeduction;` |
| `bufferDeduction` | `afterLeakage * (bufferPct / 100);` |
| `afterBuffer` | `afterLeakage - bufferDeduction;` |
| `uncertaintyDeduction` | `afterBuffer * (uncertaintyPct / 100);` |
| `netCredits` | `Math.max(0, afterBuffer - uncertaintyDeduction);` |
| `qualityMultiplier` | `pillarResult.overall / 100;` |
| `adjustedCredits` | `Math.round(netCredits * qualityMultiplier);` |
| `cobCredits` | `Math.round(adjustedCredits * cobenefitMult);` |
| `base` | `std.score + (sr(i * 13) - 0.5) * 20;` |
| `names` | `['Amazon Mosaic Reserve','Kalimantan Peatland Complex','Mekong Floodplain Forest','Madre de Dios NF Buffer','Mt. Kenya Watershed','Congo Basin REDD+',` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PILLARS`, `STANDARDS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FPIC Documentation Score (%) | — | UNDRIP / IFC PS7 | Completeness of free, prior, and informed consent documentation; 100% required for projects affecting indigeno |
| Local Employment Ratio (%) | — | ILO / Project Records | Proportion of project jobs filled by local and affected community workers; key equity and community benefit me |
| Benefit-Sharing Rate (% of revenue) | — | Equitable Earth Standard | Proportion of project revenue shared with host communities through direct payments, infrastructure, or equity  |
| Gender Equity Index (0â€“100) | — | UN Women / IFC | Composite measuring women's participation in employment, leadership, and benefit-sharing within the transition |
- **Project FPIC documentation and community consultation records** → Classify against UNDRIP article checklist; score completeness and authenticity → **FPIC compliance score and documentation gap log**
- **Employment and procurement records** → Disaggregate by gender, community origin, and income quintile → **Local employment ratio and gender equity index**
- **Revenue and benefit-sharing agreements** → Map contractual commitments to Equitable Earth benefit-sharing tiers → **Benefit-sharing rate and community revenue flow ($)**

## 5 · Intermediate Transformation Logic
**Methodology:** Just Transition Score
**Headline formula:** `JTS = w_r × Rights + w_e × Equity + w_c × Community + w_g × Governance`
**Standards:** ['UNDRIP 2007', 'ILO Just Transition Guidelines 2015', 'LSE Grantham Just Transition Framework 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).