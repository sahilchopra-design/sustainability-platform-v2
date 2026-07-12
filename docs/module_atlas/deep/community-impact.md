## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Social Return on Investment
> (SROI)** engine: monetise community outcomes via HACT financial proxies, apply deadweight /
> attribution / displacement / drop-off adjustments, and report `SROI = Total Social Value (£) / Total
> Investment (£)` with a gross→net waterfall. **None of that monetisation logic exists in the code.**
> The page (titled *Community Impact Assessment* in the UI, not "Analytics") is a **FPIC / grievance /
> benefit-sharing scorecard** over 60 synthetic extractive-sector projects. There is no £ social value,
> no SROI ratio, no deadweight/attribution adjustment, no SDG mapping tab. The sections below document
> the scorecard; §8 specifies the SROI model the guide advertises.

### 7.1 What the module computes

For 60 seeded projects (mostly mining, with energy/infrastructure/water/industrial), each carrying ~20
social indicators scored 0–100, the page produces portfolio averages, per-region/type roll-ups, a
grievance-resolution rate, and a benefit-sharing view. The only derived ratio is grievance resolution:

```js
resolutionRate = grievances > 0 ? round(resolved / grievances × 100) : 0
avgFpic        = round( mean(fpicScore) )         // over all 60 PROJECTS
avgCommunity   = round( mean(communityScore) )
totalInv       = Σ investmentM                     // $M summed
totalGriev     = Σ grievances
```

Everything else is `mean(indicator)` or `Σ(indicator)` bucketed by region / project type.

### 7.2 Parameterisation / scoring rubric

| Indicator | Formula | Range | Provenance |
|---|---|---|---|
| `fpicScore` | `round(10 + sr(i·7)·85)` | 10–95 | Synthetic seeded PRNG |
| `benefitSharing` | `round(5 + sr(i·11)·90)` | 5–95 | Synthetic seeded PRNG |
| `grievanceMech`, `communityScore`, `stakeholderEng`, `livelihoodRestore`, `culturalHeritage`, `waterAccess` | `round(base + sr(i·k)·span)` | ~10–95 | Synthetic seeded PRNG |
| `investmentM` | `round(1 + sr(i·53)·99)` | $1–100M | Synthetic seeded PRNG |
| `grievances` / `resolved` | `round(sr·120)` / `round(sr·100)` | 0–120 / 0–100 | Synthetic seeded PRNG |
| `status` | `sr(i·71)` thresholds 0.35/0.55/0.75/0.9 | Active…Suspended | Synthetic seeded PRNG |

Score badges use fixed thresholds `[25, 50, 70]` (red<25, amber, gold, green≥70). Resolution-rate badge
uses `[25, 50, 75]`. These bands are **hard-coded display conventions**, not calibrated to any standard.

### 7.3 Calculation walkthrough

1. `PROJECTS` is built once from three parallel arrays (names, types, regions) with all metrics seeded.
2. Dashboard KPIs (`kpis`) average or sum across **all 60 projects** (not the filtered set).
3. `regionChart` groups by region and averages FPIC + benefit-sharing; `typeDist` counts by type;
   `radarData` averages six SOC dimensions across all projects.
4. The Project Screening tab filters/sorts/paginates and renders an expandable per-project drill-down;
   the Grievance and Benefit tabs sort the full list and show the top-N by grievances / benefit score.

### 7.4 Worked example

Project `i = 0` (Tarkwa Gold Mine): `sr(0·11)=sr(0)=frac(sin(1)·10⁴)`. `sin(1)=0.8415`, ×10⁴=8414.7,
frac≈0.71 ⇒ `benefitSharing = round(5 + 0.71·90) = round(68.9) = 69` (gold band, since 50≤69<70). If its
seeded `grievances = 84` and `resolved = 61`, the resolution rate is `round(61/84·100) = 73%` (gold band,
since 50≤73<75). No monetary social value is attached — the "$" figures on screen are raw `investmentM`
sums, not SROI outputs.

### 7.5 Companion analytics on the page

Four tabs: **Dashboard** (KPIs, region bars, type pie, grievance/investment trend, impact radar),
**Project Screening** (searchable sortable table + per-project radar/bar drill-down), **Grievance
Tracker** (filed-vs-resolved trend, top-12 bars, resolution table), **Benefit Sharing** (benefit vs
investment bars, FPIC/investment trend). CSV export on each. A 24-month `TREND` series is fully seeded
(`grievances = round(40 + sr·60)` etc.) — it is not derived from the project data. No backend engine or
route exists.

### 7.6 Data provenance & limitations

- **All 60 projects and the 24-month trend are synthetic**, from the PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`.
  Project names are real companies/sites but their scores are seeded, not sourced.
- No monetisation, no financial proxies, no deadweight/attribution/displacement/drop-off adjustment, no
  SDG mapping, no benchmarking database — all four are promised in the guide but absent.
- KPIs aggregate the *whole* universe, ignoring the active filters (a UX inconsistency).

**Framework alignment (as claimed vs delivered):** *SROI Network Guide (2012)* — the core SROI ratio and
its adjustment chain are named but not computed. *HACT Social Value Bank / New Economy Manchester* —
these are the financial-proxy libraries SROI monetisation would draw on; unused here. *S1000+ Standard*
and *UN SDG Impact Standards* — referenced for domains/SDG mapping but no SDG tab exists. *LBG /
BITC community-investment benchmark* — no benchmarking implemented. The module does align *conceptually*
with **FPIC** (IFC Performance Standard 7 / UNDRIP free-prior-informed-consent) and **grievance-mechanism**
expectations (UNGP Principle 31 / IFC PS1) — those are the indicators it actually scores.

---

## 8 · Model Specification — Community-Investment SROI Engine

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify, in monetary terms, the net social value created per unit of community investment, so ESG /
community-affairs teams can prioritise programmes and disclose under GRI 413 and UN SDG bond frameworks.
Coverage: corporate/site-level community investment programmes (health, education, livelihoods, water).

### 8.2 Conceptual approach
Implement the SROI Network's forecast/evaluative SROI methodology, benchmarking against the **HACT UK
Social Value Bank** proxy library and the **LBG/BITC** community-investment measurement framework. SROI
converts beneficiary outcomes to financial proxies, then nets them down for what would have happened
anyway (deadweight), the share attributable to the programme (attribution), negative side-effects
(displacement), and outcome decay (drop-off) — the same logic the UK Treasury Green Book uses for social
CBA.

### 8.3 Mathematical specification
```
GrossValue_o   = Beneficiaries_o × Proxy_o                         (per outcome o)
NetValue_o     = GrossValue_o × (1 − DW_o) × Attr_o × (1 − Disp_o)
PV_o(t)        = Σ_{t=1..T} NetValue_o × (1 − DropOff_o)^{t-1} / (1+r)^t
TotalSocial    = Σ_o Σ_t PV_o(t)
SROI           = TotalSocial / TotalInvestment
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Outcome financial proxy | `Proxy_o` | HACT Social Value Bank; New Economy Manchester unit-cost database |
| Deadweight | `DW_o` | Comparison-group / benchmark data (0.2–0.5 typical) |
| Attribution | `Attr_o` | Stakeholder survey (0.4–0.75 of gross) |
| Displacement | `Disp_o` | Programme-specific (often ~0) |
| Drop-off | `DropOff_o` | 0.1–0.4/yr per outcome durability |
| Social discount rate | `r` | 3.5% (UK Green Book) |
| Horizon | `T` | Outcome benefit period (1–5 yr) |

### 8.4 Data requirements
Programme spend by domain, beneficiary counts, outcome indicators (survey-based), and comparison-group /
benchmark data for deadweight. Proxies from HACT; SDG mapping from UN SDG Impact Standards indicator set.
The platform already holds the raw indicator fields (`investmentM`, `employment`, `educationSupport`,
`healthImpact`) that would seed activity data; monetisation proxies and adjustment factors are new.

### 8.5 Validation & benchmarking plan
Reconcile computed SROI ratios against published sector ranges (2.5×–5.8×; >3× high-performing);
sensitivity-test on deadweight/attribution (the dominant swing factors); audit proxy selection against
HACT guidance. Benchmark portfolio-level community-investment intensity against LBG database percentiles.

### 8.6 Limitations & model risk
SROI is highly sensitive to proxy choice and subjective adjustment factors — report a proxy/adjustment
audit trail and a low/central/high range, never a single point. Attribution from self-report surveys is
optimism-biased; prefer comparison-group deadweight where available. Conservative fallback: report
attribution-only net value (drop deadweight benefit) as the floor SROI.
