import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['NYSE','LSE','Euronext','JPX','SSE','HKEX','BSE','SGX','ASX','TSX'];
const F2=['Tier 1','Tier 2','Tier 3'];
const ITEMS=generateItems(55,F1,F2,'exchange','tier','Exchange');
const TS=generateTimeSeries();
export default function ExchangeIntelligencePage(){return <AnalyticsModule title="Exchange Intelligence" subtitle="Stock Exchange Analytics" tabs={['Exchange Overview','Listing Standards','ESG Disclosure','Market Performance']} f1Arr={F1} f2Arr={F2} f1Field="exchange" f2Field="tier" f1Label="Exchange" f2Label="Tier" items={ITEMS} timeSeries={TS} csvName="exchange_intel" entityLabel="exchanges"/>;}