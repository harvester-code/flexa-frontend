import { useQuery } from "@tanstack/react-query";
import { fetchPassengerTimelines } from "@/services/homeService";
import type { PassengerTimelineData } from "@/types/viewerTypes";

export function usePassengerTimeline(scenarioId: string | null) {
  return useQuery<PassengerTimelineData>({
    queryKey: ["passenger-timelines", scenarioId],
    queryFn: async () => {
      if (!scenarioId) throw new Error("No scenario id");
      const res = await fetchPassengerTimelines({ scenarioId });
      return (res as { data: PassengerTimelineData }).data ?? (res as PassengerTimelineData);
    },
    enabled: !!scenarioId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
