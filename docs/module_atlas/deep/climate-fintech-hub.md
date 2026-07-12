## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Market Penetration
> Index* (`MPI = Adopters / TAM × 100`) with platform scoring on data coverage, methodology
> transparency and regulatory alignment, sourced from Bloomberg NEF and KPMG. **No MPI, TAM,
> adopter count or platform scoring rubric exists anywhere in the code.** What the page actually
> implements is an *operations-style hub dashboard*: hard-coded quarterly KPI snapshots, a
> 40-company climate-tech directory with TRL ratings, a funding tracker, an integration-health
> monitor, and a configurable board report. The sections below document the code as it behaves.

### 7.1 What the module computes

Almost all figures are **hard-coded literals**; the only derived values are simple aggregations:

```
period delta        prev = KPI_DATA[PERIODS[idx+1]]            // next entry = prior quarter
regional readiness  overall = (satellite + iot + mrv) / 3      // simple mean of 3 coverage %
category TRL        avgTrl  = Σ trl / n_companies_in_category   (plus min / max)
integration KPI     avgUptime = Σ uptime / 14 integrations
funding             cumulative_t = Σ_{y≤t} FUNDING_YEARLY[y].total
weekly health       uptime  = 99.2 + 0.7·sr(3i)                 // seeded PRNG series
                    latency = ⌊180 + 240·sr(3i+1)⌋ ms
                    errors  = 0.02 + 0.33·sr(3i+2) %
                    throughput = 1.8 + 0.8·sr(3i+3) TB/day
```

where `sr(s) = frac(sin(s+1)×10⁴)` and `sRange(s,lo,hi) = lo + (hi−lo)·sr(s)`.

### 7.2 Datasets & parameterisation

| Dataset | Rows | Nature | Provenance |
|---|---|---|---|
| `KPI_DATA` | 5 periods × 10 metrics | Hard-coded strings (42.7 MtCO₂e verified, 94.3% satellite coverage, 12,847 IoT sensors, compliance 91/100, digital-readiness 8.4/10 …) | Synthetic demo values, monotone-improving by design |
| `COMPANIES` | 40 | Real company names (Pachama, Sylvera, Planet Labs, GHGSat, Watershed, Persefoni…) with founded year, funding, HQ, headcount, TRL 6–9 | Plausible public-domain figures, hand-curated; **unverified** — treat as illustrative |
| `RADAR_DATA` | 6 tech categories | readiness/adoption/maturity 54–94 | Synthetic demo scores |
| `FUNDING_YEARLY` | 2018–2025 | $2.1B → peak $12.4B (2021) → $1.8B, split by 6 categories | Synthetic; shape echoes the real 2021 climate-tech funding peak |
| `INTEGRATIONS` | 14 | status/latency/error/uptime per connector (Verra, Gold Standard, Hedera Guardian, EU ETS Registry…) | Synthetic ops telemetry |
| `ADOPTION_DATA` / `ROI_DATA` | 6 / 5 | digital-vs-traditional MRV comparison ($42 vs $380 per verification; 5-yr cum. savings $40.9M) | Synthetic demo values |
| `REGULATORY_LANDSCAPE` | 6 | MiCA, EU Green Bond Standard, SFDR RTS, Article 6, SEC climate rule with status/impact | Real regulations, hand-summarised status |

TRL uses the standard 9-level Technology Readiness scale (NASA/EU Horizon 2020 convention);
`TrlBar` colours ≥8 green (deployed), ≥6 gold (demonstration), else amber.

### 7.3 Calculation walkthrough

Tab 1 (Executive Dashboard) selects one row of `KPI_DATA` by period; each KPI card shows the
current value with the prior period fetched via `PERIODS[indexOf(period)+1]` (the array is
reverse-chronological, so “+1” = previous quarter). Direction is a hard-coded heuristic — every
metric is treated as “up is good” except anomalies detected (`m.id==='ad'`). Tab 2 (Technology
Landscape) filters `COMPANIES` by category and derives the per-category TRL bar chart and the
count distribution. Tab 3 (Integration Status) computes the four status KPIs by filter/mean over
`INTEGRATIONS` and renders the 12-week seeded `WEEKLY_HEALTH` series; the “Run health check”
button is a 2.2 s `setTimeout` with no data effect. Tab 4 (Board Report) assembles toggleable
sections from `ADOPTION_DATA`/`ROI_DATA` and exports a CSV of the adoption table.

### 7.4 Worked example

- **Regional readiness, Africa:** `(82.1 + 41.8 + 54.2) / 3 = 178.1 / 3 = 59.37 → 59.4%` —
  displayed against Europe's `(97.2 + 89.4 + 94.1)/3 = 93.6%`.
- **Average TRL, MRV category:** companies Pachama 8, Sylvera 8, Verra 9, Gold Standard 9,
  Regrow 7, Perennial 7, Dryad 6 → `54 / 7 = 7.71 → 7.7`.
- **Average uptime:** Σ of the 14 uptime values = 1394.05 → `1394.05 / 14 = 99.575 → "99.58%"`.
- **Seeded weekly health, W1 (i = 0):** `sr(0) = frac(sin(1)×10⁴) = 0.70985` →
  uptime `99.2 + 0.7×0.70985 = 99.70%`; `sr(1) = 0.97427` → latency `⌊180 + 240×0.97427⌋ = 413 ms`;
  `sr(2) = 0.20008` → errors `0.02 + 0.33×0.20008 = 0.086 → 0.09%`.
- **Cumulative funding 2018–2025:** `2.1+3.8+6.2+12.4+8.7+5.9+4.1+1.8 = $45.0B`.

### 7.5 Data provenance & limitations

- **Synthetic seeded data present:** the 12-week integration-health series uses the platform PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)` — deterministic across renders but not telemetry. All KPI
  snapshots, radar scores, funding series, ROI and adoption tables are hard-coded demo literals.
- The 40-company directory mixes genuinely public facts (names, founding years, well-reported
  rounds like Watershed's $100M Series C) with unaudited figures; nothing is fetched from a
  registry or vendor API, and there are no backend engines or routes for this module.
- No scoring model of any kind is computed: no market-penetration metric, no vendor evaluation
  weights, no adoption diffusion. "Compliance Score 91/100" and "Digital Readiness 8.4/10" are
  literals with no rubric behind them.
- Modelling simplifications vs production practice: a real hub would poll connector telemetry,
  reconcile registry credits (Verra/Gold Standard APIs exist), and score vendors under a
  documented rubric with evidence trails.

### 7.6 Framework alignment

- **TRL (NASA / EU Horizon 2020)** — the one genuinely standard scale used: TRL 1–9 from basic
  research to operational deployment; the module's ratings are hand-assigned per company.
- **MiCA (EU 2023/1114)** — named in the regulatory table; in force for crypto-asset service
  providers from Dec 2024, relevant to tokenised carbon credits; the module tracks status only.
- **EU Green Bond Standard / SFDR RTS / Article 6 (Paris Agreement)** — listed with hand-written
  status/impact labels; no compliance logic is computed against any of them.
- **Bloomberg NEF / KPMG Fintech Pulse / IFC Climate Fintech Market Map** — cited by the guide as
  data sources; none are ingested by the code.

### 8 · Model Specification — market penetration & vendor scoring

**Status: specification — not yet implemented in code.** Triggered because the guide names an MPI
score with no implementation, and the page displays financial/readiness quantities (compliance
score, digital-readiness index, ROI savings) that are hard-coded or seeded heuristics.

**8.1 Purpose & scope.** Support technology-selection and partnership decisions by a climate-risk
platform or FI: which climate-fintech segment to adopt, which vendor to integrate, and what
adoption trajectory to expect. Coverage: the 6 code categories (MRV, Satellite, Blockchain, IoT,
AI/ML, Data Platforms) across the tracked vendor universe.

**8.2 Conceptual approach.** Three linked components: (i) **segment penetration** via the guide's
MPI plus a Bass diffusion forecast of adopter growth; (ii) **vendor scoring** via a weighted
multi-criteria rubric in the style of **Forrester Wave / Gartner Magic Quadrant** evaluation
methodology (explicit criteria, weights, evidence scores); (iii) **segment sizing** anchored to
**BloombergNEF climate-tech investment data** and the **IFC Climate Fintech Market Map** taxonomy.
Bass diffusion is the standard technology-adoption benchmark (Bass 1969; meta-analytic parameter
priors from Sultan, Farley & Lehmann 1990).

**8.3 Mathematical specification.**

```
MPI_s(t)      = A_s(t) / TAM_s(t) × 100
Bass:  dA/dt  = (p + q·A/TAM) × (TAM − A)          → closed form
       A(t)   = TAM × (1 − e^{−(p+q)t}) / (1 + (q/p)·e^{−(p+q)t})
VendorScore_v = Σ_k w_k × s_{v,k},  Σw_k = 1,  s ∈ [0,10]
ReadinessIdx  = 0.4·TRL/9×10 + 0.3·s_integration + 0.3·s_regulatory
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `p` | innovation coefficient | 0.03 (Sultan et al. 1990 meta-analysis mean; B2B software range 0.01–0.05) |
| `q` | imitation coefficient | 0.38 (same meta-analysis mean) |
| `TAM_s` | segment addressable market | BNEF Energy Transition Investment / climate-tech reports; IFC Climate Fintech Market Map segment counts |
| `A_s(t)` | verified adopters | vendor-disclosed customer counts; CDP disclosure of MRV tooling |
| `w_k` | criteria weights | governance-approved; start equal across coverage, transparency, regulatory alignment, interoperability, financial viability (0.2 each) |
| `s_{v,k}` | evidence scores | scored rubric with documented evidence (API docs, ISAE 3000 assurance, registry accreditation) |

**8.4 Data requirements.** Vendor registry (name, segment, funding — Crunchbase/PitchBook paid;
free: press releases + BNEF summaries), customer/adopter counts (vendor disclosures, case
studies), regulatory accreditations (Verra/Gold Standard VVB lists, free), integration telemetry
(exists in-platform once connectors are real). The existing `COMPANIES` array is a usable seed
universe; `reference_data` tables can host TAM and adopter series.

**8.5 Validation & benchmarking.** Backtest Bass fits on historical adoption of an analogous
category (cloud carbon-accounting seats 2019–2024) and check MAPE < 20%; cross-validate vendor
scores against independent analyst placements (Forrester Wave for sustainability-management
software, Verdantix Green Quadrant) — rank correlation ρ > 0.6 expected; sensitivity of MPI to
±30% TAM; annual re-scoring with change log.

**8.6 Limitations & model risk.** TAM for nascent segments is speculative — publish ranges, not
points; Bass parameters transfer poorly across categories (use hierarchical priors); vendor
scores embed analyst judgement — require two-scorer agreement; adopter counts are self-reported
and inflate; conservative fallback: report MPI with TAM low/high bounds and suppress single-point
forecasts where adopter data is missing.
