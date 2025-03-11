'use client';

import { useEffect, useState } from 'react';

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
    <>
      <div>PassengerFlowPage</div>
      {mapUrl ? (
        <iframe src={mapUrl} width="100%" height={800} loading="lazy" referrerPolicy="no-referrer"></iframe>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}

export default PassengerFlowPage;
