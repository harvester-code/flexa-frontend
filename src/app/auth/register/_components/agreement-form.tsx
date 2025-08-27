'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';

interface AgreementFormProps {
  onAgreeAll: (agreed: boolean) => void;
}

export function AgreementForm({ onAgreeAll }: AgreementFormProps) {
  const [agreeToAll, setAgreeToAll] = useState(false);
  const [termsOfUse, setTermsOfUse] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);

  useEffect(() => {
    if (termsOfUse && privacyPolicy) {
      setAgreeToAll(true);
      onAgreeAll(true);
    } else {
      setAgreeToAll(false);
      onAgreeAll(false);
    }
  }, [termsOfUse, privacyPolicy, onAgreeAll]);

  const handleAgreeToAll = (checked: boolean) => {
    setAgreeToAll(checked);
    setTermsOfUse(checked);
    setPrivacyPolicy(checked);
    onAgreeAll(checked);
  };

  return (
    <div className="rounded-lg border border-input bg-muted/50 p-4">
      <div className="border-b border-input pb-3 mb-3">
        <div className="flex items-center space-x-3">
          <Checkbox 
            id="agreeToAll" 
            checked={agreeToAll} 
            onCheckedChange={handleAgreeToAll}
            className="size-4"
          />
          <Label htmlFor="agreeToAll" className="text-sm font-semibold text-primary-900 cursor-pointer">
            Agree to All
          </Label>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="termsOfUse"
            checked={termsOfUse}
            onCheckedChange={(checked) => setTermsOfUse(checked as boolean)}
            className="size-4"
          />
          <Label htmlFor="termsOfUse" className="text-sm text-primary-900 cursor-pointer">
            Terms of Use <span className="text-primary font-medium">(Required)</span>
          </Label>
        </div>
        
        <div className="flex items-center space-x-3">
          <Checkbox
            id="privacyPolicy"
            checked={privacyPolicy}
            onCheckedChange={(checked) => setPrivacyPolicy(checked as boolean)}
            className="size-4"
          />
          <Label htmlFor="privacyPolicy" className="text-sm text-primary-900 cursor-pointer">
            Privacy Policy <span className="text-primary font-medium">(Required)</span>
          </Label>
        </div>
      </div>
    </div>
  );
}
