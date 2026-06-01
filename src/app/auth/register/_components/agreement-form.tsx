'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';

interface AgreementFormProps {
  onAgreeAll: (agreed: boolean) => void;
}

export function AgreementForm({ onAgreeAll }: AgreementFormProps) {
  const [termsOfUse, setTermsOfUse] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const agreeToAll = termsOfUse && privacyPolicy;

  const handleAgreeToAll = (checked: boolean) => {
    setTermsOfUse(checked);
    setPrivacyPolicy(checked);
    onAgreeAll(checked);
  };

  const handleTermsChange = (checked: boolean) => {
    setTermsOfUse(checked);
    onAgreeAll(checked && privacyPolicy);
  };

  const handlePrivacyChange = (checked: boolean) => {
    setPrivacyPolicy(checked);
    onAgreeAll(termsOfUse && checked);
  };

  return (
    <div className="rounded-lg border border-input bg-muted/50 p-4">
      <div className="mb-3 border-b border-input pb-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="agreeToAll"
            checked={agreeToAll}
            onCheckedChange={(checked) => handleAgreeToAll(checked === true)}
          />
          <Label htmlFor="agreeToAll" className="cursor-pointer text-sm font-semibold text-default-900">
            Agree to All
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="termsOfUse"
            checked={termsOfUse}
            onCheckedChange={(checked) => handleTermsChange(checked === true)}
          />
          <Label htmlFor="termsOfUse" className="cursor-pointer text-sm text-default-900">
            Terms of Use <span className="font-medium text-primary">(Required)</span>
          </Label>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="privacyPolicy"
            checked={privacyPolicy}
            onCheckedChange={(checked) => handlePrivacyChange(checked === true)}
          />
          <Label htmlFor="privacyPolicy" className="cursor-pointer text-sm text-default-900">
            Privacy Policy <span className="font-medium text-primary">(Required)</span>
          </Label>
        </div>
      </div>
    </div>
  );
}
