import React, { useState } from 'react';
import { Option } from '@/types/commons';
import FacilityKPISummaryHeatMapChart from './FacilityKPISummaryHeatMapChart';
import FacilityKPISummaryMixedChart from './FacilityKPISummaryMixedChart';
import FacilityKPISummaryTable from './FacilityKPISummaryTable';
import FacilityKPISummaryTableLoading from './FacilityKPISummaryTableLoading';

interface FacilityKPISummaryProps {
  process?: string;
  scenarioId: string;
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
