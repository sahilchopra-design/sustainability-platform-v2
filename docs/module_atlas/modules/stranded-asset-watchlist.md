# Stranded Asset Watchlist
**Module ID:** `stranded-asset-watchlist` · **Route:** `/stranded-asset-watchlist` · **Tier:** B (frontend-computed) · **EP code:** EP-CK5 · **Sprint:** CK

## 1 · Overview
20-asset interactive watchlist with configurable alert triggers and engagement tracking.

**How an analyst works this module:**
- Watchlist Dashboard shows 20 assets with alert status
- Configure alert thresholds per asset
- Trigger Events log shows historical alerts and responses

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `Badge`, `Card`, `KPI`, `TABS`, `TRIGGERS`, `WATCHLIST`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TRIGGERS` | 9 | `asset`, `event`, `severity`, `response` |
| `ALERT_TYPES` | 7 | `desc`, `default_val`, `active` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `totalExposure` | `WATCHLIST.reduce((s,w)=>s+w.exposure,0);` |
| `avgRisk` | `Math.round(WATCHLIST.reduce((s,w)=>s+w.strandingRisk,0)/WATCHLIST.length);` |
| `sectorPeers` | `useMemo(()=>{ const sectors=[...new Set(WATCHLIST.map(w=>w.sector))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `TABS`, `TRIGGERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Watchlist Assets | — | User-curated | Assets monitored for stranding signals |
| Alert Types | — | Configurable | Carbon price, tech, regulatory, rating, covenant, peer |

## 5 · Intermediate Transformation Logic
**Methodology:** Threshold-based alert system
**Headline formula:** `Alert = condition_met(carbon_price, rating_change, tech_crossover, regulation)`

6 alert types: carbon price exceeding threshold, technology cost crossover, regulatory announcement, rating downgrade, covenant near-breach, peer action.

**Standards:** ['User-configurable']
**Reference documents:** User Configuration

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the live threshold-evaluation engine the module's premise requires (analytics ladder: rung 1 → 2)

**What.** The §7 flag is damning for a monitoring tool: the guide's `Alert = condition_met(carbon_price, rating_change, tech_crossover, regulation)` implies a live rule engine, but **no evaluation exists** — `alertCount` and `lastAlert` are independent `sr()` draws unrelated to `carbonPrice_trigger` or any threshold field. Worse, the in-page text claims `strandingRisk` comes from "a multi-factor model incorporating carbon price sensitivity, regulatory timeline, technology substitution curves, and financial leverage… calibrated to IEA NZE," when it is actually `round(15 + sr(i×13)×80)` — a single random draw with none of those factors present. The 20 assets and 8 trigger-log entries are static demo content. The module's entire premise (configurable monitoring with trigger events and alerts) is unimplemented. Evolution A builds the alert engine.

**How.** (1) Implement live threshold evaluation: compare each asset's `carbonPrice_trigger`, rating, tech-crossover, and regulation thresholds against actual current values (carbon price from a live/refreshed source, ratings from a feed, regulation from the platform's climate-policy-radar) — the six `ALERT_TYPES` become real conditions, not toggles. (2) Compute `strandingRisk` from the four factors the page text claims, borrowing the sibling `stranded-asset-analyzer`'s real write-down/PD engine rather than a random draw. (3) Generate the trigger-events log from actual threshold breaches, not the hardcoded 2026-dated narrative entries. (4) Persist per-asset thresholds and engagement status server-side.

**Prerequisites.** A live carbon-price and ratings source; the climate-policy-radar endpoints for the regulation trigger; sibling engine reuse for stranding risk. **Acceptance:** an alert fires only when a threshold is actually breached; `strandingRisk` responds to carbon price and leverage; the trigger log reflects real breaches, not demo content.

### 9.2 Evolution B — Watchlist-monitoring copilot (LLM tier 1)

**What.** A copilot for the portfolio monitor: "which assets breached their carbon-price trigger this week?", "why did this asset's stranding risk rise?", "what engagement status should I set given the latest regulatory trigger?" — answered from the (Evolution-A) live alert engine and the computed stranding factors, never inventing alerts.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/stranded-asset-watchlist/ask`, corpus = this Atlas record (the alert taxonomy, the stranding factors, IEA NZE / CA100+ framework notes) plus live watchlist state. Breach answers narrate which threshold conditions evaluated true and against what current values; stranding-risk explanations decompose the multi-factor model; engagement-status guidance maps to the CA100+-consistent escalation categories the module carries. Refusal for assets outside the watchlist.

**Prerequisites (hard).** Evolution A — with alerts as random draws and stranding risk fabricated despite claiming a multi-factor model, the copilot would narrate fictional breaches and cite a model that doesn't exist. **Acceptance:** every alert cited corresponds to a real threshold evaluation; stranding-risk explanations reflect the actual factors; a claim about IEA NZE calibration is true only after Evolution A wires it.