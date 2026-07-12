## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the engine and add the NLP claim-extraction layer (analytics ladder: rung 1 → 3)

**What.** §7 documents that the page renders 15 `sr()`-seeded companies (seven greenwashing signals seeded and averaged, unweighted) plus a static hand-written `EVIDENCE_MAP`, while the real backend `greenwashing_engine.py` does rule-based term-screening but is not called by this page, and the guide's NLP claim classification (ambiguous/absolute/certified/aspirational, with substantiation against verifiable data) is unimplemented (§8 marked "not yet implemented in this page"). The headline `GreenwashScore = ClaimStrength − EvidenceScore` needs both a claim-strength classifier and an evidence-matching layer. Evolution A wires the page to the rule-based engine, then adds the NLP claim-extraction layer: classify each claim by strength/type and match it against the company's actual performance data, computing the claim-evidence gap per §5.

**How.** (1) Call `greenwashing_engine.py`'s term-screening for the base signal instead of rendering seeded companies. (2) Add an NLP claim classifier (claim type + strength) over real disclosure text, using the platform's LLM tier per the roadmap. (3) Evidence matching against performance data (emissions trajectory, target progress) so the gap is `ClaimStrength − EvidenceScore` on real inputs; weight the seven signals rather than averaging equally.

**Prerequisites.** Real disclosure documents to parse and performance data to match; the seeded companies and hand-written `EVIDENCE_MAP` replaced; the engine wired. **Acceptance:** the greenwash score derives from classified claims matched against real evidence reproducing §5; the engine is called (not seeded companies); signals are weighted, so a company breaching several thresholds scores appropriately.

### 9.2 Evolution B — Greenwashing-screening copilot (LLM tier 2)

**What.** A copilot for ESG-integrity analysts: "screen this company's sustainability report for unsubstantiated claims and flag the highest-risk absolute claims with weak evidence" tool-calls the Evolution A claim-classification and evidence-matching endpoints, narrating the claim-evidence gaps with the specific flagged passages.

**How.** This is a natural LLM-native module: tier-2 tool-calling over the claim-extraction and engine endpoints, where the LLM's classification of claim strength/type is itself the analytical layer (grounded by the rule-based engine and evidence matching, never free-form judgement presented as fact). The grounding corpus is §5/§7 (claim taxonomy, substantiation logic). Guardrail, pre-Evolution-A: companies and evidence are synthetic, so it must refuse company-specific greenwashing claims. Every flag validated against the engine and the source document passage.

**Prerequisites.** Evolution A (the NLP layer and engine wiring); document access; corpus embedding. **Acceptance:** post-Evolution-A, every flagged claim cites the source passage and its evidence gap from a tool call; pre-Evolution-A the copilot declines company-specific screening; claims about named companies always trace to parsed text, never seeded signals.
