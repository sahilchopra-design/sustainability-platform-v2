# Stakeholder Impact
**Module ID:** `stakeholder-impact` · **Route:** `/stakeholder-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Impact measurement platform covering all stakeholder groups using the S1000+ framework; quantifies social, environmental and economic outcomes attributable to corporate activities.

> **Business value:** Stakeholder impact analysis is required under ESRS double-materiality assessments; S1000+ provides the most granular multi-stakeholder accounting framework available.

**How an analyst works this module:**
- Map stakeholder groups and material impact topics
- Score each topic on severity, scale and likelihood
- Apply stakeholder weighting per S1000+ methodology
- Aggregate into composite impact materiality scores
- Report outcomes against SDG targets and ESRS S1–S4

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `ESRS_MAP`, `KpiCard`, `LS_ENGAGE`, `LS_PORT`, `SDG_MAP`, `SECTOR_PROFILES`, `STAKEHOLDER_GROUPS`, `Section`, `Sel`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `STAKEHOLDER_GROUPS` | 9 | `name`, `icon`, `esrs`, `description`, `impact_channels`, `engagement_mechanisms`, `metrics` |
| `ESRS_MAP` | 11 | `title`, `stakeholders` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `totalPositive` | `Object.values(impactScores).reduce((s, g) => s + g.positive, 0);` |
| `totalNegative` | `Object.values(impactScores).reduce((s, g) => s + g.negative, 0);` |
| `netImpact` | `totalPositive - totalNegative;` |
| `totalChannels` | `STAKEHOLDER_GROUPS.reduce((s, g) => s + g.impact_channels.length, 0);` |
| `dataCoverage` | `Math.round((STAKEHOLDER_GROUPS.filter(g => impactScores[g.id]?.positive > 0).length / STAKEHOLDER_GROUPS.length) * 100);` |
| `impactQuantification` | `useMemo(() => { return STAKEHOLDER_GROUPS.map(g => { const sc = impactScores[g.id] \|\| { positive: 40, negative: 25 };` |
| `portfolioValue` | `portfolio.reduce((s, c) => s + (c.market_cap_usd_mn \|\| 5000), 0);` |
| `posMn` | `Math.round(portfolioValue * sc.positive * 0.00008);` |
| `negMn` | `Math.round(portfolioValue * sc.negative * 0.00006);` |
| `radarData` | `STAKEHOLDER_GROUPS.map(g => ({` |
| `base` | `(impactScores[g.id]?.positive \|\| 40) - (impactScores[g.id]?.negative \|\| 25);` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `noise` | `(sRand(seed(selectedCompany + g.id)) - 0.5) * 20;` |
| `net` | `sc.positive - sc.negative;` |
| `sorted` | `STAKEHOLDER_GROUPS.map(g => ({ ...g, score: (profile[g.id] \|\| 50) + Math.round((sRand(s + seed(g.id)) - 0.5) * 15) })).sort((a, b) => b.score - a.score);` |
| `engStatus` | `sRand(s + 200) > 0.6 ? 'Active' : sRand(s + 200) > 0.3 ? 'Planned' : 'Minimal';` |
| `cases` | `Math.round(5 + sRand(s) * 50);` |
| `resolution` | `Math.round(55 + sRand(s + 1) * 40);` |
| `days` | `Math.round(15 + sRand(s + 2) * 60);` |
| `channels` | `['Hotline','Web portal','Union rep','Community panel','Ombudsperson','Email','In-person'][Math.floor(sRand(s + 3) * 7)];` |
| `access` | `sRand(s + 4) > 0.6 ? 'High' : sRand(s + 4) > 0.3 ? 'Medium' : 'Low';` |
| `level` | `Math.floor(1 + sRand(s) * 4.99);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ESRS_MAP`, `STAKEHOLDER_GROUPS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Stakeholder Groups Assessed | — | S1000+ Framework | Number of distinct stakeholder cohorts evaluated including employees, communities, suppliers, investors. |
| Positive Impact Score | — | IMS Engine | Aggregate positive impact rating across all stakeholder groups and material topics. |
| Negative Impact Coverage | — | Double Materiality Audit | Proportion of identified negative impacts with active mitigation measures in place. |
- **Stakeholder Surveys, Operational Data, ESG Assessments** → S1000+ scoring engine + SDG alignment mapping → **Impact materiality matrix, ESRS social disclosures, SDG contribution report**

## 5 · Intermediate Transformation Logic
**Methodology:** Impact Materiality Score
**Headline formula:** `IMS = Σ (Severity × Scale × Likelihood) / Stakeholder Weight`

Weighted aggregation of severity, scale and likelihood across each stakeholder group and impact topic.

**Standards:** ['S1000+ Standard 2023', 'GRI 3 Material Topics']
**Reference documents:** S1000+ Stakeholder Impact Standard 2023; GRI 3: Material Topics 2021; ESRS S1–S4 Social Standards; UN SDGs 1–17

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Implement the severity×scale×likelihood IMS engine with monetisation (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the guide's `IMS = Σ(Severity × Scale × Likelihood) / StakeholderWeight` is not implemented: the code defines 8 ESRS-aligned stakeholder groups (S1 Employees, S2 Supply Chain Workers, S3 Communities, S4 Consumers, plus Investors, Regulators, Environment, Future Generations) with four per-group scores (positive/negative/influence/severity) but **no Scale or Likelihood dimension and no IMS aggregation formula anywhere**. Its genuine strength (§7.1) is that the seeded scores are *editable and persist* to localStorage — a real, if unweighted, scorecard tool. Evolution A builds the actual GRI-3/ESRS double-materiality engine the guide promises.

**How.** (1) Add the missing Scale and Likelihood dimensions (GRI 3 defines severity = scale + scope + irremediability, with likelihood a separate multiplier for potential impacts) and implement the IMS = Σ(severity × scale × likelihood) / stakeholder-weight aggregation. (2) Replace the arbitrary $ monetisation multipliers (0.00008/0.00006 of portfolio value per score point, §7.6 flags as unsourced) with documented category-specific shadow prices (Harvard IWAI employment/GHG/health factors). (3) Add an audit-trail flag distinguishing still-default synthetic scores from user-assessed ones — the deep-dive notes the UI can't currently tell them apart. (4) Map outcomes to ESRS S1–S4 and SDG targets (already structurally present) with the computed IMS driving materiality.

**Prerequisites.** Shadow-price sourcing; the scorecard's edit/persist mechanism is a good foundation to extend. **Acceptance:** the IMS recomputes from severity/scale/likelihood; the $ impact uses cited shadow prices; the UI flags default-vs-assessed scores.

### 9.2 Evolution B — Double-materiality assessment copilot (LLM tier 1)

**What.** ESRS double-materiality assessment is a structured qualitative judgment — the ideal LLM elicitation task. Evolution B walks an analyst through each stakeholder group and material topic: "for supply-chain workers, how severe and how likely is this impact?", proposing severity/scale/likelihood scores with rationale tied to the GRI 3 rubric, assembling the IMS via the Evolution-A engine, and mapping results to ESRS S1–S4.

**How.** Tier-1 structured-elicitation pattern: `POST /api/v1/copilot/stakeholder-impact/ask`, corpus = this Atlas record (the stakeholder groups, ESRS map, GRI 3 severity/likelihood methodology). Each proposed score cites the GRI 3 criterion and requires user-provided evidence; the IMS is computed by the engine, not the LLM. Results feed the ESRS S1–S4 disclosure mapping the page already carries. The copilot never scores without evidence input.

**Prerequisites.** Evolution A's IMS engine so the composite is real; the edit/persist store already supports draft assessments. **Acceptance:** every proposed severity/scale/likelihood cites a GRI 3 criterion and user evidence; empty evidence yields "insufficient input," not a default; the IMS matches the engine's computation.