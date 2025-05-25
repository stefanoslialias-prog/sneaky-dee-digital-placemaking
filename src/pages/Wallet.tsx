
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { WalletPassList } from '@/components/wallet/WalletPassList';
import BrandImage from '@/components/BrandImage';

const Wallet = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <WalletPassList />
        
        <div className="mt-8">
          <BrandImage />
        </div>
      </div>
    </AppLayout>
  );
};

export default Wallet;
