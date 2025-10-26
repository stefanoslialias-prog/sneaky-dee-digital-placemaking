import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateShareLink } from '@/services/pdfCouponService';
import { toast } from 'sonner';

interface ShareCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  couponTitle: string;
}

export const ShareCouponDialog: React.FC<ShareCouponDialogProps> = ({
  open,
  onOpenChange,
  shareToken,
  couponTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const shareLink = generateShareLink(shareToken);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: couponTitle,
          text: `Check out this coupon: ${couponTitle}`,
          url: shareLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share This Coupon</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={shareLink} size={200} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share on Social Media
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Anyone who clicks this link can claim their own copy of the coupon
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
