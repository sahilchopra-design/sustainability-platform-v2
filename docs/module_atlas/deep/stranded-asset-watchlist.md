## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `Alert = condition_met(carbon_price,
> rating_change, tech_crossover, regulation)` — a live rule engine evaluating current conditions
> against per-asset thresholds. **No such evaluation exists.** `alertCount` and `lastAlert` are
> independent `sr()` draws with no relationship to `carbonPrice_trigger` or any other threshold field
> on the same record. The in-page reference text even claims "Stranding risk scores derived from
> [a] multi-factor model incorporating carbon price sensitivity, regulatory timeline, technology
> substitution curves, and financial leverage… calibrated to IEA NZE scenario parameters" —
> `strandingRisk` is in fact `round(15 + sr(i×13)×80)`, a single random draw with none of those four
> factors present anywhere in the file.

### 7.1 What the module computes

20 synthetic watchlist assets (`WATCHLIST`, 8 sectors cycling via `i%8`), each independently seeded:

```
exposure ($M)        = 100 + sr(i×11)×900              // $100M–1.0Bn
strandingRisk         = 15 + sr(i×13)×80                 // 15–95%  (claimed "multi-factor model", actually single sr() draw)
carbonPrice_trigger   = 60 + sr(i×17)×140                // $60–200/tCO2 (a threshold field, never evaluated against a live price)
rating                = one of [AAA,AA,A,BBB,BB,B]        // sr(i×19)-indexed
alertCount            = floor(sr(i×23)×8)                 // 0–7, independent of carbonPrice_trigger
responseRate          = 20 + sr(i×29)×80                  // 20–100%
trend                 = sr(i×31)>0.5 ? 'Worsening' : 'Stable'
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `strandingRisk` | 15–95% | Synthetic single draw, despite page text claiming a multi-factor model |
| `carbonPrice_trigger` | $60–200/tCO₂ | Synthetic; plausible real-world threshold range but never compared to a live/simulated carbon price |
| `TRIGGERS` (8 fixed historical-style events) | Fixed narrative log, dated 2026-02-28 to 2026-04-02 | Illustrative, hand-authored, not generated from the watchlist's own threshold fields |
| `ALERT_TYPES` (6 categories) | Real, sensible alert taxonomy (carbon price threshold, regulatory announcement, tech cost crossover, rating downgrade, peer default, stranding-probability change) | Descriptive configuration list; toggled on/off in UI but not wired to any live evaluation |

### 7.3 Calculation walkthrough

1. **Watchlist generation** — 20 assets as above.
2. **Filter/sort** — by sector and by `risk`/`exposure`/`alertCount`.
3. **Portfolio KPIs** — `totalExposure = Σexposure`; `avgRisk = mean(strandingRisk)`;
   `criticalCount = count(strandingRisk>70)`.
4. **Sector peer comparison** — groups by sector, averages `strandingRisk` and sums `exposure` per
   sector.
5. **Trigger Events tab** — displays the 8 fixed `TRIGGERS` log entries verbatim; there is no code
   path that generates a new entry when a watchlist asset's `carbonPrice_trigger` would be crossed.
6. **Alert Configuration tab** — toggles `alerts` (a boolean per `ALERT_TYPES` entry) in local
   component state only; toggling does not filter or regenerate any displayed data.

### 7.4 Worked example

Asset `i=0` ("CoalCo Alpha", sector "Coal"): `sr(0)=0.7147` → `exposure=round(100+0.7147×900)=
$743M`. `sr(11×0)=sr(0)` is reused for the multiplier index but each field uses a distinct `i×k`
offset (`i×11` for exposure, `i×13` for risk, etc.), so `strandingRisk = round(15+sr(13)×80)` uses a
*different* `sr()` call (`sr(13)=frac(sin(14)×10⁴)`) than exposure's `sr(11)` — each field for the
first asset is still an independent draw despite `i=0`, unlike modules whose `i×k=0` collapses
multiple fields onto the same `sr(0)` call.

### 7.5 Companion analytics

- **Peer Comparison** — sector-level average stranding risk and aggregate exposure — genuinely
  computed aggregation, even though the underlying `strandingRisk` values are synthetic.
- **Engagement Status tab** — categorical status per asset (`Active/Pending/Escalated/Resolved/Not
  Started`, cycled deterministically via `i%5`, not randomly) — a display-only field.

### 7.6 Data provenance & limitations

- **100% synthetic** watchlist data; the 8 `TRIGGERS` log entries and asset names (CoalCo Alpha,
  PetroGlobal, etc.) are fictional illustrative content.
- The in-page methodology claim (multi-factor stranding model calibrated to IEA NZE parameters) is
  not reflected in the code — a reader relying on the page's own stated methodology would be misled
  about how `strandingRisk` is actually derived.
- No live threshold-evaluation logic exists despite the module's entire premise being "user-
  configurable monitoring with trigger events, alerts, and engagement tracking" — alerts are static
  demo content, not generated.

**Framework alignment:** IEA Net Zero Emissions scenario (named in-page as a calibration source, not
actually used) · Climate Action 100+ Net Zero Benchmark (named in-page as the engagement-tracking
framework — the `engagementStatus` taxonomy is broadly consistent with CA100+'s escalation
categories, though not computed from CA100+ criteria) · Carbon Tracker stranded-asset framing
(conceptual, not implemented).
