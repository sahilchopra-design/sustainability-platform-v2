## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's stated formula —
> `JTIS_r = α×JobLoss_r + β×WageGap_r + γ×CommunityIncome_r`, driven by "ILO sector employment
> multipliers applied to planned coal/oil/gas capacity retirements" and "IRENA regional coefficient
> tables" — **does not exist in the code**. There is no job-loss/wage-gap/community-income regression,
> no ILO employment multiplier, and no IRENA coefficient table. What the code actually implements is
> a **fixed, hand-curated 20-country dataset** scored on a 5-dimension ILO-styled composite (Worker
> Protection, Community Resilience, Distributional Equity, Developing Nation Support, Social
> Dialogue), plus a portfolio-exposure mapper. Despite the assignment record listing
> `backend/services/just_transition_engine.py` and 8 live API routes as this module's engine, **the
> frontend makes zero API calls** — the real backend engine exists in the codebase but is not invoked
> anywhere on this page. Sections below document the code as it actually behaves.

### 7.1 What the module computes

`COUNTRY_JT_SCORES` is a static array of 20 countries, each with a hand-set `composite` score that
**is** internally consistent with the declared dimension weights — i.e. the numbers were authored to
satisfy the formula even though the formula is never evaluated live in code:

```
composite ≈ 0.25·workers + 0.25·communities + 0.20·equity + 0.15·developing + 0.15·governance
```
Verification (Germany): `0.25×78 + 0.25×72 + 0.20×70 + 0.15×65 + 0.15×82 = 73.55 ≈ 74` ✓.
Verification (US): `0.25×62 + 0.25×58 + 0.20×55 + 0.15×45 + 0.15×60 = 56.75 ≈ 57` ✓.

Each country also carries 9 supporting fields (coal workers affected, transition fund $Bn,
retraining program flag, social dialogue flag, energy poverty %, JT plan flag, union density %,
green jobs created, avg retraining months, community investment $Bn) that are independently authored
per country (plausible, directionally consistent with each country's real coal dependency — e.g.
China 2.5M coal workers, South Africa 92,000, Norway 500 — but not sourced to a cited dataset in the
code).

### 7.2 Parameterisation

| Dimension | Weight | Indicators (descriptive only, not separately scored) |
|---|---|---|
| Worker Protection | 25% | Retraining, severance, early retirement, skill transfer, safety nets |
| Community Resilience | 25% | Economic diversification, infrastructure, social services, engagement, culture |
| Distributional Equity | 20% | Energy affordability, clean-energy access, progressive carbon pricing, vulnerable-group protection |
| Developing Nation Support | 15% | Climate finance flows, tech transfer, capacity building, debt-for-nature swaps |
| Social Dialogue | 15% | Tripartite consultation, union involvement, stakeholder engagement, transparent planning |

| Field | Provenance |
|---|---|
| 20-country composite + 5 dimension sub-scores | Hand-authored, internally consistent with the weighted formula; not derived from a cited index |
| `coal_workers_affected`, `transition_fund_bn` | Plausible, order-of-magnitude consistent with real JETP/EU JTF figures, but not sourced inline |
| `TRANSITION_FUNDS` (10 funds) | Real named funds (EU JTF €17.5Bn is actually correct; US IRA $60Bn community provisions; SA JET $8.5Bn; Germany Coal Exit €40Bn — figures are directionally accurate) |
| Portfolio exposure fallback | `Math.round(30 + seed(i+77)×50)` when a holding's country can't be matched to `COUNTRY_JT_SCORES` — synthetic demo value |

### 7.3 Calculation walkthrough

- **KPI cards** — simple aggregates over the 20-country array: `avgJTScore = mean(composite)`,
  `countriesWithPlans = count(just_transition_plan)`, `totalTransitionFunds = Σ transition_fund_bn`,
  `totalWorkersAffected = Σ coal_workers_affected`, `retrainingCoverage = count(retraining_programs)
  / 20 × 100`, `avgEnergyPoverty = mean(energy_poverty_pct)`, `avgSocialDialogue =
  mean(governance)`, `devNationFinanceGap = 100 − mean(developing) for {IN,ID,ZA,BR,MX}`.
- **Radar (single country)** — plots the 5 dimension sub-scores for the selected `iso2`.
- **Comparison radar (2–3 countries)** — same 5 dimensions overlaid for up to 3 selected countries.
- **Scatter (Workers vs Fund)** — `x = log10(max(coal_workers_affected,1))`, `y =
  transition_fund_bn`, bubble size/colour keyed to `composite` — a log transform is used because
  worker counts span 3 orders of magnitude (200 in Sweden to 3.8M in India); no regression line or
  correlation coefficient is computed, purely a scatter render.
- **Energy Poverty threshold filter** — slider 0–100 maps to a 0–10% threshold
  (`energyPovertySlider/10`), filtering countries whose `energy_poverty_pct` exceeds it.
- **Portfolio & Social Dialogue tab** — `portfolioJTExposure` maps each portfolio holding (from
  `localStorage: ra_portfolio_v1`) to a country via `GLOBAL_COMPANY_MASTER`, then looks up that
  country's `composite` as the holding's "JT exposure score"; unmatched holdings get a seeded-random
  fallback (`30 + seed(i+77)×50`, i.e. 30–80).

### 7.4 Worked example

South Africa: `workers=35, communities=32, equity=28, developing=60, governance=42`.
`composite = 0.25×35 + 0.25×32 + 0.20×28 + 0.15×60 + 0.15×42 = 8.75+8+5.6+9+6.3 = 37.65 ≈ 37` — matches
the stored value exactly. With `coal_workers_affected=92,000` and `transition_fund_bn=8.5`, the
scatter point sits at `x=log10(92000)=4.96`, `y=8.5`, coloured red (`composite<40`) — visually flagging
South Africa as a country with a large affected workforce, meaningful pledged finance, but a weak
composite JT score, consistent with the real-world JETP implementation delay narrative (though that
narrative is not itself computed — it's a coincidence of the authored numbers).

### 7.5 Companion analytics

- **Developing Nation Support Gap cards** (India, Indonesia, South Africa, Brazil, Mexico, Chile) —
  same `developing` sub-score rendered as a progress bar per country, plus the associated fund size
  and energy-poverty badge.
- **Retraining Investment vs Workers Affected** — top-12 countries by `coal_workers_affected`,
  grouped bar of workers (K), fund ($Bn), and green jobs created (K) — a juxtaposition, not a ratio
  or regression.

### 7.6 Data provenance & limitations

- **The 20-country dataset is hand-authored, not seeded-random** (unlike most sibling modules) — a
  meaningful distinction: the numbers are static demo data with no `sr()`/PRNG call in the country
  table, though the portfolio-mapping fallback does use the platform's `seed()` PRNG for unmatched
  holdings. No citation is embedded in code tying any country's score to a real ILO, IRENA, or CPI
  dataset, so all figures should be treated as illustrative until validated against source data.
- **The real backend engine is orphaned from this page.** `backend/services/just_transition_engine.py`
  and its 8 documented routes (`/assess`, `/cif-eligibility`, `/community-resilience`,
  `/eu-jtf-eligibility`, plus 4 `ref/*` endpoints) exist in the codebase and are presumably used by
  the sibling `just-transition-adaptation` module or DME integrations, but `JustTransitionPage.jsx`
  makes no `axios`/`fetch` call at all — every number the user sees here comes from the static
  in-file array, not from the engine.
- `TRANSITION_FUNDS` figures are directionally correct for well-known named programmes but are not
  live-updated (e.g. India JT Task Force $5Bn is dated 2024 and may already be stale).

**Framework alignment:** ILO Guidelines for a Just Transition (2015) — the 5-dimension structure
(worker/community/equity/developing-nation/governance) is a reasonable operationalisation of ILO's
7 policy areas, though condensed and re-weighted by the module's authors rather than drawn from an
ILO-published composite index. IRENA World Energy Transitions Outlook and CPI Just Transition Finance
Landscape are cited in the guide as data sources but are not ingested. JETP/EU JTF figures in
`TRANSITION_FUNDS` are the module's most defensible real-world anchor points.
