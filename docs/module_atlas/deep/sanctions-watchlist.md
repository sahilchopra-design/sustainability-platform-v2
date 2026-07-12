## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `ESG Controversy Overlap
> Score = Sanctioned Entity ESG Controversy Count / Max Controversy Count x 100`, describing a
> dual-dimension score combining sanctions status with RepRisk/MSCI ESG controversy severity.
> **No ESG or controversy data exists anywhere in this module.** There is no RepRisk field, no
> MSCI ESG controversy field, and no combined score. The module is a pure **sanctions-list watch
> tool** — `riskScore` is a seeded PRNG value (`70 + sr(i×3)×30`, i.e. always 70-100) representing
> generic "model risk," with no ESG dimension whatsoever.

### 7.1 What the module computes

```
riskScore = 70 + floor(sr(i x 3) x 30)          // 70-99, per SDN-style watchlist entry
avgRiskScore = Sum(riskScore) / n
progBreakdown[p] = count of entries where prog === p        // per PROG_TYPES
natBreakdown[n]  = count of entries where nat === n          // per NATIONALITIES
totalCriticalEntries = Sum(LISTS[i].entries) where LISTS[i].critical === true
```

### 7.2 Parameterisation

| Field | Range/Content | Provenance |
|---|---|---|
| `PROG_TYPES` | SDN, BLOCKED, EO13662, EO14024, IRAN, RUSSIA, DPRK, CUBA, VENEZUELA, CYBER | Real OFAC sanctions-program designations, correctly named |
| `NATIONALITIES` | RU, IR, CN, KP, VE, SY, CU, BY, MM, AF | Real ISO country codes for commonly-sanctioned jurisdictions |
| `riskScore` | `70 + floor(sr(i×3)×30)` → 70-99 | Synthetic demo, artificially compressed into a narrow high-risk band (nothing on this list ever scores below 70) — appropriate for a "confirmed match" list but the guide's implication of a graduated 0-100 scale combining two independent risk dimensions is not what this produces |
| `matchTypes` | Exact Name, Fuzzy Name (87%), Alias Match, LEI Cross-ref, ISIN Cross-ref | Realistic entity-resolution match-type taxonomy, assigned round-robin (`i % 5`), not from an actual fuzzy-matching algorithm |
| `actions` | Block Transaction, Enhanced DD Required, Flag for Review, Auto-cleared, Escalate to Compliance | Realistic compliance-workflow action taxonomy, assigned round-robin, not derived from `riskScore` or `matchType` |
| `LISTS` (11 rows) | authority, entries, lastUpdate, type, coverage, critical flag | Static reference table of real sanctions-list sources (OFAC, UN, EU, etc.) with plausible entry counts |

### 7.3 Calculation walkthrough

1. `SDN_ENTRIES` (N synthetic rows) cycle through `PROG_TYPES`/`NATIONALITIES`/`matchTypes`/
   `actions` via modulo indexing (`i % 10`, `i % 5`) rather than independent random sampling —
   so the sequence of programs/nationalities/match-types/actions is deterministic and repeating,
   not representative of a real list's distribution.
2. `avgRiskScore` is a straight mean over all entries; because every entry is seeded into the
   70-99 band, this average will always land near 84-85 regardless of the actual underlying watch
   list composition.
3. `progBreakdown`/`natBreakdown` are simple `filter().length` counts per category — genuine
   aggregations, but over the synthetic, round-robin-generated entry set.
4. `totalCriticalEntries` sums the static `LISTS.entries` field for lists flagged `critical: true`
   — the one aggregation drawing from genuinely static (not randomly generated) reference data.

### 7.4 Data provenance & limitations

- No ESG or controversy dimension exists in the code despite being the module's namesake
  methodology in the guide — this module cannot answer "which sanctioned entities also have severe
  ESG controversies," which is its stated purpose.
- `riskScore`'s narrow 70-99 range means the "risk score" cannot meaningfully discriminate between
  entries — every match looks equally severe.
- Match-type and compliance-action assignment via modulo cycling (not tied to `riskScore` or actual
  fuzzy-match confidence) means the displayed "Fuzzy Name (87%)" or "Block Transaction" labels
  don't reflect any real entity-resolution or risk-based decisioning logic.
- `LISTS` entry counts and `PROG_TYPES`/`NATIONALITIES` taxonomies are the module's most credible
  content — real regulatory program/jurisdiction names, correctly reproduced.

**Framework alignment:** OFAC SDN List, UN Consolidated Sanctions List, EU Financial Sanctions
Files (list sources named correctly, not live-synced) · RepRisk Global Watch List and MSCI ESG
Controversy Scores (named in the guide as the ESG-dimension data source; **entirely absent** from
the implementation) · LEI/ISIN cross-referencing (named as a match-type category, not implemented
as an actual resolution algorithm).
