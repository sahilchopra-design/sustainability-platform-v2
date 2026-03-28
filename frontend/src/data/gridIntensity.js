/**
 * Electricity Grid Carbon Intensity by Country
 *
 * Primary source: Ember Global Electricity Review 2023 (ember-climate.org)
 * Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)
 * https://ember-climate.org/data/data-tools/data-explorer/
 *
 * Secondary sources for validation:
 *   - IEA World Energy Outlook 2022 (IEA.org)
 *   - Our World in Data / Electricity Maps (electricitymaps.com)
 *   - DESNZ / National Grid ESO for UK figures
 *
 * Values represent annual average grid carbon intensity for calendar year 2022
 * Unit: gCO2eq/kWh (grams of CO2-equivalent per kilowatt-hour of electricity consumed)
 * Metric: consumption-based intensity (imports/exports adjusted where data available)
 *
 * trend: 'falling' | 'stable' | 'rising'
 * yoyChange: year-on-year change in gCO2eq/kWh (2021→2022, negative = improving)
 * primary: dominant generation source(s) driving the carbon intensity level
 */

export const GRID_INTENSITY_2022 = [
  // ── Very Low Carbon (< 100 gCO2/kWh) ─────────────────────────────────────
  { country: 'Norway',      iso2: 'NO', intensity: 24,  primary: 'Hydro',              trend: 'stable',  yoyChange: +2  },
  { country: 'France',      iso2: 'FR', intensity: 56,  primary: 'Nuclear',            trend: 'stable',  yoyChange: -3  },
  { country: 'Sweden',      iso2: 'SE', intensity: 45,  primary: 'Nuclear + Hydro',    trend: 'falling', yoyChange: -5  },
  { country: 'Brazil',      iso2: 'BR', intensity: 91,  primary: 'Hydro',              trend: 'stable',  yoyChange: +8  },

  // ── Low Carbon (100–200 gCO2/kWh) ────────────────────────────────────────
  { country: 'New Zealand', iso2: 'NZ', intensity: 109, primary: 'Hydro + Geothermal', trend: 'falling', yoyChange: -6  },
  { country: 'Canada',      iso2: 'CA', intensity: 130, primary: 'Hydro + Nuclear',    trend: 'stable',  yoyChange: -2  },
  { country: 'Denmark',     iso2: 'DK', intensity: 154, primary: 'Wind',               trend: 'falling', yoyChange: -18 },
  { country: 'Spain',       iso2: 'ES', intensity: 167, primary: 'Wind + Nuclear',     trend: 'falling', yoyChange: -22 },

  // ── Medium Carbon (200–350 gCO2/kWh) ─────────────────────────────────────
  { country: 'UK',          iso2: 'GB', intensity: 243, primary: 'Gas + Wind',         trend: 'falling', yoyChange: -5  },
  { country: 'Italy',       iso2: 'IT', intensity: 281, primary: 'Gas + Renewables',   trend: 'falling', yoyChange: -8  },
  { country: 'Ireland',     iso2: 'IE', intensity: 269, primary: 'Gas + Wind',         trend: 'falling', yoyChange: -14 },
  { country: 'Netherlands', iso2: 'NL', intensity: 328, primary: 'Gas + Wind',         trend: 'falling', yoyChange: -20 },

  // ── Higher Carbon (350–500 gCO2/kWh) ─────────────────────────────────────
  { country: 'Germany',     iso2: 'DE', intensity: 385, primary: 'Gas + Coal',         trend: 'falling', yoyChange: +12 }, // rose in 2022 due to gas crisis
  { country: 'USA',         iso2: 'US', intensity: 386, primary: 'Gas + Coal',         trend: 'falling', yoyChange: -8  },
  { country: 'Mexico',      iso2: 'MX', intensity: 402, primary: 'Gas + Oil',          trend: 'stable',  yoyChange: +3  },
  { country: 'Japan',       iso2: 'JP', intensity: 465, primary: 'Gas + Coal',         trend: 'falling', yoyChange: -14 },
  { country: 'Vietnam',     iso2: 'VN', intensity: 490, primary: 'Coal + Hydro',       trend: 'rising',  yoyChange: +22 },
  { country: 'Australia',   iso2: 'AU', intensity: 487, primary: 'Coal + Gas',         trend: 'falling', yoyChange: -18 },
  { country: 'Singapore',   iso2: 'SG', intensity: 424, primary: 'Natural Gas',        trend: 'stable',  yoyChange: -4  },
  { country: 'South Korea', iso2: 'KR', intensity: 415, primary: 'Coal + Nuclear',     trend: 'falling', yoyChange: -8  },

  // ── High Carbon (> 500 gCO2/kWh) ─────────────────────────────────────────
  { country: 'China',       iso2: 'CN', intensity: 555, primary: 'Coal',               trend: 'falling', yoyChange: -10 },
  { country: 'India',       iso2: 'IN', intensity: 632, primary: 'Coal',               trend: 'falling', yoyChange: -5  },
  { country: 'Indonesia',   iso2: 'ID', intensity: 711, primary: 'Coal',               trend: 'stable',  yoyChange: +2  },
  { country: 'South Africa',iso2: 'ZA', intensity: 714, primary: 'Coal',               trend: 'stable',  yoyChange: -8  },
  { country: 'Poland',      iso2: 'PL', intensity: 697, primary: 'Coal',               trend: 'falling', yoyChange: -18 },
];

// ---------------------------------------------------------------------------
// Historical trends for key countries — gCO2eq/kWh annual averages
// Sources: Ember Global Electricity Review 2023, Our World in Data, IEA
// ---------------------------------------------------------------------------
export const GRID_INTENSITY_TREND = {
  /** UK — dramatic decarbonisation driven by coal phase-out and offshore wind scale-up */
  UK: [
    { year: 2012, intensity: 547 },
    { year: 2013, intensity: 516 },
    { year: 2014, intensity: 449 },
    { year: 2015, intensity: 411 },
    { year: 2016, intensity: 351 },
    { year: 2017, intensity: 310 },
    { year: 2018, intensity: 283 },
    { year: 2019, intensity: 260 },
    { year: 2020, intensity: 228 },
    { year: 2021, intensity: 248 },
    { year: 2022, intensity: 243 },
    { year: 2023, intensity: 202 }, // preliminary/estimated, National Grid ESO
  ],

  /** Germany — large coal share; renewables growing but gas crisis caused 2022 uptick */
  Germany: [
    { year: 2012, intensity: 567 },
    { year: 2015, intensity: 527 },
    { year: 2018, intensity: 489 },
    { year: 2019, intensity: 412 },
    { year: 2020, intensity: 371 },
    { year: 2021, intensity: 373 },
    { year: 2022, intensity: 385 },
    { year: 2023, intensity: 354 }, // preliminary
  ],

  /** France — low intensity, nuclear dominant; temporary rise as reactors offline 2022 */
  France: [
    { year: 2012, intensity: 82  },
    { year: 2015, intensity: 58  },
    { year: 2018, intensity: 52  },
    { year: 2020, intensity: 51  },
    { year: 2021, intensity: 59  },
    { year: 2022, intensity: 56  },
    { year: 2023, intensity: 47  }, // preliminary
  ],

  /** USA — slow but steady decarbonisation as coal is replaced by gas and renewables */
  USA: [
    { year: 2012, intensity: 453 },
    { year: 2015, intensity: 434 },
    { year: 2018, intensity: 416 },
    { year: 2019, intensity: 407 },
    { year: 2020, intensity: 389 },
    { year: 2021, intensity: 394 },
    { year: 2022, intensity: 386 },
    { year: 2023, intensity: 375 }, // preliminary
  ],

  /** China — absolute emissions rising but intensity slowly improving as wind/solar scale */
  China: [
    { year: 2012, intensity: 620 },
    { year: 2015, intensity: 603 },
    { year: 2018, intensity: 587 },
    { year: 2020, intensity: 572 },
    { year: 2021, intensity: 565 },
    { year: 2022, intensity: 555 },
    { year: 2023, intensity: 538 }, // preliminary
  ],

  /** India — coal-dominated, gradual improvement as solar capacity expands rapidly */
  India: [
    { year: 2012, intensity: 710 },
    { year: 2015, intensity: 695 },
    { year: 2018, intensity: 672 },
    { year: 2020, intensity: 648 },
    { year: 2021, intensity: 637 },
    { year: 2022, intensity: 632 },
    { year: 2023, intensity: 618 }, // preliminary
  ],

  /** World average — weighted by electricity generation volume */
  World: [
    { year: 2012, intensity: 522 },
    { year: 2015, intensity: 517 },
    { year: 2018, intensity: 490 },
    { year: 2019, intensity: 474 },
    { year: 2020, intensity: 453 },
    { year: 2021, intensity: 461 },
    { year: 2022, intensity: 444 },
    { year: 2023, intensity: 432 }, // preliminary
  ],
};

// ---------------------------------------------------------------------------
// Lookup helper — returns intensity record for a given ISO2 country code or name
// Returns null if not found.
// ---------------------------------------------------------------------------
export function getGridIntensity(countryOrIso2) {
  const query = countryOrIso2.toUpperCase();
  return (
    GRID_INTENSITY_2022.find(
      r => r.iso2.toUpperCase() === query || r.country.toUpperCase() === query
    ) || null
  );
}

// ---------------------------------------------------------------------------
// Categorisation helper — returns a label tier for a given intensity value
// ---------------------------------------------------------------------------
export function intensityTier(gCO2PerKwh) {
  if (gCO2PerKwh < 100)  return { label: 'Very Low Carbon',  color: '#16a34a' };
  if (gCO2PerKwh < 200)  return { label: 'Low Carbon',       color: '#65a30d' };
  if (gCO2PerKwh < 350)  return { label: 'Medium Carbon',    color: '#d97706' };
  if (gCO2PerKwh < 500)  return { label: 'Higher Carbon',    color: '#ea580c' };
  return                         { label: 'High Carbon',      color: '#dc2626' };
}

// ---------------------------------------------------------------------------
// 2023 estimated intensities for key markets (National Grid ESO / Ember preliminary)
// Use GRID_INTENSITY_2022 for validated annual data; use these for indicative 2023 context
// ---------------------------------------------------------------------------
export const GRID_INTENSITY_2023_EST = {
  GB: 202,  // National Grid ESO published estimate
  DE: 354,
  FR: 47,
  US: 375,
  CN: 538,
  IN: 618,
  AU: 462,
  NO: 22,
  SE: 41,
  DK: 118,
};
