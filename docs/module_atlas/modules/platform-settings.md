# Platform Settings
**Module ID:** `platform-settings` · **Route:** `/platform-settings` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised configuration hub for global platform parameters, user management, API keys, data source toggles, and access controls.

> **Business value:** Provides administrators with a single control plane for platform governance, user lifecycle management, and integration configuration.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEATURE_FLAGS`, `Gauge`, `INTEGRATIONS`, `MONTHS`, `PIE_COLORS`, `TABS`, `WEBHOOKS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `rng` | `(min,max,s)=>min+sr(s)*(max-min);` |
| `rngI` | `(min,max,s)=>Math.floor(rng(min,max,s));` |
| `fmtDate` | `(iso) => new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});` |
| `pct` | `Math.min(100, (value/max)*100);` |
| `angle` | `(pct/100)*270;` |
| `rad` | `(a) => (a-135)*Math.PI/180;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEATURE_FLAGS`, `INTEGRATIONS`, `MONTHS`, `PIE_COLORS`, `TABS`, `WEBHOOKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Users | — | Auth Service | Number of users with active platform credentials. |
| API Integrations Enabled | — | Integration Registry | Count of third-party data integrations currently active. |
| Auth Mode | — | IAM Config | Currently configured authentication protocol for platform access. |
- **Admin UI inputs + environment variables** → Validation; encryption of secrets; config persistence → **Active platform configuration applied at runtime**

## 5 · Intermediate Transformation Logic
**Methodology:** Configuration Completeness
**Headline formula:** `C = configured_params / total_params × 100`
**Standards:** ['Internal Platform Config Schema']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).