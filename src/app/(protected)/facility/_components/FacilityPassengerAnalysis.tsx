import FacilityPassengerAnalysisBarChart from './FacilityPassengerAnalysisBarChart';
import FacilityPassengerAnalysisDonutChart from './FacilityPassengerAnalysisDonutChart';

interface FacilityPassengerAnalysisProps {
  process?: string;
  scenarioId: string;
}

function FacilityPassengerAnalysis({ process, scenarioId }: FacilityPassengerAnalysisProps) {
  return (
    <div className="my-[30px]">
      <FacilityPassengerAnalysisDonutChart process={process} scenarioId={scenarioId} />

      <FacilityPassengerAnalysisBarChart process={process} scenarioId={scenarioId} />
    </div>
  );
}

export default FacilityPassengerAnalysis;
