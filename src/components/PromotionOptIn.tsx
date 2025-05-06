
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Apple, LucideArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ClaimCouponResult } from '@/services/couponService';

interface PromotionOptInProps {
  onSkip: () => void;
  onRegister: (email: string, name: string) => void;
  onSocialSignIn: (provider: 'google' | 'apple') => void;
  couponId?: string; // Pass the selected coupon ID
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email' })
});

const PromotionOptIn: React.FC<PromotionOptInProps> = ({ onSkip, onRegister, onSocialSignIn, couponId }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: ''
    }
  });

  const handleRegister = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // If we have a coupon ID, let's claim it
      if (couponId) {
        // Simple check to simulate device
        const deviceId = `browser-${Math.random().toString(36).substring(7)}`;
        
        const { data, error } = await supabase.rpc(
          'claim_coupon', 
          {
            p_coupon_id: couponId,
            p_email: values.email,
            p_name: values.name,
            p_device_id: deviceId
          }
        );
        
        if (error) {
          console.error('Error claiming coupon:', error);
          // Continue with registration even if coupon claim fails
        } else {
          // Type-cast the result and check for success
          const result = data as unknown as ClaimCouponResult;
          if (result && result.success) {
            console.log('Coupon claimed successfully:', result);
          }
        }
      }
      
      // Register for newsletter (could connect to a real email service)
      onRegister(values.email, values.name);
      toast.success('Registration successful!');
    } catch (err) {
      console.error('Error during registration:', err);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    
    try {
      // In a real app, we would implement social sign-in with Supabase Auth
      // For now, we'll just simulate it
      setTimeout(() => {
        onSocialSignIn(provider);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error(`Error during ${provider} sign-in:`, error);
      toast.error('Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair mb-2">Unlock Future Perks</CardTitle>
          <CardDescription>
            Register now or sign in to save your spot for even more exclusive deals.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                disabled={isLoading}
              >
                Register
                <LucideArrowRight size={16} />
              </Button>
            </form>
          </Form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          {/* Social Sign In Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => handleSocialSignIn('google')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Sign in with Google
            </Button>
            
            <Button 
              onClick={() => handleSocialSignIn('apple')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              <Apple size={18} />
              Sign in with Apple ID
            </Button>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={onSkip} 
            variant="link" 
            className="w-full text-gray-500 hover:text-gray-700 transition-all"
            disabled={isLoading}
          >
            Maybe later
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PromotionOptIn;
