'use client';

import { utils, writeFile } from 'xlsx';
import { ScenarioData } from '@/types/homeTypes';
import { useAemosTemplate } from '@/queries/homeQueries';
import { Button } from '@/components/ui/Button';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';

interface AemosTemplateProps {
  scenario: ScenarioData | null;
}

function downloadExcel(data: any, filename: string) {
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Sheet1');
  writeFile(wb, filename);
}

function AemosTemplate({ scenario }: AemosTemplateProps) {
  const { data: aemos_dict, isLoading, isError } = useAemosTemplate({ scenarioId: scenario?.scenario_id });

  const { metric_dict: metric, template_dict, service_point_info_dict } = aemos_dict || {};

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  // HACK
  if (isError || !aemos_dict || !metric) {
    return <HomeNoScenario />;
  }

  return (
    <div className="min-h-screen bg-white font-pretendard text-default-900">
      <div className="mx-auto p-0">
        <div className="mt-8 w-full rounded-xl border border-input bg-muted p-6 shadow-sm">
          <div className="mx-auto max-w-page">
            <p className="mb-5 text-muted-foreground">
              Preparation of a survey template by the Survey Agent for participation in ACI AEMOS program.
            </p>

            <div className="mb-9 flex flex-wrap justify-between gap-10 rounded-2xl border border-input bg-white p-9 shadow-sm">
              {Object.entries(metric).map(([label, value]) => (
                <div key={label} className="min-w-44 flex-1 basis-44">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">{label.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-semibold text-default-900">{String(value)}</div>
                </div>
              ))}
            </div>

            <SectionWithDownload
              title="Survey Template"
              data={template_dict}
              filename={`Survey_Template_${scenario?.name?.replace(/\s+/g, '_') || 'Unknown'}.xlsx`}
            />

            <SectionWithDownload
              title="Service-Point Information"
              data={service_point_info_dict}
              filename={`Service_Point_Info_${scenario?.name?.replace(/\s+/g, '_') || 'Unknown'}.xlsx`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 공통 다운로드 섹션 컴포넌트
const SectionWithDownload = ({ title, data, filename }: { title: string; data: any[]; filename: string }) => (
  <>
    <div className="mt-18 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-default-900">{title}</h2>

      <Button
        variant="primary"
        size="sm"
        onClick={() => downloadExcel(data, filename)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Excel download
      </Button>
    </div>

    <div className="mt-2.5 text-sm font-normal text-muted-foreground">
      Please download the file, fill in the blanks, and upload it to Notion.
    </div>

    <Table data={data} />
  </>
);

const Table = ({ data }: { data: any[] }) => (
  <div
    className={`mt-5 overflow-hidden rounded-2xl border border-input bg-white shadow-sm ${
      data.length > 20 ? 'max-h-96 overflow-y-auto' : ''
    }`}
  >
    <table className="w-full border-collapse bg-white">
      <thead>
        <tr className="bg-muted">
          {Object.keys(data[0]).map((col) => (
            <th
              key={col}
              className="sticky top-0 z-10 border-b-2 border-input bg-muted p-3.5 text-left text-sm font-semibold text-default-900"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIdx) => (
          <tr
            key={rowIdx}
            className={`transition-colors ${rowIdx % 2 === 0 ? 'bg-muted/30' : 'bg-white'} hover:bg-muted/50`}
          >
            {Object.values(row).map((val, colIdx) => (
              <td key={colIdx} className="border-b border-input p-3 text-left text-sm text-default-900">
                {String(val)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AemosTemplate;
