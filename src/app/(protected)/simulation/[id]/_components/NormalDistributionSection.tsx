import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';

// import { useSimulationStore } from '../_stores'; // 🔴 zustand 연결 제거

// Plotly를 동적으로 로드 (SSR 문제 방지)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center text-gray-500">Loading chart...</div>,
});

interface NormalDistributionSectionProps {
  onSave?: () => void;
}

export const NormalDistributionSection: React.FC<NormalDistributionSectionProps> = ({ onSave }) => {
  const [mean, setMean] = useState<string>('120');
  const [stdDev, setStdDev] = useState<string>('30');
  const [meanError, setMeanError] = useState<string>('');
  const [stdError, setStdError] = useState<string>('');
  const { toast } = useToast();

  // 🔴 Zustand store 연결 제거 - useMemo로 안정화
  const passengerData = useMemo(() => ({ pax_arrival_patterns: { default: { mean: null, std: null } } }), []);
  const setPaxArrivalPatternDefault = () => {}; // 빈 함수로 교체

  // 초기값 로드
  useEffect(() => {
    const currentDefault = passengerData.pax_arrival_patterns?.default;
    if (currentDefault) {
      if (currentDefault.mean !== null && currentDefault.mean !== undefined) {
        setMean(currentDefault.mean.toString());
      }
      if (currentDefault.std !== null && currentDefault.std !== undefined) {
        setStdDev(currentDefault.std.toString());
      }
    }
  }, [passengerData.pax_arrival_patterns?.default]);

  // 입력값 검증
  const validateInput = (value: string, type: 'mean' | 'std'): string => {
    if (value.trim() === '') return `${type === 'mean' ? 'Mean' : 'Standard deviation'} is required`;

    const num = parseFloat(value);
    if (isNaN(num)) return 'Must be a valid number';

    if (type === 'mean') {
      if (num < 0 || num > 1000) return 'Mean must be between 0-1000 minutes';
    } else {
      if (num <= 0 || num > 200) return 'Standard deviation must be between 0.1-200';
    }

    return '';
  };

  // 실시간 검증 (숫자만 허용)
  const handleMeanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자와 소수점만 허용
    const numericValue = value.replace(/[^0-9.]/g, '');
    setMean(numericValue);
    setMeanError(validateInput(numericValue, 'mean'));
  };

  const handleStdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자와 소수점만 허용
    const numericValue = value.replace(/[^0-9.]/g, '');
    setStdDev(numericValue);
    setStdError(validateInput(numericValue, 'std'));
  };

  // 엔터키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const meanErr = validateInput(mean, 'mean');
      const stdErr = validateInput(stdDev, 'std');

      if (!meanErr && !stdErr) {
        handleSave();
      } else {
        setMeanError(meanErr);
        setStdError(stdErr);
      }
    }
  };

  // Save 핸들러
  const handleSave = () => {
    const meanErr = validateInput(mean, 'mean');
    const stdErr = validateInput(stdDev, 'std');

    if (meanErr || stdErr) {
      setMeanError(meanErr);
      setStdError(stdErr);
      return;
    }

    const meanValue = parseFloat(mean);
    const stdValue = parseFloat(stdDev);

    // Zustand store에 저장
    setPaxArrivalPatternDefault({ mean: meanValue, std: stdValue });

    toast({
      title: 'Show-up Time 설정 완료',
      description: `평균 ${meanValue}분, 표준편차 ${stdValue}로 설정했습니다.`,
      variant: 'default',
    });

    if (onSave) {
      onSave();
    }
  };

  // 정규분포 곡선 데이터 생성
  const plotData = useMemo(() => {
    const meanNum = parseFloat(mean) || 120;
    const stdNum = parseFloat(stdDev) || 30;

    if (isNaN(meanNum) || isNaN(stdNum) || stdNum <= 0) {
      return { x: [], y: [] };
    }

    // 정규분포 범위: 평균 ± 4 표준편차
    const rangeStart = Math.max(0, meanNum - 4 * stdNum);
    const rangeEnd = meanNum + 4 * stdNum;
    const steps = 200;
    const stepSize = (rangeEnd - rangeStart) / steps;

    const x: number[] = [];
    const y: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const xVal = rangeStart + i * stepSize;
      // 정규분포 확률밀도함수
      const yVal = (1 / (stdNum * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - meanNum) / stdNum, 2));
      x.push(xVal);
      y.push(yVal);
    }

    return { x, y };
  }, [mean, stdDev]);

  const isValid = !meanError && !stdError && mean.trim() && stdDev.trim();

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-primary pl-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-default-900">Define Show-up Time</h3>
            <p className="text-sm text-default-500">Define default show-up time distribution for all flights</p>
          </div>
          <Button variant="primary" className="gap-2" onClick={handleSave} disabled={!isValid}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-6 pl-6">
        {/* Input Fields */}
        <div className="grid max-w-md grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Mean (minutes)</label>
            <Input
              type="text"
              value={mean}
              onChange={handleMeanChange}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.target.select()}
              placeholder="120"
              className={meanError ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {meanError && <span className="text-xs text-red-600">{meanError}</span>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Standard Deviation</label>
            <Input
              type="text"
              value={stdDev}
              onChange={handleStdChange}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.target.select()}
              placeholder="30"
              className={stdError ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {stdError && <span className="text-xs text-red-600">{stdError}</span>}
          </div>
        </div>

        {/* Normal Distribution Chart */}
        {isValid && plotData.x.length > 0 && (
          <div className="rounded-lg border bg-white p-4">
            <h4 className="mb-3 text-sm font-medium text-gray-700">Normal Distribution Preview</h4>
            <Plot
              data={[
                {
                  x: plotData.x,
                  y: plotData.y,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Probability Density',
                  line: {
                    color: '#8B5CF6', // Primary color
                    width: 3,
                  },
                  fill: 'tonexty',
                  fillcolor: 'rgba(139, 92, 246, 0.1)',
                },
              ]}
              layout={{
                title: {
                  text: `Normal Distribution (μ=${mean}, σ=${stdDev})`,
                  font: { size: 14 },
                },
                xaxis: {
                  title: 'Time (minutes)',
                  showgrid: true,
                  zeroline: false,
                },
                yaxis: {
                  title: 'Probability Density',
                  showgrid: true,
                  zeroline: false,
                },
                margin: { t: 40, r: 20, b: 40, l: 60 },
                height: 300,
                showlegend: false,
                hovermode: 'x',
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
              }}
              config={{
                displayModeBar: false,
                responsive: true,
              }}
              style={{ width: '100%', height: '300px' }}
            />
          </div>
        )}

        {!isValid && (
          <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
            <p>Enter valid mean and standard deviation values to see the normal distribution preview</p>
          </div>
        )}
      </div>
    </div>
  );
};
