"""
lineage.domains — map a domain name to the router module that owns its endpoints.

We import each router module **directly** (it carries its own routes via the
@router decorators) rather than relying on server.app assembly. `discover_all()`
scans api/v1/routes/*.py for every module that exposes a `router`, which is how
the harness scales to the whole platform.
"""

import os
import importlib

ROUTES_PKG = "api.v1.routes"
ROUTES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                          "api", "v1", "routes")

# Curated proof + early domains: name -> module under api.v1.routes
DOMAINS = {
    "stranded-assets": "api.v1.routes.stranded_assets",
    "cbam": "api.v1.routes.cbam",
    "carbon": "api.v1.routes.carbon",
    "nature-risk": "api.v1.routes.nature_risk",
    "pcaf-regulatory": "api.v1.routes.pcaf_regulatory",
    "insurance": "api.v1.routes.insurance",
    "agriculture": "api.v1.routes.agriculture",
    "mining": "api.v1.routes.mining",
}


def load_router(module_path, attr="router"):
    mod = importlib.import_module(module_path)
    return getattr(mod, attr, None)


def discover_all():
    """Return {domain_name: module_path} for every route module exposing `router`."""
    out = {}
    if not os.path.isdir(ROUTES_DIR):
        return out
    for fn in sorted(os.listdir(ROUTES_DIR)):
        if not fn.endswith(".py") or fn.startswith("_"):
            continue
        mod_name = fn[:-3]
        module_path = f"{ROUTES_PKG}.{mod_name}"
        try:
            r = load_router(module_path)
        except Exception:  # noqa: BLE001
            continue
        if r is not None and getattr(r, "routes", None):
            out[mod_name.replace("_", "-")] = module_path
    return out
