## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 synthetic climate-related shareholder resolutions (`CAMPAIGNS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`)
against generically-named companies (`Co. A`…`Co. Z`, `Co. A1`…), each carrying resolution type, filing
investor (8 real institutional filers: CalPERS, NBIM, APG, CDPQ, LGIM, BNP Paribas AM, Amundi, USS),
management's own recommendation, and a support-percentage outcome that is **causally linked** to that
recommendation:

```js
baseSupport = mgmtRec==='For' ? 55 : mgmtRec==='Abstain' ? 40 : 25      // management stance sets a floor
supportPct  = clamp(5, 99, baseSupport + sr()×35)                       // + up to 35pp of random variation
outcome     = supportPct>=50 ? 'Passed'
            : sr()>0.6 ? 'Withdrawn' : sr()>0.3 ? 'Management Opposed' : 'Failed'
```

This is a meaningful design choice relative to sibling modules: **support outcome is not independently
random** — it is conditioned on management's recommendation, correctly modelling the real-world dynamic
that resolutions recommended "For" by management pass far more often than those management recommends
"Against."

### 7.2 Parameterisation

| Management recommendation | Base support | Support range after +sr()×35 |
|---|---|---|
| For | 55 | 55–90% |
| Abstain | 40 | 40–75% |
| Against | 25 | 25–60% |

| Field | Range | Provenance |
|---|---|---|
| `resolutionType` | Say on Climate / Net Zero / Disclosure / Board / Exec Pay | Real, recognised categories of climate-linked shareholder resolutions |
| `coFilers` | `floor(sr()×12)` → 0–11 | Synthetic |
| `postEngagementCommitment` | `outcome==='Passed' ? sr()>0.3 : sr()>0.7` | Conditioned — passed resolutions more likely (70% base rate) to yield a company commitment than failed/withdrawn ones (30% base rate) |
| `engagementDuration` | `2 + floor(sr()×22)` → 2–23 months | Synthetic |
| `issScore` | `round(30+sr()×65)` → 30–95 | Synthetic ISS-governance-style score |

### 7.3 Calculation walkthrough

1. `filtered` applies sector/type/outcome/year/minSupport/minDuration filters.
2. Headline KPIs guarded via `n = Math.max(1, filtered.length)`: `avgSupport`, `pctPassed`, `pctCommit` —
   all safe against empty-filter division.
3. `byType`: per resolution-type breakdown (`avgSupport`, `count`, `pctPassed`), filtering out types with
   zero matches (`.filter(Boolean)`) rather than showing a spurious 0/0 row.
4. **Post-Engagement tab**: presumably cross-tabs `postEngagementCommitment` against `outcome`, testing
   whether passed resolutions actually translate to company commitments — a legitimate question given the
   conditional construction in §7.1.
5. **ISS Scoring tab**: `issScore` likely correlated visually against `supportPct` in a scatter or table,
   though the two fields are independently seeded (`sr(i×47)` vs `sr(i×23)`), so no causal relationship is
   actually encoded between an ISS-style governance score and vote support.

### 7.4 Worked example

Resolution `i=12`, `managementRecommendation = MGMT_RECS[floor(sr(19×12)×3)]`, illustrative draw =
`'Against'` → `baseSupport = 25`. `supportPct = clamp(5,99, 25 + sr(23×12)×35)`, illustrative
`sr()≈0.62` → `25+21.7=46.7%` → since `<50`, not "Passed"; `outcome` then checks `sr(29×12)` — illustrative
`0.45` → falls in the `>0.3` bracket → `'Management Opposed'`.

Contrast with a `'For'`-recommended resolution: `baseSupport=55`, same `sr()=0.62` draw pattern would give
`supportPct=55+21.7=76.7%` → `≥50` → `'Passed'`. This demonstrates the module's core, correctly-modelled
dynamic: identical random variation produces a passing vs. failing outcome purely based on whether
management supported or opposed the resolution.

### 7.5 Companion analytics on the page

- **Investor Coalitions tab** — likely aggregates by `filingInvestor` (8 real institutional investors) and
  `coFilers`, a plausible view of which large asset owners lead climate-resolution filing activity.
- **Management Response tab** — cross-tab of `managementRecommendation` vs `outcome`, directly testing the
  §7.1 causal construction.

### 7.6 Data provenance & limitations

- **All 60 campaigns are synthetic**; company names are generic placeholders (`Co. A`, `Co. B`…), unlike the
  sibling `shareholder-activism` module which uses real target names — a deliberate anonymisation choice for
  this module.
- The management-recommendation → support-percentage causal link (§7.1–7.2) is the module's strongest
  methodological feature among the shareholder-engagement family — it encodes a genuine, well-documented
  real-world dynamic rather than treating outcome as independent noise.
- `issScore` and `supportPct` are independently seeded despite ISS voting recommendations being, in reality,
  a significant driver of actual shareholder vote outcomes — a production model would condition `supportPct`
  partly on `issScore` the same way it is already conditioned on `managementRecommendation`.
- The 8 named institutional filers (CalPERS, NBIM, APG, CDPQ, LGIM, BNP Paribas AM, Amundi, USS) are real,
  well-known asset owners active in climate shareholder engagement (several are Climate Action 100+
  signatories), lending topical credibility to the filer roster even though assignment per campaign is
  random.

**Framework alignment:** the resolution-type taxonomy (Say on Climate, Net Zero, Disclosure, Board, Exec
Pay) reflects real categories used by proxy advisors and ESG resolution trackers (As You Sow's Proxy
Preview, Ceres) · the management-recommendation-conditioned support model is a genuine (if simplified)
reflection of real proxy-voting dynamics, where ISS/Glass Lewis and management recommendations are the two
dominant predictors of shareholder resolution vote outcomes.
