## 9 · Future Evolution

### 9.1 Evolution A — Real LCOE build-up and genuine per-project P50/P90 (analytics ladder: rung 1 → 2)

**What.** Two documented problems, one of them a genuine methodology error. First,
the advertised LCOE formula (`(CapEx×CRF + OpEx)/(8760×CF×Capacity)`) is never
computed — `lcoe` is a type-banded random draw independent of the same project's own
`capex` and `capacityMw`, and `wake` is a flat random % with no Jensen/Gaussian model.
Second, §7.3/§7.4 flag that "P50/P90" is computed as cross-project rank-order
percentiles of the CF field — answering a different question than the lender
convention (single-project inter-annual yield distribution) and unusable for debt
sizing as labelled. Evolution A derives LCOE from each project's own capex/CF/opex
via the stated CRF formula, renames the current metric "cross-portfolio CF
percentile", and implements true per-project P50/P90: inter-annual CF variability
from reanalysis data (the platform already ingests NASA POWER / Open-Meteo weather
series from data-sources wave 1; ERA5 is the upgrade path), giving
`P90 = P50 × (1 − 1.282σ_IAV)` under the standard normal-yield assumption, with σ
reported per site.

**How.** Backend `wind_finance_engine` (module is Tier B, EP-DO2) with `POST /lcoe`
and `POST /yield-distribution`; a first wake-loss slice using the Jensen model needs
only turbine spacing and thrust-curve constants. Sibling reuse: the
`wind-repowering-intelligence` module's correct `calcIRR`/DCF machinery is the
pattern for any IRR work here.

**Prerequisites.** The mislabelled P50/P90 renamed immediately (cheap, independent of
the rest); weather-series coverage check for project geographies. **Acceptance:**
LCOE recomputes when a project's capex changes; a specific project's P90 < P50 with σ
disclosed; the old cross-sectional metric no longer carries the P90 label anywhere.

### 9.2 Evolution B — Debt-sizing copilot for project finance teams (LLM tier 2)

**What.** The module's stated audience is bank project-finance teams, whose core
workflow is P90-based debt sizing: "size senior debt for this 400MW offshore fixed
project at 1.35× DSCR on P90 revenue with a £73/MWh CfD strike." Evolution B is a
tool-calling analyst over Evolution A's endpoints: it runs `POST /yield-distribution`
for the site's P50/P90, `POST /lcoe` for cost benchmarking against the type-banded
portfolio distribution, computes the debt capacity from tool outputs, and drafts the
credit-memo yield section — explicitly stating the P90 basis and σ source, which is
exactly the assumption chain credit committees interrogate.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page — §7.3's explanation of why cross-sectional percentiles are not
P90 goes into the system prompt verbatim, so the copilot can explain the distinction
when asked (a genuinely common analyst confusion). The no-fabrication validator
checks every MWh, £/MWh, and ratio against tool outputs.

**Prerequisites (hard).** Evolution A — a debt-sizing copilot on the current
mislabelled P90 would propagate the exact error the deep-dive warns against into
credit decisions; DSCR conventions parameterised, not hardcoded. **Acceptance:** memo
debt capacity reproduces from the cited P90 and DSCR inputs; asked for P99 or a
site-specific wake study the engine lacks, the copilot names what it can compute and
refuses the rest.
