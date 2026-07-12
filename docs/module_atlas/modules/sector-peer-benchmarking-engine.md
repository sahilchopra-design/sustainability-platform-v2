# Sector Peer Benchmarking
**Module ID:** `sector-peer-benchmarking-engine` · **Route:** `/sector-peer-benchmarking-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CW2 · **Sprint:** CW

## 1 · Overview
6 sectors × 8 peers with quartile ranking, best-practice identification, and convergence analysis.

**How an analyst works this module:**
- Quartile Ranking shows Q1-Q4 distribution
- Best Practice identifies leader characteristics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_PEERS`, `Badge`, `Card`, `KPI`, `Pill`, `SECTORS`, `SECTOR_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `peers` | `useMemo(() => ALL_PEERS.filter(p => p.sector === selSector).sort((a,b) => b.score-a.score), [selSector]);` |
| `median` | `useMemo(() => Math.round(peers[3]?.score \|\| 0), [peers]);` |
| `q3val` | `useMemo(() => Math.round(peers[5]?.score \|\| 0), [peers]);` |
| `distData` | `useMemo(() => SECTORS.map(s => {` |
| `scores` | `sp.map(p=>p.score).sort((a,b)=>a-b);` |
| `convData` | `useMemo(() => ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'].map((q,qi) => {` |
| `laggards` | `peers.slice(-2);` |
| `engagementTargets` | `useMemo(() => peers.filter((_,i) => i >= 4).map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peers | — | 6×8 | Sector peer groups |
| Convergence | — | Trend | Some sectors converging, others diverging |

## 5 · Intermediate Transformation Logic
**Methodology:** Quartile benchmarking
**Headline formula:** `Quartile = rank(entity_score) within sector peer group`

Q1=leaders (≥75th %ile), Q4=laggards (<25th %ile). Best-practice: what Q1 companies do differently.

**Standards:** ['MSCI', 'Sustainalytics']
**Reference documents:** MSCI ESG Ratings; Sustainalytics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

6 sectors × 8 synthetic peer companies (`genPeers`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) each carry a
composite `score`, `greenCapex` %, `sbtiValidated` boolean, `lobbyingScore`, and a 5-quarter trend
(`q1..q5`). Ranking is by direct array position after sorting, not a computed percentile:

```js
peers  = ALL_PEERS.filter(sector).sort(desc by score)          // 8 peers, sorted
q1     = round(peers[1].score)                                  // 2nd-ranked peer's score, used AS the "Q1" cutoff
median = round(peers[3].score)                                  // 4th-ranked peer's score, used as median
q3val  = round(peers[5].score)                                  // 6th-ranked peer's score, used as "Q3"
```

### 7.2 Parameterisation

| Sector | Base score | Spread (±) |
|---|---|---|
| Financials | 68 | 12 |
| Energy | 42 | 15 |
| Technology | 75 | 10 |
| Industrials | 60 | 13 |
| Healthcare | 70 | 11 |
| Consumer | 65 | 14 |

`score = round(base + (sr()×2−1) × spread)` — a uniform draw in `[base−spread, base+spread]`. Sector
ordering (Technology highest, Energy lowest) reflects a plausible ESG-perception stylised fact but the
specific base/spread pairs are platform-authored constants, not sourced from a named ESG rating vendor.

| Field | Formula | Notes |
|---|---|---|
| `greenCapex` | `round(15 + (sr()×2−1)×12)` → 3–27% | Synthetic |
| `sbtiValidated` | `i % 3 === 0` | **Deterministic by array position**, not `sr()`-random — peers 0, 3, 6 are always SBTi-validated regardless of seed |
| `lobbyingScore` | `round(40 + (sr()×2−1)×25)` → 15–65 | Synthetic |
| `q1..q5` (quarterly trend) | `base + offset ± jitter`, offsets `[-6,-4,-2,0,+2]` | Deliberately increasing trend by construction — every peer's score rises over the 5 quarters by design, not from any modelled improvement driver |

### 7.3 Calculation walkthrough — "quartile" labels are rank positions, not statistical quartiles

1. With exactly 8 peers sorted descending, the code hard-indexes `peers[1]`, `peers[3]`, `peers[5]` as
   Q1/median/Q3 — for N=8 this happens to be a reasonable rank-based approximation of quartile boundaries
   (index 1 ≈ 25th percentile from the top, index 5 ≈ 75th percentile from the top), but it is implemented
   as **fixed array positions**, not a percentile formula — it would silently break if the peer-group size
   ever changed from exactly 8.
2. **Distribution Analysis** (`distData`): for each of the 6 sectors, independently sorts that sector's 8
   scores and extracts `{min:scores[0], q1:scores[1], median:scores[3], q3:scores[5], max:scores[7]}` —
   same rank-position pattern applied sector-by-sector, feeding a box-plot-style chart.
3. **Best Practice Identification** (`bestPractice`): compares the top-2 ("leaders") vs bottom-2
   ("laggards") peers' average `greenCapex`, SBTi-validated count, and `lobbyingScore` — a simple
   leader/laggard contrast, not a regression or driver-attribution analysis.
4. **Convergence Trend** (`convData`): for each of 5 quarters, averages all 8 peers' quarter-indexed score
   per sector — since `q1..q5` are constructed as a monotonically increasing sequence (`base-6` →
   `base+2`), every sector's convergence line trends upward by construction, which cannot demonstrate
   genuine convergence/divergence between sectors (all sectors improve in lock-step by design).
5. **Engagement Priority** (`engagementTargets`): for peers ranked 5th–8th (`i >= 4`), computes
   `potential = round((q1 − score) × 0.6)` — a 60%-of-gap-to-Q1 "improvement potential" heuristic, and
   `priority = score < q3val ? 'High' : 'Medium'`.

### 7.4 Worked example

Financials sector (`base=68, spread=12`), 8 peers sorted descending, illustrative scores:
`[79, 74, 70, 68, 65, 61, 57, 52]` (index 0–7).

| Statistic | Index | Value |
|---|---|---|
| q1 | `peers[1]` | 74 |
| median | `peers[3]` | 68 |
| q3val | `peers[5]` | 61 |

For the peer at index 7 (score 52, a laggard, `i=7 ≥ 4` so included in engagement targets):
`potential = round((74 − 52) × 0.6) = round(13.2) = 13` points of achievable improvement;
`priority = 52 < 61 ⇒ 'High'`.

### 7.5 Companion analytics on the page

- **Peer Group Builder** (Tab 0) — sector-filtered roster table, the base view all other tabs derive from.
- **SBTi validation deterministic pattern**: because `sbtiValidated = i%3===0`, the 1st/4th/7th-ranked peer
  in every sector is always SBTi-validated regardless of their actual score — a company ranked last (i=7)
  in a sector can still show `sbtiValidated: true` since `7%3===1` is false... actually `i=6` (`6%3===0`)
  is validated, meaning the pattern is fixed to positions 0,3,6 (1st, 4th, 7th by rank), independent of
  score magnitude — worth knowing this is a display artefact, not a genuine SBTi registry lookup.

### 7.6 Data provenance & limitations

- **All peer data is synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; company names are generic
  ("Financials Co 1" … "Financials Co 8"), not real issuers.
- **"Quartile ranking" is rank-position indexing on a fixed N=8 peer group**, not a true percentile/quartile
  statistic (`numpy.percentile`-style interpolation) — correct only by coincidence for exactly 8 peers, and
  would need a general formula (e.g. `(n-1)×p` interpolated index) to scale to other group sizes.
- **Convergence Trend cannot show genuine divergence**: the quarterly trend construction guarantees every
  peer's score increases from Q1 to Q5, so cross-sector convergence/divergence patterns are an artefact of
  the seed formula, not a modelled market dynamic.
- `sbtiValidated` is a fixed modulo-3 pattern on rank position, not linked to any real SBTi validation
  registry or to the peer's actual `score`.

**Framework alignment:** MSCI ESG / Sustainalytics named in the guide as the source convention for
quartile-based peer benchmarking (Q1=leaders ≥75th percentile, Q4=laggards <25th percentile) — the *label*
convention is applied, but the underlying statistic is rank-position indexing rather than a computed
percentile · SBTi validation status is referenced as a real-world credibility marker (per SBTi's Corporate
Net-Zero Standard target validation process) though not linked to an actual registry in this module.

## 9 · Future Evolution

### 9.1 Evolution A — True quartile statistics on real peers (analytics ladder: rung 1 → 3)

**What.** Today this tier-B module fakes its own headline concept: "quartile ranking" is rank-position indexing on a fixed N=8 synthetic peer group (`q1 = peers[1].score`, correct only by coincidence at N=8), `sbtiValidated` is a deterministic `i % 3 === 0` pattern, and the §7.6 note shows the Convergence Trend cannot display divergence because every peer's trend rises by construction. Evolution A replaces the generated "Financials Co 1…8" roster with real fundamentals from `GLOBAL_COMPANY_MASTER` (the same source its sibling `sector-benchmarking` already uses) and implements a general interpolated percentile (`(n−1)×p` index) so quartile cutoffs are actual statistics at any peer-group size.

**How.** (1) Port the peer-group median/mean plumbing from `sector-benchmarking` and add `quantile(arr, p)` with linear interpolation; Q1/median/Q3 become computed values with the group size displayed. (2) Replace the platform-authored base/spread constants (§7.2) with observed per-sector score distributions once a numeric ESG composite exists per company. (3) Convergence analysis becomes honest: compute cross-sectional dispersion (IQR width) per quarter from historical snapshots and report whether it narrows, allowing "no convergence" as an outcome. (4) Link `sbtiValidated` to the SBTi target dashboard export (public CSV) instead of the modulo pattern.

**Prerequisites.** Historical score snapshots must be persisted (new table) before the convergence trend can be real; SBTi CSV refresh job. **Acceptance:** quartile cutoffs match `numpy.percentile` on the same array; a seeded declining peer renders a declining trend.

### 9.2 Evolution B — Best-practice explainer copilot (LLM tier 1)

**What.** The module's "Best Practice" tab claims to identify "what Q1 companies do differently" — a qualitative synthesis task the current code can only fake with static text. Evolution B makes this the copilot's job: given the computed Q1 cohort for a sector, it drafts the leader-characteristics narrative from grounded inputs (the cohort's actual `greenCapex`, SBTi status, lobbying scores from page state) and answers "why is this peer Q4?" by citing the specific metrics that placed it below the 25th percentile.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sector-peer-benchmarking-engine/ask`, grounding corpus = this Atlas record plus live page state (selected sector, computed quartile stats). The narrative template is constrained: every characteristic claimed for the Q1 cohort must reference a field present in the peer data; no external company facts. Refusal path for peers outside the loaded sector.

**Prerequisites.** Evolution A first — narrating the current synthetic roster with its rigged upward trends would put authoritative language on fabricated dynamics; the copilot ships only once peers are real and quartiles computed. **Acceptance:** every metric in a best-practice narrative matches a value visible in the peer table; asking about "Financials Co 3" post-migration returns a refusal (no such entity).