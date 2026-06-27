/**
 * useReferenceData — read the shared public reference-data layer (Tier-1 free
 * authoritative datasets: OWID, SBTi, Verra, World Bank, ...).
 *
 * Backed by /api/v1/refdata (backend/api/v1/routes/public_reference_data.py),
 * populated by backend/scripts/ingest/. Unlike useModuleData (one module's own
 * table), this is shared data many modules consume — so a module can replace
 * synthetic constants with real licensed/public figures with a one-line swap.
 *
 *   // long-format time series (entity x year x metric)
 *   const { data: co2 = [] } = useReferencePoints('owid_co2', { metric: 'co2_per_capita', yearFrom: 1990 });
 *   // entity catalogue (e.g. Verra projects, SBTi companies)
 *   const { data: projects = [] } = useReferenceRecords('verra', { category: 'nature' });
 *   // the registry (what's loaded)
 *   const { data: sources = [] } = useReferenceSources();
 */
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useReferenceSources(options = {}) {
  return useQuery({
    queryKey: ['refdata', 'sources'],
    queryFn: async () => (await axios.get('/api/v1/refdata/sources')).data,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    ...options,
  });
}

export function useReferencePoints(sourceKey, { metric, entity, year, yearFrom, limit, fallback, ...opts } = {}) {
  const params = {};
  if (metric) params.metric = metric;
  if (entity) params.entity = entity;
  if (year != null) params.year = year;
  if (yearFrom != null) params.year_from = yearFrom;
  if (limit != null) params.limit = limit;
  const q = useQuery({
    queryKey: ['refdata', sourceKey, 'points', params],
    queryFn: async () => (await axios.get(`/api/v1/refdata/${sourceKey}/points`, { params })).data,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    ...opts,
  });
  if (q.isError && fallback !== undefined) return { ...q, data: fallback, usingFallback: true };
  return q;
}

export function useReferenceRecords(sourceKey, { category, country, limit, fallback, ...opts } = {}) {
  const params = {};
  if (category) params.category = category;
  if (country) params.country = country;
  if (limit != null) params.limit = limit;
  const q = useQuery({
    queryKey: ['refdata', sourceKey, 'records', params],
    queryFn: async () => (await axios.get(`/api/v1/refdata/${sourceKey}/records`, { params })).data,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    ...opts,
  });
  if (q.isError && fallback !== undefined) return { ...q, data: fallback, usingFallback: true };
  return q;
}

export default useReferencePoints;
