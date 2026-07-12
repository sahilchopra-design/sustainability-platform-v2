# FI Client Portfolio Analyzer
**Module ID:** `fi-client-portfolio-analyzer` · **Route:** `/fi-client-portfolio-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CT1 · **Sprint:** CT

## 1 · Overview
50 borrowers across 12 NACE high-impact sectors with IFRS 9 staging, transition scores, and watchlist.

**How an analyst works this module:**
- Client Overview shows all 50 borrowers sortable by score/exposure
- Sector Concentration shows TreeMap visualization
- Geography Heatmap shows exposure by 12 regions
- Watchlist filters to high-risk clients with Engage button

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWERS`, `Card`, `LOBS`, `RATING_COLORS`, `RatingBadge`, `SECTOR_COLORS`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `score` | `Math.round(20 + sr(i * 7) * 70);` |
| `totalExposure` | `useMemo(() => BORROWERS.reduce((s, b) => s + b.exposure, 0), []);` |
| `avgScore` | `useMemo(() => Math.round(BORROWERS.reduce((s, b) => s + b.score, 0) / BORROWERS.length), []);` |
| `scoreDistribution` | `useMemo(() => { const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0, exposure: 0 }));` |
| `watchlist` | `useMemo(() => BORROWERS.filter(b => b.score < 40).sort((a, b) => a.score - b.score), []);  const filtered = useMemo(() => { let data = [...BORROWERS];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOBS`, `SECTOR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Borrowers | — | Demo | Across 12 NACE sectors |
| Total Exposure | — | Portfolio | Aggregate client exposure |
| Watchlist | — | Score < 40 | High-risk clients requiring engagement |
| Sector HHI | — | Herfindahl-Hirschman | Moderate sector concentration |

## 5 · Intermediate Transformation Logic
**Methodology:** IFRS 9 + climate overlay
**Headline formula:** `ECL = PD × LGD × EAD; PD_climate = PD_base × (1 + γ × Δscore)`

Each borrower assessed against full taxonomy. IFRS 9: Stage 1 (12m ECL), Stage 2 (lifetime, PD>2x), Stage 3 (impaired). HHI concentration index per sector/geography.

**Standards:** ['IFRS 9', 'Basel IV', 'ECB SREP', 'PCAF']
**Reference documents:** IFRS 9 (IASB); Basel IV (BCBS); ECB SREP Methodology; PCAF Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CT1) promises a full **IFRS 9 + climate
> overlay** — `ECL = PD·LGD·EAD`, `PD_climate = PD_base·(1 + γ·Δscore)`, Stage 1/2/3 staging (PD>2×),
> and HHI concentration. **None of that ECL machinery is in this module's code.** It computes a single
> seeded transition **score** per borrower, a score distribution, a watchlist (score < 40), and total
> exposure. There is no PD, LGD, EAD, ECL, staging, or HHI here (HHI lives in the sibling
> `fi-concentration-monitor`). Documented below.

### 7.1 What the module computes

50 borrowers, each with a seeded transition score and exposure:

```js
score    = round(20 + sr(i·7)·70)          // 20–90 transition score
exposure = round(10 + sr(i·11)·490)        // $10–500M
rating   = scoreToRating(score).label      // A–E band from taxonomyTree
// aggregates:
totalExposure    = Σ exposure
avgScore         = round(Σ score / 50)
scoreDistribution = 10 buckets (0-10 … 90-100), count + exposure per bucket
watchlist        = borrowers with score < 40, sorted ascending
```

`scoreToRating` (from `data/taxonomyTree`) maps the 0–100 score to an A–E rating; sector and region come
from the shared `HIGH_IMPACT_SECTORS` (12 NACE) and `GEOGRAPHIC_REGIONS` tables by modular index.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `BORROWERS` | 50 | Illustrative names (Acme, OilMajor, WindFarm…); score/exposure **seeded** |
| Sector assignment | `i % 12` over `HIGH_IMPACT_SECTORS` | **Real NACE high-impact sector list** (shared taxonomy) |
| Region assignment | `i % N` over `GEOGRAPHIC_REGIONS` | Real region list (shared) |
| `scoreToRating` | A–E bands | Shared taxonomy mapping |
| Watchlist threshold | score < 40 | Hard-coded editorial cut-off |
| `LOBS` | 4 (Corporate/IB/Wealth/Treasury) | Real business lines (modular assignment) |

There is **no** PD/LGD/EAD/ECL parameterisation in the file — the guide's IFRS 9 constants do not exist.

### 7.3 Calculation walkthrough

1. `BORROWERS` seeded once; each gets score, exposure, rating, sector, region, LOB.
2. `totalExposure`, `avgScore` aggregate.
3. `scoreDistribution` bins borrowers into ten score buckets with count + exposure.
4. `watchlist` filters score < 40 (high transition risk) for engagement.
5. Tabs render sector concentration (treemap), geography heatmap, score distribution, and LOB views —
   all descriptive over the seeded set.

### 7.4 Worked example (borrower i = 20 → "OilMajor")

| Step | Computation | Result |
|---|---|---|
| score | round(20 + sr(140)·70) | round(20 + 0.6·70) ≈ 62 |
| exposure | round(10 + sr(220)·490) | ≈ $304M |
| rating | scoreToRating(62) | ~C |
| watchlist? | 62 < 40 | No |

An oil-major scoring 62 (rating C, not watchlisted) illustrates the limitation: the transition score is
seeded, so a high-carbon issuer can score mid-range purely by chance — there is no carbon-intensity or
PD linkage driving it.

### 7.5 Data provenance & limitations

- **All borrower scores/exposures are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`).
- **No IFRS 9 ECL** despite the guide — no PD, LGD, EAD, staging, or climate-conditioned PD.
- **No HHI** in this module (it is in `fi-concentration-monitor`).
- The transition score is a bare 0–100 number with no documented derivation from carbon/transition data.
- Sector/region/LOB taxonomies are real; the values attached are not.

**Framework alignment:** The module gestures at **IFRS 9** staging and **PCAF/ECB SREP** framing in the
guide, and uses a real NACE high-impact sector taxonomy, but implements only a descriptive score/watchlist
view. The genuine climate-conditioned IFRS 9 ECL model exists elsewhere in the platform
(`climate-credit-integration`, which does implement PD×LGD×EAD with NGFS multipliers).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's IFRS 9 climate-overlay ECL is
absent; only a seeded score exists. Below is the production model.

**8.1 Purpose & scope.** Compute climate-conditioned IFRS 9 expected credit loss and staging per borrower
across the 12 high-impact NACE sectors, with a transition score that actually drives PD.

**8.2 Conceptual approach.** Standard IFRS 9 ECL with an NGFS-scenario climate overlay on PD, mirroring
the platform's own `climate-credit-integration` engine and ECB/EBA climate stress-testing practice
(multiplier-on-PD design).

**8.3 Mathematical specification.**

```
TransitionScore_b = f(carbon intensity, SBTi, sector pathway gap)        (0–100, lower = worse)
PD_climate_b = PD_base_b · (1 + γ · (100 − TransitionScore_b)/100 · (M_scenario − 1))
ECL_b = PD_climate_b · LGD_b · EAD_b
Stage: 1 if PD_climate ≤ threshold ; 2 if PD_climate > 2·PD_base (SICR) ; 3 if impaired
Portfolio ECL = Σ_b ECL_b ;  Watchlist = {b : Stage ≥ 2 or TransitionScore < 40}
```

| Parameter | Source |
|---|---|
| PD_base, LGD, EAD | Internal ratings / Basel IRB |
| Scenario multiplier M | NGFS Phase IV (per `climate-credit-integration`) |
| γ sensitivity | Calibrated to stress-test elasticities |
| Carbon intensity, SBTi | `GLOBAL_COMPANY_MASTER` / CDP |

**8.4 Data requirements.** Borrower PD/LGD/EAD, sector, carbon intensity, SBTi status. Platform holds the
NGFS scenario tables and the sibling climate-credit engine; needs a loan-tape join.

**8.5 Validation & benchmarking plan.** Reconcile ECL against the `climate-credit-integration` engine on
overlapping obligors; backtest staging migrations; sensitivity to γ and scenario multiplier.

**8.6 Limitations & model risk.** Transition-score→PD elasticity is uncertain — bound γ and report
sensitivity. Conservative fallback: absent carbon data, apply the sector-average intensity and flag the
proxy (PCAF-style data-quality tag).

## 9 · Future Evolution

### 9.1 Evolution A — Real borrower book with the promised IFRS 9 climate-overlay ECL (analytics ladder: rung 1 → 2)

**What.** The §7 flag is explicit: this tier-B page promises `ECL = PD·LGD·EAD` with `PD_climate = PD_base·(1 + γ·Δscore)` and Stage 1/2/3 staging, but implements none of it — 50 borrowers carry a bare seeded score (`round(20 + sr(i·7)·70)`) and seeded exposure, and the §8 model spec is marked "not yet implemented in code". Evolution A builds the module's first backend vertical: persist a borrower book, and compute the guide's ECL machinery server-side rather than inventing a new method — the platform already has the climate-conditioned ECL pattern in `climate-credit-integration` (PD×LGD×EAD with NGFS multipliers), which §7 itself points to as the genuine implementation to reuse.

**How.** (1) New `fi_borrowers` table (name, NACE sector, region, exposure, PD_base, LGD, transition score) seeded from the platform's demo portfolio (roadmap D0). (2) A route that applies the §8 spec: staging on PD>2× origination, 12-month vs lifetime ECL, climate-stressed PD via the documented γ·Δscore overlay. (3) The page's watchlist and score distribution re-read from the API; TreeMap and heatmap keep their real NACE/region taxonomies.

**Prerequisites.** The seeded-random book must be replaced, not wrapped (documented §7 defect); γ calibration honestly labelled as assumption until loss data exists. **Acceptance:** a borrower detail view shows PD, LGD, EAD, stage, and ECL that reproduce the §8 formulas by hand; watchlist membership changes when a borrower's PD is edited.

### 9.2 Evolution B — Relationship-manager engagement copilot (LLM tier 2)

**What.** The Watchlist tab has an "Engage" button that today leads nowhere analytical. Evolution B makes it real: for a watchlisted borrower, the copilot assembles an engagement brief by tool-calling the module's borrower endpoint plus sibling modules — `fi-concentration-monitor` logic for the borrower's contribution to sector HHI, `fi-net-zero-pathways` for the sector's decarbonisation trajectory — and drafts the client conversation agenda (score drivers, staging risk, what improvement would lift them off the watchlist).

**How.** Tier-2 tool-calling over the Evolution A endpoints (read-only), with the routing edges taken from the atlas interconnection graph rather than free association. The brief's numeric spine (score, exposure, ECL, stage) comes exclusively from tool output; the LLM contributes structure and sector-specific talking points grounded in the embedded atlas corpus for the CT-sprint FI modules.

**Prerequisites.** Evolution A (there is currently no backend to call and the scores are synthetic); RBAC inheritance so a copilot session only sees the user's permitted book. **Acceptance:** an engagement brief for borrower N cites only that borrower's tool-returned values; the fabrication validator passes on 20 consecutive briefs.