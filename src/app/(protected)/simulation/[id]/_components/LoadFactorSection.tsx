import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadFactorSlider } from '@/components/ui/LoadFactorSlider';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../_stores';

interface LoadFactorSectionProps {
  onSave?: () => void;
  // TODO: 실제 데이터 타입으로 교체
}

export const LoadFactorSection: React.FC<LoadFactorSectionProps> = ({ onSave }) => {
  const [defaultLoadFactor, setDefaultLoadFactor] = useState<number>(80);
  const { toast } = useToast();

  // Zustand store 연결
  const passengerData = useSimulationStore((state) => state.passenger);
  const setPaxGenerationDefault = useSimulationStore((state) => state.setPaxGenerationDefault);

  // 초기값 로드: store에서 현재 default load factor 값을 가져옴
  useEffect(() => {
    const currentDefault = passengerData.pax_generation?.default?.load_factor;
    if (currentDefault !== null && currentDefault !== undefined) {
      setDefaultLoadFactor(Math.round(currentDefault * 100)); // 0.0-1.0 → 0-100%
    }
  }, [passengerData.pax_generation?.default?.load_factor]);

  const handleLoadFactorChange = (value: number) => {
    setDefaultLoadFactor(value);
  };

  const handleSave = () => {
    // Zustand store에 저장 (0-100% → 0.0-1.0 변환)
    const decimalValue = defaultLoadFactor / 100;
    setPaxGenerationDefault(decimalValue);

    console.log('Saving default load factor:', defaultLoadFactor, '% (', decimalValue, ')');

    toast({
      title: '탑승률 설정 완료',
      description: `기본 탑승률을 ${defaultLoadFactor}%로 설정했습니다.`,
      variant: 'default',
    });

    // Add Rules 버튼 활성화
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-primary pl-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-default-900">Define Load Factor</h3>
            <p className="text-sm text-default-500">Define default load factor for all flights</p>
          </div>
          <Button variant="primary" className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-4 pl-6">
        {/* Load Factor Slider */}
        <div className="max-w-md">
          <LoadFactorSlider
            value={defaultLoadFactor}
            onChange={handleLoadFactorChange}
            onEnterSave={handleSave}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
};
