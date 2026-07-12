# SAF Policy & Mandate Intelligence
**Module ID:** `saf-policy-mandate` · **Route:** `/saf-policy-mandate` · **Tier:** B (frontend-computed) · **EP code:** EP-EF4 · **Sprint:** EF

## 1 · Overview
Tracks all major global SAF mandates and policy frameworks: EU ReFuelEU (2–70%), UK SAF Mandate (2–75%), IRA §40B production tax credit, US SAF Grand Challenge, Japan GIF, Singapore CAAS, CORSIA, and Australia. Includes interactive IRA §40B calculator.

> **Business value:** Used by airlines managing compliance obligations, SAF producers optimising IRA §40B credits, policy teams monitoring mandate developments, and investors assessing regulatory risk in SAF projects.

**How an analyst works this module:**
- Review policy overview for 8 jurisdictions mandate timelines
- Use mandate tracker for 2025/2030/2035 blending percentages by region
- Explore CORSIA intelligence for credit pricing and eligibility
- Run IRA §40B calculator for annual credit value by pathway, CI reduction, and volume

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `POLICIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `POLICIES` | 9 | `name`, `region`, `mandate2025`, `mandate2030`, `mandate2035`, `mandate2050`, `mechanism`, `credit`, `pathways`, `note` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `filtered` | `useMemo(() => POLICIES.filter(p => selRegion === 'ALL' \|\| p.region === selRegion), [selRegion]); const regions = useMemo(() => ['ALL', ...new Set(POLICIES.map(p => p.region))], []);` |
| `mandateChart` | `filtered.map(p => ({ name: p.id, mandate: parseFloat(mandateAt(p).toFixed(1)), region: p.region }));` |
| `timelineChart` | `[2024, 2026, 2028, 2030, 2035, 2040, 2050].map(yr => ({` |
| `iraCalc` | `useMemo(() => { const gallons = annualProd * 1e6 * 264;` |
| `creditPerGal` | `Math.min(1.75, 1.25 + Math.max(0, ciReduction - 50) * 0.01);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `POLICIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU ReFuelEU mandate 2030 | `Blending obligation at EU airports` | Regulation (EU) 2023/2405 | Includes 1.2% PtL sub-mandate from 2030; 5× multiplier credit for PtL; applies to fuel suppliers. |
| UK SAF mandate 2030 | `Blending obligation at UK airports` | UK DfT SAF Mandate Consultation 2023 | Tradeable SAF certificates system; enables book-and-claim; extends to 22% by 2035. |
| CORSIA price range ($/tCO₂) | `Dependent on CORSIA eligible credit price` | ICAO CORSIA State Action Plan guidance | Phase II mandatory from 2027; airlines offset emissions above 2019 baseline; SAF generates CEF credits. |
- **EU ReFuelEU + UK mandate + IRA §40B + CORSIA + 8 jurisdiction tracker** → Mandate timeline tracker + §40B calculator + CORSIA credit intelligence → **Airlines, SAF producers, policy teams, and investors tracking regulatory compliance and incentives**

## 5 · Intermediate Transformation Logic
**Methodology:** IRA §40B SAF Credit
**Headline formula:** `Credit = Gallons × $1.25 × max(1, (50 − CI_reduction_pct) / 50 + 0.5)`

IRA §40B: $1.25/gal base; scaling up to $1.75/gal for CI >50% reduction. Replaces §45Z from 2025.

**Standards:** ['IRS Notice 2023-06 and FAA CORSIA guidance', 'ICAO Annex 16 Volume IV — CORSIA', 'EU ReFuelEU Aviation Regulation 2023/2405']
**Reference documents:** EU (2023) – ReFuelEU Aviation Regulation 2023/2405; ICAO (2024) – CORSIA State Action Plan and Eligible Fuel Guidance; IRS (2023) – Notice 2023-06 §40B SAF Tax Credit Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is one of the more faithfully-implemented modules in this batch: the 8-jurisdiction policy
table uses real, correctly-cited mandate percentages, and the mandate-interpolation and IRA §40B
credit formulas are genuine (if simplified) calculations rather than PRNG fabrication.

### 7.1 What the module computes

```
mandateAt(year) = piecewise-linear interpolation across policy milestone years:
  year<=2025: mandate2025
  2025<year<=2030: mandate2025 + (mandate2030-mandate2025) x (year-2025)/5
  2030<year<=2035: mandate2030 + (mandate2035-mandate2030) x (year-2030)/5
  year>2035: mandate2035 + (mandate2050-mandate2035) x (year-2035)/15

iraCalc:
  gallons      = annualProd(Mt) x 1e6 x 264 gal/t
  ciReduction  = pathway === 'HEFA' ? 65% : pathway === 'PtL' ? 120% : 50%   // hard-coded by pathway
  creditPerGal = min($1.75, $1.25 + max(0, ciReduction - 50) x $0.01/pp)
  annualCredit = gallons x creditPerGal / 1e6   // $M/yr
```

### 7.2 Parameterisation

| Policy | Region | 2025 | 2030 | 2035 | 2050 | Mechanism |
|---|---|---|---|---|---|---|
| EU ReFuelEU Aviation | EU | 2% | 6% | 20% | 70% | Blending mandate (5x multiplier for PtL from 2030) |
| UK Sustainable Aviation Mandate | UK | 2% | 10% | 22% | 75% | Tradeable SAF certificates |
| IRA §40B SAF Credit | USA | — | — | — | — | Production tax credit, $1.25-1.75/gal, expires 2027 |
| US SAF Grand Challenge | USA | — | — | — | 100% | Aspirational (3B gal/yr by 2030) |
| Japan Green Innovation Fund | Japan | 0% | 10% | 15% | 50% | Grant/subsidy |
| Singapore SAF Blending | Singapore | 0.5% | 1% | 3% | 10% | Airport mandate (Changi/CAAS) |
| ICAO CORSIA Phase II | Global | — | — | — | — | Carbon offset, $5-50/tCO2, mandatory from 2027 |
| Australia SAF Mandate (proposed) | Australia | 0% | 5% | 10% | 50% | Proposed, under consultation |

These figures are accurate to the real published EU Regulation 2023/2405 (6% by 2030, 70% by 2050,
with the genuine 5x PtL sub-mandate multiplier correctly noted) and the UK DfT SAF Mandate
consultation figures (10% by 2030, 22% by 2035) cited in the guide — this is real, correctly
sourced regulatory data, not synthetic.

| `creditPerGal` formula constants | Value | Provenance |
|---|---|---|
| Base credit | $1.25/gal | Real IRS Notice 2023-06 §40B base rate |
| Step-up rate | +$0.01/gal per percentage point of CI reduction above 50% | Approximates the real §40B sliding scale (base $1.25 scaling toward $1.75 as CI reduction improves beyond the 50% minimum threshold) |
| Cap | $1.75/gal | Real statutory ceiling |
| `ciReduction` by pathway | HEFA 65%, PtL 120%, other 50% | Hard-coded per-pathway assumption — **not** pulled from the companion `saf-lcof-engine`/`saf-carbon-credits` modules' `ciByPathway` tables, so a user changing CI assumptions elsewhere on the platform sees no effect here (cross-module consistency gap, not a fabrication) |

### 7.3 Calculation walkthrough

1. `mandateAt(p)` is evaluated for every filtered policy at the user-selected `year` slider,
   correctly handling the 4-point piecewise-linear schedule (2025/2030/2035/2050 milestones) —
   this is genuine interpolation, not a lookup or random draw.
2. `timelineChart` hard-codes the same piecewise breakpoints separately for the 4 major mandates
   (EU/UK/Japan/Singapore) to drive a multi-series area chart — duplicated logic from `mandateAt`
   but numerically consistent with the `POLICIES` table.
3. `corsiaData` (8 years, 2024-2031) models emissions growing linearly (`800 + i×45` Mt) against a
   fixed 770 Mt 2019 baseline, with an **unexplained offset-participation ratio** (15% pre-2027,
   jumping to 85% from 2027) approximating CORSIA's real transition from voluntary (2021-2026) to
   mandatory (2027+) phases — directionally correct but the 15%/85% split constants are illustrative,
   not derived from ICAO's actual state-participation list.
4. `iraCalc` computes the §40B credit per the formula above, correctly converting Mt→gallons via
   the 264 gal/t constant.

### 7.4 Worked example

At `annualProd = 0.3 Mt/yr`, `pathway = HEFA`:
```
gallons      = 0.3 x 1e6 x 264 = 79,200,000 gal
ciReduction  = 65% (hard-coded for HEFA)
creditPerGal = min(1.75, 1.25 + max(0, 65-50) x 0.01) = min(1.75, 1.25+0.15) = $1.40/gal
annualCredit = 79,200,000 x 1.40 / 1e6 = $110.9M/yr
```
For `pathway = PtL`: `ciReduction=120%` → `creditPerGal = min(1.75, 1.25 + 70x0.01) = min(1.75,
1.95) = $1.75/gal` (hits the statutory cap) → `annualCredit = 79,200,000 x 1.75 / 1e6 = $138.6M/yr`
at the same production volume.

### 7.5 Data provenance & limitations

- Mandate percentages and milestone years are real, correctly-cited regulatory figures (EU
  Regulation 2023/2405, UK DfT consultation, Japan METI GIF, Singapore CAAS) — the strongest
  content in this module.
- The §40B credit formula is a genuine, correctly-capped calculation, though `ciReduction` is
  hard-coded per pathway rather than computed from an actual feedstock/process LCA, and is not
  cross-consistent with the CI values used in the companion `saf-lcof-engine`/`saf-carbon-credits`
  modules for the same pathway names.
- CORSIA offset-participation ratio (15%→85%) is an illustrative approximation of the
  voluntary-to-mandatory phase transition, not sourced to ICAO's published state-participation
  data.

**Framework alignment:** EU ReFuelEU Aviation Regulation 2023/2405 (correctly implemented mandate
schedule including the PtL 5x multiplier note) · UK SAF Mandate (correctly implemented) · IRS
Notice 2023-06 §40B SAF Production Tax Credit (correctly implemented sliding-scale formula and
cap) · ICAO CORSIA Annex 16 Vol IV (voluntary/mandatory phase transition approximated, not
data-sourced).

## 9 · Future Evolution

### 9.1 Evolution A — One SAF CI fact base and a compliance-obligation calculator (analytics ladder: rung 2 → 3)

**What.** §7 rates this among the batch's most faithful modules: real, correctly cited mandate percentages (EU Regulation 2023/2405, UK DfT, METI GIF, CAAS), a genuine piecewise mandate interpolation, and a correctly capped §40B credit formula. Its flagged gaps: `ciReduction` per pathway is hard-coded and not cross-consistent with the CI values `saf-lcof-engine` and `saf-carbon-credits` use for the same pathway names, and the CORSIA participation ratio (15%→85%) is an illustrative approximation rather than ICAO's published state-participation data. Evolution A makes this module the SAF cluster's policy authority, on shared facts.

**How.** (1) Establish the shared pathway-CI reference table (ICAO CORSIA default values) that all three SAF modules read — resolving the documented cross-module inconsistency at its root, with this module's §40B calculator consuming it. (2) CORSIA participation from ICAO's published state list (public), replacing the approximation with dated coverage data. (3) A compliance-obligation calculator: airline fuel uplift by jurisdiction in, mandated SAF volume and estimated compliance cost out — combining the mandate interpolation with SAF-vs-jet price spreads from `saf-lcof-engine`'s computed costs; served as `POST /api/v1/saf-policy/obligation`. (4) Mandate rows gain version stamps (the UK mandate is consultation-derived and will change; policy content decays).

**Prerequisites.** Shared CI table governance across the SAF cluster; ICAO participation-list transcription. **Acceptance:** the three SAF modules return identical CI values per pathway; an airline's obligation reproduces as uplift × interpolated mandate per jurisdiction-year; every mandate row carries regulation citation and version date.

### 9.2 Evolution B — Mandate-compliance copilot for airlines and policy teams (LLM tier 1 → 2)

**What.** The module's content is regulatory text rendered as numbers — the natural copilot explains and applies it: "what's our 2030 ReFuelEU obligation for 2Mt of EU departures, and how does the sub-mandate for synthetic fuels bite?", "compare UK vs EU mandate trajectories for our network planning", "what changes if the UK consultation lands at the higher band?" — the last a scenario question over stored mandate variants, not speculation.

**How.** Tier 1: RAG over the cited policy table plus the underlying regulation texts (chunked with article anchors — the ReFuelEU synthetic-fuel sub-mandate is exactly the kind of nested provision users misread). Tier 2: obligation questions call `POST /obligation`; trajectory comparisons are computed interpolations. Guardrails: every mandate percentage carries its regulation citation and version date; consultation-stage figures are labelled as such; the copilot refuses to state mandates for jurisdictions outside the 8-row table and flags when a cited regulation has a more recent amendment date than the stored version.

**Prerequisites.** Evolution A's version stamps and obligation calculator; regulation texts chunked. **Acceptance:** obligation answers match endpoint output; every percentage cites regulation and vintage; consultation-derived figures carry the status label in generated text.