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
import { Share2, Copy, Check, Mail, MessageSquare, Send } from 'lucide-react';
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

  const shareMessage = `Check out this great deal: ${couponTitle}! Claim your coupon here: ${shareLink}`;

  const handleSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
    window.open(smsUrl, '_blank');
  };

  const handleEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(couponTitle)}&body=${encodeURIComponent(shareMessage)}`;
    window.open(emailUrl, '_blank');
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${couponTitle} - Claim your coupon!`)}&url=${encodeURIComponent(shareLink)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
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

          <div className="space-y-3">
            <Label>Share via</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleSMS}
                variant="outline"
                className="flex items-center justify-center"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS
              </Button>
              <Button
                onClick={handleEmail}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={handleFacebook}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
            <Button
              onClick={handleTwitter}
              variant="outline"
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Twitter / X
            </Button>
            {navigator.share && (
              <Button
                onClick={handleShare}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                More Options
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Anyone who clicks this link can claim their own copy of the coupon
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
