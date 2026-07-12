## 7 · Methodology Deep Dive

> **Scope note.** This is a *governance / evidence* domain, not a quantitative engine: there is no
> pricing, scoring, or risk model behind these endpoints. The methodology that matters here is the
> **integrity design of the append-only audit trail** — how records are captured, redacted,
> checksummed, and queried. All statements below are grounded in
> `backend/api/v1/routes/audit_log.py` (read side) and
> `backend/middleware/audit_middleware.py` (write side, where every record originates).

### 7.1 What the domain computes

The read API exposes three views over the `audit_log` table:

| Endpoint | Computation |
|---|---|
| `GET /api/v1/audit-log/` | Filtered, paginated slice of the trail — dynamic SQL `WHERE` assembled from up to 6 optional filters plus a mandatory time cutoff, ordered `timestamp DESC`, with a parallel `count(*)` for `total` |
| `GET /api/v1/audit-log/stats` | Three aggregations over the same cutoff window: counts `GROUP BY action_class`, top-10 users `GROUP BY user_email ORDER BY count DESC LIMIT 10`, and an error count (`http_status >= 400`) |
| `GET /api/v1/audit-log/{entry_id}` | Full single record including the captured payloads (`old_values`, `new_values`, `request_summary`, `result_summary`) and the integrity `checksum` |

The only "formula" in the domain is the tamper-evidence checksum computed at write time
(middleware, `_make_checksum`):

```
checksum = SHA-256( timestamp_iso | user_id | action | entity_id | new_values_json )
```

(fields pipe-joined; missing fields contribute the empty string). Because the checksum binds the
timestamp, actor, action name, target entity and the sanitised request body, any later mutation of
those columns can be detected by recomputing the hash — a lightweight per-row integrity seal
(note: per-row only; it is **not** a hash chain, so whole-row deletion is not detectable from the
checksum alone).

### 7.2 Capture rules and parameterisation

**What gets audited (middleware dispatch):**

| Rule | Value | Rationale |
|---|---|---|
| Methods captured | POST, PUT, PATCH, DELETE | Read-only GET/HEAD skipped "to avoid noise" (module docstring) |
| Paths skipped | `/docs`, `/redoc`, `/openapi`, `/api/health` | Framework/health chatter |
| Body-capture blocklist | `/api/auth/login`, `/api/auth/register`, `/api/auth/google/session` | Credentials never captured (`_REDACT_PATHS`) |
| Key-level redaction | `password`, `password_hash`, `token`, `session_token`, `secret`, `api_key`, `private_key`, `credential` → `***REDACTED***` | `_sanitise()` on every captured payload |
| Failure policy | DB write failures logged at DEBUG, never propagated | "The original response is always returned unchanged" |

**Classification taxonomy** (`_METHOD_TO_CLASS` + AUTH override):

| HTTP method | `action_class` |
|---|---|
| POST | CREATE |
| PUT / PATCH | UPDATE |
| DELETE | DELETE |
| any method on `/api/auth/*` | AUTH (override) |

The route-layer filter documentation also advertises `CALCULATE`, `EXPORT`, `ADMIN` classes; the
middleware itself never emits these, so they can only appear if written by other code paths —
a documented-vs-emitted gap worth knowing when filtering.

**Entity attribution:** `entity_type` is inferred from a 21-entry path-prefix map
(`/api/v1/portfolios → portfolio`, `/api/v1/ecl → ecl_assessment`, `/api/v1/cbam →
cbam_declaration`, …, fallback `"unknown"`); `entity_id` is the first path segment longer than
8 characters containing a `-` or all digits (UUID/integer heuristic). `action` is the composite
`"{entity_type}.{method_lower}"`, e.g. `portfolio.post`.

**Read-side access control:** every endpoint requires `require_role("admin", "compliance")` — the
trail is invisible to ordinary users.

**Query parameter bounds:** `since_hours` ∈ [1, 720] (default 24; 720 h = 30 days),
`limit` ∈ [1, 500] (default 50), `offset` ≥ 0. Email filter is a partial `ILIKE %…%` match;
`action_class` is upper-cased before exact match; all filters are bound parameters (no SQL
injection surface despite the dynamically assembled `WHERE`).

### 7.3 Calculation walkthrough (request → audit row → query result)

1. A client issues e.g. `POST /api/v1/portfolios/…`. The middleware records `start_ms`, resolves
   the actor by looking up the `session_token` cookie or `Bearer` token in `user_sessions` →
   `users` (best-effort; anonymous rows have NULL user fields).
2. The request body is read and sanitised; the route executes; `duration_ms = now − start_ms`.
3. The middleware derives `action_class`, `entity_type`, `entity_id`, `action`, resolves the
   client IP from `X-Forwarded-For` (first hop) → `X-Real-IP` → socket peer, computes the
   SHA-256 checksum, and INSERTs one row — outside the request's DB transaction, on a fresh
   connection, so audit persistence cannot roll back business writes (and vice versa).
4. A compliance user later calls `GET /api/v1/audit-log/?action_class=DELETE&since_hours=168`:
   the route builds `WHERE a.timestamp >= :cutoff AND a.action_class = :aclass`, returns the
   newest 50 rows plus `total` from the twin count query.

### 7.4 Worked example (checksum verification)

Suppose a row shows `timestamp = 2026-07-01T09:30:00+00:00`, `user_id = u_42`,
`action = portfolio.post`, `entity_id = 9f3c1a2b-77aa`, and
`new_values = {"name": "EM Climate Fund"}`. The middleware hashed:

```
raw = "2026-07-01T09:30:00+00:00|u_42|portfolio.post|9f3c1a2b-77aa|{\"name\": \"EM Climate Fund\"}"
checksum = sha256(raw).hexdigest()        # 64 hex chars stored on the row
```

An auditor recomputes `sha256(raw)` from the stored columns; a mismatch proves post-hoc
tampering with any of the five bound fields. For `/stats` over the same day: if the window holds
120 rows of which 80 are CREATE, 25 UPDATE, 10 AUTH, 5 DELETE and 7 rows have
`http_status >= 400`, the response is exactly `total_entries = 120`, `error_count = 7`,
`by_action_class = [CREATE 80, UPDATE 25, AUTH 10, DELETE 5]` — plain SQL counts, no weighting.

### 7.5 Data provenance & limitations

- **All data is live operational data** written by the middleware — this domain contains **no
  synthetic seeded data** (no `sr(seed)` PRNG anywhere in the read or write path).
- Actor resolution is best-effort: if the session lookup fails, the row is written with NULL
  user fields rather than dropped — availability is prioritised over attribution completeness.
- The checksum is per-row, not chained (no previous-row hash), so deletion of an entire row is
  not self-evidencing; production-grade trails often add hash-chaining or WORM storage.
- GET requests are unaudited by design — read access to sensitive data leaves no trace.
- `old_values` / `result_summary` columns exist in the schema and detail endpoint but the
  middleware only populates `request_summary` / `new_values`; before-images are not captured.
- `_extract_entity_id` is heuristic (first long segment with a dash or digits) and can
  mis-attribute IDs on unusual paths.

### 7.6 Framework alignment

- **SOC 2 (Security / Processing Integrity criteria)** — append-only trail of privileged and
  mutating actions with actor, timestamp, source IP and outcome is the canonical CC7-series
  evidence artefact; the role-gated read API supports auditor access without broad grants.
- **ISO/IEC 27001:2022 A.8.15 (Logging)** — event logs recording user activities and
  exceptions, protected from alteration (checksum) and reviewed via `/stats`.
- **GDPR Art. 30 / Art. 32** — records of processing activities and integrity measures;
  key-level redaction implements data-minimisation in the log itself.
- **NIST SP 800-92 (Log Management)** — the split between generation (middleware),
  protection (SHA-256 seal, redaction) and analysis (filtered query + aggregation endpoints)
  mirrors the guide's log-management lifecycle.
