## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *flow-tracking* module
> (`Adaptation_finance = Public_bilateral + MDB_adaptation + Private_tracked`, OECD DAC data,
> $50–60B/yr vs $300–500B/yr gap analysis). **No flow-tracking logic exists in the code.** What
> is actually implemented is a *project-level investment appraisal* stack: the backend
> `AdaptationFinanceEngine` (E83) computes GFMA taxonomy alignment, resilience delta, GARI
> 6-criteria scoring, adaptation NPV/BCR/SROI, 8-facility MDB eligibility, NAP/NDC alignment,
> and a weighted composite `adaptation_score` with a bankability tier. Sections below document
> the code.

### 7.1 What the module computes

Backend engine (`backend/services/adaptation_finance_engine.py`, exposed via
`/api/v1/adaptation-finance/*`) — eight sub-modules; the composite orchestrator is:

```
adaptation_score = 0.20·GFMA_alignment + 0.30·GARI_composite + 0.25·min(100, BCR×40)
                 + 0.15·min(100, eligible_facilities×20)
                 + 0.10·(0.5·NAP_match + 0.5·NDC_alignment)
```

Bankability tier: ≥75 Highly Bankable · ≥55 Bankable · ≥35 Conditionally Bankable ·
<35 Pre-Bankable. Note `min(100, BCR×40)` means a BCR of 2.5 saturates the NPV component
(inline comment: "BCR 2.5 → 100").

### 7.2 Parameterisation

**GFMA alignment (sub-module 1):** 8 adaptation categories (water infrastructure, coastal
protection, agriculture resilience, urban heat, health systems, transport, energy, NbS), each
with a typical BCR range (e.g. NbS 5.0–15.0, coastal 4.0–11.0), primary hazards, SDG mapping
and a `gfma_ref` citation. Score heuristic: `60 base + min(8×matched_co_benefits, 30) + 10 if
description mentions a primary hazard`, capped at 100.

**GARI scoring (sub-module 3):** 6 criteria with explicit weights — Additionality 0.20,
Effectiveness 0.25, Sustainability 0.15, Scalability 0.15, Co-benefits 0.15, Governance 0.10
(cited to "GARI Framework — CPI / Global Adaptation Commission 2023"). Tiers: ≥75 Tier 1
Investment Grade, ≥55 Tier 2, else Tier 3. Text evidence is converted to a 0–100 score by
`_parse_score`: base 40, +8 per positive keyword (comprehensive/robust/quantified/verified/
approved/third-party), −10 per negative keyword (none/missing/draft/tbc).

**Resilience delta (sub-module 2):** 10 hazard profiles, each mapping adaptation measures to
risk-reduction fractions (e.g. flooding: dyke/levee 0.70, floodplain restoration 0.40, EWS
0.30; sea-level rise: managed retreat 0.90, surge barrier 0.80), plus a `residual_risk_floor`
(3–15%) and average-annual-loss %GDP by income group. RCP projections table gives intensity/
frequency multipliers and damage %GDP for 1.5C/2C/3C/4C (e.g. heat-wave frequency ×2 at 1.5°C,
×9 at 4°C — consistent with IPCC AR6 WG1 heat-extreme scaling).

**Discount rates:** context table with provenance in code — sovereign HIC 3.5% (HM Treasury
Green Book 2022), UMIC 5.0% (World Bank), LMIC 7.0% (GCF), LIC 10.0%, concessional 2.0%
(OECD DAC/GCF floor), commercial 12.0%, social 1.5% (Stern/Ramsey).

**MDB facilities:** GCF, GEF, AIIB, ADB, IADB, EIB, AFD, World Bank — with min project size,
max grant %, typical adaptation grant % and eligibility criteria; geographic screens are
hard-coded country lists (AIIB 11 Asian codes, IADB 11 LAC codes) and "developing" =
membership of the 30-country `NAP_COUNTRY_PROFILES` table (Bangladesh 82 … Somalia 35
ambition scores).

### 7.3 Calculation walkthrough

1. **Resilience delta:** `effective_rr = matched_rr × (1 − max(0,(horizon−20)/100))` (10% decay
   per decade beyond 20y); `post_risk = max(baseline×(1−effective_rr), baseline×residual_floor)`;
   maladaptation flag = High when grey infrastructure (wall/levee/dyke/dam) meets a 3C/4C
   scenario.
2. **NPV (annuity model):** `AF = (1−(1+r)^−n)/r`; `PV_benefits = annual_benefits × AF`;
   `PV_costs = investment + annual_O&M × AF`; `NPV = PV_b − PV_c`; `BCR = PV_b/PV_c`;
   `SROI = PV_b/investment`; `cost_per_beneficiary = lifecycle_cost/beneficiaries`;
   `lives_protected = PV_benefits/$50k` (explicit rough proxy); IRR via 50-iteration bisection
   on the annuity PV.
3. **MDB eligibility:** filter by min size and geography; `estimated_finance = investment ×
   min(grant_pct/100, 0.5)`; finance mix assumes a fixed 40% concessional-loan slice.
4. **Composite & portfolio:** full assessment combines the five weighted components;
   portfolio aggregation weights `adaptation_score` by investment size and sums NPV,
   beneficiaries and grant potential.

### 7.4 Worked example — adaptation NPV

Project: investment $25M, annual benefits $4M, O&M $0.4M, 20y, r = 7% (sovereign LMIC),
50,000 beneficiaries.

| Step | Computation | Result |
|---|---|---|
| Annuity factor | (1 − 1.07⁻²⁰)/0.07 | 10.594 |
| PV benefits | 4 × 10.594 | **$42.38M** |
| PV costs | 25 + 0.4 × 10.594 | **$29.24M** |
| NPV | 42.38 − 29.24 | **$13.14M** |
| BCR | 42.38 / 29.24 | **1.45** → Viable |
| SROI | 42.38 / 25 | **1.70** |
| Cost/beneficiary | 33.0M / 50,000 | **$659.50** |
| NPV component of composite | min(100, 1.45×40) = 58 → ×0.25 | **14.5 pts** |

### 7.5 Frontend page vs engine

The React page (`AdaptationFinancePage.jsx`) exposes 5 tabs matching the engine's sub-modules
and POSTs to `/gfma-alignment`, `/gari-scoring`, `/adaptation-npv`, `/full-assessment` plus
four `GET /ref/*` reference endpoints. However, its **dashboard visuals are locally seeded**,
not engine outputs: `gfmaAlignment = round(seed(101)·20+72)`, `bcrValue = (seed(102)·20+18)/10`,
`livesProtected = seed(104)·80000+40000`, hazard baseline/post-invest bars are hand-typed, and
the RCP sensitivity simply shifts post-investment scores by −5/+8/+18 points across scenarios.
`portfolioScore = (gfmaAlignment + gariComposite)/2` — a page-only formula that differs from
the engine's 5-component composite.

### 7.6 Data provenance & limitations

- All page-level KPIs and charts use the seeded PRNG `seed(s)=frac(sin(s+1)×10⁴)` — synthetic
  demo values. Engine constants (BCR ranges, risk-reduction fractions, RCP multipliers,
  ambition scores) are hand-authored, literature-plausible values with named references in
  docstrings but no machine-readable citations; treat as stylised.
- NAP profiles (30 countries, status/year/priority sectors) approximate the UNFCCC NAP
  registry as of ~2023–24 but are static snapshots.
- Simplifications vs production: flat annuity cash flows (no benefit ramp-up, climate-change
  growth in avoided losses, or hazard-frequency escalation inside the NPV); keyword-based text
  scoring for GARI evidence; MDB geographic screens are partial country lists; the
  "lives protected" $50k proxy is not an actuarial estimate; RCP multipliers are computed but
  not fed back into the resilience-delta arithmetic (they are reported alongside it).

### 7.7 Framework alignment

- **GFMA Adaptation & Resilience Finance framework (2022)** — the real GFMA/BCG report defines
  adaptation finance categories and bankability barriers; the module operationalises it as an
  8-category taxonomy with co-benefit matching.
- **GARI (Global Adaptation & Resilience Investment working group)** — an investor coalition
  whose guidance frames resilience investment quality; the 6-criteria/weights rubric here is
  the platform's structured rendering of those principles.
- **HM Treasury Green Book 2022 / EU JASPERS** — source of the social CBA structure (annuity
  discounting, 3.5% HIC sovereign rate).
- **ISO 14091:2021 / ISO 14093:2022** — vulnerability-assessment and local-adaptation-finance
  standards referenced for the resilience-delta and financing logic.
- **UNFCCC NAP / Paris Agreement Art. 7** — NAP/NDC alignment scoring (Comprehensive 85 /
  Moderate 60 / Limited 35) mirrors the NDC adaptation-component synthesis approach.
- **GCF/GEF/MDB eligibility** — facility terms (grant ceilings, concessionality) reflect
  published facility rules in stylised form.
