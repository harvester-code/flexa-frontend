import { useMemo } from "react";
import type { ChartData } from "@/types/simulationTypes";
import type { PassengerData } from "../../../_stores/store";

interface UseTimeSlotGenerationProps {
  appliedTimeUnit: number;
  chartResult: PassengerData["chartResult"];
  contextDate: string | null;
}

export function useTimeSlotGeneration({
  appliedTimeUnit,
  chartResult,
  contextDate,
}: UseTimeSlotGenerationProps) {
  // Generate time slots (from chartResult range if available, otherwise default)
  const { timeSlots, isPreviousDay } = useMemo(() => {
    const slots: string[] = [];
    const unitMinutes = Math.max(1, Math.min(60, appliedTimeUnit)); // Limit between 1-60 minutes
    let isPrev = false;

    // Generate from chartResult range if available
    if (chartResult?.chart_x_data && chartResult.chart_x_data.length > 0) {
      // Find first passenger time
      const chartData = chartResult.chart_y_data;
      const totalPassengersByTime: number[] = new Array(
        chartResult.chart_x_data.length
      ).fill(0);

      if (chartData) {
        Object.values(chartData).forEach((airlineSeries) => {
          airlineSeries.forEach((airline) => {
            airline.y.forEach((count, idx) => {
              totalPassengersByTime[idx] += count;
            });
          });
        });
      }

      // Find first/last passenger times
      const firstPassengerIndex = totalPassengersByTime.findIndex(
        (count) => count > 0
      );
      const lastPassengerIndex = totalPassengersByTime.findLastIndex(
        (count) => count > 0
      );

      if (firstPassengerIndex !== -1 && lastPassengerIndex !== -1) {
        // Round start time down to 30-minute intervals
        const startDateTime = chartResult.chart_x_data[firstPassengerIndex];
        const [startDate, startTime] = startDateTime.split(" ");
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const roundedStartMinute = Math.floor(startMinute / 30) * 30;
        const roundedStartHour = startHour;

        // Check if start is from previous day
        const currentDate =
          contextDate || new Date().toISOString().split("T")[0];
        isPrev = startDate < currentDate;

        // Add times from previous day if applicable
        if (isPrev) {
          // Add previous day times
          for (let hour = roundedStartHour; hour < 24; hour++) {
            const minuteStart =
              hour === roundedStartHour ? roundedStartMinute : 0;
            for (let minute = minuteStart; minute < 60; minute += unitMinutes) {
              const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
              slots.push(timeStr);
            }
          }
        }

        // Add current day times, ensuring we always reach the end of the day
        const maxHour = 24;
        const startHourForToday = isPrev ? 0 : roundedStartHour;
        const startMinuteForToday = isPrev ? 0 : roundedStartMinute;

        for (let hour = startHourForToday; hour < maxHour; hour++) {
          const minuteStart =
            hour === startHourForToday && !isPrev ? startMinuteForToday : 0;
          for (let minute = minuteStart; minute < 60; minute += unitMinutes) {
            const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            slots.push(timeStr);
          }
        }

        return { timeSlots: slots, isPreviousDay: isPrev };
      }
    }

    // Default: 00:00 to 24:00
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += unitMinutes) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return { timeSlots: slots, isPreviousDay: false };
  }, [appliedTimeUnit, chartResult, contextDate]);

  return { timeSlots, isPreviousDay };
}
