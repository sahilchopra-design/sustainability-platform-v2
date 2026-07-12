# FI EU Taxonomy–PCAF Bridge Analytics
**Module ID:** `fi-taxonomy-pcaf-bridge` · **Route:** `/fi-taxonomy-pcaf-bridge` · **Tier:** B (frontend-computed) · **EP code:** EP-DW2 · **Sprint:** DW

## 1 · Overview
Analytics bridging EU Taxonomy alignment and PCAF financed emissions covering GAR/BTAR calculation, green asset ratio uplift pathways, financed emissions by taxonomy objective and EBA Pillar 3 ESG disclosure integration.

> **Business value:** The EU Taxonomy–PCAF bridge quantifies GAR and BTAR under EBA Pillar 3 ITS while linking taxonomy-aligned assets to PCAF financed emissions by objective, enabling institutions to demonstrate both regulatory compliance and real-economy decarbonisation impact.

**How an analyst works this module:**
- Map portfolio exposures to EU Taxonomy eligibility by NACE code and activity
- Apply substantial contribution criteria and DNSH screening to calculate aligned assets
- Compute GAR and BTAR under EBA Pillar 3 ITS templates
- Overlay PCAF DQ scores on taxonomy-aligned assets to quantify financed emissions quality

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `CLIMATE_PD_UPLIFT`, `CRE_ASSETS`, `CSRD_DATAPOINTS`, `DQS_DETAILS`, `DqsPill`, `IFRS_STAGE_RULES`, `INSURANCE_LOB`, `KPI_TEMPLATES`, `Kpi`, `LOAN_BOOK`, `MORTGAGE_POOL`, `NACE_MAP`, `NGFS_SCENARIOS_PD`, `PIE_COLORS`, `RISK_APPETITE_THRESHOLDS`, `SCR_IMPACT`, `SECTORS`, `SECTOR_PD_MULT`, `SOLVENCY_II_FACTORS`, `StatusPill`, `TAX_STATUS`, `WATERFALL_STAGES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_CLASSES` | 8 | `name`, `code`, `weight`, `pcafCoverage`, `taxonomyCoverage`, `dqs`, `fe` |
| `INSURANCE_LOB` | 7 | `name`, `grossPremium`, `technProv`, `greenShare`, `scrBase`, `naturalCat` |
| `KPI_TEMPLATES` | 8 | `name`, `scope`, `metric`, `value`, `benchmark` |
| `NACE_MAP` | 31 | `desc`, `tsc`, `eligible`, `ccmDNSH` |
| `DQS_DETAILS` | 6 | `label`, `desc`, `color`, `share` |
| `SCR_IMPACT` | 7 | `scrModule`, `pre`, `post`, `relief`, `factorApplied` |
| `CSRD_DATAPOINTS` | 13 | `name`, `status`, `source`, `evidence`, `gap` |
| `WATERFALL_STAGES` | 12 | `value`, `cumulative`, `color`, `type` |
| `NGFS_SCENARIOS_PD` | 6 | `name`, `pdMult`, `lgdShift`, `feShift`, `gdp2030`, `gdp2050`, `color` |
| `IFRS_STAGE_RULES` | 4 | `label`, `desc`, `pdFloor`, `pdCeil`, `color` |
| `RISK_APPETITE_THRESHOLDS` | 11 | `metric`, `unit`, `current`, `warn`, `breach`, `direction`, `pillar` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n,d=1) => n==null?'--':Number(n).toFixed(d);` |
| `fmtPct` | `(n)=>n==null?'--':Number(n).toFixed(1)+'%';` |
| `fmtMn` | `(n)=>n==null?'--':'$'+Number(n).toFixed(0)+'M';` |
| `fmtBn` | `(n)=>n==null?'--':'$'+Number(n).toFixed(1)+'Bn';` |
| `TAX_STATUS` | `['Aligned','Eligible','Non-Eligible','Excluded'];` |
| `ead` | `50 + sr(i*3+1)*950;` |
| `dqs` | `1 + Math.floor(sr(i*19+6)*5);` |
| `lgd` | `0.25 + sr(i*29+8)*0.45;` |
| `intensity` | `40 + sr(i*31+9)*180;` |
| `epc` | `['A','B','C','D','E','F','G'][Math.floor(sr(i*3+1)*7)];` |
| `bal` | `10 + sr(i*5+2)*90;` |
| `ltv` | `45 + sr(i*7+3)*45;` |
| `gav` | `20 + sr(i*5+2)*180;` |
| `loan` | `gav * (0.5 + sr(i*7+3)*0.3);` |
| `e50` | `Math.exp(-50);` |
| `mAdj` | `(1 + (M - 2.5) * b) / (1 - 1.5 * b);` |
| `cond` | `nCdf((ndInv(PD) + Math.sqrt(R) * ndInv(0.999)) / Math.sqrt(Math.max(1e-9, 1 - R)));` |
| `stats` | `useMemo(() => { const tot = filteredLoans.reduce((a,l)=>a+l.ead, 0);` |
| `aligned` | `filteredLoans.reduce((a,l)=>a+l.ead*l.alignedPct/100, 0);` |
| `eligible` | `filteredLoans.reduce((a,l)=>a+l.ead*l.eligiblePct/100, 0);` |
| `ewb` | `filteredLoans.reduce((a,l)=>a+l.ewb, 0);` |
| `dqsW` | `tot>0 ? filteredLoans.reduce((a,l)=>a+l.ead*l.dqs, 0)/tot : 0;` |
| `alignCov` | `stats.count>0 ? (filteredLoans.filter(l=>l.alignedPct>0).length / stats.count * 100) : 0;` |
| `csrdReadyPct` | `(CSRD_DATAPOINTS.filter(d=>d.status==='Ready').length / Math.max(1,CSRD_DATAPOINTS.length)) * 100;` |
| `sectorStats` | `useMemo(() => { return SECTORS.map(s => { const ls = LOAN_BOOK.filter(l=>l.sector===s);` |
| `tot` | `ls.reduce((a,l)=>a+l.ead,0);` |
| `totBal` | `pool.reduce((a,m)=>a+m.balance,0);` |
| `avgKwh` | `pool.length>0 ? pool.reduce((a,m)=>a+m.kwhM2,0)/pool.length : 0;` |
| `avgLtv` | `pool.length>0 ? pool.reduce((a,m)=>a+m.ltv,0)/pool.length : 0;` |
| `rwaAdj` | `rwaBase - sc.relief * 12.5;` |
| `stressed` | `LOAN_BOOK.map(l => {` |
| `basePd` | `l.pd / 100;` |
| `stressedPd` | `Math.min(0.99, basePd * secMult);` |
| `stressedLgd` | `Math.min(0.99, (l.lgd/100) + scen.lgdShift);` |
| `baseEL` | `l.ead * basePd * (l.lgd/100);` |
| `stressedEL` | `l.ead * stressedPd * stressedLgd;` |
| `deltaEL` | `stressedEL - baseEL;` |
| `totalBase` | `stressed.reduce((a,s)=>a+s.baseEL,0);` |
| `totalStressed` | `stressed.reduce((a,s)=>a+s.stressedEL,0);` |
| `totalDelta` | `totalStressed - totalBase;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `CSRD_DATAPOINTS`, `DQS_DETAILS`, `IFRS_STAGE_RULES`, `INSURANCE_LOB`, `KPI_TEMPLATES`, `NACE_MAP`, `NGFS_SCENARIOS_PD`, `PIE_COLORS`, `RISK_APPETITE_THRESHOLDS`, `SCR_IMPACT`, `SECTORS`, `TAX_STATUS`, `WATERFALL_STAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Asset Ratio (GAR) | `GAR = TA Exposures / Eligible Exposures × 100` | EBA Pillar 3 ITS 2022 | Mandatory disclosure metric for EU credit institutions from 2024; basis for green lending targets. |
| BTAR | `BTAR = TA Assets (incl. sovereign) / Total Assets` | EBA Opinion on Taxonomy Reporting 2023 | Broader coverage than GAR; includes sovereign bonds and SME exposures using estimation. |
| Financed Emissions by Taxonomy Objective | `FE = Attribution Factor × Company Scope 1+2+3 Emissions` | PCAF Standard × Taxonomy Mapping | Linking taxonomy objective to emissions reduction impact per € of aligned financing. |
- **EU Taxonomy activity database + EBA Pillar 3 templates** → GAR/BTAR computation → PCAF DQ overlay → **FI Taxonomy-PCAF bridge analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Asset Ratio
**Headline formula:** `GAR = Taxonomy-Aligned Exposures / Total Eligible Exposures × 100`

Proportion of credit institution's eligible exposures meeting EU Taxonomy substantial contribution criteria.

**Standards:** ['EBA — ITS on Pillar 3 ESG Disclosures', 'ECB — Guide on Climate-related and Environmental Risks']
**Reference documents:** EBA — Final Draft ITS on Pillar 3 ESG Disclosures (2022); ECB — Guide on Climate-related and Environmental Risks (2020); PCAF — The Global GHG Accounting and Reporting Standard (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The FI Taxonomy × PCAF Bridge (EP-Q9/EP-DW2) is one of the platform's most complete quantitative
banking pages: 20 tabs spanning EU Taxonomy GAR/BTAR, PCAF financed emissions, an NGFS PD-stress lab,
a **real Basel IRB capital engine**, IFRS 9 ECL staging, and Solvency II SCR. The guide's headline
(`GAR = Taxonomy-Aligned / Eligible × 100`) is faithfully implemented; the module then extends well
beyond it. There is **no guide↔code mismatch** — instead the caveat is that the loan/mortgage/CRE
books are all **synthetic `sr()`-seeded demo data**, while the formulae applied to them are genuine
regulatory maths.

### 7.1 What the module computes

**Green Asset Ratio (banking book).** Over a 30-loan book, EAD-weighted alignment:

```js
alignedPct = Σ(ead_i × alignedPct_i/100) / Σ ead_i × 100      // = bankingGAR
eligiblePct = Σ(ead_i × eligiblePct_i/100) / Σ ead_i × 100
dqsW (PCAF DQ) = Σ(ead_i × dqs_i) / Σ ead_i                    // exposure-weighted
```

**Financed emissions (PCAF).** Per loan `fe = ead × intensity / 1000` (ktCO₂e), summed. Mortgage
emissions use a physical proxy `kwhM2 × 0.24 × balance × 80 / 1000` (grid EF 0.24 tCO₂/MWh × €80/m²
value proxy). Attribution is loan-level (LTV-style) per PCAF Cat-15.

**Basel IRB capital (real).** The module implements the full BCBS IRB corporate risk-weight formula:

```js
baselR(PD) = 0.12·a + 0.24·(1−a),  a = (1−e^(−50·PD))/(1−e^(−50))     // asset correlation
b(PD)      = (0.11852 − 0.05478·ln PD)²                                // maturity slope
mAdj       = (1 + (M−2.5)·b) / (1 − 1.5·b)                             // maturity adjustment
K          = LGD·[Φ((Φ⁻¹(PD)+√R·Φ⁻¹(0.999))/√(1−R)) − PD]·mAdj         // capital requirement
RWA        = K × 12.5 × EAD
```

`Φ⁻¹` uses the Beasley–Springer rational approximation; `Φ` a rational-polynomial CDF — both standard
numerical library forms. This is the *actual* Basel II/III IRB conditional-loss formula, correctly
transcribed.

**IFRS 9 × NGFS ECL.** `stressedPD = min(0.99, PD × sectorMult); stressedLGD = min(0.99, LGD + lgdShift)`;
`baseEL = EAD·PD·LGD`, `stressedEL = EAD·stressedPD·stressedLGD`, decomposed into a ΔPD (transition)
and ΔLGD (collateral) waterfall.

### 7.2 Parameterisation / scoring rubric

**NGFS scenario PD multipliers** (`NGFS_SCENARIOS_PD`, illustrative but NGFS-consistent ordering):

| Scenario | pdMult | lgdShift | feShift | GDP 2030 | GDP 2050 |
|---|---|---|---|---|---|
| Orderly / Net Zero 2050 | 1.08 | +0.02 | −22% | −0.4% | +0.2% |
| Delayed Transition | 1.34 | +0.06 | −14% | −1.2% | −2.4% |
| Hot House World | 1.52 | +0.11 | +18% | −2.1% | −6.8% |
| Current Policies | 1.41 | +0.09 | +8% | −1.6% | −4.3% |

**Sector PD multipliers** (`SECTOR_PD_MULT`) override the scenario default per sector — e.g. Energy
Delayed = 1.78, Agriculture Hot House = 1.92 (chronic physical), Financials always lowest. This
sectoral heterogeneity mirrors NGFS/ECB transition-vulnerability heatmaps.

**PCAF DQ scale** (`DQS_DETAILS`, 1–5) is the genuine PCAF data-quality hierarchy: 1 verified reported
→ 5 asset-class proxy; portfolio share (8/24/38/22/8%) is illustrative.

**IFRS 9 staging** (`IFRS_STAGE_RULES`): Stage 1 PD 0–2%, Stage 2 2–6% (SICR), Stage 3 >6% (impaired).

**Solvency II GSF factors** (`SOLVENCY_II_FACTORS`) use real SCR sub-module shocks (equity 0.39,
property 0.25, non-life premium/reserve/cat-nat per LoB) — these are the standard-formula stresses.

### 7.3 Calculation walkthrough

Overview KPIs: filter loan book by sector + DQS floor → `stats` (GAR, eligible%, FE, weighted DQS,
EL). NGFS tab: pick scenario → apply sector multiplier to each loan's PD → base vs stressed EL +
sector aggregation + PD/LGD waterfall. IRB tab: for each loan compute `K` via `irbK`, RWA = K·12.5·EAD,
then re-stress PD by the Delayed multiplier for a stressed RWA. SCR tab: `rwaBase=58,200`,
`rwaAdj = rwaBase − relief×12.5`, `CET1_post = 13.6%×rwaBase/rwaAdj`. ICAAP tab: `stressedCET1 =
cet1 − (ΔRWA)×0.08 − totalEL×0.5`.

### 7.4 Worked example (one loan through IRB + NGFS)

Take loan with `PD = 2.0% (0.02)`, `LGD = 45% (0.45)`, `EAD = $500M`, `maturity M = 3`, sector Energy,
Delayed Transition:

| Step | Computation | Result |
|---|---|---|
| Correlation R | 0.12·a + 0.24·(1−a), a≈(1−e^(−1))/(1−e^(−50))≈0.632 | ≈0.164 |
| b(PD) | (0.11852 − 0.05478·ln 0.02)² = (0.11852+0.2143)² | ≈0.1107 |
| mAdj | (1+(3−2.5)·0.1107)/(1−1.5·0.1107) | ≈1.267 |
| Conditional PD | Φ((Φ⁻¹(0.02)+√0.164·Φ⁻¹(0.999))/√0.836) | ≈0.169 |
| K | 0.45·(0.169−0.02)·1.267 | ≈0.0850 |
| RWA | 0.0850·12.5·500 | **≈$531M** (density ≈106%) |
| Stressed PD (Energy·DEL 1.78) | min(0.99, 0.02·1.78) | 3.56% |
| Base EL | 500·0.02·0.45 | **$4.50M** |
| Stressed EL | 500·0.0356·min(0.99,0.45+0.06) | **$9.08M** (Δ +$4.58M) |

The stressed PD crosses the Stage-2 boundary (>2%), so the loan migrates 1→2 under IFRS 9 purely from
the Energy transition multiplier.

### 7.5 GAR alignment waterfall & companion analytics

The `WATERFALL_STAGES` reproduces the EBA GAR numerator derivation: Total book → deduct sovereigns,
central banks, derivatives/HFT → in-scope denominator (84) → deduct non-NFRD corporates → eligible
pool (62) → deduct DNSH failures (−14) and Minimum-Safeguards failures (−4) → aligned pool (44) →
GAR stock 18.4%. The `NACE_MAP` (31 rows) carries real Taxonomy Technical Screening Criteria
references (e.g. C.24 → "3.9 Iron & Steel", B.05 coal → Excluded/Fail). The `SCR_IMPACT` and
`SOLVENCY_II_FACTORS` model a Green Supporting Factor sensitivity (0.75/0.80 relief vs 1.50 penalty).

### 7.6 Data provenance & limitations

- **`LOAN_BOOK`, `MORTGAGE_POOL`, `CRE_ASSETS` are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`.
  PDs, LGDs, EADs, EPC ratings, alignment percentages are all seeded demo values — not real obligors.
- The Basel IRB, IFRS 9 staging and Solvency II SCR **formulae are genuine** and correctly implemented;
  only their *inputs* are synthetic. NGFS/sector PD multipliers and Solvency factors are illustrative
  constants, not calibrated from a specific NGFS vintage.
- No lifetime-ECL term structure (single-period), no discounting; GAR uses stored per-loan alignment
  rather than counterparty-level Taxonomy disclosure ingestion.

**Framework alignment:** EU Taxonomy Art. 8 Delegated Act (GAR/BTAR, DNSH, Minimum Safeguards) ·
EBA Pillar 3 ESG ITS · PCAF Global GHG Standard v2.2 (attribution + DQ 1–5, computed exposure-weighted) ·
Basel II/III IRB (asymptotic single-risk-factor K-function, exactly transcribed) · IFRS 9 §5.5 ECL
staging (12-month vs lifetime, SICR at PD>2%) · NGFS Phase IV scenario logic (disorderly worst for
credit) · Solvency II standard-formula SCR sub-modules + Green Supporting Factor concept · CSRD ESRS
E1 datapoint crosswalk (E1-6 GHG fed from PCAF).

## 9 · Future Evolution

### 9.1 Evolution A — Backend vertical for the platform's richest banking calculator (analytics ladder: rung 2 → 3)

**What.** §7 calls this 20-tab page "one of the platform's most complete quantitative banking pages" — GAR/BTAR, PCAF DQ-weighted financed emissions, a correctly transcribed Basel ASRF IRB K-function, IFRS 9 staging, Solvency II SCR, and an NGFS PD-stress lab — with one structural caveat: it is all tier-B frontend computation over `sr()`-seeded `LOAN_BOOK`/`MORTGAGE_POOL`/`CRE_ASSETS`. Evolution A promotes the genuine math to a backend vertical: persist the three books, port the IRB/ECL/SCR/GAR calculators into an engine, and calibrate the illustrative constants §7.6 flags (NGFS/sector PD multipliers, Solvency factors) to a named NGFS Phase IV/V vintage with citations.

**How.** (1) New tables `fi_bridge_loans`, `fi_bridge_mortgages`, `fi_bridge_cre` seeded from the D0 demo book so results are reproducible across sessions and shareable across the FI desk modules. (2) Engine `fi_taxonomy_pcaf_engine.py` exposing `/gar`, `/stress`, `/irb-capital`, `/ecl-staging` — the JS formulas transcribed and bench-pinned (the exactly-transcribed K-function is an ideal `bench_quant` candidate). (3) Add lifetime-ECL term structure and discounting, the two method gaps §7.6 names.

**Prerequisites.** Alembic migration slot; NGFS vintage reference data in refdata; agreement that per-loan `alignedPct` stays a stored field until counterparty taxonomy-disclosure ingestion exists (§7.6 documents this shortcut honestly). **Acceptance:** bench-pinned IRB reference case (given PD/LGD/EAD/M → K matches hand calculation); GAR from the API equals the page's EAD-weighted formula on the same book.

### 9.2 Evolution B — Pillar 3 disclosure-drafting analyst (LLM tier 2)

**What.** The module already models the EBA Pillar 3 ESG ITS templates (`KPI_TEMPLATES`) and a 13-point CSRD/ESRS E1 datapoint crosswalk with ready/gap status. Evolution B turns that into a disclosure-drafting analyst: "draft our GAR disclosure narrative with the DNSH caveats" tool-calls `/gar` and the stress endpoints, pulls the CSRD datapoint statuses, and produces template-shaped disclosure text where every figure is engine-sourced and every gap (`CSRD_DATAPOINTS` entries with status ≠ Ready) is explicitly listed as an open item rather than papered over.

**How.** Tier-2 tool-calling per the roadmap: schemas from the Evolution A OpenAPI operations; grounding corpus is this page's §7 (which already encodes the Art. 8 Delegated Act, EBA ITS, PCAF v2.2 attribution rules). Output renders via the report-studio layer. The fabrication validator is essential here because disclosure text is regulator-facing — numbers are checked against tool outputs before the draft is shown.

**Prerequisites.** Evolution A (a disclosure narrative must not be drafted over seeded books); RBAC-scoped access to the org's book. **Acceptance:** a generated Pillar 3 draft contains only tool-traceable figures, cites the ITS template row for each KPI, and reproduces the CSRD gap list verbatim from the datapoint table.