## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 synthetic activist campaigns (`CAMPAIGNS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) pair 20 real named
activist investors (Elliott Management, Carl Icahn, Third Point, Engine No.1, As You Sow, Follow This,
ShareAction — a mix of financial and ESG-focused activists) against 60 real named large-cap targets
(ExxonMobil, Shell, Disney, Salesforce, BHP, Barclays, etc., cycled via `i%60`). Each campaign carries a
type, status, stake size, and outcome metrics:

```js
type    = ['Board Seat','Strategic Review','ESG Proposal','M&A Opposition','Capital Return',
           'Governance Reform','Climate Action','Compensation Reform'][floor(sr()×8)]
status  = ['Active','Settled','Won','Lost','Withdrawn'][floor(sr()×5)]
stakeMktValM = round(sr()×5000 + 100)                          // $100M–$5.1B
stockImpact  = round((sr()−0.4)×30, 1)                         // −12% to +18%, mean-shifted positive
```

### 7.2 Parameterisation

| Field | Range/formula | Provenance |
|---|---|---|
| `stakeOwnershipPct` | `sr()×8+0.5` → 0.5–8.5% | Synthetic; plausible activist-stake range (activist campaigns typically disclosed at 5%+ Schedule 13D threshold in the US) |
| `boardSeatsWon` | `Board Seat` type only: `round(sr()×3+1)` → 1–4 | Synthetic |
| `durationMonths` | `sr()×24+3` → 3–27 months | Synthetic; plausible real-world campaign duration |
| `proxyFight` | `sr()>0.7` → 30% | Synthetic |
| `esgFocus` | `sr()>0.5` → 50% | Synthetic |
| `supportPct` (shareholder vote support) | `sr()×40+20` → 20–60% | Synthetic |
| `mediaAttention` | High/Medium/Low, `sr()`-assigned | Synthetic |

`stockImpact = (sr()−0.4)×30` is mean-shifted: with `sr()` uniform on [0,1), the mean of `(sr()−0.4)` is
+0.1, so `stockImpact` has an expected value of `+3%` — i.e. the dataset is constructed to show activist
campaigns *on average* modestly boosting target stock price, consistent with academic literature findings
(e.g. Brav et al.) that activist interventions on average generate small positive abnormal returns, though
here it is a designed constant rather than a measured empirical result.

### 7.3 Calculation walkthrough

1. `filtered` applies search (target/activist name) and sector filters over the 60 campaigns.
2. `stats` computes guarded (`|| 0` on `avgSupport`) portfolio aggregates: campaign count, active count,
   total stake value (`Σ stakeMktValM × 1e6`, formatted with `$` prefix — appropriate here since activist
   campaigns are predominantly US/UK situations), won count, ESG-focused count, average support %, proxy
   fight count.
3. `activistRank`: groups campaigns by `activist`, computing `campaigns` (count), `wins` (status='Won'
   count), and `stake` (Σ stakeMktValM) per activist, sorted descending by campaign count, top 12 shown —
   `winRate = wins/campaigns×100`.
4. `typeDist`: count of campaigns per `campaignType`, sorted descending.
5. **Outcome Analysis tab**: `stockImpact` binned into 4 buckets (`<-10%`, `-10 to 0`, `0 to 10%`, `>10%`)
   and a support%-vs-stock-impact scatter across all filtered campaigns — a legitimate visual for testing
   whether higher shareholder support correlates with better stock outcomes (though the underlying data is
   synthetic, so no real correlation exists to discover).

### 7.4 Worked example

Filtering to `sector='Energy'`: campaigns against ExxonMobil, Shell, Chevron, BP, TotalEnergies (per the
fixed `targets`/`secs` index alignment). For a specific campaign `i=3` targeting Disney (`i%60` cycling
places Disney at index 3): `activist = ACTIVISTS[floor(sr(21)×20)]`, `type = [...][floor(sr(33)×8)]`,
illustrative draw → `type='ESG Proposal'`, `status='Active'`, `stakeMktValM ≈ round(100+5000×sr(51))` ≈ e.g.
$2,340M, `stockImpact ≈ (sr(129)−0.4)×30` ≈ e.g. +4.2%.

`activistRank` for, say, "Follow This" (a real climate-focused activist shareholder group): if it appears
in 3 of the 60 campaigns with 1 win, `winRate = 1/3×100 = 33%`.

### 7.5 Companion analytics on the page

- **Campaign Type Distribution / Status Breakdown pies** — straightforward counts, feeding the Campaign
  Dashboard.
- **Largest Active Stakes** — top-12 by `stakeMktValM` among `status='Active'` campaigns only.
- **Most Active Investors / Win Rate by Activist** — the Activist Profiles tab's two headline charts,
  ranking the 20 named activists by campaign volume and computed win rate.

### 7.6 Data provenance & limitations

- **All 60 campaigns are synthetic** — activist and target names are real, well-known market participants,
  but the specific campaign type, status, stake size, outcome, and stock impact are fabricated per session
  via `sr(seed)=frac(sin(seed+1)×10⁴)`, not linked to actual 13D filings, proxy statements, or campaign
  histories.
- `stockImpact`'s positive mean-shift (§7.2) is a designed characteristic of the seed formula, not a
  measured empirical finding — it happens to be directionally consistent with published activism research,
  but should not be cited as evidence of that research.
- The activist roster mixes financial activists (Elliott, Icahn, Third Point) with dedicated climate/ESG
  shareholder-engagement organisations (As You Sow, Follow This, ShareAction, Green Century) — a reasonable
  real-world taxonomy, but campaign-type assignment (`type`) is independently random per campaign, so a
  financial activist like Carl Icahn can be randomly assigned a "Climate Action" campaign type, which would
  be atypical in reality.

**Framework alignment:** the campaign-type taxonomy (Board Seat, Strategic Review, ESG Proposal, M&A
Opposition, Capital Return, Governance Reform, Climate Action, Compensation Reform) reflects real,
recognised categories of shareholder activist campaigns · the activist roster is accurate and current
(includes major financial activists and the leading climate-focused shareholder engagement NGOs/investors)
· the positive-mean stock-impact construction is loosely consistent with academic activism-return literature
(Brav, Jiang, Partnoy, Thomas — average positive abnormal returns around activist campaign announcements),
though not derived from that literature in this implementation.
