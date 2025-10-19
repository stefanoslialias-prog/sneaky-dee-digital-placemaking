
import React from 'react';

const BrandImage: React.FC = () => {
  return (
    <div className="text-center">
      <img 
        src="/lovable-uploads/sneaky-dees-logo.jpg" 
        alt="Sneaky Dee's"
        className="mx-auto h-24 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default BrandImage;
