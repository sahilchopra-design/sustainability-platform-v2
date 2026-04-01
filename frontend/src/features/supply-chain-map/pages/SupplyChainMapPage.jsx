import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Electronics','Automotive','Textiles','Agriculture','Mining','Chemicals','Food & Bev','Pharma'];
const F2=['Critical','High','Medium','Low','Very Low'];
const ITEMS=generateItems(55,F1,F2,'sector','riskLevel','Supply Chain');
const TS=generateTimeSeries();
export default function SupplyChainMapPage(){return <AnalyticsModule title="Supply Chain ESG Mapping" subtitle="Supply Chain Intelligence" tabs={['Chain Overview','Supplier Screener','Risk Hotspots','Due Diligence']} f1Arr={F1} f2Arr={F2} f1Field="sector" f2Field="riskLevel" f1Label="Sector" f2Label="Risk Level" items={ITEMS} timeSeries={TS} csvName="supply_chain" entityLabel="suppliers"/>;}