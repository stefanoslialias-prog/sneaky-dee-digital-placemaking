
import React from 'react';

const BrandImage: React.FC = () => {
  return (
    <div className="text-center">
      <img 
        src="/lovable-uploads/a5c50d31-a577-40dd-b769-0f586cc4f47e.png" 
        alt="Shop Local Win Local" 
        className="mx-auto h-24 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default BrandImage;
