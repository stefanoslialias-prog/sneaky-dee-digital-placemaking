import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  location_id: string | null;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface ApiKeyManagerProps {
  selectedPartner: string;
}

export default function ApiKeyManager({ selectedPartner }: ApiKeyManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, slug')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as Location[];
    },
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', selectedPartner],
    queryFn: async () => {
      let query = supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedPartner !== 'all') {
        query = query.eq('location_id', selectedPartner);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ApiKey[];
    },
  });

  // Generate API key
  const generateApiKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return 'dpw_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Hash API key
  const hashApiKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName,
          key_hash: keyHash,
          location_id: selectedLocation || null,
        });

      if (error) throw error;
      return apiKey;
    },
    onSuccess: (apiKey) => {
      setGeneratedKey(apiKey);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key Created',
        description: 'Copy the key now - it won\'t be shown again.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    },
  });

  // Toggle API key status
  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ active: !active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key Updated',
        description: 'API key status changed successfully',
      });
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      });
      return;
    }
    createKeyMutation.mutate();
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
      });
    }
  };

  const resetDialog = () => {
    setShowCreateDialog(false);
    setNewKeyName('');
    setSelectedLocation('');
    setGeneratedKey(null);
    setCopied(false);
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return 'All Locations';
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>
              Manage API keys for webhook integrations
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Key className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API keys created yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>{getLocationName(key.location_id)}</TableCell>
                  <TableCell>
                    {key.active ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(key.created_at), 'PPp')}</TableCell>
                  <TableCell>
                    {key.last_used_at
                      ? format(new Date(key.last_used_at), 'PPp')
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyMutation.mutate({ id: key.id, active: key.active })}
                    >
                      {key.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {generatedKey ? 'API Key Created' : 'Create New API Key'}
            </DialogTitle>
            <DialogDescription>
              {generatedKey
                ? 'Copy this key now - it will not be shown again'
                : 'Generate a new API key for webhook authentication'}
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm break-all">{generatedKey}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold mb-2">Usage:</p>
                <p>Include this key in the X-API-Key header of your webhook requests:</p>
                <code className="block bg-muted p-2 rounded mt-2 text-xs">
                  X-API-Key: {generatedKey}
                </code>
              </div>
              <Button onClick={resetDialog} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., UniFi Controller"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                className="w-full"
              >
                {createKeyMutation.isPending ? 'Creating...' : 'Generate API Key'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
