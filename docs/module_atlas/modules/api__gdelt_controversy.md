# Api::Gdelt_Controversy
**Module ID:** `api::gdelt_controversy` · **Route:** `/api/v1/gdelt` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/gdelt/events/search` | `search_gdelt_events` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/actors` | `gdelt_top_actors` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/timeline` | `gdelt_event_timeline` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/countries` | `gdelt_event_countries` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/stats` | `gdelt_event_stats` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/gkg/search` | `search_gdelt_gkg` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/gkg/themes` | `gdelt_gkg_themes` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/search` | `search_controversy` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/entity/{entity_name}` | `controversy_entity_detail` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/rankings` | `controversy_rankings` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/stats` | `controversy_stats` | api/v1/routes/gdelt_controversy.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `GKG`, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_controversy_scores`, `dh_gdelt_events`, `dh_gdelt_gkg`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gdelt/controversy/entity/{entity_name}** — status `failed`, provenance ['db-empty'], source tables: `dh_controversy_scores`
Output: `None`

**GET /api/v1/gdelt/controversy/rankings** — status `passed`, provenance ['real-db'], source tables: `dh_controversy_scores`
Output: `{'type': 'object', 'keys': ['rankings'], 'n_keys': 1}`

**GET /api/v1/gdelt/controversy/search** — status `passed`, provenance ['real-db'], source tables: `dh_controversy_scores`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/gdelt/controversy/stats** — status `passed`, provenance ['real-db'], source tables: `dh_controversy_scores`, `dh_gdelt_gkg`
Output: `{'type': 'object', 'keys': ['controversy'], 'n_keys': 1}`

**GET /api/v1/gdelt/events/actors** — status `passed`, provenance ['real-db'], source tables: `dh_gdelt_events`
Output: `{'type': 'object', 'keys': ['actors'], 'n_keys': 1}`

**GET /api/v1/gdelt/events/countries** — status `passed`, provenance ['real-db'], source tables: `dh_gdelt_events`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/gdelt/events/search** — status `passed`, provenance ['real-db'], source tables: `dh_gdelt_events`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/gdelt/events/stats** — status `passed`, provenance ['real-db'], source tables: `dh_gdelt_events`
Output: `{'type': 'object', 'keys': ['events'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/api/v1/routes/gdelt_controversy.py` and the upstream scoring pipeline
`backend/ingestion/gdelt_ingester.py` (migration 032 created the three `dh_gdelt_*` tables).)*

### 7.1 What the domain computes

The route layer is a **read-only query surface** over three ingested tables — `dh_gdelt_events`
(GDELT 2.0 event records), `dh_gdelt_gkg` (Global Knowledge Graph records with ESG tagging), and
`dh_controversy_scores` (per-entity composite scores). The *scoring itself* happens at ingest
time in `_compute_controversy_scores`:

```
neg_ratio      = negative_events / max(total_events, 1)      (negative = quad_class ≥ 3)
tone_severity  = clamp(|avg_tone| / 10, 0, 1)
volume_factor  = min(1, total_mentions / 1000)
controversy_score = clamp(neg_ratio×40 + tone_severity×35 + volume_factor×25, 0, 100)
```

E/S/G sub-scores prorate the composite by the entity's share of controversy-flagged GKG records
per pillar: `env_score = (env_flags / total_flags) × controversy_score` (same for social,
governance). Severity bands: ≥ 75 Critical, ≥ 50 High, ≥ 25 Medium, else Low. Top-5 themes are
frequency-ranked from GKG theme strings; `trend` is hardcoded `"Stable"`.

Route endpoints then serve: filtered event search (actor/country/quad-class/mentions/entity/
year), top actors (with positive/negative event splits), monthly/yearly timelines, country
breakdowns, GKG search (ESG category, controversy-only), controversy search/rankings
(SQL `RANK() OVER (ORDER BY controversy_score DESC)`), per-entity detail (latest score + 10 most
recent events + 10 GKG records), and corpus statistics.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Component weights | negative-ratio 40 / tone 35 / volume 25 | platform calibration (uncited) |
| Tone normaliser | ÷10 (GDELT `avg_tone` typically ranges ≈ −10…+10) | GDELT convention |
| Volume saturation | 1,000 mentions → factor 1.0 | synthetic cap |
| Negative event | GDELT `quad_class ≥ 3` (verbal + material conflict) | GDELT CAMEO quad-class taxonomy |
| Positive event | `quad_class ≤ 2` (verbal + material cooperation) | ibid. |
| Severity bands | 75/50/25 | platform bands |
| Scoring period | fixed 2023-01-01 … 2023-12-31 | hardcoded in ingester |

GDELT-native fields passed through: `goldstein_scale` (−10…+10 event-impact score from the
Goldstein conflict–cooperation scale), `num_mentions/sources/articles`, CAMEO `event_code`
hierarchy, and geo coordinates.

### 7.3 Calculation walkthrough

Ingest: events and GKG records are fetched (BigQuery public GDELT dataset when configured via
`_fetch_bigquery`, otherwise `_generate_sample_events`/`_generate_sample_gkg` produce synthetic
records), matched to entities by name (`matched_entity_name`), accumulated per entity (tones,
Goldstein values, mentions, quad-class counts, per-pillar controversy flags), scored with the
formula above, and upserted into `dh_controversy_scores`. Sector is inferred by name keyword
(`_guess_sector`); country is taken from the first event's `actor1_country`.

### 7.4 Worked example — one entity

Entity with 20 matched events: 12 negative (quad ≥ 3), 8 positive; mean tone −6.2; 850 total
mentions; GKG controversy flags E=3, S=1, G=1.

| Step | Computation | Result |
|---|---|---|
| neg_ratio | 12/20 | 0.60 → ×40 = 24.0 |
| tone_severity | min(1, 6.2/10) | 0.62 → ×35 = 21.7 |
| volume_factor | min(1, 850/1000) | 0.85 → ×25 = 21.25 |
| **controversy_score** | 24.0 + 21.7 + 21.25 | **67.0 → "High"** |
| env_score | (3/5) × 67.0 | 40.2 |
| social / governance | (1/5) × 67.0 each | 13.4 / 13.4 |

`GET /controversy/entity/{name}` then returns this row plus the 10 latest events and GKG records
as drill-down evidence.

### 7.5 Companion aggregations

- `/events/actors` — per-entity totals with `negative_events` / `positive_events` split by
  quad-class and average tone/Goldstein: the raw ingredients of the score, exposed for audit.
- `/events/timeline` — month (`YYYY-MM`) or year buckets of counts/mentions/tone.
- `/controversy/stats` — severity distribution, mean score, GKG controversy counts.
- Rankings use a strict SQL RANK over the stored score, optionally sector-filtered.

### 7.6 Data provenance & limitations

- **Dual provenance:** the ingester supports the *real* GDELT 2.0 public dataset via BigQuery,
  but falls back to `_generate_sample_events`/`_generate_sample_gkg` synthetic records when no
  BigQuery credential is configured — consumers cannot distinguish the two from the API payload
  alone. Treat any deployment without a configured GDELT feed as synthetic demo data.
- Entity matching is name-substring based (ILIKE `%name%` in routes; string equality at ingest)
  — no LEI resolution despite the `entity_lei` column; homonym contamination is possible.
- Scoring period is frozen at calendar-2023; `trend` is always "Stable"; sector is a keyword
  guess; country is the first event's actor country.
- The 40/35/25 weights, the 1,000-mention saturation and 75/50/25 severity bands are synthetic
  calibrations; the composite mixes *frequency*, *sentiment* and *salience* linearly with no
  recency decay or severity-of-incident dimension (contrast MSCI's controversy assessment,
  which grades case severity and company involvement).
- E/S/G sub-scores are shares of one composite — they always sum to the composite and cannot
  exceed it, so a firm with only environmental flags shows env_score = composite.
- Raw SQL with string-interpolated WHERE clauses is parameter-bound (`:params`) — injection-safe
  — but ILIKE searches are unindexed pattern scans at scale.

### 7.7 Framework alignment

- **GDELT 2.0 / CAMEO** — the module consumes GDELT's native semantics faithfully: CAMEO event
  codes, the four-quadrant quad-class (1 verbal coop, 2 material coop, 3 verbal conflict,
  4 material conflict), the Goldstein scale (a fixed −10…+10 weighting of event types by their
  theoretical impact on country stability), and document tone from GKG.
- **ESG controversy screening practice** (MSCI/Sustainalytics-style) — the composite emulates a
  media-signal controversy score: negative-event share ≈ incident frequency, tone ≈ severity
  proxy, mentions ≈ salience. Commercial systems additionally grade incident severity
  (minor→very severe), company involvement, and apply time decay — none of which is modelled
  here.
- **SFDR PAI / EBA ESG risk monitoring** — controversy flags of this kind feed "violations of
  UNGC principles" style indicators elsewhere on the platform; this domain only supplies the
  media-derived signal, not the regulatory mapping.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrated controversy scoring with trend detection (analytics ladder: rung 1 → 4)

**What.** The route layer is read-only over three ingested tables (`dh_gdelt_events`,
`dh_gdelt_gkg`, `dh_controversy_scores`); the score itself is computed at ingest as
`neg_ratio×40 + tone_severity×35 + volume_factor×25` with platform-calibration-uncited
weights, and — the honest defect worth naming — the `trend` field is hardcoded
`"Stable"`. Evolution A calibrates the weights against outcomes and computes a real
trend from the time series the tables already hold.

**How.** (1) Replace the hardcoded `trend` with a slope over the entity's monthly
controversy-score history (the `/controversy/entity/{name}` endpoint already pulls
recent scores; the timeline endpoints prove the series exists) — direction + momentum,
honest null when <3 months of data. (2) Layer a predictive escalation flag: a simple
change-point / EWMA on mention-volume and tone that fires before the composite crosses a
severity band, using statsmodels already in the environment. (3) Calibrate the 40/35/25
weights and the 1000-mention saturation cap against a labelled set of known ESG
controversies rather than leaving them synthetic, and document the fit as a §8 model
card.

**Prerequisites.** Sufficient historical GDELT depth per entity (ingest cadence must
retain months, not just latest); a labelled controversy set for weight calibration.
**Acceptance:** `trend` reflects the actual score slope and varies across entities; an
escalation flag fires on a backtested known controversy before the severity-band cross;
weight provenance moves from "uncited" to a documented calibration.

### 9.2 Evolution B — Controversy monitoring analyst with grounded entity dossiers (LLM tier 2)

**What.** A copilot that answers "what's driving Acme's High controversy rating?" by
calling `/controversy/entity/{name}` and narrating the real component decomposition
(neg-ratio, tone, volume) plus the top-5 GKG themes and the 10 most-recent events the
endpoint returns — then supports comparative and ranking queries via
`/controversy/rankings` and `/events/search`.

**How.** Eleven read-only GET endpoints make a clean tier-2 tool surface: entity detail,
rankings (SQL `RANK() OVER controversy_score`), event/GKG search, timelines, and stats.
The E/S/G pillar proration (`env_score = env_flags/total_flags × composite`) gives the
copilot a defensible way to answer "is this an environmental or governance issue?".
The no-fabrication validator is essential here — controversy narratives are exactly
where an ungrounded LLM would invent incidents; every event cited must map to a returned
`dh_gdelt_events` row with its GDELT source URL.

**Prerequisites.** Evolution A's real `trend` first — a copilot narrating "trend:
Stable" for every entity (the current hardcoded value) would mislead on the single
question analysts care about most. **Acceptance:** every incident, theme, and score
component in a dossier traces to a tool response row; asking for events outside the
ingested window returns a coverage disclaimer, not fabricated recent news; "trend"
statements match the computed slope.