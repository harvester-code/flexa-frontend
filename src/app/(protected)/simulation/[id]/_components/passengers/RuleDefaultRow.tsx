import { type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

interface RuleDefaultRowProps {
  remainingFlights: number;
  totalFlights: number;
  children: ReactNode;
}

export default function RuleDefaultRow({
  remainingFlights,
  totalFlights,
  children,
}: RuleDefaultRowProps) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="pointer-events-none border-0 bg-green-100 text-green-700">
            Default
          </Badge>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">{remainingFlights}</span>
            <span className="text-sm text-gray-500">/ {totalFlights}</span>
            <span className="text-sm text-gray-500">flights</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
