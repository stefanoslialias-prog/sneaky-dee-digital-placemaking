import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, Download, Eye, Search, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeTextInput } from '@/utils/xssProtection';

interface EmailCollectionProps {
  selectedPartner?: string;
}

interface EmailData {
  id: string;
  email_address: string;
  device_id: string;
  status: string;
  sent_at: string;
  subject: string;
  email_content: string;
  retries: number;
}

const EmailCollection: React.FC<EmailCollectionProps> = ({ selectedPartner }) => {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0
  });
  
  // Mass email state
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      
      // Build query
      let query = supabase
        .from('user_emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('email_address', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEmails(data || []);

      // Calculate stats
      const stats = (data || []).reduce((acc, email) => {
        acc.total++;
        switch (email.status) {
          case 'pending':
            acc.pending++;
            break;
          case 'sent':
            acc.sent++;
            break;
          case 'failed':
            acc.failed++;
            break;
        }
        return acc;
      }, { total: 0, pending: 0, sent: 0, failed: 0 });

      setEmailStats(stats);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportEmails = () => {
    const csvHeaders = 'Email,Status,Date,Subject,Device ID\n';
    const csvData = emails.map(email => 
      `"${email.email_address}","${email.status}","${new Date(email.sent_at).toLocaleDateString()}","${email.subject}","${email.device_id}"`
    ).join('\n');
    
    const csvContent = csvHeaders + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-collection-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendMassEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error('Please fill in both subject and content');
      return;
    }

    // Get unique email addresses
    const uniqueEmails = [...new Set(emails.map(e => e.email_address))];
    
    if (uniqueEmails.length === 0) {
      toast.error('No email addresses found');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this email to ${uniqueEmails.length} recipient(s)?`
    );
    
    if (!confirmed) return;

    setIsSending(true);
    
    try {
      // Sanitize inputs
      const sanitizedSubject = sanitizeTextInput(emailSubject, 200);
      const sanitizedContent = sanitizeTextInput(emailContent, 5000);

      // Insert emails into user_emails table with pending status
      const emailRecords = uniqueEmails.map(email => ({
        email_address: email,
        subject: sanitizedSubject,
        email_content: sanitizedContent,
        status: 'pending',
        device_id: 'mass-email'
      }));

      const { error: insertError } = await supabase
        .from('user_emails')
        .insert(emailRecords);

      if (insertError) throw insertError;

      toast.success(`Mass email queued for ${uniqueEmails.length} recipient(s)`);
      
      // Reset form
      setEmailSubject('');
      setEmailContent('');
      setShowComposeDialog(false);
      
      // Refresh email list
      await fetchEmails();
    } catch (error) {
      console.error('Error sending mass email:', error);
      toast.error('Failed to queue mass email');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [searchTerm]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('email-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_emails' }, 
        () => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Emails</p>
                <p className="text-2xl font-bold">{emailStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2" />
              <div>
                <p className="text-sm font-medium leading-none">Pending</p>
                <p className="text-2xl font-bold">{emailStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              <div>
                <p className="text-sm font-medium leading-none">Sent</p>
                <p className="text-2xl font-bold">{emailStats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-red-500 rounded-full mr-2" />
              <div>
                <p className="text-sm font-medium leading-none">Failed</p>
                <p className="text-2xl font-bold">{emailStats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Collection</CardTitle>
              <CardDescription>
                Collected email addresses from opt-in prompts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Send Mass Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Compose Mass Email</DialogTitle>
                    <DialogDescription>
                      Send an email to all {[...new Set(emails.map(e => e.email_address))].length} collected email addresses
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Email subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Email Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Type your email message here..."
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="min-h-[300px]"
                        maxLength={5000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {emailContent.length}/5000 characters
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowComposeDialog(false)}
                        disabled={isSending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendMassEmail}
                        disabled={isSending || !emailSubject.trim() || !emailContent.trim()}
                      >
                        {isSending ? 'Sending...' : 'Send Email'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" onClick={handleExportEmails}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Email List */}
          <div className="space-y-2">
            {emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No emails found
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{email.email_address}</span>
                      {getStatusBadge(email.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(email.sent_at).toLocaleString()} • Device: {email.device_id.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {email.retries > 0 && (
                      <Badge variant="outline">
                        {email.retries} retries
                      </Badge>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEmail(email)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Email Details</DialogTitle>
                          <DialogDescription>
                            Email address: {email.email_address}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Subject</Label>
                            <Input value={email.subject} readOnly />
                          </div>
                          <div>
                            <Label>Status</Label>
                            <div className="mt-1">
                              {getStatusBadge(email.status)}
                            </div>
                          </div>
                          <div>
                            <Label>Date</Label>
                            <Input value={new Date(email.sent_at).toLocaleString()} readOnly />
                          </div>
                          <div>
                            <Label>Device ID</Label>
                            <Input value={email.device_id} readOnly />
                          </div>
                          <div>
                            <Label>Email Content</Label>
                            <Textarea 
                              value={email.email_content} 
                              readOnly 
                              className="min-h-[200px]"
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailCollection;