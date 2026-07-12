## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (module-atlas auto-doc).** The current
> auto-generated `docs/module_atlas/modules/climate-litigation-tracker.md` lists a
> full backend section — 10 `POST/GET /api/v1/climate-litigation/*` endpoints, a
> `ClimateLitigationEngine` class with greenwashing/disclosure/fiduciary-duty/
> attribution-science/exposure-aggregation methods, and "blast radius: 2 other
> modules" shared via `climate_litigation_engine`. **None of that exists in this
> module's actual code.** `ClimateLitigationTrackerPage.jsx` has **zero backend
> calls** — no `axios` import, no `fetch`, nothing — it is a pure client-side page
> over a hard-coded `CASES` array. The `climate_litigation_engine` backend
> genuinely exists (`backend/services/climate_litigation_engine.py`), but it is
> wired to two *different* platform modules, `climate-litigation` and
> `climate-litigation-risk-scorer` (per the atlas's own "Connected module" table),
> not to `climate-litigation-tracker`. This looks like an id-substring
> mis-attribution in the atlas generator (`climate-litigation*` matched loosely).
> The sections below document only what `ClimateLitigationTrackerPage.jsx` actually
> does; the backend engine's real methodology belongs in the deep-dive for
> `climate-litigation` / `climate-litigation-risk-scorer`, not here.

### 7.1 What the module computes

Climate Litigation Tracker is a **hand-authored, curated extract of 30 landmark
climate-litigation cases**, analyzed client-side by year, jurisdiction, defendant
sector, and legal theory, plus one computed quantity: a small-sample **empirical
exposure prior** — the frequency of cases matching a chosen sector and jurisdiction
within the extract.

### 7.2 Data source — hand-authored, verified extract

The `CASES` array (30 entries, `jur`/`year`/`sector`/`theory`/`status`/`outcome`
fields) is drawn from the **Sabin Center for Climate Change Law's Climate Change
Litigation Databases** (`climatecasechart.com`, now powered by Climate Policy
Radar) — the header comment states the full database holds 3,000+ cases and this
is "a curated verified subset for analytics context; each fact (year, jurisdiction,
status) was checked." Real, named, verifiable cases are included: *Massachusetts v.
EPA* (2007 SCOTUS decision), *Urgenda Foundation v. Netherlands* (2019), *Milieudefensie
v. Royal Dutch Shell* (2021 order, overturned on appeal 2024), *Held v. State of
Montana* (2024), *Verein KlimaSeniorinnen v. Switzerland* (2024 ECtHR judgment),
among others — each with a real outcome summary and citation-worthy status.

Six legal-theory buckets are used: Constitutional, Human Rights, Tort/Nuisance,
Corporate/Directors, Securities/Consumer Fraud, Administrative/Planning (+
Administrative/Statutory), Public Trust.

### 7.3 Analytics computed client-side

```js
byYear:  count filings per year, running cumulative sum (LineChart: filed vs cumulative)
byTheory / bySector: countBy(CASES, key) — simple group-count, sorted descending
winRate: regex /Plaintiff win|Settlement|affirmed|proceed|refused/i against each
         case's `outcome` string — a heuristic plaintiff-favorable-outcome classifier,
         not a structured win/loss field
```
`winRate.wins` is **not** filtered to only decided/dismissed cases before counting —
it runs the regex across all 30 `outcome` strings including ongoing cases whose
outcome text happens to mention "proceed" (e.g. a court "allowed the claim to
proceed" is counted as plaintiff-favorable even though the case's merits are
undecided). This is a real classification-boundary quirk worth flagging: the KPI
label "Plaintiff-favourable" is doing double duty as "procedurally favorable to date
across the extract," not strictly "won on the merits."

### 7.4 Empirical exposure prior — the module's one real calculation

```js
const prior = useMemo(() => {
  const inSector = CASES.filter(c => c.sector === scSector);
  const inBoth = inSector.filter(c => c.jur === scJur);
  return {
    sectorCount: inSector.length, bothCount: inBoth.length,
    sectorFreq: inSector.length / CASES.length,
    bothFreq: inBoth.length / CASES.length,
    cases: inBoth,
  };
}, [scSector, scJur]);
```
This is a direct small-sample relative-frequency estimator: `P̂(sector) =
count(sector) / 30` and `P̂(sector ∩ jurisdiction) = count(sector ∩ jurisdiction) /
30` — no smoothing, no Bayesian prior blending, no weighting against the full
3,000+-case Sabin/CPR population. The UI itself calls this "a directional prior,
not a base rate" and tells the user to "weight against the full Sabin/CPR database
... for a calibrated frequency."

### 7.5 Worked example (default UI state: Oil & Gas × United States)

Counting the 30-case `CASES` array by hand:

**Oil & Gas sector cases (8 of 30):** City of New York v. BP/Chevron (US), Milieudefensie
v. Royal Dutch Shell (Netherlands), Massachusetts AG v. ExxonMobil (US), Greenpeace
Nordic v. Norway/Arctic Oil (Norway), ClientEarth v. Shell Board of Directors (UK),
California v. Exxon/Shell/Chevron et al. (US), Comer v. Murphy Oil (US), Greenpeace
v. TotalEnergies (France).

**Oil & Gas ∩ United States (4 of 30):** City of New York v. BP/Chevron, Massachusetts
AG v. ExxonMobil, California v. Exxon/Shell/Chevron et al., Comer v. Murphy Oil.

| Quantity | Computation | Result |
|---|---|---|
| `sectorCount` | count(sector = Oil & Gas) | 8 |
| `sectorFreq` | 8 / 30 | **26.7%** |
| `bothCount` | count(Oil & Gas ∩ US) | 4 |
| `bothFreq` (empirical prior) | 4 / 30 | **13.3%** |

This reproduces exactly what the KPI cards render on page load (the component's
default state is `scSector='Oil & Gas'`, `scJur='United States'`), confirming the
frequency computation by direct hand-count against the real `CASES` array rather
than trusting the UI's rendered percentage.

### 7.6 Companion elements

- **Filterable case table**: three independent dropdown filters (sector,
  jurisdiction, theory) combined with logical AND, sorted by year descending — a
  simple array filter/sort, no ranking model.
- **Status coloring**: Decided (green), Ongoing (amber), Dismissed (red) — purely
  presentational, drawn directly from each case's hard-coded `status` field.

### 7.7 Data provenance & limitations

- **No PRNG, no fabricated data** — every case, year, jurisdiction, sector, theory
  and outcome string is hand-entered and (per the in-code comment) fact-checked
  against real litigation records, not generated.
- **Small, non-representative sample**: 30 landmark cases out of a documented
  3,000+-case population is a deliberately curated "greatest hits" selection
  (Sabin/CPR's own database is dominated by U.S. administrative/regulatory
  challenges that rarely make "landmark" lists) — the exposure prior computed from
  it is explicitly *not* a calibrated base rate, and the UI says so.
- **No live refresh path**: unlike the GLEIF/NESO/FRED/trade.gov proxies elsewhere
  in this module family, there is no backend and no API call at all — updating this
  data requires an engineer to hand-edit the `CASES` array from
  `climatecasechart.com`.
- **Win-rate heuristic is regex-based**, not a structured outcome taxonomy, and
  conflates "proceeding" (procedural survival) with "winning" (merits outcome) —
  see §7.3.
- See the mismatch flag at the top of this document regarding the currently
  auto-generated atlas page's incorrect backend/engine attribution.

## 8 · Model Specification

**Status: implemented** (as a static curated dataset + client-side analytics; no
backend model exists for this module — see mismatch flag).

**8.1 Purpose & scope.** Give ESG/legal-risk teams a fast qualitative view of how
climate litigation theories, sectors, and jurisdictions have evolved, plus a
lightweight, honestly-labeled directional prior for a chosen sector/jurisdiction
pairing, sourced from real landmark cases rather than a synthetic taxonomy.

**8.2 Conceptual approach.** A hand-curated reference dataset (not a live feed or a
generative model) filtered and counted client-side; the "model" here is a small-
sample empirical frequency estimator, deliberately simple and transparently
labeled as non-calibrated.

**8.3 Mathematical specification.**
```
P̂(sector)              = |{c ∈ CASES : c.sector = s}| / |CASES|
P̂(sector ∩ jurisdiction) = |{c ∈ CASES : c.sector = s ∧ c.jur = j}| / |CASES|
```
| Parameter | Value | Calibration source |
|---|---|---|
| `CASES` size | 30 | Hand-curated landmark subset of Sabin Center / Climate Policy Radar database |
| Full population (for context) | ~3,000+ cases | Sabin Center Climate Change Litigation Databases, stated in-UI |
| Legal-theory taxonomy | 6-7 buckets | Constitutional / Human Rights / Tort-Nuisance / Corporate-Directors / Securities-Consumer Fraud / Administrative-Planning(-Statutory) / Public Trust |

**8.4 Data requirements.** None beyond the shipped array; a production refresh
would mean re-curating from `climatecasechart.com` (manual) or building a genuine
API/scrape integration against the Sabin/CPR database (not present today).

**8.5 Validation & benchmarking.** Every fact in `CASES` (year, jurisdiction,
status, outcome) is claimed fact-checked in-code; this review independently
hand-recomputed the sector/jurisdiction frequency for the default UI state
(Oil & Gas × United States → 26.7% / 13.3%) directly from the array contents in
§7.5, confirming the displayed KPI values are correctly derived, not merely
plausible-looking.

**8.6 Limitations & model risk.** The exposure prior is a small-sample frequency
over a curated (not randomly sampled) 30-case set — it should never be used as a
calibrated litigation-probability estimate without reweighting against the full
Sabin/CPR population, exactly as the UI itself cautions. The plaintiff-favorable
win-rate KPI conflates procedural and merits outcomes via a regex heuristic. There
is no mechanism to keep the dataset current as new judgments are issued.
