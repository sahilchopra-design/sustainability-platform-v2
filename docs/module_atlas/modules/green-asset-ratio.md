# Green Asset Ratio Calculator
**Module ID:** `green-asset-ratio` · **Route:** `/green-asset-ratio` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Taxonomy Green Asset Ratio computation for credit institutions. Covers numerator (taxonomy-aligned loans/bonds/equity), denominator (total covered assets), and phase-in exemptions.

> **Business value:** GAR is the primary climate metric in EU bank supervisory reporting and investor ESG assessments. Banks with low GARs face reputational risk and regulatory scrutiny. This module provides the systematic calculation infrastructure banks need for accurate and auditable GAR disclosure.

**How an analyst works this module:**
- Numerator Builder maps loans/bonds to taxonomy-aligned activities
- Denominator Calculator applies EBA exemption categories
- GAR Trend shows quarterly evolution as data improves
- Counterparty Data tracks CSRD reporting status of borrowers
- Comparison Benchmarks GAR against EBA aggregate bank data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWER_NAMES`, `BTAR_ASSET_CLASSES`, `COMPLIANCE_CHECKLIST`, `COUNTRIES_EU`, `DNSH_CRITERIA`, `EBA_TEMPLATES`, `ENV_OBJECTIVES`, `GAR_HISTORY`, `LOAN_POSITIONS`, `MIN_SAFEGUARDS_FRAMEWORK`, `NACE_ACTIVITIES`, `PEER_BANKS`, `SECTOR_EMISSIONS_T1`, `StatusBadge`, `TABS`, `TOP20_CARBON`, `TabBTAR`, `TabDNSH`, `TabDNSHDeepDive`, `TabDownstreamExport`, `TabEBAPillar3`, `TabGARCalculator`, `TabGARSensitivity`, `TabMinSafeguards`, `TabTaxonomyEligibility`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NACE_ACTIVITIES` | 31 | `code`, `desc`, `tsc`, `eligible`, `sector` |
| `ENV_OBJECTIVES` | 7 | `code`, `label`, `color` |
| `GAR_HISTORY` | 6 | `year`, `turnoverGAR`, `capexGAR`, `opexGAR`, `eligiblePct`, `alignedPct`, `coveredAssetsEurBn` |
| `BTAR_ASSET_CLASSES` | 11 | `assetClass`, `exposure`, `eligible`, `aligned`, `coveredByCRR` |
| `PEER_BANKS` | 9 | `name`, `gar`, `btar`, `eligible`, `totalAssets` |
| `DNSH_CRITERIA` | 7 | `objective`, `label`, `criteria`, `assessmentItems` |
| `MIN_SAFEGUARDS_FRAMEWORK` | 5 | `framework`, `articles`, `checks` |
| `EBA_TEMPLATES` | 6 | `id`, `name`, `desc`, `citation` |
| `SECTOR_EMISSIONS_T1` | 14 | `nace`, `sector`, `exposure`, `finEmissions`, `intensity`, `pcafScore` |
| `COMPLIANCE_CHECKLIST` | 16 | `id`, `item`, `status`, `regulatory`, `deadline` |
| `TABS` | 10 | `key`, `label` |

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
| `turnoverAlignPct` | `aligned ? rng(15, 98, i * 47 + 13) : 0;` |
| `capexAlignPct` | `aligned ? rng(20, 99, i * 53 + 17) : 0;` |
| `opexAlignPct` | `aligned ? rng(10, 95, i * 59 + 19) : 0;` |
| `maturityYears` | `rngInt(1, 15, i * 61 + 23);` |
| `interestRate` | `rng(1.5, 6.5, i * 67 + 29);` |
| `lgd` | `rng(25, 65, i * 71 + 31);` |
| `epcRating` | `pick(['A','A+','B','C','D','E','F','G','N/A'], i * 79 + 41);` |
| `scope1` | `rng(500, 250000, i * 83 + 43);` |
| `scope2` | `rng(100, 80000, i * 89 + 47);` |
| `uniqueAssetClasses` | `useMemo(() => ['All', ...new Set(positions.map(p => p.assetClass))], [positions]);` |
| `uniqueCountries` | `useMemo(() => ['All', ...new Set(positions.map(p => p.country)).values()].sort(), [positions]);` |
| `stats` | `useMemo(() => { const totalExposure = filtered.reduce((s, p) => s + p.exposureEurM, 0);` |
| `eligibleExposure` | `filtered.filter(p => p.eligible).reduce((s, p) => s + p.exposureEurM, 0);` |
| `alignedExposure` | `filtered.filter(p => p.aligned).reduce((s, p) => s + p.exposureEurM, 0);` |
| `weightedAligned` | `filtered.filter(p => p.aligned).reduce((s, p) => s + p.exposureEurM * p[garTypeKey] / 100, 0);` |
| `gar` | `totalExposure > 0 ? (weightedAligned / totalExposure) * 100 : 0;` |
| `eligiblePct` | `totalExposure > 0 ? (eligibleExposure / totalExposure) * 100 : 0;` |
| `dnshPassRate` | `filtered.filter(p => p.eligible).length > 0 ? (filtered.filter(p => p.dnshPass).length / filtered.filter(p => p.eligible).length) * 100 : 0;` |
| `msPassRate` | `filtered.filter(p => p.eligible).length > 0 ? (filtered.filter(p => p.minSafeguardsPass).length / filtered.filter(p => p.eligible).length) * 100 : 0;` |
| `objBreakdown` | `useMemo(() => ENV_OBJECTIVES.map(obj => {` |
| `exp` | `filtered.filter(p => p[key]).reduce((s, p) => s + p.exposureEurM, 0);` |
| `paged` | `filtered.slice(page * pageSize, (page + 1) * pageSize);` |

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

Numerator: aligned loans, bonds, equity to NFCs subject to CSRD + government-guaranteed loans. Denominator: total assets minus trading book, interbank, central bank, and sovereign exposure. Transitional: 2024 first KPI disclosure, 2026 full alignment.

**Standards:** ['EBA Pillar 3 ESG Disclosures', 'EU Taxonomy Regulation', 'CRR Article 449a']
**Reference documents:** EBA Implementing Technical Standard on Pillar 3 ESG; EU Taxonomy Regulation (EU) 2020/852; CRR Article 449a; ECB Supervisory Assessment of TCFD Alignment

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

80 synthetic loan positions are built deterministically (`buildLoanPositions()`) against 30 real
NACE activity codes tagged with EU Taxonomy Climate Delegated Act technical screening criteria
(TSC) references (e.g. `D35.11 → CCM 4.1`). The module then walks the **actual EU Taxonomy GAR
decision tree** per position — this is one of the more faithfully-implemented modules in the
platform relative to its guide:

```
eligible          = act.eligible                                  (from NACE/TSC lookup)
dnshPass          = eligible && sr(i*17+5) > 0.2                   (80% pass rate if eligible)
minSafeguardsPass = eligible && sr(i*19+9) > 0.15                  (85% pass rate if eligible)
aligned(obj)      = eligible && dnshPass && minSafeguardsPass && objective-specific TSC match
aligned           = alignedCCM || alignedCCA || alignedWTR || alignedCE || alignedPPC || alignedBIO
GAR = Σ(exposure_i × alignment%_i) over aligned positions / Σ(exposure_i) over all covered positions
```

This is the real regulatory structure: eligibility gates DNSH, DNSH gates Minimum Safeguards, and
only positions clearing *all three* plus an objective-specific substantial-contribution test count
as "aligned" — matching CRR Art. 449a / EBA ITS 2022/01's cascading GAR numerator logic.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| DNSH pass threshold | `sr(·) > 0.2` → 80% pass rate | Synthetic, no cited real-world DNSH failure rate |
| Minimum Safeguards pass threshold | `sr(·) > 0.15` → 85% pass rate | Synthetic |
| Per-objective alignment thresholds | CCM 75%, CCA 15%, WTR 8%, CE 7%, PPC 5%, BIO 4% pass rates (`sr(·) > 0.25/0.85/0.92/0.93/0.95/0.96`) | Encodes real-world pattern that CCM dominates taxonomy-aligned activity today (EBA data shows CCM >90% of aligned exposure) — the *relative ordering* of pass rates across objectives is defensible even though the absolute thresholds are arbitrary |
| 30 NACE activities | Real codes + TSC references (`CCM 3.7` = cement, `CCM 4.1` = electricity generation) | Genuine EU Taxonomy Climate Delegated Act (EU) 2021/2139 Annex references |
| `turnoverAlignPct`/`capexAlignPct`/`opexAlignPct` | 15–98% / 20–99% / 10–95%, only if `aligned` | Synthetic, zero if not aligned (correct gating) |

### 7.3 Calculation walkthrough

1. **GAR numerator** (`weightedAligned`): `Σ exposureEurM × alignment%(garTypeKey)/100` over
   positions where `aligned=true` — `garTypeKey` toggles between turnover/capex/opex-based GAR (the
   three official EU Taxonomy KPI bases), a genuine feature matching the regulation's requirement to
   disclose all three.
2. **GAR denominator** (`totalExposure`): `Σ exposureEurM` over the *filtered* position set — the
   guide's denominator (total covered assets minus exemptions) is simplified here to "all positions
   in the loan book," i.e. the exemption-category removal (trading book, interbank, sovereign) named
   in the guide is not separately modelled — all 80 positions are treated as covered assets.
3. **GAR** = `totalExposure > 0 ? weightedAligned/totalExposure × 100 : 0` — correctly guarded.
4. **Eligibility %**: `eligibleExposure/totalExposure × 100` — share of exposure to
   taxonomy-eligible NACE activities, independent of alignment.
5. **DNSH/Minimum-Safeguards pass rates**: computed *only over eligible positions*
   (`filtered.filter(p=>p.eligible)`), correctly reflecting that DNSH/safeguards screening only
   applies once an activity clears eligibility.
6. **Objective breakdown** (`objBreakdown`): per environmental objective, sums exposure where the
   corresponding `aligned<OBJ>` flag is true — lets a user see which of the 6 objectives (CCM, CCA,
   WTR, CE, PPC, BIO) is driving the aggregate GAR.

### 7.4 Worked example

Position `i=0`: `actIdx = rngInt(0,29, 0*13+7) = rngInt(0,29,7)`. Illustratively resolves to
`D35.11` (electricity generation, `eligible=true`, `tsc='CCM 4.1'`).
`exposure = rng(5,850, 0*7+3) = rng(5,850,3)`. Illustratively `sr(3)=0.30` → `exposure ≈
5+0.30×845 = 258.5` EURm.
`dnshPass = sr(0*17+5)=sr(5) > 0.2`. Illustratively `sr(5)=0.55 > 0.2` → **pass**.
`minSafeguardsPass = sr(9) > 0.15`. Illustratively `sr(9)=0.62 > 0.15` → **pass**.
`alignedCCM = eligible && dnshPass && minSafeguardsPass && tsc.startsWith('CCM') && sr(23+1)>0.25`.
Illustratively `sr(24)=0.71 > 0.25` → **CCM-aligned**.
`turnoverAlignPct = rng(15,98, 0*47+13) = rng(15,98,13)`. Illustratively `sr(13)=0.65` →
`15+0.65×83 ≈ 68.9%`.
GAR contribution of this single position (turnover basis) = `258.5 × 68.9/100 ≈ 178.1` EURm
numerator, `258.5` EURm denominator — i.e. this loan alone would push portfolio GAR up if most other
positions are ineligible or unaligned.

### 7.5 Companion analytics

- **BTAR** (Banking Book Taxonomy Alignment Ratio, EBA Template 8): `BTAR_ASSET_CLASSES` static
  table splits exposure by asset class with `coveredByCRR` flags — a genuine regulatory distinction
  (BTAR extends GAR's scope to non-CRR-covered assets like SME loans).
- **Peer Banks comparison**: static `PEER_BANKS` table (9 named institutions) with `gar`, `btar`,
  `eligible`, `totalAssets` — benchmarking context, not derived from the loan book.
- **GAR History** (2019–2024 trend): static year-by-year series, not calculated from the current
  loan book (illustrates the 2024 first-KPI-disclosure → 2026 full-alignment transitional path
  named in the guide).
- **Sector Financed Emissions** (`SECTOR_EMISSIONS_T1`): static PCAF-style table with `intensity`
  and `pcafScore` columns per NACE sector — descriptive, feeds no calculation shown in `computed`.

### 7.6 Data provenance & limitations

- All 80 positions are synthetic, generated via `sr(seed)=frac(sin(seed+1)×10⁴)` — borrower names
  are real listed companies reused as labels only.
- The **cascading eligibility → DNSH → safeguards → alignment logic is a genuine, correctly
  structured implementation** of the EU Taxonomy GAR methodology — unusual among the "B-tier"
  modules audited in this batch, most of which display random numbers with no real model behind
  them.
- GAR denominator does not model exemption-category removal (interbank, sovereign, trading book)
  described in the guide; all covered positions are treated as denominator-eligible.
- PD/LGD/interest-rate fields exist per position but are not used anywhere in the GAR calculation —
  they appear to be vestigial fields from a shared loan-position generator used elsewhere on the
  platform (e.g. `climate-credit-integration`), not part of this module's actual output.

**Framework alignment:** EU Taxonomy Regulation (EU) 2020/852 Art. 3/17/18 (eligibility, DNSH,
substantial contribution — correctly sequenced) · Climate Delegated Act (EU) 2021/2139 (NACE/TSC
references genuine) · CRR Art. 449a / EBA ITS 2022/01 (GAR/BTAR KPI structure correctly named,
turnover/capex/opex triple-basis correctly modelled) — the denominator's exemption-category
treatment is the main simplification versus the full EBA Pillar 3 template methodology.

## 9 · Future Evolution

### 9.1 Evolution A — Real loan-book GAR over an issuer taxonomy-disclosure feed (analytics ladder: rung 1 → 2)

**What.** §7 gives this module unusual credit: the cascading eligibility → DNSH → minimum-safeguards → alignment logic is a genuine, correctly-structured implementation of the EU Taxonomy GAR methodology over 30 real NACE activity codes tagged with Climate Delegated Act technical screening criteria — a real model, unlike most B-tier peers. Its limitation is data: the 80 loan positions are `sr()`-seeded (borrower names are real listed companies used as labels only). Evolution A feeds the correct engine real data: replace the synthetic loan book with actual credit exposures joined to issuer-level taxonomy-alignment disclosures (CSRD Article 8 reporting), so the numerator (aligned exposures) and denominator (total covered assets minus trading/interbank/sovereign) are computed from a real book, and the 2024/2026 phase-in exemptions apply correctly.

**How.** (1) Wire the loan positions to the platform's credit exposure store (the shared FI loan tape) with per-borrower NACE codes. (2) Pull issuer taxonomy-alignment percentages from CSRD disclosures where available, with the DNSH/safeguards cascade applied per the existing correct logic. (3) The covered-asset denominator computed from the balance sheet per the EBA GAR definition, with phase-in flags.

**Prerequisites.** Real credit exposures with NACE tagging (shared FI spine, D0 demo acceptable); issuer taxonomy-disclosure data. **Acceptance:** the GAR recomputes from a real loan book reproducing the numerator/denominator definitions; the DNSH/safeguards cascade runs on sourced alignment data; no `sr()` position feeds the ratio.

### 9.2 Evolution B — GAR disclosure copilot (LLM tier 2)

**What.** A copilot for bank sustainability teams: "what's our GAR, which exposures are dragging it, and what would aligning our top-10 non-aligned borrowers do?" tool-calls the Evolution A GAR endpoint, decomposes the ratio by activity/borrower, and drafts the EBA Pillar 3 GAR disclosure with the phase-in caveats.

**How.** Tier-2 tool-calling over the GAR/decomposition endpoints; the grounding corpus is §5/§7, which correctly encode the EU Taxonomy GAR methodology, the covered-asset definition, and the transitional timeline. The copilot's value is disclosure-drafting plus the improvement-lever analysis (which borrowers' alignment would move the ratio most). Every percentage validated against tool output; because this is regulator-facing, the fabrication guard is strict.

**Prerequisites.** Evolution A (the copilot must narrate a real loan book, not seeded positions); RBAC-scoped exposures. **Acceptance:** every GAR figure in a disclosure draft traces to a tool call; the improvement-lever answer reproduces the recomputed GAR when the named borrowers are aligned; the phase-in exemption is stated correctly.