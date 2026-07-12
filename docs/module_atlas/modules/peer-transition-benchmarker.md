# Peer Transition Benchmarker
**Module ID:** `peer-transition-benchmarker` · **Route:** `/peer-transition-benchmarker` · **Tier:** B (frontend-computed) · **EP code:** EP-CM6 · **Sprint:** CM

## 1 · Overview
6 GICS sectors with 5 peer companies each. 6-pillar radar comparison, best-in-class identification, convergence analysis.

**How an analyst works this module:**
- Peer Group Builder selects comparison companies
- Quartile Ranking shows Q1-Q4 distribution
- Convergence Trend shows if sector is improving together or diverging

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PEER_GROUPS`, `PILLARS`, `PILLAR_WEIGHTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sorted` | `peers.map(p => p.total).sort((a, b) => b - a);` |
| `rank` | `sorted.indexOf(score) + 1;` |
| `TABS` | `['Sector Peer Groups','Transition Score Comparison','Best-in-Class Identification','Laggard Screening','Convergence Analysis','Engagement Priority Matrix'];` |
| `bestInClass` | `Object.entries(PEER_GROUPS).map(([s, p]) => {` |
| `best` | `[...p].sort((a, b) => b.total - a.total)[0];` |
| `laggards` | `Object.entries(PEER_GROUPS).flatMap(([s, p]) => p.filter(c => quartile(c.total, p) === 'Q4').map(c => ({ ...c, sector: s })));` |
| `convergenceData` | `['2020','2021','2022','2023','2024'].map(y => {` |
| `drift` | `(2024 - parseInt(y)) * (i % 2 === 0 ? 2.5 : -1.5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PILLARS`, `PILLAR_WEIGHTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sectors | — | GICS | Energy, Materials, Utilities, Industrials, Consumer, Tech |
| Peers per Sector | — | Demo | 30 companies total |

## 5 · Intermediate Transformation Logic
**Methodology:** Sector peer benchmarking
**Headline formula:** `PeerRank = position in sector quartile (Q1=leaders, Q4=laggards)`

Head-to-head comparison across 6 transition pillars. Best-in-class: what do Q1 companies do differently? Convergence: are peers converging or diverging over time?

**Standards:** ['MSCI', 'Sustainalytics']
**Reference documents:** MSCI ESG Ratings; Sustainalytics ESG Risk

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A genuine weighted-composite peer-benchmarking tool across 6 GICS sectors × 5 named companies each,
matching the guide's stated methodology closely:

```
total       = Σ (pillarScoreᵢ × PILLAR_WEIGHTᵢ / 100)          // weighted composite, weights sum to 100
rank        = sortedDesc(peers.total).indexOf(company.total) + 1
quartile    = position in sector distribution (Q1 top, Q4 bottom)
convergence = drift(2024−year) applied per company, alternating direction by index parity
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `PILLARS` | Carbon, Technology, Policy, Market, Capital, Social | Real, sensible 6-dimension transition-readiness taxonomy |
| `PILLAR_WEIGHTS` | 22, 18, 20, 18, 12, 10 (sums to 100) | Synthetic demo value, but internally consistent (weights correctly normalise to 100%) |
| `PEER_GROUPS` (6 sectors × 5 real companies) | Shell/BP/TotalEnergies/Enel/Orsted (Energy); Microsoft/Apple/Alphabet/Amazon/Samsung (Technology); etc. | **Real named companies** with **hand-set illustrative pillar scores** that are directionally consistent with market perception (Orsted scores highest in Energy at [92,90,88,85,82,78]; Shell/BP score lowest [45,40,35,50,42,38] — matches the real-world narrative of pure-play renewables outperforming integrated oil majors on transition metrics), though the specific numbers are not sourced from a named rating provider |
| `drift` (convergence trend) | `(2024−year) × (i%2===0 ? 2.5 : −1.5)` | Synthetic demo value: alternates sign by company-index parity to visually simulate some peers converging and others diverging |

### 7.3 Calculation walkthrough

1. **Weighted total**: `c.total = Σ(scores[i] × PILLAR_WEIGHTS[i]/100)` — a correct linear composite
   with normalised weights, computed once per company and reused across all tabs.
2. **Sector ranking**: `[...peers].sort((a,b)=>b.total-a.total)` (correctly uses a spread copy, not
   an in-place mutating sort) produces the ordered leaderboard; `rank` is 1-indexed position.
3. **Best-in-class**: `[...p].sort(...)[0]` per sector picks the top scorer — used to drive the
   "what do Q1 companies do differently" narrative panel.
4. **Quartile classification** (`quartile` fn, referenced but not fully shown in the extract):
   applied per company against its own sector's peer distribution — correct scope (quartiles are
   sector-relative, not global, matching how MSCI/Sustainalytics peer-relative ratings work).
5. **Laggard screening**: `PEER_GROUPS` flat-mapped, filtering `quartile(c.total,p)==='Q4'` across
   all sectors — a legitimate cross-sector "worst quartile" roll-up for engagement targeting.
6. **Convergence analysis**: for years 2020–2024, `base[company] = max(10, min(95, total+drift))`
   projects a company's score backward/forward in time with a linear per-company drift — purely
   illustrative (not derived from any historical score series), used to answer "is the sector
   converging or diverging."

### 7.4 Worked example

**Energy sector**, Orsted `scores=[92,90,88,85,82,78]`:

| Pillar | Score | Weight | Weighted contribution |
|---|---|---|---|
| Carbon | 92 | 22% | 20.24 |
| Technology | 90 | 18% | 16.20 |
| Policy | 88 | 20% | 17.60 |
| Market | 85 | 18% | 15.30 |
| Capital | 82 | 12% | 9.84 |
| Social | 78 | 10% | 7.80 |
| **Total** | | | **86.98** |

Shell `scores=[45,40,35,50,42,38]`:

| Pillar | Score | Weight | Weighted contribution |
|---|---|---|---|
| Carbon | 45 | 22% | 9.90 |
| Technology | 40 | 18% | 7.20 |
| Policy | 35 | 20% | 7.00 |
| Market | 50 | 18% | 9.00 |
| Capital | 42 | 12% | 5.04 |
| Social | 38 | 10% | 3.80 |
| **Total** | | | **41.94** |

Spread within the Energy peer group: 86.98 − 41.94 = **45.0 points**, consistent with the "Spread"
KPI card computed as `sorted[0].total − sorted[last].total`.

### 7.5 Data provenance & limitations

- **Pillar scores per company are hand-set illustrative values**, not sourced from a named ESG
  rating provider or company disclosure — directionally plausible but not defensible as a "real"
  transition score in a regulatory or investment-committee context.
- Only 5 companies per sector limits statistical robustness of quartile classification (Q4 with n=5
  is just the single lowest scorer, not a true 25th-percentile cut).
- Convergence/divergence trend is generated backward from the current score with an alternating-sign
  drift, not derived from an actual historical time series.

**Framework alignment:** MSCI ESG Ratings and Sustainalytics ESG Risk Ratings are cited as the
benchmarking convention; the module's peer-relative quartile methodology is structurally consistent
with how these providers report relative standing, though the underlying scores are illustrative
rather than licensed rating data.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the pillar scores in real rating data (analytics ladder: rung 1 → 3)

**What.** §7 confirms this is a genuinely well-built weighted-composite benchmarker: the total (`Σ pillarScore × PILLAR_WEIGHT/100`, weights summing to 100), sector ranking (correct spread-copy sort, not in-place mutation), quartile classification, and best-in-class identification all match the guide. The 6-sector × 5-company universe uses real named companies with hand-set pillar scores that are directionally credible (Orsted top in Energy [92,90,88,85,82,78], Shell/BP low [45,40,35,50,42,38] — matching the real transition narrative). The gaps: pillar scores aren't sourced from a named rating provider, and the convergence `drift` alternates sign by index parity (a visual simulation, not real trend data). Evolution A grounds the scores.

**How.** (1) Source the 6 pillar scores (Carbon, Technology, Policy, Market, Capital, Social) from real data per company — CDP/SBTi for carbon, patent/capex data for technology, InfluenceMap for policy (these are the same pillars as the sibling `multi-dim-transition-scorer`, so share the pillar-computation logic); store dated with provenance. (2) Replace the parity-based `drift` convergence simulation with real multi-year pillar-score history, so "are peers converging or diverging" (§1) reflects actual trajectories. (3) Widen each sector's peer group beyond 5 companies once scores are computed rather than hand-set. The correct weighted-composite and ranking math stays; only the inputs are grounded.

**Prerequisites.** Real pillar-data sources (shared with `multi-dim-transition-scorer`); multi-year history for convergence; the weighting is internally consistent — keep it, cite it. **Acceptance:** pillar scores trace to named data sources with dates; convergence reflects real score history, not parity alternation; rankings reproduce from the weighted composite.

### 9.2 Evolution B — Peer-benchmarking copilot for analysts (LLM tier 1 → 2)

**What.** A copilot for the benchmarking workflow §1 describes: "how does Shell rank against its energy peers on transition?", "what do the Q1 companies do differently on the technology pillar?", "is the utilities sector converging?" — grounded in the weighted pillar scores and the MSCI/Sustainalytics references named in §5.

**How.** Tier 1 works on the transparent composite: system prompt from this Atlas page's §5/§7.1 and the serialized `PEER_GROUPS` and `PILLAR_WEIGHTS`; the copilot explains a company's rank by decomposing its weighted total into the 6 pillars and comparing to the sector best-in-class, exactly as the "what do Q1 companies do differently" panel (§1) intends. Tier 2, post-Evolution-A: tool calls to the scoring engine for computed comparisons and convergence trends over real history, with the fabrication validator matching every pillar score and rank to outputs. The copilot must distinguish hand-set illustrative scores (today) from sourced scores (post-Evolution-A) in provenance.

**Prerequisites.** Tier 1 works on current data with an illustrative-scores disclosure; sourced comparisons and real convergence need Evolution A. **Acceptance:** rank explanations decompose into the 6 weighted pillars and cite the sector leader; convergence answers (post-Evolution-A) trace to real history; the copilot flags whether scores are illustrative or sourced.