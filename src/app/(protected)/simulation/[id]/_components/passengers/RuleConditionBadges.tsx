import { Badge } from "@/components/ui/Badge";
import { ParquetMetadataItem } from "@/types/parquet";
import { groupConditionsByCategory } from "./utils/ruleConditions";

interface RuleConditionBadgesProps {
  conditions: string[];
  parquetMetadata?: ParquetMetadataItem[];
}

function RuleConditionBadges({ conditions, parquetMetadata }: RuleConditionBadgesProps) {
  if (conditions.length === 0) return null;

  const grouped = groupConditionsByCategory(conditions);
  const visibleEntries = Object.entries(grouped).filter(([cat]) => cat !== "Flight Number");
  const flightNumbers = grouped["Flight Number"] ?? [];

  let badgeEntries: [string, string[]][] = visibleEntries;

  if (visibleEntries.length === 0 && flightNumbers.length > 0) {
    const fnMeta = parquetMetadata?.find((item) => item.column === "flight_number");
    const airlineMeta = parquetMetadata?.find((item) => item.column === "operating_carrier_name");
    if (fnMeta && airlineMeta) {
      const flightToAirline: Record<string, string> = {};
      Object.entries(airlineMeta.values).forEach(([airline, data]) => {
        data.flights.forEach((fid) => {
          flightToAirline[fid] = airline;
        });
      });
      const airlines = new Set<string>();
      flightNumbers.forEach((fnNo) => {
        fnMeta.values[fnNo]?.flights.forEach((fid) => {
          const a = flightToAirline[fid];
          if (a) airlines.add(a);
        });
      });
      badgeEntries = [...airlines].map((a) => [a, [a]]);
    }
  }

  if (badgeEntries.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {badgeEntries.map(([category, values]) => (
          <Badge
            key={category}
            variant="secondary"
            className="border-0 bg-blue-100 px-3 py-1 text-xs text-blue-700"
          >
            {(values as string[]).join(" | ")}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default RuleConditionBadges;
