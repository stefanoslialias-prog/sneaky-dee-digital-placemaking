
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Mock deals we might offer
const deals = [
  {
    id: 1,
    title: '15% Off at Toronto Café',
    description: 'Enjoy a discount on your next coffee or pastry purchase',
    code: 'TORONTOCAFE15',
    expiresIn: '24 hours',
  },
  {
    id: 2,
    title: 'Free Museum Admission',
    description: 'Visit the Toronto Heritage Museum at no cost',
    code: 'TOMUSEUM',
    expiresIn: '48 hours',
  },
  {
    id: 3,
    title: '20% Off Bike Share',
    description: 'Explore the city with a discount on bike sharing',
    code: 'BIKETORONTO',
    expiresIn: '24 hours',
  }
];

const DealDisplay: React.FC = () => {
  // Randomly select one deal to show
  const [deal] = useState(deals[Math.floor(Math.random() * deals.length)]);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    setClaimed(true);
    toast.success('Deal claimed! Check your screen for the code.');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-playfair text-2xl">Thanks for your feedback!</CardTitle>
          <img 
            src="/digital-placemaking-logo.png" 
            alt="Digital Placemaking" 
            className="h-8" 
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <CardDescription>Enjoy this special offer just for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* "Shop Local Win Local" banner instead of grey box */}
        <div className="p-4 rounded-lg bg-white shadow-md border border-toronto-blue/20">
          <div className="flex flex-col items-center mb-3">
            <img 
              src="/shop-local-win-local.png" 
              alt="Shop Local Win Local" 
              className="max-h-32 object-contain mb-2"
              onError={(e) => {
                // Fallback to text if image doesn't exist
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="font-semibold text-lg text-toronto-blue">{deal.title}</h3>
          </div>
          <p className="text-gray-600 text-center">{deal.description}</p>
          
          {claimed && (
            <div className="mt-4">
              <div className="p-3 bg-white border-2 border-dashed border-toronto-blue rounded-md text-center">
                <p className="text-sm text-gray-500">Your code:</p>
                <p className="font-mono font-bold text-xl">{deal.code}</p>
                <p className="text-sm text-gray-500 mt-2">Expires in {deal.expiresIn}</p>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-center">
                <p className="font-medium">
                  🎉 Your {deal.title.includes('%') ? deal.title.match(/\d+%/)[0] : ''} coupon has been sent to your e-wallet!
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {!claimed ? (
          <Button onClick={handleClaim} className="w-full">
            Claim This Deal
          </Button>
        ) : (
          <div className="w-full text-center">
            <p className="text-sm text-gray-500">
              Show this code to the participating merchant
            </p>
            <div className="mt-2">
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                Done
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default DealDisplay;
