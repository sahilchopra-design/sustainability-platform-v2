## 9 · Future Evolution

### 9.1 Evolution A — Real requirement register, real quality ladder, real storage (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch flag: the guide's
`Completeness = Submitted/Required × Quality_Weight` with the 1.0/0.7/0.4 source-tier
ladder is not implemented — completeness uses an ad-hoc `min(items,4)/4×25` divisor
(whose ×25 scaling §7.6 flags as contradicting its own "4 sources = 100%" comment),
quality is a seeded 60–100 draw, and evidence items are PRNG-generated demo artifacts
persisted only to `localStorage`. The workflow shell is genuinely useful — the
`AUTO_SCAN_KEYS` bridge to other modules' artifacts is a good design. Evolution A
makes the scores mean what the guide says.

**How.** (1) Requirement register: derive required-evidence items per framework from
the refdata regulatory catalogs (ESRS datapoint list is already in the DB; SFDR RTS
PAI indicators and ISSB S2 requirements are curated additions) — this gives the
denominator the formula needs. (2) Quality ladder: replace the seeded score with the
guide's discrete 1.0/0.7/0.4 source-tier weights, set by the preparer per item and
adjustable at review. (3) Fix the ×25 scaling defect; completeness becomes
`Σ(submitted×weight)/required` per framework. (4) Backend vertical: an
`evidence_items` table with versioning and review events (replacing `localStorage`),
because the module's whole pitch — chain-of-custody for external assurers — is
impossible client-side. (5) Deadline scenarios: readiness projection at filing date
given current collection velocity, the module's first forward-looking view.

**Prerequisites (hard).** Purge the seeded evidence generator and seeded audits;
document storage with audit-logged access (AuditMiddleware exists). **Acceptance:** a
framework's completeness is reproducible as Σweights/required; the score drops when a
primary-source item is downgraded to management-estimate; evidence survives a browser
change.

### 9.2 Evolution B — Evidence-gap copilot for filing readiness (LLM tier 1 → 2)

**What.** A copilot answering the compliance manager's operative questions: "what's
blocking CSRD readiness?" (the register's unmet requirements, ranked by weight and
deadline), "which items would an assurer challenge?" (management-estimate-tier
evidence backing high-materiality datapoints), "map this uploaded document to
requirements" — the latter a genuine LLM strength, classifying an artifact against
the ESRS/SFDR requirement register with citations to the requirement text.

**How.** Tier 1: RAG over the requirement register and this Atlas record; answers cite
requirement IDs (e.g. ESRS E1-6) and the item records that satisfy them. Tier 2 (after
Evolution A's backend): the document-mapping suggestion becomes a gated write — the
copilot proposes `evidence_item → requirement` links with confidence, and the preparer
confirms before anything persists, keeping the chain-of-custody human-signed. The
no-fabrication rule here is about status: the copilot must never claim an item is
verified when its stored tier says otherwise.

**Prerequisites (hard).** Evolution A's register and persistence (there is nothing
real to be a copilot over today — the shell ships with demo data); framework
requirement texts embedded (roadmap D3). **Acceptance:** gap lists exactly match the
register's unmet set; document-mapping suggestions carry requirement citations and
require confirmation; the copilot refuses readiness judgments for frameworks not
configured in the register.
