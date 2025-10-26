import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { WalletPassList } from '@/components/wallet/WalletPassList';
import BrandImage from '@/components/BrandImage';
import { ShareCouponDialog } from '@/components/coupon/ShareCouponDialog';
import { useLocation } from 'react-router-dom';
import { CouponClaim } from '@/services/pdfCouponService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Wallet = () => {
  const location = useLocation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentClaim, setCurrentClaim] = useState<CouponClaim | null>(null);
  const [currentCoupon, setCurrentCoupon] = useState<any>(null);

  useEffect(() => {
    if (location.state?.newClaim && location.state?.coupon) {
      setCurrentClaim(location.state.newClaim);
      setCurrentCoupon(location.state.coupon);
    }
  }, [location]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {currentClaim && currentCoupon && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your New Coupon</CardTitle>
              <CardDescription>
                {currentCoupon.title} - {currentCoupon.discount}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <QRCodeSVG value={currentClaim.redemption_code} size={200} />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Redemption Code</p>
                <p className="text-lg font-mono font-bold">{currentClaim.redemption_code}</p>
              </div>

              <Button
                onClick={() => setShareDialogOpen(true)}
                className="w-full"
                size="lg"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share with Friends
              </Button>
            </CardContent>
          </Card>
        )}

        <WalletPassList />
        
        <div className="mt-8">
          <BrandImage />
        </div>
      </div>

      {currentClaim && currentCoupon && (
        <ShareCouponDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareToken={currentClaim.share_token}
          couponTitle={currentCoupon.title}
        />
      )}
    </AppLayout>
  );
};

export default Wallet;
