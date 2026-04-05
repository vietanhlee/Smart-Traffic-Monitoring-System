import React from "react";

export type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};

export type HistoricalDataPoint = {
  time: string;
  [key: string]: number | string;
};

export type TrafficStore = {
  allowedRoads: string[];
  trafficData: Record<string, VehicleData>;
  isAnyConnected: boolean;
  areAllConnected: boolean;
  connections: Record<string, boolean>;
};

export const TrafficContext = React.createContext<TrafficStore | null>(null);
