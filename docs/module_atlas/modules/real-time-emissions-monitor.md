# Real-Time Emissions Monitor
**Module ID:** `real-time-emissions-monitor` · **Route:** `/real-time-emissions-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Live GHG emissions monitoring dashboard ingesting IoT sensor data, smart meter feeds, and real-time activity data for near-real-time Scope 1 and 2 tracking.

> **Business value:** Enables facilities and sustainability teams to move beyond annual GHG accounting to continuous operational emissions monitoring with real-time anomaly detection.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `COMPLIANCE_STATUSES`, `FACILITIES`, `PATHWAY_YEARS`, `REGIONS`, `SECTORS`, `VERIFICATION_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMPLIANCE_STATUSES` | `['Compliant','Non-Compliant','Pending Review','Exempt'];` |
| `sectorIdx` | `Math.floor(sr(i * 7) * SECTORS.length);` |
| `regionIdx` | `Math.floor(sr(i * 11) * REGIONS.length);` |
| `permitLimit` | `50 + sr(i * 13) * 950; // ktCO2e` |
| `budgetUtilization` | `0.4 + sr(i * 17) * 0.8;` |
| `scope1Current` | `parseFloat((permitLimit * budgetUtilization).toFixed(1));` |
| `scope1Variance` | `parseFloat((scope1Current - scope1Budget).toFixed(1));` |
| `scope2Location` | `parseFloat((scope1Current * (0.1 + sr(i * 19) * 0.3)).toFixed(1));` |
| `scope2Market` | `parseFloat((scope2Location * (0.5 + sr(i * 23) * 0.8)).toFixed(1));` |
| `scope3Up` | `parseFloat((scope1Current * (0.3 + sr(i * 29) * 0.7)).toFixed(1));` |
| `anomalyScore` | `parseFloat((sr(i * 31) * 100).toFixed(1));` |
| `complianceIdx` | `Math.floor(sr(i * 37) * COMPLIANCE_STATUSES.length);` |
| `verIdx` | `Math.floor(sr(i * 41) * VERIFICATION_STATUSES.length);` |
| `emissionFactor` | `parseFloat((0.1 + sr(i * 43) * 2).toFixed(3));` |
| `obs` | `scope1Current * (0.8 + sr(i * 100 + t) * 0.4);` |
| `PATHWAY_YEARS` | `Array.from({ length: 26 }, (_, i) => 2025 + i);` |
| `tabs` | `['Monitoring Dashboard','Facility Table','Anomaly Detection','Permit Compliance','Scope 2 Dual-Reporting','Reduction Pathways','Summary & Export'];` |
| `total` | `FACILITIES.reduce((s, f) => s + f.scope1Current, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `COMPLIANCE_STATUSES`, `REGIONS`, `SECTORS`, `VERIFICATION_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Live Scope 1 Rate (tCO₂e/hr) | — | IoT Sensor Network | Current Scope 1 emission rate from connected on-site combustion and process sources. |
| MTD Emissions (tCO₂e) | — | Accumulated Totals | Month-to-date accumulated GHG emissions across all monitored sites. |
| Sensor Uptime (%) | — | IoT Telemetry | Proportion of monitored sensors reporting within expected latency threshold. |
- **IoT sensor streams + smart meter feeds + manual activity data** → Real-time EF multiplication; aggregation; anomaly detection → **Live emissions dashboard, MTD totals, and anomaly alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Real-Time Emission Rate
**Headline formula:** `Eẖ = Σ(Aᵢ(t) × EFᵢ) aggregated per 15-min interval`
**Standards:** ['GHG Protocol Corporate Standard', 'IPIECA Continuous Emissions Monitoring']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).