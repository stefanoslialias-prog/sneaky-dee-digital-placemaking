import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  active: boolean;
  client_name?: string;
  parent_location_id?: string;
}

interface LocationPickerProps {
  onLocationSelected: (location: Location) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error loading locations:', error);
        toast.error('Failed to load locations');
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();

    // Set up real-time subscription
    const channel = supabase
      .channel('locations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => {
          loadLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLocationSelect = (location: Location) => {
    setSelectedId(location.id);
    onLocationSelected(location);
    toast.success(`Selected ${location.name}!`);
  };

  const getLocationIcon = (name: string) => {
    if (name.toLowerCase().includes('fish')) return (
      <img 
        src="/lovable-uploads/b408f457-0b1a-4c42-a6a8-75b543ae4ab8.png" 
        alt="Business logo"
        className="w-8 h-8 rounded object-contain"
      />
    );
    if (name.toLowerCase().includes('test')) return '🧪';
    return '📍';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
            <span className="ml-3 text-muted-foreground">Loading locations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6" />
          Choose Your Location
        </CardTitle>
        <CardDescription>
          Select which location you'd like to provide feedback for
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {locations.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No locations available at the moment</p>
            <Button 
              onClick={() => onLocationSelected({
                id: 'default',
                name: 'General Survey',
                slug: 'general',
                description: 'Share your general feedback',
                active: true
              })}
              className="mt-4"
            >
              Continue with General Survey
            </Button>
          </div>
        ) : (
          locations.map((location) => (
            <Card
              key={location.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedId === location.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleLocationSelect(location)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {location.logo_url ? (
                        <img 
                          src={location.logo_url} 
                          alt={`${location.name} logo`}
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        getLocationIcon(location.name)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{location.name}</h3>
                      {location.client_name && (
                        <p className="text-xs text-muted-foreground">{location.client_name}</p>
                      )}
                      {location.description && (
                        <p className="text-sm text-muted-foreground">{location.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default LocationPicker;