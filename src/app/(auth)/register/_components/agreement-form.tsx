'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/UIs/Checkbox';
import { Label } from '@/components/UIs/Label';

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
    <div className="checkboxContainer">
      <dl>
        <dt>
          <div className="flex items-center space-x-10">
            <Checkbox
              id="agreeToAll"
              checked={agreeToAll}
              onCheckedChange={handleAgreeToAll}
              className="checkbox"
            />
            <Label htmlFor="agreeToAll" className="text-base font-semibold">
              Agree to All
            </Label>
          </div>
        </dt>
        <dd>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-10">
              <Checkbox
                id="termsOfUse"
                checked={termsOfUse}
                onCheckedChange={(checked) => setTermsOfUse(checked as boolean)}
                className="checkbox"
              />
              <Label htmlFor="termsOfUse" className="text-sm">
                Terms of Use <span className="text-red">(Required)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-10">
              <Checkbox
                id="privacyPolicy"
                checked={privacyPolicy}
                onCheckedChange={(checked) => setPrivacyPolicy(checked as boolean)}
                className="checkbox"
              />
              <Label htmlFor="privacyPolicy" className="text-sm">
                Privacy Policy <span className="text-red">(Required)</span>
              </Label>
            </div>
          </div>
        </dd>
      </dl>
    </div>
  );
}
