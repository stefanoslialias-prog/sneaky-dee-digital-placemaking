
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      if (isSignupMode) {
        // Sign up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin/dashboard`
          }
        });
        
        if (error) throw error;
        
        toast.success('Account created! You can now sign in.');
        setIsSignupMode(false);
        setPassword('');
      } else {
        // Login flow
        const result = await login(email, password);
        
        if (result?.error) {
          const message = result.error.message || 'Login failed. Please check your credentials.';
          setErrorMsg(message);
          toast.error('Login failed: ' + message);
          setIsLoading(false);
          return;
        }
        
        toast.success('Login successful');
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err?.message || 'An unexpected error occurred');
      toast.error((isSignupMode ? 'Signup' : 'Login') + ' failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-toronto-gray p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-playfair">Community Pulse Dashboard</CardTitle>
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <CardDescription>
            {isSignupMode ? 'Create your admin account' : 'Secure admin access - Sign in to manage the real-time dashboard'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="Enter your admin email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (isSignupMode ? 'Creating account...' : 'Signing in...') : (isSignupMode ? 'Create Account' : 'Sign in')}
            </Button>
            
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignupMode(!isSignupMode);
                  setErrorMsg('');
                }}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                {isSignupMode ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p className="mt-1 text-xs text-orange-500">Secure admin access only</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
