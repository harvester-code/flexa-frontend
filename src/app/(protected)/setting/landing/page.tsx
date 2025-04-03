'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import TheSlider from '@/components/TheSlider';
import { snapshot } from './samples';

const LandingCanvas = dynamic(() => import('./_components/LandingCanvas'), { ssr: false });

function LandPage() {
  const [markers, setMarkers] = useState([50]); // 초기 값

  function minutesToTimeString(value: number): string {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    // padStart(2, '0')로 두 자리로 포맷
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  function generateTimeData() {
    const data = {};

    for (let i = 0; i < 1440; i++) {
      const hours = Math.floor(i / 60)
        .toString()
        .padStart(2, '0');
      const minutes = (i % 60).toString().padStart(2, '0');
      const timeKey = `${hours}:${minutes}`;

      data[timeKey] = [
        Math.floor(Math.random() * 101),
        Math.floor(Math.random() * 101),
        Math.floor(Math.random() * 101),
      ]; // 0 ~ 100 랜덤 숫자
    }

    return data;
  }

  const timeData = generateTimeData();

  return (
    <div className="mx-auto max-w-[1340px] px-8 pb-24">
      <LandingCanvas snapshot={snapshot} dataLength={timeData[minutesToTimeString(markers[0])]} />
      <TheSlider
        className="mt-8"
        max={1439}
        defaultValue={[50]}
        value={markers}
        form={minutesToTimeString(markers[0])}
        onValueChange={setMarkers}
      />
    </div>
  );
}

export default LandPage;
