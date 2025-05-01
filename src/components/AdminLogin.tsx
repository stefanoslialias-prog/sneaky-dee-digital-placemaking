
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoCircledIcon } from '@radix-ui/react-icons';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@toronto.ca');
  const [password, setPassword] = useState('toronto2025');
  const { login, isLoading, error } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState('');

  // Check if we have a Supabase instance and display diagnostic info
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        console.log('Checking Supabase connection...');
        setSupabaseStatus('checking');
        
        // First check if we're already authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('User already has an active session');
          setStatusMessage('You have an active session');
        }
        
        // Simple check to see if Supabase is accessible
        const { data, error } = await supabase.from('user_roles').select('count').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus('error');
          setStatusMessage(`Database error: ${error.message}`);
          toast.error(`Database connection error: ${error.message}`);
          return;
        }
        
        console.log('Supabase connection successful');
        setSupabaseStatus('connected');
        setStatusMessage('Connected to database');
      } catch (err: any) {
        console.error('Supabase connection exception:', err);
        setSupabaseStatus('error');
        setStatusMessage(`Connection error: ${err.message}`);
        toast.error(`Database connection error: ${err.message}`);
      }
    };
    
    checkSupabase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Submitting login form for: ${email}`);
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-toronto-gray p-4">
      <Logo className="mb-8" />
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-playfair">Community Pulse Dashboard</CardTitle>
          <CardDescription>
            Sign in to access the real-time admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="admin@toronto.ca" 
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
            
            {error && (
              <div className="p-3 rounded bg-red-50 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            {supabaseStatus === 'error' && (
              <Alert variant="destructive">
                <InfoCircledIcon className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>
                  {statusMessage || 'Unable to connect to the database. Please try again later.'}
                </AlertDescription>
              </Alert>
            )}
            
            {supabaseStatus === 'connected' && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <InfoCircledIcon className="h-4 w-4" />
                <AlertTitle>Ready</AlertTitle>
                <AlertDescription>
                  Connected to database successfully. You can sign in now.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || supabaseStatus === 'error' || supabaseStatus === 'checking'}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : supabaseStatus === 'checking' ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Checking connection...
                </>
              ) : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Demo credentials pre-filled above:</p>
        <p className="font-mono">Email: admin@toronto.ca</p>
        <p className="font-mono">Password: toronto2025</p>
      </div>
    </div>
  );
};

export default AdminLogin;
