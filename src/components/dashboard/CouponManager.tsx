
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  expires_at: string;
  active: boolean;
  image_url?: string;
  created_at: string;
  partner_id?: string;
}

interface Partner {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface CouponManagerProps {
  selectedPartner?: string;
}

const CouponManager: React.FC<CouponManagerProps> = ({ selectedPartner }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    discount: '',
    expires_at: '',
    active: true,
    image_url: '',
    partner_id: ''
  });

  const fetchCoupons = async () => {
    try {
      let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by partner if one is selected
      if (selectedPartner && selectedPartner !== 'all') {
        query = query.eq('partner_id', selectedPartner);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error(`Failed to load coupons: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch partners for dropdown
  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, active')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchPartners();
    
    // Set up real-time subscription for coupons
    const channel = supabase
      .channel('public:coupons')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        () => {
          fetchCoupons();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Re-fetch when partner filter changes
  useEffect(() => {
    fetchCoupons();
  }, [selectedPartner]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      code: '',
      discount: '',
      expires_at: '',
      active: true,
      image_url: '',
      partner_id: selectedPartner === 'all' ? '' : selectedPartner || ''
    });
    setEditingCoupon(null);
  };

  const handleAddCoupon = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: coupon.description,
      code: coupon.code,
      discount: coupon.discount,
      expires_at: coupon.expires_at.split('T')[0], // Format for date input
      active: coupon.active,
      image_url: coupon.image_url || '',
      partner_id: coupon.partner_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    try {
      const couponData = {
        ...formData,
        expires_at: new Date(formData.expires_at).toISOString()
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);

        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      // First check if user has admin role
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (roleError) {
        console.error('Error checking user role:', roleError);
        toast.error('Permission check failed');
        return;
      }

      const isAdmin = userRoles?.some(role => role.role === 'admin');
      if (!isAdmin) {
        toast.error('Admin access required to delete coupons');
        return;
      }

      // First delete related user_coupons records
      const { error: userCouponsError } = await supabase
        .from('user_coupons')
        .delete()
        .eq('coupon_id', id);

      if (userCouponsError) {
        console.error('Error deleting user coupons:', userCouponsError);
        throw userCouponsError;
      }

      // Then delete the coupon
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }
      
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error(`Failed to delete coupon: ${error.message || 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-toronto-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Coupon Management</CardTitle>
            <CardDescription>
              Create and manage promotional coupons for your customers
            </CardDescription>
          </div>
          <Button onClick={handleAddCoupon}>
            <Plus className="mr-2 h-4 w-4" /> Add Coupon
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {coupons.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons yet</h3>
                <p className="text-gray-500 mb-4">Create your first coupon to get started with promotional offers.</p>
                <Button onClick={handleAddCoupon}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Coupon
                </Button>
              </div>
            ) : (
              coupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{coupon.title}</h3>
                        <Badge variant={coupon.active ? "default" : "secondary"}>
                          {coupon.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{coupon.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Code:</span> {coupon.code}
                        </div>
                        <div>
                          <span className="font-medium">Discount:</span> {coupon.discount}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span> {formatDate(coupon.expires_at)}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(coupon.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCoupon(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update the coupon details below.' : 'Fill in the details to create a new coupon.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter coupon title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter coupon description"
              />
            </div>
            
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Enter coupon code"
              />
            </div>
            
            <div>
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="e.g., 20% off, $10 off"
              />
            </div>
            
            <div>
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="Enter image URL"
              />
            </div>
            
            <div>
              <Label htmlFor="partner_id">Partner (Optional)</Label>
              <Select
                value={formData.partner_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, partner_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Partner (Global)</SelectItem>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSaveCoupon}>
              <Save className="mr-2 h-4 w-4" /> 
              {editingCoupon ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CouponManager;
