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
