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
