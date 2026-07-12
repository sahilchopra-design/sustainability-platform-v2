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
