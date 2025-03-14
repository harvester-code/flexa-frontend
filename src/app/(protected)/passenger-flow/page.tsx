'use client';

import { useEffect, useState } from 'react';
import ContentsHeader from '@/components/ContentsHeader';

function PassengerFlowPage() {
  const [mapUrl, setMapUrl] = useState<string>('');

  useEffect(() => {
    const fetchPassengerFlowMap = async () => {
      const res = await fetch('http://localhost:8000/api/v1/passenger-flows/maps');
      const { url } = await res.json();

      setMapUrl(url);
    };

    fetchPassengerFlowMap();
  }, []);
  return (
    <div className="mx-auto max-w-[1340px] px-[30px] pb-24">
      <ContentsHeader text="Passenger Flow" />

      <div className="mt-8 text-lg">개발 진행중입니다.</div>

      {/* {mapUrl ? (
        <iframe src={mapUrl} width="100%" height={800} loading="lazy" referrerPolicy="no-referrer"></iframe>
      ) : (
        <div>Loading...</div>
      )} */}
    </div>
  );
}

export default PassengerFlowPage;
