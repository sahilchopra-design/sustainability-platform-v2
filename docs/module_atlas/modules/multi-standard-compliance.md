# Multi-Standard Compliance Analytics
**Module ID:** `multi-standard-compliance` · **Route:** `/multi-standard-compliance` · **Tier:** B (frontend-computed) · **EP code:** EP-DQ5 · **Sprint:** DQ

## 1 · Overview
Provides comprehensive compliance assessment across all major voluntary and compliance carbon market standards — CDM, GS4GG v4, VCS v4, CAR v12, ACR v9, CORSIA SARS, ISO 14064-3:2019, and ICVCM Core Carbon Principles (10 principles). Scores projects and credits against each standard.

> **Business value:** Essential for carbon market investors conducting credit due diligence, corporations selecting high-integrity offsets for net zero claims, and project developers seeking multiple standard registration. ICVCM CCP is the emerging market standard for voluntary carbon quality assurance.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ACR_REQUIREMENTS`, `ART6_STATUSES`, `ARTICLE6_CA_COUNTRIES`, `ARTICLE6_PENDING_COUNTRIES`, `Badge`, `CAR_PROTOCOLS`, `CCP_PRINCIPLES`, `CDM_REQUIREMENTS`, `CORSIA_ELIGIBLE_STANDARDS`, `COUNTRIES`, `ComplianceCell`, `GS_REQUIREMENTS`, `KpiCard`, `PROJECTS`, `REG_STATUSES`, `ReqRow`, `SECTORS`, `ScoreBadge`, `SectionHeader`, `TYPES_MAP`, `VCS_REQUIREMENTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `cdm` | `Math.round(40 + sr(i * 7  + 1) * 55);` |
| `vcs` | `Math.round(50 + sr(i * 13 + 3) * 48);` |
| `car` | `Math.round(30 + sr(i * 19 + 4) * 60);` |
| `acr` | `Math.round(35 + sr(i * 23 + 5) * 58);` |
| `corsia` | `Math.round(40 + sr(i * 29 + 6) * 55);` |
| `sdgCount` | `3 + Math.floor(sr(i * 31 + 7) * 7);` |
| `sdgs` | `allSdgs.filter((_, idx) => sr(i * 37 + idx * 3) > (1 - sdgCount / 17));` |
| `nonC` | `total - fullyC - partial;` |
| `cdmPassFn` | `(proj, ri) => sr(proj.id.charCodeAt(4) * 7 + ri * 3 + 1) > 0.28;` |
| `gsPassFn` | `(proj, ri) => sr(proj.id.charCodeAt(4) * 11 + ri * 5 + 2) > 0.22;` |
| `vcsPassFn` | `(proj, ri) => sr(proj.id.charCodeAt(4) * 13 + ri * 7 + 3) > 0.20;` |
| `carApplicable` | `sr(idx * 43 + 17) > 0.5;` |
| `acrApplicable` | `sr(idx * 47 + 19) > 0.35;` |
| `corsiaAppl` | `p.corsiaEligible \|\| sr(idx * 53 + 23) > 0.6;` |
| `pct` | `CDM_REQUIREMENTS.length > 0 ? Math.round(passed / CDM_REQUIREMENTS.length * 100) : 0;` |
| `pct` | `CDM_REQUIREMENTS.length > 0 ? Math.round(passedCount / CDM_REQUIREMENTS.length * 100) : 0;` |
| `open` | `CDM_REQUIREMENTS.length - passedCount;` |
| `stars` | `aligned ? 1 + Math.floor(sr(selProject.id.charCodeAt(4) * 13 + sdgNum * 7) * 4) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACR_REQUIREMENTS`, `ART6_STATUSES`, `ARTICLE6_CA_COUNTRIES`, `ARTICLE6_PENDING_COUNTRIES`, `CAR_PROTOCOLS`, `CCP_PRINCIPLES`, `CDM_REQUIREMENTS`, `CORSIA_ELIGIBLE_STANDARDS`, `COUNTRIES`, `GS_REQUIREMENTS`, `REG_STATUSES`, `SECTORS`, `TABS`, `VCS_REQUIREMENTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ICVCM CCP Label Attainment | — | ICVCM CCP Assessment Progress 2024 | Only ~30% of voluntary carbon credits expected to meet ICVCM Core Carbon Principles — quality filter |
| CORSIA Eligible Credits | — | ICAO CORSIA Technical Advisory Body 2023 | CORSIA recognises specific methodologies from CDM, GS, VCS, REDD+ — airline offset compliance use |
| ISO 14064-3 Verification Level | — | ISO 14064-3:2019 §5.4 | ISO 14064-3 defines two verification levels — Reasonable (positive conclusion) required for CDM/VCS; Limited f |
- **Project documentation (PDD, monitoring report, verification report)** → Standard compliance mapping → **Criterion-by-criterion compliance score per standard**
- **ICVCM CCP assessment database** → CCP label checking → **Methodology-level CCP approval status**
- **CORSIA eligible units list** → Aviation offset compliance → **Whether credits qualify for CORSIA Phase 1 airline use**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Standard Compliance Score
**Headline formula:** `ComplianceScore = Σ [w_standard × StandardScore]; StandardScore = Σ [w_criterion × CriterionScore] / n; ICVCMscore = CCPAssessment across 10 principles`
**Standards:** ['ICVCM Core Carbon Principles — Assessment Framework 2023', 'Verra VCS Standard v4.0', 'Gold Standard for Global Goals v4 Principles', 'CDM EB Consolidated Procedures', 'CORSIA Eligible Emissions Unit Criteria 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).