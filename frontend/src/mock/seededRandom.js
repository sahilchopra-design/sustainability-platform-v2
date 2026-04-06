/**
 * mock/seededRandom.js — Centralized seeded random for all mock data generation
 *
 * This is the ONLY place Math.random() is allowed.
 * All page-level components that need stable mock data import from here.
 *
 * KEY RULE: Production calculation functions in engines/ must NEVER import from mock/.
 *           Data flow: mock/ → pages (display) only.
 *                      engines/ → pages (calculations) only.
 *
 * The sr() function below is already used in many pages.
 * This module formalizes it as the canonical implementation.
 */

/**
 * Mulberry32 seeded PRNG (deterministic, no Math.random()).
 *
 * @param {number} seed
 * @returns {() => number} — Function returning U(0,1)
 */
export function seededPRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Global seeded instance with fixed seed for consistent mock data across sessions
const _rng = seededPRNG(0xdeadbeef);

/**
 * sr(seed) — Deterministic random float in [0, 1) for a given numeric seed.
 *
 * This is the drop-in replacement for the `sr` function scattered across
 * all page components. Same API: sr(42) always returns the same value.
 *
 * Usage:
 *   import { sr } from '../../../mock/seededRandom';
 *   const value = sr(123) * 100;
 */
export function sr(seed) {
  // Simple deterministic hash of the seed
  let s = (seed ^ 0x9e3779b9) >>> 0;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  s = (s ^ (s >>> 16)) >>> 0;
  return s / 4294967296;
}

/**
 * srRange(seed, min, max) — Deterministic value in [min, max].
 */
export function srRange(seed, min, max) {
  return min + sr(seed) * (max - min);
}

/**
 * srInt(seed, min, max) — Deterministic integer in [min, max].
 */
export function srInt(seed, min, max) {
  return Math.floor(min + sr(seed) * (max - min + 1));
}

/**
 * srChoice(seed, array) — Deterministic element from array.
 */
export function srChoice(seed, array) {
  return array[srInt(seed, 0, array.length - 1)];
}

/**
 * srNormal(seed, mean, std) — Approximate normal via Box-Muller with seeded input.
 */
export function srNormal(seed, mean = 0, std = 1) {
  const u1 = Math.max(sr(seed), 1e-10);
  const u2 = sr(seed + 0xffff);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

export default { sr, srRange, srInt, srChoice, srNormal, seededPRNG };
