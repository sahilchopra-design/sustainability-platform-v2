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
