# FI Concentration Monitor
**Module ID:** `fi-concentration-monitor` · **Route:** `/fi-concentration-monitor` · **Tier:** B (frontend-computed) · **EP code:** EP-CT5 · **Sprint:** CT

## 1 · Overview
Sector, country, and single-name limits with HHI analysis, traffic light monitoring, and breach history.

**How an analyst works this module:**
- Limit Dashboard shows all limits with traffic lights
- HHI Analysis computes sector and geographic concentration
- Breach History logs past limit exceedances and responses

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BREACH_LOG`, `COUNTRY_LIMITS`, `Card`, `SECTOR_LIMITS`, `SINGLE_NAME`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTOR_LIMITS` | `HIGH_IMPACT_SECTORS.map((s, i) => {` |
| `limit` | `Math.round(2000 + sr(i * 7) * 6000);` |
| `current` | `Math.round(limit * (0.4 + sr(i * 11) * 0.55));` |
| `COUNTRY_LIMITS` | `GEOGRAPHIC_REGIONS.map((r, i) => {` |
| `singleBreaches` | `useMemo(() => SINGLE_NAME.filter(s => s.utilPct > 95).length, []);  const sectorHHI = useMemo(() => { const total = SECTOR_LIMITS.reduce((s, l) => s + l.current, 0);` |
| `geoHHI` | `useMemo(() => { const total = COUNTRY_LIMITS.reduce((s, l) => s + l.current, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sector Limits | — | Risk framework | One per NACE sector |
| HHI (sector) | — | Calculated | Moderate concentration |

## 5 · Intermediate Transformation Logic
**Methodology:** Concentration limit monitoring
**Headline formula:** `HHI = Σ(share_i²); Utilization = CurrentExposure / Limit`

Traffic lights: green (<80% utilization), amber (80-95%), red (>95%). HHI thresholds: >0.25 = highly concentrated, <0.15 = diversified.

**Standards:** ['Basel IV Large Exposures', 'Internal risk framework']
**Reference documents:** Basel IV Large Exposures Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module (EP-CT5) is **methodologically sound and matches its guide**: it computes real
Herfindahl-Hirschman concentration indices and Basel-style traffic-light limit utilisation. The
**limits and exposures are seeded** (`sr()`), but the concentration mathematics is genuine. No §8
model-spec is triggered for the *method*; the only gap is that limits/exposures should come from a real
loan tape.

### 7.1 What the module computes

**Limit utilisation & traffic lights** (sector, country, single-name):
```js
utilPct = round(current / limit · 100)
trafficLight(pct) = pct>95 ? RED : pct>80 ? AMBER : GREEN
breaches = count(utilPct > 95)
```

**HHI concentration** — the genuine Herfindahl index on the 0–10,000 scale:
```js
total = Σ current
sectorHHI = round( Σ ( (current/total · 100)² ) )       // Σ (share%)²
geoHHI    = round( Σ ( (current/total · 100)² ) )       // same, over regions
```

This is the **correct HHI formula** (sum of squared percentage market shares). A perfectly diversified
book of N equal exposures gives HHI = 10,000/N; a single-name book gives 10,000.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `SECTOR_LIMITS` | 12, limit `2000 + sr()·6000`, current `limit·(0.4 + sr()·0.55)` | Over **real NACE high-impact sectors** (shared taxonomy); amounts **seeded** |
| `COUNTRY_LIMITS` | over `GEOGRAPHIC_REGIONS`, limit `3000 + sr()·8000` | Real region list; amounts seeded |
| `SINGLE_NAME` | 10 real names (Shell, BP, TotalEnergies, HSBC, Rio Tinto, ArcelorMittal, NextEra, Enel, Deutsche Bank, BHP) | Real issuers; limits seeded |
| Traffic-light thresholds | 80% / 95% | **Standard** limit-monitoring convention (guide) |
| HHI thresholds | >0.25 highly concentrated, <0.15 diversified (guide) / on 0–10,000 scale: >2,500 / <1,500 | **Real** DOJ/FTC HHI convention |
| `BREACH_LOG` | 12 | Seeded breach history with real response types (limit increased / exposure reduced / waiver) |

### 7.3 Calculation walkthrough

1. `SECTOR_LIMITS`/`COUNTRY_LIMITS`/`SINGLE_NAME` seeded with limit + current exposure → `utilPct`.
2. `trafficLight` classifies each; `*Breaches` count red (>95%).
3. `sectorHHI`/`geoHHI` compute Σ(share%)² over current exposures.
4. `limitSummary` counts green/amber/red across all limit types.
5. `BREACH_LOG` renders the breach register with status and remediation.

### 7.4 Worked example (sector HHI)

Suppose three sectors carry current exposures $3,000M / $2,000M / $1,000M (total $6,000M):

| Sector | share% | share²  |
|---|---|---|
| A | 50.0 | 2,500 |
| B | 33.3 | 1,109 |
| C | 16.7 | 279 |
| **HHI** | — | **≈ 3,888** |

HHI ≈ 3,888 > 2,500 → **highly concentrated** (guide's >0.25 on the 0–1 scale). Utilisation example: a
sector with `current = limit·0.98` → `utilPct = 98` → **RED** breach. Both computations are genuine; only
the exposure amounts are seeded.

### 7.5 Data provenance & limitations

- **HHI and traffic-light logic are real and correct** — the method needs no model spec.
- **Limits and exposures are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`); a production deployment must feed
  the actual credit limit framework and drawn exposures.
- HHI is computed on *current exposure* shares; a regulatory large-exposures view (Basel LEX) would use
  Tier-1-capital-relative measures in addition.
- Single-name list is only 10 issuers — illustrative, not the full book.

**Framework alignment:** The HHI follows the standard **Herfindahl-Hirschman Index** (Σ share², used by
competition authorities and in credit-concentration analysis). Limit traffic lights and the >95% breach
gate reflect standard **internal risk-appetite frameworks** and **Basel IV Large Exposures** monitoring
(single-name ≤ 25% of Tier-1 capital). The only enhancement needed is real data, not a new model —
so no §8 specification is warranted for the concentration method itself; wiring the module to the
platform's loan tape and capital base would complete it.

## 9 · Future Evolution

### 9.1 Evolution A — Loan-tape-fed limits with Tier-1-relative Basel LEX view (analytics ladder: rung 1 → 2)

**What.** §7 gives this module a clean bill on method — the HHI (Σ share², 0–10,000 scale) and 80%/95% traffic-light logic are correct — and names the single gap precisely: limits and exposures are `sr()`-seeded, and the single-name list is 10 illustrative issuers. Evolution A feeds the real machinery real data: persist the limit framework and read current exposures from a portfolio table, then add the regulatory dimension §7.5 explicitly notes is missing — a Basel Large Exposures view measuring single-name exposure against Tier-1 capital (≤25% LEX gate) alongside the internal utilisation view.

**How.** (1) New `fi_limits` table (scope: sector/country/single-name, limit amount, review date) plus exposure aggregation from the shared borrower book built for `fi-client-portfolio-analyzer` (same CT-sprint data spine — one loan tape serving all five FI modules). (2) A `/concentration` route returning utilisation, traffic lights, both HHIs, and LEX ratios given an org's Tier-1 capital input. (3) Breach events written to a real `fi_breach_log` table on threshold crossing instead of the seeded 12-row register, giving the Breach History tab an actual audit trail.

**Prerequisites.** The shared FI borrower/loan-tape table (D0 demo seed acceptable initially); Tier-1 capital as an org-level setting. **Acceptance:** editing an exposure in the loan tape flips the corresponding traffic light and moves the HHI by the hand-computable amount; a >95% crossing appends a breach-log row.

### 9.2 Evolution B — Limit-breach explainer and what-if de-risking copilot (LLM tier 1 → 2)

**What.** A copilot on the Limit Dashboard that answers "why is Metals & Mining red, and what would fix it?" First slice is tier-1 explanation-only over already-rendered page state (utilisation arithmetic, HHI contribution of each sector — pure narration of computed numbers, viable pre-backend). The tier-2 slice runs what-ifs as tool calls against the Evolution A `/concentration` route: "if we sell down $400M of Shell, does the single-name light clear and where does sector HHI land?"

**How.** Tool schema wraps `/concentration` with an overrides parameter (exposure deltas), so counterfactuals are engine-computed, never LLM-arithmetic. System prompt grounded in this page's §7 (correct HHI convention, DOJ/FTC 2,500/1,500 thresholds, Basel LEX 25% rule already documented there). Answers must state that limits derive from the internal risk-appetite framework, not regulation, except where the LEX view applies.

**Prerequisites.** Tier-2 what-ifs require Evolution A (there is no endpoint today — the module is frontend-computed); tier-1 explainer requires only corpus embedding. **Acceptance:** a de-risking recommendation's before/after HHI and utilisation figures each match a logged tool call; the copilot refuses to estimate breach probability (nothing in the module computes it).