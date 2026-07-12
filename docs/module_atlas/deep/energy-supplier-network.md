## 7 · Methodology Deep Dive

The guide (`HHI = Σ(spend_share_i²)`; `Critical = single_source AND transition_score < 40`) is
implemented as written. This is a supply-chain concentration dashboard over a hand-authored 40-supplier
table with real oilfield-services vendor names and realistic spend/score attributes. No PRNG, no hidden
model.

### 7.1 What the module computes

Data layer: 40 suppliers with `tier (1/2/3)`, `cat`, `country`, `spend ($M)`, `score` (transition
readiness 0–100), `critical` (flag), `plan` (engagement status). Derived quantities:

```js
totalSpend = Σ spend
avgScore   = round( Σ score / n )                     // guarded n≥1
// Category concentration (Herfindahl-Hirschman on spend shares):
total = Σ spends_in_category
hhi   = round( Σ (spend_i / total × 100)² )           // 0–10,000 scale
```

Critical-dependency identification uses the pre-set `critical` flag (which encodes the guide's
"single-source + low-transition-score" logic in the data) combined with `score` and `plan`.

### 7.2 Parameterisation / scoring rubric

| Field | Range/values | Provenance |
|---|---|---|
| `tier` | 1 (10 suppliers), 2 (15), 3 (15) | Supply-chain tiering |
| `spend` | $12–920M | Realistic vendor spend (editorial) |
| `score` | 22–74 | Transition-readiness score (hand-set) |
| `critical` | boolean | Single-source / strategic dependency |
| `plan` | Approved / Submitted / In Progress / Not Requested | Engagement status |
| HHI thresholds | >2,500 = high concentration | Standard antitrust/DOJ HHI band |

Supplier names are **real** oilfield-services and industrial vendors (Schlumberger, Halliburton, Baker
Hughes, TechnipFMC, Siemens Energy, BASF Catalysts…); the spend and score figures are editorial but
plausible (SLB $820M spend, score 58; Chinese Tier-3 vendors low scores 22–25).

### 7.3 Calculation walkthrough

Load the 40-supplier table → apply the tier filter → KPIs: total spend, average transition score,
critical-supplier count → per-category HHI computes each category's spend concentration → the
concentration-risk tab flags categories above the 2,500 HHI threshold → the critical-dependencies tab
lists flagged suppliers with low transition scores → the engagement tracker groups by `plan` status.

### 7.4 Worked example

**HHI for the "Refining Catalysts" category** (BASF Catalysts $210M score 68; Honeywell UOP $185M
score 65):
```
total = 210 + 185 = $395M
shares = 210/395 = 53.2%,  185/395 = 46.8%
HHI = round(53.2² + 46.8²) = round(2830 + 2190) = 5,020
```
An HHI of ≈5,020 (well above the 2,500 high-concentration threshold, and near the 5,000 duopoly
level) flags Refining Catalysts as a concentrated, single-points-of-failure category — exactly the
supply-chain-resilience signal the module surfaces. By contrast a category split across five roughly
equal suppliers would score ≈2,000 (below threshold).

### 7.5 Companion analytics

- **Tier 1 detail:** the 10 strategic suppliers with spend, transition score and engagement plan.
- **Critical dependencies:** suppliers flagged `critical=true` with `score < ~50` — the highest-risk
  intersection of dependency and transition unreadiness.
- **Engagement tracker:** distribution of transition-plan status (Approved/Submitted/In
  Progress/Not Requested), the stewardship pipeline for supplier decarbonisation.

### 7.6 Data provenance & limitations

- **Supplier names are real; spend and transition-score attributes are editorial** (hand-authored,
  not disclosed data). No PRNG is used — the table is static.
- The HHI is computed correctly (`Σ share²`) but only over the *displayed* suppliers per category, not
  the full market — so it measures internal-portfolio concentration, not industry-wide concentration.
- `critical` and `plan` are pre-set flags, so the guide's live `single_source AND score<40` rule is
  encoded in the data rather than evaluated at runtime.

**Framework alignment:** **ISO 20400 (Sustainable Procurement)** — the supplier transition-scoring and
engagement-plan tracking mirror ISO 20400's supplier-development approach; **CDP Supply Chain** — the
transition-readiness score and disclosure-request status map to CDP's supplier engagement program;
the **HHI** concentration measure is the standard Herfindahl-Hirschman index (0–10,000, >2,500 = high
concentration) used in competition and supply-chain-risk analysis.
