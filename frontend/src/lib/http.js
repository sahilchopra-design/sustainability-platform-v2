/**
 * http.js — request timeout + circuit breaker for axios calls (R3 gap A-2)
 *
 * The India BRSR "Run PCAF Calculation" flow (and its sibling calls) had no
 * request timeout at all: when the backend was unreachable, the browser's
 * own connection timeout could leave a "Run" button showing "Calculating..."
 * for 90+ seconds with no error, no retry option, and repeated attempts
 * re-hitting the same dead host (R3 A-2). This wraps an axios call with a
 * hard per-request timeout (via AbortController) and a simple circuit
 * breaker that short-circuits further calls to a host that just failed
 * repeatedly, instead of making the user wait out the same timeout again.
 */

const DEFAULT_TIMEOUT_MS = 10000;
const FAILURE_THRESHOLD = 2;
const OPEN_DURATION_MS = 60000;

const breakers = new Map(); // host -> { failures, openUntil }

function hostKey(url) {
  try {
    return new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined).host;
  } catch {
    return String(url);
  }
}

export class CircuitOpenError extends Error {
  constructor(host, retryInMs) {
    super(`${host} failed ${FAILURE_THRESHOLD}+ times recently — pausing requests to it for ${Math.ceil(retryInMs / 1000)}s instead of hanging again. Retry will be allowed automatically.`);
    this.name = 'CircuitOpenError';
    this.host = host;
    this.retryInMs = retryInMs;
  }
}

export class RequestTimeoutError extends Error {
  constructor(url, timeoutMs) {
    super(`Request to ${url} did not respond within ${timeoutMs / 1000}s — aborted instead of hanging indefinitely.`);
    this.name = 'RequestTimeoutError';
  }
}

function breakerState(host) {
  return breakers.get(host) || { failures: 0, openUntil: 0 };
}

function isOpen(host) {
  const b = breakerState(host);
  return !!(b.openUntil && Date.now() < b.openUntil);
}

function recordFailure(host) {
  const b = breakerState(host);
  b.failures += 1;
  if (b.failures >= FAILURE_THRESHOLD) b.openUntil = Date.now() + OPEN_DURATION_MS;
  breakers.set(host, b);
}

function recordSuccess(host) {
  breakers.set(host, { failures: 0, openUntil: 0 });
}

/**
 * Run one axios call with a hard timeout and circuit-breaker protection.
 *
 * @param {string} url - request URL; used both to make the call and to key the circuit breaker per host
 * @param {(signal: AbortSignal) => Promise<any>} makeRequest - thunk that issues the axios call, e.g. signal => axios.post(url, body, {headers, signal})
 * @param {number} [timeoutMs]
 * @returns {Promise<any>} the resolved axios response
 * @throws {CircuitOpenError} if the host's circuit breaker is currently open
 * @throws {RequestTimeoutError} if the request is aborted for exceeding timeoutMs (surfaced as an axios cancel error with this module's message)
 */
export async function requestWithTimeout(url, makeRequest, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const host = hostKey(url);
  if (isOpen(host)) {
    const b = breakerState(host);
    throw new CircuitOpenError(host, b.openUntil - Date.now());
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await makeRequest(controller.signal);
    recordSuccess(host);
    return result;
  } catch (e) {
    recordFailure(host);
    if (controller.signal.aborted) throw new RequestTimeoutError(url, timeoutMs);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Manually clear a host's circuit breaker (e.g. on an explicit user Retry). */
export function resetCircuitBreaker(url) {
  breakers.delete(hostKey(url));
}
