## 9 · Future Evolution

### 9.1 Evolution A — Spend-weighted three-component risk with a real pass-through model (analytics ladder: rung 1 → 2)

**What.** §7 shows the code falls short of its own guide twice: the composite is an unweighted `(physicalRisk + transitionRisk)/2` — `regulatoryExposure` is displayed but excluded, and there is no spend-weighting — and the advertised `CarbonPassThrough = Σ[Spend × CarbonIntensity × CarbonPrice × PassThroughRate]` does not exist at all; all 70 categories are `sr()`-seeded, and the scenario tab applies hard-coded adjustments. Evolution A closes the guide↔code gap: implement both formulas as documented, over an uploadable procurement register instead of seeded categories.

**How.** (1) Backend `api/v1/routes/procurement_climate.py`: `POST /portfolio-risk` computing `Σ[SpendShareᵢ × (Physᵢ + Transᵢ + Regᵢ)]` per the guide, and `POST /carbon-pass-through` taking a carbon price ($/tCO₂e), category carbon intensities, and a sector pass-through rate band (the guide's own IEA-cited 40–70% for manufacturing). (2) Category intake via the platform's uploads path (CSV: category, spend, region, supplier country) with intensities defaulted from refdata sector tables when unreported. (3) Physical risk per category region resolved against the digital-twin hazard grids (`ref_*_zones`) rather than a seeded 1–10 draw, following the `global_physical_risk_engine` pattern. (4) Scenario adjustments derived from NGFS carbon-price paths through the pass-through formula, replacing the three hard-coded rows.

**Prerequisites.** Seeded categories retired or flagged demo; hazard-grid lookup for supplier regions (coarse country level is acceptable, tier reported). **Acceptance:** composite changes when spend mix changes at constant risk scores (spend-weighting proven); pass-through output scales linearly with carbon price in a bench case.

### 9.2 Evolution B — CS3D due-diligence copilot (LLM tier 1 → 2)

**What.** The module's regulatory surface (CS3D 2024/1760, EUDR 2023/1115) is where procurement teams need language, not just scores. Evolution B ships a copilot that drafts the CS3D-compliant due-diligence risk report the workflow already promises ("Generate CS3D-compliant due diligence risk report" is a documented analyst step with no generator behind it): "which categories trigger EUDR commodity scope?", "draft the engagement priority memo for our top-10 by risk-weighted spend".

**How.** Tier 1: RAG over this Atlas record plus CS3D/EUDR/OECD-guidance reference texts (§5 names them) via the standard copilot router; category-level numbers injected from Evolution-A endpoint responses as context. Tier 2 upgrade: "re-rank under disorderly scenario with $150/t carbon" becomes `POST /portfolio-risk` + `/carbon-pass-through` tool calls. Guardrails: regulatory-applicability statements must cite the directive article in the corpus; before Evolution A, the copilot must not quote the seeded risk scores as company data — the §7.2 provenance table marks every input synthetic.

**Prerequisites.** Evolution A for any quantitative claims; directive texts chunked with article-level anchors. **Acceptance:** a generated DD report cites specific CS3D articles for each obligation and every risk figure traces to an endpoint response; EUDR questions on non-scoped commodities get a scoped refusal.
