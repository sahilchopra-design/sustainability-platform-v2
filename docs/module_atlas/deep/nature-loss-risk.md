## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a **Nature Loss Financial Risk
> Score**, `NLFRSᵢ = Σⱼ (Dependencyᵢⱼ × ServiceDegradationⱼ × RevenueExposureᵢⱼ)`, built on an
> ENCORE sector-dependency matrix and an IPBES ecosystem-degradation index, with a headline
> "Revenue at Risk (%)" and "Freshwater Stress Exposure (%)" tied to WRI Aqueduct. **None of this
> exists in code.** `NatureLossRiskPage.jsx` has no revenue field, no degradation index, no
> Aqueduct overlay, and no `Dependency × Degradation × Exposure` product anywhere — every metric
> for the 50 named companies is an independent `sr()` PRNG draw with no cross-field arithmetic.

### 7.1 What the module computes

`COMPANIES` — 50 real company names (Nestlé, Cargill, BHP, Shell, Stora Enso, Thai Union, Merck,
…) hard-mapped to 8 sectors via a parallel `secs[]` array (index-aligned, not derived). Each company
gets 16 independently `sr(i×k)`-seeded fields: `natureDep`, `natureImpact`, `biodivFootprint`,
`tnfdReadiness`, `leapScore`, `waterDep`, `soilDep`, `pollinatorDep`, `carbonSeq`, `landUse`,
`speciesRisk`, `deforestLink`, `supplyChainNature` (all 0–100 scales), `msa` (Mean Species
Abundance, 0.1–0.9), plus categorical `sbtNature` (`sr(i×59)>0.6→'Committed'`,
`>0.3→'Exploring'`, else `'None'`) and `naturePlan` (`sr(i×61)>0.5→'Published'`).

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `natureDep` | `10+sr(i×7)×85` | 10–95 |
| `natureImpact` | `5+sr(i×11)×90` | 5–95 |
| `tnfdReadiness` | `5+sr(i×17)×85` | 5–90 |
| `leapScore` | `10+sr(i×19)×80` | 10–90 |
| `msa` | `sr(i×67)×0.8+0.1` | 0.1–0.9 |
| `sbtNature` | `sr(i×59)` thresholds 0.6/0.3 | Committed/Exploring/None |

`BIO_DRIVERS` — a fixed 5-slice donut (Land Use Change 30%, Resource Exploitation 23%, Climate
Change 19%, Pollution 17%, Invasive Species 11%) — plausible IPBES-style driver-attribution shares
but hard-coded constants, not computed from `COMPANIES`. `TREND` — 24 monthly points, 3 more
independent `sr()` series (`avgDep`, `avgImpact`, `tnfdAdoption`), unconnected to `COMPANIES`.

### 7.3 Calculation walkthrough

1. **Dashboard** — KPIs (`avgDep`, `avgImpact`, `avgTnfd`, `committed` count, `avgMsa`) are
   arithmetic means/counts over all 50 companies (legitimate aggregation over synthetic inputs);
   `sectorChart` groups mean `natureDep`/`natureImpact` by the 8 hard-mapped sectors;
   `radarData` averages 6 fields (`natureDep`, `natureImpact`, `tnfdReadiness`, `leapScore`,
   `waterDep`, `supplyChainNature`) into a single portfolio radar shape.
2. **Company Screening** — filter/sort/paginate table with colour-coded `badge()` thresholds
   (`[25,50,70]` low/mid/high bands) applied directly to raw PRNG scores.
3. **TNFD LEAP** — top-15/-20 companies ranked by `leapScore` (itself a bare PRNG draw, not an
   assessed LEAP maturity level) charted against `tnfdReadiness`.
4. **Biodiversity Footprint** — top-20 by `biodivFootprint`, paired with `msa`, `speciesRisk`,
   `landUse`, `deforestLink` — again five independent random numbers displayed together as if one
   metric explained another.

### 7.4 Worked example

Company `i=0` ("Nestle SA", sector `Consumer`): `natureDep = 10+sr(7)×85`. `sr(7)`: `sin(8)=0.9894`,
×10000=9893.6, `frac=0.5822` (`floor(9893.6)=9893`, `9893.6-9893=0.5822`→ but using `x-Math.floor(x)`
on the *unscaled* value: `x=sin(8)*10000=9893.58...`; `Math.floor(x)=9893`; `x-9893=0.58...`).
`natureDep = 10+0.58×85 ≈ 59`. `natureImpact = 5+sr(11)×90`: `sin(12)=-0.5366`, ×10000=-5366.3,
`floor(-5366.3)=-5367`, `frac=0.70` → `natureImpact ≈ 5+0.70×90=68`. These two headline "nature
risk" numbers for Nestlé (dependency 59, impact 68) are independent PRNG draws with no shared
seed relationship and no tie to Nestlé's real palm-oil/cocoa/dairy supply-chain footprint.

### 7.5 Data provenance & limitations

- 100% synthetic — no ENCORE dependency matrix, no IPBES degradation index, no WRI Aqueduct
  overlay, and critically **no revenue field at all**, despite the guide's headline "Revenue at
  Risk (%)" data point.
- Sector assignment is a fixed lookup array parallel to the name list — a real classification
  error for any company would require editing both arrays in lockstep, and there is no validation
  that they stay aligned.
- `BIO_DRIVERS` percentages are plausible-looking (broadly consistent with IPBES's 2019 Global
  Assessment driver ranking: land/sea use change, direct exploitation, climate change, pollution,
  invasive species — in that relative order) but are hard-coded, not computed from any of the 50
  companies' data.

**Framework alignment:** TNFD LEAP — tab and field names only, no Locate/Evaluate/Assess/Prepare
workflow logic · CSRD ESRS E4 — named in the guide, not implemented · IPBES driver ranking — the
qualitative *ordering* of `BIO_DRIVERS` matches IPBES 2019's global attribution, but the percentages
are not sourced to that report.

## 8 · Model Specification — Nature Loss Financial Risk Score (NLFRS)

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Translate ecosystem-service dependency into a **revenue-at-risk** figure
per company, for engagement prioritisation and CSRD ESRS E4 / TNFD Risk & Impact disclosure.

**8.2 Conceptual approach.** Weight each ecosystem service a company depends on by (a) how
degraded that service already is globally/regionally and (b) how much revenue flows through
operations exposed to it — the same dependency × degradation × exposure architecture MSCI and
Moody's ESG Solutions use for "nature value-at-risk" style overlays, and consistent with the
**ENCORE** (ecosystem service dependency) + **IPBES** (degradation trend) data pairing the guide
already names.

**8.3 Mathematical specification.**
```
Dependencyᵢⱼ         = ENCORE sector-dependency rating for service j (0=none,1=low,2=medium,3=high)
ServiceDegradationⱼ,g = IPBES/regional degradation index for service j in geography g (0-1, rising = worse)
RevenueExposureᵢⱼ,g   = revenueᵢ,g,segment / total_revenueᵢ   (segment revenue sourced from geography g, dependent on service j)
NLFRSᵢ               = 100 × Σⱼ,g Dependencyᵢⱼ × ServiceDegradationⱼ,g × RevenueExposureᵢⱼ,g / Σⱼ Dependencyᵢⱼ_max
RevenueAtRisk%ᵢ      = Σⱼ,g RevenueExposureᵢⱼ,g  for services with Dependencyᵢⱼ ≥ 2 (High)
```
| Parameter | Calibration source |
|---|---|
| `Dependencyᵢⱼ` | ENCORE sector × ecosystem-service dependency matrix (UNEP-WCMC, public) |
| `ServiceDegradationⱼ,g` | IPBES Global/Regional Assessment degradation trend by service and region |
| `RevenueExposureᵢⱼ,g` | Company segment/geographic revenue disclosure (10-K, annual report) mapped to ENCORE service categories |
| Freshwater-specific overlay | WRI Aqueduct basin-level water-stress score in place of the generic degradation index for water-dependent services |

**8.4 Data requirements.** ENCORE sector-dependency download (free, UNEP-WCMC); IPBES assessment
degradation tables (free, PDF extraction needed); company segment revenue by geography (10-K
Item 1/segment notes — labour-intensive to structure); WRI Aqueduct basin shapefiles for site-level
water-stress joins where facility geocoordinates exist.

**8.5 Validation & benchmarking plan.** Cross-check sector rankings against MSCI/Moody's published
nature-risk heat maps (directional agreement expected: mining, agriculture, food & beverage should
rank highest); sensitivity-test degradation-index vintage (IPBES updates infrequently, so use the
most recent regional assessment and flag staleness).

**8.6 Limitations & model risk.** Segment revenue rarely maps cleanly to ENCORE service categories
(disclosure grain is coarser than the dependency matrix), forcing analyst judgment calls that should
be documented per company; degradation indices are regional averages, not site-specific; treat
`NLFRS` as a screening triage score, not a precise financial loss estimate — pair with the
platform's existing `physical-risk-portfolio` / `water-risk-analytics` modules for site-level detail.
