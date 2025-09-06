import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationCommentsProps {
  selectedPartner?: string;
}

interface CommentData {
  id: string;
  comment: string;
  created_at: string;
  session_id: string;
  answer: string;
  partner_id: string;
  question_text?: string;
  partner_name?: string;
}

const LocationComments: React.FC<LocationCommentsProps> = ({ selectedPartner }) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Build query to get comments with additional context
      let query = supabase
        .from('survey_responses')
        .select(`
          id,
          comment,
          created_at,
          session_id,
          answer,
          partner_id,
          survey_questions(text),
          partners(name)
        `)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false });

      if (selectedPartner) {
        query = query.eq('partner_id', selectedPartner);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to flatten the relationships
      const transformedComments = (data || []).map(item => ({
        id: item.id,
        comment: item.comment,
        created_at: item.created_at,
        session_id: item.session_id,
        answer: item.answer,
        partner_id: item.partner_id,
        question_text: (item as any).survey_questions?.text || 'Unknown Question',
        partner_name: (item as any).partners?.name || 'Unknown Partner'
      }));

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'happy':
        return <Badge className="bg-green-100 text-green-800">😊 Happy</Badge>;
      case 'neutral':
        return <Badge className="bg-blue-100 text-blue-800">😐 Neutral</Badge>;
      case 'concerned':
        return <Badge className="bg-red-100 text-red-800">😟 Concerned</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{sentiment}</Badge>;
    }
  };

  useEffect(() => {
    fetchComments();
  }, [selectedPartner]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('comment-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'survey_responses' }, 
        (payload) => {
          // Only refresh if the comment field was updated
          if (payload.new.comment && payload.new.comment !== payload.old?.comment) {
            fetchComments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPartner]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Location Comments
        </CardTitle>
        <CardDescription>
          User feedback and comments from survey responses
          {selectedPartner && ' • Filtered by selected partner'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments found</p>
            <p className="text-sm">User comments will appear here when they provide feedback</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getSentimentBadge(comment.answer)}
                    <Badge variant="outline">{comment.partner_name}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">
                    Question: {comment.question_text}
                  </p>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-gray-900">{comment.comment}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    Session: {comment.session_id.substring(0, 12)}...
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedComment(comment)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Comment Details</DialogTitle>
                        <DialogDescription>
                          Full context for this user feedback
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Partner</h4>
                          <p>{comment.partner_name}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Question Asked</h4>
                          <p className="text-sm bg-gray-50 p-3 rounded">
                            {comment.question_text}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Sentiment Response</h4>
                          {getSentimentBadge(comment.answer)}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">User Comment</h4>
                          <Textarea 
                            value={comment.comment} 
                            readOnly 
                            className="min-h-[120px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium mb-1">Date</h4>
                            <p>{new Date(comment.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Session ID</h4>
                            <p className="font-mono text-xs">{comment.session_id}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationComments;