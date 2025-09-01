'use client';

import React from 'react';
import { ChevronDown, Loader2, Plane } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';

interface TabFlightScheduleResponsePreviewProps {
  loading: boolean;
  data: any | null;
  error: string | null;
}

// ==================== Component ====================
function TabFlightScheduleResponsePreview({ loading, data, error }: TabFlightScheduleResponsePreviewProps) {
  // 컴포넌트가 표시되지 않는 조건
  if (!loading && !data && !error) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-green-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded bg-green-100 p-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
          ) : (
            <Plane className="h-4 w-4 text-green-600" />
          )}
        </div>
        <span className="font-medium text-slate-800">
          Response Preview
          {data && <span className="ml-2 text-sm text-green-600">✓ {data.total || 0} flights found</span>}
        </span>
      </div>

      {loading && (
        <div className="rounded border bg-white p-3 text-center text-sm text-slate-600">Loading response data...</div>
      )}

      {error && (
        <div className="rounded border bg-red-50 p-3 text-sm text-red-700">
          <div className="font-medium">Error:</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      {data && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer rounded border bg-white p-3 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-700">
                  Response Data ({JSON.stringify(data).length} chars)
                </span>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded border bg-white p-3 font-mono text-sm">
              <pre className="whitespace-pre-wrap text-slate-700">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default TabFlightScheduleResponsePreview;

