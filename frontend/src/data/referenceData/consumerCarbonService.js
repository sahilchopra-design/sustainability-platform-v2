/**
 * Consumer Carbon Intelligence Service
 * Sprint Z — Reference data backbone for all consumer carbon modules.
 *
 * Provides:
 *   1. Product Carbon Database        — 300+ products mapped to carbon intensity factors
 *   2. Spending Category Carbon Map   — MCC code -> carbon factor mapping
 *   3. Country Grid Carbon Intensity  — Electricity grid factors for 30 countries
 *   4. Carbon Equivalence Calculator  — Convert kg CO2e to relatable metrics
 *   5. Carbon Budget Calculator       — Annual/monthly/daily budgets per scenario
 *   6. Receipt Keyword Matcher        — NLP-lite keyword->product matching
 *   7. Transition Recommendations     — Actionable switches with carbon savings
 *
 * Data sourced from: Our World in Data, DEFRA 2024, EPA 2024, Ecoinvent 3.10,
 *                    WRAP, IEA 2024, CEA, RTE, METI, NVE, Eskom.
 *
 * Usage:
 *   import { ConsumerCarbonData } from '../../../data/referenceData/consumerCarbonService';
 */

// ---------------------------------------------------------------------------
// 1. COUNTRY GRID CARBON INTENSITY (kgCO2 per kWh)
// ---------------------------------------------------------------------------
export const GRID_CARBON_INTENSITY = {
  IN: { intensity: 0.82,  source: 'CEA 2024',   label: 'India (coal-heavy)' },
  US: { intensity: 0.42,  source: 'EPA 2024',   label: 'USA (mixed)' },
  GB: { intensity: 0.21,  source: 'DEFRA 2024', label: 'UK (wind+gas)' },
  DE: { intensity: 0.35,  source: 'UBA 2024',   label: 'Germany (renewables growing)' },
  FR: { intensity: 0.06,  source: 'RTE 2024',   label: 'France (nuclear 70%)' },
  JP: { intensity: 0.50,  source: 'METI 2024',  label: 'Japan (post-Fukushima)' },
  CN: { intensity: 0.58,  source: 'IEA 2024',   label: 'China (coal-heavy)' },
  BR: { intensity: 0.10,  source: 'EPE 2024',   label: 'Brazil (hydro 65%)' },
  AU: { intensity: 0.62,  source: 'DISER 2024', label: 'Australia (coal)' },
  CA: { intensity: 0.12,  source: 'NRCan 2024', label: 'Canada (hydro+nuclear)' },
  SE: { intensity: 0.01,  source: 'SCB 2024',   label: 'Sweden (hydro+nuclear+wind)' },
  NO: { intensity: 0.008, source: 'NVE 2024',   label: 'Norway (99% hydro)' },
  ZA: { intensity: 0.95,  source: 'Eskom 2024', label: 'South Africa (coal 85%)' },
  SG: { intensity: 0.41,  source: 'EMA 2024',   label: 'Singapore (gas)' },
  KR: { intensity: 0.46,  source: 'KEPCO 2024', label: 'South Korea (coal+nuclear)' },
  IT: { intensity: 0.33,  source: 'ISPRA 2024', label: 'Italy (gas+renewables)' },
  ES: { intensity: 0.22,  source: 'REE 2024',   label: 'Spain (wind+solar)' },
  NL: { intensity: 0.38,  source: 'CBS 2024',   label: 'Netherlands (gas+wind)' },
  PL: { intensity: 0.72,  source: 'KOBiZE 2024',label: 'Poland (coal 70%)' },
  RU: { intensity: 0.45,  source: 'IEA 2024',   label: 'Russia (gas+hydro)' },
  MX: { intensity: 0.43,  source: 'SENER 2024', label: 'Mexico (gas+oil)' },
  ID: { intensity: 0.76,  source: 'MEMR 2024',  label: 'Indonesia (coal)' },
  TR: { intensity: 0.47,  source: 'TEIAS 2024', label: 'Turkey (gas+coal+hydro)' },
  SA: { intensity: 0.70,  source: 'ECRA 2024',  label: 'Saudi Arabia (oil+gas)' },
  AE: { intensity: 0.55,  source: 'EWEC 2024',  label: 'UAE (gas + nuclear ramp)' },
  NZ: { intensity: 0.11,  source: 'MBIE 2024',  label: 'New Zealand (hydro+geothermal)' },
  AT: { intensity: 0.10,  source: 'UBA-AT 2024',label: 'Austria (hydro+wind)' },
  DK: { intensity: 0.14,  source: 'DEA 2024',   label: 'Denmark (wind 55%)' },
  FI: { intensity: 0.08,  source: 'Stats FI 24', label: 'Finland (nuclear+hydro+wind)' },
  CH: { intensity: 0.02,  source: 'BFE 2024',   label: 'Switzerland (hydro+nuclear)' },
};

// ---------------------------------------------------------------------------
// 2. DEFRA EMISSION FACTORS (transport, home energy)
// ---------------------------------------------------------------------------
export const DEFRA_FACTORS = {
  // Fuel combustion (kg CO2e per litre)
  petrol_per_litre:        2.31,
  diesel_per_litre:        2.68,
  lpg_per_litre:           1.51,
  e10_petrol_per_litre:    2.19,
  biodiesel_per_litre:     0.17,
  // Natural gas
  natural_gas_per_kwh:     0.183,
  natural_gas_per_m3:      2.0,
  // Aviation (kg CO2e per passenger-km, including radiative forcing)
  domestic_flight_per_km:  0.255,
  short_haul_flight_per_km: 0.156,
  long_haul_flight_per_km: 0.102,
  business_class_multiplier: 2.6,
  first_class_multiplier:  4.0,
  // Ground transport (per km)
  bus_per_km:              0.089,
  train_per_km:            0.041,
  underground_per_km:      0.031,
  tram_per_km:             0.029,
  taxi_per_km:             0.22,
  car_petrol_per_km:       0.21,
  car_diesel_per_km:       0.17,
  car_hybrid_per_km:       0.12,
  car_ev_per_km:           0.05,
  motorcycle_per_km:       0.11,
  ebike_per_km:            0.005,
  bicycle_per_km:          0.0,
  walking_per_km:          0.0,
  // Sea
  ferry_per_km:            0.19,
  cruise_per_km:           0.25,
};

// ---------------------------------------------------------------------------
// 3. FOOD CARBON FACTORS (kg CO2e per kg unless noted)
// ---------------------------------------------------------------------------
export const FOOD_CARBON_FACTORS = {
  // ── Protein (per kg) ──
  beef:              27.0,
  lamb:              24.0,
  pork:               7.6,
  chicken:            6.9,
  turkey:             5.5,
  duck:               6.4,
  venison:            5.0,
  salmon_farmed:      5.1,
  salmon_wild:        3.2,
  tuna:               6.1,
  shrimp:            12.0,
  cod:                3.5,
  sardines:           1.8,
  mackerel:           1.7,
  trout:              3.8,
  mussels:            0.6,
  crab:               5.5,
  lobster:            7.0,
  tofu:               2.0,
  tempeh:             1.6,
  seitan:             1.4,
  lentils:            0.9,
  chickpeas:          0.7,
  beans:              0.8,
  black_beans:        0.7,
  kidney_beans:       0.9,
  peas:               0.4,
  nuts_mixed:         2.3,
  almonds:            2.5,
  cashews:            3.4,
  peanuts:            1.2,
  eggs_per_dozen:     4.5,
  beyond_burger:      1.9,
  impossible_burger:  2.0,

  // ── Dairy (per kg / litre) ──
  milk_cow:           3.15,
  milk_oat:           0.9,
  milk_soy:           1.0,
  milk_almond:        0.7,
  milk_coconut:       0.8,
  milk_rice:          1.2,
  cheese_hard:       13.5,
  cheese_soft:        8.5,
  cheese_cream:       7.0,
  butter:            11.5,
  ghee:              12.8,
  yogurt:             2.5,
  cream:              5.5,
  ice_cream:          4.5,

  // ── Grains (per kg) ──
  rice_white:         2.7,
  rice_brown:         2.5,
  rice_basmati:       2.9,
  wheat_bread:        0.8,
  sourdough:          0.7,
  pasta:              1.3,
  pasta_wholegrain:   1.1,
  oats:               1.0,
  corn:               1.1,
  quinoa:             1.4,
  couscous:           1.0,
  flour_wheat:        0.8,
  flour_rice:         1.3,

  // ── Vegetables (per kg) ──
  potatoes:           0.3,
  sweet_potatoes:     0.4,
  tomatoes_local:     0.7,
  tomatoes_greenhouse: 3.5,
  tomatoes_canned:    1.0,
  lettuce:            0.4,
  spinach:            0.5,
  kale:               0.4,
  broccoli:           0.5,
  cauliflower:        0.5,
  carrots:            0.3,
  onions:             0.2,
  garlic:             0.3,
  peppers:            0.8,
  mushrooms:          0.6,
  zucchini:           0.5,
  eggplant:           0.6,
  cabbage:            0.2,
  asparagus_local:    0.5,
  asparagus_airfreight: 8.9,
  green_beans:        0.6,
  pumpkin:            0.3,
  beetroot:           0.3,
  celery:             0.3,
  cucumber:           0.5,
  corn_fresh:         0.7,
  avocado:            2.5,

  // ── Fruits (per kg) ──
  bananas:            0.7,
  apples:             0.4,
  oranges:            0.5,
  lemons:             0.4,
  strawberries_local: 0.5,
  strawberries_greenhouse: 3.0,
  berries_airfreight: 7.8,
  blueberries_local:  0.6,
  raspberries_local:  0.5,
  mango:              1.5,
  mango_airfreight:   9.1,
  pineapple:          0.9,
  grapes:             0.8,
  watermelon:         0.3,
  kiwi:               0.5,
  peaches:            0.6,
  pears:              0.4,
  cherries:           0.7,
  dates:              1.0,
  coconut:            0.6,
  dried_fruit_mixed:  1.8,

  // ── Beverages (per unit) ──
  coffee_per_cup:     0.21,
  coffee_oat_latte:   0.35,
  coffee_cow_latte:   0.55,
  tea_per_cup:        0.05,
  beer_per_pint:      0.5,
  beer_per_bottle:    0.35,
  wine_per_glass:     0.4,
  wine_per_bottle:    1.2,
  spirits_per_shot:   0.25,
  oj_per_litre:       1.5,
  soft_drink_per_can: 0.25,
  sparkling_water_per_litre: 0.15,
  bottled_water:      0.16,
  smoothie_per_cup:   0.6,
  kombucha_per_bottle: 0.3,

  // ── Treats / snacks ──
  chocolate_dark_per_100g: 1.9,
  chocolate_milk_per_100g: 2.8,
  chocolate_white_per_100g: 2.5,
  ice_cream_per_scoop: 0.5,
  chips_per_100g:     0.4,
  popcorn_per_100g:   0.3,
  biscuits_per_100g:  0.5,
  cake_per_slice:     0.8,
  candy_per_100g:     0.4,
  granola_bar:        0.3,

  // ── Prepared food (per serving) ──
  pizza_per_serving:  1.5,
  pizza_margherita:   1.2,
  pizza_pepperoni:    2.0,
  burger_beef:        3.5,
  burger_chicken:     1.8,
  burger_plant:       0.9,
  salad_per_serving:  0.5,
  sushi_per_serving:  1.2,
  curry_chicken:      2.2,
  curry_lentil:       0.8,
  pasta_bolognese:    2.5,
  pasta_marinara:     0.9,
  sandwich_ham:       1.4,
  sandwich_cheese:    1.1,
  wrap_chicken:       1.5,
  soup_vegetable:     0.4,
  soup_chicken:       0.9,
  stir_fry_veg:       0.6,
  stir_fry_beef:      3.2,
  burrito_bean:       1.0,
  burrito_beef:       3.0,
  fish_and_chips:     2.2,
  ramen:              1.8,
  pad_thai:           1.5,
  naan_bread:         0.6,
  hummus_per_100g:    0.4,

  // ── Condiments / staples (per kg) ──
  olive_oil:          3.5,
  sunflower_oil:      2.1,
  coconut_oil:        2.8,
  sugar:              0.6,
  honey:              1.2,
  maple_syrup:        1.0,
  soy_sauce:          0.8,
  ketchup:            0.7,
  mayonnaise:         1.5,
  mustard:            0.5,
  salt:               0.1,
  pepper:             0.8,
};

// ---------------------------------------------------------------------------
// 4. FASHION CARBON FACTORS (per item, kg CO2e)
// ---------------------------------------------------------------------------
export const FASHION_CARBON_FACTORS = {
  cotton_tshirt:         6.5,
  organic_cotton_tshirt: 5.0,
  polyester_tshirt:      5.5,
  linen_tshirt:          4.0,
  bamboo_tshirt:         4.5,
  jeans:                33.4,
  jeans_organic:        25.0,
  chinos:               15.0,
  shorts:                8.0,
  dress_fast_fashion:   16.0,
  dress_quality:        20.0,
  dress_secondhand:      1.0,
  skirt:                12.0,
  blouse:               10.0,
  sweater_wool:         25.0,
  sweater_acrylic:      18.0,
  hoodie:               15.0,
  suit_mens:            45.0,
  suit_womens:          40.0,
  sneakers:             13.6,
  leather_shoes:        17.0,
  running_shoes:        14.0,
  sandals:               5.0,
  flip_flops:            3.5,
  boots:                20.0,
  jacket_synthetic:     25.0,
  jacket_down:          30.0,
  jacket_secondhand:     1.0,
  raincoat:             18.0,
  winter_coat:          35.0,
  underwear_set:         3.0,
  socks_pair:            1.5,
  tights_pair:           2.0,
  hat:                   4.0,
  scarf:                 5.0,
  gloves:                3.0,
  belt:                  5.5,
  handbag_leather:      20.0,
  handbag_synthetic:    10.0,
  backpack:             12.0,
  sunglasses:            3.0,
  watch:                 8.0,
  secondhand_any:        0.5,
};

// ---------------------------------------------------------------------------
// 5. ELECTRONICS CARBON FACTORS (per device, kg CO2e)
// ---------------------------------------------------------------------------
export const ELECTRONICS_CARBON_FACTORS = {
  smartphone_new:        70,
  smartphone_refurbished: 7,
  laptop_new:           350,
  laptop_refurbished:    35,
  tablet_new:           120,
  tablet_refurbished:    12,
  tv_55:                600,
  tv_32:                250,
  tv_75:                900,
  gaming_console:        85,
  gaming_pc:            700,
  smart_speaker:         25,
  earbuds:                8,
  headphones:            12,
  headphones_premium:    18,
  smartwatch:            30,
  fitness_tracker:       15,
  router:                20,
  mesh_system:           35,
  external_hdd:          15,
  external_ssd:          10,
  usb_drive:              2,
  desktop_pc:           500,
  monitor_24:           150,
  monitor_27:           200,
  monitor_32:           280,
  webcam:                 5,
  keyboard:               6,
  mouse:                  3,
  printer:               50,
  camera_dslr:           80,
  camera_mirrorless:     60,
  drone:                 40,
  ereader:               15,
  projector:             90,
  vr_headset:            45,
};

// ---------------------------------------------------------------------------
// 6. HOME & APPLIANCE FACTORS (kg CO2e)
// ---------------------------------------------------------------------------
export const HOME_CARBON_FACTORS = {
  // Laundry
  washing_machine_load_warm:  0.6,
  washing_machine_load_cold:  0.2,
  washing_machine_load_hot:   1.1,
  dryer_load:                 2.4,
  dryer_load_low:             1.5,
  ironing_per_hour:           0.3,
  // Kitchen
  dishwasher_load:            0.7,
  dishwasher_eco:             0.45,
  oven_per_hour:              1.6,
  microwave_per_use:          0.09,
  stovetop_gas_per_hour:      0.9,
  stovetop_electric_per_hour: 0.5,
  induction_per_hour:         0.35,
  kettle_per_boil:            0.07,
  toaster_per_use:            0.04,
  coffee_machine_per_cup:     0.05,
  // Water
  shower_per_minute:          0.19,
  shower_per_minute_cold:     0.0,
  bath:                       2.5,
  hand_wash_per_use:          0.02,
  // Lighting (lifetime kg CO2e including manufacture)
  led_bulb_lifetime:          2.5,
  cfl_bulb_lifetime:          5.0,
  incandescent_lifetime:     25.0,
  halogen_lifetime:          15.0,
  // Annual appliance use
  fridge_per_year:          150,
  freezer_per_year:         175,
  fridge_freezer_per_year:  200,
  air_con_per_year:         400,
  dehumidifier_per_year:     80,
  fan_per_year:              15,
  // Heating
  heating_per_degree_day:     0.5,
  electric_heater_per_hour:   1.5,
  heat_pump_per_hour:         0.4,
  // Home office
  laptop_per_day_use:         0.06,
  desktop_per_day_use:        0.18,
  monitor_per_day_use:        0.05,
  router_per_day:             0.02,
  // Streaming / digital
  streaming_per_hour:         0.036,
  video_call_per_hour:        0.05,
  cloud_storage_per_gb_yr:    0.006,
  email_per_message:          0.004,
  email_with_attachment:      0.05,
  google_search:              0.0003,
};

// ---------------------------------------------------------------------------
// 7. CARBON EQUIVALENCE ENGINE
// ---------------------------------------------------------------------------
/**
 * Convert a carbon value (kg CO2e) into relatable real-world equivalences.
 * @param {number} kg_co2 - kilograms of CO2 equivalent
 * @returns {Object} dictionary of equivalence metrics
 */
export function carbonEquivalent(kg_co2) {
  if (typeof kg_co2 !== 'number' || kg_co2 < 0) return null;
  return {
    km_driving:            Math.round(kg_co2 / 0.21),
    flights_london_paris:  (kg_co2 / 55).toFixed(2),
    trees_to_offset_1yr:   (kg_co2 / 22).toFixed(1),
    smartphone_charges:    Math.round(kg_co2 / 0.008),
    cups_of_tea:           Math.round(kg_co2 / 0.05),
    streaming_hours:       Math.round(kg_co2 / 0.036),
    days_of_avg_person:    (kg_co2 / 12.9).toFixed(1),
    beef_burgers:          (kg_co2 / 3.5).toFixed(1),
    hot_showers:           Math.round(kg_co2 / 1.5),
    lattes:                Math.round(kg_co2 / 0.55),
    led_bulb_years:        (kg_co2 / 2.5).toFixed(1),
    loads_of_laundry:      Math.round(kg_co2 / 0.6),
    google_searches:       Math.round(kg_co2 / 0.0003),
    netflix_hours:         Math.round(kg_co2 / 0.036),
    bananas:               Math.round(kg_co2 / 0.08),
  };
}

// ---------------------------------------------------------------------------
// 8. CARBON BUDGET CALCULATOR
// ---------------------------------------------------------------------------
/**
 * Return per-capita carbon budget for a given warming scenario.
 * @param {'1.5'|'2.0'|'global_avg'|'us_avg'|'india_avg'} scenario
 * @returns {{ annual_t: number, daily_kg: number, monthly_kg: number, weekly_kg: number, label: string }}
 */
export function carbonBudget(scenario = '1.5') {
  const budgets = {
    '1.5':       { annual_t: 2.3,  daily_kg: 6.3,   monthly_kg: 192,  weekly_kg: 44,  label: '1.5C Paris-aligned budget' },
    '2.0':       { annual_t: 4.0,  daily_kg: 11.0,  monthly_kg: 333,  weekly_kg: 77,  label: '2.0C budget' },
    'global_avg':{ annual_t: 4.7,  daily_kg: 12.9,  monthly_kg: 392,  weekly_kg: 90,  label: 'Global average (current)' },
    'us_avg':    { annual_t: 14.7, daily_kg: 40.3,  monthly_kg: 1225, weekly_kg: 283, label: 'US average (current)' },
    'india_avg': { annual_t: 1.9,  daily_kg: 5.2,   monthly_kg: 158,  weekly_kg: 37,  label: 'India average (current)' },
    'eu_avg':    { annual_t: 6.8,  daily_kg: 18.6,  monthly_kg: 567,  weekly_kg: 131, label: 'EU average (current)' },
  };
  return budgets[scenario] || budgets['1.5'];
}

/**
 * Get all available budget scenarios.
 * @returns {string[]}
 */
export function getAvailableBudgetScenarios() {
  return ['1.5', '2.0', 'global_avg', 'us_avg', 'india_avg', 'eu_avg'];
}

// ---------------------------------------------------------------------------
// 9. RECEIPT KEYWORD MATCHER (NLP-lite)
// ---------------------------------------------------------------------------
const _keywordCache = new Map();

function _buildKeywordIndex() {
  if (_keywordCache.size > 0) return;
  const sources = [
    { db: FOOD_CARBON_FACTORS,        category: 'Food' },
    { db: FASHION_CARBON_FACTORS,     category: 'Fashion' },
    { db: ELECTRONICS_CARBON_FACTORS, category: 'Electronics' },
    { db: HOME_CARBON_FACTORS,        category: 'Home' },
  ];
  for (const { db, category } of sources) {
    for (const [key, val] of Object.entries(db)) {
      const readable = key.replace(/_/g, ' ').replace(/per (kg|litre|dozen|cup|pint|bottle|glass|shot|serving|100g|scoop|slice|hour|minute|use|boil|load|year|day|message)$/i, '').trim();
      if (readable.length >= 3) {
        _keywordCache.set(readable, { key, carbon: val, category });
      }
    }
  }
}

/**
 * Match a receipt line or product description to a carbon factor.
 * @param {string} text - receipt line / product name
 * @returns {{ match: string, carbon: number, category: string, confidence: number } | null}
 */
export function matchReceiptKeyword(text) {
  if (!text || typeof text !== 'string') return null;
  _buildKeywordIndex();

  const lower = text.toLowerCase().trim();
  let bestMatch = null;
  let bestLen = 0;

  for (const [keyword, data] of _keywordCache) {
    if (lower.includes(keyword) && keyword.length > bestLen) {
      bestMatch = { match: data.key, carbon: data.carbon, category: data.category, confidence: 0.8 };
      bestLen = keyword.length;
    }
  }

  // Boost confidence for exact word-boundary matches
  if (bestMatch && bestLen > 0) {
    const kw = Array.from(_keywordCache.keys()).find(k => k.length === bestLen && lower.includes(k));
    if (kw) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (regex.test(lower)) {
        bestMatch.confidence = 0.92;
      }
    }
  }

  return bestMatch;
}

/**
 * Batch-match an array of receipt lines.
 * @param {string[]} lines
 * @returns {{ line: string, result: object|null }[]}
 */
export function matchReceiptBatch(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map(line => ({ line, result: matchReceiptKeyword(line) }));
}

// ---------------------------------------------------------------------------
// 10. SPENDING CATEGORY -> CARBON MAPPING (MCC groups)
// ---------------------------------------------------------------------------
export const SPENDING_CATEGORIES = {
  groceries:          { carbon_per_usd: 0.75,  mcc_range: '5411-5499', icon: 'cart' },
  restaurants:        { carbon_per_usd: 0.68,  mcc_range: '5812-5814', icon: 'utensils' },
  fast_food:          { carbon_per_usd: 0.85,  mcc_range: '5814',      icon: 'burger' },
  fuel:               { carbon_per_usd: 2.31,  mcc_range: '5541-5542', icon: 'fuel' },
  public_transport:   { carbon_per_usd: 0.25,  mcc_range: '4111-4131', icon: 'train' },
  ride_share:         { carbon_per_usd: 0.45,  mcc_range: '4121',      icon: 'car' },
  airlines:           { carbon_per_usd: 1.85,  mcc_range: '3000-3350', icon: 'plane' },
  hotels:             { carbon_per_usd: 0.55,  mcc_range: '3501-3999', icon: 'hotel' },
  electricity:        { carbon_per_usd: 1.42,  mcc_range: '4900',      icon: 'bolt' },
  gas_utility:        { carbon_per_usd: 1.80,  mcc_range: '4900',      icon: 'flame' },
  clothing:           { carbon_per_usd: 0.45,  mcc_range: '5611-5699', icon: 'shirt' },
  fast_fashion:       { carbon_per_usd: 0.65,  mcc_range: '5691',      icon: 'shirt' },
  electronics:        { carbon_per_usd: 0.35,  mcc_range: '5732-5735', icon: 'device' },
  home_improvement:   { carbon_per_usd: 0.55,  mcc_range: '5200-5261', icon: 'home' },
  furniture:          { carbon_per_usd: 0.60,  mcc_range: '5712-5714', icon: 'sofa' },
  healthcare:         { carbon_per_usd: 0.22,  mcc_range: '8011-8099', icon: 'health' },
  pharmacy:           { carbon_per_usd: 0.18,  mcc_range: '5912',      icon: 'pill' },
  entertainment:      { carbon_per_usd: 0.15,  mcc_range: '7832-7841', icon: 'film' },
  subscriptions:      { carbon_per_usd: 0.08,  mcc_range: '4899',      icon: 'tv' },
  gym:                { carbon_per_usd: 0.12,  mcc_range: '7941',      icon: 'dumbbell' },
  pet_supplies:       { carbon_per_usd: 0.50,  mcc_range: '5995',      icon: 'paw' },
  books:              { carbon_per_usd: 0.10,  mcc_range: '5942',      icon: 'book' },
  office_supplies:    { carbon_per_usd: 0.20,  mcc_range: '5943',      icon: 'paperclip' },
  insurance:          { carbon_per_usd: 0.05,  mcc_range: '6300',      icon: 'shield' },
};

/**
 * Estimate carbon from a spending transaction.
 * @param {string} category - key from SPENDING_CATEGORIES
 * @param {number} amount_usd
 * @returns {{ carbon_kg: number, category: string } | null}
 */
export function estimateCarbonFromSpending(category, amount_usd) {
  const cat = SPENDING_CATEGORIES[category];
  if (!cat || typeof amount_usd !== 'number') return null;
  return { carbon_kg: +(cat.carbon_per_usd * amount_usd).toFixed(2), category };
}

// ---------------------------------------------------------------------------
// 11. TRANSITION RECOMMENDATIONS
// ---------------------------------------------------------------------------
export const TRANSITION_PATHS = [
  // Food
  { id: 'beef-to-chicken',    from: 'Beef 2x/week',           to: 'Chicken 2x/week',                save_kg_yr: 1050, save_usd_yr: 200,  difficulty: 'Easy',      category: 'Food' },
  { id: 'beef-to-plant',      from: 'Beef 2x/week',           to: 'Plant-based 2x/week',            save_kg_yr: 1310, save_usd_yr: 350,  difficulty: 'Medium',    category: 'Food' },
  { id: 'cow-to-oat',         from: 'Cow milk daily',          to: 'Oat milk daily',                 save_kg_yr: 822,  save_usd_yr: -120, difficulty: 'Easy',      category: 'Food' },
  { id: 'cheese-reduction',   from: 'Hard cheese 5x/week',    to: 'Hard cheese 2x/week',            save_kg_yr: 350,  save_usd_yr: 150,  difficulty: 'Easy',      category: 'Food' },
  { id: 'food-waste-halve',   from: '30% food waste',          to: '15% food waste',                 save_kg_yr: 200,  save_usd_yr: 500,  difficulty: 'Medium',    category: 'Food' },
  { id: 'local-seasonal',     from: 'Imported produce year-round', to: 'Local seasonal where possible', save_kg_yr: 180,  save_usd_yr: 100,  difficulty: 'Medium', category: 'Food' },
  { id: 'bottled-to-tap',     from: 'Bottled water daily',     to: 'Filtered tap water',             save_kg_yr: 58,   save_usd_yr: 400,  difficulty: 'Very Easy', category: 'Food' },
  // Transport
  { id: 'drive-to-train',     from: 'Drive 20km/day',          to: 'Train 20km/day',                 save_kg_yr: 835,  save_usd_yr: 1500, difficulty: 'Medium',    category: 'Transport' },
  { id: 'drive-to-ebike',     from: 'Drive 10km/day',          to: 'E-bike 10km/day',                save_kg_yr: 750,  save_usd_yr: 2200, difficulty: 'Medium',    category: 'Transport' },
  { id: 'petrol-to-ev',       from: 'Petrol car 15000km/yr',   to: 'EV 15000km/yr',                  save_kg_yr: 2400, save_usd_yr: 800,  difficulty: 'Hard',      category: 'Transport' },
  { id: 'petrol-to-hybrid',   from: 'Petrol car 15000km/yr',   to: 'Hybrid 15000km/yr',              save_kg_yr: 1350, save_usd_yr: 600,  difficulty: 'Medium',    category: 'Transport' },
  { id: 'flights-to-train',   from: '2 short flights/yr',      to: '2 train trips/yr',               save_kg_yr: 340,  save_usd_yr: -50,  difficulty: 'Medium',    category: 'Transport' },
  { id: 'carpool',            from: 'Solo commute 20km',       to: 'Carpool with 1 other',           save_kg_yr: 765,  save_usd_yr: 900,  difficulty: 'Easy',      category: 'Transport' },
  // Home
  { id: 'hot-to-cold-wash',   from: 'Hot wash weekly',         to: 'Cold wash',                      save_kg_yr: 21,   save_usd_yr: 40,   difficulty: 'Very Easy', category: 'Home' },
  { id: 'dryer-to-line',      from: 'Tumble dryer',            to: 'Line dry',                       save_kg_yr: 125,  save_usd_yr: 60,   difficulty: 'Easy',      category: 'Home' },
  { id: 'shorter-shower',     from: '8 min hot shower',        to: '4 min shower',                   save_kg_yr: 274,  save_usd_yr: 35,   difficulty: 'Medium',    category: 'Home' },
  { id: 'led-switch',         from: 'Halogen bulbs (10)',      to: 'LED bulbs (10)',                  save_kg_yr: 125,  save_usd_yr: 50,   difficulty: 'Very Easy', category: 'Home' },
  { id: 'thermostat-down',    from: 'Heating at 22C',          to: 'Heating at 20C',                 save_kg_yr: 350,  save_usd_yr: 120,  difficulty: 'Easy',      category: 'Home' },
  { id: 'smart-thermostat',   from: 'Manual thermostat',       to: 'Smart thermostat',               save_kg_yr: 250,  save_usd_yr: 100,  difficulty: 'Easy',      category: 'Home' },
  { id: 'green-energy',       from: 'Standard grid tariff',    to: '100% renewable tariff',          save_kg_yr: 1200, save_usd_yr: -100, difficulty: 'Very Easy', category: 'Home' },
  // Fashion / Consumer
  { id: 'fast-to-quality',    from: 'Fast fashion 12/yr',      to: 'Quality 4/yr + secondhand',      save_kg_yr: 150,  save_usd_yr: 200,  difficulty: 'Easy',      category: 'Fashion' },
  { id: 'secondhand-first',   from: 'All new clothing',        to: '50% secondhand',                 save_kg_yr: 100,  save_usd_yr: 300,  difficulty: 'Easy',      category: 'Fashion' },
  // Electronics
  { id: 'refurb-phone',       from: 'New phone every 2yr',     to: 'Refurbished + 4yr',              save_kg_yr: 28,   save_usd_yr: 250,  difficulty: 'Easy',      category: 'Electronics' },
  { id: 'refurb-laptop',      from: 'New laptop every 3yr',    to: 'Refurbished + 6yr',              save_kg_yr: 53,   save_usd_yr: 300,  difficulty: 'Easy',      category: 'Electronics' },
  // Digital
  { id: 'email-cleanup',      from: '100 emails/day kept',     to: 'Unsubscribe + auto-delete',      save_kg_yr: 15,   save_usd_yr: 0,    difficulty: 'Very Easy', category: 'Digital' },
  { id: 'streaming-sd',       from: '4K streaming 4hr/day',    to: 'HD streaming 4hr/day',           save_kg_yr: 16,   save_usd_yr: 0,    difficulty: 'Very Easy', category: 'Digital' },
];

/**
 * Filter transitions by category.
 * @param {string} category
 * @returns {Array}
 */
export function getTransitionsByCategory(category) {
  return TRANSITION_PATHS.filter(t => t.category === category);
}

/**
 * Get top-N transitions ranked by savings.
 * @param {number} n
 * @returns {Array}
 */
export function getTopTransitions(n = 5) {
  return [...TRANSITION_PATHS].sort((a, b) => b.save_kg_yr - a.save_kg_yr).slice(0, n);
}

// ---------------------------------------------------------------------------
// 12. CARBON TIPS LIBRARY (50 tips)
// ---------------------------------------------------------------------------
export const CARBON_TIPS = [
  'Switching from beef to chicken saves ~20 kg CO2e per kg of meat.',
  'A refurbished smartphone produces 90% less carbon than a new one.',
  'Cold water washing saves 80% of the energy vs hot wash.',
  'Line-drying instead of tumble-drying saves 2.4 kg CO2e per load.',
  'One less short-haul return flight saves ~340 kg CO2e per year.',
  'Oat milk produces 70% less CO2 than cow milk per litre.',
  'A vegan diet saves roughly 1.5 tonnes CO2e per year vs average.',
  'Keeping your phone for 4 years instead of 2 halves its carbon footprint.',
  'LED bulbs use 80% less energy than incandescent bulbs.',
  'Lowering your thermostat by 2 degrees saves up to 350 kg CO2e per year.',
  'Cycling to work saves 0.21 kg CO2e per km compared to driving.',
  'Business class flights produce 2.6x the carbon of economy class.',
  'A new laptop generates 350 kg CO2e before you ever turn it on.',
  'Shrimp has a higher carbon footprint (12 kg/kg) than pork (7.6 kg/kg).',
  'The average Google search produces about 0.3 g of CO2.',
  'Cheese has 3-4x the carbon footprint of most plant proteins.',
  'Buying secondhand clothing saves 97% of its carbon footprint.',
  'An hour of video streaming produces about 36 g CO2e.',
  'Carpooling halves your commute carbon footprint instantly.',
  'Airfreight berries produce 15x the carbon of local seasonal berries.',
  'A smart thermostat can cut home heating emissions by 15-20%.',
  'Switching to a 100% renewable energy tariff can save 1.2 tonnes per year.',
  'Batch cooking once a week cuts oven energy by 30%.',
  'E-bikes produce 0.005 kg CO2e per km vs 0.21 for petrol cars.',
  'Tap water produces 300x less carbon than bottled water.',
  'Greenhouse tomatoes produce 5x the carbon of local seasonal ones.',
  'Each email with an attachment generates about 50 g CO2e.',
  'Hard cheese produces 13.5 kg CO2e per kg -- more than pork.',
  'Heat pumps use 75% less energy than electric resistance heaters.',
  'A single long-haul return flight can exceed many countries annual per-capita budget.',
  'Meal planning can reduce food waste by 50%, saving ~200 kg CO2e per year.',
  'Avocados produce 2.5 kg CO2e per kg -- moderate, but water-intensive.',
  'Dark chocolate has a lower carbon footprint than milk chocolate.',
  'Induction cooking is 30% more efficient than gas stovetops.',
  'Reusable bags need 50+ uses to beat single-use plastics on carbon.',
  'A dishwasher eco cycle uses less water and energy than hand-washing.',
  'Norway grid is 99% hydro at 0.008 kg/kWh, vs South Africa at 0.95 kg/kWh.',
  'Reducing shower time from 8 to 4 minutes saves 274 kg CO2e yearly.',
  'An electric vehicle saves ~2,400 kg CO2e per year vs petrol at 15,000 km.',
  'Fast fashion items are worn 7 times on average before being discarded.',
  'A wool sweater generates 25 kg CO2e but lasts 10+ years if cared for.',
  'Unsubscribing from junk mail can save 15 kg CO2e per year.',
  'Solar panels typically offset their manufacturing carbon in 2-3 years.',
  'A 55-inch TV generates 600 kg CO2e during manufacturing alone.',
  'Lentils produce 0.9 kg CO2e per kg vs 27.0 for beef -- a 30x difference.',
  'Using a pressure cooker cuts cooking energy by up to 70%.',
  'Buying local honey saves transport emissions and supports pollinators.',
  'The fashion industry accounts for ~10% of global carbon emissions.',
  'A gaming PC generates about 700 kg CO2e -- comparable to a return transatlantic flight.',
  'Composting food waste at home can avoid 100-200 kg CO2e of landfill methane per year.',
];

// ---------------------------------------------------------------------------
// 13. UTILITY HELPERS
// ---------------------------------------------------------------------------

/**
 * Look up grid carbon intensity for a country code.
 * @param {string} countryCode - ISO Alpha-2 (e.g. 'US', 'IN')
 * @returns {{ intensity: number, source: string, label: string } | null}
 */
export function getGridIntensity(countryCode) {
  return GRID_CARBON_INTENSITY[countryCode?.toUpperCase()] || null;
}

/**
 * Adjust EV per-km factor based on the user's country grid.
 * @param {string} countryCode
 * @returns {number} kg CO2e per km for EV in that grid
 */
export function evFactorForCountry(countryCode) {
  const grid = getGridIntensity(countryCode);
  if (!grid) return DEFRA_FACTORS.car_ev_per_km;
  // Average EV uses ~0.2 kWh/km
  return +(grid.intensity * 0.2).toFixed(4);
}

/**
 * Calculate the total carbon of a food basket.
 * @param {{ item: string, kg: number }[]} basket
 * @returns {{ total_kg_co2: number, breakdown: { item: string, kg_co2: number }[] }}
 */
export function calculateFoodBasketCarbon(basket) {
  if (!Array.isArray(basket)) return { total_kg_co2: 0, breakdown: [] };
  const breakdown = basket.map(({ item, kg }) => {
    const factor = FOOD_CARBON_FACTORS[item];
    return { item, kg_co2: factor ? +(factor * (kg || 1)).toFixed(2) : 0 };
  });
  return {
    total_kg_co2: +breakdown.reduce((s, b) => s + b.kg_co2, 0).toFixed(2),
    breakdown,
  };
}

/**
 * Calculate annual carbon for a set of flight legs.
 * @param {{ distance_km: number, class: 'economy'|'business'|'first', type: 'domestic'|'short_haul'|'long_haul' }[]} legs
 * @returns {{ total_kg_co2: number, leg_breakdown: number[] }}
 */
export function calculateFlightCarbon(legs) {
  if (!Array.isArray(legs)) return { total_kg_co2: 0, leg_breakdown: [] };
  const factorMap = {
    domestic: DEFRA_FACTORS.domestic_flight_per_km,
    short_haul: DEFRA_FACTORS.short_haul_flight_per_km,
    long_haul: DEFRA_FACTORS.long_haul_flight_per_km,
  };
  const classMap = {
    economy: 1,
    business: DEFRA_FACTORS.business_class_multiplier,
    first: DEFRA_FACTORS.first_class_multiplier,
  };
  const leg_breakdown = legs.map(l => {
    const base = factorMap[l.type] || DEFRA_FACTORS.short_haul_flight_per_km;
    const mult = classMap[l.class] || 1;
    return +((l.distance_km || 0) * base * mult).toFixed(1);
  });
  return {
    total_kg_co2: +leg_breakdown.reduce((s, v) => s + v, 0).toFixed(1),
    leg_breakdown,
  };
}

/**
 * Score a daily carbon figure against a budget scenario.
 * @param {number} daily_kg
 * @param {string} scenario
 * @returns {{ score: number, rating: string, vs_budget_pct: number }}
 */
export function scoreDailyCarbon(daily_kg, scenario = '1.5') {
  const budget = carbonBudget(scenario);
  const ratio = daily_kg / budget.daily_kg;
  const pct = +((ratio - 1) * 100).toFixed(0);
  let rating;
  if (ratio <= 0.5)      rating = 'Excellent';
  else if (ratio <= 0.8) rating = 'Good';
  else if (ratio <= 1.0) rating = 'On Track';
  else if (ratio <= 1.5) rating = 'Above Budget';
  else if (ratio <= 2.5) rating = 'High';
  else                    rating = 'Very High';
  return { score: +ratio.toFixed(2), rating, vs_budget_pct: pct };
}

// ---------------------------------------------------------------------------
// 14. MASTER EXPORT
// ---------------------------------------------------------------------------
export const ConsumerCarbonData = {
  // Databases
  GRID_CARBON_INTENSITY,
  DEFRA_FACTORS,
  FOOD_CARBON_FACTORS,
  FASHION_CARBON_FACTORS,
  ELECTRONICS_CARBON_FACTORS,
  HOME_CARBON_FACTORS,
  SPENDING_CATEGORIES,
  TRANSITION_PATHS,
  CARBON_TIPS,

  // Calculators
  carbonEquivalent,
  carbonBudget,
  getAvailableBudgetScenarios,
  calculateFoodBasketCarbon,
  calculateFlightCarbon,
  scoreDailyCarbon,

  // Matchers
  matchReceiptKeyword,
  matchReceiptBatch,

  // Lookup helpers
  getGridIntensity,
  evFactorForCountry,
  estimateCarbonFromSpending,

  // Transition helpers
  getTransitionsByCategory,
  getTopTransitions,
};

export default ConsumerCarbonData;
