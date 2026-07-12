# Green Building Certification Finance
**Module ID:** `green-building-certification-finance` · **Route:** `/green-building-certification-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EI1 · **Sprint:** EI

## 1 · Overview
Green building certification economics and investment analysis: LEED/BREEAM/NABERS/DGNB/Green Star systems, sale premium and rent premium analytics, NPV/MOIC calculator with CAPEX and discount rate sliders, ROI waterfall by component, and market trend intelligence.

> **Business value:** Used by real estate investors underwriting green premium, lenders structuring green mortgages and CMBS, REIT ESG teams targeting GRESB Green Star, and sustainability teams assessing EU Taxonomy buildings compliance.

**How an analyst works this module:**
- Review certification portfolio across 22 buildings with sale premium, rent premium, and payback metrics
- Use NPV/MOIC calculator to model return on green certification CAPEX at different discount rates
- Examine ROI waterfall breakdown by component (sale premium, rent, vacancy, energy, opex, financing)
- Explore green finance structures: CBI CMBS, EIB GBS, GRESB benchmark positioning

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUILDINGS`, `CERTIFICATIONS`, `KpiCard`, `MARKET_TREND`, `Pill`, `ROI_BREAKDOWN`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CERTIFICATIONS` | 9 | `name`, `system`, `region`, `points`, `premium`, `rentPremium`, `costPremium`, `marketShare` |
| `ROI_BREAKDOWN` | 7 | `leed`, `breeam`, `nabers` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npvCalc` | `useMemo(() => { const annualBenefit = capex * 0.08;` |
| `npv` | `Array.from({ length: 10 }, (_, t) => annualBenefit / Math.pow(1 + discountRate / 100, t + 1)).reduce((a, v) => a + v, 0) - capex;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTIFICATIONS`, `ROI_BREAKDOWN`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LEED Platinum sale premium | `Over non-certified comparable assets` | JLL Green Building Premium Report 2023 | Premium narrows to 8–12% at LEED Gold; Platinum commands highest premium in financial centres. |
| BREEAM Outstanding vacancy benefit | `Lower vacancy rate vs non-certified` | RICS Sustainability Report 2023 | Certification reduces void periods; institutional tenants require minimum BREEAM Very Good from 2025 for ESG compliance. |
| EU Taxonomy NZEB threshold | `Better than Nearly Zero Energy Building` | EU Taxonomy Delegated Act 2021/2800 | Buildings must perform 10% better than national NZEB to qualify as sustainable investment under Art. 7.7. |
- **LEED v4.1 + BREEAM 2018 + NABERS + DGNB + EU Taxonomy + GRESB** → NPV/MOIC calculator + certification analytics + ROI waterfall + market forecast + green finance guide → **Real estate investors, green building lenders, REIT ESG teams, and sustainability-linked loan structurers**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Building NPV
**Headline formula:** `NPV = Σ[(SalePremium + RentPremium + VacancyBenefit + EnergySaving) / (1+r)^t] − CAPEX; MOIC = TotalBenefit / CAPEX`

LEED Platinum/BREEAM Outstanding assets command 8–22% sale premium and 6–15% rent premium over equivalent non-certified space.

**Standards:** ['LEED v4.1 Reference Guide', 'BREEAM Technical Standards 2018', 'EU Taxonomy Art. 7.7 DNSH Buildings']
**Reference documents:** JLL (2023) – Green Building Premium Report; RICS (2023) – Sustainability and Real Estate Value; EU Commission (2021) – Taxonomy Delegated Act Buildings Criteria

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-EI1) advertises a decomposed NPV —
> `NPV = Σ[(SalePremium + RentPremium + VacancyBenefit + EnergySaving)/(1+r)^t] − CAPEX` with
> `MOIC = TotalBenefit/CAPEX`. **The code's `npvCalc` does none of that decomposition.** It applies a
> single flat annual benefit of **8% of CAPEX** to a 10-year discounted sum: `annualBenefit = capex·0.08`.
> The rich certification/building/ROI-breakdown tables (`CERTIFICATIONS`, `BUILDINGS`, `ROI_BREAKDOWN`)
> are displayed for context but do **not** feed the calculator. The page is a **green-building economics
> dashboard with a simplified NPV/MOIC slider**; §8 specifies the decomposed model the guide claims.

### 7.1 What the module computes

The interactive calculator (2 sliders: `capex` $M, `discountRate` %):
```js
annualBenefit = capex · 0.08                                          // flat 8% of CAPEX per year
npv  = Σ_{t=1..10} annualBenefit / (1 + discountRate/100)^t  −  capex
moic = 1 + npv / capex
```
Portfolio KPIs over the 22-building set (filtered by certification system):
```js
avgSalePremium = mean(salePremium)     avgRentPremium = mean(rentPremium)
avgEnergySaving = mean(energySaving)   avgPayback = mean(payback)
```

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| Annual benefit rate | `capex·0.08` (flat 8%) | **hard-coded heuristic** — no components, no framework |
| NPV horizon | 10 years | assumption in code |
| `CERTIFICATIONS` premia | LEED Platinum 8.5% sale / 6.2% rent; BREEAM Outstanding 9.2%/7.1%; NABERS 6★ 7.0%/5.5% | synthetic but consistent with JLL/RICS green-premium ranges (guide-cited) |
| `BUILDINGS` (22) | gfa `5000+sr·95000`; certCost `50+sr·450`; premiums `sr`-drawn | synthetic, seeded |
| `ROI_BREAKDOWN` | 6 components × LEED/BREEAM/NABERS | static reference table (illustrative) |
| `MARKET_TREND` | certifiedStock, avgPremium, greenLoanVolume 2024–2033 | synthetic linear trend |

Crucially, the `ROI_BREAKDOWN` table *does* enumerate the sale/rent/vacancy/energy/opex/financing
components the guide's formula wants — but they are shown in a chart, never summed into `annualBenefit`.

### 7.3 Calculation walkthrough

Sliders → `annualBenefit = 0.08·capex` → 10-year discount → `npv`, `moic`. Certification filter →
`BUILDINGS.filter(cert startsWith system)` → recompute the four average-premium KPIs. The two paths are
independent: changing the certification filter does not alter the NPV, and the NPV ignores the per-scheme
premiums entirely.

### 7.4 Worked example

`capex = $20M`, `discountRate = 7%`. `annualBenefit = 20·0.08 = $1.6M/yr`. Discounted 10-yr annuity
factor at 7% = `(1 − 1.07^−10)/0.07 = 7.0236`. `PV of benefits = 1.6·7.0236 = $11.24M`.
`npv = 11.24 − 20 = −$8.76M`; `moic = 1 + (−8.76/20) = 0.56`. So under the flat-8% assumption a $20M
certification spend is value-destructive (MOIC 0.56×) — a direct artefact of the hard-coded 8% benefit
rate being below the discount-adjusted breakeven, not of any building-specific economics.

### 7.5 Data provenance & limitations

- The NPV engine is a **single-parameter heuristic** (8% of CAPEX); it cannot reflect asset size, rent
  level, energy price, vacancy, or certification tier — the very drivers the guide lists.
- `BUILDINGS` are synthetic (seeded `sr()`); named investors/cities are illustrative labels.
- The decomposed component data exists (`ROI_BREAKDOWN`) but is disconnected from the calculator, so the
  displayed ROI narrative and the NPV number can contradict each other.
- No stranding/CRREM, no financing-cost saving modelled despite being a named component.

**Framework alignment:** LEED v4.1 / BREEAM 2018 / NABERS / DGNB / Green Star (label systems in
`CERTIFICATIONS`); EU Taxonomy Art. 7.7 DNSH buildings and the NZEB +10% threshold are referenced as the
alignment target; GRESB Green Star as benchmark positioning. The green-premium magnitudes echo JLL and
RICS studies. The decomposed, discounted certification-NPV the guide names is specified in §8.

## 8 · Model Specification — Certification-Investment NPV / MOIC Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Value the decision to pursue a green certification on a specific asset: does the incremental CAPEX earn
its cost through higher rent, sale premium, lower vacancy, energy/opex savings and cheaper green
financing? Coverage: single-asset underwriting within a real-estate portfolio.

### 8.2 Conceptual approach
Build a **component-decomposed discounted-cash-flow** exactly as the guide states, benchmarked against
RICS "Sustainability and Real Estate Value" and JLL green-premium methodologies and against CRREM's
value-at-risk framing: each benefit stream is modelled from the asset's own rent roll and energy profile,
discounted at an asset-appropriate rate, net of the certification CAPEX and ongoing verification cost.

### 8.3 Mathematical specification
```
Annual benefit in year t:
  B_t = ρ_rent·Rent_0·(1+g)^t          (rent premium on passing rent)
      + Δvac·Rent_0·(1+g)^t            (vacancy reduction × rent)
      + E_save·P_energy,t              (energy saving × energy price)
      + OpEx_save + Fin_save           (opex & financing-cost saving)
NPV = Σ_{t=1..T} B_t/(1+r)^t + SalePremium·Value_T/(1+r)^T − (CAPEX + Σ VerCost_t/(1+r)^t)
MOIC = (Σ discounted benefits) / (CAPEX + Σ discounted verification cost)
Payback = min{ T' : Σ_{t≤T'} B_t ≥ CAPEX }
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `ρ_rent`, `SalePremium` | rent/sale premium by tier | JLL/RICS green-premium studies; MSCI |
| `Δvac` | vacancy reduction | leasing data / RICS |
| `E_save`, `P_energy,t` | energy saving & price path | EPC/audit; IEA/national energy forecasts |
| `Fin_save` | green-loan margin benefit | green-mortgage / SLL market (EBA label) |
| `r` | asset discount rate | WACC / cap-rate build-up |
| `g` | rent growth | market forecast |

### 8.4 Data requirements
Per asset: passing rent, GFA, vacancy, energy use + tariff, target certification tier + CAPEX, financing
terms. Sources: rent roll, EPC/energy audit (internal), green-premium coefficients (JLL/RICS/MSCI),
energy-price forecasts (IEA). The platform holds the premium reference table (`CERTIFICATIONS`) and the
component split (`ROI_BREAKDOWN`) — these become the calibration inputs.

### 8.5 Validation & benchmarking plan
Backtest predicted premiums against realised certified-vs-uncertified transaction spreads; reconcile
payback against `CERT_COST_BENEFIT`-style market surveys; sensitivity of NPV to each component (tornado);
cross-check the sale-premium term against MSCI green-premium indices.

### 8.6 Limitations & model risk
Premium coefficients suffer selection bias (certified assets are also better-located/newer) — control for
grade/location or the NPV overstates certification value. Energy-price and rent-growth paths are exogenous
and material. Conservative fallback: report NPV as a range across low/central/high premium coefficients and
flag when the result flips sign within that band.

## 9 · Future Evolution

### 9.1 Evolution A — Decomposed green-building NPV replacing the 8%-of-CAPEX heuristic (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's decomposed NPV (`NPV = Σ[(SalePremium + RentPremium + VacancyBenefit + EnergySaving)/(1+r)^t] − CAPEX`, `MOIC = TotalBenefit/CAPEX`) is not implemented — `npvCalc` applies a single flat annual benefit of 8% of CAPEX over 10 years, unable to reflect asset size, rent level, energy price, vacancy, or certification tier (the very drivers the guide lists). The `ROI_BREAKDOWN` component data exists but is disconnected from the calculator, so the displayed ROI narrative can contradict the NPV number; buildings are `sr()`-seeded; and no CRREM stranding or financing-cost saving is modelled. Evolution A builds the real decomposed NPV: each benefit stream (sale premium, rent premium, vacancy benefit, energy saving) computed from the asset's rent/area/energy inputs and certification tier, discounted properly, with MOIC from total benefit — wiring the existing `ROI_BREAKDOWN` into the actual calculation.

**How.** (1) Rewrite `npvCalc` to sum the four discounted benefit streams from asset-level inputs (rent, area, energy intensity, vacancy, tier-specific premia from the 8–22% sale / 6–15% rent ranges the module cites). (2) Connect `ROI_BREAKDOWN` so the waterfall and NPV reconcile. (3) Add a financing-cost saving (green-loan margin) and optional CRREM stranding overlay.

**Prerequisites.** Asset-level rent/area/energy inputs (real or user-entered); the seeded `BUILDINGS` replaced or made editable; tier-premium reference ranges. **Acceptance:** NPV recomputes from the four decomposed streams reproducing §5; the ROI waterfall and NPV agree; changing rent or tier changes the NPV; the flat 8% heuristic is gone.

### 9.2 Evolution B — Green-building investment-case copilot (LLM tier 1 → 2)

**What.** A copilot for real-estate investors: "what's the NPV and MOIC of certifying this office to LEED Platinum, and which benefit stream dominates?" narrates the premium ranges and ROI components from the atlas corpus, with tier-2 running the Evolution A decomposed NPV so the investment case is computed per asset.

**How.** Tier 1 grounds on §5/§7 (LEED/BREEAM/NABERS/DGNB systems, the sale/rent premium ranges), with a guardrail that pre-Evolution-A the NPV is a flat-8% heuristic and the ROI narrative can contradict it — so it must flag that limitation. Tier 2 tool-calls the decomposed NPV endpoint so CAPEX and discount-rate what-ifs are computed and the dominant benefit stream is identified. Every NPV/MOIC figure validated against tool output.

**Prerequisites.** Evolution A (the current NPV can't reflect the drivers a copilot would discuss); corpus embedding. **Acceptance:** post-Evolution-A, every NPV, MOIC, and benefit-stream figure traces to a tool call and the waterfall reconciles with the NPV; pre-Evolution-A the copilot discloses the single-parameter heuristic limitation.