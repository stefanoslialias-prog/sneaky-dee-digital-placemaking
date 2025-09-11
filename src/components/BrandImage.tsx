
import React from 'react';

const BrandImage: React.FC = () => {
  return (
    <div className="text-center">
      <img 
        src="/lovable-uploads/247ad490-66e6-4199-bdce-1231796f6416.png" 
        alt="Kingsway Fish & Chips" 
        className="mx-auto h-24 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default BrandImage;
