import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  active: boolean;
}

interface PartnerPickerProps {
  onPartnerSelected: (partner: Partner) => void;
}

const PartnerPicker: React.FC<PartnerPickerProps> = ({ onPartnerSelected }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error loading partners:', error);
        toast.error('Failed to load partners');
        return;
      }

      setPartners(data || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();

    // Set up real-time subscription
    const channel = supabase
      .channel('partners_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'partners' },
        () => {
          loadPartners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePartnerSelect = (partner: Partner) => {
    setSelectedId(partner.id);
    onPartnerSelected(partner);
    toast.success(`Selected ${partner.name}!`);
  };

  const getPartnerIcon = (name: string) => {
    if (name.toLowerCase().includes('fish')) return '🐟';
    if (name.toLowerCase().includes('test')) return '🧪';
    return '🏪';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
            <span className="ml-3 text-muted-foreground">Loading partners...</span>
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
          Choose Your Business
        </CardTitle>
        <CardDescription>
          Select which business you'd like to provide feedback for
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {partners.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No partners available at the moment</p>
            <Button 
              onClick={() => onPartnerSelected({
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
          partners.map((partner) => (
            <Card
              key={partner.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedId === partner.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handlePartnerSelect(partner)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {partner.logo_url ? (
                        <img 
                          src={partner.logo_url} 
                          alt={`${partner.name} logo`}
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        <span>{getPartnerIcon(partner.name)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{partner.name}</h3>
                      {partner.description && (
                        <p className="text-sm text-muted-foreground">{partner.description}</p>
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

export default PartnerPicker;