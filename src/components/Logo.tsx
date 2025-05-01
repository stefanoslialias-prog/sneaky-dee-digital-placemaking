
import React from 'react';

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-8 w-8 bg-toronto-blue rounded-full flex items-center justify-center">
          <div className="h-4 w-4 bg-toronto-teal rounded-full animate-pulse-slow"></div>
        </div>
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-toronto-red rounded-full"></div>
      </div>
      <span className="font-playfair font-bold text-lg text-toronto-blue">
        Community<span className="text-toronto-red">Pulse</span>
      </span>
    </div>
  );
};

export default Logo;
