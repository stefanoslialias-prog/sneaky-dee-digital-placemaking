
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

  return null;
};
