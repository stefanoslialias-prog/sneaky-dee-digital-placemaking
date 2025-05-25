
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserWalletPasses } from '@/services/walletService';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, Smartphone } from 'lucide-react';

interface WalletPass {
  id: string;
  platform: 'apple' | 'google';
  claimed_at: string;
  coupons: {
    id: string;
    title: string;
    description: string;
    code: string;
    discount: string;
    expires_at: string;
    image_url?: string;
  };
}

export const WalletPassList: React.FC = () => {
  const [passes, setPasses] = useState<WalletPass[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadWalletPasses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const walletPasses = await getUserWalletPasses(user.id);
        setPasses(walletPasses);
      } catch (error) {
        console.error('Error loading wallet passes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWalletPasses();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-toronto-blue"></div>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center p-6">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No wallet passes yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Complete surveys to earn coupons and add them to your wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-center mb-4">My Wallet Passes</h2>
      
      {passes.map((pass) => (
        <Card key={pass.id} className="w-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{pass.coupons.title}</CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                {pass.platform === 'apple' ? (
                  <Wallet className="h-3 w-3" />
                ) : (
                  <Smartphone className="h-3 w-3" />
                )}
                {pass.platform === 'apple' ? 'Apple Wallet' : 'Google Pay'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-600 text-sm mb-3">{pass.coupons.description}</p>
            
            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Code:</span>
                <span className="font-mono font-bold">{pass.coupons.code}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Discount:</span>
                <span className="font-semibold text-toronto-blue">{pass.coupons.discount}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Added: {new Date(pass.claimed_at).toLocaleDateString()}</span>
              <span>Expires: {new Date(pass.coupons.expires_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
