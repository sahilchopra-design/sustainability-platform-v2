## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch.** The guide's core formula is `Hash_n = SHA256(EventData_n + Hash_{n-1} +
> Timestamp_n)` with real tamper-evidence ("any modification breaks the chain"). **The code does not
> compute SHA-256 or any cryptographic hash.** It uses `simHash`, explicitly commented
> *"Deterministic hash simulation (hex chars from sr())"* — a PRNG that emits random hex characters:
> `simHash(seed,len) = [HEX[floor(sr(seed·31 + i·7)·16)] for i in 0..len]`. There is no chaining of one
> event's hash into the next as a hash *of the previous hash* — `prevHash` is seeded independently, so
> the "chain" cannot detect tampering. The CAR/CL/FAR taxonomy, ISO 14064-3 references, and VVB workflow
> are real terminology, but the integrity mechanism is a visual mock. Sections below document the code.

### 7.1 What the module computes

A synthetic audit-event ledger: **30 projects × 20 events = 600 events**, each carrying a simulated event
hash, input/output hashes, severity, user, VVB, regulatory & ISO references, and an emission-reduction
result. Command-centre KPIs are counts and simple aggregates over the event list:

```js
openCARs      = count(CAR_RAISED) − count(CAR_RESOLVED)
verifCoverage = round(VERIF_EVENTS.length / 30 × 100)          // % of 30 projects verified
avgRes        = mean over CAR_RESOLVED of  (3 + sr·14) days     // synthetic resolution days
```

`EVENTS_BY_DATE` sorts by `daysAgo`; `UNIQUE_PROJECTS` rolls events up per project with CAR/CL/FAR
counts and a verification opinion.

### 7.2 Parameterisation

All event fields are `sr()`-seeded (provenance: **synthetic demo data**), drawn from real reference lists:

| List | Values (real terminology) |
|---|---|
| EVENT_TYPES | CALCULATION_CREATED, DATA_SUBMITTED, VALIDATION_STARTED, CAR_RAISED, CAR_RESOLVED, VERIFICATION_COMPLETED, ISSUANCE_APPROVED, METHODOLOGY_UPDATE, PARAMETER_AMENDED, REPORT_GENERATED |
| VVB_NAMES | SGS, DNV, Bureau Veritas, TÜV SÜD, RINA, SCS Global … (real accredited VVBs) |
| METHODOLOGIES | VM0007 REDD+, VM0015 Methane Capture, ACM0002 Grid, GS-TPDDTEC … (real Verra/CDM/GS codes) |
| REG_REFS | CDM Standard v8 §9, ISO 14064-3:2019 §6.7, VCS Standard v4 §4.2, CORSIA SARPs §3.6.2 … |
| EVENT_SEVERITIES | INFO, NOTICE, WARNING, CRITICAL |

Per-event synthetic quantities: `daysAgo = floor(sr·180)`, `erResult = 500 + sr·45000` tCO₂e,
`calcVer` from a real semver list, opinion = `sr>0.8 ? Qualified Positive : Positive`, CAR/CL/FAR counts
from `floor(sr·5)` etc. The reference *lists* are authentic; the *assignment* of them to events is random.

### 7.3 Calculation walkthrough

The nested loop builds 600 events; `prevHash` is initialised per project via `simHash(pi·1000, 8)` and a
new `simHash` is generated per event — but because each hash is an independent PRNG output rather than a
function of the previous hash + event payload, the ledger is a *display* of a chain, not a verifiable one.
KPIs then filter/count the events (open CARs, verification coverage, average resolution time). CAR/CL/FAR
management and audit-readiness panels are further seeded roll-ups.

### 7.4 Worked example (command-centre KPIs)

Suppose across 600 events there are 48 `CAR_RAISED` and 41 `CAR_RESOLVED`:
- `openCARs = 48 − 41 = 7` outstanding corrective actions.
- If 26 of 30 projects have at least one `VERIFICATION_COMPLETED`: `verifCoverage = round(26/30×100) =
  87%`.
- `avgRes` over the 41 resolved CARs, each `3 + sr·14` days, averages ≈ 10 days.

These are structurally correct KPIs — the numbers are simply generated rather than measured, and the
underlying "hash integrity" claim behind them is not enforced.

### 7.5 Data provenance & limitations

- **All 600 events are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); the VVB/methodology/ISO reference
  lists are real, their assignment is random.
- **The hash chain is a simulation, not cryptography** — no SHA-256, no genuine chaining, so the module
  cannot actually detect tampering despite the guide's claim.
- No serial-number registry integration, no evidence-file linkage — retirement "verification" is display
  only.

**Framework alignment:** ISO 14064-3:2019 §6.7 — record-keeping/evidence-chain requirements the ledger
mimics · Verra VCS v4 / CDM V&V Standard — the CAR (Corrective Action Request, must resolve before
positive opinion), CL (Clarification), and FAR (Forward Action Request, future-monitoring) taxonomy, all
correctly named · ICVCM CCP Principle 3 — independent third-party validation/verification, reflected in
the VVB opinion events. ICVCM's CCPs are assessed by the ICVCM at program and methodology-category level
against 10 Core Carbon Principles; Principle 3 specifically requires accredited VVB validation — the module
represents that verification event but does not score it. See §8 for a real integrity model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's SHA-256 hash chain is simulated;
this specifies the real tamper-evident ledger.

### 8.1 Purpose & scope
Provide a verifiable, append-only audit trail for carbon-credit project lifecycle events (data → MRV →
CAR/CL/FAR → verification → issuance → retirement) such that any post-hoc modification is cryptographically
detectable, meeting ISO 14064-3 §6.7 record-keeping and supporting VVB and buyer due diligence.

### 8.2 Conceptual approach
A Merkle/hash-linked append-only log (the design behind Git, certificate-transparency logs, and permissioned
carbon registries such as Verra's and the Gold Standard Impact Registry). Each event commits to the prior
state, so the head hash certifies the entire history. Optionally anchored to a public chain for third-party
notarisation, per emerging digital-MRV practice (IETA/World Bank CAD Trust).

### 8.3 Mathematical specification

```
leaf_n     = SHA256( serialize(EventData_n) )
Hash_n     = SHA256( Hash_{n-1} ‖ leaf_n ‖ Timestamp_n ‖ Actor_n )      Hash_0 = SHA256(genesis)
head       = Hash_N
verify(k)  : recompute Hash_1..Hash_N; integrity ⇔ recomputed head == stored head
proof(n)   : Merkle inclusion path from leaf_n to a signed tree root (log size auditable)
sign       : VVB signs head with ECDSA/Ed25519 at each verification milestone
```

Tamper detection: altering `EventData_j` changes `leaf_j`, hence every `Hash_{≥j}` and the head — the
recomputation in `verify` fails.

| Parameter | Symbol | Source |
|---|---|---|
| Hash function | SHA-256 | FIPS 180-4 |
| Signature scheme | Ed25519 | RFC 8032 |
| Event schema | EventData | ISO 14064-3 §6.7 evidence fields |
| Genesis | Hash_0 | project registration record |

### 8.4 Data requirements
Per event: canonical serialised payload (event type, project id, actor, evidence-file digests, ER result,
methodology, reg/ISO reference, UTC timestamp). Existing platform fields already cover the payload schema;
missing: a real crypto library (SHA-256/Ed25519), evidence-file hashing, and an append-only store.

### 8.5 Validation & benchmarking plan
Property tests: any single-byte mutation of any historical event must flip the head hash and fail `verify`.
Merkle inclusion proofs verified independently. Reconcile serial numbers against Verra/Gold Standard public
registries. Benchmark against CAD Trust's data model for interoperability.

### 8.6 Limitations & model risk
A hash chain proves *integrity*, not *correctness* — garbage-in still hashes cleanly, so it must sit atop
VVB attestation, not replace it. Key management for VVB signatures is the principal operational risk;
conservative fallback anchors periodic head hashes to a public ledger so integrity survives internal key
compromise.
