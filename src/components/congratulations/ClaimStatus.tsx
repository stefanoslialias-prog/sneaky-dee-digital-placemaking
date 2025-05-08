
import React from 'react';
import { Coupon } from '../CouponPicker';

interface ClaimStatusProps {
  isClaiming: boolean;
  claimed: boolean;
  coupon: Coupon;
}

export const ClaimStatus: React.FC<ClaimStatusProps> = ({ isClaiming, claimed, coupon }) => {
  // Extract percentage from the title if it exists
  const getDiscountPercentage = () => {
    if (coupon.discount) {
      return coupon.discount;
    }
    if (coupon.title.includes('%')) {
      const match = coupon.title.match(/(\d+)%/);
      return match ? match[0] : '';
    }
    return '';
  };

  return (
    <div className="p-3 bg-green-50 text-green-700 rounded-md text-center">
      <p className="font-medium">
        {isClaiming ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing your coupon...
          </span>
        ) : claimed ? (
          <>🎉 Your {getDiscountPercentage()} coupon has been sent to your e-wallet!</>
        ) : (
          <>Your {getDiscountPercentage()} coupon is ready to use</>
        )}
      </p>
    </div>
  );
};
