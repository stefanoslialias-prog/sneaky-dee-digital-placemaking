
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@toronto.ca');
  const [password, setPassword] = useState('toronto2025');
  const { login, isLoading, error, user } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

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
          
          // Try to verify if the session belongs to an admin
          const { data: roleData } = await supabase.rpc('has_role', {
            user_id: sessionData.session.user.id,
            required_role: 'admin'
          }).maybeSingle();
          
          if (roleData === true) {
            toast.success('Welcome back! Redirecting to dashboard...');
            // Let the useEffect above handle navigation
          }
        }
        
        // Check if we can access the database without querying user_roles directly
        // This avoids the potential RLS recursion issue
        const { data, error } = await supabase
          .from('wifi_locations')
          .select('id')
          .limit(1);
        
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
        
        // If we've tried less than 3 times, retry after 2 seconds
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      }
    };
    
    checkSupabase();
  }, [retryCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Submitting login form for: ${email}`);
    
    try {
      await login(email, password);
      // Let the auth state listener and user effect handle the redirect
    } catch (err) {
      // Error is already handled in the login function and the error state
    }
  };

  const handleRetryConnection = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-toronto-gray p-4">
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {supabaseStatus === 'error' && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{statusMessage || 'Unable to connect to the database. Please try again later.'}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryConnection}
                      className="mt-2"
                    >
                      Retry Connection
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {supabaseStatus === 'connected' && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Ready</AlertTitle>
                <AlertDescription>
                  Connected to database successfully. You can sign in now.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
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
            
            <div className="text-center text-sm text-gray-500">
              <p>Need access? Contact your administrator.</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
