import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SetDistributionDialogProps {
  title?: string;
  children: React.ReactNode; // 중간 값 설정 컴포넌트 부분

  // 상태 관리
  isValid: boolean;
  totalValue?: number; // nationality/profile의 경우 100%, load_factor의 경우 사용 안함
  selectedFlights?: number;
  totalFlights?: number;

  // 액션 핸들러
  onCreate: () => void;
  onCancel?: () => void;

  // UI 설정
  showFlightValidation?: boolean; // flight 선택 유효성 표시 여부
  showTotalValidation?: boolean; // 총합 유효성 표시 여부 (nationality/profile에서 사용)
  createButtonText?: string;
  isCreateDisabled?: boolean;
}

export const SetDistributionDialog: React.FC<SetDistributionDialogProps> = ({
  title = 'Set Distribution',
  children,
  isValid,
  totalValue,
  selectedFlights = 0,
  totalFlights = 0,
  onCreate,
  onCancel,
  showFlightValidation = true,
  showTotalValidation = false,
  createButtonText = 'Create',
  isCreateDisabled = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header with title */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-default-900">{title}</h4>
      </div>

      {/* Content area - 타입별로 다른 값 설정 컴포넌트 */}
      <div className="rounded-md border p-4">
        {children}

        {/* Validation Status */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            {/* Flight Selection Validation */}
            {showFlightValidation && (
              <div className="flex items-center gap-2">
                {selectedFlights > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${selectedFlights > 0 ? 'text-green-700' : 'text-red-500'}`}>
                  Selected: {selectedFlights} Flight{selectedFlights !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Total/Distribution Validation */}
            {showTotalValidation && totalValue !== undefined && (
              <div className="flex items-center gap-2">
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-red-500'}`}>
                  Total: {Math.round(totalValue)}%
                </span>
              </div>
            )}
          </div>

          {/* Create Button */}
          <Button onClick={onCreate} disabled={isCreateDisabled} className="px-6">
            {createButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
