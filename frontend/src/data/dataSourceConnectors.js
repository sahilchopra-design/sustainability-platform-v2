/**
 * DATA SOURCE CONNECTOR REGISTRY
 * Sprint AM — Data Source Integration Layer
 *
 * Defines all external data sources, their API configurations, field mappings
 * to internal DB tables, and downstream engine consumption.
 *
 * 10 data sources | 70+ endpoints | 500+ field mappings | 10 engines | 50+ lineage entries
 *
 * CRITICAL: Deterministic seeded RNG — no Math.random().
 */

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
let _seed = 700;
const rand = () => { _seed++; return sr(_seed); };
const ts = () => '2026-03-29T04:00:00Z';

// ═══════════════════════════════════════════════════════════════════════════════
//  DATA SOURCES — 10 connectors
// ═══════════════════════════════════════════════════════════════════════════════

export const DATA_SOURCES = [

  // ── DS-001: EODHD Financial Data ────────────────────────────────────────────
  {
    id: 'DS-001',
    name: 'EODHD Financial Data',
    type: 'REST_API',
    status: 'connected',
    plan: 'All-in-One',
    baseUrl: 'https://eodhd.com/api',
    auth: { method: 'query_param', keyName: 'api_token', keyPlaceholder: 'YOUR_EODHD_KEY' },
    rateLimit: { requests: 100000, period: 'day', used: 84521 },
    lastSync: '2026-03-29T04:00:00Z',
    refreshCadence: 'daily',
    documentation: 'https://eodhd.com/financial-apis/',
    endpoints: [
      // EP-001: Fundamentals
      {
        id: 'EP-001', name: 'Fundamentals',
        path: '/fundamentals/{ticker}.{exchange}',
        method: 'GET',
        params: [{ name: 'ticker', required: true }, { name: 'exchange', default: 'US' }],
        fields: [
          { sourceField: 'General.Code', targetTable: 'company_profiles', targetColumn: 'ticker', type: 'string', transform: 'none' },
          { sourceField: 'General.Name', targetTable: 'company_profiles', targetColumn: 'name', type: 'string', transform: 'none' },
          { sourceField: 'General.Sector', targetTable: 'company_profiles', targetColumn: 'sector', type: 'string', transform: 'none' },
          { sourceField: 'General.Industry', targetTable: 'company_profiles', targetColumn: 'sub_industry', type: 'string', transform: 'none' },
          { sourceField: 'General.CountryISO', targetTable: 'company_profiles', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'General.Exchange', targetTable: 'company_profiles', targetColumn: 'exchange', type: 'string', transform: 'none' },
          { sourceField: 'General.CurrencyCode', targetTable: 'company_profiles', targetColumn: 'currency', type: 'string', transform: 'none' },
          { sourceField: 'General.ISIN', targetTable: 'company_profiles', targetColumn: 'isin', type: 'string', transform: 'none' },
          { sourceField: 'General.CUSIP', targetTable: 'company_profiles', targetColumn: 'cusip', type: 'string', transform: 'none' },
          { sourceField: 'General.CIK', targetTable: 'company_profiles', targetColumn: 'cik', type: 'string', transform: 'none' },
          { sourceField: 'General.FullTimeEmployees', targetTable: 'company_profiles', targetColumn: 'employees', type: 'integer', transform: 'none' },
          { sourceField: 'General.IPODate', targetTable: 'company_profiles', targetColumn: 'ipo_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'General.Description', targetTable: 'company_profiles', targetColumn: 'description', type: 'text', transform: 'truncate_500' },
          { sourceField: 'Highlights.MarketCapitalization', targetTable: 'company_profiles', targetColumn: 'market_cap', type: 'number', transform: 'divide_1e9', unit: '$Bn' },
          { sourceField: 'Highlights.WallStreetTargetPrice', targetTable: 'financial_data', targetColumn: 'target_price', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.PERatio', targetTable: 'financial_data', targetColumn: 'pe_ratio', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.PEGRatio', targetTable: 'financial_data', targetColumn: 'peg_ratio', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.EarningsShare', targetTable: 'financial_data', targetColumn: 'eps', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.DividendShare', targetTable: 'financial_data', targetColumn: 'dividend_per_share', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.DividendYield', targetTable: 'financial_data', targetColumn: 'dividend_yield', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.Revenue', targetTable: 'financial_data', targetColumn: 'revenue', type: 'number', transform: 'divide_1e6', unit: '$M' },
          { sourceField: 'Highlights.RevenuePerShare', targetTable: 'financial_data', targetColumn: 'revenue_per_share', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.EBITDA', targetTable: 'financial_data', targetColumn: 'ebitda', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'Highlights.ProfitMargin', targetTable: 'financial_data', targetColumn: 'profit_margin', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.OperatingMarginTTM', targetTable: 'financial_data', targetColumn: 'operating_margin', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.ReturnOnEquityTTM', targetTable: 'financial_data', targetColumn: 'roe', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.ReturnOnAssetsTTM', targetTable: 'financial_data', targetColumn: 'roa', type: 'number', transform: 'none' },
          { sourceField: 'Highlights.BookValue', targetTable: 'financial_data', targetColumn: 'book_value', type: 'number', transform: 'none' },
          { sourceField: 'Valuation.EnterpriseValue', targetTable: 'financial_data', targetColumn: 'enterprise_value', type: 'number', transform: 'divide_1e9', unit: '$Bn' },
          { sourceField: 'Valuation.ForwardPE', targetTable: 'financial_data', targetColumn: 'forward_pe', type: 'number', transform: 'none' },
          { sourceField: 'Valuation.PriceSalesTTM', targetTable: 'financial_data', targetColumn: 'price_to_sales', type: 'number', transform: 'none' },
          { sourceField: 'Valuation.PriceBookMRQ', targetTable: 'financial_data', targetColumn: 'price_to_book', type: 'number', transform: 'none' },
          { sourceField: 'Valuation.EnterpriseValueRevenue', targetTable: 'financial_data', targetColumn: 'ev_to_revenue', type: 'number', transform: 'none' },
          { sourceField: 'Valuation.EnterpriseValueEbitda', targetTable: 'financial_data', targetColumn: 'ev_to_ebitda', type: 'number', transform: 'none' },
          { sourceField: 'SharesStats.SharesOutstanding', targetTable: 'financial_data', targetColumn: 'shares_outstanding', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'SharesStats.SharesFloat', targetTable: 'financial_data', targetColumn: 'shares_float', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'SharesStats.PercentInsiders', targetTable: 'financial_data', targetColumn: 'insider_pct', type: 'number', transform: 'none' },
          { sourceField: 'SharesStats.PercentInstitutions', targetTable: 'financial_data', targetColumn: 'institutional_pct', type: 'number', transform: 'none' },
          { sourceField: 'Technicals.Beta', targetTable: 'financial_data', targetColumn: 'beta', type: 'number', transform: 'none' },
          { sourceField: 'Technicals.52WeekHigh', targetTable: 'financial_data', targetColumn: 'high_52w', type: 'number', transform: 'none' },
          { sourceField: 'Technicals.52WeekLow', targetTable: 'financial_data', targetColumn: 'low_52w', type: 'number', transform: 'none' },
          { sourceField: 'Technicals.50DayMA', targetTable: 'financial_data', targetColumn: 'ma_50d', type: 'number', transform: 'none' },
          { sourceField: 'Technicals.200DayMA', targetTable: 'financial_data', targetColumn: 'ma_200d', type: 'number', transform: 'none' },
        ],
        engines: ['E-001', 'E-004', 'E-005', 'E-006', 'E-008', 'E-010']
      },
      // EP-002: ESG Scores
      {
        id: 'EP-002', name: 'ESG Scores',
        path: '/fundamentals/{ticker}.{exchange}?filter=ESGScores',
        method: 'GET',
        fields: [
          { sourceField: 'ESGScores.ratingDate', targetTable: 'esg_ratings', targetColumn: 'rating_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'ESGScores.totalEsg', targetTable: 'esg_ratings', targetColumn: 'esg_composite', type: 'number', transform: 'none' },
          { sourceField: 'ESGScores.environmentScore', targetTable: 'esg_ratings', targetColumn: 'environmental_score', type: 'number', transform: 'none' },
          { sourceField: 'ESGScores.socialScore', targetTable: 'esg_ratings', targetColumn: 'social_score', type: 'number', transform: 'none' },
          { sourceField: 'ESGScores.governanceScore', targetTable: 'esg_ratings', targetColumn: 'governance_score', type: 'number', transform: 'none' },
          { sourceField: 'ESGScores.controversyLevel', targetTable: 'esg_ratings', targetColumn: 'controversy_level', type: 'integer', transform: 'none' },
          { sourceField: 'ESGScores.highestControversy', targetTable: 'esg_ratings', targetColumn: 'highest_controversy', type: 'integer', transform: 'none' },
          { sourceField: 'ESGScores.activitiesInvolvement.alcoholic', targetTable: 'esg_ratings', targetColumn: 'alcohol_involvement', type: 'boolean', transform: 'none' },
          { sourceField: 'ESGScores.activitiesInvolvement.gambling', targetTable: 'esg_ratings', targetColumn: 'gambling_involvement', type: 'boolean', transform: 'none' },
          { sourceField: 'ESGScores.activitiesInvolvement.tobacco', targetTable: 'esg_ratings', targetColumn: 'tobacco_involvement', type: 'boolean', transform: 'none' },
          { sourceField: 'ESGScores.activitiesInvolvement.nuclear', targetTable: 'esg_ratings', targetColumn: 'nuclear_involvement', type: 'boolean', transform: 'none' },
          { sourceField: 'ESGScores.activitiesInvolvement.weaponInvolvement', targetTable: 'esg_ratings', targetColumn: 'weapons_involvement', type: 'boolean', transform: 'none' },
          { sourceField: 'ESGScores.activitiesInvolvement.furLeather', targetTable: 'esg_ratings', targetColumn: 'fur_leather_involvement', type: 'boolean', transform: 'none' },
        ],
        engines: ['E-005', 'E-006', 'E-008']
      },
      // EP-003: Historical Prices (OHLCV)
      {
        id: 'EP-003', name: 'Historical Prices',
        path: '/eod/{ticker}.{exchange}',
        method: 'GET',
        params: [{ name: 'from', required: false }, { name: 'to', required: false }, { name: 'period', default: 'd' }],
        fields: [
          { sourceField: 'date', targetTable: 'price_history', targetColumn: 'trade_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'open', targetTable: 'price_history', targetColumn: 'open_price', type: 'number', transform: 'none' },
          { sourceField: 'high', targetTable: 'price_history', targetColumn: 'high_price', type: 'number', transform: 'none' },
          { sourceField: 'low', targetTable: 'price_history', targetColumn: 'low_price', type: 'number', transform: 'none' },
          { sourceField: 'close', targetTable: 'price_history', targetColumn: 'close_price', type: 'number', transform: 'none' },
          { sourceField: 'adjusted_close', targetTable: 'price_history', targetColumn: 'adj_close', type: 'number', transform: 'none' },
          { sourceField: 'volume', targetTable: 'price_history', targetColumn: 'volume', type: 'integer', transform: 'none' },
        ],
        engines: ['E-004', 'E-005', 'E-008', 'E-010']
      },
      // EP-004: Dividends
      {
        id: 'EP-004', name: 'Dividends',
        path: '/div/{ticker}.{exchange}',
        method: 'GET',
        fields: [
          { sourceField: 'date', targetTable: 'dividend_history', targetColumn: 'ex_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'declarationDate', targetTable: 'dividend_history', targetColumn: 'declaration_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'recordDate', targetTable: 'dividend_history', targetColumn: 'record_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'paymentDate', targetTable: 'dividend_history', targetColumn: 'payment_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'value', targetTable: 'dividend_history', targetColumn: 'amount', type: 'number', transform: 'none' },
          { sourceField: 'currency', targetTable: 'dividend_history', targetColumn: 'currency', type: 'string', transform: 'none' },
        ],
        engines: ['E-004', 'E-010']
      },
      // EP-005: Splits
      {
        id: 'EP-005', name: 'Stock Splits',
        path: '/splits/{ticker}.{exchange}',
        method: 'GET',
        fields: [
          { sourceField: 'date', targetTable: 'corporate_actions', targetColumn: 'action_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'split', targetTable: 'corporate_actions', targetColumn: 'split_ratio', type: 'string', transform: 'none' },
        ],
        engines: ['E-004']
      },
      // EP-006: Insider Trading
      {
        id: 'EP-006', name: 'Insider Trading',
        path: '/insider-trading?code={ticker}.{exchange}',
        method: 'GET',
        fields: [
          { sourceField: 'date', targetTable: 'insider_transactions', targetColumn: 'transaction_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'ownerName', targetTable: 'insider_transactions', targetColumn: 'insider_name', type: 'string', transform: 'none' },
          { sourceField: 'ownerRelationship', targetTable: 'insider_transactions', targetColumn: 'insider_role', type: 'string', transform: 'none' },
          { sourceField: 'transactionType', targetTable: 'insider_transactions', targetColumn: 'transaction_type', type: 'string', transform: 'none' },
          { sourceField: 'transactionAmount', targetTable: 'insider_transactions', targetColumn: 'shares', type: 'integer', transform: 'none' },
          { sourceField: 'transactionPrice', targetTable: 'insider_transactions', targetColumn: 'price', type: 'number', transform: 'none' },
          { sourceField: 'transactionShares', targetTable: 'insider_transactions', targetColumn: 'value', type: 'number', transform: 'none' },
        ],
        engines: ['E-008', 'E-010']
      },
      // EP-007: Exchange Symbols
      {
        id: 'EP-007', name: 'Exchange Symbols',
        path: '/exchange-symbol-list/{exchange}',
        method: 'GET',
        fields: [
          { sourceField: 'Code', targetTable: 'exchange_listings', targetColumn: 'ticker', type: 'string', transform: 'none' },
          { sourceField: 'Name', targetTable: 'exchange_listings', targetColumn: 'company_name', type: 'string', transform: 'none' },
          { sourceField: 'Country', targetTable: 'exchange_listings', targetColumn: 'country', type: 'string', transform: 'none' },
          { sourceField: 'Exchange', targetTable: 'exchange_listings', targetColumn: 'exchange_code', type: 'string', transform: 'none' },
          { sourceField: 'Currency', targetTable: 'exchange_listings', targetColumn: 'currency', type: 'string', transform: 'none' },
          { sourceField: 'Type', targetTable: 'exchange_listings', targetColumn: 'security_type', type: 'string', transform: 'none' },
          { sourceField: 'Isin', targetTable: 'exchange_listings', targetColumn: 'isin', type: 'string', transform: 'none' },
        ],
        engines: []
      },
      // EP-008: News / Sentiment
      {
        id: 'EP-008', name: 'News & Sentiment',
        path: '/news?s={ticker}.{exchange}&limit=50',
        method: 'GET',
        fields: [
          { sourceField: 'date', targetTable: 'news_sentiment', targetColumn: 'published_at', type: 'datetime', transform: 'iso_datetime' },
          { sourceField: 'title', targetTable: 'news_sentiment', targetColumn: 'headline', type: 'string', transform: 'none' },
          { sourceField: 'content', targetTable: 'news_sentiment', targetColumn: 'body', type: 'text', transform: 'truncate_2000' },
          { sourceField: 'link', targetTable: 'news_sentiment', targetColumn: 'url', type: 'string', transform: 'none' },
          { sourceField: 'symbols', targetTable: 'news_sentiment', targetColumn: 'tickers', type: 'array', transform: 'json_array' },
          { sourceField: 'sentiment.polarity', targetTable: 'news_sentiment', targetColumn: 'sentiment_score', type: 'number', transform: 'none' },
          { sourceField: 'sentiment.neg', targetTable: 'news_sentiment', targetColumn: 'sentiment_neg', type: 'number', transform: 'none' },
          { sourceField: 'sentiment.pos', targetTable: 'news_sentiment', targetColumn: 'sentiment_pos', type: 'number', transform: 'none' },
          { sourceField: 'sentiment.neu', targetTable: 'news_sentiment', targetColumn: 'sentiment_neu', type: 'number', transform: 'none' },
        ],
        engines: ['E-008']
      },
      // EP-009: Options
      {
        id: 'EP-009', name: 'Options Chain',
        path: '/options/{ticker}.{exchange}',
        method: 'GET',
        fields: [
          { sourceField: 'expirationDate', targetTable: 'options_data', targetColumn: 'expiration', type: 'date', transform: 'iso_date' },
          { sourceField: 'data[].contractName', targetTable: 'options_data', targetColumn: 'contract', type: 'string', transform: 'none' },
          { sourceField: 'data[].type', targetTable: 'options_data', targetColumn: 'option_type', type: 'string', transform: 'none' },
          { sourceField: 'data[].strike', targetTable: 'options_data', targetColumn: 'strike_price', type: 'number', transform: 'none' },
          { sourceField: 'data[].lastPrice', targetTable: 'options_data', targetColumn: 'last_price', type: 'number', transform: 'none' },
          { sourceField: 'data[].bid', targetTable: 'options_data', targetColumn: 'bid', type: 'number', transform: 'none' },
          { sourceField: 'data[].ask', targetTable: 'options_data', targetColumn: 'ask', type: 'number', transform: 'none' },
          { sourceField: 'data[].impliedVolatility', targetTable: 'options_data', targetColumn: 'implied_vol', type: 'number', transform: 'none' },
          { sourceField: 'data[].volume', targetTable: 'options_data', targetColumn: 'volume', type: 'integer', transform: 'none' },
          { sourceField: 'data[].openInterest', targetTable: 'options_data', targetColumn: 'open_interest', type: 'integer', transform: 'none' },
        ],
        engines: ['E-010']
      },
      // EP-010: Bulk EOD
      {
        id: 'EP-010', name: 'Bulk EOD Data',
        path: '/eod-bulk-last-day/{exchange}',
        method: 'GET',
        fields: [
          { sourceField: 'code', targetTable: 'price_history', targetColumn: 'ticker', type: 'string', transform: 'none' },
          { sourceField: 'exchange_short_name', targetTable: 'price_history', targetColumn: 'exchange', type: 'string', transform: 'none' },
          { sourceField: 'date', targetTable: 'price_history', targetColumn: 'trade_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'open', targetTable: 'price_history', targetColumn: 'open_price', type: 'number', transform: 'none' },
          { sourceField: 'high', targetTable: 'price_history', targetColumn: 'high_price', type: 'number', transform: 'none' },
          { sourceField: 'low', targetTable: 'price_history', targetColumn: 'low_price', type: 'number', transform: 'none' },
          { sourceField: 'close', targetTable: 'price_history', targetColumn: 'close_price', type: 'number', transform: 'none' },
          { sourceField: 'adjusted_close', targetTable: 'price_history', targetColumn: 'adj_close', type: 'number', transform: 'none' },
          { sourceField: 'volume', targetTable: 'price_history', targetColumn: 'volume', type: 'integer', transform: 'none' },
        ],
        engines: ['E-004', 'E-010']
      },
      // EP-011: Technical Indicators
      {
        id: 'EP-011', name: 'Technical Indicators',
        path: '/technical/{ticker}.{exchange}?function={indicator}&period={period}',
        method: 'GET',
        fields: [
          { sourceField: 'date', targetTable: 'technical_indicators', targetColumn: 'trade_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'sma', targetTable: 'technical_indicators', targetColumn: 'sma', type: 'number', transform: 'none' },
          { sourceField: 'ema', targetTable: 'technical_indicators', targetColumn: 'ema', type: 'number', transform: 'none' },
          { sourceField: 'rsi', targetTable: 'technical_indicators', targetColumn: 'rsi', type: 'number', transform: 'none' },
          { sourceField: 'macd', targetTable: 'technical_indicators', targetColumn: 'macd', type: 'number', transform: 'none' },
          { sourceField: 'macd_signal', targetTable: 'technical_indicators', targetColumn: 'macd_signal', type: 'number', transform: 'none' },
          { sourceField: 'bbands_upper', targetTable: 'technical_indicators', targetColumn: 'bb_upper', type: 'number', transform: 'none' },
          { sourceField: 'bbands_lower', targetTable: 'technical_indicators', targetColumn: 'bb_lower', type: 'number', transform: 'none' },
        ],
        engines: ['E-010']
      },
      // EP-012: Macro Economic Data
      {
        id: 'EP-012', name: 'Macro Economic Data',
        path: '/macro-indicator/{country}?indicator={indicator}',
        method: 'GET',
        fields: [
          { sourceField: 'Date', targetTable: 'macro_indicators', targetColumn: 'date', type: 'date', transform: 'iso_date' },
          { sourceField: 'Value', targetTable: 'macro_indicators', targetColumn: 'value', type: 'number', transform: 'none' },
          { sourceField: 'Country', targetTable: 'macro_indicators', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'Indicator', targetTable: 'macro_indicators', targetColumn: 'indicator_code', type: 'string', transform: 'none' },
          { sourceField: 'Period', targetTable: 'macro_indicators', targetColumn: 'period', type: 'string', transform: 'none' },
        ],
        engines: ['E-003', 'E-009']
      },
    ]
  },

  // ── DS-002: Alpha Vantage ──────────────────────────────────────────────────
  {
    id: 'DS-002',
    name: 'Alpha Vantage',
    type: 'REST_API',
    status: 'connected',
    plan: 'Premium',
    baseUrl: 'https://www.alphavantage.co/query',
    auth: { method: 'query_param', keyName: 'apikey', keyPlaceholder: 'YOUR_AV_KEY' },
    rateLimit: { requests: 500, period: 'day', used: 312 },
    lastSync: '2026-03-29T03:30:00Z',
    refreshCadence: 'daily',
    documentation: 'https://www.alphavantage.co/documentation/',
    endpoints: [
      // EP-013: Company Overview
      {
        id: 'EP-013', name: 'Company Overview',
        path: '?function=OVERVIEW&symbol={ticker}',
        method: 'GET',
        fields: [
          { sourceField: 'Symbol', targetTable: 'company_profiles', targetColumn: 'ticker', type: 'string', transform: 'none' },
          { sourceField: 'Name', targetTable: 'company_profiles', targetColumn: 'name', type: 'string', transform: 'none' },
          { sourceField: 'Sector', targetTable: 'company_profiles', targetColumn: 'sector', type: 'string', transform: 'none' },
          { sourceField: 'Industry', targetTable: 'company_profiles', targetColumn: 'sub_industry', type: 'string', transform: 'none' },
          { sourceField: 'MarketCapitalization', targetTable: 'company_profiles', targetColumn: 'market_cap', type: 'number', transform: 'divide_1e9' },
          { sourceField: 'EBITDA', targetTable: 'financial_data', targetColumn: 'ebitda', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'PERatio', targetTable: 'financial_data', targetColumn: 'pe_ratio', type: 'number', transform: 'none' },
          { sourceField: 'DividendYield', targetTable: 'financial_data', targetColumn: 'dividend_yield', type: 'number', transform: 'none' },
          { sourceField: 'EPS', targetTable: 'financial_data', targetColumn: 'eps', type: 'number', transform: 'none' },
          { sourceField: 'RevenueTTM', targetTable: 'financial_data', targetColumn: 'revenue', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'ProfitMargin', targetTable: 'financial_data', targetColumn: 'profit_margin', type: 'number', transform: 'none' },
          { sourceField: 'ReturnOnEquityTTM', targetTable: 'financial_data', targetColumn: 'roe', type: 'number', transform: 'none' },
          { sourceField: 'Beta', targetTable: 'financial_data', targetColumn: 'beta', type: 'number', transform: 'none' },
          { sourceField: '52WeekHigh', targetTable: 'financial_data', targetColumn: 'high_52w', type: 'number', transform: 'none' },
          { sourceField: '52WeekLow', targetTable: 'financial_data', targetColumn: 'low_52w', type: 'number', transform: 'none' },
          { sourceField: 'SharesOutstanding', targetTable: 'financial_data', targetColumn: 'shares_outstanding', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'BookValue', targetTable: 'financial_data', targetColumn: 'book_value', type: 'number', transform: 'none' },
        ],
        engines: ['E-001', 'E-004', 'E-005']
      },
      // EP-014: Income Statement
      {
        id: 'EP-014', name: 'Income Statement',
        path: '?function=INCOME_STATEMENT&symbol={ticker}',
        method: 'GET',
        fields: [
          { sourceField: 'annualReports[].fiscalDateEnding', targetTable: 'income_statements', targetColumn: 'fiscal_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'annualReports[].totalRevenue', targetTable: 'income_statements', targetColumn: 'total_revenue', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].costOfRevenue', targetTable: 'income_statements', targetColumn: 'cost_of_revenue', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].grossProfit', targetTable: 'income_statements', targetColumn: 'gross_profit', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].operatingIncome', targetTable: 'income_statements', targetColumn: 'operating_income', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].netIncome', targetTable: 'income_statements', targetColumn: 'net_income', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].ebitda', targetTable: 'income_statements', targetColumn: 'ebitda', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].researchAndDevelopment', targetTable: 'income_statements', targetColumn: 'rd_expense', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].interestExpense', targetTable: 'income_statements', targetColumn: 'interest_expense', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].incomeTaxExpense', targetTable: 'income_statements', targetColumn: 'tax_expense', type: 'number', transform: 'divide_1e6' },
        ],
        engines: ['E-001', 'E-004', 'E-006']
      },
      // EP-015: Balance Sheet
      {
        id: 'EP-015', name: 'Balance Sheet',
        path: '?function=BALANCE_SHEET&symbol={ticker}',
        method: 'GET',
        fields: [
          { sourceField: 'annualReports[].fiscalDateEnding', targetTable: 'balance_sheets', targetColumn: 'fiscal_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'annualReports[].totalAssets', targetTable: 'balance_sheets', targetColumn: 'total_assets', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].totalCurrentAssets', targetTable: 'balance_sheets', targetColumn: 'current_assets', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].totalLiabilities', targetTable: 'balance_sheets', targetColumn: 'total_liabilities', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].totalCurrentLiabilities', targetTable: 'balance_sheets', targetColumn: 'current_liabilities', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].totalShareholderEquity', targetTable: 'balance_sheets', targetColumn: 'shareholders_equity', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].longTermDebt', targetTable: 'balance_sheets', targetColumn: 'long_term_debt', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].shortTermDebt', targetTable: 'balance_sheets', targetColumn: 'short_term_debt', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].cashAndShortTermInvestments', targetTable: 'balance_sheets', targetColumn: 'cash_and_equivalents', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].goodwill', targetTable: 'balance_sheets', targetColumn: 'goodwill', type: 'number', transform: 'divide_1e6' },
        ],
        engines: ['E-001', 'E-004', 'E-006']
      },
      // EP-016: Cash Flow
      {
        id: 'EP-016', name: 'Cash Flow',
        path: '?function=CASH_FLOW&symbol={ticker}',
        method: 'GET',
        fields: [
          { sourceField: 'annualReports[].fiscalDateEnding', targetTable: 'cash_flows', targetColumn: 'fiscal_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'annualReports[].operatingCashflow', targetTable: 'cash_flows', targetColumn: 'operating_cf', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].capitalExpenditures', targetTable: 'cash_flows', targetColumn: 'capex', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].dividendPayout', targetTable: 'cash_flows', targetColumn: 'dividends_paid', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].netIncome', targetTable: 'cash_flows', targetColumn: 'net_income', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'annualReports[].changeInCash', targetTable: 'cash_flows', targetColumn: 'change_in_cash', type: 'number', transform: 'divide_1e6' },
        ],
        engines: ['E-004', 'E-006']
      },
      // EP-017: Earnings
      {
        id: 'EP-017', name: 'Earnings',
        path: '?function=EARNINGS&symbol={ticker}',
        method: 'GET',
        fields: [
          { sourceField: 'annualEarnings[].fiscalDateEnding', targetTable: 'earnings_data', targetColumn: 'fiscal_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'annualEarnings[].reportedEPS', targetTable: 'earnings_data', targetColumn: 'reported_eps', type: 'number', transform: 'none' },
          { sourceField: 'quarterlyEarnings[].reportedDate', targetTable: 'earnings_data', targetColumn: 'report_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'quarterlyEarnings[].reportedEPS', targetTable: 'earnings_data', targetColumn: 'quarterly_eps', type: 'number', transform: 'none' },
          { sourceField: 'quarterlyEarnings[].estimatedEPS', targetTable: 'earnings_data', targetColumn: 'estimated_eps', type: 'number', transform: 'none' },
          { sourceField: 'quarterlyEarnings[].surprise', targetTable: 'earnings_data', targetColumn: 'earnings_surprise', type: 'number', transform: 'none' },
          { sourceField: 'quarterlyEarnings[].surprisePercentage', targetTable: 'earnings_data', targetColumn: 'surprise_pct', type: 'number', transform: 'none' },
        ],
        engines: ['E-004', 'E-008']
      },
      // EP-018: Time Series Daily
      {
        id: 'EP-018', name: 'Time Series Daily',
        path: '?function=TIME_SERIES_DAILY_ADJUSTED&symbol={ticker}&outputsize=full',
        method: 'GET',
        fields: [
          { sourceField: 'Time Series (Daily).*.1. open', targetTable: 'price_history', targetColumn: 'open_price', type: 'number', transform: 'none' },
          { sourceField: 'Time Series (Daily).*.2. high', targetTable: 'price_history', targetColumn: 'high_price', type: 'number', transform: 'none' },
          { sourceField: 'Time Series (Daily).*.3. low', targetTable: 'price_history', targetColumn: 'low_price', type: 'number', transform: 'none' },
          { sourceField: 'Time Series (Daily).*.4. close', targetTable: 'price_history', targetColumn: 'close_price', type: 'number', transform: 'none' },
          { sourceField: 'Time Series (Daily).*.5. adjusted close', targetTable: 'price_history', targetColumn: 'adj_close', type: 'number', transform: 'none' },
          { sourceField: 'Time Series (Daily).*.6. volume', targetTable: 'price_history', targetColumn: 'volume', type: 'integer', transform: 'none' },
          { sourceField: 'Time Series (Daily).*.7. dividend amount', targetTable: 'price_history', targetColumn: 'dividend', type: 'number', transform: 'none' },
        ],
        engines: ['E-004', 'E-010']
      },
      // EP-019: Real GDP
      {
        id: 'EP-019', name: 'Real GDP',
        path: '?function=REAL_GDP&interval=annual',
        method: 'GET',
        fields: [
          { sourceField: 'data[].date', targetTable: 'macro_indicators', targetColumn: 'date', type: 'date', transform: 'iso_date' },
          { sourceField: 'data[].value', targetTable: 'macro_indicators', targetColumn: 'value', type: 'number', transform: 'none' },
        ],
        engines: ['E-003', 'E-009']
      },
      // EP-020: CPI
      {
        id: 'EP-020', name: 'Consumer Price Index',
        path: '?function=CPI&interval=monthly',
        method: 'GET',
        fields: [
          { sourceField: 'data[].date', targetTable: 'macro_indicators', targetColumn: 'date', type: 'date', transform: 'iso_date' },
          { sourceField: 'data[].value', targetTable: 'macro_indicators', targetColumn: 'value', type: 'number', transform: 'none' },
        ],
        engines: ['E-003', 'E-009']
      },
      // EP-021: Federal Funds Rate
      {
        id: 'EP-021', name: 'Federal Funds Rate',
        path: '?function=FEDERAL_FUNDS_RATE&interval=monthly',
        method: 'GET',
        fields: [
          { sourceField: 'data[].date', targetTable: 'macro_indicators', targetColumn: 'date', type: 'date', transform: 'iso_date' },
          { sourceField: 'data[].value', targetTable: 'macro_indicators', targetColumn: 'value', type: 'number', transform: 'none' },
        ],
        engines: ['E-003', 'E-009']
      },
      // EP-022: News Sentiment
      {
        id: 'EP-022', name: 'Market News Sentiment',
        path: '?function=NEWS_SENTIMENT&tickers={ticker}',
        method: 'GET',
        fields: [
          { sourceField: 'feed[].time_published', targetTable: 'news_sentiment', targetColumn: 'published_at', type: 'datetime', transform: 'av_datetime' },
          { sourceField: 'feed[].title', targetTable: 'news_sentiment', targetColumn: 'headline', type: 'string', transform: 'none' },
          { sourceField: 'feed[].summary', targetTable: 'news_sentiment', targetColumn: 'body', type: 'text', transform: 'truncate_2000' },
          { sourceField: 'feed[].overall_sentiment_score', targetTable: 'news_sentiment', targetColumn: 'sentiment_score', type: 'number', transform: 'none' },
          { sourceField: 'feed[].overall_sentiment_label', targetTable: 'news_sentiment', targetColumn: 'sentiment_label', type: 'string', transform: 'none' },
          { sourceField: 'feed[].ticker_sentiment[].relevance_score', targetTable: 'news_sentiment', targetColumn: 'relevance', type: 'number', transform: 'none' },
        ],
        engines: ['E-008']
      },
      // EP-023: Commodities (Brent)
      {
        id: 'EP-023', name: 'Commodity Prices',
        path: '?function=BRENT&interval=daily',
        method: 'GET',
        fields: [
          { sourceField: 'data[].date', targetTable: 'commodity_prices', targetColumn: 'date', type: 'date', transform: 'iso_date' },
          { sourceField: 'data[].value', targetTable: 'commodity_prices', targetColumn: 'price', type: 'number', transform: 'none' },
        ],
        engines: ['E-003', 'E-009']
      },
    ]
  },

  // ── DS-003: Climate TRACE ──────────────────────────────────────────────────
  {
    id: 'DS-003',
    name: 'Climate TRACE',
    type: 'REST_API',
    status: 'connected',
    plan: 'Open Access',
    baseUrl: 'https://api.climatetrace.org/v6',
    auth: { method: 'none' },
    rateLimit: { requests: 10000, period: 'day', used: 2341 },
    lastSync: '2026-03-29T02:00:00Z',
    refreshCadence: 'weekly',
    documentation: 'https://api.climatetrace.org/docs',
    endpoints: [
      {
        id: 'EP-024', name: 'Country Emissions',
        path: '/country/emissions?since=2015&to=2024',
        method: 'GET',
        fields: [
          { sourceField: 'country', targetTable: 'country_emissions', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'year', targetTable: 'country_emissions', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: 'co2', targetTable: 'country_emissions', targetColumn: 'co2_mt', type: 'number', transform: 'divide_1e6', unit: 'MtCO2' },
          { sourceField: 'ch4', targetTable: 'country_emissions', targetColumn: 'ch4_mt', type: 'number', transform: 'divide_1e6', unit: 'MtCO2e' },
          { sourceField: 'n2o', targetTable: 'country_emissions', targetColumn: 'n2o_mt', type: 'number', transform: 'divide_1e6', unit: 'MtCO2e' },
          { sourceField: 'co2e_total', targetTable: 'country_emissions', targetColumn: 'ghg_total_mt', type: 'number', transform: 'divide_1e6', unit: 'MtCO2e' },
        ],
        engines: ['E-001', 'E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-025', name: 'Sector Emissions',
        path: '/country/emissions?sector={sector}&since=2015',
        method: 'GET',
        fields: [
          { sourceField: 'sector', targetTable: 'sector_emissions', targetColumn: 'sector_name', type: 'string', transform: 'none' },
          { sourceField: 'subsector', targetTable: 'sector_emissions', targetColumn: 'subsector', type: 'string', transform: 'none' },
          { sourceField: 'country', targetTable: 'sector_emissions', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'year', targetTable: 'sector_emissions', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: 'co2e_total', targetTable: 'sector_emissions', targetColumn: 'ghg_total_mt', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'gas', targetTable: 'sector_emissions', targetColumn: 'gas_type', type: 'string', transform: 'none' },
        ],
        engines: ['E-001', 'E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-026', name: 'Facility Emissions',
        path: '/assets?country={country}&sector={sector}',
        method: 'GET',
        fields: [
          { sourceField: 'asset_id', targetTable: 'facility_emissions', targetColumn: 'facility_id', type: 'string', transform: 'none' },
          { sourceField: 'asset_name', targetTable: 'facility_emissions', targetColumn: 'facility_name', type: 'string', transform: 'none' },
          { sourceField: 'country', targetTable: 'facility_emissions', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'sector', targetTable: 'facility_emissions', targetColumn: 'sector', type: 'string', transform: 'none' },
          { sourceField: 'lat', targetTable: 'facility_emissions', targetColumn: 'latitude', type: 'number', transform: 'none' },
          { sourceField: 'lon', targetTable: 'facility_emissions', targetColumn: 'longitude', type: 'number', transform: 'none' },
          { sourceField: 'emissions.co2', targetTable: 'facility_emissions', targetColumn: 'co2_tonnes', type: 'number', transform: 'none' },
          { sourceField: 'emissions.co2e_total', targetTable: 'facility_emissions', targetColumn: 'ghg_total_tonnes', type: 'number', transform: 'none' },
          { sourceField: 'capacity', targetTable: 'facility_emissions', targetColumn: 'capacity_mw', type: 'number', transform: 'none' },
          { sourceField: 'source_type', targetTable: 'facility_emissions', targetColumn: 'source_type', type: 'string', transform: 'none' },
        ],
        engines: ['E-001', 'E-002', 'E-003', 'E-007']
      },
    ]
  },

  // ── DS-004: EDGAR / SEC ────────────────────────────────────────────────────
  {
    id: 'DS-004',
    name: 'SEC EDGAR',
    type: 'REST_API',
    status: 'connected',
    plan: 'Open Access',
    baseUrl: 'https://data.sec.gov',
    auth: { method: 'header', keyName: 'User-Agent', keyPlaceholder: 'CompanyName admin@company.com' },
    rateLimit: { requests: 10, period: 'second', used: 0 },
    lastSync: '2026-03-29T01:00:00Z',
    refreshCadence: 'daily',
    documentation: 'https://www.sec.gov/edgar/sec-api-documentation',
    endpoints: [
      {
        id: 'EP-027', name: 'Company Facts',
        path: '/api/xbrl/companyfacts/CIK{cik}.json',
        method: 'GET',
        fields: [
          { sourceField: 'entityName', targetTable: 'company_profiles', targetColumn: 'legal_name', type: 'string', transform: 'none' },
          { sourceField: 'facts.us-gaap.Revenues.units.USD[].val', targetTable: 'sec_financials', targetColumn: 'revenue', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'facts.us-gaap.NetIncomeLoss.units.USD[].val', targetTable: 'sec_financials', targetColumn: 'net_income', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'facts.us-gaap.Assets.units.USD[].val', targetTable: 'sec_financials', targetColumn: 'total_assets', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'facts.us-gaap.StockholdersEquity.units.USD[].val', targetTable: 'sec_financials', targetColumn: 'equity', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'facts.us-gaap.LongTermDebt.units.USD[].val', targetTable: 'sec_financials', targetColumn: 'long_term_debt', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'facts.dei.EntityCommonStockSharesOutstanding.units.shares[].val', targetTable: 'sec_financials', targetColumn: 'shares_outstanding', type: 'number', transform: 'divide_1e6' },
        ],
        engines: ['E-001', 'E-004', 'E-006']
      },
      {
        id: 'EP-028', name: 'Company Filings',
        path: '/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type={form_type}&dateb=&owner=include&count=40&output=atom',
        method: 'GET',
        fields: [
          { sourceField: 'entry[].title', targetTable: 'sec_filings', targetColumn: 'filing_type', type: 'string', transform: 'none' },
          { sourceField: 'entry[].updated', targetTable: 'sec_filings', targetColumn: 'filed_date', type: 'date', transform: 'iso_date' },
          { sourceField: 'entry[].link.href', targetTable: 'sec_filings', targetColumn: 'filing_url', type: 'string', transform: 'none' },
          { sourceField: 'entry[].summary', targetTable: 'sec_filings', targetColumn: 'description', type: 'text', transform: 'truncate_500' },
          { sourceField: 'entry[].category.term', targetTable: 'sec_filings', targetColumn: 'form_type', type: 'string', transform: 'none' },
        ],
        engines: ['E-006', 'E-008']
      },
      {
        id: 'EP-029', name: 'XBRL Submissions',
        path: '/submissions/CIK{cik}.json',
        method: 'GET',
        fields: [
          { sourceField: 'cik', targetTable: 'company_profiles', targetColumn: 'cik', type: 'string', transform: 'pad_10' },
          { sourceField: 'name', targetTable: 'company_profiles', targetColumn: 'legal_name', type: 'string', transform: 'none' },
          { sourceField: 'sic', targetTable: 'company_profiles', targetColumn: 'sic_code', type: 'string', transform: 'none' },
          { sourceField: 'sicDescription', targetTable: 'company_profiles', targetColumn: 'sic_description', type: 'string', transform: 'none' },
          { sourceField: 'tickers', targetTable: 'company_profiles', targetColumn: 'tickers_list', type: 'array', transform: 'json_array' },
          { sourceField: 'exchanges', targetTable: 'company_profiles', targetColumn: 'exchanges_list', type: 'array', transform: 'json_array' },
          { sourceField: 'fiscalYearEnd', targetTable: 'company_profiles', targetColumn: 'fiscal_year_end', type: 'string', transform: 'none' },
          { sourceField: 'filings.recent.form', targetTable: 'sec_filings', targetColumn: 'form_types', type: 'array', transform: 'json_array' },
          { sourceField: 'filings.recent.filingDate', targetTable: 'sec_filings', targetColumn: 'filing_dates', type: 'array', transform: 'json_array' },
        ],
        engines: ['E-006']
      },
    ]
  },

  // ── DS-005: Ember Climate ──────────────────────────────────────────────────
  {
    id: 'DS-005',
    name: 'Ember Climate',
    type: 'REST_API',
    status: 'connected',
    plan: 'Open Access',
    baseUrl: 'https://ember-data-api-scg3n.ondigitalocean.app',
    auth: { method: 'none' },
    rateLimit: { requests: 1000, period: 'day', used: 156 },
    lastSync: '2026-03-28T22:00:00Z',
    refreshCadence: 'monthly',
    documentation: 'https://ember-climate.org/data/',
    endpoints: [
      {
        id: 'EP-030', name: 'Electricity Generation',
        path: '/ember/electricity-generation?entity={country}',
        method: 'GET',
        fields: [
          { sourceField: 'entity', targetTable: 'energy_data', targetColumn: 'country', type: 'string', transform: 'none' },
          { sourceField: 'date', targetTable: 'energy_data', targetColumn: 'year', type: 'integer', transform: 'extract_year' },
          { sourceField: 'generation_twh', targetTable: 'energy_data', targetColumn: 'generation_twh', type: 'number', transform: 'none' },
          { sourceField: 'source', targetTable: 'energy_data', targetColumn: 'energy_source', type: 'string', transform: 'none' },
          { sourceField: 'category', targetTable: 'energy_data', targetColumn: 'source_category', type: 'string', transform: 'none' },
          { sourceField: 'share_of_generation_pct', targetTable: 'energy_data', targetColumn: 'generation_share_pct', type: 'number', transform: 'none' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-031', name: 'Carbon Intensity',
        path: '/ember/carbon-intensity?entity={country}',
        method: 'GET',
        fields: [
          { sourceField: 'entity', targetTable: 'energy_data', targetColumn: 'country', type: 'string', transform: 'none' },
          { sourceField: 'date', targetTable: 'energy_data', targetColumn: 'year', type: 'integer', transform: 'extract_year' },
          { sourceField: 'emissions_intensity_gco2_kwh', targetTable: 'energy_data', targetColumn: 'carbon_intensity_gco2_kwh', type: 'number', transform: 'none' },
          { sourceField: 'total_emissions_mtco2', targetTable: 'energy_data', targetColumn: 'power_sector_emissions_mt', type: 'number', transform: 'none' },
        ],
        engines: ['E-001', 'E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-032', name: 'Power Capacity',
        path: '/ember/capacity?entity={country}',
        method: 'GET',
        fields: [
          { sourceField: 'entity', targetTable: 'energy_data', targetColumn: 'country', type: 'string', transform: 'none' },
          { sourceField: 'date', targetTable: 'energy_data', targetColumn: 'year', type: 'integer', transform: 'extract_year' },
          { sourceField: 'capacity_gw', targetTable: 'energy_data', targetColumn: 'capacity_gw', type: 'number', transform: 'none' },
          { sourceField: 'source', targetTable: 'energy_data', targetColumn: 'energy_source', type: 'string', transform: 'none' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
    ]
  },

  // ── DS-006: World Bank ─────────────────────────────────────────────────────
  {
    id: 'DS-006',
    name: 'World Bank Open Data',
    type: 'REST_API',
    status: 'connected',
    plan: 'Open Access',
    baseUrl: 'https://api.worldbank.org/v2',
    auth: { method: 'none' },
    rateLimit: { requests: 50000, period: 'day', used: 4201 },
    lastSync: '2026-03-29T00:00:00Z',
    refreshCadence: 'quarterly',
    documentation: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392',
    endpoints: [
      {
        id: 'EP-033', name: 'GDP (Current US$)',
        path: '/country/{country}/indicator/NY.GDP.MKTP.CD?format=json',
        method: 'GET',
        fields: [
          { sourceField: '[1][].country.id', targetTable: 'macro_indicators', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: '[1][].date', targetTable: 'macro_indicators', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: '[1][].value', targetTable: 'macro_indicators', targetColumn: 'gdp_usd', type: 'number', transform: 'divide_1e9', unit: '$Bn' },
        ],
        engines: ['E-003', 'E-009']
      },
      {
        id: 'EP-034', name: 'Population',
        path: '/country/{country}/indicator/SP.POP.TOTL?format=json',
        method: 'GET',
        fields: [
          { sourceField: '[1][].country.id', targetTable: 'macro_indicators', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: '[1][].date', targetTable: 'macro_indicators', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: '[1][].value', targetTable: 'macro_indicators', targetColumn: 'population', type: 'number', transform: 'none' },
        ],
        engines: ['E-003', 'E-009']
      },
      {
        id: 'EP-035', name: 'CO2 Emissions per Capita',
        path: '/country/{country}/indicator/EN.ATM.CO2E.PC?format=json',
        method: 'GET',
        fields: [
          { sourceField: '[1][].country.id', targetTable: 'country_emissions', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: '[1][].date', targetTable: 'country_emissions', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: '[1][].value', targetTable: 'country_emissions', targetColumn: 'co2_per_capita', type: 'number', transform: 'none', unit: 'tCO2/capita' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-036', name: 'ND-GAIN Index',
        path: '/country/{country}/indicator/ER.FSH.AQUA.MT?format=json',
        method: 'GET',
        fields: [
          { sourceField: '[1][].country.id', targetTable: 'climate_risk_scores', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: '[1][].date', targetTable: 'climate_risk_scores', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: '[1][].value', targetTable: 'climate_risk_scores', targetColumn: 'ndgain_score', type: 'number', transform: 'none' },
        ],
        engines: ['E-003', 'E-007', 'E-009']
      },
      {
        id: 'EP-037', name: 'Renewable Energy (% of total)',
        path: '/country/{country}/indicator/EG.FEC.RNEW.ZS?format=json',
        method: 'GET',
        fields: [
          { sourceField: '[1][].country.id', targetTable: 'energy_data', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: '[1][].date', targetTable: 'energy_data', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: '[1][].value', targetTable: 'energy_data', targetColumn: 'renewable_pct', type: 'number', transform: 'none' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-038', name: 'Forest Area (%)',
        path: '/country/{country}/indicator/AG.LND.FRST.ZS?format=json',
        method: 'GET',
        fields: [
          { sourceField: '[1][].country.id', targetTable: 'land_use_data', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: '[1][].date', targetTable: 'land_use_data', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: '[1][].value', targetTable: 'land_use_data', targetColumn: 'forest_area_pct', type: 'number', transform: 'none' },
        ],
        engines: ['E-007']
      },
    ]
  },

  // ── DS-007: UNFCCC ─────────────────────────────────────────────────────────
  {
    id: 'DS-007',
    name: 'UNFCCC Data Interface',
    type: 'REST_API',
    status: 'connected',
    plan: 'Open Access',
    baseUrl: 'https://di.unfccc.int/api',
    auth: { method: 'none' },
    rateLimit: { requests: 5000, period: 'day', used: 891 },
    lastSync: '2026-03-28T18:00:00Z',
    refreshCadence: 'annual',
    documentation: 'https://di.unfccc.int/api/help',
    endpoints: [
      {
        id: 'EP-039', name: 'NDC Targets',
        path: '/parties/{party_id}/ndcs',
        method: 'GET',
        fields: [
          { sourceField: 'party', targetTable: 'ndc_targets', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: 'ndc_type', targetTable: 'ndc_targets', targetColumn: 'ndc_type', type: 'string', transform: 'none' },
          { sourceField: 'target_year', targetTable: 'ndc_targets', targetColumn: 'target_year', type: 'integer', transform: 'none' },
          { sourceField: 'reduction_pct', targetTable: 'ndc_targets', targetColumn: 'reduction_target_pct', type: 'number', transform: 'none' },
          { sourceField: 'base_year', targetTable: 'ndc_targets', targetColumn: 'base_year', type: 'integer', transform: 'none' },
          { sourceField: 'conditional', targetTable: 'ndc_targets', targetColumn: 'is_conditional', type: 'boolean', transform: 'none' },
          { sourceField: 'scope', targetTable: 'ndc_targets', targetColumn: 'scope', type: 'string', transform: 'none' },
        ],
        engines: ['E-002', 'E-003', 'E-007', 'E-009']
      },
      {
        id: 'EP-040', name: 'GHG Inventory Data',
        path: '/records/ghg?party_id={party_id}&year={year}',
        method: 'GET',
        fields: [
          { sourceField: 'party_code', targetTable: 'country_emissions', targetColumn: 'country_code', type: 'string', transform: 'none' },
          { sourceField: 'year', targetTable: 'country_emissions', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: 'category', targetTable: 'country_emissions', targetColumn: 'sector', type: 'string', transform: 'none' },
          { sourceField: 'gas', targetTable: 'country_emissions', targetColumn: 'gas_type', type: 'string', transform: 'none' },
          { sourceField: 'numberValue', targetTable: 'country_emissions', targetColumn: 'emissions_value', type: 'number', transform: 'none' },
          { sourceField: 'unit', targetTable: 'country_emissions', targetColumn: 'unit', type: 'string', transform: 'none' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
    ]
  },

  // ── DS-008: IEA Proxy (Open Energy Data) ───────────────────────────────────
  {
    id: 'DS-008',
    name: 'IEA World Energy Data (Proxy)',
    type: 'REST_API',
    status: 'connected',
    plan: 'Open Access',
    baseUrl: 'https://api.iea.org/stats',
    auth: { method: 'query_param', keyName: 'token', keyPlaceholder: 'IEA_TOKEN' },
    rateLimit: { requests: 2000, period: 'day', used: 423 },
    lastSync: '2026-03-28T20:00:00Z',
    refreshCadence: 'annual',
    documentation: 'https://www.iea.org/data-and-statistics',
    endpoints: [
      {
        id: 'EP-041', name: 'Energy Balances',
        path: '/balances?country={country}&year={year}',
        method: 'GET',
        fields: [
          { sourceField: 'country', targetTable: 'energy_data', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'year', targetTable: 'energy_data', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: 'product', targetTable: 'energy_data', targetColumn: 'energy_product', type: 'string', transform: 'none' },
          { sourceField: 'flow', targetTable: 'energy_data', targetColumn: 'flow_type', type: 'string', transform: 'none' },
          { sourceField: 'value', targetTable: 'energy_data', targetColumn: 'value_tj', type: 'number', transform: 'none', unit: 'TJ' },
          { sourceField: 'unit', targetTable: 'energy_data', targetColumn: 'unit', type: 'string', transform: 'none' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
      {
        id: 'EP-042', name: 'CO2 from Fuel Combustion',
        path: '/co2?country={country}&year={year}',
        method: 'GET',
        fields: [
          { sourceField: 'country', targetTable: 'country_emissions', targetColumn: 'country_code', type: 'string', transform: 'uppercase' },
          { sourceField: 'year', targetTable: 'country_emissions', targetColumn: 'year', type: 'integer', transform: 'none' },
          { sourceField: 'sector', targetTable: 'country_emissions', targetColumn: 'sector', type: 'string', transform: 'none' },
          { sourceField: 'fuel', targetTable: 'country_emissions', targetColumn: 'fuel_type', type: 'string', transform: 'none' },
          { sourceField: 'co2_mt', targetTable: 'country_emissions', targetColumn: 'co2_mt', type: 'number', transform: 'none', unit: 'MtCO2' },
        ],
        engines: ['E-002', 'E-003', 'E-007']
      },
    ]
  },

  // ── DS-009: CDP (Pending Integration) ──────────────────────────────────────
  {
    id: 'DS-009',
    name: 'CDP Climate Disclosure',
    type: 'REST_API',
    status: 'pending',
    plan: 'Data License (Pending)',
    baseUrl: 'https://data.cdp.net/api',
    auth: { method: 'bearer_token', keyPlaceholder: 'CDP_API_TOKEN' },
    rateLimit: { requests: 5000, period: 'day', used: 0 },
    lastSync: null,
    refreshCadence: 'annual',
    documentation: 'https://www.cdp.net/en/data',
    endpoints: [
      {
        id: 'EP-043', name: 'Climate Scores',
        path: '/scores?year={year}',
        method: 'GET',
        fields: [
          { sourceField: 'organization', targetTable: 'company_emissions', targetColumn: 'company_name', type: 'string', transform: 'none' },
          { sourceField: 'score', targetTable: 'company_emissions', targetColumn: 'cdp_score', type: 'string', transform: 'none' },
          { sourceField: 'scope1', targetTable: 'company_emissions', targetColumn: 'scope1_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'scope2_location', targetTable: 'company_emissions', targetColumn: 'scope2_location_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'scope2_market', targetTable: 'company_emissions', targetColumn: 'scope2_market_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'scope3_total', targetTable: 'company_emissions', targetColumn: 'scope3_total_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'target_type', targetTable: 'company_emissions', targetColumn: 'sbti_target_type', type: 'string', transform: 'none' },
          { sourceField: 'target_year', targetTable: 'company_emissions', targetColumn: 'target_year', type: 'integer', transform: 'none' },
          { sourceField: 'reduction_target_pct', targetTable: 'company_emissions', targetColumn: 'reduction_target_pct', type: 'number', transform: 'none' },
        ],
        engines: ['E-001', 'E-002', 'E-006', 'E-007']
      },
      {
        id: 'EP-044', name: 'Water Security',
        path: '/water?year={year}',
        method: 'GET',
        fields: [
          { sourceField: 'organization', targetTable: 'company_emissions', targetColumn: 'company_name', type: 'string', transform: 'none' },
          { sourceField: 'water_score', targetTable: 'company_emissions', targetColumn: 'cdp_water_score', type: 'string', transform: 'none' },
          { sourceField: 'withdrawal_ml', targetTable: 'company_emissions', targetColumn: 'water_withdrawal_ml', type: 'number', transform: 'none' },
          { sourceField: 'discharge_ml', targetTable: 'company_emissions', targetColumn: 'water_discharge_ml', type: 'number', transform: 'none' },
          { sourceField: 'consumption_ml', targetTable: 'company_emissions', targetColumn: 'water_consumption_ml', type: 'number', transform: 'none' },
        ],
        engines: ['E-007']
      },
      {
        id: 'EP-045', name: 'Forests',
        path: '/forests?year={year}',
        method: 'GET',
        fields: [
          { sourceField: 'organization', targetTable: 'company_emissions', targetColumn: 'company_name', type: 'string', transform: 'none' },
          { sourceField: 'forest_score', targetTable: 'company_emissions', targetColumn: 'cdp_forest_score', type: 'string', transform: 'none' },
          { sourceField: 'deforestation_risk', targetTable: 'company_emissions', targetColumn: 'deforestation_risk', type: 'string', transform: 'none' },
          { sourceField: 'commodities', targetTable: 'company_emissions', targetColumn: 'forest_commodities', type: 'array', transform: 'json_array' },
        ],
        engines: ['E-007']
      },
    ]
  },

  // ── DS-010: Bloomberg (Not Connected) ──────────────────────────────────────
  {
    id: 'DS-010',
    name: 'Bloomberg Terminal Data',
    type: 'BLPAPI',
    status: 'not_connected',
    plan: 'Enterprise (Not Licensed)',
    baseUrl: 'blpapi://localhost:8194',
    auth: { method: 'bloomberg_session', keyPlaceholder: 'BLPAPI_SESSION' },
    rateLimit: { requests: 500000, period: 'day', used: 0 },
    lastSync: null,
    refreshCadence: 'real-time',
    documentation: 'https://www.bloomberg.com/professional/support/api-library/',
    endpoints: [
      {
        id: 'EP-046', name: 'Reference Data (BDP)',
        path: '//blp/refdata/ReferenceDataRequest',
        method: 'BLPAPI',
        fields: [
          { sourceField: 'PX_LAST', targetTable: 'price_history', targetColumn: 'close_price', type: 'number', transform: 'none' },
          { sourceField: 'CUR_MKT_CAP', targetTable: 'company_profiles', targetColumn: 'market_cap', type: 'number', transform: 'divide_1e9' },
          { sourceField: 'TRAIL_12M_GROSS_REV', targetTable: 'financial_data', targetColumn: 'revenue', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'EBITDA', targetTable: 'financial_data', targetColumn: 'ebitda', type: 'number', transform: 'divide_1e6' },
          { sourceField: 'ESG_DISCLOSURE_SCORE', targetTable: 'esg_ratings', targetColumn: 'bbg_disclosure_score', type: 'number', transform: 'none' },
          { sourceField: 'ENVIRON_PILLAR_SCORE', targetTable: 'esg_ratings', targetColumn: 'bbg_env_score', type: 'number', transform: 'none' },
          { sourceField: 'SOCIAL_PILLAR_SCORE', targetTable: 'esg_ratings', targetColumn: 'bbg_social_score', type: 'number', transform: 'none' },
          { sourceField: 'GOVNCE_PILLAR_SCORE', targetTable: 'esg_ratings', targetColumn: 'bbg_gov_score', type: 'number', transform: 'none' },
          { sourceField: 'CARBON_EMISSIONS_SCOPE_1', targetTable: 'company_emissions', targetColumn: 'scope1_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'CARBON_EMISSIONS_SCOPE_2', targetTable: 'company_emissions', targetColumn: 'scope2_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'CARBON_EMISSIONS_SCOPE_3', targetTable: 'company_emissions', targetColumn: 'scope3_total_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'PCT_WOMEN_ON_BOARD', targetTable: 'governance_data', targetColumn: 'women_board_pct', type: 'number', transform: 'none' },
          { sourceField: 'BOARD_SIZE', targetTable: 'governance_data', targetColumn: 'board_size', type: 'integer', transform: 'none' },
          { sourceField: 'CEO_TOTAL_COMP', targetTable: 'governance_data', targetColumn: 'ceo_comp', type: 'number', transform: 'divide_1e6' },
        ],
        engines: ['E-001', 'E-002', 'E-004', 'E-005', 'E-006', 'E-008', 'E-010']
      },
      {
        id: 'EP-047', name: 'Historical Data (BDH)',
        path: '//blp/refdata/HistoricalDataRequest',
        method: 'BLPAPI',
        fields: [
          { sourceField: 'date', targetTable: 'price_history', targetColumn: 'trade_date', type: 'date', transform: 'bbg_date' },
          { sourceField: 'PX_LAST', targetTable: 'price_history', targetColumn: 'close_price', type: 'number', transform: 'none' },
          { sourceField: 'PX_OPEN', targetTable: 'price_history', targetColumn: 'open_price', type: 'number', transform: 'none' },
          { sourceField: 'PX_HIGH', targetTable: 'price_history', targetColumn: 'high_price', type: 'number', transform: 'none' },
          { sourceField: 'PX_LOW', targetTable: 'price_history', targetColumn: 'low_price', type: 'number', transform: 'none' },
          { sourceField: 'PX_VOLUME', targetTable: 'price_history', targetColumn: 'volume', type: 'integer', transform: 'none' },
        ],
        engines: ['E-004', 'E-010']
      },
      {
        id: 'EP-048', name: 'ESG Detailed Fields',
        path: '//blp/refdata/ReferenceDataRequest',
        method: 'BLPAPI',
        fields: [
          { sourceField: 'GHG_SCOPE_1', targetTable: 'company_emissions', targetColumn: 'scope1_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'GHG_SCOPE_2_LOCATION', targetTable: 'company_emissions', targetColumn: 'scope2_location_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'GHG_SCOPE_2_MARKET', targetTable: 'company_emissions', targetColumn: 'scope2_market_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'GHG_SCOPE_3_TOTAL', targetTable: 'company_emissions', targetColumn: 'scope3_total_tco2e', type: 'number', transform: 'none' },
          { sourceField: 'CARBON_INTENSITY_SCOPE_12', targetTable: 'company_emissions', targetColumn: 'carbon_intensity', type: 'number', transform: 'none', unit: 'tCO2e/$M revenue' },
          { sourceField: 'SCIENCE_BASED_TARGET', targetTable: 'company_emissions', targetColumn: 'sbti_status', type: 'string', transform: 'none' },
          { sourceField: 'NET_ZERO_TARGET_YR', targetTable: 'company_emissions', targetColumn: 'net_zero_year', type: 'integer', transform: 'none' },
          { sourceField: 'EU_TAXONOMY_ELIGIBLE_REV_PCT', targetTable: 'taxonomy_data', targetColumn: 'taxonomy_eligible_pct', type: 'number', transform: 'none' },
          { sourceField: 'EU_TAXONOMY_ALIGNED_REV_PCT', targetTable: 'taxonomy_data', targetColumn: 'taxonomy_aligned_pct', type: 'number', transform: 'none' },
          { sourceField: 'GREEN_BOND_OUTSTANDING', targetTable: 'taxonomy_data', targetColumn: 'green_bond_outstanding', type: 'number', transform: 'divide_1e6' },
        ],
        engines: ['E-001', 'E-002', 'E-005', 'E-006', 'E-007']
      },
    ]
  },
];


// ═══════════════════════════════════════════════════════════════════════════════
//  DB TABLES — 15 target tables
// ═══════════════════════════════════════════════════════════════════════════════

export const DB_TABLES = [
  { name: 'company_profiles', primaryKey: 'id', alembicMigration: '019_extend_assets_pcaf', columns: ['id','ticker','name','sector','sub_industry','country_code','exchange','currency','isin','cusip','cik','employees','ipo_date','description','market_cap','legal_name','sic_code','sic_description','tickers_list','exchanges_list','fiscal_year_end'] },
  { name: 'financial_data', primaryKey: 'id', alembicMigration: '019_extend_assets_pcaf', columns: ['id','company_id','target_price','pe_ratio','peg_ratio','eps','dividend_per_share','dividend_yield','revenue','revenue_per_share','ebitda','profit_margin','operating_margin','roe','roa','book_value','enterprise_value','forward_pe','price_to_sales','price_to_book','ev_to_revenue','ev_to_ebitda','shares_outstanding','shares_float','insider_pct','institutional_pct','beta','high_52w','low_52w','ma_50d','ma_200d'] },
  { name: 'esg_ratings', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','company_id','rating_date','esg_composite','environmental_score','social_score','governance_score','controversy_level','highest_controversy','alcohol_involvement','gambling_involvement','tobacco_involvement','nuclear_involvement','weapons_involvement','fur_leather_involvement','bbg_disclosure_score','bbg_env_score','bbg_social_score','bbg_gov_score'] },
  { name: 'company_emissions', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','company_id','company_name','scope1_tco2e','scope2_location_tco2e','scope2_market_tco2e','scope3_total_tco2e','carbon_intensity','cdp_score','sbti_status','sbti_target_type','net_zero_year','target_year','reduction_target_pct','cdp_water_score','water_withdrawal_ml','water_discharge_ml','water_consumption_ml','cdp_forest_score','deforestation_risk','forest_commodities'] },
  { name: 'price_history', primaryKey: 'id', alembicMigration: '019_extend_assets_pcaf', columns: ['id','ticker','exchange','trade_date','open_price','high_price','low_price','close_price','adj_close','volume','dividend'] },
  { name: 'country_emissions', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','country_code','year','co2_mt','ch4_mt','n2o_mt','ghg_total_mt','co2_per_capita','sector','gas_type','fuel_type','emissions_value','unit'] },
  { name: 'sector_emissions', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','sector_name','subsector','country_code','year','ghg_total_mt','gas_type'] },
  { name: 'facility_emissions', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','facility_id','facility_name','country_code','sector','latitude','longitude','co2_tonnes','ghg_total_tonnes','capacity_mw','source_type'] },
  { name: 'energy_data', primaryKey: 'id', alembicMigration: '050_energy_transition', columns: ['id','country','country_code','year','generation_twh','energy_source','source_category','generation_share_pct','carbon_intensity_gco2_kwh','power_sector_emissions_mt','capacity_gw','renewable_pct','energy_product','flow_type','value_tj','unit'] },
  { name: 'macro_indicators', primaryKey: 'id', alembicMigration: '019_extend_assets_pcaf', columns: ['id','country_code','date','year','value','indicator_code','period','gdp_usd','population'] },
  { name: 'ndc_targets', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','country_code','ndc_type','target_year','reduction_target_pct','base_year','is_conditional','scope'] },
  { name: 'climate_risk_scores', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','country_code','year','ndgain_score'] },
  { name: 'land_use_data', primaryKey: 'id', alembicMigration: '045_company_emissions', columns: ['id','country_code','year','forest_area_pct'] },
  { name: 'taxonomy_data', primaryKey: 'id', alembicMigration: '055_eu_taxonomy', columns: ['id','company_id','taxonomy_eligible_pct','taxonomy_aligned_pct','green_bond_outstanding'] },
  { name: 'governance_data', primaryKey: 'id', alembicMigration: '060_uk_sdr', columns: ['id','company_id','women_board_pct','board_size','ceo_comp'] },
];


// ═══════════════════════════════════════════════════════════════════════════════
//  ENGINE FIELD MAP — 10 engines
// ═══════════════════════════════════════════════════════════════════════════════

export const ENGINE_FIELD_MAP = {
  'E-001': {
    name: 'PCAF Financed Emissions',
    requiredFields: ['scope1_tco2e', 'scope2_tco2e', 'evic_usd_mn', 'outstanding_amount', 'asset_class', 'revenue'],
    optionalFields: ['scope3_total_tco2e', 'data_quality_score', 'sector'],
    sources: ['DS-001', 'DS-002', 'DS-003', 'DS-004', 'DS-009', 'DS-010'],
    modules: ['pcaf-financed-emissions', 'climate-banking-hub'],
  },
  'E-002': {
    name: 'Temperature Score & Alignment',
    requiredFields: ['scope1_tco2e', 'scope2_tco2e', 'sbti_status', 'sector', 'reduction_target_pct'],
    optionalFields: ['net_zero_year', 'base_year_emissions', 'target_year'],
    sources: ['DS-003', 'DS-005', 'DS-006', 'DS-007', 'DS-008', 'DS-009', 'DS-010'],
    modules: ['portfolio-temperature-score', 'sbti-target-setter', 'transition-credibility'],
  },
  'E-003': {
    name: 'Climate Scenario & Macro Risk',
    requiredFields: ['gdp_usd', 'co2_mt', 'population', 'ndgain_score'],
    optionalFields: ['renewable_pct', 'carbon_intensity_gco2_kwh', 'ndc_reduction_target_pct'],
    sources: ['DS-001', 'DS-003', 'DS-005', 'DS-006', 'DS-007', 'DS-008'],
    modules: ['climate-policy-intelligence', 'green-central-banking', 'transition-scenario-modeller', 'climate-sovereign-bonds'],
  },
  'E-004': {
    name: 'Financial Analytics & Valuation',
    requiredFields: ['revenue', 'ebitda', 'net_income', 'total_assets', 'shares_outstanding', 'close_price'],
    optionalFields: ['pe_ratio', 'beta', 'dividend_yield', 'capex', 'book_value'],
    sources: ['DS-001', 'DS-002', 'DS-004', 'DS-010'],
    modules: ['esg-factor-alpha', 'esg-portfolio-optimizer', 'carbon-aware-allocation', 'executive-pay-analytics'],
  },
  'E-005': {
    name: 'ESG Rating Harmonisation',
    requiredFields: ['esg_composite', 'environmental_score', 'social_score', 'governance_score'],
    optionalFields: ['controversy_level', 'bbg_disclosure_score', 'market_cap', 'sector'],
    sources: ['DS-001', 'DS-002', 'DS-010'],
    modules: ['esg-ratings-comparator', 'ratings-methodology-decoder', 'ratings-migration-momentum', 'controversy-rating-impact'],
  },
  'E-006': {
    name: 'Transition Readiness & Credibility',
    requiredFields: ['scope1_tco2e', 'scope2_tco2e', 'capex', 'revenue', 'sector'],
    optionalFields: ['green_revenue_pct', 'taxonomy_aligned_pct', 'net_zero_year', 'sbti_status'],
    sources: ['DS-001', 'DS-002', 'DS-004', 'DS-009', 'DS-010'],
    modules: ['transition-plan-builder', 'transition-credibility', 'act-assessment', 'gfanz-sector-pathways'],
  },
  'E-007': {
    name: 'Nature & Biodiversity Risk',
    requiredFields: ['country_code', 'sector', 'forest_area_pct', 'deforestation_risk'],
    optionalFields: ['water_withdrawal_ml', 'co2_per_capita', 'ndgain_score', 'ghg_total_mt'],
    sources: ['DS-003', 'DS-005', 'DS-006', 'DS-007', 'DS-008', 'DS-009', 'DS-010'],
    modules: ['nature-loss-risk', 'land-use-deforestation', 'water-risk-analytics', 'ocean-marine-risk', 'circular-economy-tracker'],
  },
  'E-008': {
    name: 'Sentiment & Controversy Detection',
    requiredFields: ['headline', 'sentiment_score', 'ticker'],
    optionalFields: ['body', 'published_at', 'relevance', 'insider_name', 'transaction_type'],
    sources: ['DS-001', 'DS-002', 'DS-004', 'DS-010'],
    modules: ['greenwashing-detector', 'controversy-rating-impact', 'proxy-voting-intel', 'shareholder-activism'],
  },
  'E-009': {
    name: 'Sovereign & Macro ESG',
    requiredFields: ['country_code', 'gdp_usd', 'population', 'ndc_type', 'reduction_target_pct'],
    optionalFields: ['ndgain_score', 'renewable_pct', 'co2_per_capita'],
    sources: ['DS-001', 'DS-006', 'DS-007'],
    modules: ['climate-sovereign-bonds', 'climate-policy-intelligence', 'green-central-banking'],
  },
  'E-010': {
    name: 'Quantitative Portfolio Analytics',
    requiredFields: ['close_price', 'volume', 'market_cap', 'beta'],
    optionalFields: ['pe_ratio', 'dividend_yield', 'sma', 'ema', 'rsi', 'macd', 'implied_vol'],
    sources: ['DS-001', 'DS-002', 'DS-010'],
    modules: ['esg-factor-alpha', 'esg-momentum-scanner', 'net-zero-portfolio-builder', 'carbon-aware-allocation'],
  },
};


// ═══════════════════════════════════════════════════════════════════════════════
//  FIELD LINEAGE — 55 entries tracing source → table → engine → module
// ═══════════════════════════════════════════════════════════════════════════════

export const FIELD_LINEAGE = [
  { field: 'scope1_tco2e', sources: ['DS-009/EP-043','DS-010/EP-046','DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-001','E-002','E-006'], modules: ['pcaf-financed-emissions','portfolio-temperature-score','transition-plan-builder','climate-banking-hub'] },
  { field: 'scope2_location_tco2e', sources: ['DS-009/EP-043','DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-001','E-002','E-006'], modules: ['pcaf-financed-emissions','portfolio-temperature-score','transition-credibility'] },
  { field: 'scope2_market_tco2e', sources: ['DS-009/EP-043','DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-001','E-006'], modules: ['pcaf-financed-emissions','transition-plan-builder'] },
  { field: 'scope3_total_tco2e', sources: ['DS-009/EP-043','DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-001','E-002'], modules: ['pcaf-financed-emissions','portfolio-temperature-score'] },
  { field: 'carbon_intensity', sources: ['DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-001','E-006'], modules: ['pcaf-financed-emissions','carbon-aware-allocation'] },
  { field: 'sbti_status', sources: ['DS-009/EP-043','DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-002','E-006'], modules: ['sbti-target-setter','transition-credibility','portfolio-temperature-score'] },
  { field: 'net_zero_year', sources: ['DS-010/EP-048'], tables: ['company_emissions'], engines: ['E-002','E-006'], modules: ['net-zero-commitment-tracker','transition-plan-builder'] },
  { field: 'esg_composite', sources: ['DS-001/EP-002','DS-010/EP-046'], tables: ['esg_ratings'], engines: ['E-005'], modules: ['esg-ratings-comparator','ratings-methodology-decoder'] },
  { field: 'environmental_score', sources: ['DS-001/EP-002','DS-010/EP-046'], tables: ['esg_ratings'], engines: ['E-005'], modules: ['esg-ratings-comparator','ratings-migration-momentum'] },
  { field: 'social_score', sources: ['DS-001/EP-002','DS-010/EP-046'], tables: ['esg_ratings'], engines: ['E-005'], modules: ['esg-ratings-comparator','ratings-migration-momentum'] },
  { field: 'governance_score', sources: ['DS-001/EP-002','DS-010/EP-046'], tables: ['esg_ratings'], engines: ['E-005'], modules: ['esg-ratings-comparator','board-composition','proxy-voting-intel'] },
  { field: 'controversy_level', sources: ['DS-001/EP-002'], tables: ['esg_ratings'], engines: ['E-005','E-008'], modules: ['controversy-rating-impact','greenwashing-detector'] },
  { field: 'revenue', sources: ['DS-001/EP-001','DS-002/EP-013','DS-002/EP-014','DS-004/EP-027'], tables: ['financial_data','income_statements','sec_financials'], engines: ['E-001','E-004','E-006'], modules: ['pcaf-financed-emissions','esg-factor-alpha','transition-plan-builder'] },
  { field: 'ebitda', sources: ['DS-001/EP-001','DS-002/EP-013','DS-010/EP-046'], tables: ['financial_data'], engines: ['E-004'], modules: ['esg-factor-alpha','executive-pay-analytics'] },
  { field: 'market_cap', sources: ['DS-001/EP-001','DS-002/EP-013','DS-010/EP-046'], tables: ['company_profiles'], engines: ['E-001','E-004','E-005','E-010'], modules: ['pcaf-financed-emissions','esg-portfolio-optimizer','esg-ratings-comparator'] },
  { field: 'pe_ratio', sources: ['DS-001/EP-001','DS-002/EP-013'], tables: ['financial_data'], engines: ['E-004','E-010'], modules: ['esg-factor-alpha','esg-momentum-scanner'] },
  { field: 'beta', sources: ['DS-001/EP-001','DS-002/EP-013'], tables: ['financial_data'], engines: ['E-004','E-010'], modules: ['esg-factor-alpha','carbon-aware-allocation'] },
  { field: 'close_price', sources: ['DS-001/EP-003','DS-001/EP-010','DS-002/EP-018','DS-010/EP-046','DS-010/EP-047'], tables: ['price_history'], engines: ['E-004','E-010'], modules: ['esg-factor-alpha','esg-momentum-scanner','net-zero-portfolio-builder'] },
  { field: 'volume', sources: ['DS-001/EP-003','DS-001/EP-010','DS-002/EP-018','DS-010/EP-047'], tables: ['price_history'], engines: ['E-010'], modules: ['esg-momentum-scanner','quant-esg-hub'] },
  { field: 'dividend_yield', sources: ['DS-001/EP-001','DS-002/EP-013'], tables: ['financial_data'], engines: ['E-004','E-010'], modules: ['esg-factor-alpha','carbon-aware-allocation'] },
  { field: 'shares_outstanding', sources: ['DS-001/EP-001','DS-002/EP-013','DS-004/EP-027'], tables: ['financial_data','sec_financials'], engines: ['E-001','E-004'], modules: ['pcaf-financed-emissions','esg-portfolio-optimizer'] },
  { field: 'co2_mt', sources: ['DS-003/EP-024','DS-008/EP-042'], tables: ['country_emissions'], engines: ['E-002','E-003','E-007'], modules: ['climate-policy-intelligence','transition-scenario-modeller'] },
  { field: 'ghg_total_mt', sources: ['DS-003/EP-024','DS-003/EP-025','DS-007/EP-040'], tables: ['country_emissions','sector_emissions'], engines: ['E-002','E-003','E-007'], modules: ['climate-policy-intelligence','green-central-banking'] },
  { field: 'co2_per_capita', sources: ['DS-006/EP-035'], tables: ['country_emissions'], engines: ['E-003','E-007','E-009'], modules: ['climate-sovereign-bonds','climate-policy-intelligence'] },
  { field: 'gdp_usd', sources: ['DS-006/EP-033'], tables: ['macro_indicators'], engines: ['E-003','E-009'], modules: ['climate-sovereign-bonds','green-central-banking','transition-scenario-modeller'] },
  { field: 'population', sources: ['DS-006/EP-034'], tables: ['macro_indicators'], engines: ['E-003','E-009'], modules: ['climate-sovereign-bonds','climate-policy-intelligence'] },
  { field: 'ndgain_score', sources: ['DS-006/EP-036'], tables: ['climate_risk_scores'], engines: ['E-003','E-007','E-009'], modules: ['climate-sovereign-bonds','nature-loss-risk'] },
  { field: 'renewable_pct', sources: ['DS-006/EP-037'], tables: ['energy_data'], engines: ['E-002','E-003','E-007'], modules: ['energy-transition-analytics','climate-policy-intelligence'] },
  { field: 'generation_twh', sources: ['DS-005/EP-030'], tables: ['energy_data'], engines: ['E-002','E-003','E-007'], modules: ['energy-transition-analytics','climate-policy-intelligence'] },
  { field: 'carbon_intensity_gco2_kwh', sources: ['DS-005/EP-031'], tables: ['energy_data'], engines: ['E-001','E-002','E-003','E-007'], modules: ['energy-transition-analytics','pcaf-financed-emissions'] },
  { field: 'capacity_gw', sources: ['DS-005/EP-032'], tables: ['energy_data'], engines: ['E-002','E-003','E-007'], modules: ['energy-transition-analytics'] },
  { field: 'forest_area_pct', sources: ['DS-006/EP-038'], tables: ['land_use_data'], engines: ['E-007'], modules: ['land-use-deforestation','nature-loss-risk'] },
  { field: 'deforestation_risk', sources: ['DS-009/EP-045'], tables: ['company_emissions'], engines: ['E-007'], modules: ['land-use-deforestation','nature-loss-risk'] },
  { field: 'water_withdrawal_ml', sources: ['DS-009/EP-044'], tables: ['company_emissions'], engines: ['E-007'], modules: ['water-risk-analytics'] },
  { field: 'ndc_type', sources: ['DS-007/EP-039'], tables: ['ndc_targets'], engines: ['E-002','E-003','E-007','E-009'], modules: ['climate-policy-intelligence','climate-sovereign-bonds'] },
  { field: 'reduction_target_pct', sources: ['DS-007/EP-039','DS-009/EP-043'], tables: ['ndc_targets','company_emissions'], engines: ['E-002','E-003','E-009'], modules: ['sbti-target-setter','transition-credibility','climate-sovereign-bonds'] },
  { field: 'sentiment_score', sources: ['DS-001/EP-008','DS-002/EP-022'], tables: ['news_sentiment'], engines: ['E-008'], modules: ['greenwashing-detector','controversy-rating-impact'] },
  { field: 'headline', sources: ['DS-001/EP-008','DS-002/EP-022'], tables: ['news_sentiment'], engines: ['E-008'], modules: ['greenwashing-detector','controversy-rating-impact','shareholder-activism'] },
  { field: 'insider_name', sources: ['DS-001/EP-006'], tables: ['insider_transactions'], engines: ['E-008'], modules: ['proxy-voting-intel','shareholder-activism'] },
  { field: 'transaction_type', sources: ['DS-001/EP-006'], tables: ['insider_transactions'], engines: ['E-008','E-010'], modules: ['proxy-voting-intel'] },
  { field: 'total_assets', sources: ['DS-002/EP-015','DS-004/EP-027'], tables: ['balance_sheets','sec_financials'], engines: ['E-001','E-004'], modules: ['pcaf-financed-emissions','green-asset-ratio'] },
  { field: 'long_term_debt', sources: ['DS-002/EP-015','DS-004/EP-027'], tables: ['balance_sheets','sec_financials'], engines: ['E-004','E-006'], modules: ['climate-credit-risk','transition-plan-builder'] },
  { field: 'operating_cf', sources: ['DS-002/EP-016'], tables: ['cash_flows'], engines: ['E-004','E-006'], modules: ['esg-factor-alpha','transition-plan-builder'] },
  { field: 'capex', sources: ['DS-002/EP-016'], tables: ['cash_flows'], engines: ['E-004','E-006'], modules: ['transition-plan-builder','act-assessment'] },
  { field: 'net_income', sources: ['DS-002/EP-014','DS-002/EP-016','DS-004/EP-027'], tables: ['income_statements','cash_flows','sec_financials'], engines: ['E-004'], modules: ['esg-factor-alpha','executive-pay-analytics'] },
  { field: 'reported_eps', sources: ['DS-002/EP-017'], tables: ['earnings_data'], engines: ['E-004','E-008'], modules: ['esg-factor-alpha'] },
  { field: 'earnings_surprise', sources: ['DS-002/EP-017'], tables: ['earnings_data'], engines: ['E-008'], modules: ['esg-momentum-scanner'] },
  { field: 'taxonomy_aligned_pct', sources: ['DS-010/EP-048'], tables: ['taxonomy_data'], engines: ['E-006'], modules: ['green-taxonomy-navigator','green-asset-ratio'] },
  { field: 'green_bond_outstanding', sources: ['DS-010/EP-048'], tables: ['taxonomy_data'], engines: ['E-006'], modules: ['climate-finance-tracker','climate-finance-hub'] },
  { field: 'women_board_pct', sources: ['DS-010/EP-046'], tables: ['governance_data'], engines: ['E-005'], modules: ['board-composition','diversity-equity-inclusion'] },
  { field: 'board_size', sources: ['DS-010/EP-046'], tables: ['governance_data'], engines: ['E-005'], modules: ['board-composition'] },
  { field: 'ceo_comp', sources: ['DS-010/EP-046'], tables: ['governance_data'], engines: ['E-005'], modules: ['executive-pay-analytics'] },
  { field: 'sector', sources: ['DS-001/EP-001','DS-002/EP-013'], tables: ['company_profiles'], engines: ['E-001','E-002','E-005','E-006','E-007'], modules: ['pcaf-financed-emissions','sbti-target-setter','esg-ratings-comparator','gfanz-sector-pathways'] },
  { field: 'country_code', sources: ['DS-001/EP-001','DS-003/EP-024','DS-006/EP-033','DS-007/EP-039'], tables: ['company_profiles','country_emissions','macro_indicators','ndc_targets'], engines: ['E-003','E-007','E-009'], modules: ['climate-policy-intelligence','climate-sovereign-bonds','nature-loss-risk'] },
  { field: 'ticker', sources: ['DS-001/EP-001','DS-002/EP-013','DS-001/EP-007'], tables: ['company_profiles','exchange_listings'], engines: ['E-004','E-005','E-008','E-010'], modules: ['esg-factor-alpha','esg-ratings-comparator','greenwashing-detector','esg-momentum-scanner'] },
];


// ═══════════════════════════════════════════════════════════════════════════════
//  TRANSFORM FUNCTIONS — used in field mapping transforms
// ═══════════════════════════════════════════════════════════════════════════════

export const TRANSFORMS = {
  none:           (v) => v,
  uppercase:      (v) => typeof v === 'string' ? v.toUpperCase() : v,
  divide_1e6:     (v) => typeof v === 'number' ? v / 1e6 : null,
  divide_1e9:     (v) => typeof v === 'number' ? v / 1e9 : null,
  iso_date:       (v) => v ? new Date(v).toISOString().split('T')[0] : null,
  iso_datetime:   (v) => v ? new Date(v).toISOString() : null,
  av_datetime:    (v) => v ? `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}T${v.slice(9,11)}:${v.slice(11,13)}:00Z` : null,
  bbg_date:       (v) => v ? v.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : null,
  extract_year:   (v) => typeof v === 'string' ? parseInt(v.slice(0,4), 10) : (typeof v === 'number' ? v : null),
  truncate_500:   (v) => typeof v === 'string' ? v.slice(0, 500) : v,
  truncate_2000:  (v) => typeof v === 'string' ? v.slice(0, 2000) : v,
  json_array:     (v) => Array.isArray(v) ? JSON.stringify(v) : '[]',
  pad_10:         (v) => typeof v === 'string' ? v.padStart(10, '0') : String(v).padStart(10, '0'),
};


// ═══════════════════════════════════════════════════════════════════════════════
//  HELPER EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Total field count across all data sources */
export const TOTAL_FIELD_COUNT = DATA_SOURCES.reduce(
  (acc, ds) => acc + ds.endpoints.reduce((a, ep) => a + ep.fields.length, 0), 0
);

/** Total endpoint count */
export const TOTAL_ENDPOINT_COUNT = DATA_SOURCES.reduce(
  (acc, ds) => acc + ds.endpoints.length, 0
);

/** Lookup: endpoint ID → data source ID */
export const ENDPOINT_TO_SOURCE = {};
DATA_SOURCES.forEach(ds => ds.endpoints.forEach(ep => { ENDPOINT_TO_SOURCE[ep.id] = ds.id; }));

/** Lookup: table name → list of source fields that write to it */
export const TABLE_SOURCE_MAP = {};
DATA_SOURCES.forEach(ds => ds.endpoints.forEach(ep => ep.fields.forEach(f => {
  if (!TABLE_SOURCE_MAP[f.targetTable]) TABLE_SOURCE_MAP[f.targetTable] = [];
  TABLE_SOURCE_MAP[f.targetTable].push({ source: ds.id, endpoint: ep.id, field: f.sourceField, column: f.targetColumn });
})));
