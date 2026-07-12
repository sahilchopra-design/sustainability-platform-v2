# Worker Heat Stress
**Module ID:** `worker-heat-stress` · **Route:** `/worker-heat-stress` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Outdoor worker heat exposure risk and labour productivity loss analytics platform using WBGT and UTCI indices, ILO productivity loss curves and IPCC warming projections by geography and occupation.

> **Business value:** The ILO estimates heat stress already costs 2.4% of global working hours (≄80M full-time jobs) annually; by 2030 this rises to 2.2°C equivalent losses concentrated in South Asia, West Africa and the Caribbean.

**How an analyst works this module:**
- Map workforce locations and outdoor exposure hours by role
- Apply WBGT calculations using local temperature, humidity and radiation data
- Project WBGT under IPCC warming scenarios to 2030/2050
- Quantify productivity loss using ILO sector-specific curves
- Report to ESRS S1 working conditions and GRI 403 health and safety

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `COUNTRIES`, `QUARTERS`, `REGULATIONS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `name` | `COMPANY_PREFIXES[i%COMPANY_PREFIXES.length]+' '+COMPANY_SUFFIXES[Math.floor(s2*COMPANY_SUFFIXES.length)];` |
| `totalWorkforce` | `Math.floor(s3*50000+500);` |
| `outdoorPct` | `Math.floor(s4*70+10);` |
| `outdoorWorkers` | `Math.floor(totalWorkforce*outdoorPct/100);` |
| `wbgtExposureHrs` | `Math.floor(s5*2000+100);` |
| `country` | `COUNTRIES[Math.floor(s6*COUNTRIES.length)];` |
| `prodLossPct` | `+(sr(i*37+515)*12+1).toFixed(1);` |
| `annualCostM` | `Math.floor(sr(i*41+517)*50+1);` |
| `litigationRisk` | `Math.floor(sr(i*43+519)*100);` |
| `iloComplianceScore` | `Math.floor(sr(i*47+521)*100);` |
| `oshaComplianceScore` | `Math.floor(sr(i*53+523)*100);` |
| `euComplianceScore` | `Math.floor(sr(i*59+525)*100);` |
| `overallCompScore` | `Math.floor((iloComplianceScore+oshaComplianceScore+euComplianceScore)/3);` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],wbgt:+(26+qi*0.3+sr(i*61+qi*11)*3).toFixed(1),incidents:Math.floor(sr(i*67+qi*13)*20+1),prodLoss:+(prodLossPct*(0.85+qi*0.02+sr(i*71+qi*7)*0.1)).toFixed(1)}));` |
| `regScores` | `REGULATIONS.map((_,ri)=>({reg:REGULATIONS[ri],score:Math.floor(sr(i*73+ri*11+527)*100)}));` |
| `shiftOpt` | `{currentShift:'Standard 8hr',optimalShift:sr(i*79+529)>0.5?'Split Shift (5am-10am, 3pm-7pm)':'Early Start (5am-1pm)',potentialSaving:+(sr(i*83+531)*5+1).toFixed(1)};` |
| `esgIntegration` | `Math.floor(sr(i*89+533)*100);` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `topKPIs` | `useMemo(()=>({ totalOutdoor:COMPANIES.reduce((s,c)=>s+c.outdoorWorkers,0), criticalCount:COMPANIES.filter(c=>c.riskTier==='Critical').length, avgWBGT:+(COMPANIES.reduce((s,c)=>s+c.wbgtExposureHrs,0)/ Math.max(1, COMPANIES.length)).toFixed(0), avgProdLoss:+(COMPANIES.reduce((s,c)=>s+c.prodLossPct,0)/ Math.max(1, COMPANIES.length)).toFixed(` |
| `sectorBenchmarks` | `useMemo(()=>SECTORS.map(sec=>{` |
| `gdpLossBySector` | `useMemo(()=>sectorBenchmarks.map(sb=>({sector:sb.sector,totalCostM:sb.totalCostM,avgLoss:+(COMPANIES.filter(c=>c.sector===sb.sector).reduce((s,c)=>s+c.prodLossPct,0)/sb.count).toFixed(1)})),[sectorBenchmarks]);` |
| `regAgg` | `useMemo(()=>REGULATIONS.map(reg=>{` |
| `scores` | `COMPANIES.map(c=>c.regScores.find(r=>r.reg===reg)?.score\|\|0);` |
| `avg` | `Math.floor(scores.reduce((s,v)=>s+v,0)/ Math.max(1, scores.length));` |
| `portfolioData` | `useMemo(()=>[...COMPANIES].sort((a,b)=>b.litigationRisk-a.litigationRisk).slice(0,30).map(c=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `COUNTRIES`, `QUARTERS`, `REGULATIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Workers at Risk (>2°C) | — | Heat Stress Model | Proportion of outdoor workforce exposed to unsafe WBGT levels (>28°C for heavy work) under 2°C warming scenario. |
| Productivity Loss (2030) | — | ILO Model | Projected reduction in productive work capacity due to heat stress across outdoor operations by 2030. |
| High-Risk Geographies | — | IPCC AR6 WG1 | Countries where WBGT will exceed ISO 7933 safety thresholds for heavy outdoor work for >60 days/year by 2050. |
- **Workforce Geocodes, NOAA/ERA5 Temperature Data, IPCC Projections** → WBGT engine + ILO productivity curves + scenario projection → **Heat stress risk maps, productivity loss estimates, ESRS S1/GRI 403 disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Wet Bulb Globe Temperature
**Headline formula:** `WBGT = 0.7 × Tₘᵣ + 0.2 × Tᵍ + 0.1 × Tₐᵒᵐ`

Composite thermal stress index combining natural wet bulb (humidity), globe (radiation) and dry bulb (air) temperatures; threshold for heavy work: WBGT ≥25°C.

**Standards:** ['ILO Working on a Warmer Planet 2019', 'ISO 7933 Heat Stress Standard']
**Reference documents:** ILO Working on a Warmer Planet 2019; ISO 7933 Ergonomics of the Thermal Environment; IPCC AR6 WG1 Chapter 11: Weather and Climate Extremes; Lancet Countdown on Health and Climate Change 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives the standard WBGT composite formula
> (`WBGT = 0.7×T_wetbulb + 0.2×T_globe + 0.1×T_air`). **This formula is never computed.** There is no
> wet-bulb, globe, or dry-bulb temperature input anywhere in the file — `wbgt` (in the quarterly
> trend) is a synthetic value directly drawn from the seeded PRNG (`26 + quarter×0.3 + noise`), not a
> weighted composite of component temperatures. `wbgtExposureHrs` (a separate field, hours of
> exposure) is also an independent random draw.

### 7.1 What the module computes

100 synthetic companies (`genCompanies(100)`) across 10 heat-exposed sectors (Construction,
Agriculture, Mining, Military, Oil & Gas, etc.) and 20 countries, each with: `totalWorkforce`
(500–50,500), `outdoorPct` (10–80%), `outdoorWorkers = totalWorkforce × outdoorPct/100`,
`wbgtExposureHrs` (100–2,100 hrs/yr, random), `prodLossPct` (1–13%, random), `annualCostM`,
`litigationRisk` (0–100), three regulatory compliance scores (ILO/OSHA/EU, each 0–100, random,
independently drawn), `overallCompScore = mean(ILO,OSHA,EU)`, a 12-quarter `qTrend` (synthetic
`wbgt`/`incidents`/`prodLoss` series), and `regScores` across 8 named heat-stress regulations.

```js
overallCompScore = floor((iloComplianceScore + oshaComplianceScore + euComplianceScore) / 3)
engagementPriority = litigationRisk>70 ? 'Critical' : >40 ? 'High' : >20 ? 'Medium' : 'Low'
riskTier = (same thresholds as engagementPriority, applied to litigationRisk)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `wbgtExposureHrs` | 100–2,100 hrs/yr | `sr(i·29+511)×2000+100`, synthetic, not derived from sector/climate |
| `qTrend.wbgt` | ~26–33°C (rising over 12 quarters) | `26 + quarter×0.3 + noise` — a smoothed upward trend, not a real WBGT calculation, and unrelated to `wbgtExposureHrs` or `country` |
| `prodLossPct` | 1–13% | `sr(i·37+515)×12+1`, synthetic uniform |
| `litigationRisk` | 0–100 | `sr(i·43+519)×100`, synthetic, drives `riskTier`/`engagementPriority` thresholds (>70/>40/>20) — the only genuinely tiered/thresholded field in the module |
| ILO/OSHA/EU compliance scores | 0–100 each | Independent random draws, not derived from any actual named regulation's specific requirements |

### 7.3 Calculation walkthrough

1. `topKPIs` aggregates `COMPANIES`: `totalOutdoor` (Σ outdoor workers), `criticalCount` (# with
   `riskTier==='Critical'`), `avgWBGT` (mean of `wbgtExposureHrs`, mislabelled as "WBGT" when it's
   actually exposure *hours*, a different unit than the WBGT temperature index itself),
   `avgProdLoss`.
2. `sectorBenchmarks` groups `COMPANIES` by sector for cost/loss comparison.
3. `gdpLossBySector` maps `sectorBenchmarks` to `totalCostM`/`avgLoss` per sector.
4. `regAgg` averages each of the 8 named regulations' `score` field across all 100 companies.
5. `portfolioData` sorts by `litigationRisk` descending, takes top 30, for the risk-prioritisation
   table — the only genuinely rank-ordered output in the module.
6. **`shiftOpt`** (shift-optimisation recommendation) picks between two fixed shift patterns
   (`sr(i·79+529)>0.5` coin-flip) with a random `potentialSaving` — not derived from the company's
   actual WBGT exposure pattern or productivity-loss curve.

### 7.4 Worked example

Under the guide's real WBGT formula, given illustrative component temperatures
`T_wetbulb=27°C`, `T_globe=34°C`, `T_air=32°C`:

```
WBGT = 0.7×27 + 0.2×34 + 0.1×32 = 18.9 + 6.8 + 3.2 = 28.9°C
```

At 28.9°C, per ISO 7243/ACGIH TLV guidance, heavy continuous outdoor work would already require
work/rest cycling. **None of this arithmetic exists in the code** — the closest analogue,
`qTrend.wbgt`, is generated directly as a number in the 26–33°C range without ever combining
component temperatures, so while the *displayed* number happens to fall in a plausible WBGT range,
it cannot be traced to any actual weather/humidity/radiation input and cannot respond to a change in
location, season, or climate scenario.

### 7.5 Data provenance & limitations

- **All 100 companies and every metric are synthetic** (`sr()`-seeded); no real workforce geocode,
  weather station, or NOAA/ERA5 temperature/humidity data underlies any figure, despite the guide
  citing exactly those sources.
- **The core WBGT formula the guide names is entirely absent** — this is the module's most consequential
  gap, since WBGT is the specific, standardised metric (ISO 7243) that occupational-safety regulators
  actually reference for heat-stress work/rest thresholds; a synthetic "WBGT-like" number cannot
  support a genuine ISO 7243 compliance claim.
- Compliance scores (ILO/OSHA/EU) are independent random draws with no linkage to the actual specific
  requirements of those three regulatory regimes (which differ materially — the EU Heat Directive
  proposal, OSHA's proposed rule, and ILO guidance have different trigger thresholds and coverage).

**Framework alignment:** ILO *Working on a Warmer Planet* (2019) and ISO 7243 (both named in the
guide) are **not implemented** as calculations — the module lists them as regulation names in the
static `REGULATIONS` array and scores compliance against them randomly, without encoding any of their
actual WBGT action-limit thresholds.

## 9 · Future Evolution

### 9.1 Evolution A — Real WBGT from weather data with ISO 7243 thresholds (analytics ladder: rung 1 → 2)

**What.** The guide's WBGT composite (`0.7×T_wetbulb + 0.2×T_globe + 0.1×T_air`) is
entirely absent — §7 documents that `qTrend.wbgt` is generated directly in a
plausible 26–33°C range with no temperature inputs, so it "cannot respond to a change
in location, season, or climate scenario", and the top KPI even mislabels exposure
*hours* as "WBGT". Evolution A computes real WBGT: the platform already ingests
NASA POWER and Open-Meteo weather series (data-sources wave 1), which supply
temperature/humidity/radiation per coordinate — enough for the standard outdoor WBGT
estimate (Liljegren or the simpler ACGIH approximation, documented per Atlas §8
convention). Layer on the pieces the module names but never encodes: ISO 7243
work/rest action limits by metabolic rate class, ILO sector productivity-loss curves
replacing the flat 1–13% random `prodLossPct`, and warming-scenario deltas from the
digital twin's IPCC-derived layers for the 2030/2050 projections. Compliance scores
stop being three independent random draws and become checklists against the actual
differing ILO/OSHA/EU trigger thresholds.

**How.** Backend `heat_stress_engine` (module is Tier B, no EP code) with
`POST /wbgt` (coordinates + months in, WBGT distribution + threshold-exceedance days
out) and `POST /productivity-loss`; company records gain geocodes; the coin-flip
`shiftOpt` becomes a real comparison of hourly WBGT profiles against shift windows.

**Prerequisites.** The synthetic WBGT and random compliance scores acknowledged as
fabrication-pattern removals; workforce geocoding for the demo portfolio.
**Acceptance:** the §7.4 worked example (27/34/32°C → 28.9°C) reproduces through the
endpoint; a Dubai site shows more threshold-exceedance days than a Hamburg site;
productivity loss varies by sector curve, not a uniform draw.

### 9.2 Evolution B — ESRS S1/GRI 403 heat-disclosure copilot (LLM tier 2)

**What.** The module's stated outputs are ESRS S1 working-conditions and GRI 403
health-and-safety disclosures. Evolution B is a tool-calling assistant for HR/EHS
teams: "assess our 12 sites for the 2026 season, tell me which need work/rest
protocols under ISO 7243, and draft the S1 heat-stress paragraph." It calls Evolution
A's `POST /wbgt` per site and `POST /productivity-loss` per workforce segment, maps
findings to the 8-regulation reference table (with each regime's actual trigger
threshold now encoded), and drafts disclosure text where every °C, exceedance-day
count, and % loss traces to a tool response — including the shift-schedule
recommendation with its computed saving.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page plus the ISO 7243 threshold table. The prompt carries §7.5's
regulatory nuance (ILO/OSHA/EU regimes differ materially) so the copilot never
presents one compliance score as covering all three.

**Prerequisites (hard).** Evolution A — narrating the current random compliance
scores into a GRI 403 disclosure would be fabricated audit evidence; weather-data
coverage for all sites. **Acceptance:** drafted disclosure figures all appear in tool
outputs; a site below all action limits yields "no protocol required" with the
computed margin; asked for heat-related incident counts the platform doesn't track,
the copilot refuses and names the data gap.