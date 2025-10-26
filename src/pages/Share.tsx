import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCouponByShareToken, claimCoupon } from '@/services/pdfCouponService';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import BrandImage from '@/components/BrandImage';

const Share = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (shareToken) {
      loadCoupon();
    }
  }, [shareToken]);

  const loadCoupon = async () => {
    if (!shareToken) return;
    
    setLoading(true);
    const data = await getCouponByShareToken(shareToken);
    setLoading(false);

    if (!data || !data.coupons) {
      toast.error('Coupon not found or expired');
      navigate('/');
      return;
    }

    setCouponData(data);
  };

  const handleClaim = async () => {
    if (!shareToken || !couponData) return;

    setClaiming(true);
    const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);

    const result = await claimCoupon({
      couponId: couponData.coupons.id,
      deviceId,
      userEmail: email || undefined,
      userName: name || undefined,
      referralToken: shareToken,
    });

    setClaiming(false);

    if (result.success && result.claim) {
      toast.success('Coupon claimed successfully!');
      navigate('/wallet', { 
        state: { 
          newClaim: result.claim,
          coupon: couponData.coupons 
        }
      });
    } else {
      toast.error(result.message);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!couponData) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Coupon not found</p>
        </div>
      </AppLayout>
    );
  }

  const coupon = couponData.coupons;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-6 w-6 text-primary" />
              <CardTitle>You've Been Invited!</CardTitle>
            </div>
            <CardDescription>
              Someone shared this exclusive coupon with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 space-y-2">
              <h3 className="text-2xl font-bold">{coupon.title}</h3>
              <p className="text-lg font-semibold text-primary">{coupon.discount}</p>
              {coupon.description && (
                <p className="text-muted-foreground">{coupon.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full"
              size="lg"
            >
              {claiming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim Your Coupon'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By claiming this coupon, you'll get your own unique redemption code
            </p>
          </CardContent>
        </Card>

        <div className="mt-8">
          <BrandImage />
        </div>
      </div>
    </AppLayout>
  );
};

export default Share;
