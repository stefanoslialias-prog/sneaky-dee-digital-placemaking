
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-toronto-gray p-4">
      <Logo className="mb-8" />
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-playfair">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the Community Pulse dashboard
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
            
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>For demo purposes:</p>
        <p className="font-mono">Email: admin@toronto.ca</p>
        <p className="font-mono">Password: toronto2025</p>
      </div>
    </div>
  );
};

export default AdminLogin;
