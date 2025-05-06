
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchCoupons } from '@/services/couponService';

export interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  expiresIn: string;
  image?: string;
  discount?: string;
  claimedAt?: Date;
  redeemedAt?: Date;
}

interface CouponPickerProps {
  onCouponSelected: (coupon: Coupon) => void;
}

const CouponPicker: React.FC<CouponPickerProps> = ({ onCouponSelected }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const availableCoupons = await fetchCoupons();
        setCoupons(availableCoupons);
      } catch (error) {
        console.error('Error loading coupons:', error);
        toast.error('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };
    
    loadCoupons();
  }, []);
  
  const handleCouponSelect = (coupon: Coupon) => {
    setSelectedId(coupon.id);
    setTimeout(() => {
      onCouponSelected(coupon);
    }, 300); // Small delay for visual feedback
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Choose Your Offer</CardTitle>
          <CardDescription>
            Unlock your deal instantly when you share your feedback.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-toronto-blue"></div>
            </div>
          ) : coupons.length > 0 ? (
            coupons.map((coupon) => (
              <div 
                key={coupon.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedId === coupon.id ? 'border-toronto-blue bg-toronto-blue/5' : 'hover:border-gray-400'
                }`}
                onClick={() => handleCouponSelect(coupon)}
              >
                <div className="flex items-center gap-3">
                  {coupon.image && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-toronto-gray">
                      <img 
                        src={coupon.image} 
                        alt={coupon.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{coupon.title}</h3>
                    <p className="text-sm text-gray-600">{coupon.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Expires in {coupon.expiresIn}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4">
              <p>No offers available at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponPicker;
