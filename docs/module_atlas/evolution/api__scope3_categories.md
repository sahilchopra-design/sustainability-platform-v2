## 9 · Future Evolution

### 9.1 Evolution A — Sector-calibrated category shares and supplier-data integration (analytics ladder: rung 2 → 3)

**What.** The E21 engine implements GHG Protocol Scope 3 category screening and SBTi-coverage
assessment: it produces a 15-category breakdown, materiality flags (`is_material = share > 0.05`),
an SBTi 40%-coverage verdict, a weighted DQS, and optional FLAG/PCAF-C15 blocks. Its honesty is a
strength — `total_scope3 = None` (not fabricated) when neither total nor intensity is supplied. But
the per-category `tco2e = total × share` uses *typical* GHG-Protocol shares as the default
distribution, so an entity's breakdown is generic unless it overrides every share. Evolution A makes
the distribution sector-specific and data-integrated.

**How.** (1) Replace the single "typical share" default with sector-specific category
distributions (a chemicals firm's C1 purchased-goods share differs sharply from a bank's) keyed on
the NACE code the engine already takes, sourced from published sector Scope-3 profiles. (2)
Integrate supplier-specific data where the platform holds it (the supply-chain modules) so C1/C4
categories move from spend-based to supplier-specific with an improved DQS. (3) Add a spend-based
estimation path using EEIO factors for entities with only financial data. (4) Bench-pin the
coverage % and 40%-rule verdict, preserving the honest-null behaviour.

**Prerequisites.** Sector Scope-3 profile data; supply-chain module linkage for supplier data; EEIO
factors. **Acceptance:** category breakdown varies by sector for identical revenue; supplier-backed
categories carry a better DQS with provenance; the honest-null total is retained; coverage bench-pinned.

### 9.2 Evolution B — Scope-3 screening copilot with SBTi-coverage guidance (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the result — "your material Scope 3 is
categories 1, 4, and 11, covering 68% of your footprint — you meet the SBTi 40% rule; your weighted
DQS is 3.8, dragged by spend-based C1 data" — each figure tool-sourced, with materiality screening.

**How.** Two POST endpoints (`/assess`, `/materiality-screen`) plus rich reference GETs (categories,
calculation-methods, SBTi-coverage-rule, PCAF-C15, FLAG-sectors, GHG-protocol) that ground every
definition. The 15-category decomposition lets the copilot explain which categories are material and
why; the SBTi-coverage endpoint grounds the 40%-rule verdict. What-ifs ("if we get supplier data for
C1?") re-run statelessly. Cross-links to `pcaf_asset_classes` (C15) and the supply-chain copilots.

**Prerequisites.** None hard — engine is honest and reference-rich; sector-specific answers need
Evolution A. **Acceptance:** every category tCO2e, coverage %, and DQS traces to a tool response;
the copilot reports the honest-null when total is unknown rather than estimating; it discloses when
a category uses the generic typical share vs a sector-calibrated one, and cites the SBTi rule from
the reference endpoint.
