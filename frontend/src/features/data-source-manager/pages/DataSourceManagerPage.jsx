import React,{useState,useMemo} from 'react';
import {AreaChart,Area,BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Source Registry','Field Mapper','Engine Lineage','Sync Monitor'];

/* ── DATA SOURCES ── */
const SOURCES=[
  {id:1,name:'EODHD (All-in-One)',slug:'eodhd',status:'Connected',type:'REST API',baseUrl:'api.eodhd.com',auth:'API Key',format:'JSON',rateLimit:'100K/day',ratePlan:'All-in-One',fieldCount:85,endpointCount:12,lastSync:'2026-03-29T08:15:00Z',syncSchedule:'hourly',freshness:98,errorCount:0,cost:'$79.99/mo',
    endpoints:['Fundamentals (Income)','Fundamentals (Balance Sheet)','Fundamentals (Cash Flow)','ESG Scores','Company Profile','Historical Prices (OHLCV)','Dividends','Splits','Insider Trading','Exchange Symbols','Sector/Industry','Options'],
    fields:['ticker','name','exchange','sector','industry','market_cap','employees','revenue','ebitda','net_income','total_assets','total_debt','total_equity','eps','pe_ratio','dividend_yield','book_value','roe','roa','current_ratio','gross_margin','operating_margin','esg_score','env_score','soc_score','gov_score','esg_controversy','open','high','low','close','adj_close','volume','div_amount','div_date','split_ratio','insider_name','insider_shares','insider_value','country','currency','ipo_date','description','logo_url','phone','address','city','state','zip','website','fiscal_year_end','beta','52w_high','52w_low','50d_avg','200d_avg','shares_outstanding','shares_float','short_ratio','short_pct','options_chain','options_expiry','options_strike','options_iv','news_title','news_sentiment','news_source','news_date','news_url','sector_pe','sector_roe','sector_growth','exchange_list','exchange_country','exchange_currency','hist_div_yield','hist_payout_ratio','cash_flow_ops','cash_flow_invest','cash_flow_finance','free_cash_flow','capex']},
  {id:2,name:'Alpha Vantage',slug:'alphavantage',status:'Connected',type:'REST API',baseUrl:'alphavantage.co',auth:'API Key',format:'JSON',rateLimit:'75/min',ratePlan:'Premium',fieldCount:60,endpointCount:11,lastSync:'2026-03-29T07:45:00Z',syncSchedule:'hourly',freshness:95,errorCount:1,cost:'$49.99/mo',
    endpoints:['TIME_SERIES_DAILY','OVERVIEW','INCOME_STATEMENT','BALANCE_SHEET','CASH_FLOW','EARNINGS','NEWS_SENTIMENT','REAL_GDP','CPI','TREASURY_YIELD','FEDERAL_FUNDS_RATE'],
    fields:['daily_open','daily_high','daily_low','daily_close','daily_volume','daily_adj_close','overview_name','overview_sector','overview_industry','overview_market_cap','overview_pe','overview_eps','overview_dividend','overview_beta','overview_52w_high','overview_52w_low','overview_50d_ma','overview_200d_ma','overview_shares','overview_book_value','is_revenue','is_gross_profit','is_operating_income','is_net_income','is_ebitda','is_interest_expense','is_tax_provision','bs_total_assets','bs_total_liabilities','bs_total_equity','bs_cash','bs_short_term_debt','bs_long_term_debt','bs_current_assets','bs_current_liabilities','cf_operating','cf_investing','cf_financing','cf_capex','cf_dividends_paid','cf_free_cash_flow','earn_reported_eps','earn_estimated_eps','earn_surprise','earn_surprise_pct','news_title','news_summary','news_sentiment_score','news_relevance','news_source','real_gdp','real_gdp_per_capita','cpi','cpi_monthly','treasury_yield_2y','treasury_yield_5y','treasury_yield_10y','treasury_yield_30y','fed_funds_rate','fed_funds_upper']},
  {id:3,name:'Climate TRACE',slug:'climatetrace',status:'Connected',type:'REST API',baseUrl:'api.climatetrace.org',auth:'None',format:'JSON',rateLimit:'Unlimited',ratePlan:'Free',fieldCount:25,endpointCount:3,lastSync:'2026-03-28T22:00:00Z',syncSchedule:'daily',freshness:92,errorCount:0,cost:'Free',
    endpoints:['Country emissions','Sector emissions','Facility emissions'],
    fields:['ct_country','ct_country_code','ct_sector','ct_subsector','ct_gas','ct_emissions_quantity','ct_emissions_unit','ct_year','ct_source','ct_confidence','ct_facility_name','ct_facility_lat','ct_facility_lon','ct_facility_capacity','ct_facility_fuel','ct_facility_owner','ct_reporting_entity','ct_verification','ct_scope','ct_methodology','ct_data_quality','ct_temporal_granularity','ct_update_frequency','ct_emissions_trend','ct_intensity']},
  {id:4,name:'EDGAR/SEC',slug:'edgar',status:'Connected',type:'REST API',baseUrl:'data.sec.gov',auth:'User-Agent',format:'JSON',rateLimit:'10/sec',ratePlan:'Free',fieldCount:40,endpointCount:3,lastSync:'2026-03-29T06:00:00Z',syncSchedule:'daily',freshness:88,errorCount:2,cost:'Free',
    endpoints:['Company facts','Filing submissions','XBRL data'],
    fields:['cik','entity_name','entity_type','sic','sic_description','ein','state_of_incorporation','fiscal_year_end','filing_date','form_type','filing_url','accession_number','primary_document','filing_description','xbrl_tag','xbrl_value','xbrl_unit','xbrl_period_start','xbrl_period_end','xbrl_instant','xbrl_dimension','xbrl_member','sec_revenue','sec_assets','sec_liabilities','sec_equity','sec_net_income','sec_eps','sec_shares','sec_cash','sec_debt','sec_goodwill','sec_intangibles','sec_ppe','sec_depreciation','sec_capex','sec_dividends','sec_buybacks','sec_compensation','sec_segment_revenue']},
  {id:5,name:'Ember Climate',slug:'ember',status:'Connected',type:'REST API',baseUrl:'ember-climate.org/data',auth:'None',format:'CSV/JSON',rateLimit:'Unlimited',ratePlan:'Free',fieldCount:20,endpointCount:3,lastSync:'2026-03-28T18:00:00Z',syncSchedule:'weekly',freshness:85,errorCount:0,cost:'Free',
    endpoints:['Electricity generation','Carbon intensity','Renewables share'],
    fields:['ember_country','ember_country_code','ember_year','ember_generation_twh','ember_coal_twh','ember_gas_twh','ember_oil_twh','ember_nuclear_twh','ember_hydro_twh','ember_wind_twh','ember_solar_twh','ember_other_re_twh','ember_carbon_intensity','ember_demand_twh','ember_net_imports','ember_renewables_share','ember_fossil_share','ember_clean_share','ember_per_capita_mwh','ember_emissions_mtco2']},
  {id:6,name:'World Bank Open Data',slug:'worldbank',status:'Connected',type:'REST API',baseUrl:'api.worldbank.org/v2',auth:'None',format:'JSON/XML',rateLimit:'Unlimited',ratePlan:'Free',fieldCount:50,endpointCount:5,lastSync:'2026-03-27T12:00:00Z',syncSchedule:'weekly',freshness:80,errorCount:0,cost:'Free',
    endpoints:['GDP','Population','CO2 per capita','ND-GAIN','WDI indicators'],
    fields:['wb_country','wb_country_code','wb_year','wb_gdp','wb_gdp_growth','wb_gdp_per_capita','wb_gni','wb_gni_per_capita','wb_population','wb_pop_growth','wb_urban_pct','wb_life_expectancy','wb_co2_per_capita','wb_co2_total','wb_methane','wb_n2o','wb_forest_area','wb_arable_land','wb_water_stress','wb_renewable_energy_pct','wb_electricity_access','wb_fossil_fuel_pct','wb_ndgain_score','wb_ndgain_vulnerability','wb_ndgain_readiness','wb_hdi','wb_gini','wb_poverty_rate','wb_unemployment','wb_inflation','wb_fdi_net','wb_trade_pct_gdp','wb_debt_pct_gdp','wb_reserves','wb_remittances','wb_tax_revenue','wb_education_expenditure','wb_health_expenditure','wb_military_expenditure','wb_r_and_d','wb_internet_users','wb_mobile_subscriptions','wb_patent_applications','wb_scientific_articles','wb_ease_business','wb_regulatory_quality','wb_rule_of_law','wb_control_corruption','wb_political_stability','wb_government_effectiveness']},
  {id:7,name:'UNFCCC',slug:'unfccc',status:'Connected',type:'REST API',baseUrl:'unfccc.int/process-and-meetings',auth:'None',format:'JSON',rateLimit:'Unlimited',ratePlan:'Free',fieldCount:15,endpointCount:3,lastSync:'2026-03-25T00:00:00Z',syncSchedule:'weekly',freshness:75,errorCount:0,cost:'Free',
    endpoints:['NDC registry','GHG data','Annex I/Non-Annex I'],
    fields:['unfccc_country','unfccc_party_type','unfccc_ndc_target','unfccc_ndc_year','unfccc_ndc_base_year','unfccc_ndc_reduction_pct','unfccc_ndc_conditional','unfccc_ghg_total','unfccc_ghg_co2','unfccc_ghg_ch4','unfccc_ghg_n2o','unfccc_ghg_fgas','unfccc_ghg_sector','unfccc_annex_type','unfccc_ratification_date']},
  {id:8,name:'IEA (via Ember proxy)',slug:'iea',status:'Partial',type:'REST API',baseUrl:'ember-climate.org/data/iea',auth:'None',format:'JSON',rateLimit:'Limited',ratePlan:'Free (proxy)',fieldCount:10,endpointCount:1,lastSync:'2026-03-20T00:00:00Z',syncSchedule:'monthly',freshness:60,errorCount:3,cost:'Free (limited)',
    endpoints:['Energy balances (subset)'],
    fields:['iea_country','iea_year','iea_tpes','iea_tfc','iea_electricity_output','iea_heat_output','iea_oil_consumption','iea_gas_consumption','iea_coal_consumption','iea_renewables_consumption']},
  {id:9,name:'CDP',slug:'cdp',status:'Pending',type:'REST API',baseUrl:'data.cdp.net',auth:'OAuth2',format:'JSON',rateLimit:'TBD',ratePlan:'Data License',fieldCount:0,endpointCount:2,lastSync:null,syncSchedule:'none',freshness:0,errorCount:0,cost:'License Required',
    endpoints:['Company scores','Climate change questionnaire'],
    fields:[]},
  {id:10,name:'Bloomberg Terminal',slug:'bloomberg',status:'Not Connected',type:'BQL/BPIPE',baseUrl:'bloomberg.com/professional',auth:'Enterprise SSO',format:'Proprietary',rateLimit:'Enterprise',ratePlan:'Enterprise',fieldCount:0,endpointCount:0,lastSync:null,syncSchedule:'none',freshness:0,errorCount:0,cost:'Enterprise License',
    endpoints:[],
    fields:[]},
];

/* ── DB TABLES ── */
const DB_TABLES=[
  {name:'company_profiles',columns:['ticker','name','sector','industry','country','market_cap','employees','revenue','description','website','currency','exchange','ipo_date','fiscal_year_end','logo_url','phone','address','city','state','zip','sic','sic_description','cik','entity_type']},
  {name:'company_emissions',columns:['entity_id','scope1','scope2','scope3','intensity','verification','year','methodology','source','confidence','sector','subsector','gas_type','facility_name','facility_lat','facility_lon','trend','data_quality']},
  {name:'esg_ratings',columns:['entity_id','esg_score','env_score','soc_score','gov_score','esg_controversy','rating_provider','rating_date','methodology_version']},
  {name:'financial_data',columns:['entity_id','period','revenue','gross_profit','ebitda','operating_income','net_income','eps','total_assets','total_liabilities','total_equity','cash','short_term_debt','long_term_debt','current_assets','current_liabilities','roe','roa','current_ratio','gross_margin','operating_margin','free_cash_flow','capex','dividends_paid','shares_outstanding','book_value']},
  {name:'price_data',columns:['entity_id','date','open','high','low','close','adj_close','volume','beta','52w_high','52w_low','50d_avg','200d_avg','dividend_yield','pe_ratio']},
  {name:'macro_indicators',columns:['country','country_code','year','gdp','gdp_growth','gdp_per_capita','population','co2_per_capita','co2_total','grid_intensity','renewables_share','fossil_share','electricity_generation','carbon_price','ndgain_score','ndgain_vulnerability','ndgain_readiness','forest_area','water_stress']},
  {name:'regulatory_filings',columns:['entity_id','cik','filing_date','form_type','accession_number','filing_url','primary_document','xbrl_tags','period_start','period_end','filing_description']},
];

/* ── FIELD MAPPINGS ── */
const FIELD_MAPPINGS=useMemoMappings();
function useMemoMappings(){
  const m=[];let id=0;
  const add=(src,srcField,table,col,transform='none')=>{m.push({id:++id,sourceSlug:src,sourceField:srcField,targetTable:table,targetColumn:col,transform,mapped:true});};
  // EODHD mappings
  add('eodhd','ticker','company_profiles','ticker');add('eodhd','name','company_profiles','name');
  add('eodhd','sector','company_profiles','sector');add('eodhd','industry','company_profiles','industry');
  add('eodhd','country','company_profiles','country');add('eodhd','market_cap','company_profiles','market_cap','numeric');
  add('eodhd','employees','company_profiles','employees','numeric');add('eodhd','revenue','financial_data','revenue','numeric');
  add('eodhd','ebitda','financial_data','ebitda','numeric');add('eodhd','net_income','financial_data','net_income','numeric');
  add('eodhd','total_assets','financial_data','total_assets','numeric');add('eodhd','total_equity','financial_data','total_equity','numeric');
  add('eodhd','eps','financial_data','eps','numeric');add('eodhd','roe','financial_data','roe','numeric');
  add('eodhd','roa','financial_data','roa','numeric');add('eodhd','current_ratio','financial_data','current_ratio','numeric');
  add('eodhd','gross_margin','financial_data','gross_margin','numeric');add('eodhd','operating_margin','financial_data','operating_margin','numeric');
  add('eodhd','open','price_data','open','numeric');add('eodhd','high','price_data','high','numeric');
  add('eodhd','low','price_data','low','numeric');add('eodhd','close','price_data','close','numeric');
  add('eodhd','adj_close','price_data','adj_close','numeric');add('eodhd','volume','price_data','volume','numeric');
  add('eodhd','esg_score','esg_ratings','esg_score','numeric');add('eodhd','env_score','esg_ratings','env_score','numeric');
  add('eodhd','soc_score','esg_ratings','soc_score','numeric');add('eodhd','gov_score','esg_ratings','gov_score','numeric');
  add('eodhd','esg_controversy','esg_ratings','esg_controversy','numeric');add('eodhd','pe_ratio','price_data','pe_ratio','numeric');
  add('eodhd','dividend_yield','price_data','dividend_yield','numeric');add('eodhd','book_value','financial_data','book_value','numeric');
  add('eodhd','beta','price_data','beta','numeric');add('eodhd','52w_high','price_data','52w_high','numeric');
  add('eodhd','52w_low','price_data','52w_low','numeric');add('eodhd','50d_avg','price_data','50d_avg','numeric');
  add('eodhd','200d_avg','price_data','200d_avg','numeric');add('eodhd','shares_outstanding','financial_data','shares_outstanding','numeric');
  add('eodhd','free_cash_flow','financial_data','free_cash_flow','numeric');add('eodhd','capex','financial_data','capex','numeric');
  add('eodhd','website','company_profiles','website');add('eodhd','currency','company_profiles','currency');
  add('eodhd','exchange','company_profiles','exchange');add('eodhd','ipo_date','company_profiles','ipo_date','date_parse');
  add('eodhd','description','company_profiles','description');add('eodhd','logo_url','company_profiles','logo_url');
  add('eodhd','fiscal_year_end','company_profiles','fiscal_year_end');
  // Alpha Vantage
  add('alphavantage','daily_open','price_data','open','numeric');add('alphavantage','daily_close','price_data','close','numeric');
  add('alphavantage','daily_volume','price_data','volume','numeric');add('alphavantage','overview_market_cap','company_profiles','market_cap','numeric');
  add('alphavantage','is_revenue','financial_data','revenue','numeric');add('alphavantage','is_net_income','financial_data','net_income','numeric');
  add('alphavantage','is_ebitda','financial_data','ebitda','numeric');add('alphavantage','bs_total_assets','financial_data','total_assets','numeric');
  add('alphavantage','bs_total_equity','financial_data','total_equity','numeric');add('alphavantage','cf_free_cash_flow','financial_data','free_cash_flow','numeric');
  add('alphavantage','real_gdp','macro_indicators','gdp','numeric');add('alphavantage','cpi','macro_indicators','gdp_growth','numeric');
  add('alphavantage','treasury_yield_10y','macro_indicators','gdp_per_capita','numeric');
  // Climate TRACE
  add('climatetrace','ct_country','company_emissions','entity_id');add('climatetrace','ct_emissions_quantity','company_emissions','scope1','numeric');
  add('climatetrace','ct_sector','company_emissions','sector');add('climatetrace','ct_verification','company_emissions','verification');
  add('climatetrace','ct_year','company_emissions','year','numeric');add('climatetrace','ct_intensity','company_emissions','intensity','numeric');
  add('climatetrace','ct_methodology','company_emissions','methodology');add('climatetrace','ct_confidence','company_emissions','confidence');
  add('climatetrace','ct_facility_name','company_emissions','facility_name');add('climatetrace','ct_facility_lat','company_emissions','facility_lat','numeric');
  add('climatetrace','ct_facility_lon','company_emissions','facility_lon','numeric');
  // EDGAR/SEC
  add('edgar','cik','company_profiles','cik');add('edgar','entity_name','company_profiles','name');
  add('edgar','sic','company_profiles','sic');add('edgar','sic_description','company_profiles','sic_description');
  add('edgar','entity_type','company_profiles','entity_type');add('edgar','filing_date','regulatory_filings','filing_date','date_parse');
  add('edgar','form_type','regulatory_filings','form_type');add('edgar','accession_number','regulatory_filings','accession_number');
  add('edgar','filing_url','regulatory_filings','filing_url');add('edgar','primary_document','regulatory_filings','primary_document');
  add('edgar','xbrl_tag','regulatory_filings','xbrl_tags');add('edgar','filing_description','regulatory_filings','filing_description');
  // Ember
  add('ember','ember_country','macro_indicators','country');add('ember','ember_country_code','macro_indicators','country_code');
  add('ember','ember_year','macro_indicators','year','numeric');add('ember','ember_carbon_intensity','macro_indicators','grid_intensity','numeric');
  add('ember','ember_renewables_share','macro_indicators','renewables_share','numeric');add('ember','ember_fossil_share','macro_indicators','fossil_share','numeric');
  add('ember','ember_generation_twh','macro_indicators','electricity_generation','numeric');
  // World Bank
  add('worldbank','wb_country','macro_indicators','country');add('worldbank','wb_country_code','macro_indicators','country_code');
  add('worldbank','wb_year','macro_indicators','year','numeric');add('worldbank','wb_gdp','macro_indicators','gdp','numeric');
  add('worldbank','wb_gdp_growth','macro_indicators','gdp_growth','numeric');add('worldbank','wb_gdp_per_capita','macro_indicators','gdp_per_capita','numeric');
  add('worldbank','wb_population','macro_indicators','population','numeric');add('worldbank','wb_co2_per_capita','macro_indicators','co2_per_capita','numeric');
  add('worldbank','wb_co2_total','macro_indicators','co2_total','numeric');add('worldbank','wb_ndgain_score','macro_indicators','ndgain_score','numeric');
  add('worldbank','wb_ndgain_vulnerability','macro_indicators','ndgain_vulnerability','numeric');add('worldbank','wb_ndgain_readiness','macro_indicators','ndgain_readiness','numeric');
  add('worldbank','wb_forest_area','macro_indicators','forest_area','numeric');add('worldbank','wb_water_stress','macro_indicators','water_stress','numeric');
  add('worldbank','wb_renewable_energy_pct','macro_indicators','renewables_share','numeric');
  // UNFCCC
  add('unfccc','unfccc_ghg_total','company_emissions','scope1','numeric');add('unfccc','unfccc_ghg_co2','company_emissions','scope2','numeric');
  add('unfccc','unfccc_ndc_reduction_pct','company_emissions','intensity','numeric');
  return m;
}

/* ── ENGINE CONSUMPTION MAP ── */
const ENGINES=[
  {id:'E-001',name:'PCAF Financed Emissions',consumes:['scope1','scope2','scope3','revenue','total_assets','total_equity','market_cap','grid_intensity','verification','methodology'],tables:['company_emissions','financial_data','macro_indicators']},
  {id:'E-002',name:'Temperature Score',consumes:['scope1','scope2','scope3','intensity','market_cap','revenue','ndgain_score'],tables:['company_emissions','financial_data','macro_indicators']},
  {id:'E-003',name:'Climate VaR',consumes:['carbon_price','scope1','scope2','revenue','total_assets','grid_intensity','gdp_growth'],tables:['company_emissions','financial_data','macro_indicators']},
  {id:'E-004',name:'Green Asset Ratio',consumes:['total_assets','total_equity','revenue','sector','esg_score','renewables_share'],tables:['financial_data','company_profiles','esg_ratings','macro_indicators']},
  {id:'E-005',name:'ESG Consensus',consumes:['esg_score','env_score','soc_score','gov_score','esg_controversy','sector','market_cap'],tables:['esg_ratings','company_profiles']},
  {id:'E-006',name:'WACI Calculator',consumes:['scope1','scope2','revenue','market_cap','adj_close','shares_outstanding'],tables:['company_emissions','financial_data','price_data']},
  {id:'E-007',name:'Scope 3 Estimator',consumes:['scope1','scope2','sector','industry','revenue','ebitda','employees'],tables:['company_emissions','company_profiles','financial_data']},
  {id:'E-008',name:'TCFD Alignment',consumes:['scope1','scope2','scope3','esg_score','filing_date','form_type','xbrl_tags'],tables:['company_emissions','esg_ratings','regulatory_filings']},
  {id:'E-009',name:'Sovereign Risk',consumes:['gdp','population','co2_per_capita','co2_total','ndgain_score','ndgain_vulnerability','ndgain_readiness','renewables_share','grid_intensity','forest_area','water_stress'],tables:['macro_indicators']},
  {id:'E-010',name:'Climate PD',consumes:['carbon_price','scope1','scope2','revenue','total_assets','total_debt','ebitda','grid_intensity','sector'],tables:['company_emissions','financial_data','macro_indicators','company_profiles']},
  {id:'E-011',name:'Carbon Footprint',consumes:['scope1','scope2','scope3','intensity','revenue','employees','sector','grid_intensity'],tables:['company_emissions','financial_data','company_profiles','macro_indicators']},
  {id:'E-012',name:'Transition Risk',consumes:['scope1','scope2','carbon_price','sector','industry','revenue','capex','renewables_share'],tables:['company_emissions','macro_indicators','company_profiles','financial_data']},
];

/* ── SYNC HISTORY ── */
const SYNC_HISTORY=(()=>{
  const h=[];
  SOURCES.filter(s=>s.status==='Connected'||s.status==='Partial').forEach(src=>{
    for(let d=0;d<30;d++){
      const success=sr(src.id*100+d)>0.08;
      const records=Math.round(sr(src.id*200+d)*5000+500);
      h.push({sourceId:src.id,sourceName:src.name,day:d,date:`2026-03-${String(29-d).padStart(2,'0')}`,status:success?'success':'failed',records:success?records:0,duration:+(sr(src.id*300+d)*12+1).toFixed(1),error:success?null:['Timeout after 30s','Rate limit exceeded','Auth token expired','Connection refused','Malformed response'][Math.floor(sr(src.id*400+d)*5)],retries:success?0:Math.floor(sr(src.id*500+d)*3+1)});
    }
  });
  return h;
})();

/* ── ALERTS CONFIG ── */
const ALERT_RULES=[
  {id:1,name:'Sync Failure Alert',condition:'sync_status = failed',threshold:1,action:'email',enabled:true},
  {id:2,name:'Stale Data Alert',condition:'freshness < 24h',threshold:24,action:'slack',enabled:true},
  {id:3,name:'Rate Limit Warning',condition:'rate_usage > 90%',threshold:90,action:'dashboard',enabled:true},
  {id:4,name:'Error Spike Alert',condition:'error_count > 5/hour',threshold:5,action:'email+slack',enabled:false},
  {id:5,name:'Data Quality Alert',condition:'null_rate > 10%',threshold:10,action:'dashboard',enabled:true},
];

export default function DataSourceManagerPage(){
  const[tab,setTab]=useState(0);
  // Tab 1 state
  const[selectedSource,setSelectedSource]=useState(null);
  const[sourceSearch,setSourceSearch]=useState('');
  const[statusFilter,setStatusFilter]=useState('All');
  const[showAddWizard,setShowAddWizard]=useState(false);
  const[wizardStep,setWizardStep]=useState(0);
  const[wizardData,setWizardData]=useState({name:'',type:'REST API',baseUrl:'',auth:'API Key',format:'JSON'});
  const[testingConnection,setTestingConnection]=useState(null);
  const[testResult,setTestResult]=useState(null);
  // Tab 2 state
  const[mapSource,setMapSource]=useState('eodhd');
  const[mapTable,setMapTable]=useState('company_profiles');
  const[mapSearch,setMapSearch]=useState('');
  const[showUnmappedOnly,setShowUnmappedOnly]=useState(false);
  const[validating,setValidating]=useState(false);
  const[validationResult,setValidationResult]=useState(null);
  // Tab 3 state
  const[engineFilter,setEngineFilter]=useState('All');
  const[lineageSource,setLineageSource]=useState('All');
  const[impactSource,setImpactSource]=useState(null);
  const[selectedField,setSelectedField]=useState(null);
  // Tab 4 state
  const[monitorSource,setMonitorSource]=useState('All');
  const[showAlertConfig,setShowAlertConfig]=useState(false);
  const[syncingSource,setSyncingSource]=useState(null);

  const filteredSources=useMemo(()=>{
    let s=SOURCES.filter(src=>src.name.toLowerCase().includes(sourceSearch.toLowerCase()));
    if(statusFilter!=='All')s=s.filter(src=>src.status===statusFilter);
    return s;
  },[sourceSearch,statusFilter]);

  const currentSource=useMemo(()=>SOURCES.find(s=>s.id===selectedSource),[selectedSource]);

  const mappingsForSource=useMemo(()=>{
    const src=SOURCES.find(s=>s.slug===mapSource);
    if(!src)return[];
    const mapped=FIELD_MAPPINGS.filter(m=>m.sourceSlug===mapSource);
    const allFields=src.fields.map(f=>{
      const mapping=mapped.find(m=>m.sourceField===f);
      return{field:f,mapping:mapping||null,mapped:!!mapping};
    });
    let result=allFields;
    if(showUnmappedOnly)result=result.filter(f=>!f.mapped);
    if(mapSearch)result=result.filter(f=>f.field.toLowerCase().includes(mapSearch.toLowerCase()));
    return result;
  },[mapSource,mapSearch,showUnmappedOnly]);

  const targetColumns=useMemo(()=>{
    const tbl=DB_TABLES.find(t=>t.name===mapTable);
    return tbl?tbl.columns:[];
  },[mapTable]);

  const coverageStats=useMemo(()=>{
    const tbl=DB_TABLES.find(t=>t.name===mapTable);
    if(!tbl)return{total:0,mapped:0,pct:0};
    const mappedCols=new Set(FIELD_MAPPINGS.filter(m=>m.targetTable===mapTable).map(m=>m.targetColumn));
    return{total:tbl.columns.length,mapped:mappedCols.size,pct:Math.round(mappedCols.size/tbl.columns.length*100)};
  },[mapTable]);

  const engineLineage=useMemo(()=>{
    let engines=ENGINES;
    if(engineFilter!=='All')engines=engines.filter(e=>e.id===engineFilter);
    if(lineageSource!=='All'){
      const srcMappings=FIELD_MAPPINGS.filter(m=>m.sourceSlug===lineageSource);
      const mappedCols=new Set(srcMappings.map(m=>m.targetColumn));
      engines=engines.filter(e=>e.consumes.some(c=>mappedCols.has(c)));
    }
    return engines;
  },[engineFilter,lineageSource]);

  const impactAnalysis=useMemo(()=>{
    if(!impactSource)return null;
    const srcMappings=FIELD_MAPPINGS.filter(m=>m.sourceSlug===impactSource);
    const mappedCols=new Set(srcMappings.map(m=>m.targetColumn));
    const affected=ENGINES.filter(e=>e.consumes.some(c=>mappedCols.has(c)));
    const critical=ENGINES.filter(e=>{const overlap=e.consumes.filter(c=>mappedCols.has(c));return overlap.length/e.consumes.length>0.5;});
    return{totalFields:srcMappings.length,affectedEngines:affected,criticalEngines:critical,mappedColumns:[...mappedCols]};
  },[impactSource]);

  const syncData=useMemo(()=>{
    let data=SYNC_HISTORY;
    if(monitorSource!=='All')data=data.filter(d=>d.sourceId===+monitorSource);
    return data;
  },[monitorSource]);

  const volumeChart=useMemo(()=>{
    const days=Array.from({length:30},(_,i)=>{
      const day=`03-${String(29-i).padStart(2,'0')}`;
      const dayData={day};
      SOURCES.filter(s=>s.status==='Connected'||s.status==='Partial').forEach(src=>{
        const entry=SYNC_HISTORY.find(h=>h.sourceId===src.id&&h.day===i);
        dayData[src.slug]=entry?entry.records:0;
      });
      return dayData;
    });
    return days.reverse();
  },[]);

  const rateLimits=useMemo(()=>[
    {source:'EODHD',used:Math.round(sr(42)*30000+55000),limit:100000,unit:'day'},
    {source:'Alpha Vantage',used:Math.round(sr(43)*20+45),limit:75,unit:'min'},
    {source:'EDGAR/SEC',used:Math.round(sr(44)*3+5),limit:10,unit:'sec'},
  ],[]);

  /* ── HELPERS ── */
  const doSort=(d,c,dir)=>[...d].sort((a,b)=>dir==='asc'?(a[c]>b[c]?1:-1):(a[c]<b[c]?1:-1));
  const csv=(data,fn)=>{const h=Object.keys(data[0]);const c=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([c],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
  const statusColor=(s)=>s==='Connected'?T.green:s==='Partial'?T.amber:s==='Pending'?T.gold:T.red;
  const statusDot=(s)=>(<span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:statusColor(s),marginRight:6}}/>);
  const kpi=(l,v,s,color)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,marginTop:4}}>{v}</div>{s&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{s}</div>}</div>);
  const badge=(text,bg,fg)=>(<span style={{display:'inline-block',padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,fontFamily:T.mono,background:bg,color:fg||'#fff',letterSpacing:0.3}}>{text}</span>);
  const btn=(label,onClick,primary,small)=>(<button onClick={onClick} style={{padding:small?'6px 12px':'8px 18px',background:primary?T.navy:T.surface,color:primary?'#fff':T.navy,border:`1px solid ${primary?T.navy:T.border}`,borderRadius:8,fontFamily:T.mono,fontSize:small?11:12,cursor:'pointer',fontWeight:600,letterSpacing:0.3}}>{label}</button>);

  const simulateTest=(srcId)=>{
    setTestingConnection(srcId);setTestResult(null);
    setTimeout(()=>{setTestingConnection(null);setTestResult({sourceId:srcId,success:sr(srcId*77)>0.15,latency:Math.round(sr(srcId*99)*400+80),message:sr(srcId*77)>0.15?'Connection successful':'Connection timed out'});},2000);
  };

  const simulateSync=(srcId)=>{
    setSyncingSource(srcId);
    setTimeout(()=>setSyncingSource(null),3000);
  };

  const simulateValidation=()=>{
    setValidating(true);setValidationResult(null);
    setTimeout(()=>{
      setValidating(false);
      const total=mappingsForSource.filter(f=>f.mapped).length;
      const warnings=Math.floor(sr(77)*3);const errors=Math.floor(sr(88)*2);
      setValidationResult({total,valid:total-warnings-errors,warnings,errors,
        issues:[
          ...(warnings>0?[{type:'warning',field:'market_cap',message:'Possible type mismatch: source is string, target is numeric'}]:[]),
          ...(warnings>1?[{type:'warning',field:'ipo_date',message:'Date format may need ISO 8601 conversion'}]:[]),
          ...(errors>0?[{type:'error',field:'shares_float',message:'Target column not found in table schema'}]:[]),
        ]});
    },1500);
  };

  /* ── TAB 1: SOURCE REGISTRY ── */
  const renderSourceRegistry=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Total Sources',SOURCES.length,'10 configured')}
      {kpi('Connected',SOURCES.filter(s=>s.status==='Connected').length+'/'+SOURCES.length,null,T.green)}
      {kpi('Total Fields',SOURCES.reduce((a,s)=>a+s.fieldCount,0),'across all sources')}
      {kpi('Mapped Fields',FIELD_MAPPINGS.length,'to DB tables',T.sage)}
      {kpi('Avg Freshness',Math.round(SOURCES.filter(s=>s.freshness>0).reduce((a,s)=>a+s.freshness,0)/SOURCES.filter(s=>s.freshness>0).length)+'%','data currency')}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <input value={sourceSearch} onChange={e=>setSourceSearch(e.target.value)} placeholder="Search sources..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
      <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
        {['All','Connected','Partial','Pending','Not Connected'].map(s=><option key={s}>{s}</option>)}
      </select>
      {btn('+ Add New Source',()=>{setShowAddWizard(true);setWizardStep(0);setWizardData({name:'',type:'REST API',baseUrl:'',auth:'API Key',format:'JSON'});},true)}
    </div>

    {/* Add Source Wizard */}
    {showAddWizard&&(<div style={{background:T.surface,border:`2px solid ${T.gold}`,borderRadius:12,padding:24,marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700,color:T.navy}}>Add New Data Source (Step {wizardStep+1}/4)</div>
        <button onClick={()=>setShowAddWizard(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.textMut}}>x</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {['Name & Type','Connection','Authentication','Review'].map((s,i)=>(<div key={i} style={{flex:1,padding:'6px 0',textAlign:'center',fontSize:11,fontFamily:T.mono,borderBottom:`2px solid ${i<=wizardStep?T.gold:T.border}`,color:i<=wizardStep?T.navy:T.textMut}}>{s}</div>))}
      </div>
      {wizardStep===0&&(<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div><label style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Source Name</label><input value={wizardData.name} onChange={e=>setWizardData({...wizardData,name:e.target.value})} style={{display:'block',width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,marginTop:4}} placeholder="e.g. My Custom API"/></div>
        <div><label style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Source Type</label><select value={wizardData.type} onChange={e=>setWizardData({...wizardData,type:e.target.value})} style={{display:'block',width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,marginTop:4}}>
          {['REST API','GraphQL','CSV Upload','Database','Manual Entry'].map(t=><option key={t}>{t}</option>)}
        </select></div>
      </div>)}
      {wizardStep===1&&(<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div><label style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Base URL</label><input value={wizardData.baseUrl} onChange={e=>setWizardData({...wizardData,baseUrl:e.target.value})} style={{display:'block',width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,marginTop:4}} placeholder="https://api.example.com"/></div>
        <div><label style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Response Format</label><select value={wizardData.format} onChange={e=>setWizardData({...wizardData,format:e.target.value})} style={{display:'block',width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,marginTop:4}}>
          {['JSON','XML','CSV','Parquet','Proprietary'].map(t=><option key={t}>{t}</option>)}
        </select></div>
      </div>)}
      {wizardStep===2&&(<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div><label style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Auth Method</label><select value={wizardData.auth} onChange={e=>setWizardData({...wizardData,auth:e.target.value})} style={{display:'block',width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,marginTop:4}}>
          {['API Key','OAuth2','Basic Auth','Bearer Token','None'].map(t=><option key={t}>{t}</option>)}
        </select></div>
        {wizardData.auth!=='None'&&<div style={{padding:12,background:T.surfaceH,borderRadius:8,fontSize:12,color:T.textSec,fontFamily:T.mono}}>Credential storage: AES-256 encrypted, Supabase Vault</div>}
      </div>)}
      {wizardStep===3&&(<div style={{fontSize:13,color:T.text}}>
        <div style={{marginBottom:8}}><span style={{fontFamily:T.mono,color:T.textSec}}>Name:</span> {wizardData.name||'(not set)'}</div>
        <div style={{marginBottom:8}}><span style={{fontFamily:T.mono,color:T.textSec}}>Type:</span> {wizardData.type}</div>
        <div style={{marginBottom:8}}><span style={{fontFamily:T.mono,color:T.textSec}}>URL:</span> {wizardData.baseUrl||'(not set)'}</div>
        <div style={{marginBottom:8}}><span style={{fontFamily:T.mono,color:T.textSec}}>Auth:</span> {wizardData.auth}</div>
        <div style={{marginBottom:8}}><span style={{fontFamily:T.mono,color:T.textSec}}>Format:</span> {wizardData.format}</div>
      </div>)}
      <div style={{display:'flex',gap:8,marginTop:16,justifyContent:'flex-end'}}>
        {wizardStep>0&&btn('Back',()=>setWizardStep(wizardStep-1))}
        {wizardStep<3?btn('Next',()=>setWizardStep(wizardStep+1),true):btn('Save Source',()=>setShowAddWizard(false),true)}
      </div>
    </div>)}

    {/* Source Grid */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320,1fr))',gap:16,marginBottom:20}}>
      {filteredSources.map(src=>(<div key={src.id} onClick={()=>setSelectedSource(selectedSource===src.id?null:src.id)} style={{background:T.surface,border:`1px solid ${selectedSource===src.id?T.gold:T.border}`,borderRadius:12,padding:20,cursor:'pointer',transition:'border-color 0.2s'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:700,color:T.navy}}>{src.name}</div><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginTop:2}}>{src.baseUrl}</div></div>
          <div>{badge(src.status,statusColor(src.status)+'20',statusColor(src.status))}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
          <div><span style={{color:T.textMut,fontFamily:T.mono}}>Type:</span> <span style={{color:T.text}}>{src.type}</span></div>
          <div><span style={{color:T.textMut,fontFamily:T.mono}}>Auth:</span> <span style={{color:T.text}}>{src.auth}</span></div>
          <div><span style={{color:T.textMut,fontFamily:T.mono}}>Fields:</span> <span style={{color:T.navy,fontWeight:600}}>{src.fieldCount}</span></div>
          <div><span style={{color:T.textMut,fontFamily:T.mono}}>Rate:</span> <span style={{color:T.text}}>{src.rateLimit}</span></div>
          <div><span style={{color:T.textMut,fontFamily:T.mono}}>Sync:</span> <span style={{color:T.text}}>{src.syncSchedule}</span></div>
          <div><span style={{color:T.textMut,fontFamily:T.mono}}>Cost:</span> <span style={{color:T.text}}>{src.cost}</span></div>
        </div>
        {src.lastSync&&<div style={{marginTop:10,fontSize:11,color:T.textMut,fontFamily:T.mono}}>Last sync: {new Date(src.lastSync).toLocaleString()}</div>}
        <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1,height:4,background:T.surfaceH,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${src.freshness}%`,background:src.freshness>80?T.green:src.freshness>50?T.amber:T.red,borderRadius:2}}/></div>
          <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{src.freshness}% fresh</span>
        </div>
      </div>))}
    </div>

    {/* Source Detail Panel */}
    {currentSource&&(<div style={{background:T.surface,border:`1px solid ${T.gold}`,borderRadius:12,padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{currentSource.name}</div><div style={{fontSize:12,color:T.textSec,marginTop:2}}>{currentSource.endpointCount} endpoints | {currentSource.fieldCount} fields | {currentSource.format} | {currentSource.auth}</div></div>
        <button onClick={()=>setSelectedSource(null)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.textMut}}>x</button>
      </div>

      {/* Endpoints */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,fontFamily:T.mono}}>ENDPOINTS</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {currentSource.endpoints.map((ep,i)=>(<div key={i} style={{padding:'4px 10px',background:T.surfaceH,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.text}}>{ep}</div>))}
        </div>
      </div>

      {/* Connection Test */}
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,padding:16,background:T.surfaceH,borderRadius:10}}>
        <button onClick={()=>simulateTest(currentSource.id)} disabled={testingConnection===currentSource.id} style={{padding:'8px 20px',background:testingConnection===currentSource.id?T.textMut:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:testingConnection===currentSource.id?'default':'pointer'}}>
          {testingConnection===currentSource.id?'Testing...':'Test Connection'}
        </button>
        {testingConnection===currentSource.id&&(<div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:T.textSec}}>
          <div style={{width:16,height:16,border:`2px solid ${T.gold}`,borderTop:`2px solid transparent`,borderRadius:'50%',animation:'spin 1s linear infinite'}}/>Connecting to {currentSource.baseUrl}...
        </div>)}
        {testResult&&testResult.sourceId===currentSource.id&&(<div style={{fontSize:12,color:testResult.success?T.green:T.red,fontWeight:600}}>
          {testResult.success?'\u2713':'x'} {testResult.message} ({testResult.latency}ms)
        </div>)}
      </div>

      {/* Sync Schedule */}
      <div style={{display:'flex',gap:16,marginBottom:20}}>
        <div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono,marginBottom:4}}>Sync Schedule</div>
          <select defaultValue={currentSource.syncSchedule} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
            {['hourly','daily','weekly','monthly','manual'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono,marginBottom:4}}>Error Count (30d)</div>
          <div style={{fontSize:20,fontWeight:700,color:currentSource.errorCount>0?T.red:T.green}}>{currentSource.errorCount}</div>
        </div>
        <div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono,marginBottom:4}}>Rate Limit</div>
          <div style={{fontSize:14,fontWeight:600,color:T.navy}}>{currentSource.rateLimit} ({currentSource.ratePlan})</div>
        </div>
      </div>

      {/* Error Log */}
      {currentSource.errorCount>0&&(<div style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,fontFamily:T.mono}}>RECENT ERRORS</div>
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12}}>
          {SYNC_HISTORY.filter(h=>h.sourceId===currentSource.id&&h.status==='failed').slice(0,3).map((e,i)=>(<div key={i} style={{fontSize:12,color:T.red,fontFamily:T.mono,marginBottom:4}}>
            [{e.date}] {e.error} (retried {e.retries}x)
          </div>))}
        </div>
      </div>)}

      {/* Fields Preview */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,fontFamily:T.mono}}>FIELDS ({currentSource.fields.length})</div>
        <div style={{maxHeight:200,overflowY:'auto',display:'flex',flexWrap:'wrap',gap:4}}>
          {currentSource.fields.map((f,i)=>{
            const isMapped=FIELD_MAPPINGS.some(m=>m.sourceSlug===currentSource.slug&&m.sourceField===f);
            return(<div key={i} style={{padding:'3px 8px',background:isMapped?T.green+'15':T.amber+'15',border:`1px solid ${isMapped?T.green+'40':T.amber+'40'}`,borderRadius:4,fontSize:10,fontFamily:T.mono,color:isMapped?T.green:T.amber}}>{f}</div>);
          })}
        </div>
      </div>

      {/* Data Quality Summary */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,fontFamily:T.mono}}>DATA QUALITY SUMMARY</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,color:T.green}}>{Math.round(sr(currentSource.id*111)*10+88)}%</div>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>Completeness</div>
          </div>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,color:T.sage}}>{(sr(currentSource.id*113)*3+0.5).toFixed(1)}%</div>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>Null Rate</div>
          </div>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,color:T.navy}}>{Math.round(sr(currentSource.id*117)*5000+10000)}</div>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>Records</div>
          </div>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,color:sr(currentSource.id*119)>0.5?T.green:T.amber}}>{sr(currentSource.id*119)>0.5?'PASS':'WARN'}</div>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>Validation</div>
          </div>
        </div>
      </div>

      {/* Sync History Mini-Chart */}
      <div>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,fontFamily:T.mono}}>SYNC HISTORY (30 DAYS)</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={SYNC_HISTORY.filter(h=>h.sourceId===currentSource.id).slice(0,30).reverse()}>
            <XAxis dataKey="date" tick={{fontSize:8,fill:T.textMut}} interval={5}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}} tickFormatter={fmt}/>
            <Tooltip {...tip}/>
            <Bar dataKey="records" name="Records">{SYNC_HISTORY.filter(h=>h.sourceId===currentSource.id).slice(0,30).reverse().map((h,i)=><Cell key={i} fill={h.status==='success'?T.sage:T.red}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>)}

    {/* Source Comparison Table */}
    <div style={{marginTop:20,overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.mono}}>SOURCE COMPARISON MATRIX</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
        <thead><tr>
          {['Source','Status','Type','Fields','Endpoints','Rate Limit','Auth','Format','Freshness','Cost'].map(h=>(<th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:10,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,background:T.surfaceH,whiteSpace:'nowrap'}}>{h}</th>))}
        </tr></thead>
        <tbody>
          {filteredSources.map((src,i)=>(<tr key={src.id} onClick={()=>setSelectedSource(selectedSource===src.id?null:src.id)} style={{cursor:'pointer',background:selectedSource===src.id?T.surfaceH:i%2===0?T.surface:'#fafaf8',borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'8px 12px',fontWeight:600,color:T.navy}}>{src.name}</td>
            <td style={{padding:'8px 12px'}}>{statusDot(src.status)}<span style={{fontSize:11}}>{src.status}</span></td>
            <td style={{padding:'8px 12px',fontFamily:T.mono,fontSize:11,color:T.textSec}}>{src.type}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:600,color:T.navy}}>{src.fieldCount}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.textSec}}>{src.endpointCount}</td>
            <td style={{padding:'8px 12px',fontSize:11,fontFamily:T.mono}}>{src.rateLimit}</td>
            <td style={{padding:'8px 12px'}}>{badge(src.auth,T.navyL+'15',T.navyL)}</td>
            <td style={{padding:'8px 12px',fontSize:11,fontFamily:T.mono,color:T.textSec}}>{src.format}</td>
            <td style={{padding:'8px 12px'}}><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:40,height:4,background:T.surfaceH,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${src.freshness}%`,background:src.freshness>80?T.green:src.freshness>50?T.amber:T.red}}/></div><span style={{fontSize:10,fontFamily:T.mono}}>{src.freshness}%</span></div></td>
            <td style={{padding:'8px 12px',fontSize:11,color:src.cost==='Free'?T.green:T.text}}>{src.cost}</td>
          </tr>))}
        </tbody>
      </table>
    </div>

    {/* Source Distribution Charts */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fields per Source</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={SOURCES.filter(s=>s.fieldCount>0).map(s=>({name:s.name.split(' ')[0],fields:s.fieldCount,mapped:FIELD_MAPPINGS.filter(m=>m.sourceSlug===s.slug).length}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip {...tip}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="fields" name="Total Fields" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar dataKey="mapped" name="Mapped" fill={T.green} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Source Status Distribution</div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={[
              {name:'Connected',value:SOURCES.filter(s=>s.status==='Connected').length,fill:T.green},
              {name:'Partial',value:SOURCES.filter(s=>s.status==='Partial').length,fill:T.amber},
              {name:'Pending',value:SOURCES.filter(s=>s.status==='Pending').length,fill:T.gold},
              {name:'Not Connected',value:SOURCES.filter(s=>s.status==='Not Connected').length,fill:T.red},
            ].filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,value})=>`${name}: ${value}`}>
              {[T.green,T.amber,T.gold,T.red].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip {...tip}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>);

  /* ── TAB 2: FIELD MAPPER ── */
  const renderFieldMapper=()=>{
    const src=SOURCES.find(s=>s.slug===mapSource);
    const totalSourceFields=src?src.fields.length:0;
    const mappedCount=mappingsForSource.filter(f=>f.mapped).length;
    return(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Source Fields',totalSourceFields,src?.name)}
      {kpi('Mapped',mappedCount+'/'+totalSourceFields,Math.round(mappedCount/totalSourceFields*100)+'% coverage',T.green)}
      {kpi('Unmapped',totalSourceFields-mappedCount,'need attention',totalSourceFields-mappedCount>0?T.amber:T.green)}
      {kpi('Target Coverage',coverageStats.pct+'%',`${coverageStats.mapped}/${coverageStats.total} columns in ${mapTable}`)}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <div>
        <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:6}}>Source:</label>
        <select value={mapSource} onChange={e=>{setMapSource(e.target.value);setMapSearch('');}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
          {SOURCES.filter(s=>s.fields.length>0).map(s=><option key={s.slug} value={s.slug}>{s.name} ({s.fieldCount})</option>)}
        </select>
      </div>
      <div>
        <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:6}}>Target Table:</label>
        <select value={mapTable} onChange={e=>setMapTable(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
          {DB_TABLES.map(t=><option key={t.name} value={t.name}>{t.name} ({t.columns.length} cols)</option>)}
        </select>
      </div>
      <input value={mapSearch} onChange={e=>setMapSearch(e.target.value)} placeholder="Filter fields..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:180}}/>
      <label style={{fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
        <input type="checkbox" checked={showUnmappedOnly} onChange={e=>setShowUnmappedOnly(e.target.checked)}/>Unmapped only
      </label>
      <div style={{marginLeft:'auto',display:'flex',gap:8}}>
        {btn(validating?'Validating...':'Validate Mapping',simulateValidation,true)}
        {btn('Auto-Map Suggestions',()=>{},false)}
      </div>
    </div>

    {/* Validation Result */}
    {validationResult&&(<div style={{marginBottom:16,padding:16,background:validationResult.errors>0?'#fef2f2':validationResult.warnings>0?'#fffbeb':'#f0fdf4',border:`1px solid ${validationResult.errors>0?'#fecaca':validationResult.warnings>0?'#fde68a':'#bbf7d0'}`,borderRadius:10}}>
      <div style={{fontSize:13,fontWeight:700,color:validationResult.errors>0?T.red:validationResult.warnings>0?T.amber:T.green,marginBottom:8}}>
        Validation: {validationResult.valid}/{validationResult.total} valid | {validationResult.warnings} warnings | {validationResult.errors} errors
      </div>
      {validationResult.issues.map((issue,i)=>(<div key={i} style={{fontSize:12,fontFamily:T.mono,color:issue.type==='error'?T.red:T.amber,marginBottom:4}}>
        [{issue.type.toUpperCase()}] {issue.field}: {issue.message}
      </div>))}
    </div>)}

    {/* Coverage Bar per Target Table */}
    <div style={{marginBottom:20,display:'flex',gap:8,flexWrap:'wrap'}}>
      {DB_TABLES.map(tbl=>{
        const mc=new Set(FIELD_MAPPINGS.filter(m=>m.targetTable===tbl.name).map(m=>m.targetColumn));
        const pct=Math.round(mc.size/tbl.columns.length*100);
        return(<div key={tbl.name} style={{background:T.surface,border:`1px solid ${mapTable===tbl.name?T.gold:T.border}`,borderRadius:8,padding:'8px 12px',cursor:'pointer',minWidth:140}} onClick={()=>setMapTable(tbl.name)}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:4}}>{tbl.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{flex:1,height:4,background:T.surfaceH,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:pct>80?T.green:pct>50?T.gold:T.red,borderRadius:2}}/></div>
            <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{pct}%</span>
          </div>
        </div>);
      })}
    </div>

    {/* Mapping Table */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 40px 1fr',gap:0,marginBottom:20}}>
      {/* Left: Source Fields */}
      <div style={{border:`1px solid ${T.border}`,borderRadius:'10px 0 0 10px',background:T.surface,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',background:T.surfaceH,borderBottom:`1px solid ${T.border}`,fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>SOURCE: {src?.name?.toUpperCase()}</div>
        <div style={{maxHeight:500,overflowY:'auto'}}>
          {mappingsForSource.map((f,i)=>(<div key={i} style={{padding:'8px 14px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:f.mapped?'transparent':T.amber+'08'}}>
            <div style={{fontSize:12,fontFamily:T.mono,color:f.mapped?T.text:T.amber}}>{f.field}</div>
            {f.mapping&&<div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,background:T.surfaceH,padding:'2px 6px',borderRadius:4}}>{f.mapping.transform}</div>}
            {!f.mapped&&badge('UNMAPPED',T.amber+'20',T.amber)}
          </div>))}
        </div>
      </div>

      {/* Center: Arrows */}
      <div style={{display:'flex',flexDirection:'column',justifyContent:'flex-start',alignItems:'center',paddingTop:50}}>
        {mappingsForSource.filter(f=>f.mapped).slice(0,20).map((_,i)=>(<div key={i} style={{fontSize:12,color:T.gold,lineHeight:'36.5px',fontFamily:T.mono}}>{'\u2192'}</div>))}
      </div>

      {/* Right: Target Columns */}
      <div style={{border:`1px solid ${T.border}`,borderRadius:'0 10px 10px 0',background:T.surface,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',background:T.surfaceH,borderBottom:`1px solid ${T.border}`,fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>TARGET: {mapTable.toUpperCase()}</div>
        <div style={{maxHeight:500,overflowY:'auto'}}>
          {targetColumns.map((col,i)=>{
            const mapping=FIELD_MAPPINGS.find(m=>m.targetTable===mapTable&&m.targetColumn===col);
            const hasMapping=!!mapping;
            return(<div key={i} style={{padding:'8px 14px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:hasMapping?'transparent':T.amber+'08'}}>
              <div style={{fontSize:12,fontFamily:T.mono,color:hasMapping?T.text:T.textMut}}>{col}</div>
              {hasMapping?badge(mapping.sourceSlug,T.green+'20',T.green):badge('NO SOURCE',T.surfaceH,T.textMut)}
            </div>);
          })}
        </div>
      </div>
    </div>

    {/* Detailed Mapping Table */}
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
        <thead><tr>
          {['Source Field','Transform','Target Table','Target Column','Status'].map(h=>(<th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{h}</th>))}
        </tr></thead>
        <tbody>
          {mappingsForSource.slice(0,25).map((f,i)=>(<tr key={i} style={{background:i%2===0?T.surface:'#fafaf8'}}>
            <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.navy,fontWeight:600}}>{f.field}</td>
            <td style={{padding:'8px 12px'}}>{f.mapping?<select defaultValue={f.mapping.transform} style={{padding:'4px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.mono,background:T.surface}}>
              {['none','numeric','uppercase','lowercase','date_parse','unit_convert','boolean','trim','json_extract'].map(t=><option key={t}>{t}</option>)}
            </select>:<span style={{color:T.textMut}}>-</span>}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.textSec}}>{f.mapping?f.mapping.targetTable:'-'}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.text}}>{f.mapping?f.mapping.targetColumn:'-'}</td>
            <td style={{padding:'8px 12px'}}>{f.mapped?badge('MAPPED',T.green+'20',T.green):badge('UNMAPPED',T.amber+'20',T.amber)}</td>
          </tr>))}
        </tbody>
      </table>
    </div>

    {/* Cross-Source Mapping Matrix */}
    <div style={{marginTop:20,overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.mono}}>CROSS-SOURCE MAPPING MATRIX</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr>
          <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Target Table</th>
          {SOURCES.filter(s=>s.fieldCount>0).map(s=>(<th key={s.slug} style={{padding:'8px 12px',textAlign:'center',fontSize:9,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH,whiteSpace:'nowrap'}}>{s.name.split(' ')[0]}</th>))}
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Total</th>
        </tr></thead>
        <tbody>
          {DB_TABLES.map((tbl,ti)=>{
            const rowTotal=FIELD_MAPPINGS.filter(m=>m.targetTable===tbl.name).length;
            return(<tr key={tbl.name} style={{background:ti%2===0?T.surface:'#fafaf8',borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:600,color:T.navy}}>{tbl.name}</td>
              {SOURCES.filter(s=>s.fieldCount>0).map(s=>{
                const count=FIELD_MAPPINGS.filter(m=>m.sourceSlug===s.slug&&m.targetTable===tbl.name).length;
                return(<td key={s.slug} style={{padding:'8px 12px',textAlign:'center',fontFamily:T.mono,color:count>0?T.navy:T.textMut,fontWeight:count>0?600:400}}>{count>0?count:'-'}</td>);
              })}
              <td style={{padding:'8px 12px',textAlign:'center',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{rowTotal}</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>

    {/* Auto-Map Suggestions */}
    <div style={{marginTop:20,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>AUTO-MAP SUGGESTIONS</div>
      <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Based on field name similarity analysis, the following unmapped fields have suggested mappings:</div>
      <div style={{display:'grid',gap:8}}>
        {[
          {sourceField:'news_title',source:'eodhd',suggestedTable:'company_profiles',suggestedCol:'description',confidence:45},
          {sourceField:'short_ratio',source:'eodhd',suggestedTable:'price_data',suggestedCol:'beta',confidence:30},
          {sourceField:'insider_name',source:'eodhd',suggestedTable:'company_profiles',suggestedCol:'name',confidence:25},
          {sourceField:'options_iv',source:'eodhd',suggestedTable:'price_data',suggestedCol:'adj_close',confidence:20},
          {sourceField:'news_sentiment_score',source:'alphavantage',suggestedTable:'esg_ratings',suggestedCol:'esg_score',confidence:35},
          {sourceField:'earn_surprise_pct',source:'alphavantage',suggestedTable:'financial_data',suggestedCol:'eps',confidence:40},
        ].map((s,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:T.surfaceH,borderRadius:8}}>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.navy,fontWeight:600,minWidth:160}}>{s.sourceField}</span>
          <span style={{fontSize:12,color:T.gold}}>{'\u2192'}</span>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>{s.suggestedTable}.{s.suggestedCol}</span>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:60,height:4,background:T.border,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${s.confidence}%`,background:s.confidence>50?T.green:s.confidence>30?T.amber:T.red}}/></div>
            <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{s.confidence}%</span>
            {btn('Accept',()=>{},true,true)}
            {btn('Skip',()=>{},false,true)}
          </div>
        </div>))}
      </div>
    </div>

    {/* Mapping Statistics Charts */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Transform Distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={[
              {name:'none',value:FIELD_MAPPINGS.filter(m=>m.transform==='none').length},
              {name:'numeric',value:FIELD_MAPPINGS.filter(m=>m.transform==='numeric').length},
              {name:'date_parse',value:FIELD_MAPPINGS.filter(m=>m.transform==='date_parse').length},
            ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: ${value}`}>
              <Cell fill={T.navy}/><Cell fill={T.gold}/><Cell fill={T.sage}/>
            </Pie>
            <Tooltip {...tip}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Coverage by Target Table</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DB_TABLES.map(tbl=>{const mc=new Set(FIELD_MAPPINGS.filter(m=>m.targetTable===tbl.name).map(m=>m.targetColumn));return{name:tbl.name.replace('_',' '),coverage:Math.round(mc.size/tbl.columns.length*100),total:tbl.columns.length,mapped:mc.size};})}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} unit="%"/>
            <Tooltip {...tip}/>
            <Bar dataKey="coverage" name="Coverage %">{DB_TABLES.map((t,i)=>{const mc=new Set(FIELD_MAPPINGS.filter(m=>m.targetTable===t.name).map(m=>m.targetColumn));const pct=Math.round(mc.size/t.columns.length*100);return <Cell key={i} fill={pct>80?T.green:pct>50?T.gold:T.red}/>;})}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>);};

  /* ── TAB 3: ENGINE LINEAGE ── */
  const renderEngineLineage=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Engines',ENGINES.length,'calculation engines')}
      {kpi('Fields Consumed',new Set(ENGINES.flatMap(e=>e.consumes)).size,'unique fields')}
      {kpi('Tables Referenced',new Set(ENGINES.flatMap(e=>e.tables)).size,'DB tables')}
      {kpi('Avg Dependencies',Math.round(ENGINES.reduce((a,e)=>a+e.consumes.length,0)/ENGINES.length),'fields per engine')}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <div>
        <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:6}}>Engine:</label>
        <select value={engineFilter} onChange={e=>setEngineFilter(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
          <option value="All">All Engines</option>
          {ENGINES.map(e=><option key={e.id} value={e.id}>{e.id} {e.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:6}}>Source:</label>
        <select value={lineageSource} onChange={e=>setLineageSource(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
          <option value="All">All Sources</option>
          {SOURCES.filter(s=>s.fields.length>0).map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:6}}>Impact Analysis:</label>
        <select value={impactSource||''} onChange={e=>setImpactSource(e.target.value||null)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
          <option value="">Select source...</option>
          {SOURCES.filter(s=>s.status==='Connected'||s.status==='Partial').map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
    </div>

    {/* Impact Analysis Panel */}
    {impactAnalysis&&(<div style={{marginBottom:20,padding:20,background:'#fef2f2',border:`1px solid #fecaca`,borderRadius:12}}>
      <div style={{fontSize:14,fontWeight:700,color:T.red,marginBottom:12}}>Impact Analysis: What breaks if {SOURCES.find(s=>s.slug===impactSource)?.name} goes down?</div>
      <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{padding:'8px 16px',background:'#fff',borderRadius:8,border:'1px solid #fecaca'}}>
          <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Fields Lost</div>
          <div style={{fontSize:22,fontWeight:700,color:T.red}}>{impactAnalysis.totalFields}</div>
        </div>
        <div style={{padding:'8px 16px',background:'#fff',borderRadius:8,border:'1px solid #fecaca'}}>
          <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Engines Affected</div>
          <div style={{fontSize:22,fontWeight:700,color:T.amber}}>{impactAnalysis.affectedEngines.length}</div>
        </div>
        <div style={{padding:'8px 16px',background:'#fff',borderRadius:8,border:'1px solid #fecaca'}}>
          <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Critical (&gt;50% deps)</div>
          <div style={{fontSize:22,fontWeight:700,color:T.red}}>{impactAnalysis.criticalEngines.length}</div>
        </div>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {impactAnalysis.affectedEngines.map(e=>{
          const isCritical=impactAnalysis.criticalEngines.some(c=>c.id===e.id);
          return(<div key={e.id} style={{padding:'6px 12px',background:isCritical?T.red+'15':'#fff',border:`1px solid ${isCritical?T.red+'40':T.border}`,borderRadius:8,fontSize:12}}>
            <span style={{fontFamily:T.mono,color:isCritical?T.red:T.navy,fontWeight:600}}>{e.id}</span>
            <span style={{color:T.textSec,marginLeft:6}}>{e.name}</span>
            {isCritical&&<span style={{marginLeft:6,fontSize:10,color:T.red,fontWeight:700}}>CRITICAL</span>}
          </div>);
        })}
      </div>
    </div>)}

    {/* Lineage Flow */}
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>DATA LINEAGE: SOURCE {'\u2192'} FIELD {'\u2192'} TABLE {'\u2192'} ENGINE</div>
      {engineLineage.map(engine=>(<div key={engine.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:16,marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <span style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{engine.id}</span>
            <span style={{fontSize:14,fontWeight:600,color:T.text,marginLeft:8}}>{engine.name}</span>
          </div>
          <div style={{display:'flex',gap:4}}>
            {engine.tables.map(t=>badge(t,T.navyL+'15',T.navyL))}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250,1fr))',gap:8}}>
          {engine.consumes.map((field,fi)=>{
            const mapping=FIELD_MAPPINGS.find(m=>m.targetColumn===field);
            const source=mapping?SOURCES.find(s=>s.slug===mapping.sourceSlug):null;
            const quality=Math.round(sr(fi*engine.id.charCodeAt(2)+37)*30+70);
            const nullRate=+(sr(fi*engine.id.charCodeAt(2)+41)*8).toFixed(1);
            return(<div key={fi} onClick={()=>setSelectedField(selectedField===field?null:field)} style={{padding:'8px 12px',background:T.surfaceH,borderRadius:8,cursor:'pointer',border:`1px solid ${selectedField===field?T.gold:T.surfaceH}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontFamily:T.mono,color:T.navy,fontWeight:600}}>{field}</span>
                <span style={{fontSize:10,color:quality>85?T.green:quality>70?T.amber:T.red}}>{quality}%</span>
              </div>
              <div style={{fontSize:10,color:T.textMut,marginTop:2}}>
                {source?`${source.name} \u2192 ${mapping.targetTable}`:'No source mapped'}
              </div>
              {selectedField===field&&(<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,fontSize:11}}>
                <div style={{color:T.textSec}}>Null rate: <span style={{color:nullRate>5?T.amber:T.green,fontWeight:600}}>{nullRate}%</span></div>
                <div style={{color:T.textSec}}>Transform: <span style={{fontFamily:T.mono}}>{mapping?.transform||'none'}</span></div>
                <div style={{color:T.textSec}}>Completeness: <span style={{color:T.green,fontWeight:600}}>{quality}%</span></div>
                <div style={{color:T.textSec}}>Last validated: 2026-03-{String(28-Math.floor(sr(fi*13)*5)).padStart(2,'0')}</div>
              </div>)}
            </div>);
          })}
        </div>
      </div>))}
    </div>

    {/* Field Dependencies Chart */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fields per Engine</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ENGINES.map(e=>({name:e.id,fields:e.consumes.length,tables:e.tables.length}))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec,fontFamily:'JetBrains Mono'}} width={50}/>
            <Tooltip {...tip}/>
            <Bar dataKey="fields" name="Fields" fill={T.navy} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Source Contribution to Engines</div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={SOURCES.filter(s=>s.fieldCount>0).map((s,i)=>{
              const engineCount=ENGINES.filter(e=>{
                const srcMappings=FIELD_MAPPINGS.filter(m=>m.sourceSlug===s.slug);
                const mappedCols=new Set(srcMappings.map(m=>m.targetColumn));
                return e.consumes.some(c=>mappedCols.has(c));
              }).length;
              return{name:s.name.split(' ')[0],value:engineCount,fill:CC[i%CC.length]};
            })} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}`}>
              {SOURCES.filter(s=>s.fieldCount>0).map((s,i)=>(<Cell key={i} fill={CC[i%CC.length]}/>))}
            </Pie>
            <Tooltip {...tip}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Engine Detail Table */}
    <div style={{marginTop:20,overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.mono}}>ENGINE DEPENDENCY MATRIX</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr>
          <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Engine</th>
          <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Name</th>
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Fields</th>
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Tables</th>
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Sources</th>
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Data Quality</th>
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Redundancy</th>
          <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Critical Fields</th>
        </tr></thead>
        <tbody>
          {ENGINES.map((engine,ei)=>{
            const uniqueSources=new Set();
            engine.consumes.forEach(field=>{
              const m=FIELD_MAPPINGS.find(fm=>fm.targetColumn===field);
              if(m)uniqueSources.add(m.sourceSlug);
            });
            const quality=Math.round(sr(ei*71)*15+82);
            const redundancy=engine.consumes.filter(f=>FIELD_MAPPINGS.filter(m=>m.targetColumn===f).length>1).length;
            return(<tr key={engine.id} style={{background:ei%2===0?T.surface:'#fafaf8',borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{engine.id}</td>
              <td style={{padding:'8px 12px',fontWeight:600,color:T.text}}>{engine.name}</td>
              <td style={{padding:'8px 12px',textAlign:'center',fontFamily:T.mono}}>{engine.consumes.length}</td>
              <td style={{padding:'8px 12px',textAlign:'center',fontFamily:T.mono}}>{engine.tables.length}</td>
              <td style={{padding:'8px 12px',textAlign:'center',fontFamily:T.mono}}>{uniqueSources.size}</td>
              <td style={{padding:'8px 12px',textAlign:'center'}}><span style={{color:quality>90?T.green:quality>80?T.gold:T.red,fontWeight:600,fontFamily:T.mono}}>{quality}%</span></td>
              <td style={{padding:'8px 12px',textAlign:'center'}}>{redundancy>0?badge(`${redundancy} fields`,T.green+'20',T.green):badge('none',T.amber+'20',T.amber)}</td>
              <td style={{padding:'8px 12px',fontSize:10,fontFamily:T.mono,color:T.textSec}}>{engine.consumes.slice(0,3).join(', ')}{engine.consumes.length>3?` +${engine.consumes.length-3}`:''}</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>

    {/* Single Point of Failure Analysis */}
    <div style={{marginTop:20,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>SINGLE POINT OF FAILURE ANALYSIS</div>
      <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Fields that have only one data source and feed critical engines:</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300,1fr))',gap:8}}>
        {['carbon_price','grid_intensity','esg_controversy','ndgain_score','ndgain_vulnerability','water_stress','forest_area'].map((field,i)=>{
          const mappings=FIELD_MAPPINGS.filter(m=>m.targetColumn===field);
          const engines=ENGINES.filter(e=>e.consumes.includes(field));
          const source=mappings.length>0?SOURCES.find(s=>s.slug===mappings[0].sourceSlug):null;
          return(<div key={i} style={{padding:'10px 14px',background:mappings.length<=1?'#fef2f2':T.surfaceH,border:`1px solid ${mappings.length<=1?'#fecaca':T.border}`,borderRadius:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <span style={{fontFamily:T.mono,fontSize:12,color:T.navy,fontWeight:600}}>{field}</span>
              {mappings.length<=1&&badge('SINGLE SOURCE','#fecaca',T.red)}
            </div>
            <div style={{fontSize:10,color:T.textSec}}>
              Source: {source?source.name:'None'} | Engines: {engines.map(e=>e.id).join(', ')||'None'}
            </div>
          </div>);
        })}
      </div>
    </div>
  </div>);

  /* ── TAB 4: SYNC MONITOR ── */
  const renderSyncMonitor=()=>{
    const connectedSources=SOURCES.filter(s=>s.status==='Connected'||s.status==='Partial');
    const totalSyncs=syncData.length;
    const failedSyncs=syncData.filter(d=>d.status==='failed').length;
    const successRate=totalSyncs>0?Math.round((totalSyncs-failedSyncs)/totalSyncs*100):0;
    const totalRecords=syncData.reduce((a,d)=>a+d.records,0);
    return(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Success Rate',successRate+'%',`${totalSyncs-failedSyncs}/${totalSyncs} syncs`,successRate>95?T.green:successRate>80?T.amber:T.red)}
      {kpi('Failed (30d)',failedSyncs,failedSyncs>5?'needs attention':'within threshold',failedSyncs>5?T.red:T.amber)}
      {kpi('Records Synced',fmt(totalRecords),'last 30 days')}
      {kpi('Active Sources',connectedSources.length+'/'+SOURCES.length)}
      {kpi('Avg Latency',(syncData.reduce((a,d)=>a+d.duration,0)/syncData.length||0).toFixed(1)+'s','per sync cycle')}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <div>
        <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:6}}>Source:</label>
        <select value={monitorSource} onChange={e=>setMonitorSource(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>
          <option value="All">All Sources</option>
          {connectedSources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {btn(showAlertConfig?'Hide Alerts':'Configure Alerts',()=>setShowAlertConfig(!showAlertConfig))}
      {btn('Export Sync Report',()=>csv(syncData,'sync_report.csv'))}
    </div>

    {/* Alert Configuration */}
    {showAlertConfig&&(<div style={{marginBottom:20,background:T.surface,border:`1px solid ${T.gold}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Alert Rules</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr>
          {['Rule','Condition','Threshold','Action','Enabled'].map(h=>(<th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{h}</th>))}
        </tr></thead>
        <tbody>
          {ALERT_RULES.map(rule=>(<tr key={rule.id} style={{borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'8px 12px',fontWeight:600,color:T.navy}}>{rule.name}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono,fontSize:11,color:T.textSec}}>{rule.condition}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono}}>{rule.threshold}</td>
            <td style={{padding:'8px 12px'}}>{badge(rule.action,T.navyL+'15',T.navyL)}</td>
            <td style={{padding:'8px 12px'}}><span style={{color:rule.enabled?T.green:T.textMut,fontWeight:600}}>{rule.enabled?'ON':'OFF'}</span></td>
          </tr>))}
        </tbody>
      </table>
    </div>)}

    {/* Live Source Status */}
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>LIVE SOURCE STATUS</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280,1fr))',gap:12}}>
        {connectedSources.map(src=>{
          const srcSyncs=SYNC_HISTORY.filter(h=>h.sourceId===src.id);
          const recentFails=srcSyncs.filter(h=>h.day<7&&h.status==='failed').length;
          const lastFail=srcSyncs.find(h=>h.status==='failed');
          const avgDuration=(srcSyncs.reduce((a,h)=>a+h.duration,0)/srcSyncs.length).toFixed(1);
          return(<div key={src.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                {statusDot(recentFails>2?'Partial':src.status)}
                <span style={{fontSize:13,fontWeight:600,color:T.navy}}>{src.name}</span>
              </div>
              <button onClick={()=>simulateSync(src.id)} disabled={syncingSource===src.id} style={{padding:'4px 10px',background:syncingSource===src.id?T.textMut:T.sage,color:'#fff',border:'none',borderRadius:6,fontSize:10,fontFamily:T.mono,cursor:syncingSource===src.id?'default':'pointer'}}>
                {syncingSource===src.id?'Syncing...':'Sync Now'}
              </button>
            </div>
            <div style={{fontSize:11,color:T.textSec,display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
              <div>Last sync: <span style={{fontFamily:T.mono}}>{src.lastSync?new Date(src.lastSync).toLocaleTimeString():'-'}</span></div>
              <div>Avg duration: <span style={{fontFamily:T.mono}}>{avgDuration}s</span></div>
              <div>Recent fails: <span style={{color:recentFails>0?T.red:T.green,fontWeight:600}}>{recentFails}</span></div>
              <div>Schedule: <span style={{fontFamily:T.mono}}>{src.syncSchedule}</span></div>
            </div>
            {/* Mini sparkline: 7 day status */}
            <div style={{display:'flex',gap:2,marginTop:8}}>
              {srcSyncs.slice(0,7).map((h,i)=>(<div key={i} style={{flex:1,height:6,background:h.status==='success'?T.green:T.red,borderRadius:2,opacity:0.7+i*0.04}} title={`${h.date}: ${h.status}`}/>))}
            </div>
            {lastFail&&recentFails>0&&<div style={{marginTop:6,fontSize:10,color:T.red,fontFamily:T.mono}}>Last error: {lastFail.error}</div>}
          </div>);
        })}
      </div>
    </div>

    {/* Rate Limit Utilization */}
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>RATE LIMIT UTILIZATION</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300,1fr))',gap:12}}>
        {rateLimits.map((rl,i)=>{
          const pct=Math.round(rl.used/rl.limit*100);
          return(<div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:600,color:T.navy}}>{rl.source}</span>
              <span style={{fontSize:12,fontFamily:T.mono,color:pct>90?T.red:pct>70?T.amber:T.green}}>{fmt(rl.used)}/{fmt(rl.limit)} per {rl.unit}</span>
            </div>
            <div style={{height:8,background:T.surfaceH,borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:pct>90?T.red:pct>70?T.amber:T.green,borderRadius:4,transition:'width 0.3s'}}/>
            </div>
            <div style={{textAlign:'right',fontSize:10,color:T.textMut,fontFamily:T.mono,marginTop:4}}>{pct}% utilized</div>
          </div>);
        })}
      </div>
    </div>

    {/* Volume Chart */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Records Synced per Day (30d)</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={volumeChart}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="day" tick={{fontSize:9,fill:T.textSec}} interval={4}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} tickFormatter={fmt}/>
            <Tooltip {...tip}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Area type="monotone" dataKey="eodhd" name="EODHD" stackId="1" fill={T.navy} stroke={T.navy} fillOpacity={0.6}/>
            <Area type="monotone" dataKey="alphavantage" name="Alpha Vantage" stackId="1" fill={T.gold} stroke={T.gold} fillOpacity={0.6}/>
            <Area type="monotone" dataKey="climatetrace" name="Climate TRACE" stackId="1" fill={T.sage} stroke={T.sage} fillOpacity={0.6}/>
            <Area type="monotone" dataKey="edgar" name="EDGAR" stackId="1" fill={T.amber} stroke={T.amber} fillOpacity={0.6}/>
            <Area type="monotone" dataKey="ember" name="Ember" stackId="1" fill={T.red} stroke={T.red} fillOpacity={0.3}/>
            <Area type="monotone" dataKey="worldbank" name="World Bank" stackId="1" fill={T.navyL} stroke={T.navyL} fillOpacity={0.4}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Sync Duration Trend (30d)</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={volumeChart.map((d,i)=>({day:d.day,eodhd:+(sr(i*201)*8+2).toFixed(1),alphavantage:+(sr(i*203)*6+1.5).toFixed(1),edgar:+(sr(i*207)*4+1).toFixed(1)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="day" tick={{fontSize:9,fill:T.textSec}} interval={4}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} unit="s"/>
            <Tooltip {...tip}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="eodhd" name="EODHD" stroke={T.navy} strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="alphavantage" name="Alpha Vantage" stroke={T.gold} strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="edgar" name="EDGAR" stroke={T.sage} strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Error Log */}
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.mono}}>SYNC ERROR LOG (30 Days)</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
        <thead><tr>
          {['Date','Source','Error','Duration','Retries','Status'].map(h=>(<th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{h}</th>))}
        </tr></thead>
        <tbody>
          {syncData.filter(d=>d.status==='failed').slice(0,15).map((d,i)=>(<tr key={i} style={{background:i%2===0?T.surface:'#fafaf8',borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.textSec}}>{d.date}</td>
            <td style={{padding:'8px 12px',fontWeight:600,color:T.navy}}>{d.sourceName}</td>
            <td style={{padding:'8px 12px',color:T.red,fontSize:11}}>{d.error}</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono}}>{d.duration}s</td>
            <td style={{padding:'8px 12px',fontFamily:T.mono}}>{d.retries}</td>
            <td style={{padding:'8px 12px'}}>{badge('FAILED','#fecaca',T.red)}</td>
          </tr>))}
          {syncData.filter(d=>d.status==='failed').length===0&&(<tr><td colSpan={6} style={{padding:20,textAlign:'center',color:T.green,fontWeight:600}}>No errors in selected period</td></tr>)}
        </tbody>
      </table>
    </div>

    {/* Sync Success Timeline */}
    <div style={{marginTop:20,overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border}`,fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.mono}}>SYNC SUCCESS HISTORY (Last 7 Days)</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr>
          <th style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>Source</th>
          {Array.from({length:7},(_,i)=>`03-${String(29-i).padStart(2,'0')}`).map(d=>(<th key={d} style={{padding:'8px 10px',textAlign:'center',fontSize:9,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{d}</th>))}
          <th style={{padding:'8px 12px',textAlign:'center',fontSize:10,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>7d Rate</th>
        </tr></thead>
        <tbody>
          {connectedSources.map((src,si)=>{
            const srcSyncs=SYNC_HISTORY.filter(h=>h.sourceId===src.id&&h.day<7);
            const successCount=srcSyncs.filter(h=>h.status==='success').length;
            const rate=srcSyncs.length>0?Math.round(successCount/srcSyncs.length*100):0;
            return(<tr key={src.id} style={{background:si%2===0?T.surface:'#fafaf8',borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'8px 12px',fontWeight:600,color:T.navy,whiteSpace:'nowrap'}}>{src.name}</td>
              {Array.from({length:7},(_,i)=>{
                const entry=SYNC_HISTORY.find(h=>h.sourceId===src.id&&h.day===i);
                return(<td key={i} style={{padding:'8px 10px',textAlign:'center'}}>
                  <div style={{width:14,height:14,borderRadius:3,margin:'0 auto',background:entry?(entry.status==='success'?T.green:T.red):T.surfaceH}} title={entry?`${entry.status}: ${entry.records} records`:'No sync'}/>
                </td>);
              })}
              <td style={{padding:'8px 12px',textAlign:'center',fontFamily:T.mono,fontWeight:600,color:rate>90?T.green:rate>70?T.amber:T.red}}>{rate}%</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>

    {/* Data Freshness Dashboard */}
    <div style={{marginTop:20}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>DATA FRESHNESS BY TABLE</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260,1fr))',gap:12}}>
        {DB_TABLES.map((tbl,ti)=>{
          const mappings=FIELD_MAPPINGS.filter(m=>m.targetTable===tbl.name);
          const sources=[...new Set(mappings.map(m=>m.sourceSlug))];
          const latestSync=sources.reduce((latest,slug)=>{
            const src=SOURCES.find(s=>s.slug===slug);
            if(src&&src.lastSync){const d=new Date(src.lastSync);if(!latest||d>latest)return d;}
            return latest;
          },null);
          const hoursAgo=latestSync?Math.round((new Date('2026-03-29T12:00:00Z')-latestSync)/3600000):999;
          const freshness=hoursAgo<6?'Real-time':hoursAgo<24?'Fresh':hoursAgo<72?'Stale':'Outdated';
          const freshnessColor=hoursAgo<6?T.green:hoursAgo<24?T.sage:hoursAgo<72?T.amber:T.red;
          return(<div key={tbl.name} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{tbl.name}</span>
              {badge(freshness,freshnessColor+'20',freshnessColor)}
            </div>
            <div style={{fontSize:10,color:T.textSec,marginBottom:6}}>
              {mappings.length} fields mapped from {sources.length} source{sources.length!==1?'s':''}
            </div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {sources.map(slug=>{const src=SOURCES.find(s=>s.slug===slug);return src?(<span key={slug} style={{fontSize:9,fontFamily:T.mono,padding:'2px 6px',background:T.surfaceH,borderRadius:4,color:T.textMut}}>{src.name.split(' ')[0]}</span>):null;})}
            </div>
            {latestSync&&<div style={{fontSize:9,color:T.textMut,fontFamily:T.mono,marginTop:6}}>Last update: {hoursAgo}h ago</div>}
          </div>);
        })}
      </div>
    </div>

    {/* Sync Performance Stats */}
    <div style={{marginTop:20,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>SYNC PERFORMANCE STATISTICS</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200,1fr))',gap:12}}>
        {connectedSources.map(src=>{
          const srcSyncs=SYNC_HISTORY.filter(h=>h.sourceId===src.id);
          const avgDuration=(srcSyncs.reduce((a,h)=>a+h.duration,0)/srcSyncs.length).toFixed(1);
          const maxDuration=Math.max(...srcSyncs.map(h=>h.duration)).toFixed(1);
          const minDuration=Math.min(...srcSyncs.map(h=>h.duration)).toFixed(1);
          const totalRecords=srcSyncs.reduce((a,h)=>a+h.records,0);
          const avgRecords=Math.round(totalRecords/srcSyncs.filter(h=>h.status==='success').length);
          return(<div key={src.id} style={{padding:12,background:T.surfaceH,borderRadius:8}}>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>{src.name}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:10}}>
              <div style={{color:T.textMut}}>Avg duration:</div><div style={{fontFamily:T.mono,color:T.text}}>{avgDuration}s</div>
              <div style={{color:T.textMut}}>Min/Max:</div><div style={{fontFamily:T.mono,color:T.text}}>{minDuration}s / {maxDuration}s</div>
              <div style={{color:T.textMut}}>Total records:</div><div style={{fontFamily:T.mono,color:T.text}}>{fmt(totalRecords)}</div>
              <div style={{color:T.textMut}}>Avg per sync:</div><div style={{fontFamily:T.mono,color:T.text}}>{fmt(avgRecords)}</div>
            </div>
          </div>);
        })}
      </div>
    </div>
  </div>);};

  /* ── MAIN RENDER ── */
  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
    {/* Header */}
    <div style={{marginBottom:8}}>
      <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>Administration {'>'} Data Infrastructure</div>
      <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0,letterSpacing:'-0.5px'}}>Data Source Manager</h1>
      <p style={{fontSize:13,color:T.textSec,margin:'6px 0 0'}}>Connect external data sources, map fields to database columns, and track calculation engine dependencies</p>
    </div>
    <div style={{height:1,background:`linear-gradient(90deg, ${T.gold}, ${T.goldL}, transparent)`,marginBottom:20}}/>

    {/* Summary Strip */}
    <div style={{display:'flex',gap:16,marginBottom:20,padding:'10px 16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,alignItems:'center',fontSize:12,fontFamily:T.mono,color:T.textSec,flexWrap:'wrap'}}>
      <span>{SOURCES.length} sources configured</span>
      <span style={{color:T.borderL}}>|</span>
      <span>{SOURCES.filter(s=>s.status==='Connected').length} connected</span>
      <span style={{color:T.borderL}}>|</span>
      <span>{SOURCES.reduce((a,s)=>a+s.fieldCount,0)} fields total</span>
      <span style={{color:T.borderL}}>|</span>
      <span>{FIELD_MAPPINGS.length} mapped</span>
      <span style={{color:T.borderL}}>|</span>
      <span>{ENGINES.length} engines</span>
      <span style={{color:T.borderL}}>|</span>
      <span>{DB_TABLES.length} target tables</span>
      <span style={{marginLeft:'auto',color:T.textMut}}>Last refresh: {new Date().toLocaleTimeString()}</span>
    </div>

    {/* System Health Overview */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:20}}>
      {[
        {label:'API Uptime',value:'99.7%',sub:'30-day average',color:T.green},
        {label:'Data Latency',value:'4.2s',sub:'avg sync time',color:T.sage},
        {label:'Coverage',value:Math.round(FIELD_MAPPINGS.length/SOURCES.reduce((a,s)=>a+s.fieldCount,0)*100)+'%',sub:'fields mapped',color:T.navy},
        {label:'Error Rate',value:Math.round(SYNC_HISTORY.filter(h=>h.status==='failed').length/SYNC_HISTORY.length*100)+'%',sub:'last 30 days',color:SYNC_HISTORY.filter(h=>h.status==='failed').length/SYNC_HISTORY.length<0.1?T.green:T.amber},
        {label:'DB Tables',value:DB_TABLES.length,sub:DB_TABLES.reduce((a,t)=>a+t.columns.length,0)+' columns',color:T.navyL},
        {label:'Engines Fed',value:ENGINES.length+'/'+ENGINES.length,sub:'all operational',color:T.green},
      ].map((item,i)=>(<div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'12px 14px',textAlign:'center'}}>
        <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{item.label}</div>
        <div style={{fontSize:22,fontWeight:700,color:item.color,marginTop:2}}>{item.value}</div>
        <div style={{fontSize:10,color:T.textSec,marginTop:1}}>{item.sub}</div>
      </div>))}
    </div>

    {/* Quick Actions Bar */}
    <div style={{display:'flex',gap:8,marginBottom:20,padding:'8px 12px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,alignItems:'center'}}>
      <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginRight:8}}>Quick Actions:</span>
      {btn('Sync All Sources',()=>{},true,true)}
      {btn('Validate All Mappings',()=>{},false,true)}
      {btn('Run Health Check',()=>{},false,true)}
      {btn('Export Full Config',()=>{
        const config={sources:SOURCES.map(s=>({name:s.name,status:s.status,fields:s.fieldCount})),mappings:FIELD_MAPPINGS.length,engines:ENGINES.map(e=>({id:e.id,name:e.name,fields:e.consumes.length})),tables:DB_TABLES.map(t=>({name:t.name,columns:t.columns.length}))};
        const blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='dsm_config.json';a.click();URL.revokeObjectURL(url);
      },false,true)}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:T.green}}/>
        <span style={{fontSize:10,fontFamily:T.mono,color:T.green}}>All systems operational</span>
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=>(<button key={t} onClick={()=>setTab(i)} style={{padding:'10px 24px',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,fontFamily:T.font,border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',marginBottom:-2,letterSpacing:0.2,transition:'all 0.2s'}}>{t}</button>))}
    </div>

    {/* Tab Content */}
    {tab===0&&renderSourceRegistry()}
    {tab===1&&renderFieldMapper()}
    {tab===2&&renderEngineLineage()}
    {tab===3&&renderSyncMonitor()}

    {/* Data Pipeline Summary */}
    <div style={{marginTop:24,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>DATA PIPELINE SUMMARY</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:0,alignItems:'center',textAlign:'center'}}>
        <div style={{padding:12}}>
          <div style={{fontSize:28,fontWeight:800,color:T.navy}}>{SOURCES.filter(s=>s.status==='Connected').length}</div>
          <div style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Active Sources</div>
          <div style={{fontSize:9,color:T.textMut,marginTop:2}}>EODHD, Alpha Vantage, Climate TRACE, EDGAR, Ember, World Bank, UNFCCC, IEA</div>
        </div>
        <div style={{fontSize:24,color:T.gold,fontWeight:700}}>{'\u2192'}</div>
        <div style={{padding:12}}>
          <div style={{fontSize:28,fontWeight:800,color:T.gold}}>{FIELD_MAPPINGS.length}</div>
          <div style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Field Mappings</div>
          <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{FIELD_MAPPINGS.filter(m=>m.transform!=='none').length} with transformations</div>
        </div>
        <div style={{fontSize:24,color:T.gold,fontWeight:700}}>{'\u2192'}</div>
        <div style={{padding:12}}>
          <div style={{fontSize:28,fontWeight:800,color:T.sage}}>{ENGINES.length}</div>
          <div style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Calc Engines</div>
          <div style={{fontSize:9,color:T.textMut,marginTop:2}}>PCAF, Temp Score, Climate VaR, GAR, WACI, Scope 3, +6 more</div>
        </div>
      </div>
      <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
        {DB_TABLES.map(tbl=>{
          const mc=new Set(FIELD_MAPPINGS.filter(m=>m.targetTable===tbl.name).map(m=>m.targetColumn));
          const pct=Math.round(mc.size/tbl.columns.length*100);
          return(<div key={tbl.name} style={{padding:'4px 10px',background:pct>80?T.green+'10':pct>50?T.amber+'10':T.red+'10',border:`1px solid ${pct>80?T.green+'30':pct>50?T.amber+'30':T.red+'30'}`,borderRadius:6,fontSize:10,fontFamily:T.mono}}>
            <span style={{color:T.navy}}>{tbl.name}</span>
            <span style={{marginLeft:4,color:pct>80?T.green:pct>50?T.amber:T.red,fontWeight:600}}>{pct}%</span>
          </div>);
        })}
      </div>
    </div>

    {/* Recent Activity Log */}
    <div style={{marginTop:16,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12,fontFamily:T.mono}}>RECENT ACTIVITY</div>
      <div style={{display:'grid',gap:6}}>
        {[
          {time:'08:15:00',action:'Sync completed',source:'EODHD',detail:'4,832 records updated across 12 endpoints',status:'success'},
          {time:'07:45:00',action:'Sync completed',source:'Alpha Vantage',detail:'3,105 records updated, 1 endpoint warning (NEWS_SENTIMENT timeout)',status:'warning'},
          {time:'06:00:00',action:'Sync completed',source:'EDGAR/SEC',detail:'1,247 filings indexed, 2 XBRL parse errors',status:'warning'},
          {time:'03:00:00',action:'Schema validation',source:'System',detail:'All 7 target tables validated, 0 schema drift detected',status:'success'},
          {time:'00:00:00',action:'Daily aggregation',source:'System',detail:'Materialized views refreshed: 305K rows across macro_indicators',status:'success'},
          {time:'22:00 (prev)',action:'Sync completed',source:'Climate TRACE',detail:'Country + facility emissions data refreshed for 2024-2025',status:'success'},
          {time:'18:00 (prev)',action:'Sync completed',source:'Ember Climate',detail:'Electricity generation data updated for 215 countries',status:'success'},
          {time:'12:00 (prev)',action:'Rate limit warning',source:'EODHD',detail:'API usage reached 85K/100K daily limit, throttling applied',status:'warning'},
        ].map((entry,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'6px 10px',background:i%2===0?'transparent':T.surfaceH,borderRadius:6}}>
          <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,minWidth:80}}>{entry.time}</span>
          <div style={{width:6,height:6,borderRadius:'50%',background:entry.status==='success'?T.green:entry.status==='warning'?T.amber:T.red,flexShrink:0}}/>
          <span style={{fontSize:11,fontWeight:600,color:T.navy,minWidth:120}}>{entry.source}</span>
          <span style={{fontSize:11,color:T.text}}>{entry.action}</span>
          <span style={{fontSize:10,color:T.textSec,marginLeft:'auto'}}>{entry.detail}</span>
        </div>))}
      </div>
    </div>

    {/* Footer */}
    <div style={{marginTop:32,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:8}}>
        <span>Data Source Manager v2.4 | {SOURCES.length} sources | {FIELD_MAPPINGS.length} mappings | {ENGINES.length} engines</span>
        <span>Supabase PostgreSQL | Alembic 067 | AES-256 encrypted credentials</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut,fontFamily:T.mono}}>
        <span>Pipeline: {SOURCES.filter(s=>s.status==='Connected').length} active sources {'\u2192'} {DB_TABLES.length} tables {'\u2192'} {ENGINES.length} engines | Uptime: 99.7%</span>
        <span>Next scheduled sync: EODHD in {Math.round(sr(999)*50+10)} min | Build: 2026-03-29</span>
      </div>
    </div>

    {/* Spinner animation */}
    <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
  </div>);
}
