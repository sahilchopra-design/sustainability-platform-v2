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
