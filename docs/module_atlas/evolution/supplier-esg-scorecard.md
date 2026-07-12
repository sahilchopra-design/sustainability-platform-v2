## 9 · Future Evolution

### 9.1 Evolution A — Implement the two-level EcoVadis-weighted hierarchy on ingested assessment data (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents that neither level of the guide's hierarchy is implemented: the guide specifies `SupplierESG = w_E×Environmental + w_S×Social + w_G×Governance` with `Environmental = Climate×0.5 + Water×0.25 + Biodiversity×0.25`, but the code computes a flat `esgTotal = (eScore + sScore + gScore) / 3` with no Climate/Water/Biodiversity sub-decomposition. The 90 suppliers are `sr()`-synthetic, and `RED_FLAGS` and `engagementStage` are randomly assigned independent of the scores — a supplier can show a top-quartile governance score while carrying a "Corruption Risk" flag, contradictory signals a real due-diligence model would reconcile. Evolution A builds the EcoVadis-faithful hierarchy on real data.

**How.** (1) Implement the two-level weighted structure: sub-theme scores (Climate/Water/Biodiversity for E; ILO-convention compliance for S; anti-corruption evidence for G) rolling up with EcoVadis-style theme weights that favour E and S over G, replacing the equal-weight average. (2) Ingest real supplier ratings — EcoVadis scorecards and CDP Supply Chain responses (both named in the guide) — replacing the synthetic 90. (3) Derive red flags from the scores and CS3D adverse-impact criteria so a high governance score can't coexist with an unreconciled corruption flag. (4) Tie engagement stage to score/red-flag status. (5) Build the CS3D due-diligence coverage-gap view the workflow promises.

**Prerequisites.** EcoVadis/CDP data access; the EcoVadis theme-weight structure needs encoding. **Acceptance:** the composite uses the two-level weighted hierarchy; red flags derive from scores and CS3D criteria; a supplier's governance score and corruption flag are consistent.

### 9.2 Evolution B — CS3D due-diligence copilot (LLM tier 1)

**What.** A copilot for the procurement/compliance team the module targets: "which suppliers are highest CS3D due-diligence priority?", "why is this supplier flagged for deforestation risk?", "what's our due-diligence coverage gap for CSRD reporting?" — answered from the (Evolution-A) EcoVadis-weighted scores, the derived red flags, and the engagement-stage funnel, grounded in the CS3D and EcoVadis frameworks.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/supplier-esg-scorecard/ask`, corpus = this Atlas record (the two-level formula, the 7 CS3D-relevant red-flag categories, EcoVadis/CDP framework notes) plus live supplier data. Prioritisation narrates the deterministic score × red-flag × spend ranking; red-flag explanations cite the driving sub-theme score and CS3D criterion; coverage-gap answers report the funnel. The copilot cites the specific dimension behind each supplier's score.

**Prerequisites.** Evolution A's real scores and score-derived flags so prioritisation rests on assessed data, not random draws with contradictory signals. **Acceptance:** every score/flag cited traces to the EcoVadis-weighted computation; red-flag explanations reference the driving sub-theme; a supplier outside the assessed set returns a refusal.
