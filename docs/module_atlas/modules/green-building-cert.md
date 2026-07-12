# Green Building Certification
**Module ID:** `green-building-cert` · **Route:** `/green-building-cert` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks BREEAM, LEED, and ENERGY STAR certification status across real estate portfolio assets, computing certification-driven premium analytics and identifying gap-to-certification for uncertified assets. Supports EU Taxonomy real estate technical screening criteria alignment and SFDR PAI 18 (energy inefficient real estate) monitoring.

> **Business value:** Enables real estate portfolio managers to track green certification coverage, quantify certification-driven value premiums, and demonstrate EU Taxonomy alignment for real estate holdings. Supports SFDR PAI 18 reporting on energy-inefficient real estate and GRESB Building Certification indicator disclosure.

**How an analyst works this module:**
- Upload the real estate asset register with energy performance certificates and existing certification details.
- Review the certification gap analysis to identify assets within reach of the next certification tier.
- Use the EU Taxonomy screening tab to assess which certified assets meet technical screening criteria for real estate.
- Prioritise capex for energy efficiency upgrades based on certification premium uplift vs investment cost.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SCHEME_NAMES`, `CERT_COST_BENEFIT`, `CERT_SCHEMES`, `LS_KEY`, `PIE_COLORS`, `PIPELINE_KEY`, `PIPELINE_STATUSES`, `REGIONAL_REQUIREMENTS`, `SCHEME_EVAL`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGIONAL_REQUIREMENTS` | 11 | `mandatory`, `recommended`, `notes` |
| `CERT_COST_BENEFIT` | 16 | `estCostPerM2`, `rentPremiumPct`, `occupancyUplift`, `paybackYears` |
| `TABS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `score` | `(200 - ei) * 0.3 + (100 - ci) * 0.2 + (100 - wi * 20) * 0.1 + wd * 0.2 + rn * 0.2;` |
| `idx` | `Math.min(levels.length - 1, Math.max(0, Math.floor(score / (100 / levels.length))));` |
| `estCost` | `costBase * (prop.gfa_m2 \|\| 10000) / 1e6;` |
| `roi` | `((premium / 100) * (prop.noi_usd_mn \|\| 10)) / estCost;` |
| `payback` | `estCost / ((premium / 100) * (prop.noi_usd_mn \|\| 10)) \|\| 0;` |
| `fmt` | `(n,d=0) => n == null ? '-' : Number(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});` |
| `fmtPct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `fmtMn` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}Mn`;` |
| `badgeS` | `(bg, c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:c });` |
| `entry` | `{ ...pipeForm, id: 'PL' + Date.now().toString(36) };` |
| `now` | `new Date('2026-03-25');` |
| `exp` | `new Date(c.expiry + '-12-31');` |
| `diff` | `(exp - now) / (1000 * 60 * 60 * 24 * 365);` |
| `certGFA` | `certifiedProps.reduce((s,p) => s+p.gfa_m2, 0);` |
| `totalGFA` | `props.reduce((s,p) => s+p.gfa_m2, 0);` |
| `certGAV` | `certifiedProps.reduce((s,p) => s+p.gav_usd_mn, 0);` |
| `totalGAV` | `props.reduce((s,p) => s+p.gav_usd_mn, 0);` |
| `avgScore` | `allCerts.length > 0 ? allCerts.reduce((s,c) => s+c.score, 0) / allCerts.length : 0;` |
| `avgGreenLease` | `props.reduce((s,p) => s+p.green_lease_pct, 0) / props.length;` |
| `avgRent` | `certifiedProps.length > 0 ? certifiedProps.reduce((s,p) => s+p.rent_psf_usd, 0) / certifiedProps.length : 0;` |
| `avgRentUnc` | `uncertifiedProps.length > 0 ? uncertifiedProps.reduce((s,p) => s+p.rent_psf_usd, 0) / uncertifiedProps.length : 0;` |
| `greenPremium` | `avgRentUnc > 0 ? ((avgRent - avgRentUnc) / avgRentUnc * 100) : 0;` |
| `typeBar` | `useMemo(() => { const types = [...new Set(props.map(p => p.type))];` |
| `expiryData` | `useMemo(() => { const dir = expSortDir === 'asc' ? 1 : -1;` |
| `targetProgress` | `useMemo(() => { const totalGFA = props.reduce((s,p) => s+p.gfa_m2, 0);` |
| `currentPct` | `totalGFA > 0 ? (certGFA / totalGFA * 100) : 0;` |
| `gap` | `targetPct - currentPct;` |
| `needed` | `gap > 0 ? (gap / 100) * totalGFA : 0;` |
| `prioritized` | `[...uncertifiedProps].sort((a,b) => b.epc_score - a.epc_score).slice(0, 10);` |
| `rows` | `allCerts.map(c => [c.propId,c.propName,c.type,c.city,c.scheme,c.level,c.year,c.expiry,c.score].join(','));` |
| `blob` | `new Blob([headers.join(',') + '\n' + rows.join('\n')], { type:'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERT_COST_BENEFIT`, `PIE_COLORS`, `PIPELINE_STATUSES`, `REGIONAL_REQUIREMENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BREEAM Certified (%) | — | BRE Global certification registry | Share of portfolio floor area with valid BREEAM certification; BREEAM Excellent or Outstanding required for EU Taxonomy substantial contribution. |
| Energy Use Intensity (kWh/m²/yr) | — | REEB / Energy performance certificates | Annual energy consumption normalised by gross internal area; EU Taxonomy office threshold is 70 kWh/m²/yr primary energy. |
| Certification Premium (%) | — | JLL / CBRE Green Premium Research | Rental or capital value premium of certified vs uncertified comparable assets; BREEAM Excellent assets command 4â€“6% rental premium in major European markets. |
| ENERGY STAR Score | — | US EPA ENERGY STAR | Percentile score vs comparable US building stock; score ≥75 qualifies for ENERGY STAR certification. |
- **Energy performance certificates and meter data** → Normalise consumption by floor area, compare to BREEAM/LEED benchmarks → **EPG scores by asset**
- **BRE/USGBC certification registries** → Match portfolio assets to certification records, flag expired certificates → **Certification status by asset**
- **Comparable transaction data (JLL/CBRE)** → Regress certified vs uncertified rents controlling for location and grade → **Certification premium estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** Energy Performance Gap Score
**Headline formula:** `EPG = (EUI_actual - EUI_benchmark) / EUI_benchmark × 100`

Computes the energy use intensity gap between each asset's actual consumption and the certification benchmark, expressed as a percentage deviation. Assets with EPG above +20% are flagged for energy efficiency investment prioritisation; assets achieving EPG below -15% qualify for top-quartile certification labels (BREEAM Excellent / LEED Platinum).

**Standards:** ['BREEAM Technical Standards 2018', 'LEED v4.1 Building Operations', 'EU Taxonomy Real Estate TSC (Delegated Act)']
**Reference documents:** BREEAM Technical Standards (2018); LEED v4.1 Building Operations and Maintenance; EU Taxonomy Delegated Act â€” Real Estate Technical Screening Criteria (2021); JLL â€” Green Premium in European Real Estate (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **Energy Performance Gap
> Score** — `EPG = (EUI_actual − EUI_benchmark)/EUI_benchmark × 100`, flagging assets above +20% and
> awarding top-tier labels below −15%. **That formula does not appear in the code.** The actual
> achievability engine (`SCHEME_EVAL`) computes a *five-metric composite score* (energy, carbon, water,
> waste, renewables) and maps it linearly onto each scheme's label ladder. The module is a **portfolio
> certification tracker + scheme-recommendation calculator**, loading a real asset register from
> `localStorage` (`ra_re_portfolio_v1`) rather than seeded data. Sections below document the composite
> score as implemented; §8 specifies the production certification-readiness/EPG model.

### 7.1 What the module computes

For each property, `SCHEME_EVAL(prop)` builds one heuristic composite and reuses it across all 15
certification schemes:

```js
score = (200 − ei)·0.3 + (100 − ci)·0.2 + (100 − wi·20)·0.1 + wd·0.2 + rn·0.2
// ei = energy_intensity kWh/m²; ci = carbon_intensity kgCO2/m²; wi = water L/m²;
// wd = waste_diversion %; rn = renewable_share %
```
Then per scheme (with `levels` = that scheme's label ladder):
```js
idx      = clamp(⌊ score / (100 / levels.length) ⌋, 0, levels.length−1)   // achievable label
achievable = levels[idx]
estCost  = costBase($/m²) · gfa_m2 / 1e6                                   // $M
roi      = (premiumPct/100 · noi_usd_mn) / estCost
payback  = estCost / (premiumPct/100 · noi_usd_mn)
recommend = roi > 2.5 ? 'best' : roi > 1.0 ? 'consider' : 'not'
```

Portfolio KPIs: certified GFA/GAV coverage, average `score`, average green-lease %, and a **green rent
premium** = `(avgRent_certified − avgRent_uncertified) / avgRent_uncertified × 100`.

### 7.2 Parameterisation / scoring rubric

The composite weights and metric normalisers are **hand-chosen heuristics**, not a published rubric:

| Metric | Transform | Weight | Note |
|---|---|---|---|
| Energy intensity `ei` | `200 − ei` | 0.30 | higher score for lower EUI; caps implied at 200 kWh/m² |
| Carbon intensity `ci` | `100 − ci` | 0.20 | lower kgCO₂/m² → higher score |
| Water intensity `wi` | `100 − wi·20` | 0.10 | ×20 rescales a ~1.5 L/m² figure |
| Waste diversion `wd` | `wd` | 0.20 | % diverted, direct |
| Renewable share `rn` | `rn` | 0.20 | %, direct |

Label mapping is a **uniform linear cut** of `score` across the ladder — e.g. a 5-level scheme uses 20-pt
bands. The cost/premium/payback constants come from `CERT_COST_BENEFIT` (15 rows, e.g. LEED Platinum
$28/m², 12.5% rent premium, 5.8-yr payback), attributed in-guide to JLL/CBRE green-premium research.
`REGIONAL_REQUIREMENTS` (11 jurisdictions: EU EPC-B by 2030, UK MEES, NYC LL97, NABERS disclosure, etc.)
is a static reference table.

### 7.3 Calculation walkthrough

Real portfolio (≥30 properties) → for each property compute `score` → per scheme derive achievable label,
`estCost`, `roi`, `payback`, `recommend`. Portfolio tab aggregates certified vs total GFA/GAV, computes
the green rent premium from certified/uncertified rent means, and builds a target-progress view:
`currentPct = certGFA/totalGFA·100`, `gap = targetPct − currentPct`, `needed = gap/100 · totalGFA` (m²
to certify), with `prioritized` = uncertified assets sorted by EPC score.

### 7.4 Worked example

Property: `ei=120`, `ci=40`, `wi=1.5`, `wd=65`, `rn=20`, `gfa=20,000 m²`, `noi=$12M`.

| Term | Computation | Contribution |
|---|---|---|
| Energy | (200−120)·0.3 | 24.0 |
| Carbon | (100−40)·0.2 | 12.0 |
| Water | (100−1.5·20)·0.1 | 7.0 |
| Waste | 65·0.2 | 13.0 |
| Renewables | 20·0.2 | 4.0 |
| **score** | Σ | **60.0** |

For **LEED** (4 levels, band = 25): `idx = ⌊60/25⌋ = 2` → **Gold**. With LEED Gold `costBase=$15/m²`,
`premium=8.2%`: `estCost = 15·20000/1e6 = $0.30M`; `roi = (0.082·12)/0.30 = 3.28` (>2.5 → **'best'**);
`payback = 0.30/(0.082·12) = 0.30/0.984 = 0.30 yr`. (Note the payback here is unrealistically short
because `estCost` scales with GFA in $M while the benefit uses NOI directly — see §7.5.)

### 7.5 Data provenance & limitations

- **No seeded PRNG** — the portfolio is user-supplied via `localStorage`; if absent the page shows an
  empty/onboarding state. Metric defaults (`ei||150`, `ci||50`…) fill missing fields.
- The composite `score`, its weights, and the uniform label-cut are **ad-hoc heuristics** with no
  standards basis — a real certification prediction must model each scheme's own credit structure.
- ROI/payback conflate a per-m² retrofit cost with portfolio NOI, producing implausibly fast paybacks
  (§7.4); no discounting.
- The same `score` drives all 15 schemes identically, ignoring that BREEAM, LEED, WELL, NABERS weight
  categories very differently.

**Framework alignment:** BREEAM / LEED v4.1 / WELL / NABERS (label ladders enumerated in `CERT_SCHEMES`);
EU Taxonomy real-estate TSC and SFDR PAI 18 (energy-inefficient real estate) are the intended reporting
targets referenced in `REGIONAL_REQUIREMENTS`. Each real scheme derives its rating from a *weighted
credit tally* (e.g. BREEAM scores nine categories with regional weightings to a % that maps to
Pass→Outstanding; LEED sums points across Energy/Water/Materials to Certified→Platinum) — the module
collapses all of this into one linear cut, which §8 replaces.

## 8 · Model Specification — Building Certification-Readiness & EPG Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Predict, per asset, (a) the certification tier each scheme would award and (b) the Energy Performance Gap
vs the relevant benchmark, to prioritise retrofit capex and evidence EU Taxonomy / SFDR PAI-18 alignment.
Coverage: standing commercial/residential real-estate portfolios.

### 8.2 Conceptual approach
Two coupled models. (1) **EPG** exactly as the guide states — a normalised deviation of measured energy
use intensity from a climate- and use-adjusted benchmark, following CRREM and ENERGY STAR Portfolio
Manager's weather-normalised EUI methodology. (2) **Per-scheme credit predictor** — replicate each
scheme's own weighted category tally rather than a shared composite, mirroring how BRE (BREEAM) and USGBC
(LEED) actually score, so predicted tiers are scheme-consistent.

### 8.3 Mathematical specification
```
Weather-normalise: EUI_norm = EUI_actual · (HDD_ref + CDD_ref)/(HDD_site + CDD_site)
EPG = (EUI_norm − EUI_benchmark) / EUI_benchmark · 100                 (guide's headline)
Flag: EPG > +20 → retrofit-priority ; EPG < −15 → top-quartile candidate
Per scheme s with categories c, credits earned e_c of max m_c, weights w_{s,c}:
   Score_s = Σ_c w_{s,c} · (e_c / m_c) · 100     (Σ_c w_{s,c} = 1)
   Tier_s  = ladder_s( Score_s )                 (scheme's published % thresholds)
Taxonomy flag: EUI_norm ≤ top-15%-of-stock threshold  AND  EPC ∈ {A,B}
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EUI_benchmark` | use/geography benchmark | CBECS/ENERGY STAR, national EPC medians |
| `HDD/CDD` | degree-days | NOAA / national met services |
| `w_{s,c}` | category weights per scheme | BREEAM/LEED/NABERS technical manuals |
| ladder thresholds | %→tier cuts | scheme certification standards |
| top-15% threshold | Taxonomy DNSH | EU Taxonomy real-estate delegated act |

### 8.4 Data requirements
Per asset: metered energy by fuel, floor area, use type, location (for degree-days), EPC rating, credit
evidence per scheme category, NOI, rent. Sources: utility/BMS meters, EPC registries (free in EU), CBECS
(free, US), scheme registries (BRE/USGBC). The platform already ingests the asset register via
`localStorage` and holds the cost/premium reference table.

### 8.5 Validation & benchmarking plan
Backtest predicted tiers against actually-awarded certificates in the portfolio; reconcile EPG-flagged
assets against CRREM stranding years; sensitivity of predicted tier to ±1 credit; cross-check
weather-normalised EUI against ENERGY STAR Portfolio Manager output on shared assets.

### 8.6 Limitations & model risk
Credit-evidence data is often incomplete → predictor degrades to EPC/EUI-only proxy, flagged low
confidence. Scheme manuals change between versions (LEED v4 vs v4.1) — version the weight tables.
Benchmarks are stock-relative and drift as stock decarbonises; refresh annually. Conservative fallback:
report a predicted *tier range* when category coverage < 70%.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the Energy Performance Gap score and ground benchmarks in EPC data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's headline Energy Performance Gap score (`EPG = (EUI_actual − EUI_benchmark)/EUI_benchmark × 100`, flagging assets above +20% and awarding top labels below −15%) does not appear in the code; the actual `SCHEME_EVAL` computes a five-metric composite (energy/carbon/water/…) reused across all 15 certification schemes. A genuine strength (§7.5) is that there's no PRNG — the portfolio is user-supplied via localStorage with an honest empty state, and metric defaults fill missing fields. Evolution A implements the missing EPG score alongside the composite, and grounds the EUI benchmarks in real data: the platform's EPC (Energy Performance Certificate) feed wired in wave-1 provides actual building energy-intensity benchmarks by type/region, replacing the `ei||150` default fills with sourced figures.

**How.** (1) Add `EPG = (EUI_actual − EUI_benchmark)/EUI_benchmark × 100` with the +20%/−15% flags per §5, keeping the five-metric composite as the certification-achievability view. (2) Benchmarks from the EPC dataset by building type and climate zone rather than a flat 150 default. (3) SFDR PAI 18 (energy-inefficient real estate) monitoring computed from EPG, and EU Taxonomy real-estate TSC alignment flagged per asset.

**Prerequisites.** EPC benchmark data by building type/region (wave-1 EPC source); user-supplied portfolio (the module already handles this well). **Acceptance:** EPG computes per the §5 formula and drives the +20%/−15% flags; benchmarks come from EPC data not a flat default; PAI 18 assets are identified from computed EPG.

### 9.2 Evolution B — Certification-and-retrofit copilot (LLM tier 1 → 2)

**What.** A copilot for real-estate ESG managers: "which uncertified assets are closest to BREEAM Excellent, and what's the EPG gap I'd need to close?" narrates the certification status and five-metric composite from the atlas corpus, with tier-2 computing EPG and gap-to-certification via the Evolution A engine.

**How.** Tier 1 grounds on §5/§7 (BREEAM/LEED/ENERGY STAR schemes, the composite logic, EU Taxonomy real-estate TSC, SFDR PAI 18). Because the composite engine is real and PRNG-free, an explainer over the user's portfolio ships early. Tier 2 tool-calls the EPG/gap endpoint so "distance to certification" is computed. Every EUI and score figure validated against tool output; the copilot handles the empty-portfolio state gracefully rather than inventing assets.

**Prerequisites.** Evolution A for EPG computation and real benchmarks; corpus embedding. **Acceptance:** every EPG and gap figure traces to a tool call or rendered state; the copilot uses EPC-grounded benchmarks post-Evolution-A; with no portfolio loaded it prompts onboarding rather than fabricating data.