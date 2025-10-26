import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ScanLine, CheckCircle } from 'lucide-react';
import { redeemCouponQR } from '@/services/pdfCouponService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Redeem = () => {
  const { user } = useAuth();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [claimInfo, setClaimInfo] = useState<any>(null);

  const handleRedeem = async () => {
    if (!redemptionCode.trim()) {
      toast.error('Please enter a redemption code');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to redeem coupons');
      return;
    }

    setRedeeming(true);
    const result = await redeemCouponQR(redemptionCode.trim(), user.id);
    setRedeeming(false);

    if (result.success) {
      toast.success(result.message);
      setRedeemed(true);
      setClaimInfo(result.claim);
      setRedemptionCode('');
    } else {
      toast.error(result.message);
    }
  };

  const handleReset = () => {
    setRedeemed(false);
    setClaimInfo(null);
    setRedemptionCode('');
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Partner Staff Only</CardTitle>
              <CardDescription>
                Please log in to redeem coupons
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ScanLine className="h-6 w-6 text-primary" />
              <CardTitle>Redeem Coupon</CardTitle>
            </div>
            <CardDescription>
              Scan QR code or enter redemption code manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {redeemed && claimInfo ? (
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-6 text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-xl font-bold">Coupon Redeemed!</h3>
                  {claimInfo.user_name && (
                    <p className="text-muted-foreground">
                      Customer: {claimInfo.user_name}
                    </p>
                  )}
                  {claimInfo.user_email && (
                    <p className="text-sm text-muted-foreground">
                      {claimInfo.user_email}
                    </p>
                  )}
                </div>
                <Button onClick={handleReset} className="w-full">
                  Redeem Another Coupon
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="redemption-code">Redemption Code</Label>
                  <Input
                    id="redemption-code"
                    type="text"
                    placeholder="Enter code from QR scan"
                    value={redemptionCode}
                    onChange={(e) => setRedemptionCode(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Button
                  onClick={handleRedeem}
                  disabled={!redemptionCode.trim() || redeeming}
                  className="w-full"
                  size="lg"
                >
                  {redeeming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    'Redeem Coupon'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  This will mark the coupon as used and cannot be undone
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Redeem;
