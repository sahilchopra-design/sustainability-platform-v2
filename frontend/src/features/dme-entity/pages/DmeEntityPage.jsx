import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Technology','Financials','Healthcare','Energy','Industrials','Consumer','Materials','Utilities'];
const F2=['North America','Europe','Asia-Pacific','Emerging Markets','Global'];
const ITEMS=generateItems(55,F1,F2,'sector','region','DME Entity');
const TS=generateTimeSeries();
export default function DmeEntityPage(){return <AnalyticsModule title="Entity Materiality Intelligence" subtitle="Dynamic Materiality" tabs={['Materiality Dashboard','Entity Screener','Topic Analysis','Stakeholder View']} f1Arr={F1} f2Arr={F2} f1Field="sector" f2Field="region" f1Label="Sector" f2Label="Region" items={ITEMS} timeSeries={TS} csvName="dme_entity" entityLabel="entities"/>;}