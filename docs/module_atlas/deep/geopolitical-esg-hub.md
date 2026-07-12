## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (double).** Two problems. (1) The MODULE_GUIDES entry describes a
> **geopolitical-ESG sensitivity regression** — a panel model `ΔESG_i = α + β_geo·GPR + β_sanction·
> Sanction + ε` estimating an ESG-score beta to the Caldara-Iacoviello GPR index, plus resource-
> nationalism scoring and GPR-shock ESG drawdown. **The code implements none of this** — no
> regression, no β_geo, no ESG-drawdown calculation. (2) This page's code body is **byte-identical to
> `geopolitical-ai-gov`**: same 14-country `GEO_RISK` table, same 10 `AI_DIMENSIONS`, same seeded
> AI/cyber/breach scoring, same `portTechGov` composite. So the page actually renders an *AI/tech-
> governance portfolio scorecard*, not an ESG-geopolitical sensitivity engine. Sections below
> document the code as it runs; see `geopolitical-ai-gov.md` for the full formula trace.

### 7.1 What the module computes

Identical to `geopolitical-ai-gov`. For up to 25 holdings, each gets a `GEO_RISK[country]` lookup
and PRNG-seeded governance scores:

```js
aiScores  = AI_DIMENSIONS.map((d,j)=>({...d, score: clamp(round(40 + sRand(seed(ticker)+j*17)*50),10,95)}));
aiGovAvg  = mean(aiScores.score);
cyberScore= clamp(round(50 + sRand(seed(ticker)*3)*45),20,95);
weightedGPR = Σ(gpr_h·weight_h)/Σweight_h;
portTechGov = round(avgAiGov·0.4 + cyberAvg·0.3 + gdprPct·0.3);
```

The **only** geopolitical-ESG linkage present is `weightedGPR` (an exposure-weighted average of the
static country `gpr` values) and `sanctionsPct` (weight in sanctioned-country holdings). There is no
ESG score, no ESG beta, no shock scenario producing an ESG drawdown.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `GEO_RISK` | 14 countries, `gpr` 70–160, `stability` 52–92 | Static demo (guide frames as Caldara-Iacoviello GPR) |
| `AI_DIMENSIONS` | 10 (AT01–AT10) | AI-governance dimension labels |
| `SCENARIOS` | 3 (Taiwan −8.5%, Sanctions −5.2%, AI-Reg −3.1%) | Synthetic base-impact %s |
| AI / cyber score bands | 40+50·rand / 50+45·rand | **synthetic seeded** |
| `portTechGov` weights | 0.40 / 0.30 / 0.30 | Hard-coded |

None of the guide's parameters — `β_geo` (−0.08 to −0.22), resource-nationalism score, ESG-drawdown
(−4 to −12 pts under 200-pt GPR shock) — appear anywhere in the code.

### 7.3 Calculation walkthrough

See `geopolitical-ai-gov.md §7.3` — the flow is identical: resolve holdings → seed AI/cyber/breach
scores → aggregate to portfolio KPIs → scale scenario base-impacts by slider intensity and sum
affected-country weight.

### 7.4 Worked example (weighted GPR)

Book: 40% China (gpr 160), 30% USA (145), 30% India (125), weights normalised.

```
weightedGPR = (0.40·160 + 0.30·145 + 0.30·125) / 1.0
            = 64 + 43.5 + 37.5 = 145
```

Portfolio weighted GPR = **145** — elevated, driven by the China concentration. Under the guide's
*intended* regression this GPR level would map to an ESG drawdown via β_geo (e.g. β_geo = −0.15 ⇒
ΔESG ≈ −0.15 × (145−100)/100 × 100 ≈ −6.75 pts) — but that step is **not in the code**; the module
stops at the GPR average.

### 7.5 Data provenance & limitations

- **AI-governance / cyber / breach scores are synthetic** (`sRand(seed(ticker))`); the only
  aggregation with real structure is the exposure-weighted GPR over the static 14-country table.
- **The guide's entire ESG-sensitivity methodology is absent** — no panel regression, no β_geo, no
  sanctions dummy coefficient, no resource-nationalism score, no ESG-shock drawdown.
- Because the code is a duplicate of `geopolitical-ai-gov`, the two routes present the same numbers
  under different titles.

**Framework alignment:** *Caldara-Iacoviello GPR (2022)* — the `gpr` field mimics the index scale
(newspaper-based geopolitical-risk index, ~100 = historical average) but is static, not the live
monthly series, and no ESG regression is run against it. *MSCI ESG Ratings* / *UNPRI* — cited in the
guide as the ESG-score source for the (unimplemented) regression. *OFAC/EU sanctions* — the
`sanctionsPct` KPI proxies sanctions exposure by holding weight.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's ESG-geopolitical sensitivity
model has no implementation; below is the production spec.

**8.1 Purpose & scope.** Quantify how portfolio ESG scores erode under geopolitical shocks
(sanctions, conflict, resource nationalism) to support TCFD/ISSB risk-management disclosure and
stewardship prioritisation across all equity/credit holdings.

**8.2 Conceptual approach.** Panel fixed-effects regression of issuer ESG-score changes on the
Caldara-Iacoviello GPR index and a sanctions indicator, benchmarked against **MSCI's geopolitical-
risk-and-ESG** analysis and **Verisk Maplecroft** political-risk-adjusted ESG. Shock propagation
mirrors a **stress-VaR** overlay calibrated to the 2022 Russia-Ukraine episode.

**8.3 Mathematical specification.**

```
ΔESG_{i,t} = α_i + β_geo·GPR_t + β_san·Sanction_{i,t} + β_conf·Conflict_{c(i),t} + ε_{i,t}
ESG_stressed_i = ESG_i + β_geo·(GPR_shock − GPR_baseline)/100·100 + β_san·1[newly sanctioned]
RN_i = w1·Expropriation + w2·ContractRenegotiation + w3·ExportRestriction   (resource-nationalism)
PortDrawdown = Σ_i weight_i·(ESG_i − ESG_stressed_i)
```

| Parameter | Calibration source |
|---|---|
| β_geo | fixed-effects panel on MSCI/Sustainalytics ESG vs GPR, 2015–2024 (target −0.08 to −0.22) |
| β_san | event-study around OFAC/EU designations |
| GPR_t | Caldara-Iacoviello GPR index (free, monthly) |
| GPR_shock | 200-pt shock ≈ 2022 Russia-Ukraine peak |
| RN weights | World Bank MIGA / political-risk-insurance loss frequencies |

**8.4 Data requirements.** Issuer ESG-score panel (MSCI/Sustainalytics, vendor); GPR index (free);
OFAC/EU sanctions lists mapped to ISINs (free); ACLED conflict by operating geography (free).
Platform already exposes the 14-country GEO table and portfolio context; ESG scores must be sourced.

**8.5 Validation & benchmarking.** In-sample fit and out-of-sample stability of β_geo; reconcile
stressed-ESG drawdown against the realised 2022 ESG-rating actions on Russia-exposed issuers;
compare RN scores to MIGA claims data.

**8.6 Limitations & model risk.** ESG-rating revisions lag geopolitical events by quarters, biasing
β_geo toward zero; sanctions events are rare (thin identification); GPR is a global scalar and does
not localise to issuer geography without the conflict term.
