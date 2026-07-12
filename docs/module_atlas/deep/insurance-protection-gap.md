## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful: the page implements a Protection Gap Index over curated
country/region data, peril-by-income penetration, a widening-gap climate trend, RCP-scenario stress,
and a public-private scheme catalogue. The `insurance_climate_risk.py` engine (which computes a
protection gap internally) is *not* called; all figures are page-local. Country data is curated and
internally consistent (e.g. USA `insuredLoss 1017 ≈ 82% × totalLoss 1240 = penetration`).

### 7.1 What the module computes

The Protection Gap Index is essentially the stored `gap` field, and derived KPIs aggregate it:

```
PGI_country = gap%  ≡ (totalLoss − insuredLoss)/totalLoss × 100      // verified vs stored fields
globalGap   = round(1.8 × 1e12)                                       // $1.8T headline (Swiss Re)
```

The climate **trend** and **stress** series scale a base gap by year/scenario:

```js
GAP_TREND.gap  = (90 + i·11 + sr(i·13)·18) × 1e9      // $Bn, growing 2010→2024
GAP_TREND.gapPct = 56 + i·0.5 + sr(i·17)·2            // % uninsured drifting up
CLIMATE_STRESS.gap = 900 × (1 + (i+1)·0.28) × 1e9     // widening 28%/step across RCP scenarios
CLIMATE_STRESS.uninsurable = 200 × (i+1) × 0.35 × 1e9
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| `COUNTRIES` (penetration, gap, totalLoss, insuredLoss, gdp, risk) | 15 curated rows | Realistic — high-income penetration 68–82%, India 8%, Nigeria 4% |
| Gap identity | `gap = 100 − penetration` (≈) | Insured/total consistent with penetration |
| `GAP_TREND` (2010–2024) | base + `sr()` noise | Synthetic widening series |
| `PERIL_PENETRATION` by income | `70 − gi·18 + sr()·20` | Synthetic; penetration falls with income group |
| `REGION_GAP` (gapBn, penetration, climate_risk) | 6 curated regions | Asia-Pacific $1,840Bn largest gap |
| `CLIMATE_STRESS` (5 RCP scenarios) | ad-hoc scaling factors | 2030/2050/2100 × RCP4.5/8.5 |
| `PP_SCHEMES` | 8 curated real schemes | NFIP, CEA, Pool Re, CCRIF, ARC, PCRIC… (real programmes) |
| `globalGap` | $1.8T | Swiss Re sigma global protection gap |

### 7.3 Calculation walkthrough

1. Country table renders penetration/gap and $ insured vs economic loss; the PGI is the stored gap.
2. Penetration-rate tab plots the income-group penetration matrix by peril.
3. Climate-stress tab scales the base gap across five RCP/horizon scenarios and splits
   insurable vs uninsurable.
4. Public-private tab lists real backstop schemes by peril, coverage, model, and subsidy.
5. KPI cards report the global gap and the latest trend point.

### 7.4 Worked example (China vs USA PGI)

| Country | Total loss | Insured loss | PGI = (total−insured)/total | Stored gap |
|---|---|---|---|---|
| USA | 1240 | 1017 | (1240−1017)/1240 = **18.0%** | 18 |
| China | 1840 | 405 | (1840−405)/1840 = **78.0%** | 78 |
| India | 620 | 50 | (620−50)/620 = **91.9%** | 92 |

The stored `gap` matches the computed PGI to rounding — confirming the index is a display of curated
inputs, not a live computation. Climate stress @2050 RCP8.5 (i=3): `gap = 900×(1+4×0.28)×1e9 =
900×2.12 = $1.9T` widening from the $0.9T base.

### 7.5 Companion analytics on the page

- **Region gap** bar with climate-risk overlay (Asia-Pacific highest gap and risk).
- **Peril × income penetration** matrix (low-income under-penetration).
- **Public-private schemes** — model type, coverage, subsidy, inception year.

### 7.6 Data provenance & limitations

- Country/region/scheme data is **curated realistic** (consistent penetration↔insured/economic loss);
  trend and stress series are **`sr()`-seeded / ad-hoc scaled**.
- Climate stress uses fixed `(1+(i+1)×0.28)` scaling per scenario, not a peril-specific AAL uplift
  from a cat model or downscaled hazard — the guide's "AAL uplift factors per RCP/SSP" is
  approximated, not implemented.
- No mortality-adjusted gap score (listed in the guide) is computed.

**Framework alignment:** *Swiss Re sigma* — the $1.8T global gap and country penetration echo sigma's
protection-gap reporting. *Munich Re NatCatSERVICE* — the economic-vs-insured loss split follows the
NatCat database structure. *UNDRR Sendai / World Bank DRFI* — the public-private scheme catalogue
(sovereign parametric pools CCRIF/PCRIC/ARC) reflects the DRFI risk-layering framework, though no
layering optimisation is run.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute forward-looking, peril-specific protection gaps under downscaled climate scenarios — sizing
uninsured exposure for product design, sovereign risk-pooling, and regulatory capital adequacy.

### 8.2 Conceptual approach
Combine an **AAL model** (hazard × exposure × vulnerability) with a **penetration/affordability model**
to split economic loss into insured and uninsured, then scale AAL by downscaled RCP/SSP hazard
multipliers — mirroring Swiss Re's economic-loss modelling and the World Bank DRFI layered approach.

### 8.3 Mathematical specification
For country *c*, peril *p*, scenario *s*, year *t*:

```
AAL_{c,p}(s,t) = Σ_T (λ_T − λ_{T+1}) · DF_{c,p}(i_T) · Exposure_c · u_p(s,t)   // u = hazard uplift
Penetration_{c,p}(t) = f(GDPpc_c, premium_affordability, market maturity)
InsuredLoss_{c,p}(s,t) = AAL_{c,p}(s,t) · Penetration_{c,p}(t)
Gap_{c,p}(s,t) = AAL_{c,p}(s,t) − InsuredLoss_{c,p}(s,t)
PGI_{c}(s,t)   = Σ_p Gap_{c,p} / Σ_p AAL_{c,p}
MortAdjGap_c   = PGI_c · (fatalities_c / population_c normalised)              // humanitarian weight
```

| Parameter | Source |
|---|---|
| AAL / fragility `DF` | Swiss Re sigma; JRC/HAZUS; national cat models |
| Hazard uplift `u_p(s,t)` | IPCC AR6 Interactive Atlas (RCP/SSP downscaled) |
| Penetration drivers | World Bank GFDD; Swiss Re insurance-density data |
| Fatalities/exposure | EM-DAT; national statistics |

### 8.4 Data requirements
Per country: exposure value, peril fragility, hazard maps by return period, GDP per capita and
insurance density, historical loss/fatality series. Platform has: curated penetration/gap baselines;
`insurance_climate_risk.py` protection-gap logic; needs downscaled hazard uplifts and AAL inputs.

### 8.5 Validation & benchmarking plan
Reconcile modelled PGI against Swiss Re sigma country figures; backtest AAL against EM-DAT/NatCat
loss history; sensitivity to penetration-model form and hazard downscaling; verify RCP8.5 widening
against published protection-gap projections.

### 8.6 Limitations & model risk
Penetration modelling is data-sparse in low-income markets; hazard downscaling error compounds to
2100; affordability and demand are behaviourally uncertain. Fallback: report gaps as scenario ranges
and separate the (well-observed) current gap from the (uncertain) projected gap.
