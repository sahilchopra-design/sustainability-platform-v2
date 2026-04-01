import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Technology','Financials','Healthcare','Energy','Industrials','Consumer','Materials','Utilities'];
const F2=['North America','Europe','Asia-Pacific','Emerging Markets','Global'];
const ITEMS=generateItems(55,F1,F2,'sector','region','Materiality Topic');
const TS=generateTimeSeries();
export default function MaterialityHubPage(){return <AnalyticsModule title="Double Materiality Hub" subtitle="Materiality Intelligence" tabs={['Materiality Dashboard','Topic Analysis','Company Assessment','Stakeholder Mapping']} f1Arr={F1} f2Arr={F2} f1Field="sector" f2Field="region" f1Label="Sector" f2Label="Region" items={ITEMS} timeSeries={TS} csvName="materiality_hub" entityLabel="topics"/>;}