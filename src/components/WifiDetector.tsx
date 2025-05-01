
import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface WifiDetectorProps {
  onWifiDetected: () => void;
}

const WifiDetector: React.FC<WifiDetectorProps> = ({ onWifiDetected }) => {
  const [isDetecting, setIsDetecting] = useState(true);
  const [signalStrength, setSignalStrength] = useState(1);
  
  useEffect(() => {
    // Simulate WiFi detection with animated signal strength
    let signalInterval: NodeJS.Timeout;
    
    if (isDetecting) {
      signalInterval = setInterval(() => {
        setSignalStrength((prev) => (prev >= 3 ? 1 : prev + 1));
      }, 500);
      
      // After 2 seconds, complete the detection
      const timer = setTimeout(() => {
        clearInterval(signalInterval);
        setIsDetecting(false);
        onWifiDetected();
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(signalInterval);
      };
    }
  }, [isDetecting, onWifiDetected]);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      {isDetecting ? (
        <>
          <div className="relative w-16 h-16 mb-4">
            <div className="flex flex-col items-center">
              <Wifi size={64} className="text-toronto-blue" />
              <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                <div className={`h-2 w-2 mx-0.5 bg-toronto-lightblue rounded-full ${signalStrength >= 1 ? 'opacity-100' : 'opacity-30'}`}></div>
                <div className={`h-3 w-2 mx-0.5 bg-toronto-lightblue rounded-full ${signalStrength >= 2 ? 'opacity-100' : 'opacity-30'}`}></div>
                <div className={`h-4 w-2 mx-0.5 bg-toronto-lightblue rounded-full ${signalStrength >= 3 ? 'opacity-100' : 'opacity-30'}`}></div>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Detecting WiFi</h2>
          <p className="text-gray-500 text-center">
            Please wait while we connect you to Toronto Public WiFi...
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            <div className="relative">
              <Wifi size={64} className="text-toronto-blue" />
              <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                <div className="h-2 w-2 mx-0.5 bg-toronto-teal rounded-full"></div>
                <div className="h-3 w-2 mx-0.5 bg-toronto-teal rounded-full"></div>
                <div className="h-4 w-2 mx-0.5 bg-toronto-teal rounded-full"></div>
              </div>
            </div>
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
