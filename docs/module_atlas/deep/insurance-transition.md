## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a **transition-risk aggregation**
> — `TotalRisk = UnderwritingRisk + InvestmentRisk + LiabilityRisk` with stranded-asset screening and
> a Solvency II overlay. **The code implements none of that as a risk aggregation.** It is a
> **synthetic insurer scorecard**: 50 named insurers with five PRNG sub-scores averaged into an
> "overall transition score", plus fossil-fuel exposure draws, 40 synthetic green products, and a
> curated regulatory-framework table. No investment portfolio, no stranded-asset model, no SCR
> overlay is computed. Sections below document the code.

### 7.1 What the module computes

Each of 50 insurers gets five independent `sr()` sub-scores, averaged (equal weight) into an overall
score:

```js
transitionScore = 20 + s5·75     envScore = 15 + s6·80     disclosureScore = 25 + s7·70
targetScore     = 10 + s8·85     engagementScore = 20 + s9·75
overallScore    = round((transitionScore+envScore+disclosureScore+targetScore+engagementScore)/5)
```

Fossil exposure and green ratio are also draws:

```js
fossilExposure = 1 + s4·25                         // % of GWP
coalExposure   = s5·fossilExposure·0.4 ; oilGasExposure = fossilExposure − coalExposure
greenPremium   = gwp·0.02 + s10·gwp·0.15 ; greenRatio = greenPremium/gwp·100
```

Portfolio KPIs average across insurers (with `Math.max(1, length)` division guards):

```js
avgScore = round(Σ overallScore / max(1, N))
avgFossil = Σ fossilExposure / max(1, N) ; avgGreenRatio = Σ greenRatio / max(1, N)
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| 50 insurer names | Allianz, AXA, Swiss Re, Munich Re, Ping An… | Real names, **synthetic metrics** |
| Five sub-scores | ranges 10–95 | Independent `sr(s)=frac(sin(s+1)×10⁴)` draws |
| Overall score | equal-weight mean of 5 | No materiality weighting |
| `fossilExposure` | 1–26 % GWP | `sr()` draw |
| Coal split | 40 % of fossil × `sr()` | Synthetic |
| NZIA/PSI/SBTi/TCFD flags | `sr()` thresholds (>0.4, >0.35, >0.6, >0.3) | Synthetic membership gates |
| Phase-out years | `sr()`-gated (coal 2025–33, oil 2028–40, gas 2030–45) | Synthetic |
| Green ratio | `2% + sr×15%` of GWP | Synthetic |
| 40 `GREEN_PRODUCTS` | premium/growth/loss-ratio draws | Synthetic |
| `REGULATORY_FRAMEWORKS` (8) | compliance %, requirements, keyGap | **Curated** (TCFD, EIOPA SII, PRA SS3/19, NAIC, ISSB S2, SFDR, PSI, NZIA) |

### 7.3 Calculation walkthrough

1. `INSURERS` seeded → scorecard table (paginated) sortable by score/fossil/green.
2. Overall score = equal mean of five sub-scores; band colour by threshold.
3. Fossil-underwriting tab charts coal/oil/gas exposure and phase-out commitments.
4. Green-products tab lists 40 synthetic products by category, premium, growth, loss ratio.
5. Regulatory tab renders the curated framework table with compliance %.
6. KPI cards average overall score, fossil exposure, and green ratio across the 50 insurers.

### 7.4 Worked example (one insurer)

Insurer *i = 0* (Allianz) with draws giving `transitionScore = 62, envScore = 71, disclosureScore =
55, targetScore = 48, engagementScore = 66`, `gwp = 80`, `s4 → fossilExposure = 12.5`:

| Output | Computation | Result |
|---|---|---|
| Overall score | (62+71+55+48+66)/5 | **60.4 → 60** |
| Coal exposure | s5×12.5×0.4 | e.g. **2.5%** |
| Oil/gas exposure | 12.5 − 2.5 | **10.0%** |
| Green premium | 80×0.02 + s10×80×0.15 | e.g. **$4.8M** |
| Green ratio | 4.8/80×100 | **6.0%** |

The overall score is arithmetically just the mean of five random numbers — it carries no transition
pathway, stranded-asset, or SCR content.

### 7.5 Companion analytics on the page

- **Fossil-fuel underwriting** — coal/oil/gas exposure and phase-out timelines by insurer.
- **Green insurance products** — 40-product catalogue with growth and loss-ratio.
- **Regulatory & disclosure** — 8-framework compliance table with named key gaps.

### 7.6 Data provenance & limitations

- **Insurer metrics and green products are 100 % synthetic** (`sr()`-seeded); only the names and the
  regulatory-framework table are real.
- The overall transition score is an unweighted mean of five uncorrelated draws — no methodology, no
  materiality weighting, no evidence chain.
- No investment/stranded-asset/liability risk is quantified, and no Solvency II SCR overlay is
  computed, contradicting the guide's `TotalRisk` and ORSA claims.

**Framework alignment:** *NZIA / PSI / SBTi / TCFD / PCAF* — surfaced as membership flags, not
assessed. *EIOPA Solvency II / PRA SS3/19 / NAIC / ISSB S2 / SFDR* — represented in the curated
regulatory table with plausible compliance percentages, but no compliance is measured. *IAIS
Application Paper on Climate* — referenced in the guide, absent from code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible insurer **transition-risk score** across underwriting, investment, and liability
channels, plus a Solvency II climate SCR overlay — for ESG analysts and ORSA teams assessing
transition exposure in insurance books.

### 8.2 Conceptual approach
Three-channel aggregation: (1) **underwriting** — fossil-fuel GWP × stranding-repricing risk; (2)
**investment** — NGFS-scenario repricing of the asset book (stranded-asset losses); (3) **liability**
— climate D&O/litigation exposure. Benchmarked to PCAF Insurance-Associated Emissions, NZIA
target-setting, and NGFS Phase IV transition shocks; scoring construction mirrors MSCI/Sustainalytics
ESG-rating aggregation with explicit materiality weights.

### 8.3 Mathematical specification
For insurer *j*, scenario *s*:

```
UWRisk_j(s)   = Σ_sector GWP_{j,sector}·repricing_sector(s)            // fossil-heavy sectors weighted
InvRisk_j(s)  = Σ_c Alloc_{j,c}·ΔValue_c(s)                            // NGFS asset repricing
LiabRisk_j(s) = D&O_exposure_j · climate_litigation_intensity(s)
TransScore_j  = 100 − norm( w_UW·UWRisk_j + w_Inv·InvRisk_j + w_Liab·LiabRisk_j )
CATSCR_add_j  = SCR_base_j · climate_scalar(s)                         // Solvency II Pillar-2 overlay
```

| Parameter | Source |
|---|---|
| Sector repricing `repricing_sector(s)` | NGFS Phase IV; IEA NZE stranded-asset shares |
| Asset repricing `ΔValue_c(s)` | NGFS transition shocks; Trucost carbon exposure |
| Litigation intensity | Grantham/Sabin climate-litigation database trends |
| Channel weights `w` | Materiality assessment; NZIA/PCAF guidance |

### 8.4 Data requirements
Per insurer: GWP by sector, investment allocation with carbon exposure, D&O book, base SCR. Platform
has: synthetic scorecard scaffolding and the `insurance_climate_risk.py` engine; needs real GWP-by-
sector, investment-carbon, and litigation feeds plus NGFS repricing tables.

### 8.5 Validation & benchmarking plan
Reconcile transition scores against public NZIA/PCAF insurer disclosures; backtest asset-repricing
losses against NGFS Phase IV published impacts; sensitivity of composite to channel weights; verify
CAT-SCR overlay against EIOPA CCRST.

### 8.6 Limitations & model risk
Insurer-level GWP-by-sector and investment-carbon data are sparse and self-reported; litigation
intensity is hard to quantify; channel weighting is subjective. Fallback: report each channel
separately and the composite as a band, not a precise rank.
