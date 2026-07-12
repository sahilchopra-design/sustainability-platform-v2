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
