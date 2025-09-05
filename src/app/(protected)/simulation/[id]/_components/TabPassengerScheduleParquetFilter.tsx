'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import PassengerConfigTab from './PassengerConfigTab';
import SimpleLoadFactorTab from './SimpleLoadFactorTab';
import SimpleNationalityTab from './SimpleNationalityTab';
import SimplePaxProfileTab from './SimplePaxProfileTab';
import SimpleShowUpTimeTab from './SimpleShowUpTimeTab';

interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

interface TabPassengerScheduleParquetFilterProps {
  parquetMetadata: ParquetMetadataItem[];
}

export default function TabPassengerScheduleParquetFilter({ parquetMetadata }: TabPassengerScheduleParquetFilterProps) {
  // Tab configurations
  const tabConfigs = {
    nationality: {
      type: 'nationality' as const,
      defaultValues: {},
      labels: {
        step1Title: 'Define Nationalities',
        step3Title: 'Assign Distribution',
      },
    },
    profile: {
      type: 'profile' as const,
      defaultValues: { general: 1 },
      labels: {
        step1Title: 'Define Passenger Profiles',
        step3Title: 'Assign Distribution',
      },
    },
    loadfactor: {
      type: 'load_factor' as const,
      defaultValues: {},
      labels: {
        step1Title: 'Define Load Factor',
        step3Title: 'Assign Values',
      },
    },
    showuptime: {
      type: 'pax_arrival_patterns' as const,
      defaultValues: { mean: 120.0, std: 30.0 },
      labels: {
        step1Title: 'Define Arrival Patterns',
        step3Title: 'Assign Patterns',
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Add Passenger Profiles</div>
            <p className="text-sm font-normal text-default-500">Set criteria to create passenger profiles</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nationality" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="nationality">Nationality</TabsTrigger>
            <TabsTrigger value="nationality2">Nationality2</TabsTrigger>
            <TabsTrigger value="profile">Pax Profile</TabsTrigger>
            <TabsTrigger value="profile2">Pax Profile2</TabsTrigger>
            <TabsTrigger value="loadfactor">Load Factor</TabsTrigger>
            <TabsTrigger value="showuptime">Show-up-Time</TabsTrigger>
            <TabsTrigger value="loadfactor2">Load Factor2</TabsTrigger>
            <TabsTrigger value="showuptime2">Show-up-Time2</TabsTrigger>
          </TabsList>

          <TabsContent value="nationality" className="mt-6">
            <PassengerConfigTab config={tabConfigs.nationality} parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="nationality2" className="mt-6">
            <SimpleNationalityTab parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <PassengerConfigTab config={tabConfigs.profile} parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="loadfactor" className="mt-6">
            <PassengerConfigTab config={tabConfigs.loadfactor} parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="showuptime" className="mt-6">
            <PassengerConfigTab config={tabConfigs.showuptime} parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="loadfactor2" className="mt-6">
            <SimpleLoadFactorTab parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="profile2" className="mt-6">
            <SimplePaxProfileTab parquetMetadata={parquetMetadata} />
          </TabsContent>
          <TabsContent value="showuptime2" className="mt-6">
            <SimpleShowUpTimeTab parquetMetadata={parquetMetadata} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
