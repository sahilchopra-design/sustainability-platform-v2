# Capital Markets EU Taxonomy Analytics
**Module ID:** `capital-markets-taxonomy` · **Route:** `/capital-markets-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** EP-DI3 · **Sprint:** DI

## 1 · Overview
EU Taxonomy alignment analytics for capital markets products including equity funds, bond indices, and ETFs. Calculates taxonomy-aligned revenue, capex, and opex by portfolio holding, computes GAR and BTAR metrics, and assesses Article 8/9 SFDR eligibility.

> **Business value:** Delivers end-to-end EU Taxonomy alignment analytics for capital markets products, enabling accurate GAR/BTAR computation and SFDR Article 8/9 classification with full holding-level transparency.

**How an analyst works this module:**
- Map portfolio holdings to EU Taxonomy NACE activity codes and climate objective eligibility
- Retrieve revenue/capex/opex taxonomy alignment % from company disclosures or estimation models
- Calculate weighted fund-level alignment and GAR/BTAR metrics
- Assess SFDR Article 8/9 eligibility and generate PAI template inputs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `BOND_TYPES`, `CTB_PAB_RULES`, `CURRENCIES`, `CapitalMarketsTaxonomyPage`, `EQUITIES`, `EQUITY_TICKERS`, `FACTORS`, `GAR_COMPONENTS`, `GICS_CODES`, `GREENIUM_HISTORY`, `GSS_FRAMEWORKS`, `GssPill`, `ICMA_FRAMEWORKS`, `ISSUER_NAMES`, `Kpi`, `NACE_CODES`, `NGFS_SHOCKS`, `RATINGS`, `REG_DATAPOINTS`, `SECTORS`, `SLB_PIPELINE`, `SLB_TRACKING`, `SPO_PROVIDERS`, `TREASURY_CURVE`, `UOP_CATEGORIES`, `WATERFALL_STAGES`, `YIELD_CURVE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GSS_FRAMEWORKS` | 16 | `name`, `color`, `components`, `c`, `d` |
| `CTB_PAB_RULES` | 14 | `rule`, `ctb`, `pab` |
| `GAR_COMPONENTS` | 7 | `numerator`, `denominator`, `notes` |
| `WATERFALL_STAGES` | 6 | `value`, `delta`, `cumulative` |
| `YIELD_CURVE` | 10 | `Sovereign`, `IGConventional`, `IGGreen`, `HYConventional`, `HYGreen` |
| `REG_DATAPOINTS` | 14 | `reg`, `datapoint`, `scope`, `frequency`, `source`, `status` |
| `TREASURY_CURVE` | 10 | `rate` |
| `NGFS_SHOCKS` | 4 | `name`, `color`, `spreadShock`, `equityShock`, `vol`, `carbonShock` |
| `TABS` | 20 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB'];` |
| `BOND_TYPES` | `['Green', 'Social', 'Sustainability', 'Sustainability-Linked', 'Conventional'];` |
| `ICMA_FRAMEWORKS` | `['GBP 2021', 'SBP 2023', 'SBG 2021', 'SLB 2024', 'N/A'];` |
| `coupon` | `+(0.5 + r(i * 11) * 6).toFixed(3);` |
| `maturityYears` | `Math.floor(3 + r(i * 17) * 27);` |
| `ytm` | `+(coupon + (r(i * 23) - 0.5) * 1.5).toFixed(3);` |
| `spread` | `Math.floor(30 + r(i * 29) * 250);` |
| `gSpread` | `spread + Math.floor((r(i * 31) - 0.5) * 40);` |
| `amount` | `Math.floor(100 + r(i * 37) * 2400);` |
| `isin` | ``${currency === 'EUR' ? 'XS' : currency === 'USD' ? 'US' : currency === 'GBP' ? 'GB' : 'JP'}${String(hashStr(issuer + i)).padStart(10, '0').slice(0, 10)}`;` |
| `uop` | `type === 'Conventional' ? 'N/A' : UOP_CATEGORIES[Math.floor(r(i * 41) * UOP_CATEGORIES.length)];` |
| `framework` | `type === 'Green' ? 'GBP 2021' : type === 'Social' ? 'SBP 2023' : type === 'Sustainability' ? 'SBG 2021' : type === 'Sustainability-Linked' ? 'SLB 2024' : 'N/A';` |
| `spo` | `type === 'Conventional' ? '—' : SPO_PROVIDERS[Math.floor(r(i * 43) * SPO_PROVIDERS.length)];` |
| `cicRating` | `type === 'Conventional' ? '—' : ['Dark Green', 'Medium Green', 'Light Green', 'Dark Green', 'Medium Green'][Math.floor(r(i * 47) * 5)];` |
| `alignment` | `type === 'Conventional' ? 0 : Math.floor(40 + r(i * 53) * 58);` |
| `rating` | `RATINGS[Math.floor(r(i * 59) * RATINGS.length)];` |
| `EQUITIES` | `EQUITY_TICKERS.map((ticker, i) => {` |
| `revenue` | `Math.floor(500 + r(i * 7) * 49500);` |
| `eligibleRev` | `+(20 + r(i * 13) * 78).toFixed(1);` |
| `alignedRev` | `+(Math.max(0, eligibleRev - 15 - r(i * 19) * 20)).toFixed(1);` |
| `capexAlign` | `+(Math.max(0, alignedRev + 5 + (r(i * 23) - 0.5) * 15)).toFixed(1);` |
| `opexAlign` | `+(Math.max(0, alignedRev - 3 + (r(i * 29) - 0.5) * 12)).toFixed(1);` |
| `decarb` | `+(50 + r(i * 31) * 450).toFixed(1);` |
| `decarbTraj` | `+(decarb * (1 - (0.04 + r(i * 37) * 0.05))).toFixed(1);` |
| `mcap` | `Math.floor(revenue * (1 + r(i * 41) * 3));` |
| `_CMT_ACT_MAP` | `Object.fromEntries(EU_TAXONOMY_ACTIVITIES.map(a => [a.activity_name, a]));` |
| `month` | `new Date(2023, 0, 1); month.setMonth(month.getMonth() + i);` |
| `eur` | `+(-(2 + sr(i * 7) * 8)).toFixed(2);` |
| `usd` | `+(-(1 + sr(i * 11) * 6)).toFixed(2);` |
| `gbp` | `+(-(1.5 + sr(i * 13) * 5.5)).toFixed(2);` |
| `jpy` | `+(-(0.5 + sr(i * 17) * 3)).toFixed(2);` |
| `avg` | `+((eur + usd + gbp + jpy) / 4).toFixed(2);` |
| `kpiTypes` | `['Scope 1+2 tCO2e', 'Scope 3 tCO2e', '% Renewable Electricity', 'Water Intensity m3/t', 'Recycled Content %', 'Science-Based Target Achievement', 'Female Leadership %', 'Energy Intensity MJ/EUR', 'Circularity Rate %', 'W` |
| `baseline` | `Math.floor(40 + r(i * 19) * 120);` |
| `spt` | `Math.floor(baseline * (0.55 + r(i * 23) * 0.25));` |
| `current` | `Math.floor(spt + (baseline - spt) * (0.3 + r(i * 29) * 0.5));` |
| `stepUp` | `[25, 25, 37.5, 50, 50, 75, 75][Math.floor(r(i * 31) * 7)];` |
| `obsDate` | ``${2025 + Math.floor(r(i * 37) * 4)}-${String(Math.floor(r(i * 41) * 12) + 1).padStart(2, '0')}-${String(Math.floor(r(i * 43) * 27) + 1).padStart(2, '0')}`;` |
| `issuer` | `ISSUER_NAMES[(i + 5) % ISSUER_NAMES.length];` |
| `size` | `Math.floor(250 + r(i * 61) * 1750);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `CTB_PAB_RULES`, `CURRENCIES`, `EQUITY_TICKERS`, `FACTORS`, `GAR_COMPONENTS`, `GICS_CODES`, `GSS_FRAMEWORKS`, `ICMA_FRAMEWORKS`, `ISSUER_NAMES`, `NACE_CODES`, `NGFS_SHOCKS`, `RATINGS`, `REG_DATAPOINTS`, `SECTORS`, `SPO_PROVIDERS`, `TABS`, `TREASURY_CURVE`, `UOP_CATEGORIES`, `WATERFALL_STAGES`, `YIELD_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fund Taxonomy Alignment (Revenue) | `Σ(weight_i × turnover_alignment_i)` | EU Taxonomy company disclosures / Clarity AI | SFDR Art 9 funds target >80%; Art 8 funds typically 15-40%; regulatory minimum in PAIS template |
| Green Asset Ratio | `Taxonomy-aligned exposures / total covered assets × 100` | EBA GAR disclosure template | Banks must disclose GAR; target trajectory to 2030 set in transition plans; sector leaders >20% |
| DNSH Pass Rate | `Holdings passing all DNSH criteria / holdings screened` | MSCI ESG / Sustainalytics DNSH screening | Measures portfolio quality beyond headline alignment; low rate signals hidden ESG risks |
- **EU Taxonomy company disclosures (CSRD/NFRD)** → Revenue/capex/opex alignment % by activity → holding-level taxonomy data → **Fund-level weighted alignment metrics**
- **MSCI / Sustainalytics / Clarity AI taxonomy data** → Estimated alignment for non-disclosing companies → gap filling for portfolio coverage → **PAIS template and GAR inputs**
- **SFDR RTS templates** → Principal adverse impact indicators → Article 8/9 eligibility assessment → **Regulatory disclosure outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** EU Taxonomy Alignment Aggregation
**Headline formula:** `Fund Taxonomy Alignment = Σ(Holding Weight × Holding Taxonomy %) ; GAR = Taxonomy-Aligned Exposures / Total Covered Assets`

Weighted-average taxonomy alignment across holdings using revenue/capex/opex metrics, aggregated to fund level for disclosure

**Standards:** ['EU Taxonomy Regulation (EU) 2020/852', 'SFDR Regulation (EU) 2019/2088 + RTS (EU) 2022/1288', 'EBA Green Asset Ratio Delegated Act 2022']
**Reference documents:** European Commission (2020) EU Taxonomy Regulation (EU) 2020/852; European Commission (2022) Delegated Acts — Climate and Environmental Taxonomy; ESMA (2023) Guidelines on Funds Names Using ESG or Sustainability Factors; EBA (2022) Green Asset Ratio ITS and Reporting Templates

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DI3) claims
> `Fund Taxonomy Alignment = Σ(Holding Weight × Holding Taxonomy %)`, holding-level GAR/BTAR
> computation, and SFDR Article 8/9 eligibility assessment. **The code does not weight by holdings
> and does not assess Art 8/9**: fund-level eligible/aligned figures are *simple averages* over 40
> synthetic equities, GAR is the ratio of two hard-coded seed tables (not derived from holdings),
> BTAR is a literal string ("BTAR 8.4%"), and no Article 8/9 classification logic exists. That
> said, this is one of the platform's richest pages (20 tabs, EP-Q8 build): real EU Taxonomy
> Compass 2024 reference data partially anchors sector alignment, and the greenium-regression and
> fair-value tabs contain genuine (if simplified) econometrics. The sections below document the
> code as it behaves.

### 7.1 What the module computes

Universe: 40 synthetic bonds (5 types cycling Green/Social/Sustainability/SLB/Conventional across
40 real European issuer names) and 40 synthetic equities. Headline KPIs
(`CapitalMarketsTaxonomyPage.jsx:421-438`):

```js
GAR       = Σ GAR_COMPONENTS.numerator / Σ denominator × 100     // 38,970 / 150,150 = 25.95%
eligAvg   = mean(EQUITIES.eligibleRev);  alignedAvg = mean(EQUITIES.alignedRev)   // unweighted
greenium  = last month of GREENIUM_HISTORY.avg                    // synthetic series
naiveGreenium = mean(spread | Green∪Sustainability) − mean(spread | others)
β_green   = univariate OLS of spread on green dummy (optional sector demeaning)
SLB progress = (baseline − current) / (baseline − SPT) × 100
```

### 7.2 Parameterisation

| Block | Content | Provenance |
|---|---|---|
| Bond generator | coupon 0.5–6.5%, tenor 3–30y, spread 30–280bp, alignment 40–98% (0 for conventional), SPO provider, CICERO shade | Synthetic (`sr()` PRNG) |
| **EU Taxonomy overlay** | `taxonomyAligned` / `eligibleRevenuePct` overridden per sector from `EU_TAXONOMY_SECTOR_ELIGIBILITY` (EU Taxonomy Compass 2024 estimates); CCM/CCA activity match sets `greenBondEligible` | **Real reference data** (`data/euTaxonomyEligibility.js`) |
| `GAR_COMPONENTS` (7 rows) | e.g. NFC loans €18,420M/€68,500M; retail mortgages ("EPC ≥ A or top 15% of stock"); motor loans (Taxonomy 6.5 zero-emission) | Hard-coded demo balance sheet; category definitions faithful to EBA Art 8 DA templates |
| `CTB_PAB_RULES` (14 rows) | CTB ≥30% / PAB ≥50% intensity cut, 7% p.a. trajectory, PAB coal ≥1% / oil ≥10% / gas ≥50% / power >100 gCO₂/kWh exclusions | Accurate restatement of Delegated Regulation (EU) 2020/1818 |
| `WATERFALL_STAGES` | 100 → 62 eligible → 48 SC → 41 DNSH → 38 safeguards → 38 aligned | Hard-coded illustration of the Art 3 gating logic |
| `GREENIUM_HISTORY` (36 mo × 4 ccy) | EUR −2..−10bp, USD −1..−7, GBP −1.5..−7, JPY −0.5..−3.5 | Synthetic; sign convention (negative = greenium) is correct, magnitudes plausible vs empirical −1 to −5bp studies |
| `SLB_TRACKING` (12) | baseline, SPT = 55–80% of baseline, step-up ∈ {25, 37.5, 50, 75}bp, observation dates 2025–2028 | Synthetic; step-up menu matches ICMA SLB market practice |
| `YIELD_CURVE` / `TREASURY_CURVE` | 10 tenors, sovereign 3.05–4.25%, IG green inside IG conventional at every tenor | Hard-coded, internally consistent |
| `NGFS_SHOCKS` | Orderly +20bp/−4% eq; Disorderly +75/−14; Hot House +120/−22; Fragmented +95/−18 | Stylised NGFS-labelled shocks, uncited magnitudes |

### 7.3 Calculation walkthrough — the quantitative tabs

1. **GAR tab** — per-category `GAR_i = num_i/den_i` bars plus the aggregate; "flow-basis GAR" is
   displayed as `stock GAR × 1.12` — a cosmetic multiplier, not a computation.
2. **Greenium regression tab** — builds `green ∈ {0,1}` (Green + Sustainability), rating rank
   1–12, tenor; runs **three separate univariate OLS regressions** of spread on each regressor
   (with closed-form β, SE, t-stat, R²), then forms a "combined" prediction by adding the three
   univariate β contributions around the mean — *not* a multivariate OLS, so collinearity between
   rating and green label is unhandled (the on-page note acknowledges the FE toggle exists to
   control sector composition; demeaning by sector is implemented correctly).
3. **Relative value tab** — fair value discounts coupons + principal at
   `tsy(t) (linear interp) + OAS + 8bp option value − 5bp greenium (GSS only)`; rich/cheap =
   market price vs fair.
4. **SLB tab** — progress % and `onTrack = current ≤ SPT + 0.35×(baseline−SPT)`; a step-up
   waterfall shows coupon penalty cash flows if SPTs are missed.
5. **Stress tab** — applies `NGFS_SHOCKS` spread/equity shocks to the synthetic book.

### 7.4 Worked example (SLB progress + GAR)

SLB with `baseline = 100`, `SPT = 60`, `current = 74`, step-up 50bp on €500M:
progress = (100−74)/(100−60) = **65.0%**; on-track test: 74 ≤ 60 + 0.35×40 = 74 → **On Track**
(boundary-inclusive). If the KPI lands at 75 at observation, coupon steps up 0.50% → +€2.5M/yr.
Aggregate GAR: numerators 18,420+12,300+1,850+2,400+320+480+3,200 = **38,970**; denominators
68,500+45,200+8,100+9,500+1,850+2,400+14,600 = **150,150**; GAR = 38,970/150,150 = **25.95%** —
an order of magnitude above real disclosed bank GARs (EBA observed ~2–8% in 2024), a demo-data
artefact worth noting.

### 7.5 Data provenance & limitations

- Bond/equity metrics are synthetic (`sr(seed) = frac(sin(seed+1)×10⁴)`), attached to real issuer
  names; the EU Taxonomy Compass overlay makes *sector-level* eligibility/alignment realistic but
  issuer-level numbers remain fabricated.
- Fund alignment KPIs are unweighted means (guide claims weight × alignment aggregation); GAR is
  static seed data, not a holdings computation; BTAR and flow-GAR are decorative.
- Greenium regression is univariate-stacked, not multivariate; with N = 40 and randomly drawn
  spreads, the β_green estimate is statistically meaningless (the machinery, however, is correct
  and would work on real data).
- Fair value ignores compounding conventions, day counts, and credit curves beyond a flat OAS.

### 7.6 Framework alignment

- **EU Taxonomy Regulation 2020/852** — the waterfall reproduces the Art 3 test (eligible →
  substantial contribution → DNSH → minimum safeguards); real alignment requires activity-level
  technical screening, which the Compass overlay only approximates at sector level.
- **Art 8 Delegated Act 2021/2178 (GAR)** — GAR = taxonomy-aligned covered assets / total covered
  assets, excluding sovereigns/central banks from the denominator and non-NFRD counterparties from
  the numerator (they enter BTAR instead); the module's 7 asset categories mirror the DA's
  template rows.
- **EU 2020/1818 (CTB/PAB)** — the 14-rule table is an accurate summary (30%/50% intensity
  reduction, 7% p.a. self-decarbonisation, PAB fossil exclusions, 4× green/brown ratio).
- **ICMA GBP/SBP/SBG/SLB Principles** — framework tagging per bond type, SPO/shade fields, and the
  SLB five-component structure (KPI selection, SPT calibration, characteristics, reporting,
  verification) reflect the 2021–2024 ICMA editions.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Two production models this page implies but does not implement: (A) **look-through fund taxonomy
alignment & GAR** from actual holdings; (B) **greenium estimation** robust enough to quote as an
issuance/valuation signal. Users: fund reporting (SFDR/Art 8 DA), DCM syndicate pricing.

### 8.2 Conceptual approach
(A) mirrors the **EBA Art 8 DA reporting templates** and **Clarity AI / MSCI ESG fund look-through**
practice: holding-level alignment (reported first, estimated fallback) aggregated by weight.
(B) mirrors the **matched-pair / curve-based new-issue-premium method** used by Climate Bonds
Initiative pricing studies and AFME/ICMA greenium research, upgraded to panel regression.

### 8.3 Mathematical specification

```
(A) Align_fund^m = Σ_i w_i · a_i^m,  m ∈ {turnover, capex, opex}
    a_i = reported CSRD Art 8 KPI if available; else sector-activity estimate with flag
    GAR = Σ_i 1{covered_i} · EAD_i · a_i^turnover / Σ_i 1{covered_i} · EAD_i
    (sovereign & central-bank exposures excluded from denominator per DA)

(B) spread_b = α + γ·Green_b + β₁·rating_b + β₂·tenor_b + β₃·log(size_b)
             + β₄·liquidity_b + μ_issuer + λ_month + ε_b
    γ̂ = greenium (bps); matched-pair fallback: Δ_b = y_green − ŷ_curve(conventional, same issuer,
    interpolated to same tenor), greenium = median(Δ) with bootstrap CI
```

| Parameter | Calibration source |
|---|---|
| a_i reported | CSRD/Art 8 filings (ESAP when live); Bloomberg/Clarity AI fields |
| Sector estimates | EU Taxonomy Compass activity list (already ingested in `data/euTaxonomyEligibility.js`) |
| Coverage rules | EBA ITS on Pillar 3 ESG disclosure (2022/2453) template 7/8 definitions |
| Liquidity control | bid-ask or Bloomberg CBBT depth; TRACE/ICE for USD |
| Issuer/month fixed effects | panel of ≥ 500 EUR/USD IG bonds, ≥ 24 months (ICE or iBoxx indices) |
| Matching tolerance | same issuer, seniority, ±2y tenor (CBI pricing methodology) |

### 8.4 Data requirements
Holdings with weights and EADs (platform portfolio contexts exist); issuer alignment KPIs (vendor
or ESAP); bond terms & spreads (ICE/Bloomberg; free fallback: FINRA TRACE for USD); green labels
with ICMA framework tags (module's bond schema already carries these fields). Persist alignment
estimates with a source flag (reported / estimated / proxy) per SFDR RTS Annex disclosure rules.

### 8.5 Validation & benchmarking plan
(A) Reconcile fund alignment vs an external provider (Clarity AI/Morningstar) on a 20-fund overlap,
tolerance ±2pp; GAR unit tests against EBA worked examples. (B) γ̂ stability across specifications
(FE on/off, matched-pair vs regression) within ±2bp; backtest greenium forecasts vs realised NIP on
new issues; verify residual diagnostics (heteroskedasticity-robust SEs, no issuer clustering left).

### 8.6 Limitations & model risk
Estimated alignment for non-reporters is the dominant error source — cap estimated share of the
fund KPI and disclose it; greenium is small relative to noise (single-digit bps) so point estimates
must always ship with CIs; label integrity risk (self-labelled bonds without SPO) — restrict the
green dummy to externally reviewed instruments; GAR is highly sensitive to counterparty scoping
(NFRD/CSRD-subject test) — implement the scoping table as versioned reference data.

## 9 · Future Evolution

### 9.1 Evolution A — Holding-weighted alignment, real GAR/BTAR, and Article 8/9 logic (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide claims holding-weighted taxonomy alignment (`Σ weight_i × taxonomy%_i`), holding-level GAR/BTAR, and SFDR Article 8/9 assessment — but the code takes **simple averages** over 40 synthetic equities, GAR is the ratio of two hard-coded seed tables, BTAR is a literal string ("BTAR 8.4%"), and no Art 8/9 logic exists. That said, this is one of the platform's richest pages (20 tabs) with real EU Taxonomy Compass 2024 reference data partially anchoring sector alignment and genuine (if simplified) greenium-regression econometrics. Evolution A implements the disclosure metrics correctly.

**How.** (1) Weight by real holdings from `portfolios_pg` (position weights × per-holding turnover/capex/opex alignment) — the guide's actual formula, currently short-circuited to an unweighted mean. (2) GAR/BTAR computed from covered-asset exposures per the EBA template, not a seed-table ratio; BTAR as a computed figure, not a string. (3) Article 8/9 classification logic: apply the ESMA fund-naming and SFDR RTS thresholds (Art 9 >80% sustainable-investment target, Art 8 characteristics) as a real eligibility check. (4) Per-holding alignment sourced from company CSRD disclosures where available, with estimated-alignment gap-filling clearly flagged (MSCI/Clarity-AI-style, as the module's own lineage notes) and a DNSH pass-rate computed, not seeded. (5) Rung 3: reconcile against the real EU Taxonomy Compass activity data the page already partially uses. As a backend vertical, `POST /api/v1/capital-markets-taxonomy/align`.

**Prerequisites.** Holdings-level turnover/capex/opex alignment data (disclosure coverage is thin — non-disclosers must be flagged estimated, not silently filled); EBA GAR template logic. **Acceptance:** fund alignment is holding-weighted and changes with weights; GAR/BTAR are computed from exposures; Art 8/9 classification applies the real thresholds; estimated vs disclosed alignment is flagged per holding.

### 9.2 Evolution B — EU Taxonomy fund-classification copilot (LLM tier 2)

**What.** The module's audience (fund managers, product teams) asks "is this fund Article 9 eligible?", "what's our GAR and what drives it?", "which holdings fail DNSH?" — regulation-defined questions the copilot answers by running the Evolution-A alignment, GAR, and Art 8/9 tools, every percentage tool-traced, with failures explained against the specific Taxonomy/SFDR criterion.

**How.** Tool schemas over the Evolution-A routes; grounding corpus is this Atlas record plus the EU Taxonomy Regulation / SFDR RTS / EBA GAR references in §5 and the real Taxonomy Compass 2024 data. The copilot's honesty duty centres on estimated data: where holding alignment is model-estimated rather than disclosed, it states the coverage percentage and refuses a firm Art 9 verdict on thin disclosure — an over-stated alignment claim is the exact greenwashing exposure the taxonomy exists to prevent. The greenium-regression tab (genuine econometrics) supports "what's the pricing benefit of our green holdings?" questions with its stated simplifications disclosed.

**Prerequisites (hard).** Evolution A — a copilot issuing Art 8/9 verdicts from unweighted averages of synthetic equities and a string-literal BTAR would fabricate regulatory classifications. **Acceptance:** every alignment, GAR, and DNSH figure traces to a tool response; Art 9 verdicts state the sustainable-investment threshold and the data-coverage caveat; estimated-alignment holdings are disclosed as such.