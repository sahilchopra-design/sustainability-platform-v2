## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a composite
> `CRI = 0.40×(100−CPI) + 0.30×Controversy + 0.20×Enforcement + 0.10×ABMS_maturity`. **No such
> composite exists in the code.** Company `corruptionRisk` is a direct PRNG draw, the country
> `cpi` field is random (not Transparency International data), there is no controversy feed, no
> ABMS/ISO 37001 maturity scoring, and enforcement fines are never normalised by revenue or folded
> into a score. The module is a *screening dashboard over three seeded/curated tables* — its one
> genuinely valuable dataset is a 30-case enforcement table of **real historical FCPA/UKBA
> settlements with accurate fines**. The sections below document the code as shipped.

### 7.1 What the module computes

Three module-level datasets, built once with `sr(s) = frac(sin(s+1)×10⁴)`:

- **`COMPANIES` (80 rows)** — real company names (Siemens, Glencore, Airbus, Petrobras …) with
  hand-assigned sector/region and 13 random metrics:
  `corruptionRisk = round(15 + sr(i·7)·75)` (15–90), `fcpaCompliance = round(40 + sr(i·11)·55)`,
  `ukBriberyAct`, `pepExposure`, `countryRisk`, `thirdPartyRisk`, `giftEntertainment`,
  `whistleblower`, `trainingRate`, `dueDialCoverage` (sic — due-diligence coverage),
  `fineHistory` (0–2000 $M), `enforcementActions` (0–7), `controlEffectiveness`. The
  `riskRating` label re-uses the *same* seed as `corruptionRisk`:
  `sr(i·7) < 0.15 → Critical, < 0.35 → Very High, < 0.55 → High, < 0.75 → Elevated, < 0.9 →
  Moderate, else Low` — so rating and score are consistent by construction.
- **`COUNTRIES` (50 rows)** — high-risk jurisdictions (Venezuela → Zimbabwe) with random
  `cpi = round(10 + sr(i·7)·55)` and 10 further governance scores (bribery, procurement, judicial
  independence, press freedom, rule of law, PEP risk, money laundering …); `rating` again derives
  from the `sr(i·7)` seed so it tracks the CPI draw.
- **`ENFORCEMENT` (30 rows, hand-curated, real)** — landmark cases with law, jurisdiction, fine
  ($M), disposition and year: Airbus (Sapin II/FCPA, $4,000M, 2020), BNP Paribas (Sanctions,
  $8,900M, 2014), Odebrecht (Lava Jato, $3,500M, 2016), Goldman/1MDB ($2,900M, 2020),
  HSBC AML ($1,900M, 2012), Siemens ($1,600M, 2008), Glencore ($1,500M, 2022), etc. These match
  public DOJ/SEC/SFO records. Random fields are appended per case (monitor duration 1–4 yrs,
  compliance-reform flag, recidivism, investigation length).
- **`TREND` (36 months)** — random monthly enforcement actions/fines/investigations/convictions.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Risk-rating cutpoints | 0.15/0.35/0.55/0.75/0.90 on the uniform seed | Synthetic — implies 15 % Critical, 20 % Very High, 20 % High, 20 % Elevated, 15 % Moderate, 10 % Low |
| Company score ranges | risk 15–90, FCPA compliance 40–95, training 40–98, control effectiveness 25–95 | Synthetic demo ranges |
| Country CPI range | 10–65 | Random; real TI CPI for these countries runs ≈ 13 (Venezuela/Syria) to ≈ 43 (South Africa) — the range is plausible, the values are not real |
| Enforcement fines | 30 hardcoded $M values | **Real public settlement amounts** (verifiable against DOJ/SEC releases) |
| Page size | 15 rows per table | UI constant |

### 7.3 Calculation walkthrough

1. **Dashboard KPIs** — `avgRisk`, `avgFcpa`, `avgTraining` are simple means over 80 companies;
   `critical` counts Critical + Very High ratings; `totalFines = Σ fine` over the 30 cases
   (= $34.9Bn+, displayed via `fmt(kpis.totalFines×1e6)`).
2. **Charts** — sector bar (mean risk + count per sector), risk-rating donut, region bar (mean
   risk & FCPA per region), a 6-dimension compliance radar (means of fcpaCompliance, ukBriberyAct,
   trainingRate, dueDialCoverage, controlEffectiveness, thirdPartyRisk), fines-by-year aggregation
   of the enforcement table, and the 36-month random trend.
3. **Company Screening tab** — search + sector/region/risk-level filters, sortable columns
   (spread-before-sort `[...COMPANIES]`, so no mutation), paginated 15/page, expandable rows.
4. **Country Risk tab** — searchable/sortable country table (default sort: CPI ascending = worst
   first).
5. **Enforcement Cases tab** — searchable by company or law, default sorted by fine descending;
   expandable case detail with the appended monitor/reform fields.
6. **CSV export** — generic serialiser for any of the three tables.

### 7.4 Worked example (company i = 0, GlobalBank Holdings)

| Step | Computation | Result |
|---|---|---|
| Seed | `sr(0) = frac(sin(1)·10⁴)` | 0.8415 |
| corruptionRisk | `round(15 + 0.8415·75)` | **78** |
| riskRating | 0.8415 ∈ [0.75, 0.90) | **Moderate** |
| fcpaCompliance | `round(40 + sr(0)·55)` (seed `0·11 = 0` collides) | **86** |
| Dashboard contribution | 78 enters `avgRisk`; "Moderate" not counted in `critical` | — |

Note the interpretive quirk: a 78/100 corruption risk draws the *Moderate* label because rating
follows the seed's uniform position, not published thresholds — at i = 0 every `i·k` seed
collapses to `sr(0)`, correlating all of this company's metrics.

### 7.5 Data provenance & limitations

- **Company and country scores are synthetic** (`sr()` draws on real names); no TI CPI, World Bank
  CPIA/WGI, or RepRisk data is loaded despite the guide citing them. Screening a real portfolio is
  therefore illustrative only.
- **The enforcement table is real, hand-curated public data** — the most defensible content in the
  module — though the appended monitor/recidivism fields are random.
- No composite CRI, no revenue normalisation of fines, no controversy ingestion, no ISO 37001
  control-level assessment; the radar shows means of random inputs.
- Country list covers only high-risk jurisdictions (no OECD baseline), so regional comparisons
  are one-sided.
- No backend; tables are frozen at module load.

### 7.6 Framework alignment

- **Transparency International CPI** — the real index aggregates 13 expert surveys into a 0–100
  perceived-corruption score (higher = cleaner), rescaled and averaged with standard-error
  bounds. The module's `cpi` mimics the scale only.
- **FCPA / UK Bribery Act** — the enforcement table correctly reflects the two regimes' landmark
  outcomes and disposition types (DPA, guilty plea, settlement); UKBA §7's "failure to prevent"
  corporate offence is why compliance-programme scores matter in practice.
- **ISO 37001:2016 (ABMS)** — the guide's maturity scoring concept (leadership, risk assessment,
  due diligence, controls, monitoring clauses 4–10) is unimplemented; `trainingRate`,
  `dueDialCoverage` and `controlEffectiveness` are the placeholder columns for it.
- **UNGC Principle 10** — "businesses should work against corruption in all its forms" — the
  module's screening framing aligns, without any policy-content checks.
