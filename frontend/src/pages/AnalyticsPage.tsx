import TrafficAnalytics from "../modules/features/traffic/components/TrafficAnalyticsClean";
import { useEffect } from "react";
import { useTrafficStore } from "@/hooks/useTrafficStore";

const AnalyticsPage = () => {
  // Use central traffic store which starts fetching after login
  const { trafficData, allowedRoads } = useTrafficStore();

  // small defensive hook: ensure allowedRoads is stable
  useEffect(() => {}, [allowedRoads]);

  return (
    <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        <TrafficAnalytics
          trafficData={trafficData}
          allowedRoads={allowedRoads}
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;
