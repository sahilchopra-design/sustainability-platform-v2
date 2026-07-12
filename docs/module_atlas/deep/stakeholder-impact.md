## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide claims **12 stakeholder groups** and an
> `IMS = Σ(Severity × Scale × Likelihood) / StakeholderWeight` formula. The code defines **8**
> `STAKEHOLDER_GROUPS` (ESRS-aligned: S1 Employees, S2 Supply Chain Workers, S3 Communities, S4
> Consumers, plus Investors, Regulators, Environment/Nature, Future Generations) and tracks four
> independent per-group scores — `positive`, `negative`, `influence`, `severity` — with **no Scale or
> Likelihood dimension and no `IMS` aggregation formula anywhere in the file**. What the module
> actually implements is a lighter, user-editable stakeholder scorecard, not the guide's
> severity×scale×likelihood materiality-score engine.

### 7.1 What the module computes

Initial per-group scores are seeded (once, on first load, unless a saved session exists in
`localStorage['ra_stakeholder_engagement_v1']`) via a DJB2-style string hash `seed(s)` feeding the
platform's standard `sRand(n)=frac(sin(n+1)×10⁴)`:

```
positive  = round(30 + sRand(seed(id))  ×50)     // 30–80
negative  = round(15 + sRand(seed(id)+1)×45)     // 15–60
influence = round(30 + sRand(seed(id)+2)×60)     // 30–90
severity  = round(25 + sRand(seed(id)+3)×55)     // 25–80
```

Unlike most modules in this batch, **these are only the seed values** — the UI exposes editable
controls (sliders, implied by `setImpactScores`) so a user can overwrite them, and the resulting
scores persist to `localStorage`, surviving reloads. This makes the module a genuine (if unweighted)
stakeholder-impact scorecard tool, seeded with plausible synthetic defaults rather than a purely
read-only display.

### 7.2 Parameterisation

| Field | Default range | Provenance |
|---|---|---|
| `positive`/`negative` | 30–80 / 15–60 | Synthetic seed defaults; user-editable thereafter |
| `influence`/`severity` | 30–90 / 25–80 | Synthetic seed defaults; user-editable thereafter |
| $ impact conversion | `posMn = round(portfolioValue × positive × 0.00008)`; `negMn = round(portfolioValue × negative × 0.00006)` | Hand-tuned scaling constants (0.008%/0.006% of portfolio value per score point) — no cited valuation methodology (e.g. no True Cost Accounting or Impact-Weighted Accounts factor) |
| Default fallback score | `{positive:40, negative:25}` when a group has no saved score | Synthetic |

### 7.3 Calculation walkthrough

1. **Aggregates** — `totalPositive`/`totalNegative` sum the 8 groups' current `positive`/`negative`
   scores; `netImpact = totalPositive − totalNegative`; `dataCoverage` = % of groups with a
   `positive>0` score (always 100% once seeded, since every group starts >0).
2. **Impact quantification ($)** — for the selected company/portfolio, `portfolioValue =
   Σ(market_cap_usd_mn||5000)` across `GLOBAL_COMPANY_MASTER` holdings; each group's `positive`/
   `negative` score converts to a dollar figure via the two hand-tuned multipliers above — a
   linear "score-point → $" translation with no cited monetisation methodology (contrast with e.g.
   the Impact-Weighted Accounts Initiative's shadow-price approach).
3. **Radar/scatter views** — `radarData` (positive/negative/influence per group),
   `impactQuantification`-driven bar chart (posMn/negMn), and a severity×influence scatter (a
   materiality-matrix-style plot using only 2 of the guide's 3 named dimensions — no "Scale").
4. **Company-level noise** — switching `selectedCompany` adds `noise = (sRand(seed(company+groupId))
   −0.5)×20` to a `base = positive−negative` score, so different companies show plausibly different
   stakeholder profiles even though the underlying group scores are shared user-editable state, not
   company-specific data.
5. **Engagement grievance simulator** — a separate sub-tab generates synthetic grievance case counts
   (`cases=round(5+sRand()×50)`), resolution rates (`55–95%`), resolution days (`15–75`), and access
   channels — descriptive only, not linked to `impactScores`.
6. **CSV/JSON export** — full snapshot of `impactScores`, `actions`, and `impactQuantification`.

### 7.4 Worked example

Employees & Workers (`SH01`), seed defaults (no user edits, no saved session):

```
seed('SH01') via DJB2 hash → h
positive  = round(30 + sRand(h)×50)
negative  = round(15 + sRand(h+1)×45)
```

Since `seed()` uses a bitwise DJB2 hash (`h=((h<<5)+h)^charCode`) rather than the simple `sr()`
pattern used elsewhere, its output is not directly reproducible by hand without executing the exact
32-bit JS bitwise sequence — the important point for a reader is the **formula structure** (linear
range mapping off a hash-derived pseudo-random draw), not the specific numeral, since a user is
expected to override these values via the UI in real use.

### 7.5 Companion analytics

- **ESRS mapping** — 6 real ESRS standards (S1–S4, G1, E1) mapped to the 8 stakeholder groups —
  a genuinely correct real-world regulatory cross-reference (Employees→S1, Supply Chain→S2,
  Communities→S3, Consumers→S4, Investors/Regulators→G1, Environment/Future Generations→E1).
- **SDG cross-reference** — each group mapped to 2–5 real UN SDGs — descriptive, not scored.
- **Grievance mechanism simulator** — synthetic case volumes/resolution rates per engagement channel
  (Hotline, Web portal, Union rep, Community panel, Ombudsperson, Email, In-person).

### 7.6 Data provenance & limitations

- Seed values are synthetic; once a user edits and saves scores, the module becomes a legitimate
  (if simplistically weighted) tracking tool — but there is no audit trail distinguishing
  "still-default synthetic" from "user-assessed" scores in the UI.
- The $ impact conversion multipliers (0.00008/0.00006 of portfolio value per score point) are
  unsourced and arbitrary; a production Impact-Weighted Accounts-style model would need documented,
  category-specific monetisation factors (e.g. Harvard Business School IWAI's employment/GHG/health
  shadow prices).
- No Scale or Likelihood dimension exists despite being central to the guide's own IMS formula and
  to GRI 3's actual double-materiality assessment methodology (severity = scale + scope +
  irremediability; likelihood is a separate multiplier for potential impacts).

**Framework alignment:** ESRS S1–S4/G1/E1 (real, correctly mapped) · GRI 3 Material Topics (guide
references the severity/likelihood double-materiality approach; code implements only a severity-like
score without scale/likelihood) · UN SDGs (correct cross-reference, descriptive only) · S1000+ /
Impact-Weighted Accounts (named in guide, not implemented — no severity×scale×likelihood engine or
documented monetisation factors exist in code).
