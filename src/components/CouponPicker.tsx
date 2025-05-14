import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchCoupons } from "@/services/couponService";

export interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  expiresIn: string;
  image?: string;
  discount?: string;
  remaining?: number;
  claimedCount?: number;
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
        console.error("Error loading coupons:", error);
        toast.error("Failed to load offers");
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
      toast.success(`Coupon for ${coupon.title} added to your wallet!`);
    }, 300);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2 font-playfair">
            Pick Your Free Reward!
          </CardTitle>
          <CardDescription className="text-gray-600 mb-4">
            Get your deal instantly — just answer 1 quick question
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
                  selectedId === coupon.id
                    ? "border-toronto-blue bg-toronto-blue/5"
                    : "hover:border-toronto-lightblue hover:bg-toronto-lightblue/10"
                }`}
                onClick={() => handleCouponSelect(coupon)}
              >
                {/* Icons for reward type */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {coupon.discount?.includes("Coffee")
                      ? "☕"
                      : coupon.discount?.includes("Dining")
                      ? "🍽️"
                      : "📚"}
                  </span>

                  <h3 className="font-bold text-lg flex-grow">{coupon.title}</h3>

                  {/* Scarcity Messaging */}
                  {coupon.remaining !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {coupon.remaining} left
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Expires in {coupon.expiresIn}</p>

                  {/* Claim Now Button */}
                  <Button size="sm" variant="default" className="text-xs">
                    Claim Now
                  </Button>
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
