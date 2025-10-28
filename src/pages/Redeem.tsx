import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ScanLine, CheckCircle, Camera, X } from 'lucide-react';
import { redeemCouponQR } from '@/services/pdfCouponService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Html5Qrcode } from 'html5-qrcode';

const Redeem = () => {
  const { user } = useAuth();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [claimInfo, setClaimInfo] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

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
    setManualEntry(false);
  };

  const startScanner = async () => {
    setScanning(true);
    setManualEntry(false);
    
    try {
      const html5QrCode = new Html5Qrcode(scannerDivId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Successfully scanned
          console.log('QR Code detected:', decodedText);
          setRedemptionCode(decodedText);
          await stopScanner();
          
          // Auto-redeem the scanned code
          if (user) {
            setRedeeming(true);
            const result = await redeemCouponQR(decodedText.trim(), user.id);
            setRedeeming(false);

            if (result.success) {
              toast.success(result.message);
              setRedeemed(true);
              setClaimInfo(result.claim);
            } else {
              toast.error(result.message);
              setRedemptionCode('');
            }
          }
        },
        (errorMessage) => {
          // Scanning error (usually just "no QR code found" - don't show to user)
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Please check permissions or use manual entry.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const switchToManual = async () => {
    await stopScanner();
    setManualEntry(true);
  };

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

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
            ) : scanning ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <div id={scannerDivId} className="w-full" />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={stopScanner} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Scan
                  </Button>
                  <Button 
                    onClick={switchToManual} 
                    variant="secondary"
                    className="flex-1"
                  >
                    Manual Entry
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Point camera at QR code to scan automatically
                </p>
              </div>
            ) : manualEntry ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="redemption-code">Redemption Code</Label>
                  <Input
                    id="redemption-code"
                    type="text"
                    placeholder="Enter code manually"
                    value={redemptionCode}
                    onChange={(e) => setRedemptionCode(e.target.value)}
                    className="font-mono"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRedeem}
                    disabled={!redemptionCode.trim() || redeeming}
                    className="flex-1"
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
                  <Button
                    onClick={() => {
                      setManualEntry(false);
                      setRedemptionCode('');
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  This will mark the coupon as used and cannot be undone
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={startScanner} 
                  className="w-full" 
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera Scanner
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => setManualEntry(true)} 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  <ScanLine className="h-5 w-5 mr-2" />
                  Enter Code Manually
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Camera scanner works best for quick redemption
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Redeem;
