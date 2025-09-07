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

// ✅ 공통 스타일
const containerStyle = {
  marginTop: '2rem',
  border: '0.094rem solid #E5E7EB',
  borderRadius: '1rem',
  backgroundColor: '#F9FAFB',
  boxShadow: '0 0.125rem 0.5rem rgba(0,0,0,0.05)',
  padding: '1.5rem',
  width: '100%',
};

const cardStyle = {
  border: '0.094rem solid #E5E7EB',
  borderRadius: '1.125rem',
  padding: '2.25rem',
  marginBottom: '2.25rem',
  background: '#fff',
  boxShadow: '0 0.125rem 0.5rem rgba(124,58,237,0.04)',
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '2.5rem',
  justifyContent: 'space-between',
};

const tableContainerStyle = {
  marginTop: '1.125rem',
  borderRadius: '1.125rem',
  overflow: 'hidden',
  boxShadow: '0 0.125rem 0.5rem rgba(124,58,237,0.04)',
  border: '0.094rem solid #E5E7EB',
  background: '#fff',
};

const buttonStyle = {
  background: '#7C3AED',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  padding: '0.625rem 1.375rem',
  fontWeight: 500 /* font-medium - button text */,
  fontSize: '14px' /* text-sm equivalent */,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 0.125rem 0.5rem rgba(124,58,237,0.06)',
  transition: 'background 0.18s',
};

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
    <div
      style={{
        background: '#FFFFFF',
        minHeight: '100vh',
        fontFamily: 'Pretendard, sans-serif',
        color: '#22223B',
      }}
    >
      <div style={{ padding: '0rem', margin: '0 auto' }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
            <p className="mb-5 text-default-500">
              Preparation of a survey template by the Survey Agent for participation in ACI AEMOS program.
            </p>

            <div style={cardStyle}>
              {Object.entries(metric).map(([label, value]) => (
                <div key={label} style={{ minWidth: '10.625rem', flex: '1 1 10.625rem' }}>
                  <div
                    style={{
                      color: '#6B7280',
                      fontSize: '14px' /* text-sm equivalent */,
                      marginBottom: '0.438rem',
                      fontWeight: 500 /* font-medium - label text */,
                    }}
                  >
                    {label.replace(/_/g, ' ')}
                  </div>

                  <div
                    style={{
                      fontSize: '16px' /* text-lg equivalent */,
                      fontWeight: 600 /* font-semibold */,
                      color: '#22223B',
                    }}
                  >
                    {String(value)}
                  </div>
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

// ✅ 공통 다운로드 섹션 컴포넌트
const SectionWithDownload = ({ title, data, filename }: { title: string; data: any[]; filename: string }) => (
  <>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4.375rem',
      }}
    >
      <h2
        style={{
          fontSize: '16px' /* text-lg equivalent */,
          color: '#22223B',
          fontWeight: 600 /* font-semibold */,
        }}
      >
        {title}
      </h2>

      <Button
        variant="brand"
        style={buttonStyle}
        onClick={() => downloadExcel(data, filename)}
        onMouseOver={(e) => (e.currentTarget.style.background = '#6D28D9')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#7C3AED')}
      >
        Excel download
      </Button>
    </div>

    <div
      style={{
        color: '#6B7280',
        fontSize: '14px' /* text-sm equivalent */,
        marginTop: '0.625rem',
        fontWeight: 400,
      }}
    >
      Please download the file, fill in the blanks, and upload it to Notion.
    </div>

    <Table data={data} />
  </>
);

const Table = ({ data }: { data: any[] }) => (
  <div
    style={{
      ...tableContainerStyle,
      maxHeight: data.length > 20 ? '37.5rem' : undefined, // ✅ 20개 이상이면 제한 높이
      overflowY: data.length > 20 ? 'auto' : undefined, // ✅ 스크롤 추가
    }}
  >
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#fff',
      }}
    >
      <thead>
        <tr style={{ background: '#F3F4F6' }}>
          {Object.keys(data[0]).map((col) => (
            <th
              key={col}
              style={{
                padding: '0.875rem 0.625rem',
                fontWeight: 600 /* font-semibold */,
                fontSize: '14px' /* text-sm equivalent */,
                color: '#374151',
                borderBottom: '0.125rem solid #E5E7EB',
                textAlign: 'left',
                background: '#F3F4F6',
                position: 'sticky', // ✅ 헤더 고정
                top: 0,
                zIndex: 2,
              }}
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
            style={{
              background: rowIdx % 2 === 0 ? '#F8FAFC' : '#fff',
              transition: 'background 0.2s',
            }}
          >
            {Object.values(row).map((val, colIdx) => (
              <td
                key={colIdx}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderBottom: '0.063rem solid #E5E7EB',
                  textAlign: 'left',
                  fontSize: '14px' /* text-sm equivalent */,
                  color: '#22223B',
                }}
              >
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
