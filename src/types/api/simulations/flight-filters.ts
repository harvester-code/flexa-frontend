/** GET /api/v1/simulations/{scenario_id}/flight-filters */

export interface FlightFilterOption {
  total_flights: number;
  airlines: Record<
    string,
    {
      count: number;
      flight_numbers: number[];
    }
  >;
}

export interface RegionFlightFilterOption {
  total_flights: number;
  countries: Record<string, FlightFilterOption>;
}

export interface AircraftClassFlightFilterOption {
  total_flights: number;
  aircraft_types: Record<string, { count: number; flight_numbers: string[] }>;
}

export interface FlightDirectionFilters {
  total_flights: number;
  departure_terminal?: Record<string, FlightFilterOption>;
  arrival_terminal?: Record<string, FlightFilterOption>;
  arrival_region?: Record<string, RegionFlightFilterOption>;
  departure_region?: Record<string, RegionFlightFilterOption>;
  flight_type?: Record<string, FlightFilterOption>;
  aircraft_class?: Record<string, AircraftClassFlightFilterOption>;
}

export interface FlightFiltersResponse {
  airport: string;
  date: string;
  scenario_id: string;
  total_flights: number;
  airlines: Record<string, string>;
  filters: {
    departure: FlightDirectionFilters;
    arrival: FlightDirectionFilters;
  };
}

/** Store / tab state derived from flight-filters response */
export interface FlightFiltersSummary {
  total_flights: number;
  airlines: Record<string, string>;
  filters: FlightFiltersResponse['filters'];
}
