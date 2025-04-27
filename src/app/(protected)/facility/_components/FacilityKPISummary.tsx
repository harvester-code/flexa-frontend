import FacilityKPISummaryHeatMapChart from './FacilityKPISummaryHeatMapChart';
import FacilityKPISummaryMixedChart from './FacilityKPISummaryMixedChart';
import FacilityKPISummaryTable from './FacilityKPISummaryTable';

interface FacilityKPISummaryProps {
  process?: string;
  scenarioId?: string;
}

function FacilityKPISummary({ process, scenarioId }: FacilityKPISummaryProps) {
  return (
    <>
      <FacilityKPISummaryTable process={process} scenarioId={scenarioId} />
      <FacilityKPISummaryMixedChart process={process} scenarioId={scenarioId} />
      <FacilityKPISummaryHeatMapChart process={process} scenarioId={scenarioId} />
    </>
  );
}

export default FacilityKPISummary;
