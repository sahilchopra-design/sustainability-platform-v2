"""
Backend request path -> frontend RBAC module_path resolution.

Why this exists
----------------
The frontend's RBAC system (see db/models/rbac.py, api/rbac_utils.py) grants
access per *frontend route path* (e.g. "/crypto-climate" — the same string
used in `rbac_role_presets.module_paths` and React Router's <Route path=...>).
The backend, however, exposes business logic under independently-named
`/api/v1/<router-prefix>/...` routes. For most of the ~800 frontend modules
the two names happen to match (both are "crypto-climate"), but this is only a
convention, not a guarantee — a real audit of every page that calls the
backend (see below) found several routers whose prefix genuinely differs from
their frontend route (e.g. the "/issb-tcfd" page calls "/api/v1/issb-s2"; the
"/csrd-ixbrl" page calls "/api/v1/csrd"; "/water-risk" and
"/water-risk-analytics" both call the *same* "/api/v1/water-risk" prefix).

Only ~45 of the ~800 frontend module pages actually call the backend at all —
the rest are pure client-side compute/demo pages with no server data to gate.
STATIC_API_PREFIX_TO_MODULES below was built by grepping every `axios.*(` /
`useModuleData(...)` call across frontend/src/features/**/pages/*.jsx and
resolving each page's API base-URL constant back to its literal prefix. It is
intentionally a hand-verified allow-list, NOT a guess — an unmapped prefix is
left ungated (fail-open) rather than blocked, so a naming mismatch we didn't
catch can never turn into an outage for a legitimately-allowed user or a
shared/utility endpoint (health checks, `/api/v1/refdata`, etc).

Keeping this in sync
---------------------
When a new module is wired to the backend, add an entry here mapping its
`/api/v1/<prefix>` to its frontend module_path(s) (list, since a prefix can be
shared by more than one page — see "/api/v1/water-risk"). Modules built with
the newer `useModuleData(moduleKey, ...)` hook (frontend/src/lib/useModuleData.js)
don't need an entry: `moduleKey` is defined to equal the module_path by
convention, so `resolve_module_paths()` derives it automatically via the
generic-convention fallback.
"""

from __future__ import annotations

from typing import Optional

# api-prefix (the part of the path after "/api/v1") -> [frontend module_path, ...]
# Built from a source-level scan of frontend/src/features/**/pages/*.jsx
# (2026-07 RBAC enforcement audit). See module docstring above.
STATIC_API_PREFIX_TO_MODULES: dict[str, list[str]] = {
    "/adaptation-finance": ["/adaptation-finance"],
    "/ai-governance": ["/ai-governance"],
    "/biodiversity-credits": ["/biodiversity-credits"],
    "/carbon-accounting-ai": ["/carbon-accounting-ai"],
    "/climate-derivatives": ["/climate-derivatives"],
    "/climate-financial-statements": ["/climate-financial-statements"],
    "/climate-litigation": ["/climate-litigation"],
    "/corporate-nature-strategy": ["/corporate-nature-strategy"],
    "/critical-minerals": ["/critical-minerals"],
    "/crypto-climate": ["/crypto-climate"],
    "/csrd-dma": ["/csrd-dma"],
    "/csrd": ["/csrd-ixbrl"],
    "/dme-contagion": ["/dme-contagion"],
    "/dme-nlp-pulse": ["/dme-nlp-engine"],
    "/em-climate-risk": ["/em-climate-risk"],
    "/esg-controversy": ["/esg-controversy"],
    "/esg-data-quality": ["/esg-data-quality"],
    "/esg-ratings": ["/esg-ratings-comparator"],
    "/eu-taxonomy": ["/eu-taxonomy", "/eu-taxonomy-engine"],
    "/eudr": ["/eudr-engine"],
    "/food-system": ["/food-system-transition"],
    "/forced-labour": ["/forced-labour"],
    "/green-hydrogen": ["/green-hydrogen", "/green-hydrogen-lcoh"],
    "/green-securitisation": ["/green-securitisation"],
    "/greenwashing": ["/greenwashing-detection"],
    "/insurance": ["/insurance-portfolio-climate"],
    "/internal-carbon-price": ["/internal-carbon-price"],
    "/issb-s2": ["/issb-tcfd"],
    "/nbs-finance": ["/nbs-finance"],
    "/e138-pcaf": ["/pcaf-india-brsr"],
    "/facilitated-emissions": ["/pcaf-india-brsr"],
    "/physical-risk-pricing": ["/physical-risk-pricing"],
    "/data-pipeline": ["/pipeline-dashboard"],
    "/re-portfolio": ["/re-portfolio-dashboard"],
    "/regulatory-capital": ["/regulatory-capital"],
    "/regulatory-calendar": ["/reporting-hub"],
    "/residential-re": ["/residential-re-assessment"],
    "/scheduled-reports": ["/scheduled-reports"],
    "/sovereign-climate-risk": ["/sovereign-climate-risk"],
    "/sscf": ["/sscf"],
    "/stranded-assets": ["/stranded-assets"],
    "/transition-finance": ["/transition-finance"],
    "/vcm-integrity": ["/vcm-integrity"],
    "/water-risk": ["/water-risk", "/water-risk-analytics"],
    "/real-estate-carbon-analytics": ["/real-estate-carbon-analytics"],
}


def _split_v1_prefix(path: str) -> Optional[str]:
    """Return the leading '/api/v1/<segment>' prefix of `path`, or None."""
    if not path.startswith("/api/v1/"):
        return None
    rest = path[len("/api/v1"):]  # keep leading slash: "/<segment>/..."
    seg = rest.split("/", 2)
    # seg[0] == '' (leading slash), seg[1] == first path segment
    if len(seg) < 2 or not seg[1]:
        return None
    return "/" + seg[1]


def resolve_module_paths(path: str, known_modules: set) -> Optional[list[str]]:
    """
    Resolve `path` (a request path, e.g. "/api/v1/crypto-climate/assess") to
    the list of frontend module_path(s) that legitimately serve it, or None
    if the path cannot be confidently attributed to a specific RBAC module
    (in which case the caller should NOT gate the request — fail open).

    `known_modules` is the live universe of module_path strings the RBAC
    system has ever been configured with (see
    api.rbac_utils.known_module_path_universe) — used only for the generic
    useModuleData-convention fallback below, so an incidental string match
    against a prefix nobody has ever gated doesn't start blocking traffic.
    """
    prefix = _split_v1_prefix(path)
    if prefix is None:
        return None

    hit = STATIC_API_PREFIX_TO_MODULES.get(prefix)
    if hit:
        return hit

    # Generic fallback for the `useModuleData(moduleKey, ...)` convention,
    # where moduleKey is defined to equal the module_path (see
    # frontend/src/lib/useModuleData.js). Only trust an exact match against a
    # module_path the RBAC system already knows about, so we never invent a
    # false attribution for an unrelated shared endpoint.
    if prefix in known_modules:
        return [prefix]

    return None
