## 7 · Methodology Deep Dive

The guide's `Gap = EstimatedLiability − CurrentProvision` is implemented exactly, and the NGFS
scenario overlay (accelerated retirement + cost multiplier) matches the "scenario-accelerated"
description. The module is faithful to its guide; the only simplification worth flagging is that
provisions and estimated costs are **undiscounted nominal figures**, whereas an IFRS/GAAP Asset
Retirement Obligation is a discounted present value that unwinds over time (see §7.6).

### 7.1 What the module computes

The data layer is a **hand-authored 19-asset table** (`est_cost_mn`, `provision_mn`, `retirement`,
`bond_required`). Headline arithmetic:

```js
totalEst     = Σ est_cost_mn
totalProv    = Σ provision_mn
gap          = totalEst − totalProv
fundingRatio = totalProv / totalEst × 100      // %
```

Per-asset funding: `pct = provision_mn / est_cost_mn × 100`.

The **scenario engine** overlays five NGFS-labelled pathways:
```js
adj_cost  = round(totalEst × cost_mult)
adj_gap   = adj_cost − totalProv
writedown = adj_cost − totalProv               // = adj_gap
newRetire = retirement − retirement_accel      // years brought forward
```

### 7.2 Parameterisation / scoring rubric

Scenario multipliers (cost inflation + retirement acceleration):

| Scenario | `cost_mult` | `retirement_accel` (yrs) | Label |
|---|---|---|---|
| Net Zero 2050 | 1.15 | −5 | Orderly |
| Below 2 °C | 1.08 | −3 | Orderly |
| NDCs (baseline) | 1.00 | 0 | Current |
| Delayed Transition | 1.25 | −8 | Disorderly |
| Divergent | 1.12 | −4 | Disorderly |

The ordering encodes the NGFS logic that *disorderly* transitions cost the most (Delayed Transition
carries the highest 1.25× cost multiplier and the sharpest 8-year retirement pull-forward), while the
NDCs baseline leaves costs unchanged.

**Jurisdiction table (10 rows)** — real regulatory citations, hand-authored and accurate:

| Country | Bond | Regulation |
|---|---|---|
| Australia | ✓ | EPBC Act s.261+ (mining & offshore decom bond) |
| USA | ✓ | SMCRA / BSEE 30 CFR 250 (surety + P&A bonds) |
| UK | ✓ | OSPAR / Energy Act 2008 (Decommissioning Security Agreement) |
| Canada | ✓ | AER Directive 006 (Licensee Liability Rating) |
| France | ✓ | ASN nuclear decommissioning funds |
| China | ✗ | Evolving — no mandatory bond system |
| Indonesia | ✗ | PP 78/2010 (post-mining plan, limited enforcement) |

Asset cost/provision magnitudes are realistic per type (nuclear €1.4–1.8B, oil sands $2.4B, gas CCGT
$60–85M) but are **editorial synthetic values**.

### 7.3 Calculation walkthrough

Load 19 assets → sum estimated costs and provisions → gap and funding ratio → scenario overlay
recomputes cost and gap under each NGFS multiplier and pulls retirement dates forward → the
retirement-by-decade view aggregates count and cost. The single lever is `scenarioIdx` (default 2 =
NDCs baseline).

### 7.4 Worked example

Summing the 19-asset table: `totalEst ≈ $11,260M` and `totalProv ≈ $5,005M` (coal + oil sands + the
two nuclear plants dominate the provision base). Then:
```
gap          = 11,260 − 5,005 = $6,255M underfunded
fundingRatio = 5,005 / 11,260 × 100 = 44.4%
```
Under **Delayed Transition** (`cost_mult = 1.25`):
```
adj_cost  = round(11,260 × 1.25) = $14,075M
adj_gap   = 14,075 − 5,005 = $9,070M
```
So a disorderly transition widens the funding gap by ≈$2.8B (from $6.3B to $9.1B) and brings every
asset's retirement 8 years forward — the module's central message that unfunded decommissioning
liabilities are amplified by transition speed. (The guide's headline "$3.1B / 38% underfunded" reflects
an earlier asset set; the current 19-row table yields ≈44% funded.)

### 7.5 Companion analytics

- **Stranded-asset link:** retirement acceleration feeds the write-down view, connecting early
  closure to provision shortfalls (the module is the "Stranded Asset Link" node the guide references).
- **Regulatory requirements:** the jurisdiction table maps each asset's country to its bonding regime,
  distinguishing bonded jurisdictions (Australia, USA, UK, Canada) from unbonded (China, Kuwait).
- **Write-down scenarios:** `writedown = adj_gap` under each scenario — the P&L hit if the gap must
  be recognised.

### 7.6 Data provenance & limitations

- **All 19 assets are synthetic/editorial** (fictional names shared with the asset-registry module);
  the jurisdictional regulations are real and accurately cited.
- **Undiscounted:** `est_cost_mn` and `provision_mn` are nominal totals. A production ARO would
  discount the future decommissioning cash outflow to present value at a credit-adjusted risk-free
  rate and unwind the discount as interest expense each period; scenario cost multipliers here scale
  nominal cost, not the discounted PV.
- Retirement acceleration is a flat per-scenario constant applied to all assets, not asset-specific.

**Framework alignment:** **NGFS Phase IV scenarios** — the five-pathway cost/retirement overlay
mirrors NGFS's orderly/disorderly/hot-house taxonomy (Delayed Transition worst). **IAS 37 / ASC 410
Asset Retirement Obligations** — the est-cost-vs-provision gap is the core ARO adequacy test, though
the module omits discounting. **IEA decommissioning guidance** and the cited national statutes
(EPBC, SMCRA, OSPAR, ASN) provide the bonding-requirement basis for the regulatory tab.
