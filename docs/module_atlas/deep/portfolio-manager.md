## 7 · Methodology Deep Dive

This module is one of the more **grounded** portfolio pages: holdings are built from the real
`GLOBAL_COMPANY_MASTER` dataset (with an MSCI/enrichment merge layer), and the portfolio WACI is a
genuine PCAF-style exposure-weighted intensity. The one heuristic worth flagging is the
**implied-temperature lookup** — a 6-bucket step function on WACI, not a target/trajectory-based ITR
as SBTi defines it — so §8 specifies the production ITR model.

### 7.1 What the module computes

Real portfolio aggregation over user-managed holdings (persisted to `localStorage`):

```js
rev  = c.revenue_usd_mn || (c.revenue_inr_cr · 0.1203)        // INR→USD FX
s12  = (c.scope1_co2e || 0) + (c.scope2_co2e || 0)            // Scope 1+2 tCO2e
waci = waciW > 0 ? waciSum / waciW : null                     // exposure-weighted intensity
impliedTemp(waci): <50→1.5 | <120→1.7 | <250→2.0 | <500→2.5 | <900→3.0 | else 3.5   (°C)
pct(v,t) = t>0 ? v/t·100 : 0
```

`resolveCompanyData` merges three layers per holding — manual overrides `mData`, enrichment `eData`
(`.value`), then base `company` — with sensible fallbacks (`esg_score ?? 50`, `transition_risk_score
?? 50`). `addHolding` auto-rebalances weights to ≤100 % (`factor = 100/total`).

### 7.2 Parameterisation / provenance

| Quantity | Source | Provenance |
|---|---|---|
| holdings universe | `GLOBAL_COMPANY_MASTER` + `EXCHANGES` | real curated company master (not `sr()`) |
| `esg_score`, `transition_risk_score` | merged from master/enrichment, default 50 | real where available; 50 fallback |
| `scope1_co2e`, `scope2_co2e`, `evic_usd_mn` | company master + enrichment | real where available |
| INR→USD factor | `0.1203` | hard-coded FX constant (≈₹83/$) |
| `impliedTemp` buckets | 50/120/250/500/900 WACI thresholds → 1.5–3.5 °C | **heuristic lookup**, not a standard |

The WACI denominator uses exposure/EVIC weights, matching PCAF's attribution logic; the temperature
buckets are the sole ad-hoc mapping.

### 7.3 Calculation walkthrough

1. User adds companies from the master; each is resolved and weighted (default 5 %, auto-rebalanced).
2. Per holding, revenue is normalised to USD; Scope 1+2 summed.
3. Carbon intensity = emissions / revenue; WACI = Σ(weightᵢ·CIᵢ)/Σweightᵢ (guarded).
4. Portfolio implied temperature read from the `impliedTemp(waci)` step function.
5. SFDR/taxonomy overlays and CSV export operate on the resolved holdings.

### 7.4 Worked example

Two holdings, exposure-weighted: A (weight 60, revenue $10,000M, S1+2 = 3.0 Mt → CI 300), B (weight
40, revenue $20,000M, S1+2 = 1.0 Mt → CI 50):

| Output | Computation | Result |
|---|---|---|
| CI_A | 3,000,000 / 10,000 | 300 tCO2e/$M |
| CI_B | 1,000,000 / 20,000 | 50 tCO2e/$M |
| WACI | (60·300 + 40·50)/100 | 200 tCO2e/$M |
| impliedTemp | 200 → bucket `<250` | 2.0 °C |

### 7.5 Data provenance & limitations

- **Real company data** from `GLOBAL_COMPANY_MASTER`; no `sr()` seeding. Missing fields fall back to
  neutral defaults (ESG 50, transition 50), which can bias a sparse portfolio toward the mean.
- WACI is methodologically sound; the **implied temperature is a coarse 6-step lookup** with no
  target ambition, no trajectory, and no sector pathway — it will misrank two firms with equal WACI
  but very different decarbonisation commitments.
- Tracking error / benchmark comparison described in the guide is not a statistical computation here.

**Framework alignment:** PCAF — WACI (`Σ wᵢ·CIᵢ`) follows the PCAF weighted-average-carbon-intensity
definition and attribution logic · SBTi/TCFD — the implied-temperature output *approximates* an ITR
but SBTi's method derives ITR from a company's target ambition and modelled emissions trajectory
versus a science-based benchmark pathway, then aggregates portfolio-weighted; the step-function here
skips all of that · SFDR/EU Taxonomy — surfaced as classification overlays, not computed from RTS
criteria.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the WACI→°C step function with a proper portfolio Implied Temperature Rise, computed
bottom-up from company targets and trajectories, for net-zero-alliance reporting and client mandates.

### 8.2 Conceptual approach
The **SBTi Temperature Scoring** method (target-ambition regression → company ITR) aggregated per
portfolio, cross-checked against the **PACTA** technology-pathway approach — the two industry
references named in the sibling temperature module. Company temperature is derived from the implied
over/under-shoot of a science-based carbon budget, not from current intensity alone.

### 8.3 Mathematical specification
```
Overshoot_i   = (CumEmissions_i,target − Budget_i,1.5) / Budget_i,1.5
ITR_i         = a + b · Overshoot_i           # SBTi linear-model coefficients (scope-specific)
ITR_i(default)= 3.2 °C  if no validated target (SBTi default)
ITR_pf        = Σ_i w_i · ITR_i               # exposure- or emissions-weighted
Coverage      = Σ_i w_i · 1{ target_i validated }
```

| Parameter | Calibration source |
|---|---|
| `Budget_i,1.5` | sector carbon budget; IPCC AR6 / IEA NZE allocated to company revenue share |
| `a, b` | SBTi Temperature Scoring regression coefficients (public methodology v1.5) |
| default 3.2 °C | SBTi no-target default |
| `w_i` | portfolio exposure/EVIC weight (already computed) |
| target data | SBTi registry (`sbti-companies.json` already in platform), CDP |

### 8.4 Data requirements
`near_term_target`, `net_zero_year`, `base_year_emissions`, `target_scope_coverage`, `sector`,
`revenue`. Sources: SBTi registry (platform has `sbti-companies.json`), CDP emissions
(`CDP_COMPANY_EMISSIONS` already imported by the sibling page), company filings. WACI/weights exist.

### 8.5 Validation & benchmarking plan
Reconcile company ITRs against published SBTi temperature scores where available; benchmark portfolio
ITR against PACTA technology-alignment output; verify default-3.2 °C application rate matches coverage
gap. Sensitivity-test on scope coverage and weighting scheme (exposure vs emissions).

### 8.6 Limitations & model risk
Target data is self-reported and sparse; the SBTi regression is scope- and sector-sensitive;
weighting choice materially moves the headline. Conservative fallback: apply the SBTi default (3.2 °C)
to any name lacking a validated target and disclose coverage % alongside the portfolio ITR.
