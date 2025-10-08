
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowUpRightFromCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/lovable-uploads/afdaf7ef-d926-4544-bb2d-7bbd3e0fc07a.png"
              alt="KinesisIQ"
              className="h-8"
            />
          </Link>
          <img 
            src="/lovable-uploads/digital-placemaking-new-logo.png" 
            alt="Digital Placemaking" 
            className="h-8" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <Link to="/admin">
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
            Admin
            <ArrowUpRightFromCircle size={12} />
          </Button>
        </Link>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-toronto-gray">
        {children}
      </main>
      
      <footer className="py-3 px-6 text-center text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} KinesisIQ Community Pulse Project</p>
      </footer>
    </div>
  );
};

export default AppLayout;
