# Green Asset Ratio Calculator
**Module ID:** `green-asset-ratio` · **Route:** `/green-asset-ratio` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Taxonomy Green Asset Ratio computation for credit institutions. Covers numerator (taxonomy-aligned loans/bonds/equity), denominator (total covered assets), and phase-in exemptions.

> **Business value:** GAR is the primary climate metric in EU bank supervisory reporting and investor ESG assessments. Banks with low GARs face reputational risk and regulatory scrutiny. This module provides the systematic calculation infrastructure banks need for accurate and auditable GAR disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWER_NAMES`, `BTAR_ASSET_CLASSES`, `COMPLIANCE_CHECKLIST`, `COUNTRIES_EU`, `DNSH_CRITERIA`, `EBA_TEMPLATES`, `ENV_OBJECTIVES`, `GAR_HISTORY`, `LOAN_POSITIONS`, `MIN_SAFEGUARDS_FRAMEWORK`, `NACE_ACTIVITIES`, `PEER_BANKS`, `SECTOR_EMISSIONS_T1`, `StatusBadge`, `TABS`, `TOP20_CARBON`, `TabBTAR`, `TabDNSH`, `TabDNSHDeepDive`, `TabDownstreamExport`, `TabEBAPillar3`, `TabGARCalculator`, `TabGARSensitivity`, `TabMinSafeguards`, `TabTaxonomyEligibility`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];` |
| `rng` | `(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);` |
| `rngInt` | `(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));` |
| `fmt` | `(v,d=1)=>typeof v==='number'?v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}):'-';` |
| `fmtM` | `(v)=>'EUR '+fmt(v,1)+'M';` |
| `fmtPct` | `(v)=>fmt(v,2)+'%';` |
| `fmtBps` | `(v)=>(v*100).toFixed(0)+' bps';` |
| `actIdx` | `rngInt(0, NACE_ACTIVITIES.length - 1, i * 13 + 7);` |
| `country` | `pick(COUNTRIES_EU, i * 3 + 11);` |
| `exposure` | `rng(5, 850, i * 7 + 3);` |
| `dnshPass` | `eligible ? sr(i * 17 + 5) > 0.2 : false;` |
| `minSafeguardsPass` | `eligible ? sr(i * 19 + 9) > 0.15 : false;` |
| `alignedCCM` | `eligible && dnshPass && minSafeguardsPass && act.tsc && act.tsc.startsWith('CCM') ? sr(i * 23 + 1) > 0.25 : false;` |
| `alignedCCA` | `eligible && dnshPass && minSafeguardsPass && sr(i * 29 + 3) > 0.85 ? true : false;` |
| `alignedWTR` | `eligible && dnshPass && minSafeguardsPass && sr(i * 31 + 5) > 0.92 ? true : false;` |
| `alignedCE` | `eligible && dnshPass && minSafeguardsPass && sr(i * 37 + 7) > 0.93 ? true : false;` |
| `alignedPPC` | `eligible && dnshPass && minSafeguardsPass && sr(i * 41 + 9) > 0.95 ? true : false;` |
| `alignedBIO` | `eligible && dnshPass && minSafeguardsPass && sr(i * 43 + 11) > 0.96 ? true : false;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BORROWER_NAMES`, `BTAR_ASSET_CLASSES`, `COMPLIANCE_CHECKLIST`, `COUNTRIES_EU`, `DNSH_CRITERIA`, `EBA_TEMPLATES`, `ENV_OBJECTIVES`, `GAR_HISTORY`, `MIN_SAFEGUARDS_FRAMEWORK`, `NACE_ACTIVITIES`, `PEER_BANKS`, `SECTOR_EMISSIONS_T1`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GAR (typical large bank) | — | EBA data | Wide range due to data availability and sector mix |
| Covered Assets | — | EBA | Excludes exempted categories |
| Key Limitation | — | Implementation | Banks depend on counterparty CSRD disclosures |
- **Loan book data** → NACE code taxonomy screen → **Aligned loan portion**
- **Counterparty CSRD data** → Taxonomy alignment verification → **GAR numerator**
- **Total balance sheet** → Exemption removal → **GAR denominator**

## 5 · Intermediate Transformation Logic
**Methodology:** EU Taxonomy GAR methodology
**Headline formula:** `GAR = Taxonomy_aligned_covered_assets / Total_covered_assets`
**Standards:** ['EBA Pillar 3 ESG Disclosures', 'EU Taxonomy Regulation', 'CRR Article 449a']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).