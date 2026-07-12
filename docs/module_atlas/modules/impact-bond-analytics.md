# Impact Bond Analytics
**Module ID:** `impact-bond-analytics` · **Route:** `/impact-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ6 · **Sprint:** CQ

## 1 · Overview
15 impact bonds (SIBs, DIBs, sustainability bonds) with SROI calculation, outcome measurement, and additionality assessment.

**How an analyst works this module:**
- Impact Bond Universe shows 15 instruments
- SROI Calculator computes social return ratio
- Outcome Tracking compares actual vs target results

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `SROI_DIMS`, `TABS`, `TYPE_COLORS`, `TYPE_DIST`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BONDS` | 16 | `type`, `amount`, `sroi`, `outcomeActual`, `outcomeTarget`, `additionality`, `sector`, `country` |
| `SROI_DIMS` | 7 | `score` |
| `TYPE_DIST` | 5 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `types` | `[...new Set(BONDS.map(b => b.type))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `SROI_DIMS`, `TABS`, `TYPE_COLORS`, `TYPE_DIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Impact Bonds | — | Market | SIBs, DIBs, and sustainability bonds |
| Avg SROI | — | Impact reports | $1 invested generates $3.2 of social value |

## 5 · Intermediate Transformation Logic
**Methodology:** Social Return on Investment
**Headline formula:** `SROI = SocialValue_created / Investment_amount`

SROI measures social value per dollar invested. Outcome tracking: actual vs target for education, health, environmental outcomes. Additionality: would outcomes have occurred without the bond?

**Standards:** ['IMP', 'GIIN']
**Reference documents:** Impact Management Project; GIIN IRIS+ Metrics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

An **impact-bond universe** page (15 SIBs/DIBs/development/sustainability bonds) tracking SROI,
outcome achievement (actual vs target) and additionality. Unusually for the impact family, the bond
data is a **hand-authored table of real instruments** (Peterborough SIB, Educate Girls DIB, IFFIm
Vaccine Bond…), not PRNG-generated — so the module is descriptive rather than computational. Code and
guide (EP-CQ6) agree.

### 7.1 What the module computes

There is very little derived computation — the page is a curated dataset with filter/aggregate views.
The only headline "formula" is the guide's SROI ratio, which is stored per-bond (`sroi`), not computed:

```
SROI = SocialValue_created / Investment_amount        (stored as bond.sroi, e.g. 3.2×)
Outcome achievement = outcomeActual / outcomeTarget    (e.g. 82/75 = 109%)
```

Portfolio views: type filter (`BONDS.filter(b=>b.type===typeFilter)`), type distribution pie, an
`SROI_DIMS` radar (6 fixed dimension scores), and per-bond outcome/additionality bars.

### 7.2 Parameterisation — the BONDS table (real instruments)

| Bond | Type | Amount ($M) | SROI | Actual/Target | Additionality | Sector |
|---|---|---|---|---|---|---|
| Peterborough SIB | SIB | 5 | 3.2× | 82/75 | 85 | Criminal Justice |
| IFFIm Vaccine Bond | Development | 6 500 | 4.5× | 95/90 | 92 | Health |
| Educate Girls DIB | DIB | 0.27 | 5.8× | 116/100 | 88 | Education |
| Cameroon Cataract Bond | DIB | 2 | 6.2× | 105/95 | 90 | Health |
| DC Water EIB | EIB | 25 | 2.8× | 78/80 | 72 | Water/Env |
| … (15 total) | | | | | | |

`SROI_DIMS` (Social Value 82, Cost Efficiency 75, Beneficiary Reach 88, Outcome Sustainability 68,
Stakeholder Satisfaction 78, Scalability 62) are **fixed portfolio-level scores**, not per-bond.
`TYPE_DIST` counts (SIB 5, DIB 4, Sustainability 3, Development 2, EIB 1) tally the 15 bonds.

These are recognisable real-world impact bonds with broadly plausible published SROI figures — the
data is curated, not fabricated, though the specific SROI/additionality numbers are indicative.

### 7.3 Calculation walkthrough

`types` de-dupes the bond-type set for the filter dropdown. `filtered` applies the type filter.
Aggregate KPIs (average SROI, average additionality, total volume) are simple reductions over
`filtered`. Charts read the bond fields directly — there is no attribution, discounting or
counterfactual model.

### 7.4 Worked example (Educate Girls DIB)

| Field | Value | Reading |
|---|---|---|
| SROI | 5.8× | $1 invested → $5.80 social value (stored, not recomputed) |
| Outcome | 116 / 100 | **116%** of target learning-outcome gain achieved |
| Additionality | 88 | high — outcomes attributed to the DIB vs counterfactual |

Portfolio average SROI across the 15 bonds ≈ 3.9× (guide quotes 3.2× as an illustrative average).

### 7.5 Data provenance & limitations

- Bond data is **hand-authored from real instruments** — no `sr()` PRNG in this module. This is a
  strength; the caveat is that the SROI/additionality figures are indicative snapshots, not sourced
  to each bond's published evaluation.
- **SROI is stored, not modelled** — there is no social-value monetisation, discount rate, deadweight
  or attribution calculation behind the ratio. A production SROI engine would compute
  `Σ(outcome × financial proxy × (1−deadweight) × attribution) / investment` per the SROI Network
  methodology.
- Additionality is a single 0–100 score, not decomposed into enterprise vs investor additionality.

**Framework alignment:** **SROI** (Social Value International / SROI Network) — the ratio the module
displays is the SROI framework's headline metric; a full SROI is derived by monetising outcomes with
financial proxies, netting deadweight/attribution/drop-off, and discounting future value ·
**Impact Management Project (IMP)** five dimensions and **GIIN IRIS+** inform the outcome/additionality
framing. The module is a credible universe tracker; the SROI and additionality numbers would need
bond-level evaluation reports to be decision-grade.

## 9 · Future Evolution

### 9.1 Evolution A — A computed SROI engine behind the curated bond universe (analytics ladder: rung 1 → 2)

**What.** The page's strength is unusual for the impact family: the 15-bond `BONDS` table is hand-authored from real instruments (Peterborough SIB, Educate Girls DIB, IFFIm Vaccine Bond) with no PRNG anywhere. Its limitation, per §7.5, is that SROI is *stored, not modelled* — there is no monetisation, discount rate, deadweight or attribution behind the 3.2×/5.8× ratios, and additionality is a single undecomposed 0–100 score. Evolution A builds the SROI Network calculation §7.5 itself specifies: `SROI = Σ(outcome × financial proxy × (1−deadweight) × attribution × (1−drop-off), discounted) / investment`, so an analyst can rebuild a bond's ratio from its evaluation inputs and stress it.

**How.** (1) A first backend vertical with tables for bond outcomomes (bond × outcome metric × period × actual/target), financial proxies with sources, and adjustment factors (deadweight/attribution/drop-off per SROI convention). (2) `POST /impact-bonds/sroi` computing the ratio with each adjustment exposed as a line item; the stored per-bond `sroi` values become reconciliation targets — computed Peterborough should land near its published 3.2× or the divergence be explained. (3) Additionality decomposed into enterprise vs investor additionality per the IMP framing the guide cites. (4) Seed the engine with published evaluation data for 3–4 of the best-documented bonds (Educate Girls has a public evaluation).

**Prerequisites.** Bond-level evaluation source documents gathered and cited (the §7.5 caveat — indicative snapshots — must be closed with citations, not code). **Acceptance:** a computed SROI decomposes into cited proxies and adjustments; changing the deadweight assumption moves the ratio deterministically; stored vs computed values reconciled per bond.

### 9.2 Evolution B — Impact-bond structuring copilot over the universe (LLM tier 1)

**What.** A copilot for outcome funders and structurers: "why did DC Water's EIB underperform (78/80)?", "what distinguishes a DIB from a SIB payment trigger?", "which health bonds beat target and what was their SROI basis?" The module's value is precisely curated institutional knowledge — the strongest possible tier-1 grounding corpus since every fact is already in the `BONDS` table and this Atlas page's §7.2/§7.4 walk-throughs.

**How.** Tier 1 RAG: atlas record plus the bond table into `llm_corpus_chunks`; the type filter state passes as context so "these bonds" resolves to the filtered set. Discipline rules: SROI figures must be quoted as stored indicative values with the §7.5 caveat until Evolution A ships; the copilot must not extrapolate SROI to bonds outside the 15-instrument universe, and refuses "what would a new recidivism SIB return?" until the computed engine exists to run it as a what-if. Post-Evolution-A, tier 2 upgrades enable exactly that structuring question: hypothetical bond parameters submitted to `/sroi` as a tool call.

**Prerequisites.** Copilot router + pgvector corpus (Phase 1). **Acceptance:** every bond fact traceable to a `BONDS` row; questions beyond the universe get an explicit scope refusal; post-Evolution-A what-ifs show the full adjustment-factor arithmetic from the tool response.