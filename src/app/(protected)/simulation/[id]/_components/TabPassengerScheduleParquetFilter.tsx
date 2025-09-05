'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nationality">Nationality</TabsTrigger>
            <TabsTrigger value="profile">Pax Profile</TabsTrigger>
            <TabsTrigger value="loadfactor">Load Factor</TabsTrigger>
            <TabsTrigger value="showuptime">Show-up-Time</TabsTrigger>
          </TabsList>

          <TabsContent value="nationality" className="mt-6">
            <SimpleNationalityTab parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <SimplePaxProfileTab parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="loadfactor" className="mt-6">
            <SimpleLoadFactorTab parquetMetadata={parquetMetadata} />
          </TabsContent>

          <TabsContent value="showuptime" className="mt-6">
            <SimpleShowUpTimeTab parquetMetadata={parquetMetadata} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
