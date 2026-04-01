import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Energy','Transport','Industry','Buildings','Agriculture','Waste','LULUCF','Aviation'];
const F2=['Global','North America','Europe','China','India','Asia','Africa','Latin America'];
const ITEMS=generateItems(55,F1,F2,'sector','region','Budget Entity');
const TS=generateTimeSeries();
export default function CarbonBudgetPage(){return <AnalyticsModule title="Carbon Budget Tracker" subtitle="Emissions Budgeting" tabs={['Budget Overview','Entity Tracker','Pathway Analysis','Scenario Planner']} f1Arr={F1} f2Arr={F2} f1Field="sector" f2Field="region" f1Label="Sector" f2Label="Region" items={ITEMS} timeSeries={TS} csvName="carbon_budget" entityLabel="entities"/>;}