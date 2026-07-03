# Sanctions & Climate Finance
**Module ID:** `sanctions-climate-finance` · **Route:** `/sanctions-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analytics for climate finance flows involving sanctioned entities, jurisdictions or counterparties, supporting compliance and integrity in green finance.

> **Business value:** Screens climate finance activity against global sanctions lists to protect green instrument integrity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLIMATE_PROJECTS`, `COMPANIES_100`, `COMP_NAMES`, `COUNTRIES_60`, `DUAL_USE_TECH`, `REGIMES`, `REGIME_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tabs` | `['Sanctions Landscape','Climate Finance Impact','Dual-Use Technology','Portfolio Compliance'];` |
| `sectors` | `[...new Set(COMPANIES_100.map(c=>c.sector))];` |
| `rows` | `filteredCompanies.map(c=>[c.name,c.country,c.sector,c.sdnMatch?'YES':'NO',c.euSanctioned?'YES':'NO',c.ukSanctioned?'YES':'NO',c.unSanctioned?'YES':'NO` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `pagedCompanies` | `filteredCompanies.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filteredCompanies.length/PAGE_SIZE);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIMATE_PROJECTS`, `COLORS`, `COMPANIES_100`, `COMP_NAMES`, `DUAL_USE_TECH`, `REGIMES`, `REGIME_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Flagged Transactions | — | Sanctions engine | Number of climate finance transactions flagged for sanctioned counterparty involvement. |
| Jurisdictional Overlap | — | OFAC/UN lists | Number of recipient countries appearing on active sanctions lists within reporting period. |
| Tainted Flow Ratio | — | Calculated | Share of total climate finance volume routed through sanctioned or restricted channels. |
- **Climate finance transaction register, sanctions list feeds** → Entity matching, network graph traversal, tainted flow calculation → **Compliance flags, escalation reports, audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Tainted Flow Ratio
**Headline formula:** `Σ Climate Finance to Sanctioned Entities ÷ Total Climate Finance × 100`
**Standards:** ['OFAC SDN List', 'UN Sanctions', 'FATF Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).