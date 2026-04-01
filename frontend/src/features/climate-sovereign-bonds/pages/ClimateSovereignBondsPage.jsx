import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Green Sovereign','Sustainability Bond','Climate Bond','Blue Bond','Transition Bond','SDG Bond'];
const F2=['Europe','Asia-Pacific','Latin America','Africa','Middle East','North America'];
const ITEMS=generateItems(55,F1,F2,'type','region','Sovereign Bond');
const TS=generateTimeSeries();
export default function ClimateSovereignBondsPage(){return <AnalyticsModule title="Climate Sovereign Bonds" subtitle="Sovereign Green Debt" tabs={['Market Overview','Bond Screener','Country Assessment','Performance']} f1Arr={F1} f2Arr={F2} f1Field="type" f2Field="region" f1Label="Type" f2Label="Region" items={ITEMS} timeSeries={TS} csvName="sovereign_bonds" entityLabel="bonds"/>;}