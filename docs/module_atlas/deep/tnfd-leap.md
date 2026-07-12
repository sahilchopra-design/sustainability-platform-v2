## 7 · Methodology Deep Dive

> ⚠️ **Frontend/backend disconnection.** A genuine, non-random LEAP scoring engine exists at
> `backend/services/tnfd_leap_engine.py` (completeness-weighted Locate/Evaluate/Assess/Prepare
> scores with explicit `None` handling when data is missing — see §7.6) and is exposed via
> `api/v1/routes/tnfd_leap.py`. **`TnfdLeapPage.jsx` never calls that API** (no `fetch`/`axios` call
> to any `tnfd-leap` endpoint exists in the file). The page instead computes its own, simpler
> sector-materiality scoring entirely client-side. The sections below document what the page
> actually renders; §7.6 also documents the unused backend engine for completeness since it is a
> materially more rigorous methodology than what ships to the user.

### 7.1 What the module computes

For the user's portfolio (loaded from `localStorage` or the first 25 rows of
`GLOBAL_COMPANY_MASTER`), each holding is mapped to one of 11 GICS-style sectors in
`SECTOR_NATURE_INTERFACES` (an ENCORE-styled qualitative lookup: biomes, dependencies, impacts,
risks, opportunities, plus a hand-set `dep_score`/`impact_score` 0–100 pair per sector) and then
individualised with a small deterministic offset derived from the holding's ISIN:

```js
depScore = sector.dep_score + (isin.charCodeAt(3) % 15 - 7)   // ±7 jitter
impScore = sector.impact_score + (isin.charCodeAt(4) % 12 - 6) // ±6 jitter
dep_score = clamp(depScore, 5, 100); impact_score = clamp(impScore, 5, 100)
natureStatus = dep_score > 70 ? 'High Risk' : dep_score > 40 ? 'Medium' : 'Low'
```

Four risk-category scores (Physical/Transition/Systemic/Litigation) are pulled from the sector's
first matching risk entry and mapped through a likelihood scale
`likI: Very High→5, High→4, Medium→3, Low→2, other→1`. A composite "overall" risk score is:

```
overall = round((physRisk + transRisk + sysRisk + litRisk) / 4 × 25)   // 0–100 scale
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `SECTOR_NATURE_INTERFACES` | 11 sectors × {biomes, dependencies, impacts, risks, opportunities, dep_score, impact_score} | ENCORE-methodology-styled but hand-authored; e.g. Materials `dep_score:82, impact_score:90` (highest), Information Technology `dep_score:28, impact_score:32` (lowest) — directionally consistent with known ENCORE sector materiality rankings |
| ISIN jitter (`charCodeAt(3)%15-7`, `charCodeAt(4)%12-6`) | ±7 / ±6 points | Deterministic pseudo-individualisation keyed off the ISIN string — not a random draw, but not a real company-specific assessment either; same ISIN always produces the same offset |
| `likI` severity scale | Very High=5 ... Low=2, default=1 | Standard 5-point likelihood scale, platform-defined mapping |
| `COUNTRY_BII` | 12 countries, real Biodiversity Intactness Index-style values (Brazil 0.73, Indonesia 0.62, Canada 0.88...) | Sourced from `data/biodiversityData.js` (`BIODIVERSITY_COUNTRY_DATA`), presented as anchoring reference data, not tied to individual holdings |
| `NATURE_SCENARIOS` | BAU / Nature Recovery (Kunming-Montreal) / Ecosystem Collapse, each with `bii_2030` and `portfolio_loss_pct` | Illustrative 3-scenario framework echoing NGFS-style scenario narratives applied to nature risk; loss percentages (4.2% / 1.1% / 12.8%) are scenario-level assumptions, not derived from the scored holdings |
| `ECOSYSTEM_SERVICES` | 8 services (Water provision, Climate regulation, Pollination...) | Standard ecosystem-service taxonomy used for the radar chart |

### 7.3 Calculation walkthrough

1. **Sector mapping** (`mapSector`) normalises each holding's raw sector string to one of the 11
   `SECTOR_KEYS`, defaulting to Financials if unmatched.
2. **Individualised scoring** applies the ISIN-jitter formula above to the sector's base
   `dep_score`/`impact_score`, clamped to [5,100].
3. **Portfolio KPIs**: `avgDep`/`avgImp` are simple means across scored holdings; `highRisk` counts
   holdings with `dep_score > 65`; `ecoservicesAtRisk` is the **union count** of ecosystem services
   rated High/Very High criticality across all sectors represented in the portfolio (a coverage
   metric, not a severity-weighted score); `disclosurePct = compliant / 14 × 100` against the
   15-row `TNFD_DISCLOSURES_INIT` seed checklist (persisted to `localStorage`).
4. **Sector aggregation** groups scored holdings by mapped sector and averages `dep_score`/
   `impact_score` per sector for the bar chart.
5. **ENCORE dependency matrix** and **radar chart** re-render the static sector-service lookup
   table (criticality labels; the radar sums `sev()` severity codes 1–4 across all holdings sharing
   a service, so it is a headcount-weighted, not materiality-weighted, aggregate).
6. **Country BII table** and **Nature scenarios** panel are presented as standalone reference data,
   not algebraically linked to the scored portfolio (no `portfolio_loss_pct` is computed from the
   user's actual holdings — the three numbers shown are the scenario's fixed assumption).

### 7.4 Worked example

Take a holding with ISIN `US0378331005` (Apple, sector mapped to Information Technology,
`dep_score:28, impact_score:32`):

| Step | Computation | Result |
|---|---|---|
| `charCodeAt(3)` | `'8'` → char code 56 | `56 % 15 − 7 = 1 − 7 = −6` |
| `depScore` | `28 + (−6)` | **22** |
| `charCodeAt(4)` | `'3'` → char code 51 | `51 % 12 − 6 = 3 − 6 = −3` |
| `impScore` | `32 + (−3)` | **29** |
| `natureStatus` | `22 ≤ 40` | **Low** |
| Physical risk likelihood | IT sector "Water scarcity for data center operations" = Medium → `likI=3` | **3** |
| Overall (physRisk only, illustrative if all 4 = Medium/3) | `(3+3+3+3)/4×25` | **75/100** |

Note the overall risk-category score (0–100) and the `dep_score`/`natureStatus` label are computed
from **different, unreconciled scales** — a holding can show "Low" nature-dependency status while
simultaneously carrying a high physical/transition/systemic/litigation composite score, because the
two come from different parts of the sector record (`dep_score` field vs. `risks[]` likelihoods)
with no cross-check.

### 7.5 Companion analytics

- **Biome exposure pie chart** — counts how many distinct sectors in the portfolio touch each biome
  (Marine, Terrestrial, Freshwater...), not area- or revenue-weighted exposure.
- **Opportunities bar chart** — counts High/Very-High-potential opportunity types per sector from
  the static lookup, independent of actual holdings.
- **TNFD disclosure tracker** — 15-row checklist (`TNFD_DISCLOSURES_INIT`) persisted client-side;
  `disclosurePct` is purely a self-reported completion percentage.
- **Country BII reference table** and **3-scenario nature-risk panel** — descriptive context, not
  wired into the scored-holdings calculations.

### 7.6 Data provenance & limitations

- **The page's live scoring is deterministic-but-arbitrary, not evidence-based**: `dep_score`/
  `impact_score` come from a hand-set sector table individualised only by a hash of the ISIN string
  — no company-specific ENCORE assessment, spatial biodiversity overlay, or dependency survey feeds
  the number shown to the user.
- **The rigorous backend engine is unused.** `backend/services/tnfd_leap_engine.py` implements a
  genuinely defensible completeness-based scoring approach: Locate score = coverage-weighted
  completeness of the location/value-chain register; Evaluate score = ENCORE coverage of the
  sector's known-material dependency/impact set; Assess score = share of material risks with an
  assigned magnitude; Prepare score = share of 7 governance/strategy flags satisfied; overall score
  = mean of whichever step scores are actually computable (explicitly `None`, not zero or a random
  fallback, when data is missing). None of this logic is exercised by the shipped page.
- Country BII values and nature-scenario BII/loss figures are static reference constants, not
  computed from the scored portfolio — they provide context but should not be read as portfolio
  outputs.
- No confidence interval, data-quality flag, or coverage disclosure accompanies the on-page
  dep_score/impact_score, despite the number materially driving the "High Risk" label shown to
  users.

### 7.7 Framework alignment

- **TNFD LEAP** (Locate, Evaluate, Assess, Prepare): the page organises its tabs around the 4 LEAP
  phases but only Evaluate (sector dependency/impact scoring) and Assess (risk categorisation) are
  meaningfully computed; Locate and Prepare are mostly static/reference content on the frontend
  (though the backend engine, unused, does compute real Locate/Prepare completeness scores).
- **ENCORE** (Natural Capital Finance Alliance/UNEP-WCMC): the sector×ecosystem-service dependency/
  impact structure mirrors ENCORE's sector-materiality methodology (which in the live tool derives
  materiality ratings from a peer-reviewed matrix of ~21 ecosystem services across ~150+ sub-industries);
  here it is compressed to 11 hand-curated sectors.
- **BII (Biodiversity Intactness Index)**: the `COUNTRY_BII` reference values are presented in the
  real BII 0–1 scale (fraction of original species abundance remaining), consistent with the
  Natural History Museum's global BII methodology, though sourced from a static platform dataset.
- **GBF/Kunming-Montreal**: the "Nature Recovery" scenario explicitly cites 30×30 targets and
  $200B/yr biodiversity finance — correct framing of the GBF's headline targets — but the resulting
  `bii_2030`/`portfolio_loss_pct` are scenario-level assumptions, not simulation outputs.
