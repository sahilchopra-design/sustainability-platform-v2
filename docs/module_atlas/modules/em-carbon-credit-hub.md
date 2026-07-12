# EM Carbon Credit Hub
**Module ID:** `em-carbon-credit-hub` · **Route:** `/em-carbon-credit-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ3 · **Sprint:** CJ

## 1 · Overview
Emerging market carbon credits: Article 6.2 bilateral agreements, ITMO pricing, corresponding adjustments, and Africa Carbon Markets Initiative.

**How an analyst works this module:**
- EM Carbon Market Map shows country coverage
- Article 6.2 Tracker lists bilateral agreements
- ACMI shows Africa Carbon Markets Initiative pipeline

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACMI_DATA`, `BILATERAL_DEALS`, `BLENDED_FINANCE_DEALS`, `CA_STATUS`, `COLORS`, `EM_COUNTRY_PROFILES`, `EmCarbonCreditHubPage`, `ITMO_PRICING`, `JCM_PROJECTS`, `MRV_CHALLENGES`, `NDC_GAP_ANALYSIS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BILATERAL_DEALS` | 26 | `buyer`, `seller`, `sector`, `itmoVolume`, `priceUsd`, `caApplied`, `caStatus`, `mechanism`, `startYear`, `endYear`, `verifier`, `ndcSector`, `additionalityProof` |
| `ITMO_PRICING` | 13 | `minPrice`, `maxPrice`, `avgPrice`, `volume`, `trend`, `liquidityScore`, `registryCount` |
| `CA_STATUS` | 16 | `region`, `caFramework`, `creditVolume`, `registeredProjects`, `ndcTarget`, `ndcGap`, `article6Ready`, `domesticEts`, `carbonTax` |
| `MRV_CHALLENGES` | 11 | `severity`, `region`, `mitigationStatus`, `technologySolution`, `costEstimate` |
| `JCM_PROJECTS` | 16 | `hostCountry`, `partnerCountry`, `sector`, `credits`, `methodology`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `font` | `"'DM Sans','SF Pro Display',system-ui,sans-serif";` |
| `ratings` | `['BB+', 'B+', 'BBB-', 'BB', 'BB+', 'B+', 'BBB-', 'BB+', 'B', 'BB', 'B-', 'B-', 'BB-', 'B+', 'B-', 'B', 'B+', 'B+', 'B-', 'B'];` |
| `uncond` | `Math.round(15 + sr(i * 31) * 20);` |
| `cond` | `uncond + Math.round(5 + sr(i * 47) * 15);` |
| `current` | `Math.round(sr(i * 59) * uncond * 0.6);` |
| `gap` | `uncond - current;` |
| `names` | `['Africa Green Bond I', 'ACMI Catalyst Fund', 'SE Asia REDD+ Vehicle', 'LatAm Cookstove SPV', 'Pacific Blue Carbon Trust', 'Sahel Agroforestry Fund', 'MENA Solar Credit Facility', 'Congo Basin REDD+ Pool', 'India Waste-t` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |
| `totalPipeline` | `useMemo(() => BILATERAL_DEALS.reduce((s, d) => s + d.itmoVolume, 0).toFixed(1), []);` |
| `avgItmoPrice` | `useMemo(() => { const p = ITMO_PRICING; return p.length ? (p.reduce((s, x) => s + x.avgPrice, 0) / p.length).toFixed(1) : '0'; }, []);` |
| `art6Count` | `useMemo(() => BILATERAL_DEALS.filter(d => d.mechanism.startsWith('Art6')).length, []); const caAdoptionRate = useMemo(() => { const total = CA_STATUS.length; return total ? Math.round(CA_STATUS.filter(c => c.caFramework === 'yes').length / total * 100) : 0; }, []);` |
| `acmiProgress` | `useMemo(() => { const t = ACMI_DATA.targets; return t.length ? Math.round(t[0].credits / (t[t.length - 1].credits \|\| 1) * 100) : 0; }, []);` |
| `ndcGapTotal` | `useMemo(() => NDC_GAP_ANALYSIS.reduce((s, c) => s + c.gapMtCO2, 0), []);` |
| `politicalRiskPremium` | `useMemo(() => { return +(5 - governanceSlider * 0.8 + sr(governanceSlider * 17) * 1.5).toFixed(2);` |
| `countryPipelineBar` | `useMemo(() => [...EM_COUNTRY_PROFILES].sort((a, b) => b.creditPipeline - a.creditPipeline).slice(0, 15).map(c => ({ country: c.country, pipeline: c.creditPipeline })), []);` |
| `dealFlowArea` | `useMemo(() => { return [2020, 2021, 2022, 2023, 2024, 2025].map((yr, yi) => ({ year: yr, 'Art6.2': Math.round(2 + yi * 1.5 + sr(yi * 11) * 3), 'JCM': Math.round(1 + yi * 1.2 + sr(yi * 23) * 2), 'Bilateral': Math.round(0.5 + yi * 0.8 + sr(yi * 37) * 2), 'Art6.4': Math.round(sr(yi * 47) * yi * 0.8), }));` |
| `dealValueComposed` | `useMemo(() => { return filteredDeals.slice(0, 15).map(d => ({ label: `${d.buyer}-${d.seller}`.substring(0, 16), volume: d.itmoVolume, price: d.priceUsd, value: +(d.itmoVolume * d.priceUsd).toFixed(1), }));` |
| `total` | `full + partial + none;` |
| `riskScore` | `total > 0 ? Math.round((none * 90 + partial * 50 + full * 10) / total) : 50;` |
| `risk` | `Math.round(15 + sr(mi * 11 + ri * 7) * 70);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BILATERAL_DEALS`, `CA_STATUS`, `COLORS`, `ITMO_PRICING`, `JCM_PROJECTS`, `MRV_CHALLENGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Article 6.2 Deals | — | UNFCCC | Bilateral agreements tracker |
| ITMO Price Range | — | Market data | EM carbon credit pricing |

## 5 · Intermediate Transformation Logic
**Methodology:** ITMO pricing model
**Headline formula:** `ITMO_price = f(methodology, vintage, host_country_NDC_ambition)`

Article 6.2 bilateral deals enable international transfer of mitigation outcomes. Corresponding adjustments prevent double counting.

**Standards:** ['UNFCCC Article 6', 'ICROA']
**Reference documents:** UNFCCC Article 6 Decisions; ICROA Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The EM Carbon Credit Hub is an **Article 6 (Paris Agreement) carbon-market intelligence tracker**: bilateral
ITMO deals, corresponding-adjustment (CA) status, ITMO pricing by project type, NDC-gap/offset demand,
the ACMI initiative, JCM & bilateral programs, and MRV/integrity. It is data-and-aggregation driven — the
deal, pricing and CA tables are **authored realistic data** (real buyer/seller pairs, mechanisms,
verifiers), and the page computes market roll-ups over them. No guide record supplied → no mismatch flag.

### 7.1 What the module computes

The page is primarily a **structured tracker**; derived quantities are aggregations, not modelled scores:

```
Total ITMO volume       = Σ BILATERAL_DEALS.itmoVolume            (MtCO₂e)
Volume-weighted price   = Σ(vol·price) / Σ vol
CA coverage %           = deals with caApplied=true / total deals
By mechanism            = group Σ volume over {Art6.2, Art6.4, JCM, bilateral}
NDC gap / offset demand  = CA_STATUS.ndcGap aggregated by region
Integrity/MRV score     = qualitative MRV_CHALLENGES roll-up
```
`sr(s)=frac(sin(s+1)×10⁴)` is present but used only for minor chart cosmetics; the substantive tables are
hard-coded.

### 7.2 Parameterisation / data tables

| Table | Rows | Contents (real fields) |
|---|---|---|
| `BILATERAL_DEALS` | 25 | buyer/seller, sector, ITMO volume, $/t, CA status, mechanism (Art6.2/6.4/JCM/bilateral), start/end year, verifier (Gold Standard/Verra/JCM/UN Art6.4 Body), additionality proof |
| `ITMO_PRICING` | 12 | project type, min/max/avg price, volume, trend, liquidity score, registry count |
| `CA_STATUS` | 15 | country, CA framework (yes/partial/no), credit volume, projects, NDC target, NDC gap, Art6-ready, domestic ETS, carbon tax |
| `JCM_PROJECTS` | 16 | Japan Joint Crediting Mechanism projects |
| `MRV_CHALLENGES` | 11 | MRV/integrity challenge log |
| `ACMI_DATA` | — | Africa Carbon Markets Initiative targets |

Pricing bands are **plausible real-market magnitudes** (REDD+ high-integrity $15–28, Renewable Energy
$5–16, Blue Carbon $18–35, Green Hydrogen $20–40) reflecting the actual Article 6 / voluntary market
premium for high-integrity nature credits. CA status and NDC targets track real country positions
(Switzerland −50%, Singapore −36%, Japan −46%).

### 7.3 Calculation walkthrough

1. Deal, pricing and CA tables load as module constants.
2. Market-map tab aggregates volume and price by buyer/seller/mechanism.
3. Article 6.2 tracker filters deals by CA status; ITMO pricing tab charts price bands and liquidity.
4. CA deep-dive cross-tabs framework readiness vs credit volume; NDC-gap tab ranks countries by offset
   demand (`ndcGap`); MRV/integrity tab surfaces the challenge log.

### 7.4 Worked example (volume-weighted ITMO price)

Take three Switzerland deals: Peru (2.5 Mt @ $18), Ghana (1.8 @ $15), Thailand (0.8 @ $20).
```
Σ(vol·price) = 2.5·18 + 1.8·15 + 0.8·20 = 45 + 27 + 16 = 88
Σ vol        = 2.5 + 1.8 + 0.8 = 5.1
VWAP         = 88 / 5.1 = $17.25 / tCO₂e
```
CA coverage for these three = 3/3 = 100% (all caApplied=true) — i.e. all have a corresponding adjustment
applied so the host country will not also count the reduction toward its NDC (avoiding double counting).

### 7.5 Data provenance & limitations

- **Deal/pricing/CA tables are authored** to reflect the real Article 6 market (real countries, verifiers,
  mechanisms), but they are a **curated snapshot**, not a live registry feed — volumes and CA statuses are
  point-in-time illustrations.
- No modelled score or PRNG-driven risk metric drives the headline numbers; the analysis is descriptive
  aggregation.
- Pricing bands are indicative; actual ITMO prices are thinly traded and opaque.

**Framework alignment:** **Paris Agreement Article 6** — 6.2 (cooperative approaches / ITMOs with
corresponding adjustments), 6.4 (UN-supervised mechanism, the PACM successor to the CDM); **corresponding
adjustments** (host-country ledger adjustment to prevent double counting toward NDCs); **JCM** (Japan's
Joint Crediting Mechanism); **ACMI** (Africa Carbon Markets Initiative); credit-quality signalling via
**ICVCM Core Carbon Principles** and standards (**Verra VCS, Gold Standard**) named in the verifier field;
**additionality** tests (investment/technology/financial barriers, common-practice) per CDM/Article 6
additionality guidance.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (ITMO integrity & pricing model).**

### 8.1 Purpose & scope
Turn the tracker into a scored **ITMO integrity + fair-value model**: a credit-quality score per deal and
a modelled reference price, supporting buy-side Article 6 procurement and portfolio integrity screening.

### 8.2 Conceptual approach
Score each ITMO on **ICVCM CCP + corresponding-adjustment robustness + additionality strength + MRV
quality**, then model fair value as a quality-adjusted premium over a project-type base price. Benchmarks:
ICVCM CCP assessment framework, VCMI Claims Code, Gold Standard/Verra methodologies, Article 6.2 guidance.

### 8.3 Mathematical specification
```
IntegrityScore = w1·CCP_score + w2·CA_robustness + w3·additionality + w4·MRV_quality  (0–100)
   CCP_score: ICVCM 10 Core Carbon Principles assessed at programme + methodology-category level
   CA_robustness: {applied 1.0, exempt 0.7, pending 0.4, rejected 0.0}
FairPrice = basePrice(projectType) · (1 + β·(IntegrityScore−50)/50) · liquidityAdj
DoubleCountRisk = P(no valid CA) · volume
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| CCP score | — | ICVCM Core Carbon Principles assessment (programme-level) |
| Base price by type | — | ITMO_PRICING avg (this module), CDR.fyi / market data |
| Additionality | — | CDM/Art6 additionality tools |
| MRV quality | — | methodology + verifier track record |

### 8.4 Data requirements
Per-deal registry data (already tabulated), ICVCM CCP assessment outcomes, host-country NDC ledgers for CA
verification, methodology/verifier metadata. Free: ICVCM assessments, UNFCCC Art6 registry; the platform
holds the deal/pricing/CA tables.

### 8.5 Validation & benchmarking plan
Reconcile modelled fair price vs observed transaction prices; integrity score vs ICVCM CCP-labelled
credits; CA robustness vs UNFCCC corresponding-adjustment records; sensitivity of price to integrity weight.

### 8.6 Limitations & model risk
Article 6 is nascent with thin, opaque pricing and evolving CA rules; integrity scoring is judgemental.
Conservative fallback: treat pending/rejected CA as high double-count risk and discount price/volume
accordingly rather than assuming a corresponding adjustment will be granted.

## 9 · Future Evolution

### 9.1 Evolution A — From authored tracker to refreshed registry-backed dataset (analytics ladder: rung 1 → 2)

**What.** §7 classifies this correctly: a structured Article 6 intelligence tracker whose substantive tables (25 bilateral ITMO deals with real buyer/seller pairs and verifiers, 12-type ITMO pricing, 15-country CA status, JCM projects, MRV challenges) are **authored realistic data**, with honest aggregations on top (volume-weighted price, CA coverage %). The seeded parts are the NDC gap figures (`uncond = 15 + sr·20`), the deal-flow time series, and the political-risk-premium slider output. Evolution A moves the tables to the DB with source-dated refresh, and replaces the seeded derivations.

**How.** (1) Tables `em_itmo_deals`, `em_ca_status`, `em_itmo_pricing` (Alembic migration), each row carrying `source` and `as_of_date` — the authored data is good enough to seed them, but becomes maintainable and citable. Refresh path: UNEP-CCC's Article 6 Pipeline database (public CSV) as an ingester, reconciling new bilateral agreements quarterly. (2) NDC gaps from the actual NDC registry figures (Climate Watch API, free) instead of `sr()` ranges around plausible values. (3) The political-risk premium becomes a documented function of the CA-status fields already in the table (framework yes/partial/no, ETS/tax presence) rather than a slider-plus-noise, giving the page its first honest what-if (rung 2): "premium if country X adopts a CA framework."

**Prerequisites.** Source-tier decision (UNEP pipeline vs UNFCCC CDM/6.4 registry coverage differs); the seeded `dealFlowArea` chart deleted or rebuilt from deal `startYear` fields it already has. **Acceptance:** every table row displays a source and date; total pipeline volume recomputes from DB rows; zero `sr()` outside chart cosmetics.

### 9.2 Evolution B — Article 6 deal-desk copilot (LLM tier 2)

**What.** A tool-calling copilot for the questions EM carbon desks actually field: "which host countries can deliver corresponding-adjusted cookstove ITMOs above 5 Mt with Gold Standard verification, and what's the price range?" It composes filtered queries over Evolution A's deal/pricing/CA tables, cross-references CA status with the buyer's requirements, and drafts a sourcing memo — each deal cited with its registry source and as-of date, price ranges quoted from the pricing table's min/max rather than invented.

**How.** Tools: `query_deals`, `get_ca_status(country)`, `get_itmo_pricing(project_type)`, `get_ndc_gap(country)` from the new backend. Grounding corpus = this Atlas record's §7 (the aggregation definitions and mechanism taxonomy: Art6.2/6.4/JCM/bilateral) plus the MRV_CHALLENGES table for integrity caveats — the copilot attaches the relevant MRV risk to every recommended host country. The validator checks volumes/prices against tool outputs; staleness is disclosed ("CA status as of 2026-Q1").

**Prerequisites (hard).** Evolution A — recommending sourcing strategies from authored 2024-era tables presented as current would mislead a real desk; the as-of-date plumbing is what makes answers defensible. **Acceptance:** a golden sourcing query returns only deals present in the DB with correct aggregates; asking about a country absent from `em_ca_status` yields "not tracked," not an inferred CA position.