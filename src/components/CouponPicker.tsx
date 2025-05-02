
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  image: string;
  discount?: string;
  expiresIn: string;
}

// Our master list of coupons
const allCoupons: Coupon[] = [
  {
    id: 'cafe15',
    title: '15% Off at Toronto Café',
    description: 'Enjoy a discount on your next coffee or pastry purchase',
    code: 'TORONTOCAFE15',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    discount: '15%',
    expiresIn: '24 hours',
  },
  {
    id: 'museum',
    title: 'Free Museum Admission',
    description: 'Visit the Toronto Heritage Museum at no cost',
    code: 'TOMUSEUM',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    expiresIn: '48 hours',
  },
  {
    id: 'bike20',
    title: '20% Off Bike Share',
    description: 'Explore the city with a discount on bike sharing',
    code: 'BIKETORONTO',
    discount: '20%',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    expiresIn: '24 hours',
  },
  {
    id: 'coffee',
    title: 'Free Coffee',
    description: 'Enjoy a complimentary coffee at any participating café',
    code: 'FREECOFFEE',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    expiresIn: '72 hours',
  },
  {
    id: 'bogo',
    title: 'Buy 1 Get 1 Free',
    description: 'Purchase one item and get another one free at local shops',
    code: 'BOGO2023',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    expiresIn: '48 hours',
  },
  {
    id: 'gift5',
    title: '$5 Gift Card',
    description: 'Redeem at any participating local business',
    code: 'GIFT5CARD',
    discount: '$5',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    expiresIn: '7 days',
  },
  {
    id: 'parking',
    title: '2 Hours Free Parking',
    description: 'Park for free in any city lot for up to 2 hours',
    code: 'PARKTO2HR',
    image: '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png',
    expiresIn: '24 hours',
  },
];

interface CouponPickerProps {
  onCouponSelected: (coupon: Coupon) => void;
}

const CouponPicker: React.FC<CouponPickerProps> = ({ onCouponSelected }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Randomly pick 3 distinct coupons
  useEffect(() => {
    const shuffled = [...allCoupons].sort(() => 0.5 - Math.random());
    setCoupons(shuffled.slice(0, 3));
  }, []);

  const handleSelect = (coupon: Coupon) => {
    setSelectedId(coupon.id);
    toast.success("Great choice! Let's continue to the survey");
    
    // Small delay before proceeding to survey for better UX
    setTimeout(() => {
      onCouponSelected(coupon);
    }, 800);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  if (coupons.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-toronto-blue rounded-full"></div>
          <div className="h-3 w-3 bg-toronto-blue rounded-full"></div>
          <div className="h-3 w-3 bg-toronto-blue rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-playfair mb-2">Pick Your Prize!</h2>
        <p className="text-gray-600">
          Just one quick question—your feedback unlocks your deal!
        </p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {coupons.map((coupon) => (
          <motion.div
            key={coupon.id}
            variants={itemVariants}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className={`relative ${selectedId !== null && selectedId !== coupon.id ? 'opacity-50' : ''}`}
          >
            <Card 
              className={`h-full cursor-pointer border-2 hover:shadow-lg transition-shadow ${
                selectedId === coupon.id ? 'border-toronto-blue bg-toronto-gray' : 'border-transparent'
              }`}
              onClick={() => handleSelect(coupon)}
            >
              {selectedId === coupon.id && (
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <Sparkles 
                      className="absolute text-yellow-400" 
                      size={24} 
                      style={{ top: '10px', right: '10px' }}
                    />
                    <Sparkles 
                      className="absolute text-yellow-400" 
                      size={16} 
                      style={{ top: '30px', left: '10px' }}
                    />
                  </div>
                </motion.div>
              )}
              
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-center mb-3 flex-1">
                  <div className="w-24 h-24 rounded-full bg-toronto-gray flex items-center justify-center">
                    <Gift size={40} className="text-toronto-blue" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-center mb-2">{coupon.title}</h3>
                <p className="text-gray-600 text-center text-sm">{coupon.description}</p>
                <div className="mt-4 text-center">
                  <span className="inline-block px-3 py-1 bg-toronto-blue text-white rounded-full text-sm">
                    Tap to Select
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CouponPicker;
