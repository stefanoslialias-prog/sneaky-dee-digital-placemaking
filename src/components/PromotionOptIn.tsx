
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
import { useSessionTracking } from '@/hooks/useSessionTracking';

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
  const { sessionId } = useSessionTracking();
  
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
      // Get the device ID from localStorage
      const deviceId = localStorage.getItem('deviceId') || 
        `device-${Math.random().toString(36).substring(2, 15)}`;
      
      // Update the pending user_emails record with the actual email address
      const { data: emailsData, error: emailsFetchError } = await supabase
        .from('user_emails')
        .select('id')
        .eq('device_id', deviceId)
        .eq('email_address', 'pending-collection@example.com')
        .eq('status', 'pending')
        .order('sent_at', { ascending: false })
        .limit(1);
      
      if (!emailsFetchError && emailsData && emailsData.length > 0) {
        // Found a pending email entry, update it
        const emailId = emailsData[0].id;
        
        // Generate personalized email content
        const emailContent = await generateEmailContent(values.name, couponId);
        
        // Update the email record
        const { error: updateError } = await supabase
          .from('user_emails')
          .update({ 
            email_address: values.email,
            email_content: emailContent,
            subject: `${values.name}, here are your exclusive deals!`
          })
          .eq('id', emailId);
        
        if (updateError) {
          console.error('Error updating email record:', updateError);
        } else {
          // Email will be sent by a background process
          toast.success('We\'ll send your deals to your email shortly!');
        }
      } else {
        // No pending email found, create a new one
        const emailContent = await generateEmailContent(values.name, couponId);
        
        const { error: insertError } = await supabase
          .from('user_emails')
          .insert({
            device_id: deviceId,
            email_address: values.email,
            subject: `${values.name}, here are your exclusive deals!`,
            email_content: emailContent,
            status: 'pending'
          });
          
        if (insertError) {
          console.error('Error creating email record:', insertError);
        } else {
          toast.success('We\'ll send your deals to your email shortly!');
        }
      }
      
      // If we have a coupon ID, let's claim it
      if (couponId) {
        // Simple check to simulate device
        const deviceId = `browser-${Math.random().toString(36).substring(7)}`;
        
        const { data, error } = await supabase.rpc(
          'claim_coupon', 
          {
            p_coupon_id: couponId,
            p_device_id: deviceId,
            p_session_id: sessionId
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
      if (provider === 'google') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          toast.error('Failed to sign in with Google');
          console.error('Google sign-in error:', error);
        }
      } else {
        // Apple sign-in simulation for now
        setTimeout(() => {
          onSocialSignIn(provider);
          setIsLoading(false);
        }, 800);
      }
    } catch (error) {
      console.error(`Error during ${provider} sign-in:`, error);
      toast.error('Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Function to generate personalized email content
  const generateEmailContent = async (name: string, couponId?: string): Promise<string> => {
    let couponInfo = '';
    
    // If we have a coupon ID, get its details
    if (couponId) {
      // Use public view to get coupon details safely
      const { data, error } = await supabase
        .from('coupons_public')
        .select('title, description, discount, expires_at')
        .eq('id', couponId)
        .single();
        
      if (!error && data) {
        const expiryDate = new Date(data.expires_at).toLocaleDateString();
        couponInfo = `
          <h3>Your Selected Deal:</h3>
          <p><strong>${data.title}</strong> - ${data.description}</p>
          <p>Discount: ${data.discount}</p>
          <p>Valid until: ${expiryDate}</p>
          <br>
        `;
      }
    }
    
    // Get 3 other active coupons to show using public view
    const { data: otherCoupons, error: couponsError } = await supabase
      .from('coupons_public')
      .select('title, discount')
      .limit(3) as any;
      
    let otherDealsHtml = '';
    
    if (!couponsError && otherCoupons && otherCoupons.length > 0) {
      otherDealsHtml = '<h3>Other Deals You Might Like:</h3><ul>';
      
      otherCoupons.forEach(coupon => {
        otherDealsHtml += `<li><strong>${coupon.title}</strong> - ${coupon.discount}</li>`;
      });
      
      otherDealsHtml += '</ul>';
    }
    
    // Build the complete email HTML
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1E3A8A; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f4f4f4; padding: 15px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Exclusive Deals, ${name}!</h1>
            </div>
            <div class="content">
              <p>Thank you for signing up to receive our exclusive deals and offers!</p>
              
              ${couponInfo}
              
              ${otherDealsHtml}
              
              <p>Visit our location to redeem these amazing offers.</p>
              
              <p>We'll keep you updated with more personalized offers in the future.</p>
            </div>
            <div class="footer">
              <p>This email was sent to you because you opted in to receive promotional offers.</p>
              <p>© ${new Date().getFullYear()} Shop Local Win Local. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair mb-2">Unlock Future Perks</CardTitle>
          <CardDescription>
            Register now or sign-in to save your spot for even more exclusive deals wherever you are.
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
