# Fixed Income ESG
**Module ID:** `fixed-income-esg` · **Route:** `/fixed-income-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates ESG factors into corporate bond portfolio construction and monitoring, capturing spread differentials attributable to ESG quality. Provides greenium analytics comparing green bond yields against matched conventional bond curves, enabling attribution of ESG alpha and risk-adjusted performance measurement.

> **Business value:** Enables fixed income portfolio managers to quantify the ESG spread premium, screen issuers by carbon intensity, and optimise allocation toward labelled green bonds without sacrificing yield targets. Supports regulatory reporting under SFDR Article 8/9 and EU Green Bond Standard alignment.

**How an analyst works this module:**
- Filter the bond universe by credit rating, sector, and ESG score threshold to define the investable set.
- Run the OAS attribution model to decompose spread by ESG, duration, and credit quality components.
- Review greenium signal tab to identify mispriced green bonds trading wider than the fitted curve.
- Use the sector heatmap to identify ESG concentration risk and rebalance toward higher-scoring issuers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COUNTRIES`, `ALL_CURRENCIES`, `ALL_RATINGS`, `ALL_SUBTYPES`, `ALL_TYPES`, `BOND_TYPES`, `BOND_TYPE_COLORS`, `CBI_SECTORS`, `ESG_TIERS`, `FRAMEWORKS`, `FixedIncomeEsgPage`, `GREEN_BOND_UNIVERSE`, `PIE_COLORS`, `SOVEREIGN_ESG`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOVEREIGN_ESG` | 24 | `score`, `climate`, `social`, `governance`, `ndgain`, `rating` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_TYPES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.type))];` |
| `ALL_CURRENCIES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.currency))];` |
| `ALL_RATINGS` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.rating))];` |
| `ALL_COUNTRIES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.country))];` |
| `ALL_SUBTYPES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.subtype))];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `items` | `fiPortfolio.map(p => ({ ...p, bond: GREEN_BOND_UNIVERSE.find(b => b.id === p.bondId) })).filter(p => p.bond);` |
| `totalNotional` | `items.reduce((s, p) => s + p.notional, 0);` |
| `wAvgEsg` | `items.reduce((s, p) => s + p.bond.esgScore * p.notional, 0) / totalNotional;` |
| `wAvgGreenium` | `items.reduce((s, p) => s + p.bond.greenium_bps * p.notional, 0) / totalNotional;` |
| `wAvgYield` | `items.reduce((s, p) => s + p.bond.yield * p.notional, 0) / totalNotional;` |
| `greenNotional` | `items.filter(p => ['Green Bond','Sovereign Green','Climate Awareness Bond','Blue Bond'].includes(p.bond.type)).reduce((s, p) => s + p.notional, 0);` |
| `slbNotional` | `items.filter(p => p.bond.type === 'SLB').reduce((s, p) => s + p.notional, 0);` |
| `socialNotional` | `items.filter(p => ['Social Bond','Sustainability Bond','Gender Bond','SDG Bond','Sovereign Sustainability'].includes(p.bond.type)).reduce((s, p) => s + p.notional, 0);` |
| `totalSizeBn` | `bonds.reduce((s, b) => s + b.size_mn, 0) / 1000;` |
| `avgGreenium` | `bonds.length ? bonds.reduce((s, b) => s + b.greenium_bps, 0) / bonds.length : 0;` |
| `avgEsg` | `bonds.length ? bonds.reduce((s, b) => s + b.esgScore, 0) / bonds.length : 0;` |
| `highestRated` | `bonds.length ? bonds.reduce((best, b) => b.esgScore > best.esgScore ? b : best, bonds[0]) : null;` |
| `cbiCertVol` | `bonds.filter(b => b.cbi_certified).reduce((s, b) => s + b.size_mn, 0) / 1000;` |
| `socialVol` | `bonds.filter(b => ['Social Bond','Sustainability Bond','Gender Bond','SDG Bond','Sovereign Sustainability'].includes(b.type)).reduce((s, b) => s + b.size_mn, 0) / 1000;` |
| `blueVol` | `bonds.filter(b => b.type === 'Blue Bond').reduce((s, b) => s + b.size_mn, 0) / 1000;` |
| `avgCoupon` | `bonds.length ? bonds.reduce((s, b) => s + b.coupon, 0) / bonds.length : 0;` |
| `currencies` | `new Set(bonds.map(b => b.currency)).size;` |
| `countries` | `new Set(bonds.map(b => b.country)).size;` |
| `avgMatYr` | `bonds.length ? bonds.reduce((s, b) => s + parseInt(b.maturity), 0) / bonds.length : 0;` |
| `yieldSpread` | `tierData.length >= 3 ? parseFloat((tierData[2].avgYield - tierData[0].avgYield).toFixed(2)) : 0;` |
| `greeniumData` | `useMemo(() => { return [...filteredBonds].sort((a, b) => a.greenium_bps - b.greenium_bps).slice(0, 30).map(b => ({ issuer: b.issuer.length > 18 ? b.issuer.slice(0, 16) + '..' : b.issuer, greenium: b.greenium_bps, type: b.type, fullIssuer: b.issuer, }));` |
| `types` | `[...new Set(filteredBonds.map(b => b.type))];` |
| `sovBarData` | `useMemo(() => SOVEREIGN_ESG.map(s => ({ country: s.country, Climate: s.climate, Social: s.social, Governance: s.governance })), []);` |
| `savingsPerMn` | `Math.abs(p.bond.greenium_bps) * 0.01 * 0.01;` |
| `combinedWaci` | `useMemo(() => { const equityWaci = equityHoldings.length > 0 ? equityHoldings.reduce((s, h) => { const c = h.company \|\| {}; return s + (c.ghg_intensity_tco2e_cr \|\| 0) * ((h.weight \|\| 0) / 100); }, 0) : null;` |
| `rows` | `fiAnalytics.items.map(p => ({` |
| `greeniumColor` | `(v) => { const abs = Math.abs(v); if (abs >= 10) return '#14532d'; if (abs >= 6) return '#166534'; if (abs >= 3) return '#22c55e'; return '#86efac'; };` |
| `scaleFactor` | `greeniumMultiplier / fiAnalytics.totalNotional;` |
| `scaledSaving` | `r.annualSaving * scaleFactor;` |
| `maxVal` | `Math.max(...Object.values(sdgMatrix.matrix).map(m => m[sdg] \|\| 0), 1);` |
| `intensity` | `val > 0 ? Math.max(0.15, val / maxVal) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_COUNTRIES`, `ALL_CURRENCIES`, `ALL_RATINGS`, `ALL_SUBTYPES`, `ALL_TYPES`, `CBI_SECTORS`, `ESG_TIERS`, `FRAMEWORKS`, `GREEN_BOND_UNIVERSE`, `PIE_COLORS`, `SOVEREIGN_ESG`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium (bps) | — | Bloomberg BVAL / ICMA | Negative greenium indicates green bonds trade richer than conventional peers; values beyond -10 bps suggest supply-demand imbalance. |
| ESG Score (issuer) | — | MSCI / Sustainalytics | Composite ESG score reflecting environmental management, social practices, and governance quality; scores above 70 associate with tighter spreads historically. |
| Carbon Intensity (tCO2e/$M revenue) | — | CDP / Issuer disclosure | Scope 1+2 intensity normalised by revenue; high-intensity issuers exhibit statistically wider spreads controlling for credit rating. |
| Green Bond Allocation (%) | — | Portfolio holdings | Share of portfolio AUM in labelled green, social, or sustainability bonds; tracks alignment with internal SRI mandates. |
- **Issuer ESG scores (MSCI/Sustainalytics)** → Normalise to 0â€“100 scale, map to ISIN universe → **ESG-adjusted OAS per bond**
- **Green bond labels (ICMA registry)** → Verify use-of-proceeds alignment, match to conventional peer → **Greenium in basis points**
- **Portfolio holdings (IBOR/ABOR)** → Compute weighted average ESG score and carbon intensity → **Portfolio-level ESG summary KPIs**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Adjusted OAS Attribution
**Headline formula:** `OAS_esg = OAS_benchmark + β_esg × ESG_score + β_dur × Duration + ε`

Decomposes option-adjusted spread into benchmark, ESG, duration, and idiosyncratic components using multivariate regression across the bond universe. The ESG beta coefficient quantifies the spread compression per unit ESG score improvement, isolating greenium from duration and credit effects.

**Standards:** ['ICMA Green Bond Principles', 'UNPRI Fixed Income Framework', 'Bloomberg BVAL']
**Reference documents:** ICMA Green Bond Principles 2021; UNPRI Fixed Income ESG Integration (2020); Larcker & Watts (2020) â€” Where's the Greenium?; ECB Working Paper: Green Bond Premium (2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an *ESG-Adjusted OAS Attribution* regression
> (`OAS_esg = OAS_benchmark + β_esg·ESG_score + β_dur·Duration + ε`). **No regression is estimated.**
> There is no OAS attribution, no β coefficients, no duration term. The **greenium is a stored
> per-bond field** (`greenium_bps`), and the portfolio outputs are notional-weighted averages over a
> curated ~80-bond universe. The sections below document the aggregation the code actually performs.

### 7.1 What the module computes

Over a labelled-bond universe (green/social/sustainability/SLB/transition/blue/sovereign, ~80 bonds)
plus a 24-country sovereign-ESG table, the page computes portfolio notional-weighted analytics:

```js
wAvgEsg      = Σ(esgScore_b × notional_b) / Σ notional_b
wAvgGreenium = Σ(greenium_bps_b × notional_b) / Σ notional_b
wAvgYield    = Σ(yield_b × notional_b) / Σ notional_b
greenSharePct= greenNotional / totalNotional × 100
yieldSpread  = tier3.avgYield − tier1.avgYield            // rating-tier yield gap
annualSaving = notional × |greenium_bps|·0.01·0.01 × 1e6  // greenium coupon saving
```

The **greenium** (green bonds pricing at a lower yield than matched conventional curves) is *not
estimated* — each bond carries a hand-set `greenium_bps` (e.g. World Bank IBRD −15 bps, France OAT
Verte −8 bps). Portfolio greenium is just the notional-weighted mean of these.

### 7.2 Parameterisation / scoring rubric — the bond universe

| Attribute | Source in code | Example |
|---|---|---|
| type (11 categories) | ICMA/CBI taxonomy | Green, Social, SLB, Transition, Blue, Sovereign Green |
| esgScore (0–100) | curated per issuer | Apple 76, PEMEX 32, World Bank 95 |
| greenium_bps | curated per bond | −1 to −15 bps (tighter for AAA/MDB) |
| yield, coupon, maturity, size_mn, rating, currency | curated | e.g. Germany Green Bund 0.00% 2031 AAA |
| framework / spo | ICMA GBP/SBP/SLBP, CBI, EU GBS; SPO provider | Sustainalytics, CICERO, Vigeo Eiris |
| sdgs, cbi_sector, frameworks_compliance | curated tags | — |

The 11 bond types map exactly to the ICMA Principles + CBI taxonomy. The **sovereign-ESG table**
(`SOVEREIGN_ESG`, 24 countries) carries E/S/G sub-scores, ND-GAIN, and rating — e.g. Germany
score 90 (E88/S92/G91, ND-GAIN 72.0, AAA). All are curated demo figures (realistic, no PRNG).

The greenium pattern is methodologically sound: MDB/AAA issuers (World Bank −15, EIB −12) show the
largest greenium, high-yield/EM issuers (PEMEX −1, Egypt −2) the smallest — consistent with the
empirical finding that greenium widens with credit quality and issuer scarcity.

### 7.3 Calculation walkthrough

1. Build portfolio `items` (bond × notional); filter by type/currency/rating/country/subtype.
2. `fiAnalytics`: notional-weighted ESG, greenium, yield; green/social/SLB notional splits.
3. Rating-tier grouping → `tierData`; `yieldSpread` = tier-3 minus tier-1 average yield.
4. `greeniumData`: 30 tightest-greenium bonds (sorted ascending greenium_bps).
5. `annualSaving`: per-bond coupon saving from the greenium; sovereign bar data; combined equity+FI WACI.

### 7.4 Worked example (portfolio greenium & saving)

A 3-bond portfolio: World Bank IBRD ($100M, −15 bps), France OAT Verte ($200M, −8 bps),
PEMEX SLB ($50M, −1 bps):
```
totalNotional  = 350
wAvgGreenium   = (−15·100 + −8·200 + −1·50) / 350 = (−1500 −1600 −50)/350 = −9.0 bps
```
Annual coupon saving on the World Bank tranche:
`saving = 100 × (|−15|·0.01·0.01) × 1e6 = 100 × 0.0015 × 1e6 = $150,000` (i.e. 15 bps × $100M).
So the −9.0 bps portfolio greenium translates into a modest but real funding-cost advantage — the
metric the ICMA/CBI market cites as the "green premium".

### 7.5 Companion analytics

- **Rating-tier yield spread** — proxies the credit-quality slope across the labelled universe.
- **Greenium ranking** — the 30 tightest bonds, dominated by MDBs and AAA sovereigns.
- **Combined WACI** — merges equity holdings' carbon intensity with the FI book's weighted ESG (note:
  the FI "WACI" here is actually the weighted ESG score, not a tCO₂e/$M intensity — a labelling quirk).
- **Sovereign-ESG** — country E/S/G scores for sovereign-bond context.

### 7.6 Data provenance & limitations

- **Curated demo data** — realistic named bonds and greeniums, but not a live pricing feed; no PRNG.
- **Greenium is stored, not estimated** — the guide's OAS regression (the actual way greenium is
  isolated in practice, by matching to a conventional issuer curve and regressing residual spread on
  ESG) is entirely absent.
- The "FI WACI" is a mislabelled weighted-ESG; no financed-emissions intensity is computed here.
- No option-adjusted spread, no duration, no matched-curve construction.

**Framework alignment:** ICMA Green/Social/Sustainability Bond Principles + Sustainability-Linked Bond
Principles (the 11 type taxonomy) · Climate Bonds Initiative Standard + sector taxonomy (cbi_sector,
certification) · EU Green Bond Standard (frameworks_compliance) · ND-GAIN (sovereign adaptation score).
The greenium concept is the ICMA/CBI market metric; a production implementation would estimate it via
matched-maturity conventional-bond spread differentials.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The greenium is hand-set per bond; the guide's
OAS-attribution regression is the missing model. Below is the production greenium/ESG-spread model.

### 8.1 Purpose & scope
Estimate the ESG/green premium (greenium) in bond spreads and attribute portfolio option-adjusted
spread to ESG quality, controlling for credit, duration, sector and liquidity — for relative-value and
green-bond issuance decisions.

### 8.2 Conceptual approach
A **panel fixed-effects OAS regression** (matched green-vs-conventional twin bonds where available,
else curve-residual) benchmarked against **Barclays/MSCI green-bond index research** and
**Bloomberg BVAL** greenium studies, plus a **matched-pair estimator** (the twin-bond method used for
Germany's green Bund) as the gold-standard identification.

### 8.3 Mathematical specification
```
OAS_b = α + β_ESG·ESGscore_b + β_D·Duration_b + β_R·RatingNotch_b
        + β_sector·Sector_b + β_liq·log(IssueSize_b) + γ_issuer + ε_b
Greenium_b = OAS_conventional-curve(rating,dur,ccy) − OAS_b        (matched-curve residual)
Twin greenium = yield_green,twin − yield_conventional,twin          (cleanest identification)
Portfolio greenium = Σ w_b · Greenium_b ,  w_b = notional_b / Σnotional
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| β_ESG | spread sensitivity to ESG | estimated on panel; MSCI/Barclays priors |
| conventional curve | rating×duration×ccy spread | Bloomberg BVAL / ICE curves |
| RatingNotch | numeric rating | S&P/Moody's scale |
| γ_issuer | issuer fixed effect | panel estimation |

### 8.4 Data requirements
Per bond: OAS/yield time series, rating, duration, sector, issue size, ESG score, green-label flag,
twin-bond identifier where it exists. Sources: Bloomberg/ICE (OAS, curves), MSCI/Sustainalytics (ESG),
CBI database (labels). Curated universe here provides the static attributes.

### 8.5 Validation & benchmarking plan
Reconcile estimated greenium against published twin-bond spreads (Germany, Netherlands) and against
Barclays/MSCI index greenium (target ±3 bps); out-of-sample test on new issues; check β_ESG stability
across rating buckets and time.

### 8.6 Limitations & model risk
Greenium is small and time-varying; matched-curve residuals confound liquidity; twin bonds are rare.
Conservative fallback: report the twin-bond greenium where available and a wide confidence band on the
regression-based estimate elsewhere; never present a single point greenium without an interval.

## 9 · Future Evolution

### 9.1 Evolution A — Estimate greenium from matched conventional curves (analytics ladder: rung 1 → 2)

**What.** §7 flags the core gap: the guide describes an ESG-adjusted OAS attribution regression (`OAS_esg = OAS_benchmark + β_esg·ESG_score + β_dur·Duration + ε`), but no regression is estimated — the greenium is a stored per-bond field (`greenium_bps`) over a curated ~80-bond universe, and the "FI WACI" is a mislabelled weighted-ESG average. Evolution A implements the way greenium is actually isolated: match each labelled green bond to a conventional issuer curve of the same rating/currency/maturity and regress the residual spread on ESG score and duration, producing a real β_esg and a fitted-vs-actual greenium so mispriced bonds surface from computation, not storage.

**How.** (1) Backend route running the matched-curve construction and multivariate OLS (statsmodels, already in the environment per the roadmap) over the bond universe. (2) The greenium-signal tab reads fitted residuals (`actual OAS − curve-implied`) instead of the stored `greenium_bps`, so "trades wider than the curve" becomes a computed claim. (3) Relabel the WACI card honestly, or wire it to real issuer GHG intensity via the platform's company master (the `combinedWaci` code already reaches for `ghg_intensity_tco2e_cr`).

**Prerequisites.** A conventional-bond reference curve source (even a curated matched set to start); the stored `greenium_bps` demoted to a fallback, not the headline. **Acceptance:** β_esg is estimated with a reported R²/standard error; a bond flagged mispriced shows its curve-implied vs actual spread; the WACI card no longer mislabels weighted-ESG as emissions intensity.

### 9.2 Evolution B — Green-bond desk copilot (LLM tier 1 → 2)

**What.** A copilot for fixed-income PMs: "which green bonds in my universe screen cheap after adjusting for duration and rating, and what's the ESG spread pickup?" Tier-1 narrates the portfolio notional-weighted analytics (wAvgEsg, wAvgGreenium, green/social/SLB share) and the ICMA/CBI framework taxonomy from the atlas corpus; tier-2 runs the Evolution A regression endpoint to answer relative-value questions with fitted greeniums.

**How.** Tier 1 grounds on §5/§7 — the module accurately encodes the ICMA GBP/SBP/SLB taxonomy (11 types), CBI certification, EU GBS frameworks, and ND-GAIN sovereign scores, so the copilot explains labelling and eligibility credibly. Its guardrail: pre-Evolution-A it must state that greeniums are stored demo values, not estimated, and refuse "is this bond mispriced" as a quantitative claim. Tier 2 upgrades those to regression-backed answers with the fabrication validator checking every basis-point figure against tool output.

**Prerequisites.** Evolution A for relative-value claims; corpus embedding; per-module tool allowlist. **Acceptance:** SFDR/taxonomy classification answers cite the specific framework field relied on; a mispricing claim post-Evolution-A carries the fitted-vs-actual spread from a logged regression call, and pre-Evolution-A is refused.