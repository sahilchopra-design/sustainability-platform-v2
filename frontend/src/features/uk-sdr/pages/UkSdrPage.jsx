import React from 'react';
import AnalyticsModule,{generateItems,generateTimeSeries} from '../../../shared/AnalyticsModuleTemplate';
const F1=['Sustainability Focus','Sustainability Improvers','Sustainability Impact','Mixed Goals','No Label'];
const F2=['BlackRock','Schroders','LGIM','Aviva','abrdn','M&G','Fidelity','Jupiter','HSBC AM'];
const ITEMS=generateItems(55,F1,F2,'label','provider','SDR Product');
const TS=generateTimeSeries();
export default function UkSdrPage(){return <AnalyticsModule title="UK SDR Labels & Requirements" subtitle="UK Sustainability Disclosure" tabs={['SDR Overview','Product Labelling','Anti-Greenwashing','Disclosure Tracker']} f1Arr={F1} f2Arr={F2} f1Field="label" f2Field="provider" f1Label="Label" f2Label="Provider" items={ITEMS} timeSeries={TS} csvName="uk_sdr" entityLabel="products"/>;}