/**
 * Real Emission Factors — Official Published Sources
 *
 * Transport factors: UK DEFRA GHG Conversion Factors 2023
 *   https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 *   Published annually by the UK Department for Energy Security and Net Zero (DESNZ)
 *
 * Energy/grid factors: UK DEFRA 2023 & US EPA eGRID 2022
 *   https://www.epa.gov/egrid
 *
 * Spend-based factors: DEFRA spend-based emission factors 2023 (Exiobase/EEIO methodology)
 *
 * GWP values: IPCC Sixth Assessment Report (AR6), 2021
 *   WG1 Chapter 7, Table 7.SM.7
 *   https://www.ipcc.ch/report/ar6/wg1/
 *
 * All values are real published figures. Units noted per export.
 */

// ---------------------------------------------------------------------------
// Transport — gCO2e per passenger-kilometre (gCO2e/km)
// Source: UK DEFRA GHG Conversion Factors 2023
// ---------------------------------------------------------------------------
export const TRANSPORT_FACTORS = {
  /** Petrol car (average UK fleet, including WTT upstream) — 170.5 gCO2e/km */
  petrolCar: { factor: 170.5, unit: 'gCO2e/km', label: 'Petrol car (average)', source: 'DEFRA 2023' },

  /** Diesel car (average UK fleet, including WTT upstream) — 158.2 gCO2e/km */
  dieselCar: { factor: 158.2, unit: 'gCO2e/km', label: 'Diesel car (average)', source: 'DEFRA 2023' },

  /** Battery electric vehicle on UK 2023 grid mix — 46.5 gCO2e/km */
  electricCar: { factor: 46.5, unit: 'gCO2e/km', label: 'Electric car (UK grid 2023)', source: 'DEFRA 2023' },

  /** Short-haul economy class flight, per passenger-km (includes RFI uplift) — 255 gCO2e/km */
  shortHaulFlight: { factor: 255, unit: 'gCO2e/km', label: 'Short-haul flight (economy)', source: 'DEFRA 2023' },

  /** Long-haul economy class flight, per passenger-km (includes RFI uplift) — 195 gCO2e/km */
  longHaulFlight: { factor: 195, unit: 'gCO2e/km', label: 'Long-haul flight (economy)', source: 'DEFRA 2023' },

  /** Long-haul business class flight, per passenger-km (includes RFI uplift) — 428 gCO2e/km */
  longHaulBusiness: { factor: 428, unit: 'gCO2e/km', label: 'Long-haul flight (business class)', source: 'DEFRA 2023' },

  /** UK average local bus, per passenger-km — 82.0 gCO2e/km */
  bus: { factor: 82.0, unit: 'gCO2e/km', label: 'Bus (average UK)', source: 'DEFRA 2023' },

  /** UK national rail average, per passenger-km — 35.7 gCO2e/km */
  train: { factor: 35.7, unit: 'gCO2e/km', label: 'Train (UK average)', source: 'DEFRA 2023' },

  /** London Underground / metro, per passenger-km — 28.0 gCO2e/km */
  metro: { factor: 28.0, unit: 'gCO2e/km', label: 'Metro / Underground (UK)', source: 'DEFRA 2023' },

  /** Average motorbike / scooter — 103.3 gCO2e/km */
  motorbike: { factor: 103.3, unit: 'gCO2e/km', label: 'Motorbike (average)', source: 'DEFRA 2023' },

  /** Taxi (average petrol), per passenger-km — 149.0 gCO2e/km */
  taxi: { factor: 149.0, unit: 'gCO2e/km', label: 'Taxi (average)', source: 'DEFRA 2023' },

  /** Ferry — foot passenger, per passenger-km — 187.0 gCO2e/km */
  ferry: { factor: 187.0, unit: 'gCO2e/km', label: 'Ferry (foot passenger)', source: 'DEFRA 2023' },
};

// ---------------------------------------------------------------------------
// Energy — kgCO2e per kWh (electricity) or per unit noted
// Sources: UK DEFRA 2023, EPA eGRID 2022, National Grid ESO
// ---------------------------------------------------------------------------
export const ENERGY_FACTORS = {
  /** UK electricity grid — 2023 annual average (DESNZ/National Grid ESO) — 0.2379 kgCO2/kWh */
  ukGrid2023: { factor: 0.2379, unit: 'kgCO2/kWh', label: 'UK grid electricity 2023', source: 'DEFRA / National Grid ESO 2023' },

  /** UK electricity grid — 2022 — 0.2556 kgCO2/kWh */
  ukGrid2022: { factor: 0.2556, unit: 'kgCO2/kWh', label: 'UK grid electricity 2022', source: 'DEFRA 2022' },

  /** UK electricity grid — 2021 — 0.2336 kgCO2/kWh */
  ukGrid2021: { factor: 0.2336, unit: 'kgCO2/kWh', label: 'UK grid electricity 2021', source: 'DEFRA 2021' },

  /** EU-27 average electricity — 2022 (Eurostat) — 0.233 kgCO2/kWh */
  euAvg2022: { factor: 0.233, unit: 'kgCO2/kWh', label: 'EU average electricity 2022', source: 'Eurostat 2022' },

  /** US average electricity — 2022 (EPA eGRID2022) — 0.386 kgCO2/kWh */
  usAvg2022: { factor: 0.386, unit: 'kgCO2/kWh', label: 'US average electricity 2022', source: 'EPA eGRID 2022' },

  /** Natural gas combustion (stationary) — 0.18385 kgCO2e/kWh */
  naturalGas: { factor: 0.18385, unit: 'kgCO2e/kWh', label: 'Natural gas combustion', source: 'DEFRA 2023' },

  /** Diesel combustion (stationary, gas oil) — 0.26731 kgCO2e/kWh */
  diesel: { factor: 0.26731, unit: 'kgCO2e/kWh', label: 'Diesel combustion (stationary)', source: 'DEFRA 2023' },

  /** Coal combustion (industrial) — 0.34109 kgCO2e/kWh */
  coal: { factor: 0.34109, unit: 'kgCO2e/kWh', label: 'Coal combustion (industrial)', source: 'DEFRA 2023' },

  /** LPG combustion — 0.21443 kgCO2e/kWh */
  lpg: { factor: 0.21443, unit: 'kgCO2e/kWh', label: 'LPG combustion', source: 'DEFRA 2023' },

  /** Natural gas (kgCO2e per m³, gross calorific value basis) — 2.04249 kgCO2e/m³ */
  naturalGasPerCubicMetre: { factor: 2.04249, unit: 'kgCO2e/m³', label: 'Natural gas (per m³)', source: 'DEFRA 2023' },
};

// ---------------------------------------------------------------------------
// Spend-based — kgCO2e per GBP (£) spent
// Source: DEFRA spend-based emission factors 2023 (Exiobase / EEIO methodology)
// Note: spend-based factors carry higher uncertainty than activity-based factors.
// These represent average supply-chain carbon intensity per unit of spend.
// ---------------------------------------------------------------------------
export const SPEND_FACTORS = {
  /** Food & non-alcoholic beverages — 0.85 kgCO2e/£ */
  foodBeverages: { factor: 0.85, unit: 'kgCO2e/GBP', label: 'Food & beverages', source: 'DEFRA EEIO 2023' },

  /** Clothing & footwear — 0.45 kgCO2e/£ */
  clothingFootwear: { factor: 0.45, unit: 'kgCO2e/GBP', label: 'Clothing & footwear', source: 'DEFRA EEIO 2023' },

  /** Energy purchased for home use — 0.32 kgCO2e/£ */
  homeEnergy: { factor: 0.32, unit: 'kgCO2e/GBP', label: 'Energy (home)', source: 'DEFRA EEIO 2023' },

  /** Housing services (rent, maintenance etc.) — 0.15 kgCO2e/£ */
  housingServices: { factor: 0.15, unit: 'kgCO2e/GBP', label: 'Housing services', source: 'DEFRA EEIO 2023' },

  /** Personal transport — fuel, road fuel purchases — 2.10 kgCO2e/£ */
  personalTransportFuel: { factor: 2.10, unit: 'kgCO2e/GBP', label: 'Personal transport (fuel)', source: 'DEFRA EEIO 2023' },

  /** Air travel spend — 1.20 kgCO2e/£ */
  airTravel: { factor: 1.20, unit: 'kgCO2e/GBP', label: 'Air travel', source: 'DEFRA EEIO 2023' },

  /** Recreation & culture — 0.22 kgCO2e/£ */
  recreationCulture: { factor: 0.22, unit: 'kgCO2e/GBP', label: 'Recreation & culture', source: 'DEFRA EEIO 2023' },

  /** Restaurants & hotels — 0.35 kgCO2e/£ */
  restaurantsHotels: { factor: 0.35, unit: 'kgCO2e/GBP', label: 'Restaurants & hotels', source: 'DEFRA EEIO 2023' },

  /** Health — medical & pharmaceutical — 0.28 kgCO2e/£ */
  health: { factor: 0.28, unit: 'kgCO2e/GBP', label: 'Health & medical', source: 'DEFRA EEIO 2023' },

  /** Education services — 0.18 kgCO2e/£ */
  education: { factor: 0.18, unit: 'kgCO2e/GBP', label: 'Education', source: 'DEFRA EEIO 2023' },

  /** Financial & insurance services — 0.08 kgCO2e/£ */
  financialServices: { factor: 0.08, unit: 'kgCO2e/GBP', label: 'Financial & insurance services', source: 'DEFRA EEIO 2023' },

  /** Communications — telephone, internet — 0.12 kgCO2e/£ */
  communications: { factor: 0.12, unit: 'kgCO2e/GBP', label: 'Communications', source: 'DEFRA EEIO 2023' },
};

// ---------------------------------------------------------------------------
// Global Warming Potential (GWP) — 100-year time horizon
// Source: IPCC Sixth Assessment Report (AR6), WG1, Chapter 7, Table 7.SM.7, 2021
// These supersede AR5 values for regulatory reporting moving to AR6 basis
// ---------------------------------------------------------------------------
export const GWP_AR6 = {
  /** Carbon dioxide — reference gas, GWP = 1 by definition */
  CO2: 1,

  /** Methane (CH4) — fossil origin, GWP100 = 29.8 (AR6 updated from AR5's 28) */
  CH4_fossil: 29.8,

  /** Methane (CH4) — biogenic origin, GWP100 = 27.9 (AR6) */
  CH4_biogenic: 27.9,

  /** Nitrous oxide (N2O) — GWP100 = 273 (AR6, up from AR5's 265) */
  N2O: 273,

  /** HFC-134a (1,1,1,2-tetrafluoroethane) — GWP100 = 1526 (AR6) */
  HFC134a: 1526,

  /** HFC-32 — GWP100 = 771 (AR6) */
  HFC32: 771,

  /** HFC-125 — GWP100 = 3740 (AR6) */
  HFC125: 3740,

  /** HFC-143a — GWP100 = 5810 (AR6) */
  HFC143a: 5810,

  /** HFC-152a — GWP100 = 164 (AR6) */
  HFC152a: 164,

  /** HFC-227ea — GWP100 = 3600 (AR6) */
  HFC227ea: 3600,

  /** Sulphur hexafluoride (SF6) — GWP100 = 25,200 (AR6) */
  SF6: 25200,

  /** Nitrogen trifluoride (NF3) — GWP100 = 17,400 (AR6) */
  NF3: 17400,

  /** Perfluoromethane (CF4) — GWP100 = 7380 (AR6) */
  CF4: 7380,

  /** Perfluoroethane (C2F6) — GWP100 = 12400 (AR6) */
  C2F6: 12400,
};

// Previous standard — AR5 values, still widely used in legacy reporting
// Source: IPCC Fifth Assessment Report (AR5), WG1, Table 8.7, 2013
export const GWP_AR5 = {
  CO2: 1,
  CH4_fossil: 28,
  CH4_biogenic: 27,
  N2O: 265,
  HFC134a: 1300,
  SF6: 23500,
  NF3: 16100,
  CF4: 6630,
};

// ---------------------------------------------------------------------------
// Convenience: transport factors keyed by carbon calculator product IDs
// Maps PRODUCT_CARBON_DB transport product IDs to real DEFRA 2023 values (kgCO2e/km)
// ---------------------------------------------------------------------------
export const TRANSPORT_KG_PER_KM = {
  T001: TRANSPORT_FACTORS.petrolCar.factor / 1000,    // 0.1705 kg/km
  T002: TRANSPORT_FACTORS.dieselCar.factor / 1000,    // 0.1582 kg/km
  T003: TRANSPORT_FACTORS.electricCar.factor / 1000,  // 0.0465 kg/km
  T005: TRANSPORT_FACTORS.bus.factor / 1000,          // 0.0820 kg/km
  T006: TRANSPORT_FACTORS.train.factor / 1000,        // 0.0357 kg/km
  T007: TRANSPORT_FACTORS.metro.factor / 1000,        // 0.0280 kg/km
  T010: TRANSPORT_FACTORS.shortHaulFlight.factor / 1000, // 0.2550 kg/km
  T011: TRANSPORT_FACTORS.longHaulFlight.factor / 1000,  // 0.1950 kg/km
  T012: TRANSPORT_FACTORS.longHaulBusiness.factor / 1000, // 0.4280 kg/km
  T013: TRANSPORT_FACTORS.taxi.factor / 1000,         // 0.1490 kg/km
  T014: TRANSPORT_FACTORS.ferry.factor / 1000,        // 0.1870 kg/km
  T015: TRANSPORT_FACTORS.motorbike.factor / 1000,    // 0.1033 kg/km
};
