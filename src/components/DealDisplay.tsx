
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
        <CardTitle className="font-playfair text-2xl">Thanks for your feedback!</CardTitle>
        <CardDescription>Enjoy this special offer just for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-toronto-gray p-4 rounded-lg">
          <h3 className="font-semibold text-lg text-toronto-blue">{deal.title}</h3>
          <p className="text-gray-600">{deal.description}</p>
          
          {claimed && (
            <div className="mt-4 p-3 bg-white border-2 border-dashed border-toronto-blue rounded-md text-center">
              <p className="text-sm text-gray-500">Your code:</p>
              <p className="font-mono font-bold text-xl">{deal.code}</p>
              <p className="text-sm text-gray-500 mt-2">Expires in {deal.expiresIn}</p>
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
