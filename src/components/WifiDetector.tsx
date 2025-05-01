
import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface WifiDetectorProps {
  onWifiDetected: () => void;
}

const WifiDetector: React.FC<WifiDetectorProps> = ({ onWifiDetected }) => {
  const [isDetecting, setIsDetecting] = useState(true);
  
  useEffect(() => {
    // Simulate WiFi detection
    const timer = setTimeout(() => {
      setIsDetecting(false);
      onWifiDetected();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onWifiDetected]);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      {isDetecting ? (
        <>
          <div className="relative w-16 h-16 mb-4">
            <Wifi size={64} className="text-toronto-blue animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Detecting WiFi</h2>
          <p className="text-gray-500 text-center">
            Please wait while we connect you to Toronto Public WiFi...
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            <Wifi size={64} className="text-toronto-blue" />
          </div>
          <h2 className="text-xl font-semibold mb-2">WiFi Connected!</h2>
          <p className="text-gray-500 text-center">
            You're now connected to Toronto Public WiFi
          </p>
        </>
      )}
    </div>
  );
};

export default WifiDetector;
