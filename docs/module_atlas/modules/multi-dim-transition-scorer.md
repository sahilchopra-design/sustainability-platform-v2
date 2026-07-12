# Multi-Dim Transition Scorer
**Module ID:** `multi-dim-transition-scorer` · **Route:** `/multi-dim-transition-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-CD1 · **Sprint:** CD

## 1 · Overview
6-pillar multi-dimensional transition risk scorer with public and proprietary data tiers. Scores 6 companies (Shell, Vestas, BASF, RWE, Lufthansa, BlackRock) with A-E rating, news signal feed, and universe ranking.

**How an analyst works this module:**
- Select company from universe to see 6-pillar breakdown
- Toggle Public/Proprietary to see score impact of enhanced data
- Pillar Deep-Dive shows individual pillar score components
- Signal Feed shows recent news with sentiment tags
- Universe Ranking table with all pillars and peer comparison

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `PILLARS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PILLARS` | 7 | `name`, `weight`, `icon`, `color`, `desc` |
| `COMPANIES` | 25 | `name`, `sector`, `country`, `color`, `public_data`, `carbon_exposure`, `tech_readiness`, `policy_risk`, `market_dynamics`, `capital_access`, `social_license` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `weighted` | `PILLARS.reduce((sum, p) => sum + (data[p.id] ?? 0) * p.weight / 100, 0);` |
| `TABS` | `['Company Scorer', 'Pillar Deep-Dive', 'Public vs. Proprietary Delta', 'Signal Feed', 'Universe Ranking'];` |
| `radarData` | `PILLARS.map(p => ({` |
| `rankings` | `useMemo(() => COMPANIES.map(c => ({ ...c, public_score: computeScore(c, false), prop_score: computeScore(c, true), rating: scoreToRating(computeScore(c, usePropriety)), })).sort((a, b) => (usePropriety ? b.prop_score - a.prop_score : b.public_score - a.public_score)), [usePropriety]);` |
| `delta` | `company.proprietary_data[p.id] - company.public_data[p.id];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `PILLARS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Exposure | `CDP score + EVIC attribution` | CDP/PCAF | Direct and indirect carbon exposure including Scope 3 |
| Technology Readiness | `Green CapEx % + R&D ratio` | Company filings | Investment in clean technology and innovation pipeline |
| Policy Risk | `ETS exposure + regulatory compliance` | InfluenceMap | Exposure to carbon pricing and climate regulation |
| Public vs Proprietary Delta | `Prop_score - Public_score` | Internal | Difference between public data tier and enhanced proprietary scoring |

## 5 · Intermediate Transformation Logic
**Methodology:** 6-pillar weighted composite scoring
**Headline formula:** `Score = 0.22×Carbon + 0.18×Technology + 0.20×Policy + 0.18×Market + 0.12×Capital + 0.10×Social`

Six pillars: Carbon Exposure (22%), Technology Readiness (18%), Policy Risk (20%), Market Dynamics (18%), Capital Access (12%), Social License (10%). Public tier uses CDP, SBTi, Bloomberg ESG. Proprietary tier adds supply chain intelligence, facility-level data, lobbying analysis. Rating: A(≥75), B(≥60), C(≥45), D(≥30), E(<30).

**Standards:** ['CDP', 'SBTi', 'InfluenceMap', 'Bloomberg']
**Reference documents:** CDP Climate Change Questionnaire; SBTi Corporate Net-Zero Standard; InfluenceMap Climate Lobbying; Bloomberg ESG Disclosure Score

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

No guide↔code mismatch here — the code implements exactly the 6-pillar weighted composite the guide
describes, over 6 real, hand-researched named companies (not the 25 the assignment's schema summary
implied; only `COMPANIES` = Shell, Vestas, BASF, RWE, Lufthansa, BlackRock exist, and the "Universe
Ranking" tab re-ranks this same 6-company set). This is a genuinely well-curated reference module.

### 7.1 What the module computes

```js
computeScore(company, usePropriety) =
  Σ_p PILLARS[p].weight/100 × (usePropriety ? company.proprietary_data : company.public_data)[p.id]

scoreToRating(score): A(≥75) / B(≥60) / C(≥45) / D(≥30) / E(<30)
```

Each company carries **two parallel score vectors** (`public_data`, `proprietary_data`) across the
same 6 pillars, plus per-pillar `data_sources` citation lists and 2–3 `news_signals` headlines.

### 7.2 Parameterisation

| Pillar | Weight | Components (per `desc` field) |
|---|---|---|
| Carbon Exposure | 22% | Scope 1/2/3 intensity, fossil dependency, ETS coverage, carbon-price sensitivity |
| Technology Readiness | 18% | Low-carbon capex, R&D spend, patents, adoption rate, stranded-asset exposure |
| Policy & Regulatory | 20% | Jurisdiction risk, ETS exposure, carbon tax, taxonomy alignment, fines risk |
| Market Dynamics | 18% | Green revenue %, demand shift, competitor pace, supply-chain transition |
| Capital Access | 12% | Green bond issuance, ESG-linked financing, investor pressure |
| Social License | 10% | Worker transition programmes, community engagement, ILO Just Transition, stakeholder trust |

Weights sum to exactly 100. Per-company pillar scores (0–100) and their `data_sources` citations are
hand-researched and genuinely traceable — e.g. Vestas's `tech_readiness=88/90` (public/proprietary)
is footnoted "100% renewable revenue, R&D 5.2% of sales, Offshore wind leadership"; Shell's
`carbon_exposure=28/24` is footnoted "CDP 2024 A-, EVIC attribution, Scope 3 Cat 11". Public and
proprietary tiers differ by 2–8 points per pillar, consistently in the direction the company's
`data_sources` narrative implies (e.g. Shell's proprietary tier is *lower* carbon-exposure risk /
*higher* score than public, consistent with a company likely to look better on data not yet public).

### 7.3 Calculation walkthrough

1. **Company Scorer tab** — selects one of 6 companies; `score = computeScore(company, usePropriety)`;
   `rating = scoreToRating(score)`; radar chart plots both `public` and `proprietary` vectors
   simultaneously for visual delta inspection.
2. **Pillar Deep-Dive tab** — presumably drills into per-pillar `data_sources` (not shown in the read
   excerpt, but the data model supports it directly).
3. **Public vs. Proprietary Delta tab** — `delta = company.proprietary_data[p.id] − company.public_data[p.id]`
   per pillar, a real difference computation.
4. **Signal Feed tab** — renders each company's 2–3 `news_signals` headlines, presumably filterable.
5. **Universe Ranking tab** — `rankings = COMPANIES.map(c => ({...c, public_score, prop_score, rating}))
   .sort(desc by the currently active tier's score)` — genuine ranking recomputation on tier toggle.

### 7.4 Worked example

Vestas Wind Systems, `usePropriety=false` (public tier): `public_data = {carbon_exposure:82,
tech_readiness:88, policy_risk:78, market_dynamics:85, capital_access:80, social_license:82}`.

```
score = 0.22×82 + 0.18×88 + 0.20×78 + 0.18×85 + 0.12×80 + 0.10×82
      = 18.04 + 15.84 + 15.60 + 15.30 + 9.60 + 8.20
      = 82.58
```

`scoreToRating(82.58)` → **A** (≥75) — consistent with Vestas's real-world profile as a pure-play
renewables leader (SBTi-validated 2023, ITR 1.6°C — both fields present but not currently folded into
`computeScore`, see §7.6).

### 7.5 Companion analytics

- **`itr`, `sbti`, `sbti_year`** fields exist per company (e.g. Shell `itr:3.4, sbti:false`; Vestas
  `itr:1.6, sbti:true, sbti_year:2023`) but are **not weighted into `computeScore`** — they appear to
  be informational context only, based on the code reviewed.
- **Scenario selector** (`scenario` state, e.g. `'net_zero_2050'`) exists but no code path adjusting
  pillar scores by scenario was found in the reviewed sections — likely UI-only at this point.

### 7.6 Data provenance & limitations

- All 6 companies' pillar scores and citations are **hand-researched, not live-fetched** from CDP/
  SBTi/InfluenceMap/Bloomberg — genuinely well-sourced illustrative data, but static (no refresh
  mechanism visible).
- `itr` and `sbti` fields are captured but not integrated into the composite score, despite ITR being
  arguably the single most decision-relevant climate metric for a transition-risk score — a real
  methodological gap: a company with `sbti:false` and `itr:3.4°C` (Shell) scores no worse on
  `computeScore` for that fact alone than it would with `sbti:true`.
- Public vs. proprietary tiers are a genuinely useful UX pattern for demonstrating data-tier value,
  but the *magnitude* of each delta (2–8 points) is illustrative, not derived from an actual
  proprietary data product.

**Framework alignment:** CDP Climate Change Questionnaire (cited per-company, e.g. "CDP A-"/"CDP B") ·
SBTi Corporate Net-Zero Standard (tracked via `sbti`/`sbti_year` fields, not yet weighted) ·
InfluenceMap Climate Lobbying (referenced for policy-risk pillar) · Bloomberg ESG Disclosure Score
(referenced as a public-tier source) — all four correctly named and directionally reflected in the
hand-curated scores, though none are live-integrated.

## 9 · Future Evolution

### 9.1 Evolution A — Expand the 6-company universe with live-data pillars (analytics ladder: rung 1 → 3)

**What.** This is a thin but honest tier-B module: §7 confirms the 6-pillar weighted composite (`0.22×Carbon + 0.18×Tech + 0.20×Policy + 0.18×Market + 0.12×Capital + 0.10×Social`) is implemented exactly as documented, over just 6 hand-researched companies (Shell, Vestas, BASF, RWE, Lufthansa, BlackRock) — the "Universe Ranking" tab re-ranks the same 6. Evolution A builds its first backend vertical: a scorer endpoint that computes at least the Carbon Exposure pillar from real ingested data rather than hand-typed values, and widens the universe.

**How.** (1) New route `api/v1/routes/transition_scorer.py` with `POST /score` taking a company identifier; resolve via the GLEIF `entity_lei` layer, pull Scope 1/2 intensity from the OWID/CDP-derived refdata already in the platform, and compute the Carbon pillar per the documented components. (2) Keep Proprietary-tier pillars hand-curated but store them in a `transition_pillar_scores` table with `source` and `as_of` columns so the public/proprietary toggle compares data vintages honestly. (3) Preserve the existing 6 companies as pinned regression cases — their hand-researched scores become the calibration anchor for the computed pillar.

**Prerequisites.** Emissions-intensity coverage check for target universe (~50 names); the A–E rating cutoffs (75/60/45/30) must be re-validated once computed scores shift distributions. **Acceptance:** Vestas and RWE Carbon-pillar scores derive from cited emissions rows, and the composite still reproduces the documented weight formula to 2 dp.

### 9.2 Evolution B — Transition-rating copilot with pillar-cited explanations (LLM tier 1)

**What.** A copilot answering "why is RWE rated C on Public data but B on Proprietary?" strictly from the page's own structures: each company's two parallel score vectors, the per-pillar `data_sources` citation lists (§7.1 notes these are hand-researched and genuinely traceable), and the 2–3 `news_signals` headlines per company. The unusually clean provenance of this module — every pillar score carries its own citations — makes it a strong tier-1 pilot despite the small universe.

**How.** System prompt assembled from this Atlas page (§5 weights and rating bands, §7.2 pillar component table) plus the serialized `COMPANIES` array; serve through the roadmap's shared `POST /api/v1/copilot/{module_id}/ask` router with prompt caching (the corpus is static). Every rating explanation must decompose into the six weighted pillar terms and quote the relevant `data_sources` entry; the refusal path covers companies outside the 6-name universe ("this module scores 6 reference companies; use X for broader coverage") and forward-looking questions the scorer does not model.

**Prerequisites.** None hard — this is a pure tier-1 explainer over existing hand-curated data; upgrade to tool-calling only after Evolution A's `/score` endpoint exists. **Acceptance:** for each of the 6 companies, the copilot's rating explanation reproduces the exact weighted sum and cites at least one per-pillar source; queries about a 7th company refuse rather than extrapolate.