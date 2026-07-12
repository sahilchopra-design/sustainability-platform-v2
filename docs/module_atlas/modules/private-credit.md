# Private Credit
**Module ID:** `private-credit` · **Route:** `/private-credit` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG and climate integration framework for private credit origination, covering borrower ESG assessment, covenant design, and sustainability-linked loan pricing.

> **Business value:** Embeds ESG and climate risk assessment into private credit origination workflows, supporting SLL structuring and PCAF-aligned financed emissions reporting.

**How an analyst works this module:**
- Screen new deal for ESG and climate red flags.
- Score borrower ESG profile via DD questionnaire.
- Structure SLL KPI targets and margin step mechanism.
- Monitor ongoing KPI compliance and trigger margin adjustments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_PORTFOLIO_INIT`, `ESG_TIER_COLORS`, `LMA_PRINCIPLES`, `LS_KEY`, `PIE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CREDIT_PORTFOLIO_INIT` | 16 | `borrower`, `sector`, `facility_type`, `commitment_mn`, `drawn_mn`, `currency`, `tenor_yr`, `spread_bps`, `rating`, `esg_score`, `pd_pct`, `lgd_pct`, `el_mn`, `covenant_type`, `esg_kpis`, `margin_ratchet_bps`, `country`, `employees`, `revenue_mn`, `lma_use_of_proceeds` |
| `LMA_PRINCIPLES` | 5 | `label`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n == null ? '-' : Number(n).toFixed(d);` |
| `fmtI` | `n => n == null ? '-' : Math.round(n).toLocaleString();` |
| `fmtM` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}M`;` |
| `pct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `SECTORS` | `[...new Set(CREDIT_PORTFOLIO_INIT.map(f => f.sector))].sort();` |
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];` |
| `COUNTRIES` | `[...new Set(CREDIT_PORTFOLIO_INIT.map(f => f.country))].sort();` |
| `totalCommit` | `facilities.reduce((s, f) => s + f.commitment_mn, 0);` |
| `totalDrawn` | `facilities.reduce((s, f) => s + f.drawn_mn, 0);` |
| `wtdSpread` | `totalDrawn > 0 ? facilities.reduce((s, f) => s + f.spread_bps * f.drawn_mn, 0) / totalDrawn : 0;` |
| `avgESG` | `n > 0 ? facilities.reduce((s, f) => s + f.esg_score, 0) / n : 0;` |
| `esgLinked` | `facilities.filter(f => f.covenant_type === 'ESG-linked').length;` |
| `esgLinkedPct` | `n > 0 ? (esgLinked / n * 100) : 0;` |
| `totalEL` | `facilities.reduce((s, f) => s + f.el_mn, 0);` |
| `avgPD` | `n > 0 ? facilities.reduce((s, f) => s + f.pd_pct, 0) / n : 0;` |
| `avgLGD` | `n > 0 ? facilities.reduce((s, f) => s + f.lgd_pct, 0) / n : 0;` |
| `ratchetSavings` | `facilities.filter(f => f.margin_ratchet_bps > 0).reduce((s, f) => s + (f.margin_ratchet_bps / 10000) * f.drawn_mn, 0);` |
| `wtdTenor` | `totalDrawn > 0 ? facilities.reduce((s, f) => s + f.tenor_yr * f.drawn_mn, 0) / totalDrawn : 0;` |
| `scatterData` | `useMemo(() => facilities.map(f => ({` |
| `waterfallData` | `useMemo(() => { return facilities.map(f => ({ name: f.borrower.split(' ')[0], el: f.el_mn, tier: esgTier(f.esg_score), })).sort((a, b) => b.el - a.el);` |
| `pcafData` | `useMemo(() => { return facilities.map(f => { const totalCapital = (f.pcaf_equity_mn \|\| 0) + (f.pcaf_debt_mn \|\| 0);` |
| `attribution` | `totalCapital > 0 ? f.drawn_mn / totalCapital : 0;` |
| `rows` | `facilities.map(f => ({` |
| `onTrack` | `sr(_sc++) > 0.3;` |
| `effRatchet` | `Math.round(f.margin_ratchet_bps * ratchetSlider / 100);` |
| `savings` | `(effRatchet / 10000) * f.drawn_mn;` |
| `effSpread` | `f.spread_bps - effRatchet;` |
| `ratingOrder` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];` |
| `ratingDist` | `ratingOrder.map(r => ({` |
| `countryData` | `Object.entries(countryExposure).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);` |
| `spreadData` | `facilities.map(f => ({ name:f.borrower, spread:f.spread_bps, esg:f.esg_score, size:f.drawn_mn, esgLinked:f.covenant_type==='ESG-linked' }));` |
| `subIG` | `facilities.filter(f => !['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'].includes(f.rating));` |
| `largest` | `[...facilities].sort((a, b) => b.commitment_mn - a.commitment_mn)[0];` |
| `totalKPIs` | `esgLinked.reduce((s, f) => s + f.esg_kpis.length, 0);` |
| `avgSpread` | `typeFacilities.length > 0 ? typeFacilities.reduce((s, f) => s + f.spread_bps, 0) / typeFacilities.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `CREDIT_PORTFOLIO_INIT`, `CURRENCIES`, `FACILITY_TYPES`, `LMA_PRINCIPLES`, `PIE_COLORS`, `RATINGS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Due Diligence Score | — | Internal DD Framework | Composite ESG assessment score from pre-origination due diligence questionnaire. |
| Climate Risk Tier | — | Hazard Screening Tool | Borrower physical and transition risk classification from screening model. |
| SLL KPI Coverage (%) | — | Deal Registry | Percentage of new originations including at least one sustainability-linked pricing KPI. |
- **Borrower ESG data + deal terms + KPI targets** → ESG scoring; climate screening; SLL structuring analysis → **ESG assessment report + SLL KPI framework + pricing adjustments**

## 5 · Intermediate Transformation Logic
**Methodology:** Sustainability-Linked Margin Step
**Headline formula:** `δspread = KPI_miss × step_bps; KPI_hit × (–step_bps)`

Bilateral margin adjustment mechanism tied to borrower achievement of pre-agreed sustainability KPIs.

**Standards:** ['LMA/APLMA/LSTA SLL Principles (2023)', 'PCAF Private Debt Standard']
**Reference documents:** LMA/APLMA/LSTA Sustainability-Linked Loan Principles (2023); PCAF The Global GHG Accounting and Reporting Standard for the Financial Industry

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is a private-credit portfolio workbench: 15 seeded facilities (localStorage-persisted,
CRUD-enabled) with hand-authored credit primitives, and analytics for expected loss, the
sustainability-linked-loan (SLL) margin ratchet, PCAF attribution, and LMA green-loan-principle
compliance. Unlike most B-tier pages it carries **genuine credit-risk arithmetic** (the EL and PCAF
formulas are correct), though all risk parameters are analyst-entered, not modelled.

### 7.1 What the module computes

**Expected loss** (Basel/IFRS-9 form). Seeded facilities carry `el_mn` directly; new facilities
compute it correctly:

```js
el_mn = (pd_pct/100) × (lgd_pct/100) × drawn_mn        // EL = PD × LGD × EAD
```

**Portfolio KPIs** (drawn-weighted where appropriate):

```js
wtdSpread     = Σ(spread_bps × drawn) / Σ drawn         // exposure-weighted margin
wtdTenor      = Σ(tenor_yr  × drawn) / Σ drawn
avgESG        = Σ esg_score / n                         // simple mean
esgLinkedPct  = #(covenant='ESG-linked') / n × 100
totalEL       = Σ el_mn
ratchetSavings= Σ_{ratchet>0} (margin_ratchet_bps/10000) × drawn   // bps→decimal × EAD
```

**SLL margin ratchet** (the guide's `δspread = KPI_miss × step_bps` mechanism). A slider
`ratchetSlider` = "% of KPIs met" drives:

```js
effRatchet = round(margin_ratchet_bps × ratchetSlider / 100)   // bps of margin reduction earned
savings    = (effRatchet/10000) × drawn_mn                     // $ saved this period
effSpread  = spread_bps − effRatchet                           // net margin after ratchet
```

At 100% KPI achievement the borrower earns the full `margin_ratchet_bps` step-down; at 0% none — a
one-directional benefit ratchet.

**PCAF attribution** (correct Part-A form for private debt):

```js
totalCapital = pcaf_equity_mn + pcaf_debt_mn
attribution  = min(drawn_mn / totalCapital, 1)         // outstanding / (equity + debt)
```

This is the PCAF attribution factor `outstanding_amount / (EVIC or total_debt+equity)`, capped at 1.

**LMA compliance**: full if all four green-loan principles (use-of-proceeds, project-eval,
mgmt-of-proceeds, reporting) are true; else partial.

### 7.2 Parameterisation / provenance

| Field | Range in seed | Provenance |
|---|---|---|
| pd_pct | 1.5–8.0 % | hand-authored per borrower (rating-consistent) |
| lgd_pct | 25–60 % | hand-authored (seniority-consistent: Senior 25–35, Mezz/2nd-lien 50–60) |
| spread_bps | 375–750 | hand-authored (rating/tenor-consistent) |
| esg_score | 45–82 | hand-authored |
| margin_ratchet_bps | 0–30 | hand-authored (only ESG-linked facilities) |
| pcaf_equity/debt_mn | table | hand-authored capital stack |
| esgTier cutoffs | ≥70 high, ≥55 med, else low | in-code thresholds |

There is **no `sr()` seeding of the core portfolio** — the 15 facilities are a curated demo book.
`sr()` appears only in one incidental "on-track" flag (`sr(_sc++)>0.3`) in a KPI-tracker table.

### 7.3 Calculation walkthrough

Facilities (state) → `kpis` memo (weighted aggregates) → charts: EL waterfall (sorted by `el_mn`,
coloured by ESG tier), ESG-vs-PD scatter (bubble = commitment), rating distribution (18-notch
`ratingOrder`), country/sector exposure, spread-vs-ESG. The SLL tab recomputes `effRatchet`/`savings`
live from the slider. The PCAF tab shows attribution factor per borrower. CRUD writes back to
localStorage.

### 7.4 Worked example (facility PC004, GreenHaven REIT)

Seed values: `drawn = $65M`, `pd = 5.5%`, `lgd = 50%`, `spread = 700bps`, `margin_ratchet = 15bps`,
`pcaf_equity = 25`, `pcaf_debt = 65`.

| Step | Computation | Result |
|---|---|---|
| Expected loss | 0.055 × 0.50 × 65 | **$1.79M** (matches seed `el_mn`) |
| PCAF total capital | 25 + 65 | $90M |
| Attribution factor | min(65/90, 1) | **0.722** |
| Ratchet at 100% KPI | effRatchet = 15 × 100/100 | 15 bps |
| Savings | (15/10000) × 65 | **$0.0975M ($97.5k)** |
| Net spread | 700 − 15 | **685 bps** |
| Ratchet at 50% KPI | effRatchet = round(15 × 0.5) = 8 → savings (8/10000)×65 | **$52k**, net 692bps |

The EL reconciles exactly to the seeded value, confirming the seed was built with the same
PD×LGD×EAD identity.

### 7.5 Data provenance & limitations

- The 15-facility book is a **curated demo**, not real counterparties, but is internally consistent
  (PD/LGD track rating and seniority; EL = PD×LGD×EAD holds).
- PD/LGD are **static analyst inputs** — there is no rating-to-PD mapping, no term structure, no
  climate conditioning of PD (contrast `climate-credit-integration`, which does condition PD).
- EL is single-period (12-month), no lifetime ECL, no discounting, no stage migration.
- The SLL ratchet is a linear `bps × %KPI` benefit only — no penalty (step-up) branch, no
  sustainability-performance-target verification, no two-way pricing as SLLP 2023 contemplates.
- PCAF attribution uses `debt+equity` as the denominator (appropriate for private companies without
  EVIC); emissions themselves are not multiplied through here (no financed-emissions figure on this
  page — that lives in `private-credit-climate`).

**Framework alignment:** **LMA/APLMA/LSTA Sustainability-Linked Loan Principles (2023)** — the
ratchet encodes the SLLP margin-adjustment mechanism (though only the reward leg); **LMA Green Loan
Principles** — the four-pillar compliance flags map exactly to GLP's four core components (use of
proceeds, evaluation & selection, management of proceeds, reporting). **PCAF Global GHG Standard,
Part A (private debt)** — the attribution factor `outstanding / (equity+debt)` is PCAF's prescribed
private-company attribution. **IFRS 9 / Basel EL** — `PD×LGD×EAD` is the standard expected-loss
identity, here applied as a point estimate rather than a staged ECL.

## 9 · Future Evolution

### 9.1 Evolution A — Rating-mapped PD term structure and two-way SLL ratchet (analytics ladder: rung 1 → 3)

**What.** The workbench's arithmetic is genuinely correct (EL = PD×LGD×EAD reconciles to seed values; PCAF attribution `min(drawn/(equity+debt),1)` is the prescribed private-debt form), but §7.5 lists the honest ceilings: PD/LGD are static analyst entries with no rating-to-PD mapping or term structure, EL is single-period with no lifetime ECL, and the SLL ratchet implements only the reward leg — no step-up penalty branch, contrary to SLLP 2023's two-way pricing. Evolution A adds the modelling layer: rating-notch PD curves, multi-year discounted ECL, and a symmetric ratchet.

**How.** (1) Backend route `api/v1/routes/private_credit.py` with `POST /facility-el` — PD resolved from the 18-notch `ratingOrder` via a documented cumulative-PD table (reuse the PD assets `ppa-xva-engine` and `pf-credit-rating-engine` already serve), lifetime ECL = Σ marginal-PD × LGD × EAD_t × DF_t; analyst PD override retained but flagged `source: manual`. (2) Ratchet gains a `step_up_bps` field and a per-KPI achievement vector replacing the single slider, matching SLLP's SPT-level mechanics. (3) The localStorage book migrates to an org-scoped `private_credit_facilities` table so the D1 write-side activation covers it; CSV export stays.

**Prerequisites.** PD-curve reference table exposed platform-wide (shared, not re-authored); migration path for existing localStorage books. **Acceptance:** PC004's 12-month EL still reproduces $1.79M under the manual override, while the rating-mapped path yields a lifetime ECL that increases with tenor; a missed-KPI facility shows spread above contractual base.

### 9.2 Evolution B — Origination copilot with SLL term drafting (LLM tier 2)

**What.** A deal-desk copilot that works a new origination end-to-end: "add this $40M senior facility, BB, 5yr — what does it do to portfolio EL and drawn-weighted spread? Suggest an SLLP-conformant KPI package with a 12.5bps two-way ratchet." Portfolio impacts come from tool calls (facility CRUD + `POST /facility-el` + the portfolio-aggregate endpoint); the KPI package is drafted from the LMA principles list the module already carries (`LMA_PRINCIPLES`) plus SLLP 2023 reference text in the corpus, each suggested KPI tagged with its verification requirement.

**How.** Tier-2 tool schemas over the Evolution-A endpoints, with the facility-create call gated behind explicit user confirmation (it mutates the book — RBAC + confirm pattern per the roadmap). System prompt embeds §7.5's limitations so the copilot volunteers "PD is rating-mapped, not borrower-specific" when quoting EL. The incidental `sr()`-seeded "on-track" flag in the KPI tracker must be replaced by stored KPI status first — a copilot must not narrate a coin flip as covenant compliance.

**Prerequisites.** Evolution A (endpoints + persisted book); the on-track flag fix; SLLP 2023 text chunked into the corpus. **Acceptance:** every EL/spread figure in a copilot answer traces to a tool call, and drafted KPI clauses cite the specific SLLP component they satisfy.