import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PartnerLocationsProps {
  selectedPartner?: string;
  onPartnerSelect?: (partnerId: string | undefined) => void;
}

interface Partner {
  partner_id: string;
  name: string;
  slug: string;
  total_responses: number;
  happy_count: number;
  neutral_count: number;
  concerned_count: number;
  respondent_sessions: number;
  visits: number;
  copy_clicks: number;
  download_clicks: number;
  wallet_adds: number;
}

const PartnerLocations: React.FC<PartnerLocationsProps> = ({ selectedPartner, onPartnerSelect }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerData, setSelectedPartnerData] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', slug: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic location list from locations table
      const { data: basicPartners, error: basicError } = await supabase
        .from('locations')
        .select('id, name, slug, description, active, client_name')
        .eq('active', true)
        .order('name');
      
      if (basicError) throw basicError;
      
      // Convert to analytics format with zero metrics
      const fallbackPartners = (basicPartners || []).map(p => ({
        partner_id: p.id,
        name: p.name,
        slug: p.slug,
        total_responses: 0,
        happy_count: 0,
        neutral_count: 0,
        concerned_count: 0,
        respondent_sessions: 0,
        visits: 0,
        copy_clicks: 0,
        download_clicks: 0,
        wallet_adds: 0,
      }));
      
      setPartners(fallbackPartners);
      
      // Set selected partner data
      if (selectedPartner && fallbackPartners) {
        const selected = fallbackPartners.find(p => p.partner_id === selectedPartner);
        setSelectedPartnerData(selected || null);
      } else {
        setSelectedPartnerData(null);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
      toast.error('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    if (!newPartner.name.trim() || !newPartner.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    try {
      setIsCreating(true);
      const { error } = await supabase
        .from('locations')
        .insert({
          name: newPartner.name.trim(),
          slug: newPartner.slug.trim(),
          description: newPartner.description.trim() || null,
          active: true
        });

      if (error) throw error;

      toast.success('Partner created successfully');
      setIsDialogOpen(false);
      setNewPartner({ name: '', slug: '', description: '' });
      await fetchPartnerData();
    } catch (error: any) {
      console.error('Error creating partner:', error);
      toast.error(error.message || 'Failed to create partner');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivatePartner = async (partnerId: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${partnerName}? This will remove them and their coupons from the public site.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('locations')
        .update({ active: false })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Partner deactivated successfully');
      await fetchPartnerData();
    } catch (error: any) {
      console.error('Error deactivating partner:', error);
      toast.error(error.message || 'Failed to deactivate partner');
    }
  };


  const handlePartnerClick = (partnerId: string) => {
    if (onPartnerSelect) {
      onPartnerSelect(partnerId);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, [selectedPartner]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateTotalStats = () => {
    return partners.reduce((totals, partner) => ({
      total_responses: totals.total_responses + partner.total_responses,
      happy_count: totals.happy_count + partner.happy_count,
      neutral_count: totals.neutral_count + partner.neutral_count,
      concerned_count: totals.concerned_count + partner.concerned_count,
      respondent_sessions: totals.respondent_sessions + partner.respondent_sessions,
      visits: totals.visits + partner.visits,
      copy_clicks: totals.copy_clicks + partner.copy_clicks,
      download_clicks: totals.download_clicks + partner.download_clicks,
      wallet_adds: totals.wallet_adds + partner.wallet_adds,
    }), {
      total_responses: 0,
      happy_count: 0,
      neutral_count: 0,
      concerned_count: 0,
      respondent_sessions: 0,
      visits: 0,
      copy_clicks: 0,
      download_clicks: 0,
      wallet_adds: 0,
    });
  };

  const displayData = selectedPartnerData || calculateTotalStats();
  const displayName = selectedPartnerData?.name || "All Locations";

  const totalSentiment = displayData.happy_count + displayData.neutral_count + displayData.concerned_count;
  const happyPercent = totalSentiment > 0 ? ((displayData.happy_count / totalSentiment) * 100).toFixed(1) : "0";
  const neutralPercent = totalSentiment > 0 ? ((displayData.neutral_count / totalSentiment) * 100).toFixed(1) : "0";
  const concernedPercent = totalSentiment > 0 ? ((displayData.concerned_count / totalSentiment) * 100).toFixed(1) : "0";
  
  const conversionRate = displayData.visits > 0 ? ((displayData.total_responses / displayData.visits) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Partners</CardTitle>
              <CardDescription>
                Active business partners
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                  <DialogDescription>
                    Create a new business partner for the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Partner Name</Label>
                    <Input
                      id="name"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      placeholder="Enter partner name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={newPartner.slug}
                      onChange={(e) => setNewPartner({ ...newPartner, slug: e.target.value })}
                      placeholder="partner-slug"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      placeholder="Partner description"
                    />
                  </div>
                  <Button 
                    onClick={handleCreatePartner} 
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Create Partner'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>
              <div 
                className={`w-full text-left px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                  !selectedPartner ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                }`}
                onClick={() => onPartnerSelect?.(undefined)}
              >
                All Locations
              </div>
            </li>
            {partners.map((partner) => (
              <li key={partner.partner_id}>
                <div
                  className={`w-full text-left px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                    selectedPartner === partner.partner_id ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                  }`}
                  onClick={() => onPartnerSelect?.(partner.partner_id)}
                >
                  <div className="flex items-center justify-between">
                    <span>{partner.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {partner.total_responses}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeactivatePartner(partner.partner_id, partner.name);
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{displayName}</CardTitle>
          <CardDescription>
            Performance metrics and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Responses</div>
              <div className="text-2xl font-bold">{displayData.total_responses.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Page Visits</div>
              <div className="text-2xl font-bold">{displayData.visits.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Conversion Rate</div>
              <div className="text-2xl font-bold">{conversionRate}%</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Unique Sessions</div>
              <div className="text-2xl font-bold">{displayData.respondent_sessions.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Sentiment Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Happy</span>
                  <span className="text-sm font-medium">{happyPercent}% ({displayData.happy_count})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${happyPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Neutral</span>
                  <span className="text-sm font-medium">{neutralPercent}% ({displayData.neutral_count})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${neutralPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Concerned</span>
                  <span className="text-sm font-medium">{concernedPercent}% ({displayData.concerned_count})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${concernedPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Engagement Actions</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{displayData.copy_clicks}</div>
                <div className="text-sm text-purple-600">Copy Code</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{displayData.download_clicks}</div>
                <div className="text-sm text-orange-600">Downloads</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{displayData.wallet_adds}</div>
                <div className="text-sm text-blue-600">Wallet Adds</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerLocations;