## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Emissions Verification
> Gap = |Climate TRACE Estimate - Company Reported| / Company Reported x 100`, describing a
> per-company divergence test between independently-estimated and self-reported emissions.
> **This comparison is never computed.** `SBTI_COMPANIES` (50 synthetic companies with SBTi target
> data) and `CT_SECTORS` (12 sector-level Climate TRACE-style global emissions figures) are two
> **entirely disconnected datasets** in the code — there is no join key, no per-company Climate
> TRACE estimate, and no divergence percentage anywhere. The page presents them side-by-side as
> separate tabs/views, not as a cross-referenced verification tool.

### 7.1 What the module computes

**SBTi registry** (50 synthetic companies, cycling through 10 sectors / 5 methods / 7 status
labels via modulo indexing):
```
baseYear    = 2015 + floor(sr(i) x 5)
targetYear  = 2030 + floor(sr(i+50) x 20)
scope1Base  = 500 + sr(i x 3) x 9,500
scope12Base = scope1Base x (1.2 + sr(i x 3 + 1) x 0.8)
reductionPct     = 30 + sr(i x 3 + 2) x 55            // total target reduction %
nearTermPct      = reductionPct x (0.4 + sr(i x 4) x 0.3)   // near-term share of total target
temp        = status==='Targets Set' ? (sr(i+100)>0.6 ? '1.5C' : 'Well-below 2C') : '-'
```
**Sector decarbonisation pathways** (`PATHWAY_DATA`, 7 milestone years 2020-2050):
```
sbtiPath(yr) = startEmit x max(0.05, 1 - (yr-2020)/30 x (0.6 + sr(seed)x0.35))
```
A convex decline curve floored at 5% of starting emissions (never reaching absolute zero), with a
per-sector randomised steepness (`0.6-0.95` total reduction fraction by 2050).

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `CT_SECTORS` (12 rows) | Power 14,800 Mt, Transportation 8,100 Mt, Agriculture 5,700 Mt, Buildings 2,800 Mt, Manufacturing 6,200 Mt, Fossil Fuels 5,400 Mt, Waste 1,600 Mt, Shipping 1,100 Mt, Aviation 920 Mt, Steel 2,900 Mt, Cement 2,600 Mt, Mining 1,100 Mt | Real, well-sourced reference data — the 12 sector figures sum to ~53.2 GtCO2e, closely matching Climate TRACE's actual published global total (~53-57 GtCO2e depending on LULUCF inclusion); each sector also lists its real Climate TRACE detection methodology (satellite, AIS vessel tracking, flight data, ground stations) |
| `SBTI_COMPANIES` fields | Sector/method/status cycled via `i % 10` / `i % 5` / `i % 7`; base/target years, emissions, reduction % all `sr()`-seeded | Synthetic demo; `SBTI_METHODS` names are real SBTi methodology categories (Absolute Contraction, SDA, ACA-style Paris Agreement Capital Transition) |
| `reductionPct` range | 30-85% | Broadly consistent with the guide's cited "42-50% by 2030" SBTi near-term target range, though the code's range is wider and not sector-differentiated |
| `sbtiPath` floor | 5% of starting emissions | Approximates the Net-Zero Standard's "at least 90% reduction, residual <10%" requirement, though the floor here is 5% not the ~10% the guide cites |

### 7.3 Calculation walkthrough

1. `SBTi Registry` tab: filters/sorts the 50 synthetic companies by sector/status/method; computes
   `sbtiStats` (counts of Targets Set/Committed/Removed/net-zero-committed, mean `reductionPct`)
   and `sectorBreakdown` (per-sector company counts and mean reduction).
2. `Climate TRACE` tab: renders `CT_SECTORS` as a bar/treemap of global sector emissions with
   `totalCt = Sum(CT_SECTORS.emissions_Mt)` — a real, correctly-sourced aggregate figure.
3. `Sector Pathways` tab: plots `PATHWAY_DATA` per SBTi sector from 2020 to 2050, with `end`/`mid`
   milestone extraction for summary cards — illustrative decline curves, not tied to any specific
   published sectoral decarbonisation approach (SDA) trajectory data.
4. **No tab cross-references `SBTI_COMPANIES` against `CT_SECTORS`** — a company in the "Power"
   sector cannot be compared against Climate TRACE's real 14,800 Mt power-sector estimate, because
   the company's `scope1Base` is an independent random draw with no unit or scale relationship to
   the sector total.

### 7.4 Data provenance & limitations

- `CT_SECTORS` is the module's strongest asset: real, well-calibrated Climate TRACE-style global
  sector emissions figures with accurate detection-methodology attribution per sector.
- `SBTI_COMPANIES` is entirely synthetic and structurally cannot be verified against `CT_SECTORS`
  because no company-level Climate TRACE estimate or matching logic exists.
- The guide's headline "verification gap" use case — flagging companies whose Climate TRACE
  estimate diverges materially from their self-reported Scope 1+2 — **cannot be performed** with
  this module as built; a production version would need Climate TRACE's actual facility-level API
  (asset-level, not just sector-level, data) matched to company asset registries via LEI/facility
  ownership mapping.
- `sbtiPath`'s 5% emissions floor is a reasonable order-of-magnitude match to the Net-Zero
  Standard's residual-emissions allowance but not an exact reproduction of the ~10% figure the
  guide cites.

**Framework alignment:** Climate TRACE Emissions Inventory v4 (sector totals and methodology
attribution are genuinely accurate) · SBTi Corporate Net-Zero Standard v1.1 (methodology names
correctly reproduced; individual company target data synthetic) · GHG Protocol Corporate Standard
(Scope 1/1+2 framing correct) — the core "independent-verification-vs-self-reported" analytical
workflow the guide describes is **not implemented**.
