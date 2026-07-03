# CSRD ESRS Full Suite
**Module ID:** `csrd-esrs-full-suite` · **Route:** `/csrd-esrs-full-suite` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Complete CSRD European Sustainability Reporting Standards implementation. Covers ESRS 2 (General), E1-E5 (Environmental), S1-S4 (Social), G1 (Governance). Includes double materiality assessment and IRO register.

> **Business value:** CSRD applies to ~50,000 EU and non-EU companies from 2024-2028 phased rollout. ESRS disclosures will be publicly available and machine-readable. This module provides the complete double materiality assessment and disclosure drafting system required for compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `E1_DRS`, `E2_DRS`, `E3_DRS`, `E4_DRS`, `E5_DRS`, `ESRS_OVERVIEW`, `STATUS_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalDrs` | `ESRS_OVERVIEW.reduce((s,e)=>s+e.drs,0);` |
| `totalDps` | `ESRS_OVERVIEW.reduce((s,e)=>s+e.datapoints,0);` |
| `avgComplete` | `Math.round(ESRS_OVERVIEW.reduce((s,e)=>s+e.complete,0)/ESRS_OVERVIEW.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `E1_DRS`, `E2_DRS`, `E3_DRS`, `E4_DRS`, `E5_DRS`, `ESRS_OVERVIEW`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESRS Standards | — | EFRAG | ESRS 2 + E1-5 + S1-4 + G1 |
| Cross-Cutting | — | EFRAG | General principles and general disclosures — always required |
| Conditional Standards | — | EFRAG | E1-E5, S1-S4, G1 — only if material |
| Double Materiality | — | CSRD | Two-sided test triggering disclosure obligations |
- **IRO identification** → Double materiality scoring → **Material topics determination**
- **Material ESRS topics** → DR-level data collection → **ESRS disclosures**
- **ESRS disclosures** → ESEF XBRL tagging → **Machine-readable regulatory filing**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS double materiality
**Headline formula:** `IRO_material = FinancialMateriality OR ImpactMateriality (either triggers)`
**Standards:** ['EFRAG ESRS Set 1 (2023)', 'EU CSRD Delegated Act']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).