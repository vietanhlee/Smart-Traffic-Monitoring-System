/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
import { endpoints } from "@/config";
import { useMultipleTrafficInfo } from "./useWebSocket";
import { TrafficContext } from "./TrafficContext";
import type { TrafficStore } from "./TrafficContext";

export function TrafficProvider({ children }: { children: React.ReactNode }) {
  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  // fetch roads when token is present (or on mount if public)
  useEffect(() => {
    let mounted = true;

    const fetchRoads = async () => {
      try {
        const res = await fetch(endpoints.roadNames);
        if (!mounted) return;
        if (!res.ok) {
          setAllowedRoads([]);
          return;
        }
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        setAllowedRoads(names);
      } catch {
        if (!mounted) return;
        setAllowedRoads([]);
      }
    };

    fetchRoads();

    return () => {
      mounted = false;
    };
  }, []);

  // Use existing hook to open ws connections for all roads
  const { trafficData, connections, isAnyConnected, areAllConnected } =
    useMultipleTrafficInfo(allowedRoads);

  const value: TrafficStore = {
    allowedRoads,
    trafficData,
    isAnyConnected,
    areAllConnected,
    connections,
  };

  return (
    <TrafficContext.Provider value={value}>{children}</TrafficContext.Provider>
  );
}

export function useTrafficStore() {
  const ctx = React.useContext(TrafficContext);
  if (!ctx) {
    throw new Error("useTrafficStore must be used within <TrafficProvider />");
  }
  return ctx;
}

export default TrafficProvider;
