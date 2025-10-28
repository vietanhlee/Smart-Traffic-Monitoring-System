import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, Video, Car, Bike, Timer } from "lucide-react";
import { Button } from "@/ui/button";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadName: string;
  frameData: string | null; // Now using blob URL string
  trafficData?: {
    count_car: number;
    count_motor: number;
    speed_car: number;
    speed_motor: number;
  };
}

const VideoModal = ({
  isOpen,
  onClose,
  roadName,
  frameData,
  trafficData,
}: VideoModalProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden ${
            isFullscreen
              ? "w-screen h-screen rounded-none"
              : "w-[95vw] sm:w-auto h-auto max-w-6xl mx-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <span className="truncate">Camera: {roadName}</span>
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Video Content */}
          <div className="flex flex-col lg:flex-row max-h-[85vh] sm:max-h-[80vh]">
            {/* Video */}
            <div className="relative bg-gray-100 dark:bg-gray-700 p-3 sm:p-6 flex-1 flex items-center justify-center min-h-[40vh] lg:min-h-0">
              <div className="relative w-full h-full flex items-center justify-center">
                {frameData ? (
                  <img
                    src={frameData}
                    alt={`Camera ${roadName}`}
                    className="max-w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm sm:text-base">Đang tải video...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Traffic Info - Responsive Side/Bottom Panel */}
            {trafficData && (
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 overflow-y-auto w-full lg:w-80 max-h-[40vh] lg:max-h-[80vh]">
                <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
                  <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <span>Thông Tin Giao Thông</span>
                </h3>

                {/* Traffic Status Section */}
                <div className="mb-3 sm:mb-4 bg-white dark:bg-gray-900 p-2 sm:p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    Tình Trạng
                  </h4>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {(() => {
                      const totalVehicles =
                        (trafficData?.count_car || 0) +
                        (trafficData?.count_motor || 0);
                      if (totalVehicles > 20) {
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Trạng thái:
                            </span>
                            <span className="font-medium text-xs sm:text-sm bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-red-700 dark:text-red-300">
                              Tắc nghẽn
                            </span>
                          </div>
                        );
                      } else if (totalVehicles > 8) {
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Trạng thái:
                            </span>
                            <span className="font-medium text-xs sm:text-sm bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-yellow-700 dark:text-yellow-300">
                              Đông đúc
                            </span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Trạng thái:
                            </span>
                            <span className="font-medium text-xs sm:text-sm bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-green-700 dark:text-green-300">
                              Thông thoáng
                            </span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Car Section */}
                <div className="mb-2 bg-white dark:bg-gray-900 p-2 sm:p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs sm:text-sm font-medium mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Car className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    Thông Tin Ô Tô
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Số lượng:
                      </span>
                      <span className="font-medium text-xs sm:text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-700 dark:text-blue-300">
                        {trafficData?.count_car || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Vận tốc:
                      </span>
                      <span className="font-medium text-xs sm:text-sm bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-green-700 dark:text-green-300">
                        {trafficData?.speed_car || 0} km/h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Motorcycle Section */}
                <div className="mb-2 bg-white dark:bg-gray-900 p-2 sm:p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs sm:text-sm font-medium mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Bike className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                    Thông Tin Xe Máy
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Số lượng:
                      </span>
                      <span className="font-medium text-xs sm:text-sm bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded text-purple-700 dark:text-purple-300">
                        {trafficData?.count_motor || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Vận tốc:
                      </span>
                      <span className="font-medium text-xs sm:text-sm bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-green-700 dark:text-green-300">
                        {trafficData?.speed_motor || 0} km/h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoModal;
