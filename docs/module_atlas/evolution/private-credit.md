## 9 · Future Evolution

### 9.1 Evolution A — Rating-mapped PD term structure and two-way SLL ratchet (analytics ladder: rung 1 → 3)

**What.** The workbench's arithmetic is genuinely correct (EL = PD×LGD×EAD reconciles to seed values; PCAF attribution `min(drawn/(equity+debt),1)` is the prescribed private-debt form), but §7.5 lists the honest ceilings: PD/LGD are static analyst entries with no rating-to-PD mapping or term structure, EL is single-period with no lifetime ECL, and the SLL ratchet implements only the reward leg — no step-up penalty branch, contrary to SLLP 2023's two-way pricing. Evolution A adds the modelling layer: rating-notch PD curves, multi-year discounted ECL, and a symmetric ratchet.

**How.** (1) Backend route `api/v1/routes/private_credit.py` with `POST /facility-el` — PD resolved from the 18-notch `ratingOrder` via a documented cumulative-PD table (reuse the PD assets `ppa-xva-engine` and `pf-credit-rating-engine` already serve), lifetime ECL = Σ marginal-PD × LGD × EAD_t × DF_t; analyst PD override retained but flagged `source: manual`. (2) Ratchet gains a `step_up_bps` field and a per-KPI achievement vector replacing the single slider, matching SLLP's SPT-level mechanics. (3) The localStorage book migrates to an org-scoped `private_credit_facilities` table so the D1 write-side activation covers it; CSV export stays.

**Prerequisites.** PD-curve reference table exposed platform-wide (shared, not re-authored); migration path for existing localStorage books. **Acceptance:** PC004's 12-month EL still reproduces $1.79M under the manual override, while the rating-mapped path yields a lifetime ECL that increases with tenor; a missed-KPI facility shows spread above contractual base.

### 9.2 Evolution B — Origination copilot with SLL term drafting (LLM tier 2)

**What.** A deal-desk copilot that works a new origination end-to-end: "add this $40M senior facility, BB, 5yr — what does it do to portfolio EL and drawn-weighted spread? Suggest an SLLP-conformant KPI package with a 12.5bps two-way ratchet." Portfolio impacts come from tool calls (facility CRUD + `POST /facility-el` + the portfolio-aggregate endpoint); the KPI package is drafted from the LMA principles list the module already carries (`LMA_PRINCIPLES`) plus SLLP 2023 reference text in the corpus, each suggested KPI tagged with its verification requirement.

**How.** Tier-2 tool schemas over the Evolution-A endpoints, with the facility-create call gated behind explicit user confirmation (it mutates the book — RBAC + confirm pattern per the roadmap). System prompt embeds §7.5's limitations so the copilot volunteers "PD is rating-mapped, not borrower-specific" when quoting EL. The incidental `sr()`-seeded "on-track" flag in the KPI tracker must be replaced by stored KPI status first — a copilot must not narrate a coin flip as covenant compliance.

**Prerequisites.** Evolution A (endpoints + persisted book); the on-track flag fix; SLLP 2023 text chunked into the corpus. **Acceptance:** every EL/spread figure in a copilot answer traces to a tool call, and drafted KPI clauses cite the specific SLLP component they satisfy.
