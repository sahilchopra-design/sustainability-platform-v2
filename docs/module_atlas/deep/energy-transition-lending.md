## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide promises three quantitative engines — **Green Asset Ratio**
> (`GreenLoans/TotalLoans`), **PCAF energy financed emissions** (`Σ(Loan/EV × Scope1 + Loan/PropVal ×
> EnergyUse × EF)`), and a **portfolio temperature score** (`Σ Loan_weight × TemperatureScore`).
> **None is implemented.** The page generates 55 lenders whose every attribute — commitment, spread,
> DSCR, LLCR, green-loan %, refinancing risk — is an **independent `sr()` random draw**; there is no
> loan tape, no EVIC, no investee emissions, no ITR. The KPIs are portfolio averages of those draws.
> Documented below as written; §8 specifies the PCAF/GAR lending model.

### 7.1 What the module computes

55 synthetic lenders (`sr(s)=frac(sin(s+1)×10⁴)`), each drawn independently:

```js
commitmentBn   = 0.2 + sr(i·17+4)·19.8     // $0.2–20B
avgTenor       = 8   + sr(i·19+5)·17        // 8–25 yr
spread         = 80  + sr(i·23+6)·280       // 80–360 bps
greenLoanPct   = 20  + sr(i·31+8)·75        // 20–95%
refinancingRisk= 5   + sr(i·37+9)·60        // 5–65
avgDscr        = 1.1 + sr(i·41+1)·1.4       // 1.10–2.50×
llcr           = 1.15+ sr(i·43+2)·0.85      // 1.15–2.00×
firstLoss      = 3   + sr(i·47+3)·12        // 3–15%
subordinated   = sr(i·53+4)·20              // 0–20%
watchlist      = sr(i·59+5) > 0.8           // ~20% flagged
```

Portfolio KPIs are simple guarded averages (`n = max(1, filtered.length)`):
```js
totalCommitment = Σ commitmentBn
avgSpread = Σ spread / n ;  avgTenor = Σ tenor / n ;  avgGreenPct = Σ greenLoanPct / n
watchlistCount = count(watchlist) ;  highRefRisk = count(refinancingRisk > 40)
```

### 7.2 Parameterisation / scoring rubric

| Field | Range | Provenance |
|---|---|---|
| `LENDER_TYPES` | Commercial Bank, DFI, ECA, Green Bank, Infra Fund, Multilateral | Lender taxonomy |
| `ASSET_CLASSES` | Solar/Wind/Battery/H₂/Transmission/Offshore-wind PF | Project-finance categories |
| `RATINGS` | AAA…BBB | Ratings ladder (drawn, not modelled) |
| `avgDscr` 1.10–2.50× | synthetic | Debt-service coverage — realistic band, random |
| `llcr` 1.15–2.00× | synthetic | Loan-life coverage ratio — random |
| `spread` 80–360 bps | synthetic | Credit spread — not risk-derived |
| `greenLoanPct` 20–95% | synthetic | Proxy for GAR — **not a taxonomy screen** |
| Refinancing-risk flag | `>40` | High-risk threshold |

DSCR and LLCR are genuine project-finance credit ratios by *name*, but here they are random draws, not
computed from cash-flow projections.

### 7.3 Calculation walkthrough

Generate 55 lenders → filter by type/asset-class/region → aggregate averages → the eight tabs render:
overview KPIs, lender table (sortable), green-loan structuring (first-loss/subordinated tranches),
tenor matching, refinancing-risk screen, asset-class rollups, regulatory-capital view, and market
intelligence. Every displayed metric is either a raw draw or a mean of draws.

### 7.4 Worked example

Lender **i = 3**. `commitmentBn = 0.2 + sr(55)·19.8`. `sr(55)=frac(sin(56)×10⁴)`: sin(56 rad) ≈
−0.5216, ×10⁴ = −5215.9, frac → 0.41 → `commitmentBn = 0.2 + 0.41·19.8 ≈ $8.3B`.
`greenLoanPct = 20 + sr(96)·75`; if `sr(96) ≈ 0.53` → `≈ 60%`. `avgDscr = 1.1 + sr(124)·1.4`; if
`sr(124) ≈ 0.30` → `1.52×`. These three attributes are drawn from *unrelated* seeds, so a lender with
a 1.52× DSCR can carry any spread — coverage and pricing are uncorrelated, which no real credit book
would exhibit. (Digits depend on JS float; the point is the independence.)

### 7.5 Companion analytics

- **Green-loan structuring:** first-loss and subordinated tranche percentages per lender (blended-finance
  layering) — random, illustrative of credit-enhancement structures.
- **Tenor matching / refinancing risk:** distribution of tenors and the `refinancingRisk>40` screen.
- **Asset-class analysis:** commitment and green-% rollups by project-finance category.
- **Regulatory capital / market intelligence:** display scaffolds framed around GAR/EBA context but
  not computing capital charges.

### 7.6 Data provenance & limitations

- **All lender data is synthetic**, seeded by `sr()`; attributes are mutually independent draws.
- The guide's GAR, PCAF financed emissions and portfolio temperature score are **not computed** — no
  loan tape, no EVIC/property value, no investee emissions, no ITR exists.
- DSCR/LLCR are named but not derived from cash flows; `greenLoanPct` is a random proxy, not a taxonomy
  alignment.

**Framework alignment:** **EU Taxonomy Green Asset Ratio (GAR)** — taxonomy-aligned loans / total
covered assets, a mandatory CSRD bank disclosure (the guide's headline; not computed here). **PCAF
Standard Parts A/B/C** — financed emissions for corporate loans (Outstanding/EVIC × Scope 1+2),
project finance, and mortgages. **Partnership for Paris-Aligned Finance / SBTi FI** — the portfolio
temperature-score basis. **EBA climate-risk / green-lending guidance** — the regulatory-capital context.
The module names all of these but implements only average-of-draws aggregation.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Turn a real energy-sector loan tape into the three disclosures the guide advertises: GAR, PCAF
financed emissions, and a loan-weighted portfolio temperature score. Coverage: corporate loans,
project finance (renewables), and green mortgages.

### 8.2 Conceptual approach
Combine the **EU Taxonomy GAR methodology** (Del. Reg 2021/2178 disclosure templates), the **PCAF
Global Standard (2022)** attribution, and the **SBTi/PACTA temperature-alignment** approach. Benchmarks:
**PCAF** member-bank implementations, **2DII PACTA for Banks**, **EBA GAR pilot**.

### 8.3 Mathematical specification
```
GAR   = Σ_i TaxonomyAligned_i · Exposure_i / Σ_i CoveredAssets_i
FE_i  = (Outstanding_i / EVIC_i) · (Scope1_i + Scope2_i)          (corporate)
      = (Outstanding_j / TotalProjectCost_j) · ProjectEmissions_j (project finance, Part B)
      = (Loan_k / PropertyValue_k) · EnergyUse_k · EF_k            (mortgages, Part C)
ITR_portfolio = Σ_i w_i · TempScore_i,   w_i = Exposure_i / Σ Exposure
DSCR = CFADS_t / DebtService_t ;  LLCR = NPV(CFADS_{t..maturity}) / DebtOutstanding
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Taxonomy alignment flag | `TaxonomyAligned` | EU Taxonomy TSC screen |
| EVIC | `EVIC` | Bloomberg/Refinitiv |
| Investee Scope 1+2 | `Scope1,2` | CDP/Trucost/proxy |
| Project emissions | `ProjectEmissions` | grid displacement × generation (avoided) or plant EF |
| Borrower temperature score | `TempScore` | SBTi / PACTA sector pathway |
| Grid/energy EF | `EF` | IEA grid factors |

### 8.4 Data requirements
Loan-level: outstanding, borrower ID, sector, EVIC or project cost, property value + energy use
(mortgages), taxonomy-eligibility/alignment flags, and cash-flow projections (for DSCR/LLCR). Sources:
internal loan tape, CDP/Trucost, IEA EF, SBTi target database. Platform already has
`pcaf-financed-emissions` and grid-EF engines to reuse.

### 8.5 Validation & benchmarking plan
Reconcile FE against the platform's PCAF engine on the same tape; reconcile GAR against the issuer's
published CSRD GAR; benchmark ITR against a PACTA-for-Banks run. DSCR/LLCR back-tested against realised
project performance. Sensitivity: EVIC period-end vs average.

### 8.6 Limitations & model risk
GAR numerator depends on scarce taxonomy-alignment data (often defaulting to eligibility only, BTAR);
EVIC volatility destabilises attribution. Conservative fallback: unscreened exposures count as
non-aligned in GAR and carry sector-proxy emissions at PCAF DQ 5 — data gaps never reduce the reported
footprint or inflate GAR.
