import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Gift, Mail } from "lucide-react";
import { toast } from "sonner";

interface ThankYouProps {
  onDone: () => void;
  userInfo?: {
    email?: string;
    name?: string;
    provider?: string;
  } | null;
}

const ThankYou: React.FC<ThankYouProps> = ({ onDone, userInfo }) => {
  // Display toast notification when component mounts
  useEffect(() => {
    toast.success("Your coupon has been deposited into your e-wallet!", {
      duration: 5000,
      position: "top-center",
    });
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        {/* Header */}
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <CardTitle className="text-2xl font-playfair mb-2">
            Thank You, {userInfo?.name ? userInfo.name : "Friend"}!
          </CardTitle>
        </CardHeader>

        {/* Content */}
        <CardContent className="text-center">
          {/* Confirmation Message */}
          {userInfo?.name ? (
            <p className="text-gray-600 mb-4">
              Thanks, {userInfo.name}! You're now signed up for exclusive offers and updates.
            </p>
          ) : userInfo?.provider ? (
            <p className="text-gray-600 mb-4">
              Thanks for signing in with {userInfo.provider.charAt(0).toUpperCase() + userInfo.provider.slice(1)}!
              Get ready to unlock exclusive offers and updates wherever you are.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              You're now signed up for exclusive offers and updates.
            </p>
          )}

          {/* Email Confirmation */}
          {userInfo?.email && (
            <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3 text-left mb-4">
              <Mail className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium">Email Confirmation Sent</p>
                <p className="text-sm text-gray-600">
                  We've sent a confirmation to {userInfo.email}.
                </p>
              </div>
            </div>
          )}

          {/* Offers Coming Soon - Updated Messaging */}
          <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3 text-left mb-4">
            <Gift className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Look out for exclusive offers!</p>
              <p className="text-sm text-gray-600">
                Keep an eye out for exclusive offers wherever you are delivered straight to your inbox.
              </p>
            </div>
          </div>

          {/* Privacy Message */}
          <div className="p-4 bg-toronto-gray/50 rounded-md">
            <p className="text-sm text-gray-500">
              We value your privacy. Unsubscribe anytime.
            </p>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-center">
          <Button
            onClick={onDone}
            size="lg"
            variant="default"
            className="bg-toronto-blue hover:bg-toronto-lightblue transition-all"
          >
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ThankYou;