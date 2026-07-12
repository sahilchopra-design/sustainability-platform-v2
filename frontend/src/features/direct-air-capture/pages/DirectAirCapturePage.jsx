// `direct-air-capture` is an orphan/placeholder route id (no engine, no source files, no guide —
// see docs/module_atlas/deep/direct-air-capture.md §7.2/§7.4). The DAC domain is already fully
// delivered by the sibling `direct-air-capture-finance` module (EP-EH1: 5 DAC technologies, LCOC
// engine, electricity-price sensitivity, learning curves, IRA §45Q credit, offtake/credit analytics).
// Per the deep-dive recommendation, this route re-exports that real module rather than duplicating it.
export { default } from '../../direct-air-capture-finance/pages/DirectAirCaptureFinancePage';
