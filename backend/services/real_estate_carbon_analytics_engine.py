"""Business logic for the real-estate-carbon-analytics module — single source of truth for calculations."""


class RealEstateCarbonAnalyticsEngine:
    """Stateless calculator. What-if endpoints in the route delegate here so the
    frontend never re-implements a formula."""

    def summarise(self, rows):
        n = len(rows) or 1
        total = sum((r.get("value") or 0) for r in rows)
        return {
            "count": len(rows),
            "total_value": round(total, 4),
            "avg_value": round(total / n, 4),
        }

    # TODO(owner): add the module's real scenario / what-if methods here.
