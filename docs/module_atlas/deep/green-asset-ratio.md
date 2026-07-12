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
