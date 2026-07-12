# Data Source Manager
**Module ID:** `data-source-manager` · **Route:** `/data-source-manager` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised registry for all ESG data providers, covering licensing terms, API credentials, rate limits, and data refresh schedules. Administrators configure provider priority rankings that feed the reconciliation engine. Real-time connectivity status and usage telemetry are displayed per source.

> **Business value:** Gives data operations teams a single control plane for all ESG data sources, ensuring credentials, licenses, and schedules are actively managed. Reliable provider configuration underpins the accuracy and completeness of every downstream analytics and disclosure module.

**How an analyst works this module:**
- Add a new provider by supplying API endpoint, credentials, and field mapping template
- Set refresh schedule and priority rank; ranks feed the reconciliation conflict-resolution engine
- Monitor connectivity status and error-rate trends on the provider health dashboard
- Renew licenses and rotate API keys before expiry to avoid data feed interruptions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGINE_LINEAGE`, `EngineLineageTab`, `LiveApiTesterTab`, `PIPELINE_TEMPLATES`, `SOURCES`, `SOURCE_FIELDS`, `SourceRegistryTab`, `StatusBadge`, `SyncMonitorTab`, `TARGET_TABLES`, `TEST_SCENARIOS`, `TRANSFORM_TYPES`, `TransformPipelineTab`, `VisualFieldMapperTab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOURCES` | 21 | `id`, `name`, `type`, `status`, `fields`, `endpoints`, `lastSync`, `rateLimit`, `used`, `max` |
| `TEST_SCENARIOS` | 11 | `id`, `source`, `name`, `method`, `path`, `params`, `key`, `value`, `editable` |
| `ENGINE_LINEAGE` | 9 | `engine`, `tables`, `sources` |
| `PIPELINE_TEMPLATES` | 16 | `id`, `name`, `source`, `target`, `stages`, `type`, `config` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtNum` | `(n)=>{if(typeof n!=='number')n=Number(n);if(isNaN(n))return String(n);if(n>=1e12)return(n/1e12).toFixed(1)+'T';if(n>=1e9)return(n/1e9).toFixed(1)+'B';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed` |
| `fmtDate` | `(iso)=>{if(!iso)return'\u2014';const d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});};` |
| `similarity` | `(a,b)=>{const al=a.toLowerCase().replace(/[^a-z0-9]/g,''),bl=b.toLowerCase().replace(/[^a-z0-9]/g,'');const maxLen=Math.max(al.length,bl.length);if(maxLen===0)return 1;return Math.round((1-levenshtein(al,bl)/maxLen)*100)` |
| `base` | `SOURCES.findIndex(s=>s.id===sourceId)*13;` |
| `severity` | `sr(base+i*7)>0.7?'ERROR':sr(base+i*7)>0.3?'WARN':'INFO';` |
| `mappedSrc` | `useMemo(()=>new Set(mappings.map(m=>m.sourceField)),[mappings]);` |
| `mappedTgt` | `useMemo(()=>new Set(mappings.map(m=>m.targetField)),[mappings]);` |
| `unmappedSrc` | `srcFields.length-mappedSrc.size;` |
| `unmappedTgt` | `tgtFields.length-mappedTgt.size;` |
| `coverage` | `tgtFields.length>0?Math.round(mappedTgt.size/tgtFields.length*100):0;` |
| `config` | `{source:selectedSource,target:selectedTarget,mappings:mappings.map(m=>({source_field:m.sourceField,target_column:m.targetField,transform:m.transform,confidence:m.confidence})),created_at:new Date().toISOString()};` |
| `blob` | `new Blob([JSON.stringify(config,null,2)],{type:'application/json'});` |
| `midX` | `(sp.x+tp.x)/2;` |
| `statusCode` | `sr(base*3)>0.85?500:sr(base*7)>0.9?400:200;` |
| `responseTime` | `Math.floor(40+sr(base*11)*350);` |
| `headers` | `{'Content-Type':'application/json','X-RateLimit-Remaining':String(Math.floor(sr(base*13)*500)),'X-RateLimit-Limit':'1000','X-Request-Id':'req_'+String(base).padStart(8,'0'),'Cache-Control':'max-age=300'};` |
| `delay` | `800+sr(selectedScenario.length)*1200;` |
| `key` | `parentKey+'[]';` |
| `val` | `ri===0?f.sample:f.type==='number'?String(Number(Number(f.sample)*(1+sr(ri*fi+3)*0.2-0.1)).toFixed(2)):f.sample;` |
| `records` | `Math.floor(40+sr(i*7+selectedPipeline.length)*160);` |
| `errors` | `Math.floor(sr(i*13)*4);` |
| `qualityData` | `useMemo(()=>{ return allTables.map((t,i)=>({ table:t, freshness:Math.floor(80+sr(i*7)*20), completeness:Math.floor(85+sr(i*11)*15), nullRate:Number((sr(i*13)*8).toFixed(1)), }));` |
| `syncHistory` | `useMemo(()=>{ return SOURCES.map((src,si)=>{ return{ ...src, sparkline:Array.from({length:14},(_,i)=>({day:i,records:Math.floor(100+sr(si*14+i)*900),errors:Math.floor(sr(si*14+i+7)*5)})), schedule:sr(si*3)>0.5?'Every 6 hours':'Daily at 06:00 UTC', nextSync:new Date(Date.now()+Math.floor(sr(si*5)*86400000)).toISOString(), avgDuration:Math.` |
| `errorLog` | `useMemo(()=>{ return Array.from({length:12},(_,i)=>{ const sourceIdx=Math.floor(sr(i*7)*SOURCES.length);` |
| `typeIdx` | `Math.floor(sr(i*11)*6);` |
| `syncs` | `Math.floor(sr(dayNum*3)*5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGINE_LINEAGE`, `PIPELINE_TEMPLATES`, `SOURCES`, `TEST_SCENARIOS`, `TRANSFORM_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Providers | — | Provider registry | Count of data sources with valid credentials and at least one successful pull in the last 7 days |
| API Error Rate (7d) | — | API telemetry | Share of API calls returning non-200 responses across all providers |
| Avg Freshness Lag | — | Timestamp comparison | Mean difference between provider stated refresh cadence and actual delivery time |
| License Expiry <30d | — | License registry | Count of provider licenses expiring within 30 days requiring renewal action |
- **Provider API endpoints and SFTP feeds** → Credential validation, rate-limit tracking, and field mapping to canonical schema → **Connectivity status and per-provider field coverage report**
- **License management database** → Expiry date monitoring with configurable alert lead time → **License renewal queue with contract metadata**
- **API telemetry logs** → Error rate and latency aggregation by provider and endpoint → **Provider Reliability Index time series**

## 5 · Intermediate Transformation Logic
**Methodology:** Provider Reliability Index
**Headline formula:** `PRI = (1 − ErrorRate) × AvailabilityPct × FreshnessScore`

The reliability index is computed daily from API error rates, uptime, and data freshness relative to the provider's stated refresh cadence. PRI scores drive default priority weights in the reconciliation engine.

**Standards:** ['ISO/IEC 25012 Data Quality', 'PCAF Source Hierarchy']
**Reference documents:** PCAF (2022) Data Source Hierarchy and Quality Tiers; ISO/IEC 25012:2008 Software Engineering â€” Data Quality Model; ESMA (2023) Guidelines on ESG Rating Data Providers

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide names a *Provider Reliability Index* `PRI = (1 − ErrorRate) × AvailabilityPct ×
FreshnessScore` "computed daily from API error rates, uptime and freshness". **No PRI is computed in
the code.** This module is an operational control plane: a static registry of 21 sources (10 detailed
inline: EODHD, Alpha Vantage, Climate TRACE, World Bank, SEC EDGAR, ECB, UN PRI, CDP, MSCI, Bloomberg),
a field-mapping canvas with Levenshtein auto-match, an API request tester, pipeline templates, and
sync/error telemetry — the telemetry is `sr()`-seeded, not measured. The mismatch is that the guide
promises a reliability score that isn't there; the sections below document the real tooling.

### 7.1 What the module computes

The only genuine algorithm is **field-mapping similarity** (schema reconciliation):

```js
levenshtein(a, b)                                    // edit distance
similarity(a,b) = round((1 − levenshtein(al,bl)/maxLen) × 100)   // normalised %, case/punct-stripped
coverage = round(mappedTgt.size / tgtFields.length × 100)         // % of canonical columns mapped
```

Everything else is telemetry synthesis over the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`:

```js
severity     = sr(base+i·7) > 0.7 ? 'ERROR' : > 0.3 ? 'WARN' : 'INFO'
statusCode   = sr(base·3) > 0.85 ? 500 : sr(base·7) > 0.9 ? 400 : 200
responseTime = 40 + sr(base·11)·350   // ms
records      = 40 + sr(i·7+…)·160 ; errors = sr(i·13)·4
qualityData  = {freshness: 80+sr·20, completeness: 85+sr·15, nullRate: sr·8}
syncHistory  = 14-day sparkline of records/errors per source
```

### 7.2 Registry & parameterisation

| Element | Value | Provenance |
|---|---|---|
| Sources (detailed) | 10 real APIs w/ baseUrl, authType, rateLimit | real vendor endpoints (`SOURCES`) |
| Sources (total) | 21 | registry count |
| Test scenarios | 11 | canned request specs (`TEST_SCENARIOS`) |
| Engine lineage | 9 engine→table→source rows | `ENGINE_LINEAGE` (real platform wiring) |
| Pipeline templates | 16 | `PIPELINE_TEMPLATES` |
| Rate limits | e.g. EODHD 1240/5000, Bloomberg 45000/100000 | plausible static values |
| Mock headers | `X-RateLimit-Remaining = sr·500`, `X-RateLimit-Limit = 1000` | synthetic |

Source records (baseUrl, authType — API Key / OAuth2 / Certificate / User-Agent / Bearer / None) are
real and correct for each provider; the live status (`active/warning/inactive`) and lastSync are
static seed values.

### 7.3 Calculation walkthrough

The **mapping canvas** is the substantive workflow: user picks a source schema and the canonical
target; for each source field the tool suggests the best target by max `similarity()`; user confirms
mappings; `coverage` reports how much of the canonical schema is filled; export produces a JSON config
`{source, target, mappings:[{source_field, target_column, transform, confidence}], created_at}`. The
**API tester** replays a `TEST_SCENARIO` and renders a synthesised response (status/latency/headers/
body, the body mutating numeric samples by `±10%` via `sr`). The **sync/error/quality** tabs render
seeded telemetry.

### 7.4 Worked example

Mapping EODHD's `General.MarketCapitalization` to canonical `market_cap_usd_mn`:
strip to `generalmarketcapitalization` (28 chars) vs `marketcapusdmn` (14). Levenshtein ≈ 18,
`maxLen = 28`, `similarity = round((1 − 18/28)×100) = round(35.7) = 36%` — a weak match, so the tool
would rank a better candidate higher or leave it for manual mapping. A tester call to a scenario with
`base·3` drawing 0.90 returns `statusCode 500`, `responseTime = 40 + sr(base·11)·350 ≈ 215 ms`.

### 7.5 Data provenance & limitations

- Source list, endpoints, auth types and the engine-lineage map are **real**; all *dynamic*
  telemetry (status codes, latency, error logs, sync sparklines, quality scores, rate-limit
  remaining) is **synthetic**, seeded by `sr()`. No live API calls are made.
- The PRI the guide describes is absent — there is no error-rate/uptime/freshness composite.
- Field-mapping similarity is a real edit-distance heuristic but semantically blind
  (`Highlights.Revenue` vs `revenue_usd_mn` scores low despite being the same concept); production
  schema-matching would use a synonym/ontology layer.

**Framework alignment:** ISO/IEC 25012 (data quality model) — the quality tab's freshness/
completeness/null-rate dimensions echo its accuracy/completeness/currentness characteristics, though
here they are seeded not measured. PCAF source hierarchy underlies the intended provider-priority
feed into reconciliation (this manager is where priority ranks *would* be set). ESMA's ESG-rating-
provider guidelines motivate the registry's licensing/credential governance framing.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the PRI from measured telemetry; probe connectivity for real (analytics ladder: rung 1 → 2)

**What.** §7's finding: the registry content is real (10 detailed provider records
with correct endpoints and auth types, a genuine engine-lineage map, a working
Levenshtein field-mapping canvas), but all dynamic telemetry — status codes,
latency, error logs, sync sparklines, rate-limit headers — is `sr()`-seeded, no
live API calls are made, and the guide's
`PRI = (1−ErrorRate) × Availability × Freshness` is absent. Evolution A measures
what the page currently fakes.

**How.** (1) Telemetry: per-provider error rates and latency from the platform's
real ingestion runs (data-hub sync logs) and the audit tables — the same D4
materialized views `data-infra-hub`'s evolution builds; one telemetry layer, many
consumers. (2) Connectivity: a scheduled lightweight health probe per registered
source (status endpoint or cheapest GET), recording uptime and real rate-limit
headers — replacing seeded 500s. (3) PRI computed daily per the guide's formula,
with freshness = observed refresh lag vs stated cadence; PRI feeds default
priority ranks into `data-reconciliation`'s election, closing the loop the two
modules' guides both describe. (4) Mapping canvas upgrade: add a curated synonym
layer over the edit-distance heuristic (§7.5 notes `Highlights.Revenue` vs
`revenue_usd_mn` scores low) — a small ontology table, not ML.

**Prerequisites.** Probe scheduling with credential handling (secrets stay
server-side); the shared telemetry views; seed purge. **Acceptance:** killing a
provider's key flips its live status within one probe cycle; PRI reproduces from
logged error/uptime/freshness numbers; reconciliation's default ranks update when
PRI shifts.

### 9.2 Evolution B — Onboarding copilot for new data sources (LLM tier 2)

**What.** Adding a provider is the module's core workflow and its most manual:
endpoint discovery, auth configuration, field mapping. Evolution B accelerates the
last mile: given a sample API response, the copilot proposes canonical-schema
mappings with rationale — the semantic matching the Levenshtein canvas can't do
("`Highlights.MarketCapitalization` → `market_cap_inr_cr`, unit conversion
needed: USD → INR crore") — plus unit/currency conversion flags and a draft
pipeline-template selection from the 16 existing templates. Proposals land in the
mapping canvas for confirmation, never auto-applied.

**How.** Tier-2 with gated writes into the mapping config: prompts ground on the
canonical schema's field definitions and the existing mappings as few-shot
exemplars; deterministic validation (type compatibility, unit-dimension checks)
runs on every proposal. Confirmed mappings accumulate as the synonym layer
Evolution A wants — the flywheel again.

**Prerequisites.** Evolution A's canonical schema service; sample-response
capture in the tester. **Acceptance:** on a held-out provider schema, ≥80% of
proposed mappings confirmed unchanged; every proposal names its unit conversion
or states none; nothing maps without human confirmation.