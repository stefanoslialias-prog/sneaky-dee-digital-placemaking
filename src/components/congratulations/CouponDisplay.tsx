
import React from 'react';
import { Coupon } from '../CouponPicker';

interface CouponDisplayProps {
  coupon: Coupon;
}

export const CouponDisplay: React.FC<CouponDisplayProps> = ({ coupon }) => {
  return (
    <div className="p-4 rounded-lg bg-toronto-gray shadow-inner border border-toronto-blue/20">
      <div className="flex flex-col items-center mb-3">
        <div className="w-20 h-20 rounded-full bg-toronto-blue/10 flex items-center justify-center mb-4">
          <img 
            src={coupon.image || '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png'}
            alt="Shop Local Win Local" 
            className="h-16 w-16 object-contain rounded-full"
            onError={(e) => {
              // Fallback to logo
              e.currentTarget.src = '/lovable-uploads/68284ad5-d0ad-4d79-9dcb-65d03682dbcd.png';
            }}
          />
        </div>
        
        <h3 className="font-bold text-xl text-toronto-blue">{coupon.title}</h3>
        <p className="text-gray-600 text-center mt-2">{coupon.description}</p>
      </div>
      
      <div className="mt-6">
        <div className="p-3 bg-white border-2 border-dashed border-toronto-blue rounded-md text-center">
          <p className="text-sm text-gray-500">Your code:</p>
          <p className="font-mono font-bold text-xl">{coupon.code}</p>
          <p className="text-sm text-gray-500 mt-2">Expires in {coupon.expiresIn}</p>
        </div>
      </div>
    </div>
  );
};
