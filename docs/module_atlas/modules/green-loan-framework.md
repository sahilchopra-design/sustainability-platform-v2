# Green Loan Framework
**Module ID:** `green-loan-framework` · **Route:** `/green-loan-framework` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ5 · **Sprint:** CQ

## 1 · Overview
20 green/sustainability-linked loans with GLP/SLLP compliance, margin ratchet modelling, and covenant design.

**How an analyst works this module:**
- Loan Portfolio shows GLP/SLLP alignment
- Margin Ratchet Modeler calculates expected margin reduction
- Covenant Design helps structure ESG KPIs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COVENANTS`, `LOANS`, `RATCHET_SIM`, `TABS`, `TYPE_DIST`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LOANS` | 9 | `type`, `amount`, `margin`, `glpAligned`, `sllpAligned`, `kpi`, `ratchetBps`, `score` |
| `RATCHET_SIM` | 6 | `base`, `ifMet`, `ifMissed` |
| `COVENANTS` | 7 | `frequency`, `threshold`, `prevalence` |
| `TYPE_DIST` | 2 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Loan Portfolio Dashboard','GLP/SLLP Alignment','Margin Ratchet Modeler','Borrower Assessment','Covenant Design','Reporting Templates'];` |
| `TYPE_DIST` | `[{ name:'Green Loan', value:3 },{ name:'Sustainability-Linked', value:5 }];` |
| `totalVolume` | `LOANS.reduce((s,l)=>s+l.amount,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COVENANTS`, `LOANS`, `RATCHET_SIM`, `TABS`, `TYPE_DIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Loans | — | Portfolio | Green and sustainability-linked |
| Avg Ratchet | — | Loan docs | Margin reduction for meeting ESG targets |

## 5 · Intermediate Transformation Logic
**Methodology:** Margin ratchet modelling
**Headline formula:** `Margin_adj = Margin_base - RatchetBps × KPI_met_flag`

Green Loan Principles and Sustainability-Linked Loan Principles compliance. Margin ratchet: if borrower meets ESG KPI, margin reduces by specified bps. Covenant design: which KPIs, thresholds, and testing frequency.

**Standards:** ['LMA GLP', 'LMA SLLP']
**Reference documents:** LMA Green Loan Principles; LMA Sustainability-Linked Loan Principles

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry (EP-CQ5) gives `Margin_adj = Margin_base −
> RatchetBps × KPI_met_flag`. The code carries a `ratchetBps` slider and per-loan `ratchetBps` values, but
> the **ratchet path is a pre-tabulated static array** (`RATCHET_SIM`, with fixed `base/ifMet/ifMissed`
> columns 2025–2029) rather than computed from the slider via that formula. The only live computation on
> the page is `totalVolume = Σ LOANS.amount`. This is a **static green/SLL loan-portfolio dashboard** with
> GLP/SLLP alignment flags, a covenant catalogue, and a display-only ratchet chart. §8 specifies the
> ratchet model.

### 7.1 What the module computes

```js
totalVolume = LOANS.reduce((s,l) => s + l.amount, 0)     // $M — the sole aggregation
```
Everything else is a static lookup: `LOANS` (8 named borrowers with `type`, `amount`, `margin`,
`glpAligned`/`sllpAligned`, `kpi`, `ratchetBps`, `score`); `RATCHET_SIM` (5-year base/if-met/if-missed
margin path, hard-coded); `COVENANTS` (6 KPI covenants with frequency/threshold/prevalence); `TYPE_DIST`
(3 green loans, 5 SLLs).

### 7.2 Parameterisation / provenance

| Dataset | Fields | Provenance |
|---|---|---|
| `LOANS` (8) | Vestas/Ørsted/Holcim/Enel/SSE/CaixaBank/Schneider/Iberdrola; margin 145–210 bps; ratchet 0–20 bps | static; real issuers, illustrative terms |
| `RATCHET_SIM` (5 yr) | base 210 flat; ifMet steps −12 bps/yr to 150; ifMissed +12 bps/yr to 270 | **static** precomputed path |
| `COVENANTS` (6) | GHG −5% YoY (85% prevalence), Renewable >50% (62%), etc. | static; LMA-informed |
| `ratchetBps` slider | user, default 12 | present but not wired to `RATCHET_SIM` |

The `RATCHET_SIM` demonstrates a **symmetric ±12 bps/yr** ratchet around a 210 bps base — the LMA SLLP
mechanic — but the numbers are fixed, not recomputed from the slider.

### 7.3 Calculation walkthrough

`LOANS` → `totalVolume` and the KPI cards (loan count, avg ratchet, avg score are means over the static
array). GLP/SLLP tab reads the alignment booleans. Ratchet Modeler tab renders `RATCHET_SIM` unchanged.
Covenant Design tab renders `COVENANTS`. There is no input→output flow beyond the sum and the static
displays.

### 7.4 Worked example

`totalVolume = 500+800+1200+2000+600+1500+900+1100 = $8,600M`. Reading `RATCHET_SIM` for 2029: a borrower
meeting its SPT pays `ifMet = 150 bps` vs `base = 210`, a −60 bps cumulative benefit over 5 years
(−12 bps/yr); missing it pays `ifMissed = 270`, +60 bps. Applying the guide's formula to Ørsted
(`margin = 165`, `ratchetBps = 15`, KPI met): `Margin_adj = 165 − 15·1 = 150 bps`. The formula is trivial
to evaluate but is *not* what drives the on-page chart, which uses the static ±12 bps path.

### 7.5 Data provenance & limitations

- **All data is static literals** — no PRNG, but equally not computed. Named borrowers are real; terms are
  illustrative.
- The guide's `Margin_adj` formula and the `ratchetBps` slider are **disconnected from the displayed
  ratchet path** (`RATCHET_SIM` is hard-coded), so the modeler is a mock-up.
- No KPI-achievement probability, no expected-margin calculation, no borrower cash-flow impact.

**Framework alignment:** LMA/APLMA/LSTA Green Loan Principles (the `glpAligned` flag) and Sustainability-
Linked Loan Principles (the `sllpAligned` flag + margin ratchet). SLLP requires the ratchet to be tied to
externally-verified KPIs against ambitious SPTs and to be symmetric to avoid tokenism — the ±12 bps sim
illustrates this. §8 turns the mock ratchet into a live model.

## 8 · Model Specification — SLL Margin-Ratchet & Expected-Cost-of-Funds Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute, for a sustainability-linked loan, the margin path and the borrower's expected cost of funds under
KPI-achievement uncertainty, and quantify the lender's incentive alignment — for loan structuring.

### 8.2 Conceptual approach
Contingent-margin model driven by KPI-achievement probabilities, benchmarked against **LMA SLLP** market
practice and lenders' pricing desks: the coupon steps down if the verified KPI meets the SPT at each
observation date and steps up otherwise; expected margin integrates over achievement odds.

### 8.3 Mathematical specification
```
Margin(t) = Margin_base − Σ_{k≤t} RatchetBps_k · met_k + Σ_{k≤t} RatchetBps_k · missed_k
E[Margin(t)] = Margin_base − Σ_{k≤t} RatchetBps_k·(P(met_k) − P(miss_k))
E[Cost of funds] = Σ_t E[Margin(t)]/1e4 · Balance_t / (1+r)^t
KPI achievement: P(met_k) = Φ((SPT_k − μ_k)/σ_k)   (trajectory model of the KPI)
Symmetry check: |Σ step-down| ≈ |Σ step-up|   (SLLP anti-tokenism)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `RatchetBps_k` | step size per observation | term sheet / LMA survey (±5–10 bps) |
| `P(met_k)` | KPI-achievement odds | borrower KPI trajectory + volatility |
| `Margin_base` | reference margin | credit spread |
| `r` | discount rate | funding curve |

### 8.4 Data requirements
Loan terms (base margin, ratchet, SPT schedule), KPI history and trajectory, balance profile. Sources: loan
documentation, borrower sustainability plan, LMA market data. The module holds static loan terms; KPI
trajectories and probabilities are absent.

### 8.5 Validation & benchmarking plan
Reconcile ratchet sizes against LMA SLL survey ranges; back-test KPI-achievement probabilities against
realised SLL step events; sensitivity of expected cost of funds to achievement odds; verify symmetry.

### 8.6 Limitations & model risk
KPI achievement is hard to forecast and open to gaming; symmetric ratchets are small so pricing impact is
second-order. Conservative fallback: quote the base margin and present the ratchet effect as a ±band, not a
central expectation, when KPI odds are uncertain.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the margin-ratchet modeler to a real calculation (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's `Margin_adj = Margin_base − RatchetBps × KPI_met_flag` and the interactive `ratchetBps` slider are disconnected from the displayed ratchet path — `RATCHET_SIM` is hard-coded, so the modeler is a mock-up; the 20 loans are static literals (named borrowers real, terms illustrative), and the sole live computation is summing total volume. Evolution A makes the ratchet modeler real: compute the margin path from base margin, ratchet bps, and per-period KPI-met flags per §5, so moving the slider or changing a KPI outcome actually re-derives the margin trajectory and the interest-cost impact over the loan life — turning a display into a working GLP/SLLP structuring tool.

**How.** (1) A real ratchet function computing `Margin_adj` per testing period from the base margin, ratchet size, and KPI achievement, driving `RATCHET_SIM` from inputs rather than a hard-coded array. (2) The interest-cost saving/penalty aggregated over the loan tenor. (3) Loans user-supplied or sourced, with GLP/SLLP compliance checks (use-of-proceeds for green loans, KPI/SPT calibration for SLLs). (4) Covenant-design fields (KPI, threshold, testing frequency) feeding the ratchet.

**Prerequisites.** Editable/sourced loan terms; the hard-coded `RATCHET_SIM` replaced by the computed path. **Acceptance:** the ratchet path recomputes from base margin, bps, and KPI flags reproducing §5; the slider moves the margin trajectory; interest-cost impact aggregates over tenor; no hard-coded ratchet array remains.

### 9.2 Evolution B — Green-loan structuring copilot (LLM tier 2)

**What.** A copilot for lending and treasury teams: "structure an SLL with a 15bps ratchet on a Scope-1 intensity KPI — what's the borrower's interest saving if they hit the target every year, and does this meet SLLP?" tool-calls the Evolution A ratchet and compliance endpoints, narrating the margin path and GLP/SLLP alignment.

**How.** Tier-2 tool-calling over the ratchet/compliance endpoints; the grounding corpus is §5/§7 (ICMA GLP/SLLP, margin-ratchet mechanics, covenant design). The copilot's value is ratchet calibration and framework-compliance checking — whether the KPI/SPT structure meets SLLP and what the ratchet is worth to the borrower. Guardrail, pre-Evolution-A: `RATCHET_SIM` is hard-coded, so it must refuse margin-path figures until wired. Every bps and cost figure validated against tool output.

**Prerequisites.** Evolution A (the modeler is a mock-up today); corpus embedding. **Acceptance:** post-Evolution-A, every margin and interest-cost figure traces to a tool call reproducing the ratchet formula; the SLLP-compliance verdict cites the framework; pre-Evolution-A the copilot declines margin-path claims.