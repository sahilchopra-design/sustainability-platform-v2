# Module Production-Grade Contract

This is the **definition of done** for refining one module from a frontend-only
prototype into an investor/analytical, production-grade vertical slice. A module
may not be promoted past `beta` in the maturity pipeline until every item here is
green (the `scripts/validate-module.js` gate enforces the automatable subset).

> Maturity pipeline (already built): `draft → review → beta → production`
> (`module_review_status` table, `backend/api/admin_rbac.py`, `MaturityTab` in
> `AdminPanelPage.jsx`). Refinement work happens at `draft`/`review` so the module
> stays hidden from partners/viewers (existing `ROLE_MIN_TIER` gating) until ready.

---

## 1. Data layer (database → API)

- [ ] **Table** — a Postgres table `ep_<code>_<entity>` exists via an Alembic
      migration (`backend/alembic/versions/`). Integer PK, `created_at`/`updated_at`.
- [ ] **Model** — a SQLAlchemy model in `backend/db/models/<module>.py`, **registered
      in `backend/db/base.py:init_db()`** (else `create_all` never sees it).
- [ ] **Schema** — Pydantic request/response models.
- [ ] **Seed** — `backend/scripts/seed_<module>.py`, idempotent (delete-by-key then
      insert), ports the module's former hardcoded constant from a committed JSON
      export so the UI looks identical after conversion.

## 2. API layer

- [ ] **CRUD** — list / get / create / update / delete under
      `/api/v1/<moduleKey>/<resource>`, writes behind `Depends(get_current_user)`,
      org-scoped via `apply_org_filter` where the data is org-owned.
- [ ] **Calc** — any what-if / scenario endpoints the UI needs, served by a
      `backend/services/<module>_engine.py` class.
- [ ] **Tests** — a `pytest` module exercising the CRUD + calc happy paths.

## 3. Frontend layer (API → UI)

- [ ] **No hardcoded data** — the page sources rows via `useModuleData(...)`
      (`frontend/src/lib/useModuleData.js`), not an inline `const X = [...]`.
      The former constant is retained only as the hook's `fallback`.
- [ ] **Manifest** — `frontend/src/features/<name>/module.config.js` present and
      complete (`path, label, group, icon, color, element`, `guide`).
- [ ] **Guide** — the module's `MODULE_GUIDES` entry lives in the manifest `guide`.
- [ ] **What-if wired to API** — calculators call the calc endpoint, not a
      client-only duplicate of the formula (single source of truth in the engine).

## 4. Quality bar — zero of the known regression classes

These are the bug classes catalogued across the REM remediation sprints; the
validator greps for them. All must be **zero**:

- [ ] **No division-by-zero** — every `/ arr.length` (or similar) guarded
      (`arr.length ? … : 0` or `Math.max(1, n)`).
- [ ] **No undefined theme tokens** — every `T.<token>` used is defined on the
      local `T` object (no `T.card`/`T.sub`/`T.indigo` crashes).
- [ ] **No in-place sort mutation** — `[...arr].sort(...)`, never `arr.sort(...)`
      on a module-level const or `useMemo` result.
- [ ] **Standard PRNG** — deterministic data uses the platform `sr()` helper.

## 5. Build & render

- [ ] `cd frontend && CI=true npm run build` → exit 0, zero ESLint errors.
- [ ] Page renders with zero console errors across all tabs and filter combinations.
- [ ] Scientific/regulatory accuracy reviewed by the module owner (domain check).

---

### Promotion

`draft → review`  owner self-attests sections 1–3 scaffolded.
`review → beta`   `scripts/validate-module.js <path>` passes (sections 4–5 + manifest).
`beta → production`  second-reviewer sign-off in the Refinement Board + domain accuracy check.
