import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Business as Usual','Sustainable Use','Nature Positive','Degradation','Restoration','Net Zero Nature','Collapse','Managed Decline'];
const F2=['Global','Tropical','Temperate','Arctic','Marine','Freshwater','Dryland','Mountain'];
const ITEMS=generateItems(55,F1,F2,'scenario','region','Scenario');
const TS=generateTimeSeries();
export default function NatureScenariosPage(){return <AnalyticsModule title="Nature Scenario Modelling" subtitle="Biodiversity Scenarios" tabs={['Scenario Dashboard','Pathway Explorer','Impact Assessment','Portfolio Stress']} f1Arr={F1} f2Arr={F2} f1Field="scenario" f2Field="region" f1Label="Scenario" f2Label="Region" items={ITEMS} timeSeries={TS} csvName="nature_scenarios" entityLabel="scenarios"/>;}