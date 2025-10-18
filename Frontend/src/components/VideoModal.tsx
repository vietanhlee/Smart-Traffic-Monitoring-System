import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
              : "w-[70vw] h-[90vh] max-w-4xl max-h-4xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Camera: {roadName}
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
          <div className="flex-1 flex flex-row">
            {/* Video */}
            <div className="relative bg-gray-100 dark:bg-gray-700 p-4 flex-1 flex items-center justify-center">
              <div className="relative aspect-video w-full h-full rounded-lg overflow-hidden">
                {frameData ? (
                  <img
                    src={frameData}
                    alt={`Camera ${roadName}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p>Đang tải video...</p>
                    </div>
                  </div>
                )}

                {/* Live Indicator removed per request */}
              </div>
            </div>

            {/* Traffic Info Right Side */}
            {trafficData && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto w-64 max-h-[70vh]">
                <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-white flex items-center space-x-1">
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded text-white">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <span>Thông Tin Giao Thông</span>
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  {/* Vehicle Count Card */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1 text-xs">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <svg
                          className="h-3 w-3 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <span>Số Lượng Phương Tiện</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <svg
                              className="h-3 w-3 text-blue-600 dark:text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Ô tô
                          </span>
                        </div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                          {trafficData.count_car}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                            <svg
                              className="h-3 w-3 text-green-600 dark:text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Xe máy
                          </span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                          {trafficData.count_motor}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tổng cộng
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                          {trafficData.count_car + trafficData.count_motor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Speed Card */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 text-sm">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <svg
                          className="h-3 w-3 text-orange-600 dark:text-orange-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <span>Tốc Độ Trung Bình</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <svg
                              className="h-3 w-3 text-blue-600 dark:text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Ô tô
                          </span>
                        </div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                          {trafficData.speed_car.toFixed(1)} km/h
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                            <svg
                              className="h-3 w-3 text-green-600 dark:text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Xe máy
                          </span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                          {trafficData.speed_motor.toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 text-sm">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <svg
                          className="h-3 w-3 text-purple-600 dark:text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span>Tình Trạng Giao Thông</span>
                    </h4>
                    <div className="text-center">
                      {(() => {
                        const total =
                          trafficData.count_car + trafficData.count_motor;
                        if (total > 15) {
                          return (
                            <div className="flex items-center justify-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-lg">
                                <svg
                                  className="h-4 w-4 text-red-600 dark:text-red-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                  />
                                </svg>
                              </div>
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                Tắc nghẽn
                              </span>
                            </div>
                          );
                        } else if (total > 8) {
                          return (
                            <div className="flex items-center justify-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <svg
                                  className="h-4 w-4 text-yellow-600 dark:text-yellow-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                                Đông đúc
                              </span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                                <svg
                                  className="h-4 w-4 text-green-600 dark:text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                Thông thoáng
                              </span>
                            </div>
                          );
                        }
                      })()}
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
