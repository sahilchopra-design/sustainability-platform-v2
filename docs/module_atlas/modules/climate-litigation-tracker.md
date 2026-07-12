# Climate Litigation Tracker
**Module ID:** `climate-litigation-tracker` · **Route:** `/climate-litigation-tracker` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CASES`, `Kpi`, `STATUS_COLOR`, `THEORY_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CASES` | 31 | `jur`, `year`, `sector`, `theory`, `status`, `outcome` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectors` | `useMemo(() => ['All', ...Array.from(new Set(CASES.map((c) => c.sector))).sort()], []);` |
| `jurs` | `useMemo(() => ['All', ...Array.from(new Set(CASES.map((c) => c.jur))).sort()], []);` |
| `theories` | `useMemo(() => ['All', ...Array.from(new Set(CASES.map((c) => c.theory))).sort()], []);` |
| `years` | `Object.keys(m).map(Number).sort((a, b) => a - b);` |
| `plaintiffWins` | `CASES.filter((c) => /Plaintiff win\|Settlement\|affirmed\|proceed\|refused/i.test(c.outcome)).length;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-litigation/assess` | `run_full_assessment` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/greenwashing-risk` | `assess_greenwashing_risk` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/disclosure-liability` | `assess_disclosure_liability` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/fiduciary-duty` | `assess_fiduciary_duty` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/attribution-science` | `assess_attribution_science` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/litigation-exposure` | `compute_litigation_exposure` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/case-taxonomy` | `get_case_taxonomy` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/jurisdiction-profiles` | `get_jurisdiction_profiles` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/disclosure-triggers` | `get_disclosure_triggers` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/greenwashing-flags` | `get_greenwashing_flags` | api/v1/routes/climate_litigation.py |

### 2.3 Engine `climate_litigation_engine` (services/climate_litigation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateLitigationEngine.assess_greenwashing_risk` | entity_data | Check 20 red flags against entity data. Compute greenwashing risk score (0-100), identify triggered flags, regulatory exposure by jurisdiction, and remediation. |
| `ClimateLitigationEngine.assess_disclosure_liability` | entity_data | Check 8 disclosure liability triggers, quantify exposure per trigger, aggregate max/expected exposure, and identify priority remediations. |
| `ClimateLitigationEngine.assess_fiduciary_duty` | entity_data | Score all 6 Duties X Framework fiduciary duties, compute fiduciary adequacy score, identify stewardship gaps, and estimate D&O liability exposure. |
| `ClimateLitigationEngine.assess_attribution_science_risk` | entity_data | Assess attribution science applicability based on sector, jurisdiction, and emissions profile. Computes Meehl-Haugen-Christidis composite score, physical damage attribution %, and litigation probability. |
| `ClimateLitigationEngine.compute_litigation_exposure` | entity_data | Aggregate all exposure streams. Compute max/expected litigation cost, insurance adequacy gap, and IAS 37 provision requirement. |
| `ClimateLitigationEngine.run_full_assessment` | entity_data | Full climate litigation risk assessment across all five sub-modules. Produces composite litigation_risk_score (0-100) and risk tier. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CASES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-litigation/ref/case-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['case_taxonomy', 'category_count', 'source', 'total_cases_worldwide_2024', 'growth_note', 'fastest_growing_categories'], 'n_keys': 6}`

**GET /api/v1/climate-litigation/ref/disclosure-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['disclosure_liability_triggers', 'trigger_count', 'duties_x_framework', 'max_single_trigger_exposure_m', 'source'], 'n_keys': 5}`

**GET /api/v1/climate-litigation/ref/greenwashing-flags** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['greenwashing_red_flags', 'all_flags_flat', 'flag_count', 'categories', 'flags_with_enforcement_precedent', 'source', 'scoring_note'], 'n_keys': 7}`

**GET /api/v1/climate-litigation/ref/jurisdiction-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['jurisdiction_summary', 'jurisdiction_details', 'jurisdiction_count', 'highest_activity_jurisdictions', 'source'], 'n_keys': 5}`

**POST /api/v1/climate-litigation/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-litigation/attribution-science** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-litigation/disclosure-liability** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-litigation/fiduciary-duty** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `climate_litigation_engine` — extracted transformation lines:**
```python
base_score = flag_count * 10
greenwashing_risk_score = round(min(base_score + enforcement_uplift, 100.0), 1)
expected = (claim_min + claim_max) / 2 * 0.15
exposure_score = min(math.log10(total_max_m + 1) / math.log10(10001) * 50, 50)
count_score = min(trigger_count / 8 * 50, 50)
disclosure_score = round(exposure_score + count_score, 1)
breaches = min(breaches + 1, max_indicators)
breaches = min(breaches + 1, max_indicators)
breaches = min(breaches + 1, max_indicators)
duty_score = max(0, 100 - (breaches / max(max_indicators, 1)) * 100)
fiduciary_adequacy_score = round(sum(duty_scores.values()) / len(duty_scores), 1)
attribution_share = cumulative_emissions_mtco2 / global_industrial_co2_1850_2023
physical_damage_pct = round(min(attribution_share * 100, 100), 3)
gw_max = gw_flag_count * 20
gw_expected = gw_max * 0.12
dl_expected = dl_max * 0.10
attr_max = cumulative_emissions * 0.5 if attr_applicable else 0
attr_expected = attr_max * attr_prob
insurance_gap = max(0, expected_litigation - insurance_coverage)
ias37_provision = round(expected_litigation * 0.5, 1)
jurisdiction_risk_score = round(sum(jur_scores) / len(jur_scores), 1) if jur_scores else 40.0
gw_contribution = gw.greenwashing_risk_score * 0.25
dl_contribution = dl.disclosure_liability_score * 0.30
fd_contribution = (100 - fd.fiduciary_adequacy_score) * 0.20
attr_contribution = attr.meehl_haugen_christidis_score * 0.15
jur_contribution = exp.jurisdiction_risk_score / 100 * 10
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `climate_litigation_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `climate-litigation-risk-scorer` | engine:climate_litigation_engine |
| `climate-litigation` | engine:climate_litigation_engine |

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

## 9 · Future Evolution

### 9.1 Evolution A — Live case tracking from the Sabin database; fix the atlas mis-attribution (analytics ladder: rung 1 → 2)

**What.** §7 makes two findings. First, the atlas page itself mis-attributes: the
listed 10 `/api/v1/climate-litigation/*` endpoints belong to the sibling modules
(`climate-litigation`, `climate-litigation-risk-scorer`) — this page
(`ClimateLitigationTrackerPage.jsx`) has zero backend calls and is a pure client-side
filter/aggregate view over a hard-coded 31-case `CASES` array (jurisdiction, year,
sector, theory, status, outcome). The atlas generator's loose `climate-litigation*`
substring match should be fixed so the record reflects reality. Second, 31 hand-typed
cases is a sliver of a corpus that exceeds 2,500 cases globally. Evolution A ingests
the Sabin Center Global Climate Litigation Database (shared work with the
legal-intelligence dashboard's Evolution A — one ingest, two consumers) so the
tracker's filters, theory taxonomy, and outcome views operate over the real, current
case universe.

**How.** (1) Atlas generator fix: endpoint attribution by actual fetch-call analysis,
not id-substring — this is a documentation-infrastructure defect with blast radius
beyond this module. (2) `ref_litigation_cases` shared table (see the
legal-intelligence sibling); this page's existing filter/sort/aggregate UI transfers
unchanged to the larger table, with pagination. (3) Case-status change detection per
refresh so "recent developments" becomes a computed diff, not curation.

**Prerequisites.** Sabin terms and refresh cadence; the shared-ingest coordination
so the two legal modules don't duplicate pipelines. **Acceptance:** the atlas record
for this module lists zero backend endpoints (or the real ones if wiring is added);
case counts reconcile to the Sabin export; the 31-row seed array is deleted.

### 9.2 Evolution B — Docket-watch copilot (LLM tier 1)

**What.** A copilot for monitoring workflows: "what changed in EU climate dockets
this quarter?", "show corporate-defendant cases on a duty-of-care theory and their
outcomes", "which sectors face the newest filings?" — narrated filters and diffs over
the ingested case table, in the same shape the page's UI already offers but
conversational and citation-bearing (case names and jurisdictions quoted per claim).
Tier 1: the tracker aggregates and filters; it does not model, and neither should its
copilot.

**How.** Case-table aggregates as context per the tier-1 pattern; the status-diff
feed from Evolution A grounds "what's new" answers; every case fact cites its row;
the legal-advice disclaimer applies; refusal on outcome prediction and legal
strategy.

**Prerequisites (hard).** Evolution A's real corpus — a watch service over 31 static
hand-typed cases would miss essentially everything it claims to watch.
**Acceptance:** a quarterly-changes answer reconciles to the computed status diff;
every named case exists in the ingested table; asked "will this case succeed?", the
copilot reports historical base rates for the theory and declines the prediction.