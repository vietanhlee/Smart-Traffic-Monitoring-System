import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Eye,
  EyeOff,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import VideoModal from "./VideoModal";
import RoadCamera from "./RoadCamera";

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface VideoMonitorProps {
  trafficData: TrafficData;
  allowedRoads: string[];
  selectedRoad: string | null;
  setSelectedRoad: (road: string | null) => void;
  loading: boolean;
  isFullscreen: boolean;
}

const VideoMonitor = ({
  trafficData,
  allowedRoads,
  selectedRoad,
  loading,
  isFullscreen,
}: VideoMonitorProps) => {
  const [showFrames, setShowFrames] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRoadName, setModalRoadName] = useState<string>("");


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Giám Sát Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-4 ${
              isFullscreen
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {allowedRoads.map((road) => (
              <div key={road} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Giám Sát Video</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFrames(!showFrames)}
          >
            {showFrames ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="ml-2">{showFrames ? "Ẩn" : "Hiện"} Video</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`grid gap-6 ${
            isFullscreen
              ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          <AnimatePresence>
            {allowedRoads.map((roadName) => {
              const data = trafficData[roadName];
              const isSelected = selectedRoad === roadName;

              return (
                <RoadCamera
                  key={roadName}
                  roadName={roadName}
                  trafficData={data}
                  isSelected={isSelected}
                  showFrames={showFrames}
                  onClick={() => {
                    setModalRoadName(roadName);
                    setModalOpen(true);
                  }}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>

      {/* Video Modal */}
      <VideoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        roadName={modalRoadName}
        trafficData={trafficData[modalRoadName]}
      />
    </Card>
  );
};

export default VideoMonitor;
