# Community Climate Resilience Finance
**Module ID:** `community-climate-resilience` · **Route:** `/community-climate-resilience` · **Tier:** B (frontend-computed) · **EP code:** EP-DI6 · **Sprint:** DI

## 1 · Overview
Analyses investment in community-level climate resilience across health systems, social infrastructure, local government adaptation, and community-based disaster risk reduction. Models social resilience dividend, community bond structures, and SDG impact returns for resilience investments.

> **Business value:** Applicable to community development finance institutions, municipal bond funds, impact investors in social infrastructure, and development banks programming adaptation finance. Provides Sendai Framework impact metrics and ICMA Social Bond Principles alignment for community resilience bonds.

**How an analyst works this module:**
- Select community and hazard type for resilience assessment
- Calculate avoided loss from resilience investments
- Model social co-benefits (health, education, economic)
- Assess community bond issuance feasibility
- Generate Sendai Framework-aligned impact metrics

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `COMMUNITIES`, `COMMUNITY_NAMES`, `INCOME_LEVELS`, `INDIGO`, `PURPLE`, `REGIONS`, `RESILIENCE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'Pacific Islands', 'Latin America', 'MENA', 'Caribbean', 'Central Asia'];` |
| `INCOME_LEVELS` | `['Low', 'Lower-Middle', 'Upper-Middle'];` |
| `resilienceScore` | `Math.round(10 + sr(i * 7) * 85);` |
| `tempMult` | `1 + (tempScenario - 1.5) * 0.08;` |
| `avgResilience` | `filtered.length ? filtered.reduce((s, c) => s + c.resilienceScore, 0) / filtered.length : 0;` |
| `totalAdaptFunding` | `filtered.reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0);` |
| `indigenousPct` | `filtered.length ? (filtered.filter(c => c.indigenousCommunity).length / filtered.length) * 100 : 0;` |
| `avgPhysicalRisk` | `filtered.length ? filtered.reduce((s, c) => s + c.physicalRisk * tempMult, 0) / filtered.length : 0;` |
| `resilienceByRegion` | `REGIONS.map(r => {` |
| `scatterData` | `filtered.map(c => ({` |
| `physRiskByIncome` | `INCOME_LEVELS.map(il => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMUNITY_NAMES`, `INCOME_LEVELS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DRR Investment BCR | — | UNDRR Economic Value of DRR 2023 | Every $1 invested in disaster risk reduction avoids $4–9 in economic losses from disasters |
| Community Bond Market | — | ICMA Social Bond Database 2024 | Community resilience bonds represent fastest-growing sub-category of social bond market |
| Sendai Target E Progress | — | UNDRR Sendai Monitor 2023 | Progress toward Sendai Target E to reduce disaster mortality — on track in OECD, lagging in LMICs |
- **Community asset register + hazard exposure data** → Avoided loss calculation → **Expected annual avoided losses from resilience investment**
- **Social sector data (health outcomes, school attendance)** → Co-benefit quantification → **Social returns from resilience infrastructure**
- **Local government fiscal capacity + bond market access** → Community bond feasibility → **Bond structure and credit enhancement requirements**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Resilience Dividend
**Headline formula:** `ResilienceDividend = Σ [(AvoidedLoss_t + WellbeingGain_t + EconomicMultiplier_t) / (1+r)^t] - ResilienceInvestment; BCR_social = TotalBenefit / TotalCost`

Resilience dividend captures avoided disaster losses plus positive co-benefits (health, education, economic activity) discounted at social discount rate; typically 4:1 to 9:1 benefit-cost ratio

**Standards:** ['Sendai Framework for DRR 2015–2030', 'UNDRR Economic Value of DRR', 'World Bank Community Resilience Program', 'IPCC AR6 WGII Chapter 8 — Cities and Human Settlements']
**Reference documents:** Sendai Framework for Disaster Risk Reduction 2015–2030; UNDRR Economic Value of DRR Report 2023; IPCC AR6 WGII Chapter 8 — Urban Systems and Other Human Settlements; ICMA Social Bond Principles — Community Resilience Guidance 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DI6) advertises a **Social Resilience
> Dividend** engine — a discounted-cash-flow of *avoided disaster losses + wellbeing gains + economic
> multipliers* net of resilience investment, plus a social benefit-cost ratio (`BCR_social`), plus
> community-bond feasibility scoring aligned to the Sendai Framework and ICMA Social Bond Principles.
> **None of that DCF/BCR logic exists in this module's code.** What the page actually implements is a
> **synthetic community-scorecard dashboard**: 60 seeded communities each carry a resilience score and
> six 0–10 vulnerability primitives, aggregated into filtered averages and a single temperature-shock
> multiplier. There is no discounting, no avoided-loss term, no bond structuring. The sections below
> document the code as it behaves; §8 specifies the resilience-dividend model the guide promises.

### 7.1 What the module computes

For 60 synthetic communities across 8 regions and 3 income levels, the page produces filtered means and
one climate-conditioned adjustment. The only "model" beyond averaging is the temperature multiplier:

```js
tempMult = 1 + (tempScenario − 1.5) × 0.08          // tempScenario ∈ [1.5, 4.0] °C
avgPhysicalRisk = mean( physicalRisk × tempMult )    // over filtered communities
totalAdaptFunding = Σ ( adaptationFunding × financeMultiplier )
indigenousPct = |indigenous| / |filtered| × 100
avgResilience = mean( resilienceScore )
```

Each community holds: `resilienceScore` (10–95), `physicalRisk`, `socialVulnerability`,
`economicResilience`, `foodInsecurity`, `climateFinanceAccess`, `communityOrgStrength` (all 1–10),
`adaptationFunding` ($0.5–50M), `populationK` (5–500), and two booleans `indigenousCommunity`
(`sr(i·29) > 0.55`) and `coastalExposure` (`sr(i·31) > 0.45`).

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula / range | Provenance |
|---|---|---|
| `resilienceScore` | `round(10 + sr(i·7)·85)` → 10–95 | Synthetic seeded PRNG |
| `physicalRisk` etc. | `1 + sr(i·k)·9` → 1–10 | Synthetic seeded PRNG |
| `adaptationFunding` | `0.5 + sr(i·23)·49.5` $M | Synthetic seeded PRNG |
| `tempMult` slope | `0.08` per °C above 1.5 | Hard-coded heuristic — no cited source |
| `financeMultiplier` | user slider 0.5–3.0× | UI control, no model basis |
| Resilience label | ≥70 High · 40–69 Medium · <40 Low | Hard-coded display bands |

The `region` and `incomeLevel` are assigned by `i % length` (round-robin), so they are **not**
correlated with any community's real geography — the community *names* (Ganges Delta, Tuvalu, Sahel…)
are cosmetic labels detached from the scored primitives.

### 7.3 Calculation walkthrough

1. User sets four categorical filters (region, income, indigenous, coastal) plus two sliders
   (`financeMultiplier`, `tempScenario`). `filtered` is the subset passing the categorical filters.
2. `tempMult` is computed once from the temperature slider.
3. Every headline KPI is a mean or sum over `filtered`. Physical risk is the only KPI that carries the
   `tempMult`; funding is the only one carrying `financeMultiplier`.
4. Charts re-bucket `filtered` by region / income / indigenous / coastal and recompute the same means.
   The radar inverts food insecurity to "Food Security" as `10 − mean(foodInsecurity)`.

### 7.4 Worked example

Community `i = 3`: `sr(21)=frac(sin(22)·10⁴)`. `sin(22 rad)=−0.00885`, ×10⁴ = −88.5, frac ≈ 0.514 ⇒
`resilienceScore = round(10 + 0.514·85) = round(53.7) = 54` (Medium). With `physicalRisk = 6.2` and the
user at `tempScenario = 3.0 °C`: `tempMult = 1 + (3.0−1.5)·0.08 = 1.12`, so the displayed physical risk
is `6.2 × 1.12 = 6.94/10`. If `adaptationFunding = 30 $M` and `financeMultiplier = 2.0×`, its funding
contribution is `$60M`. These are simple scalings — no avoided-loss or BCR arithmetic occurs anywhere.

### 7.5 Companion analytics on the page

Eight tabs, all descriptive: region resilience bars, dimension radar, physical-risk-by-income,
vulnerability-vs-funding scatter, economic-resilience bars, funding-by-region, indigenous vs
non-indigenous comparison, coastal vs inland comparison, and a Top-20 resilience ranking. No tab feeds
another module; there is no backend engine or route (`engines: []`, `route_files: []`).

### 7.6 Data provenance & limitations

- **All 60 communities are synthetic**, generated by the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`
  — deterministic across renders but not real communities. Region/income are round-robin, not
  geographically joined.
- The `0.08/°C` physical-risk slope and the resilience-score bands are **unsourced heuristics**.
- No avoided-loss, wellbeing, economic-multiplier, discounting, or BCR computation exists despite the
  guide's headline formula — the module is a scorecard, not a resilience-dividend engine.

**Framework alignment (as claimed vs delivered):** *Sendai Framework for DRR (2015–2030)* — Target E
(disaster mortality) and its seven global targets are referenced in the guide but no Sendai indicator is
computed. *UNDRR Economic Value of DRR* (the 4:1–9:1 BCR evidence base) is cited but no BCR is produced.
*ICMA Social Bond Principles* — community-bond structuring is described but absent from code. *IPCC AR6
WGII Ch.8* (human settlements) frames the vulnerability language only. The module therefore *names* these
frameworks without implementing their quantitative content.

---

## 8 · Model Specification — Social Resilience Dividend & Community-Bond Engine

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support a development-finance/impact-investor decision: *how much resilience investment is justified for a
given community, and can it be term-financed by a community resilience bond?* Coverage: community- or
municipality-level adaptation assets (flood defence, early-warning systems, resilient health/social
infrastructure) in LMIC and SIDS contexts. Output: net present resilience dividend, social BCR, and a
bond-sizing/credit-enhancement recommendation.

### 8.2 Conceptual approach
Combine (i) a **catastrophe-model expected-annual-loss (EAL)** engine for avoided physical losses
(mirroring Swiss Re sigma / EM-DAT-calibrated damage functions and the World Bank/GFDRR probabilistic
risk approach), with (ii) a **social cost-benefit layer** monetising co-benefits at a social discount
rate (UNDRR *Economic Value of DRR*; UK Green Book social CBA), and (iii) a **cash-flow waterfall** for
a resilience bond (ICMA Social Bond Principles, World Bank Cat-DDO / resilience-bond precedents). This is
the standard structure of avoided-loss adaptation appraisal, not a heuristic scorecard.

### 8.3 Mathematical specification
Avoided expected annual loss from a resilience measure that cuts vulnerability from `V₀` to `V₁`:
```
EAL_avoided = Σ_h  λ_h · Exposure · (V₀_h − V₁_h) · D_h        (h = hazard: flood, cyclone, drought…)
ResilienceDividend = Σ_{t=1..T} [ (EAL_avoided_t + WellbeingGain_t + EconMultiplier_t) / (1+r)^t ] − I₀
BCR_social = Σ PV(benefits) / Σ PV(costs)
Bond_size = min( DSCR_target⁻¹ · Σ PV(fiscal+savings cash flows) , Investment_need )
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Hazard annual frequency | `λ_h` | EM-DAT event history; UNDRR GAR probabilistic hazard |
| Damage function | `D_h` | Swiss Re sigma / GFDRR vulnerability curves by asset class |
| Vulnerability reduction | `V₀−V₁` | Engineering effectiveness studies (e.g. EWS = 30–50% mortality ↓, WMO) |
| Social discount rate | `r` | 3–8% (UK Green Book 3.5%; World Bank LMIC 6–8%) |
| Wellbeing/health proxy | — | HACT Social Value Bank; WHO DALY monetisation |
| Economic multiplier | — | ILO/UNDRR local-economy multipliers (1.1–1.5×) |
| DSCR target | — | ≥1.25× (municipal/social bond convention) |

### 8.4 Data requirements
Per community: georeferenced exposure value, asset inventory, hazard curves (return-period losses),
baseline vulnerability, proposed measure cost & effectiveness, fiscal capacity, and any donor/blended
tranche. Free sources: EM-DAT, UNDRR GAR, WRI Aqueduct (flood), ND-GAIN (readiness). Platform already
holds physical-risk and adaptation modules (`physical-risk-portfolio`, `physical-hazard-map`) whose
hazard layers could feed `λ_h` and `D_h`; `reference_data` World Bank tables supply fiscal indicators.

### 8.5 Validation & benchmarking plan
Backtest avoided-loss estimates against realised EM-DAT losses in comparable events; reconcile BCR
outputs against published UNDRR/World Bank appraisal ratios (target 4:1–9:1); sensitivity-test on `r`,
`λ_h`, and effectiveness. Benchmark bond sizing against actual resilience-bond issuances (e.g. World
Bank cat bonds, EBRD green/social bonds).

### 8.6 Limitations & model risk
Deep uncertainty in hazard frequency under non-stationary climate (condition `λ_h` on RCP/SSP paths);
co-benefit monetisation is contestable (report BCR both with and without co-benefits); small-sample
communities give unstable EAL — apply Bayesian shrinkage to regional priors. Conservative fallback:
report avoided-loss-only BCR as the floor case.

## 9 · Future Evolution

### 9.1 Evolution A — Build the resilience-dividend DCF the guide promises (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: EP-DI6 advertises a Social Resilience Dividend engine —
discounted avoided losses + wellbeing gains + economic multipliers net of investment,
with `BCR_social` — but ships a synthetic scorecard: 60 `sr()`-seeded communities with
round-robin region/income assignment (Tuvalu and the Sahel draw from the same uniform
distributions), an unsourced `0.08/°C` multiplier, and no discounting anywhere.
Evolution A implements the §8-specified dividend model and detaches the cosmetic
community names from fabricated primitives.

**How.** (1) Core calc: per-community cash-flow model
`Σ[(AvoidedLoss_t + Wellbeing_t + Multiplier_t)/(1+r)^t] − Investment` with a social
discount rate control; avoided loss from hazard frequency × loss-per-event, both
user-entered or sourced from the digital-twin composite score at real community
coordinates. (2) Wellbeing and multiplier terms parameterized from the UNDRR Economic
Value of DRR evidence base the module already cites (its 4:1–9:1 BCR range becomes the
calibration check, not a decoration). (3) Replace the 60 synthetic communities with a
small set of documented case-study communities (curated, cited) — honest small-N beats
fabricated large-N — and make the temperature slider scale hazard frequency through a
sourced relationship rather than the bare 0.08 slope. (4) Sendai indicator outputs
(Target E-style mortality/affected-population metrics) computed from the case data.

**Prerequisites (hard).** Purge the `sr()` community generator and the round-robin
geography (guardrail conventions); a curated case-study dataset with citations.
**Acceptance:** the computed BCR for a reference case lands inside (or is flagged
against) the UNDRR 4:1–9:1 band; discount-rate changes move the dividend correctly;
zero PRNG calls feed any displayed community metric.

### 9.2 Evolution B — Social-bond framework drafter for community issuers (LLM tier 1)

**What.** The module names ICMA Social Bond Principles alignment and community-bond
feasibility as outputs it never computes. Evolution B supplies the qualitative half
that LLMs genuinely help with: given a (post-Evolution A) resilience-investment case —
intervention type, computed dividend, BCR, Sendai metrics — draft the ICMA SBP-aligned
framework sections: use of proceeds, target population definition, expected social
outcomes with the module's computed indicators as KPIs, and reporting commitments.
CDFIs and municipal issuers, the stated users, rarely have this drafting capacity
in-house.

**How.** Tier-1 RAG: corpus is this Atlas record, the ICMA Social Bond Principles text
(refdata regulatory catalog addition), and the UNDRR/Sendai references §5 cites. The
computed case passes as structured context; the drafter maps each SBP component to
evidence and marks components the case cannot support (e.g. no baseline mortality
data) as gaps — honest-nulls in prose. No endpoints exist today, so there is nothing
to tool-call; tier 2 waits on Evolution A's backend.

**Prerequisites (hard).** Evolution A — a bond framework quoting seeded resilience
scores would be a reputational hazard for exactly the impact-investor audience this
module targets; SBP text ingestion. **Acceptance:** a draft framework where every KPI
is a computed module output with its calculation named; unsupported SBP components
are explicitly listed as gaps; regenerating with a different discount rate updates
the quoted BCR consistently.