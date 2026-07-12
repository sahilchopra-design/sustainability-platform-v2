## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike the three preceding "real external API" modules (OpenFEMA, GBIF, Climate TRACE), this
module is **not a live API proxy** — and the backend is explicit and honest about why. It
computes issuance/retirement/outstanding-credit analytics across six voluntary carbon market
(VCM) registries (Verra, Gold Standard, ACR, CAR, ART TREES, Puro.earth) from a **hand-authored
real aggregate extract**, because the actual live data source (CarbonPlan OffsetsDB) turned out
to be API-key-gated when the module was built.

### 7.2 Why this is an extract, not a live pull (documented, verified investigation)

The route's module docstring records a genuine data-source investigation, dated 2026-07-04:
CarbonPlan OffsetsDB has a real FastAPI service (`https://offsets-db.fly.dev`, with `/projects`,
`/credits`, `/charts/*` endpoints) but **every data endpoint requires an `X-API-KEY` header**
(returns 403 without one — confirmed both via the service's own `openapi.json` security schemes
and via direct probes), and its S3 parquet mirror also returns 403. Berkeley VROD (Voluntary
Registry Offsets Database) is only distributed as an Excel bulk download with no API. Given
neither real source is programmatically accessible without credentials the platform doesn't
have, the module instead serves **"approximate cumulative issuance/retirement volumes and
category mixes by registry, compiled from public registry disclosures, Berkeley VROD releases
and CarbonPlan OffsetsDB public reporting"** — explicitly labelled "order-of-magnitude-faithful
approximations... NOT registry-reconciled numbers," with an explicit refresh instruction ("set
`OFFSETS_DB_API_KEY`... if ever provisioned"). The frontend badge correctly reflects this:
`provenance.live: false` renders as "○ Seeded real extract — OffsetsDB API key-gated," never
"● Live."

This review independently re-verified the key-gating claim is still live-documented behavior in
the route, and confirms the extract numbers are internally self-consistent (see §7.4) rather than
randomly generated — a materially different (and more defensible) data-honesty posture than a
PRNG-seeded placeholder would be.

### 7.3 Aggregate calculations (all served, not fetched)

```python
retirement_rate_pct = cumulative_retired_mt / cumulative_issued_mt × 100    # per registry
outstanding_mt       = cumulative_issued_mt − cumulative_retired_mt          # per registry
overall_retirement_rate_pct = Σ(retired) / Σ(issued) × 100                   # market-wide
```

Retirement rate is presented as "the key quality signal: credits issued but never retired sit as
unused supply" — a defensible framing consistent with how VCM analysts (Berkeley Carbon Trading
Project, Ecosystem Marketplace) actually read registry data: retirement is the point at which a
credit is claimed against an emissions reduction and can no longer be resold, so a low retirement
rate relative to issuance indicates a large pool of unused/oversupplied credits.

### 7.4 Worked example — full market summary, hand-verified

Calling the real route functions directly (`summary()`, `registries()`) confirms:

| Registry | Issued (Mt) | Retired (Mt) | Retirement rate | Outstanding (Mt) |
|---|---|---|---|---|
| Verra (VCS) | 1,420.0 | 790.0 | **55.6%** | 630.0 |
| Gold Standard | 340.0 | 215.0 | **63.2%** | 125.0 |
| ACR | 280.0 | 135.0 | **48.2%** | 145.0 |
| CAR | 215.0 | 120.0 | **55.8%** | 95.0 |
| ART TREES | 42.0 | 7.0 | **16.7%** | 35.0 |
| Puro.earth | 1.9 | 0.9 | **47.4%** | 1.0 |
| **Market total** | **2,298.9** | **1,267.9** | **55.2%** | — |

Verra's retirement rate: 790.0 / 1420.0 × 100 = 55.63% → rounds to 55.6%, confirmed by direct
call. Market-wide: Σissued = 1420+340+280+215+42+1.9 = 2,298.9; Σretired =
790+215+135+120+7+0.9 = 1,267.9; overall rate = 1267.9/2298.9×100 = 55.15% → rounds to **55.2%**
— both figures independently reproduced from the real `summary()` function output.

ART TREES stands out with by far the lowest retirement rate (16.7%) — consistent with its
real-world profile as the youngest registry in the set (`first_major_issuance_year: 2021`,
jurisdictional REDD+ only, e.g. Guyana), where large recent issuances haven't had time to work
through to retirement yet. This is a genuine, sensible pattern in the hand-authored data, not an
artefact.

### 7.5 Internal consistency check — annual series reconciles to cumulative totals

The `ANNUAL` table's own header comment states "annual rows + pre_2016 sum to the cumulative
totals above." This review verified that claim by direct summation rather than taking it on
faith:

- **Verra issued:** 40+60+85+120+150+255+170+160+150+140 (2016-2025) = 1,330, **+ 90 (pre-2016)
  = 1,420** — matches `cumulative_issued_mt: 1420.0` exactly.
- **Verra retired:** 20+25+35+55+75+115+100+95+90+95 = 705, **+ 85 (pre-2016) = 790** — matches
  `cumulative_retired_mt: 790.0` exactly.
- **Puro.earth issued:** 0+0+0+0+0.05+0.1+0.2+0.35+0.5+0.7 = 1.9, **+ 0 (pre-2016) = 1.9** —
  matches exactly (Puro only began issuing in 2020).

All checked rows reconcile exactly, indicating the hand-authored annual breakdown was built
top-down from the same cumulative totals shown elsewhere on the page (or vice versa), not
independently invented — a meaningful data-quality signal for a hand-authored dataset.

### 7.6 Data provenance & limitations

- **Not live, and honestly labelled as such** — this is the key methodological fact about this
  module. Every number is a hand-authored approximation, explicitly dated ("data as of circa
  end-2025," compiled 2026-07-04) and sourced to three named channels (Berkeley VROD, CarbonPlan
  OffsetsDB *public reporting* — not its gated API — and registry public dashboards).
- **No PRNG/random fabrication** — confirmed by inspection: every figure is a literal constant in
  the `REGISTRIES`/`ANNUAL` dictionaries, and the annual/cumulative reconciliation in §7.5 shows
  internal consistency rather than independently-drawn random numbers.
- **"Order-of-magnitude-faithful," not "registry-reconciled"** — the module's own caveat is
  explicit that these figures should not be treated as precise official statistics; a production
  deployment should replace them with a live OffsetsDB pull once an API key is provisioned (the
  code even names the exact environment variable, `OFFSETS_DB_API_KEY`, that would trigger the
  upgrade).
- **`/status` endpoint performs a genuine live reachability check** against
  `https://offsets-db.fly.dev/health` (10s timeout, 10-minute cache) — so the page can honestly
  report whether the real upstream is currently reachable, even though it cannot use it for data
  without a key.
- **Category-mix percentages** (e.g. Verra 47% Forestry & Land Use, 33% Renewable Energy) are
  similarly hand-authored approximations reflecting each registry's known real-world project-type
  concentration (e.g. ART TREES 100% Forestry & Land Use is definitionally true — it is a
  jurisdictional REDD+-only registry; Puro.earth 100% Engineered CDR is similarly true by
  registry design), not independently sourced percentages.

**Framework alignment:** Berkeley Carbon Trading Project / Voluntary Registry Offsets Database
(VROD) methodology · CarbonPlan OffsetsDB public reporting conventions · standard VCM market
concepts (issuance, retirement, outstanding/unused credits) as used by Ecosystem Marketplace and
similar VCM market-tracking bodies.

## 8 · Model Specification

**Status: implemented.** The extract, its aggregation formulas, and the live upstream-
reachability check are all fully implemented; only the *data refresh mechanism* (a live
OffsetsDB pull) remains unbuilt, pending an API key.

**8.1 Purpose & scope.** Give a carbon-market analyst a whole-market view of VCM issuance/
retirement/outstanding-supply dynamics across six registries beyond Verra alone (which dominates
most single-registry dashboards), using the best currently-accessible public data, while being
fully transparent that it is an approximation pending a live-data upgrade.

**8.2 Conceptual approach.** Real, but non-programmatically-accessible, third-party market data
(registry public dashboards, VROD releases, OffsetsDB's own published reporting) is manually
compiled into a small, internally-reconciled reference table (cumulative + annual issuance/
retirement + category mix per registry), with retirement rate computed as the key quality/
oversupply signal. A parallel live reachability check keeps the door open for an automatic
upgrade to a true live pull.

**8.3 Mathematical specification.**
```
retirement_rate_pct[registry] = retired_mt[registry] / issued_mt[registry] × 100
outstanding_mt[registry]      = issued_mt[registry] − retired_mt[registry]
overall_retirement_rate_pct   = Σ retired_mt / Σ issued_mt × 100
annual_reconciliation: Σ_{2016..2025} issued_mt[registry][year] + pre_2016_issued_mt[registry] == cumulative_issued_mt[registry]
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cumulative issued/retired per registry | Mt CO2e | Hand-compiled from registry dashboards, VROD, OffsetsDB public reporting |
| Category mix % | per registry | Hand-compiled, some registries definitionally single-category (ART TREES, Puro.earth) |
| Annual by-year series | 2016-2025 + pre-2016 rollup | Hand-compiled, verified internally reconciled to cumulative totals |

**8.4 Data requirements.** None from the user — this is a pure reference-data page. Production
upgrade requires an `OFFSETS_DB_API_KEY` environment variable to switch the backend to a genuine
live proxy over CarbonPlan OffsetsDB's `/charts/credits_by_category` and related endpoints.

**8.5 Validation & benchmarking.** This review independently re-verified (a) the retirement-rate
and outstanding-mt arithmetic for all six registries and the market total, and (b) that the
annual by-year series reconciles exactly to the cumulative totals for the two registries spot-
checked (Verra, Puro.earth) — all checks passed with no discrepancy.

**8.6 Limitations & model risk.** (1) The extract is a point-in-time (circa end-2025) manual
compilation, not a refreshed feed — it will silently go stale without a code change or the
OffsetsDB API key upgrade. (2) "Order-of-magnitude-faithful" figures should not be used for
precise reconciliation against any single registry's own official statistics — treat them as
directional/comparative, not authoritative. (3) Category-mix percentages for the larger,
multi-project-type registries (Verra, Gold Standard, ACR, CAR) are approximations and may not
reflect the exact current-year mix. (4) The retirement-rate "quality signal" framing is a
reasonable analytical heuristic but conflates several distinct real-world dynamics (buyer demand,
credit vintage/age, registry-specific retirement conventions) that a rigorous market analysis
would disaggregate.
