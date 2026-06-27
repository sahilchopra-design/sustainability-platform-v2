/**
 * useModuleData — standard data-access hook for DB-backed modules.
 *
 * Part of the per-module refinement system (see docs/MODULE_WORKFLOW.md).
 * A production-grade module replaces its hardcoded constant arrays with a call
 * to this hook, so data flows DB -> API -> hook -> UI.
 *
 * Auth: relies on the global axios Bearer token set by AuthContext
 * (axios.defaults.headers.common['Authorization']). No custom instance needed.
 * Routing: the CRA dev proxy (package.json "proxy": http://localhost:8001)
 * forwards /api to the FastAPI backend.
 *
 * Convention: a DB-backed module exposes REST under /api/v1/<moduleKey>/<resource>.
 *   e.g. /api/v1/real-estate-carbon/properties
 *
 * Usage:
 *   const { data: properties = [], isLoading, error } = useModuleData('real-estate-carbon', 'properties');
 *
 * Backwards-compatible fallback: a refined page should keep its hardcoded
 * constant as `options.fallback`. When the API is unreachable (offline dev,
 * backend down, table not yet seeded) the hook returns the fallback so the
 * current view never breaks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const base = (moduleKey, resource) => `/api/v1/${moduleKey}/${resource}`;

export function useModuleData(moduleKey, resource = 'data', options = {}) {
  const { params, enabled = true, fallback, ...rest } = options;
  const query = useQuery({
    queryKey: ['module', moduleKey, resource, params || null],
    queryFn: async () => {
      const res = await axios.get(base(moduleKey, resource), { params });
      return res.data;
    },
    enabled,
    retry: 1,
    ...rest,
  });

  // Keep the current view intact: if the request errored and a fallback was
  // provided, surface the fallback as data. The page renders identically to its
  // pre-refinement state until the backend table is live.
  if (query.isError && fallback !== undefined) {
    return { ...query, data: fallback, usingFallback: true };
  }
  return { ...query, usingFallback: false };
}

/**
 * useModuleMutation — create/update/delete helper that invalidates the
 * matching query so the UI refetches after a write.
 *
 *   const save = useModuleMutation('real-estate-carbon', 'properties', 'post');
 *   save.mutate(newRow);
 */
export function useModuleMutation(moduleKey, resource = 'data', method = 'post') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body } = {}) => {
      const url = id != null ? `${base(moduleKey, resource)}/${id}` : base(moduleKey, resource);
      const res = await axios[method](url, body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module', moduleKey, resource] });
    },
  });
}

export default useModuleData;
