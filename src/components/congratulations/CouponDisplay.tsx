
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
      
      <div className="mt-6 space-y-4">
        {/* Prominent Coupon Code */}
        <div className="p-6 bg-white border-4 border-dashed border-toronto-blue rounded-lg text-center shadow-lg">
          <p className="text-sm font-semibold text-gray-600 mb-2">YOUR COUPON CODE</p>
          <div className="bg-white p-4 rounded-md border-2 border-toronto-blue shadow-inner">
            <p className="font-mono font-bold text-4xl text-toronto-blue mb-2 tracking-widest">
              {coupon.code || 'CODE NOT AVAILABLE'}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">Present this code at checkout</p>
        </div>

        {/* Expiry Date - Prominent */}
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-center">
          <p className="text-sm font-semibold text-red-600 mb-1">EXPIRES ON</p>
          <p className="font-bold text-lg text-red-700">
            {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric', 
              month: 'long',
              day: 'numeric'
            }) : coupon.expiresIn}
          </p>
        </div>

        {/* Usage Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-800 mb-1">IMPORTANT:</p>
          <p className="text-xs text-blue-700">
            Save this code! Take a screenshot or write it down. Use before expiry date. One-time use only.
          </p>
        </div>
      </div>
    </div>
  );
};
