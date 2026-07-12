# Municipal Green Bond Analytics
**Module ID:** `municipal-green-bond` · **Route:** `/municipal-green-bond` · **Tier:** B (frontend-computed) · **EP code:** EP-DM1 · **Sprint:** DM

## 1 · Overview
Analyses municipal and sub-sovereign green bond issuance, framework quality, use-of-proceeds tracking, and impact reporting. Evaluates greenium, second-party opinion quality, and ICMA Green Bond Principles alignment for city and local government issuers.

> **Business value:** Essential for municipal bond fund managers, responsible investment officers at local governments, and city sustainability teams preparing green bond frameworks. Provides systematic ICMA GBP quality assessment and greenium analysis for pricing and relative value.

**How an analyst works this module:**
- Review municipal issuer profile and credit rating
- Assess green bond framework against ICMA GBP four pillars
- Calculate greenium vs conventional municipal yield curve
- Evaluate impact reporting quality and SDG alignment
- Generate CBI-aligned framework quality scorecard

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BONDS`, `CERT_BODIES`, `CITY_NAMES`, `KpiCard`, `RATINGS`, `REGIONS`, `TABS`, `USE_OF_PROCEEDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `RATINGS` | `['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB'];` |
| `cert` | `CERT_BODIES[Math.floor(sr(i * 7) * CERT_BODIES.length)];` |
| `rating` | `RATINGS[Math.floor(sr(i * 11) * RATINGS.length)];` |
| `year` | `2018 + Math.floor(sr(i * 13) * 7);` |
| `size` | `Math.round(50 + sr(i * 3) * 1950);` |
| `tenor` | `Math.round(5 + sr(i * 17) * 25);` |
| `greenium` | `+((sr(i * 19) - 0.5) * 24).toFixed(1);` |
| `osub` | `+(1.5 + sr(i * 23) * 8.5).toFixed(1);` |
| `projects` | `Math.round(3 + sr(i * 29) * 47);` |
| `co2` | `Math.round(10 + sr(i * 31) * 990);` |
| `jobs` | `+(0.5 + sr(i * 37) * 19.5).toFixed(1);` |
| `pop` | `+(0.1 + sr(i * 41) * 4.9).toFixed(2);` |
| `filtered` | `useMemo(() => BONDS.filter(b => (filterRegion === 'All' \|\| b.region === filterRegion) && (filterUse === 'All' \|\| b.useOfProceeds === filterUse) && (filterYear === 'All' \|\| b.year === +filterYear) && b.issuanceSize >= minSize && b.greenium >= minGreenium ), [filterRegion, filterUse, filterYear, minSize, minGreenium]);` |
| `totalVolume` | `filtered.reduce((s, b) => s + b.issuanceSize, 0);` |
| `avgGreenium` | `filtered.length ? (filtered.reduce((s, b) => s + b.greenium, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalCO2` | `filtered.reduce((s, b) => s + b.estimatedCO2Saving, 0);` |
| `totalJobs` | `filtered.reduce((s, b) => s + b.jobsCreated, 0).toFixed(1);` |
| `useData` | `USE_OF_PROCEEDS.map(u => ({` |
| `regionGreenium` | `REGIONS.map(r => ({` |
| `scatterData` | `filtered.map(b => ({ x: b.issuanceSize, y: b.estimatedCO2Saving, name: b.cityName }));` |
| `ratingData` | `[...new Set(BONDS.map(b => b.creditRating))].map(r => ({` |
| `vol` | `arr.reduce((s, b) => s + b.issuanceSize, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERT_BODIES`, `CITY_NAMES`, `RATINGS`, `REGIONS`, `TABS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| US Municipal Green Bond Market | — | BloombergNEF 2024 | US muni green bonds reached $80Bn outstanding in 2024 — transport and water largest use-of-proceeds categories |
| Typical Municipal Greenium | — | Barclays Green Bond Research 2023 | Municipal green bond yields 2–6 bps lower than conventional peer — reflects strong institutional demand |
| CBI Certification Share | — | Climate Bonds Initiative 2024 | Only 28% of municipal green bonds carry external CBI certification — quality varies in uncertified segment |
- **Municipal bond issuance data (Bloomberg, EMMA)** → Market analysis → **Green bond volume, use-of-proceeds, and greenium by sector**
- **Municipal green bond frameworks + SPO reports** → Framework quality scoring → **ICMA GBP alignment score by pillar**
- **City climate action plans + SDG commitments** → Impact alignment → **Green bond use-of-proceeds vs city climate target gap**

## 5 · Intermediate Transformation Logic
**Methodology:** Municipal Greenium Model
**Headline formula:** `MuniGreenium = YieldConventional_muni - YieldGreen_muni (same issuer, same maturity); FrameworkScore = Σ [UoPQuality + ImpactReporting + VerificationRigor + GovernanceAlignment] / 4`

Greenium for municipal bonds typically -2 to -6 bps; framework quality score assesses ICMA GBP four-pillar alignment and environmental ambition of eligible expenditure

**Standards:** ['ICMA Green Bond Principles 2021', 'Climate Bonds Initiative Municipal Green Bond Framework', 'OECD Sustainable Infrastructure Finance for Cities 2022', 'BloombergNEF Municipal GSS Bond Tracker']
**Reference documents:** ICMA Green Bond Principles 2021; Climate Bonds Initiative Municipal Green Bond Framework 2024; OECD Financing Cities for Sustainability (2022); S&P Global Green Evaluation Methodology for Municipal Bonds

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module aligns with its MODULE_GUIDES entry — a **municipal/sub-sovereign green-bond market
explorer** with use-of-proceeds tracking, greenium, and ICMA GBP framing. It is a **filter-and-aggregate
dashboard over 70 synthetic bonds**; there is no framework-scoring engine and no yield-curve greenium
computation — the "greenium" is a stored per-bond number, not a modelled spread differential.

### 7.1 What the module computes

`BONDS` seeds 70 municipal green bonds; the page filters and sums:

```js
totalVolume = Σ filtered.issuanceSize
avgGreenium = mean(filtered.greenium)
totalCO2    = Σ filtered.estimatedCO2Saving
useData     = per use-of-proceeds { volume, count }
regionGreenium = per region mean(greenium)
```

Each bond carries region, use-of-proceeds, credit rating, tenor, greenium (bps), oversubscription,
projects financed, CO₂ saving, jobs, population served.

### 7.2 Parameterisation / scoring rubric

| Field | Generator | Range | Provenance |
|---|---|---|---|
| certificationBody | `CERT_BODIES[floor(sr(i·7)·5)]` | CICERO/Sustainalytics/S&P DJI/Vigeo/ISS | Real SPO providers, random assignment |
| creditRating | `RATINGS[floor(sr(i·11)·9)]` | AAA…BBB | Synthetic |
| issuanceSize | `50 + sr(i·3)·1950` | $50M–$2.0Bn | Synthetic |
| tenor | `5 + sr(i·17)·25` | 5–30 yr | Synthetic |
| **greenium** | `sr(i·19)·12` | **0–12 bps (always positive)** | Synthetic — see limitation |
| oversubscription | `1.5 + sr(i·23)·8.5` | 1.5×–10× | Synthetic |
| estimatedCO2Saving | `10 + sr(i·31)·990` | 10–1,000 ktCO₂ | Synthetic |

Region, use-of-proceeds and city name are assigned by modular index (`i % REGIONS.length`), so the
distribution is uniform-by-construction, not market-representative.

### 7.3 Calculation walkthrough

`BONDS` is generated once at load → user filters (region / use / year / min size / min greenium) →
`filtered` subset → KPI sums (volume, avg greenium, CO₂, jobs) → per-category and per-region breakdowns
for the charts. No pricing model runs; every headline is an aggregation of stored synthetic fields.

### 7.4 Worked example (greenium KPI)

With no filters, `avgGreenium = mean over 70 bonds of sr(i·19)·12`. Since `sr()` is ~uniform on [0,1],
the expected mean greenium ≈ `0.5·12 = 6.0 bps`. This is reported as a **positive** "greenium",
implying green bonds yield 6 bps *higher* than conventional — the opposite sign of the real market, where
a greenium is conventionally the amount green bonds trade *tighter* (yield lower), i.e. −2 to −6 bps per
the guide's own Barclays citation.

### 7.5 Data provenance & limitations

- **All 70 bonds are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). Only the SPO-provider names, region and
  use-of-proceeds taxonomies are real labels.
- **Greenium sign error:** `sr()·12` is strictly non-negative, so the module can never show the negative
  greenium (green tighter) that defines the phenomenon; it treats greenium as a positive yield pickup.
- No ICMA GBP four-pillar scoring, no SPO-quality assessment, no issuer vanilla-curve construction — the
  greenium is asserted per bond, not derived from a matched conventional yield.

**Framework alignment:** **ICMA Green Bond Principles 2021** (use-of-proceeds taxonomy present as a
label) and **CBI municipal guidance** (SPO/certification bodies named). The framework-quality score and
greenium-vs-vanilla-curve methodology promised in the guide are not implemented (see §8; the companion
`municipal-green-bond-analytics` module carries the real greenium/tax-equivalency math).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module shows a positive stored "greenium"
and no framework quality score. Below is the production greenium + GBP-quality model.

### 8.1 Purpose & scope
Estimate the issuance and secondary greenium of each municipal green bond against a matched conventional
curve, and score ICMA GBP framework quality, for relative-value and impact-investment decisions.

### 8.2 Conceptual approach
Greenium via **matched-maturity yield-curve differencing** (per Barclays/BNEF green-bond research and the
ICMA methodology): build the issuer's (or peer-cohort's) conventional muni yield curve, price the green
bond off it, and take the residual. Framework quality via a **four-pillar ICMA GBP rubric** scored from the
bond's SPO and post-issuance impact report (benchmark: CBI certification criteria, S&P Green Evaluation).

### 8.3 Mathematical specification
Greenium `g = ŷ_conv(τ, rating) − y_green`, where `ŷ_conv` is the conventional-curve yield at the green
bond's tenor τ and rating, from a Nelson-Siegel fit `y(τ) = β₀ + β₁·(1−e^{−τ/λ})/(τ/λ) + β₂·((1−e^{−τ/λ})/(τ/λ) − e^{−τ/λ})`.
A positive `g` (bps) means green trades tighter. Framework score
`F = Σ_{p∈{UoP, evaluation, management, reporting}} wₚ·sₚ`, `sₚ ∈ [0,1]` from rubric checklist;
CBI-alignment gate on eligible-project taxonomy.

| Parameter | Source |
|---|---|
| Conventional curve | MMD/BVAL AAA muni scale + rating spread |
| NS params β,λ | Fit to issuer/cohort conventional bonds |
| Pillar weights wₚ | ICMA GBP (equal or reporting-weighted) |
| SPO quality sₚ | CICERO shades-of-green / Sustainalytics opinion |

### 8.4 Data requirements
Green + matched conventional muni yields (Bloomberg BVAL / MSRB EMMA), ratings, tenors, SPO documents,
post-issuance impact reports. Platform currently has none of these live — all synthetic.

### 8.5 Validation & benchmarking plan
Reconcile computed greeniums against Barclays/BNEF published muni greenium (−2 to −6 bps); backtest curve
fit RMSE; correlate framework score with CBI-certified vs uncertified segmentation.

### 8.6 Limitations & model risk
Matched-conventional bonds are scarce for small issuers (thin curve → wide CIs); greenium is confounded
with liquidity and issuer-specific demand. Conservative fallback: report greenium ranges with liquidity
adjustment, and flag bonds lacking a same-issuer conventional comparable.

## 9 · Future Evolution

### 9.1 Evolution A — Modelled greenium from real muni issuance data (analytics ladder: rung 1 → 3)

**What.** §7 is candid: this is a filter-and-aggregate dashboard over 70 synthetic bonds — there is no framework-scoring engine and no yield-curve greenium computation; the "greenium" is a stored per-bond `sr()` number, and (per §7.2) it is always positive (0–12 bps), the wrong sign convention versus the guide's own −2 to −6 bps statement in §5. Evolution A replaces the synthetic book with real municipal green-bond issuance and computes greenium as a matched-pair spread differential, the way the §5 formula actually specifies.

**How.** (1) Ingest real muni green issuance: EMMA/MSRB disclosures or the Climate Bonds Initiative certified-bond list (CBI is already the named framework) into a `muni_green_bonds` table with issuer, CUSIP-level coupon/maturity/yield-at-issue. (2) Greenium = green yield − same-issuer, nearest-maturity conventional comparator, with a match-quality flag when no clean pair exists — honest nulls over interpolated fiction. (3) Implement the §5 `FrameworkScore` (UoP quality, impact reporting, verification rigor, governance) as an explicit 4-pillar rubric with analyst-entered criterion scores stored per framework document, replacing the random `certificationBody` assignment with the actual SPO provider from disclosures.

**Prerequisites.** Data-source diligence (MSRB terms for redistribution; CBI list is public); the 70 synthetic bonds retire or get labelled `demo`. Fixing the greenium sign convention will flip headline KPIs — release note required. **Acceptance:** displayed greenium can be negative; every bond row traces to a real disclosure; matched-pair method pinned on one hand-verified issuer pair.

### 9.2 Evolution B — Framework-assessment copilot for issuers and investors (LLM tier 1 → 2)

**What.** Two grounded workflows: for investors, "explain this bond's framework quality score and its greenium versus regional peers" answered from the module's aggregations (per-region greenium means, use-of-proceeds volumes); for city issuers, a GBP-alignment assistant that walks a draft framework through the ICMA four pillars and drafts the gap list — grounded in the ICMA GBP 2021 and CBI municipal framework texts already named in §5, quoted rather than recalled.

**How.** Tier 1: corpus = this Atlas page + ICMA/CBI reference documents embedded per the roadmap's `llm_corpus_chunks` pattern; answers cite pillar definitions by section. Tier 2 (post-Evolution A): tool calls against the new bond table's query endpoints for peer statistics ("median greenium for AA water-infrastructure issuers"), with the fabrication validator matching quoted basis points to query results. Framework gap-analysis outputs are structured as the 4-pillar rubric with per-criterion citations to the submitted framework text, so a second-party-opinion analyst can verify each claim.

**Prerequisites (hard).** Evolution A before any greenium is narrated — quoting the current always-positive synthetic greenium to an investor would be exactly backwards. Tier-1 GBP interpretation can ship immediately as it relies only on standard texts. **Acceptance:** peer statistics reproduce independent SQL; framework assessments cite pillar + clause for every finding; refusal on "what will this bond price at?"