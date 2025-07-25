'use client';

import React, { useState } from 'react';
import { abort } from 'process';
import * as XLSX from 'xlsx';
import { ScenarioData } from '@/types/simulations';
import { useAemosTemplate } from '@/queries/homeQueries';

interface AemosTemplateProps {
  scenario: ScenarioData | null;
}

function downloadExcel(data: any, filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
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
  fontWeight: 700,
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 0.125rem 0.5rem rgba(124,58,237,0.06)',
  transition: 'background 0.18s',
};

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
                fontWeight: 700,
                fontSize: '1rem',
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
                  fontSize: '0.938rem',
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

function AemosTemplate({ scenario }: AemosTemplateProps) {
  const { data: aemos_dict, isLoading, isError } = useAemosTemplate({ scenarioId: scenario?.scenario_id });
  const [showTables, setShowTables] = useState(false);

  if (isLoading) return <div style={{ marginTop: '2rem' }}>AEMOS loading...</div>;

  if (isError) return <div style={{ marginTop: '2rem', color: 'red' }}>Error loading AEMOS data</div>;

  if (!aemos_dict) return <div style={{ marginTop: '2rem' }}>No AEMOS data available</div>;

  const { metric_dict: metric, template_dict, service_point_info_dict } = aemos_dict;

  // metric이 undefined인지 체크
  if (!metric) return <div>Metric data not available</div>;

  return (
    <div
      style={{
        background: '#FFFFFF',
        minHeight: '100vh',
        fontFamily: 'Inter, Pretendard, Noto Sans KR, sans-serif',
        color: '#22223B',
      }}
    >
      <div style={{ padding: '0rem', margin: '0 auto' }}>
        {/* ✅ 토글 + 내용 컨테이너 */}
        <div style={containerStyle}>
          <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
            {/* ✅ 토글 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.4rem',
              }}
            >
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '3rem',
                  height: '1.75rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={showTables}
                  onChange={() => setShowTables((v) => !v)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: showTables ? '#7C5CE0' : '#E5E7EB',
                    borderRadius: '1.125rem',
                    transition: 'background-color 0.2s',
                    border: '0.094rem solid #E5E7EB',
                  }}
                ></span>
                <span
                  style={{
                    position: 'absolute',
                    left: showTables ? '1.375rem' : '0.188rem',
                    top: '0.188rem',
                    width: '1.375rem',
                    height: '1.375rem',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                    boxShadow: '0 0.063rem 0.25rem rgba(0,0,0,0.1)',
                  }}
                ></span>
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: '#22223B',
                  letterSpacing: -0.031,
                }}
              >
                AEMOS TEMPLATE
              </span>
            </label>
            <div
              style={{
                color: '#6B7280',
                marginTop: '1.125rem',
                marginLeft: '3.875rem',
                fontSize: '1rem',
                fontWeight: 400,
              }}
            >
              Preparation of a survey template by the Survey Agent for participation in ACI AEMOS program.
            </div>

            {showTables && (
              <>
                {/* ✅ KPI 카드 */}
                <div style={cardStyle}>
                  {Object.entries(metric).map(([label, value]) => (
                    <div key={label} style={{ minWidth: '10.625rem', flex: '1 1 10.625rem' }}>
                      <div
                        style={{
                          color: '#6B7280',
                          fontSize: '0.938rem',
                          marginBottom: '0.438rem',
                          fontWeight: 600,
                        }}
                      >
                        {label.replace(/_/g, ' ')}
                      </div>

                      <div
                        style={{
                          fontSize: '2.375rem',
                          fontWeight: 700,
                          color: '#22223B',
                        }}
                      >
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ Survey Template */}
                <SectionWithDownload title="Survey Template" data={template_dict} filename="Survey Template.xlsx" />

                {/* ✅ Service-Point Information */}
                <SectionWithDownload
                  title="Service-Point Information"
                  data={service_point_info_dict}
                  filename="Service-Point Info.xlsx"
                />
              </>
            )}
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
          fontSize: '1.375rem',
          color: '#22223B',
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      <button
        style={buttonStyle}
        onClick={() => downloadExcel(data, filename)}
        onMouseOver={(e) => (e.currentTarget.style.background = '#6D28D9')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#7C3AED')}
      >
        Excel download
      </button>
    </div>
    <div
      style={{
        color: '#6B7280',
        fontSize: '0.938rem',
        marginTop: '0.625rem',
        fontWeight: 400,
      }}
    >
      Please download the file, fill in the blanks, and upload it to Notion.
    </div>
    <Table data={data} />
  </>
);

export default AemosTemplate;
