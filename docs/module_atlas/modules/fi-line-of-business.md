# FI Line of Business Risk
**Module ID:** `fi-line-of-business` · **Route:** `/fi-line-of-business` · **Tier:** B (frontend-computed) · **EP code:** EP-CT3 · **Sprint:** CT

## 1 · Overview
6 LoBs with risk attribution, revenue efficiency, and marginal contribution analysis.

**How an analyst works this module:**
- LoB Overview shows exposure and score per business line
- Risk Attribution shows contribution to total portfolio risk
- Revenue vs Risk identifies efficient and inefficient LoBs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `LOBS`, `LOB_COLORS`, `TABS`, `TOTAL_EXPOSURE`, `TOTAL_REVENUE`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LOBS` | 7 | `exposure`, `revenue`, `score`, `clients`, `rwa` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_EXPOSURE` | `LOBS.reduce((s, l) => s + l.exposure, 0);` |
| `TOTAL_REVENUE` | `LOBS.reduce((s, l) => s + l.revenue, 0);` |
| `lobsEnriched` | `useMemo(() => LOBS.map((l, i) => {` |
| `riskContrib` | `(l.exposure * (100 - l.score)) / LOBS.reduce((s, l2) => s + l2.exposure * (100 - l2.score), 0) * 100;` |
| `revShare` | `(l.revenue / TOTAL_REVENUE) * 100;` |
| `efficiency` | `revShare / riskContrib;` |
| `radarData` | `useMemo(() => ['Exposure', 'Revenue', 'Score', 'Clients', 'RWA', 'Efficiency'].map(dim => {` |
| `marginalData` | `useMemo(() => lobsEnriched.map(l => {` |
| `newExposure` | `l.exposure + marginalAmount;` |
| `oldPortScore` | `LOBS.reduce((s, lb) => s + lb.exposure * lb.score, 0) / TOTAL_EXPOSURE;` |
| `newPortScore` | `(LOBS.reduce((s, lb) => s + lb.exposure * lb.score, 0) + marginalAmount * l.score) / (TOTAL_EXPOSURE + marginalAmount);` |
| `benchmarkData` | `useMemo(() => lobsEnriched.map(l => ({` |
| `actions` | `useMemo(() => lobsEnriched.filter(l => l.score < 60 \|\| l.efficiency < 1).map(l => ({ lob: l.name, score: l.score, efficiency: l.efficiency,` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOBS`, `LOB_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LoBs | — | Organizational | Business line decomposition |
| Highest Risk LoB | — | Attribution | 42% of total risk |

## 5 · Intermediate Transformation Logic
**Methodology:** LoB risk attribution
**Headline formula:** `RiskContribution = LoB_exposure × (100 - LoB_score) / Total; RevenueEfficiency = Revenue% / Risk%`

6 LoBs: Corporate Banking, Investment Banking, Wealth Management, Insurance, Transaction Banking, Markets. Marginal contribution: impact of $100M additional exposure on portfolio risk.

**Standards:** ['Basel IV', 'BCBS 239']
**Reference documents:** Basel IV Framework; BCBS 239 Risk Data Aggregation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module (EP-CT3) is **methodologically sound and matches its guide**. It uses **hand-set (not seeded)**
line-of-business data and computes genuine risk-attribution, revenue-efficiency, and marginal-contribution
metrics. The `sr()` PRNG is imported but not used for the core LOB figures. No fabricated headline metric
drives the analysis; the only limitation is the small, illustrative dataset.

### 7.1 What the module computes

Per LOB (`lobsEnriched`):

```js
riskContrib = exposure·(100 − score) / Σ_L exposure_L·(100 − score_L) · 100    // % of total risk
revShare    = revenue / TOTAL_REVENUE · 100                                     // % of total revenue
efficiency  = revShare / riskContrib                                            // >1 = efficient
```

The **risk contribution** treats `(100 − score)` as a per-LOB risk intensity and weights it by exposure —
a standard risk-attribution decomposition. **Revenue efficiency** (`revShare/riskContrib`) exceeds 1 when
a LOB earns more revenue share than it consumes risk share (return-on-risk).

**Marginal contribution** (adding `marginalAmount` = $100M to a LOB):
```js
oldPortScore = Σ_L exposure_L·score_L / TOTAL_EXPOSURE                          // exposure-weighted portfolio score
newPortScore = (Σ + marginalAmount·score_L) / (TOTAL_EXPOSURE + marginalAmount) // after injection
```
The difference is the LOB's marginal effect on the portfolio's climate/transition score.

### 7.2 Parameterisation & provenance

| LOB | exposure ($M) | revenue ($M) | score | clients | RWA |
|---|---|---|---|---|---|
| Corporate Banking | 12,400 | 680 | 52 | 180 | 9,200 |
| Investment Banking | 8,200 | 520 | 61 | 45 | 6,100 |
| Wealth Management | 5,800 | 340 | 72 | 2,200 | 2,900 |
| Insurance | 4,200 | 280 | 48 | 120 | 3,800 |
| Transaction Banking | 3,600 | 220 | 68 | 850 | 1,800 |
| Markets | 6,800 | 450 | 58 | 65 | 5,200 |

All figures are **hand-set illustrative values** (not seeded), internally consistent (RWA < exposure,
client counts sensible per business line). The 6 LOBs are the real universal-bank business lines.

### 7.3 Calculation walkthrough

1. `lobsEnriched` computes riskContrib, revShare, efficiency per LOB.
2. `radarData` normalises 6 dimensions (exposure/revenue/score/clients/RWA/efficiency) to a 0–100 radar.
3. `marginalData` recomputes portfolio score under a $100M injection into each LOB.
4. `benchmarkData` and `actions` flag LOBs with score < 60 or efficiency < 1 for remediation.

### 7.4 Worked example (Corporate Banking risk contribution)

Denominator `Σ exposure·(100−score)`:

| LOB | exposure·(100−score) |
|---|---|
| Corporate | 12,400·48 = 595,200 |
| IB | 8,200·39 = 319,800 |
| Wealth | 5,800·28 = 162,400 |
| Insurance | 4,200·52 = 218,400 |
| Transaction | 3,600·32 = 115,200 |
| Markets | 6,800·42 = 285,600 |
| **Σ** | **1,696,600** |

Corporate Banking `riskContrib = 595,200/1,696,600 = 35.1%` of portfolio risk.
`revShare = 680/2,490 = 27.3%`; `efficiency = 27.3/35.1 = 0.78` → **inefficient** (consumes more risk than
it earns), flagging it for the action list. (The guide's headline "Corporate Banking 42% of risk" is
close in spirit; exact value 35.1% under this dataset.)

### 7.5 Data provenance & limitations

- **LOB data is hand-set illustrative** (not `sr()` seeded) — internally consistent but not a real bank's
  book.
- **Risk attribution and efficiency math are genuine** and standard.
- The `(100 − score)` risk intensity is a linear proxy; a production model would use RWA-based or
  economic-capital-based risk weights rather than a 0–100 transition score.
- Only 6 LOBs — illustrative granularity.

**Framework alignment:** The risk-attribution and return-on-risk-share design aligns with **RAROC /
economic-capital allocation** practice and **Basel IV / BCBS 239** risk-data aggregation. The marginal-
contribution analysis mirrors incremental-VaR / marginal-RWA thinking. The method is sound; the only
enhancement is substituting real exposure/RWA/PD data and an economic-capital risk weight for the
transition-score proxy — no new model architecture is required, so no §8 specification is warranted here.

## 9 · Future Evolution

### 9.1 Evolution A — Economic-capital risk weights replacing the transition-score proxy (analytics ladder: rung 2 → 3)

**What.** §7 rates this module methodologically sound: risk attribution (`exposure·(100−score)/Σ`), revenue efficiency, and marginal-contribution analysis are genuine RAROC-style mathematics over hand-set (not seeded) LoB data. Its two documented limitations are the linear `(100−score)` risk-intensity proxy and the 6-LoB illustrative granularity. Evolution A upgrades the risk weight to an economic-capital basis: each LoB's risk contribution derives from RWA (the `LOBS` array already carries an `rwa` field that the attribution ignores) blended with a climate-stress delta, and the marginal-contribution tab computes marginal RWA rather than a score-weighted average shift.

**How.** (1) Recompute `riskContrib` as `EC_L/ΣEC` where `EC_L = rwa_L·capital_ratio·(1 + climate_stress_L)`, with the stress multiplier taken from the NGFS PD multipliers already codified in the sibling `fi-taxonomy-pcaf-bridge` module. (2) Efficiency becomes revenue share over EC share — true return-on-economic-capital ranking. (3) LoB data moves to a small backend table so the FI desk modules share one consistent book (same spine as the fi-client-portfolio-analyzer evolution), with LoB granularity extendable beyond 6.

**Prerequisites.** Agreement on a platform capital ratio constant (or org setting); shared FI data spine seeded (roadmap D0). **Acceptance:** attribution percentages recompute from RWA fields and sum to 100; the marginal tab's ΔEC for +$100M in a named LoB is hand-verifiable from the documented formula.

### 9.2 Evolution B — CRO allocation-review copilot (LLM tier 1)

**What.** A copilot for the quarterly business-review use case: "which LoB is the least efficient user of risk capacity and what would rebalancing look like?" It narrates the module's own computed surface — efficiency ranking, radar comparison, the `actions` list (score<60 or efficiency<1 triggers) — and explains the methodology honestly, including §7's caveat that intensity is proxy-based until Evolution A lands.

**How.** Tier-1 RAG copilot per the roadmap pattern: system prompt assembled from this atlas page (§5 formula, §7.1 derivations, §7.5 limitations are the grounding corpus), answering strictly from rendered page state plus the atlas text. Because the module's math is already genuine, this is one of the CT-sprint pages where a copilot ships credibly before any backend work — the exemplar's "first shippable slice is explanation-only" pattern applies directly. Cross-references (e.g. "concentration detail lives in fi-concentration-monitor") come from the atlas interconnection graph, not model memory.

**Prerequisites.** pgvector corpus embedding of this module's atlas record; no backend prerequisite for tier 1. **Acceptance:** on the bench_llm golden set for this module, every efficiency/contribution figure quoted matches the page's computed values, and the copilot correctly states that LoB data is illustrative hand-set demo data when asked about data provenance.