# Platform Settings
**Module ID:** `platform-settings` · **Route:** `/platform-settings` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised configuration hub for global platform parameters, user management, API keys, data source toggles, and access controls.

> **Business value:** Provides administrators with a single control plane for platform governance, user lifecycle management, and integration configuration.

**How an analyst works this module:**
- Configure data source connections and API credentials.
- Manage user roles and permissions.
- Set platform-wide defaults (currency, reporting period, taxonomy).
- Enable or disable feature flags and experimental modules.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEATURE_FLAGS`, `Gauge`, `INTEGRATIONS`, `MONTHS`, `PIE_COLORS`, `TABS`, `WEBHOOKS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FEATURE_FLAGS` | 21 | `id`, `name`, `desc`, `category`, `enabled`, `lastToggled`, `toggledBy` |
| `INTEGRATIONS` | 9 | `id`, `name`, `url`, `status`, `type`, `lastTest`, `latency` |
| `WEBHOOKS` | 5 | `id`, `name`, `url`, `events`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `rng` | `(min,max,s)=>min+sr(s)*(max-min);` |
| `rngI` | `(min,max,s)=>Math.floor(rng(min,max,s));` |
| `fmtDate` | `(iso) => new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});` |
| `pct` | `Math.min(100, (value/max)*100);` |
| `angle` | `(pct/100)*270;` |
| `rad` | `(a) => (a-135)*Math.PI/180;` |
| `healthMetrics` | `useMemo(()=>({ cpu: 24 + sr(1001)*30, memory: 45 + sr(1003)*25, dbConnections: {active:rngI(5,25,1005), max:50}, uptime: '14d 7h 23m', uptimePct: 99.97, bgJobs: {queued:rngI(0,8,1007), running:rngI(1,5,1009), failed:rngI(0,3,1011)}, cacheHitRate: 85 + sr(1013)*12,` |
| `errorTrend` | `useMemo(()=>{ return MONTHS.map((m,mi)=>({ month:m, errorRate: 0.01 + sr(mi*1101)*0.1, requestCount: rngI(5000,50000,mi*1103), }));` |
| `sessionTrend` | `useMemo(()=>{ return Array.from({length:24},(_, h)=>({ hour:`${String(h).padStart(2,'0')}:00`, sessions: rngI(1,30,h*1201), }));` |

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

Percentage of mandatory platform parameters that have been set to non-default values.

**Standards:** ['Internal Platform Config Schema']
**Reference documents:** OWASP Application Security Verification Standard; NIST SP 800-63 Digital Identity Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises a *Configuration Completeness* metric
> `C = configured_params / total_params × 100`. **No such completeness score is computed.** The page
> is an admin control plane: 4 tabs (General, Integration, Feature Flags, System Health) rendering
> curated config tables plus a synthetic system-health telemetry block. There is no financial or risk
> quantity here, so no production model specification (§8) applies.

### 7.1 What the module computes

The only numeric logic is the **System Health** tab's synthetic telemetry and a small gauge helper:

```js
rng(min,max,s)  = min + sr(s)·(max−min)            // seeded uniform draw
rngI(min,max,s) = floor(rng(...))                  // integer variant
pct   = min(100, (value/max)·100)                  // gauge fill %
angle = (pct/100)·270                              // 270° arc sweep
rad(a)= (a−135)·π/180                              // arc start at −135°
```

Health metrics object:
```js
healthMetrics = {
  cpu:    24 + sr(1001)·30,          // 24–54 %
  memory: 45 + sr(1003)·25,          // 45–70 %
  dbConnections: { active: rngI(5,25,1005), max: 50 },
  cacheHitRate: 85 + sr(1013)·12,    // 85–97 %
  bgJobs: { queued: rngI(0,8,1007), running: rngI(1,5,1009), failed: rngI(0,3,1011) },
  uptimePct: 99.97, uptime: '14d 7h 23m'
}
errorTrend[m]  = { errorRate: 0.01 + sr(m·1101)·0.1, requestCount: rngI(5000,50000,m·1103) }
sessionTrend[h]= { sessions: rngI(1,30,h·1201) }   // 24 hourly buckets
```

### 7.2 Parameterisation / seed rubric

| Data | Rows / formula | Provenance |
|---|---|---|
| `FEATURE_FLAGS` | 20 curated flags (`enabled`, `category`, `lastToggled`, `toggledBy`) | static demo config |
| `INTEGRATIONS` | 8 curated connectors (EODHD, MSCI, CDP, Refinitiv, Supabase, SMTP...) with masked keys | static demo config |
| `WEBHOOKS` | 4 curated Slack/Teams/email hooks | static demo config |
| `healthMetrics.*` | fixed-seed `sr(1001..1013)` uniform draws | synthetic demo value |
| `errorTrend` | `0.01 + sr(m·1101)·0.1` over 12 months | synthetic demo value |
| `sessionTrend` | `rngI(1,30,h·1201)` over 24 hours | synthetic demo value |

All seeds are constant (`1001`, `1003`, ...), so every render shows identical "live" telemetry — the
dashboard is deterministic, not real-time.

### 7.3 Calculation walkthrough

There is no aggregation pipeline. Config tables render directly. The gauges (`cpu`, `memory`,
`cacheHitRate`) convert a value to a `pct` fill and an SVG arc `angle`/`rad`. `errorTrend` and
`sessionTrend` feed area/line charts. Toggling a feature flag mutates local component state only —
nothing persists to a backend in this page.

### 7.4 Worked example

CPU gauge with `healthMetrics.cpu = 24 + sr(1001)·30`. Suppose `sr(1001)=0.40` → cpu = 36.0 %:

| Step | Computation | Result |
|---|---|---|
| pct | min(100, (36/100)·100) | 36 |
| angle | (36/100)·270 | 97.2° |
| arc start | rad(97.2) = (97.2−135)·π/180 | −0.66 rad |

The gauge sweeps 270° from −135°, so 36 % fills just over one-third of the arc.

### 7.5 Data provenance & limitations

- **All telemetry is synthetic**, driven by `sr(seed)=frac(sin(seed+1)×10⁴)` with hard-coded seeds;
  config tables are curated static rows. No connection to real infrastructure metrics, IAM, or a
  secrets vault. API keys shown are masked placeholders (`eodhd_***`, `msci_***`).
- No completeness score, no persistence, no live health polling. This is a presentation-grade admin
  shell. No risk/financial output → §8 not applicable.

**Framework alignment:** OWASP ASVS / NIST SP 800-63 — cited as the security posture the settings
*would* govern (SSO/SAML, RBAC, rate limiting); the page surfaces these as toggles and labels rather
than enforcing them in code.

## 9 · Future Evolution

### 9.1 Evolution A — Real configuration state and completeness scoring (analytics ladder: rung 1 → 2)

**What.** This is an admin control plane, not a climate-quant module — 4 tabs (General, Integration, Feature Flags, System Health) rendering config tables plus system telemetry. §7 flags that the guide's Configuration Completeness metric (`C = configured_params / total_params × 100`) is not computed, and the System Health tab is synthetic (`cpu = 24 + sr()·30`, `memory = 45 + sr()·25`, `uptimePct = 99.97` hard-coded). There is no financial/risk quantity here, so §8 correctly notes no production model applies. Evolution A makes the control plane operate on real platform state.

**How.** (1) Back the config tables with the platform's actual settings store — feature flags, integration credentials, data-source toggles that the rest of the platform actually reads (rather than display-only tables), so toggling a flag has a real effect. This connects to the roadmap's multi-tenancy work (D2): settings become org-scoped, RLS-protected configuration. (2) Implement the Configuration Completeness score (`C = configured / total × 100`) against the real mandatory-parameter schema, so admins see genuine setup progress. (3) Replace the synthetic System Health telemetry (`sr()`-seeded cpu/memory/cache) with real metrics from the platform's infrastructure — the same real-telemetry path as `pipeline-dashboard` and `platform-analytics`. This is an ops/config surface, so rung-2 (real state + completeness) is the honest ceiling; no predictive modelling applies.

**Prerequisites.** A real settings store with read-through to consuming modules (the harder part — today's flags are display-only); real infra metrics for System Health; org-scoping per D2. Remove the seeded health telemetry. **Acceptance:** toggling a feature flag changes platform behavior; Configuration Completeness reflects the real schema; System Health shows real cpu/memory/uptime.

### 9.2 Evolution B — Admin-configuration copilot (LLM tier 2, RBAC-gated)

**What.** A copilot for the administrator users §1 targets: "which mandatory settings are unconfigured?", "enable the CDP integration and set the reporting period to quarterly", "what feature flags are on for this org?", "is the platform healthy?" — grounded in real config state (post-Evolution-A) and the OWASP ASVS / NIST SP 800-63 references named in §5 for security-setting guidance.

**How.** Tier 1 explains configuration state and completeness from the real settings store: system prompt from this Atlas page and the config schema; the copilot reports what's set, what's missing, and health status. Tier 2 executes configuration changes as tool calls — but this is a high-privilege surface, so every mutating action (enabling integrations, changing access controls, toggling flags) requires explicit confirmation and hard RBAC gating to platform-admin, per the roadmap's Tier-2 mutating-endpoint pattern; the copilot inherits the user's session, never a service account. Security-sensitive settings changes (access controls, API keys) should require step-up confirmation and cite the relevant OWASP/NIST guidance.

**Prerequisites (hard).** Evolution A's real settings store (a copilot toggling display-only flags does nothing); strict RBAC on the copilot endpoint (admin-only); confirmation on every write. **Acceptance:** config queries reflect real state; every settings change requires confirmation and admin RBAC; security-setting changes cite the applicable standard and require step-up.