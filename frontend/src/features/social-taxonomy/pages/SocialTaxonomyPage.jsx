import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Affordable Housing','Healthcare','Education','Employment','Financial Inclusion','Digital Access','Gender Equality','Food Security'];
const F2=['EU','UK','US','Asia-Pacific','Emerging Markets','Nordic','Switzerland'];
const ITEMS=generateItems(55,F1,F2,'category','region','Social Activity');
const TS=generateTimeSeries();
export default function SocialTaxonomyPage(){return <AnalyticsModule title="EU Social Taxonomy" subtitle="Social Classification" tabs={['Taxonomy Overview','Activity Screener','Alignment Assessment','Reporting']} f1Arr={F1} f2Arr={F2} f1Field="category" f2Field="region" f1Label="Category" f2Label="Region" items={ITEMS} timeSeries={TS} csvName="social_taxonomy" entityLabel="activities"/>;}